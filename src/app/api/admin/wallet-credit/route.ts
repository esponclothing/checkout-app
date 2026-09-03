import { supabaseFetch } from '../../../../lib/supabaseFetch';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session');
    
    if (!session?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { customerId, amount, note } = await req.json();
    if (!customerId || !amount || parseFloat(amount) <= 0) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const merchantId = session.value;
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

    const res = await supabaseFetch(`${supabaseUrl}/rest/v1/saas_merchants?id=eq.${merchantId}&select=shopify_access_token,shopify_store_url`, {
      headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
    });

    if (!res.ok) throw new Error('Failed to fetch merchant details');

    const merchants = await res.json();
    if (!merchants || merchants.length === 0) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    const { shopify_access_token, shopify_store_url } = merchants[0];
    let cleanStore = shopify_store_url.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const graphqlUrl = `https://${cleanStore}/admin/api/2024-04/graphql.json`;
    const shopifyHeaders = {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': shopify_access_token
    };

    // Step 1: Fetch existing store credit account for this customer
    const customerIdClean = customerId.replace('gid://shopify/Customer/', '');
    const customerGid = customerId.startsWith('gid://') ? customerId : `gid://shopify/Customer/${customerId}`;

    const fetchQuery = `query {
      customer(id: "${customerGid}") {
        storeCreditAccounts(first: 1) {
          edges { node { id balance { amount } } }
        }
      }
    }`;

    const fetchRes = await fetch(graphqlUrl, {
      method: 'POST',
      headers: shopifyHeaders,
      body: JSON.stringify({ query: fetchQuery })
    });
    const fetchData = await fetchRes.json();
    let storeCreditAccountId = fetchData.data?.customer?.storeCreditAccounts?.edges?.[0]?.node?.id;

    // Step 2: If no store credit account, create one via REST API
    if (!storeCreditAccountId) {
      const createRes = await fetch(`https://${cleanStore}/admin/api/2024-04/customers/${customerIdClean}/store_credit_accounts.json`, {
        method: 'POST',
        headers: shopifyHeaders,
        body: JSON.stringify({ store_credit_account: {} })
      });

      if (createRes.ok) {
        const createData = await createRes.json();
        if (createData.store_credit_account?.id) {
          storeCreditAccountId = `gid://shopify/StoreCreditAccount/${createData.store_credit_account.id}`;
        }
      } else {
        // Alternative: try fetching via REST
        const listRes = await fetch(`https://${cleanStore}/admin/api/2024-04/customers/${customerIdClean}/store_credit_accounts.json`, {
          headers: shopifyHeaders
        });
        if (listRes.ok) {
          const listData = await listRes.json();
          if (listData.store_credit_accounts?.[0]?.id) {
            storeCreditAccountId = `gid://shopify/StoreCreditAccount/${listData.store_credit_accounts[0].id}`;
          }
        }
      }
    }

    if (!storeCreditAccountId) {
      return NextResponse.json({ error: 'Could not find or create store credit account for this customer' }, { status: 400 });
    }

    // Step 3: Credit the store credit account using GraphQL
    const creditMutation = `mutation storeCreditAccountCredit($id: ID!, $creditInput: StoreCreditAccountCreditInput!) {
      storeCreditAccountCredit(id: $id, creditInput: $creditInput) {
        storeCreditAccountTransaction { account { balance { amount currencyCode } } }
        userErrors { field message }
      }
    }`;

    const creditRes = await fetch(graphqlUrl, {
      method: 'POST',
      headers: shopifyHeaders,
      body: JSON.stringify({
        query: creditMutation,
        variables: {
          id: storeCreditAccountId,
          creditInput: { creditAmount: { amount: parseFloat(amount).toFixed(2), currencyCode: 'INR' } }
        }
      })
    });

    const creditData = await creditRes.json();
    const userErrors = creditData.data?.storeCreditAccountCredit?.userErrors;
    
    if (userErrors && userErrors.length > 0) {
      return NextResponse.json({ error: userErrors[0].message }, { status: 400 });
    }

    const newBalance = creditData.data?.storeCreditAccountCredit?.storeCreditAccountTransaction?.account?.balance?.amount;

    return NextResponse.json({ 
      success: true, 
      newBalance,
      storeCreditAccountId,
      creditData: creditData.data
    });

  } catch (error: any) {
    console.error('Wallet Credit Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
