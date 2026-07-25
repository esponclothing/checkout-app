# Store Setup Guide for Custom Checkout App

This guide explains how to integrate a new Shopify Store with this custom Checkout App and Network Database.

## 1. Shopify Webhooks

To ensure that the network database (`network_users` and `network_addresses`) stays in sync, and to ensure Partial COD orders are calculated correctly, you **must** register the following Webhooks in the Shopify Admin of every new store.

### Where to add webhooks in Shopify
1. Go to **Settings > Notifications**.
2. Scroll down to the **Webhooks** section.
3. Click **Create webhook**.

### Webhook 1: Order Creation (Required for Partial COD)
- **Event**: `Order creation` (`orders/create`)
- **Format**: `JSON`
- **URL**: `https://checkout-app-one-lilac.vercel.app/api/webhooks/shopify-orders`
- **Webhook API version**: `2024-01` (or latest)
- *Why we need this:* This webhook intercepts new orders and appends the "Remaining COD Balance" as a custom line item for any order that was placed using Partial COD (Advance Payment).

### Webhook 2: Customer Creation (Required for Network Sync)
- **Event**: `Customer creation` (`customers/create`)
- **Format**: `JSON`
- **URL**: `https://checkout-app-one-lilac.vercel.app/api/webhooks/shopify-customers`
- **Webhook API version**: `2024-01` (or latest)
- *Why we need this:* This webhook automatically syncs any newly registered Shopify customer into the central Supabase `network_users` database, allowing them to login to other network stores seamlessly via OTP.

### Webhook 3: Customer Update (Required for Network Sync)
- **Event**: `Customer update` (`customers/update`)
- **Format**: `JSON`
- **URL**: `https://checkout-app-one-lilac.vercel.app/api/webhooks/shopify-customers`
- **Webhook API version**: `2024-01` (or latest)
- *Why we need this:* Keeps customer profiles and addresses updated in the central network database whenever they update their profile on a specific Shopify store.

---

## 2. Setting Up the Checkout UI on a Shopify Theme

To implement the custom checkout on your storefront:

1. Copy the `whatsapp-otp-modal.liquid` and `tinkal-x-esponsports-checkout.liquid` snippet files to your Shopify theme's `snippets` directory.
2. In your theme's `cart.liquid` (or `main-cart.liquid`), render the snippet right after your checkout button:
   ```liquid
   {% render 'tinkal-x-esponsports-checkout' %}
   ```
3. Update the `MERCHANT_KEY` constant inside `tinkal-x-esponsports-checkout.liquid` to match the `api_key` for this specific store in the Supabase `saas_merchants` table.

## 3. Configure the Merchant in the Admin Panel

1. Log in to the Super Admin Panel at `https://checkout-app-one-lilac.vercel.app/admin/super`.
2. Ensure the merchant record is created with the correct `shopify_store_url` and `shopify_access_token`.
3. Configure the `payment_settings` JSON with the Cashfree API keys and Store Credit Wallet rules.

---

## Recent Updates & Fixes (Changelog)

- **Store Credit UI Overhaul**: The Wallet feature now visually matches the standard payment options (like Prepaid and COD) as a toggleable card.
- **Partial COD Fix**: Fixed a bug where partial COD payments were being marked as `payment_pending=true` when completing draft orders, causing Shopify to incorrectly show them as fully unpaid despite a successful Cashfree payment. Shopify will now automatically calculate the Partial COD balance using the `orders/create` webhook.
- **Customer Linking Bug Fix**: Fixed a bug where returning network customers were inheriting older names (like "11fit") on new stores. The backend now forcefully updates the customer's Shopify profile name to match the shipping address submitted during checkout.
- **Cart Auto-Refresh**: The cart state is now automatically refreshed (via page reload) when closing the "Order Placed Successfully" modal, preventing stale items from appearing in the cart drawer.
