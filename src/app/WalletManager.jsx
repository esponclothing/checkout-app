"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Wallet, Plus, Minus, CheckCircle2, AlertCircle, Edit2, Save, X, History, FileText } from 'lucide-react';

export default function WalletManager() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  
  const [amount, setAmount] = useState('');
  const [transactionNote, setTransactionNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  // Customer Editing State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const customerQueryStr = `
    edges {
      node {
        id
        firstName
        lastName
        email
        phone
        metafield(namespace: "custom", key: "wallet_notes") {
          id
          value
        }
        defaultAddress {
          id
          address1
          city
          province
          zip
          country
        }
        storeCreditAccounts(first: 1) {
          edges {
            node {
              id
              balance { amount currencyCode }
              transactions(first: 50, reverse: true) {
                edges {
                  node {
                    __typename
                    ... on StoreCreditAccountCreditTransaction {
                      amount { amount currencyCode }
                      createdAt
                    }
                    ... on StoreCreditAccountDebitTransaction {
                      amount { amount currencyCode }
                      createdAt
                    }
                    ... on StoreCreditAccountDebitRevertTransaction {
                      amount { amount currencyCode }
                      createdAt
                    }
                    ... on StoreCreditAccountExpirationTransaction {
                      amount { amount currencyCode }
                      createdAt
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  const fetchInitialCustomers = async () => {
    setIsSearching(true);
    setStatusMessage({ type: '', text: '' });
    
    const query = `query { customers(first: 50, sortKey: UPDATED_AT, reverse: true) { ${customerQueryStr} } }`;

    try {
      const res = await axios.post('/api/admin/shopify-graphql', { query });
      const edges = res.data?.data?.customers?.edges || [];
      setCustomers(edges.map(e => e.node));
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: 'error', text: 'Failed to load initial customers.' });
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    fetchInitialCustomers();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      fetchInitialCustomers();
      return;
    }
    
    setIsSearching(true);
    setStatusMessage({ type: '', text: '' });
    
    const query = `query customerSearch($query: String!) { customers(first: 10, query: $query) { ${customerQueryStr} } }`;

    try {
      const res = await axios.post('/api/admin/shopify-graphql', { 
        query, 
        variables: { query: searchQuery } 
      });
      const edges = res.data?.data?.customers?.edges || [];
      setCustomers(edges.map(e => e.node));
      if (edges.length === 0) {
        setStatusMessage({ type: 'error', text: 'No customers found.' });
      }
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: 'error', text: 'Failed to search customers.' });
    } finally {
      setIsSearching(false);
    }
  };

  const handleAdjustBalance = async (action) => {
    if (!selectedCustomer || !amount || isNaN(amount) || parseFloat(amount) <= 0) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid amount.' });
      return;
    }

    const storeCreditAccountId = selectedCustomer.storeCreditAccounts?.edges[0]?.node?.id;
    const isCredit = action === 'credit';
    
    if (!isCredit && !storeCreditAccountId) {
      setStatusMessage({ type: 'error', text: 'Customer does not have a Store Credit Account to deduct from.' });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage({ type: '', text: '' });

    try {
      if (isCredit) {
        // Use dedicated wallet-credit endpoint which handles account creation for new customers
        const res = await axios.post('/api/admin/wallet-credit', {
          customerId: selectedCustomer.id,
          amount: parseFloat(amount).toFixed(2),
          note: transactionNote || 'Manual adjustment via Editor'
        });
        if (res.data?.error) {
          setStatusMessage({ type: 'error', text: res.data.error });
          setIsSubmitting(false);
          return;
        }
      } else {
        // Debit via standard graphql proxy
        const debitMutation = `
          mutation storeCreditAccountDebit($id: ID!, $debitInput: StoreCreditAccountDebitInput!) {
            storeCreditAccountDebit(id: $id, debitInput: $debitInput) {
              userErrors { field message }
            }
          }
        `;
        const res = await axios.post('/api/admin/shopify-graphql', {
          query: debitMutation,
          variables: {
            id: storeCreditAccountId,
            debitInput: { debitAmount: { amount: parseFloat(amount).toFixed(2), currencyCode: "INR" } }
          }
        });
        const userErrors = res.data?.data?.storeCreditAccountDebit?.userErrors;
        if (userErrors?.length > 0) {
          setStatusMessage({ type: 'error', text: userErrors[0].message });
          setIsSubmitting(false);
          return;
        }
      }

      // If we have a note, store it in Metafields
      let currentNotes = [];
      if (selectedCustomer.metafield?.value) {
        try { currentNotes = JSON.parse(selectedCustomer.metafield.value); } catch(e) {}
      }
      
      const newNoteEntry = {
        timestamp: new Date().toISOString(),
        type: isCredit ? 'credit' : 'debit',
        amount: parseFloat(amount).toFixed(2),
        note: transactionNote || 'Manual adjustment via Editor'
      };
      
      currentNotes.unshift(newNoteEntry); // prepend

      const mfMutation = `
        mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
          metafieldsSet(metafields: $metafields) {
            metafields { id value }
            userErrors { message }
          }
        }
      `;
      
      const mfVars = {
        metafields: [{
          ownerId: selectedCustomer.id,
          namespace: "custom",
          key: "wallet_notes",
          type: "json",
          value: JSON.stringify(currentNotes)
        }]
      };

      let newMfNode = selectedCustomer.metafield;
      try {
        const mfRes = await axios.post('/api/admin/shopify-graphql', { query: mfMutation, variables: mfVars });
        newMfNode = mfRes.data?.data?.metafieldsSet?.metafields?.[0] || newMfNode;
      } catch (e) {
        console.error("Metafield save error:", e);
      }

      setStatusMessage({ type: 'success', text: `Successfully ${isCredit ? 'added' : 'deducted'} ₹${amount}!` });
      setAmount('');
      setTransactionNote('');
      
      // Update local state by forcing a refresh to get the new transaction nodes
      await fetchInitialCustomers(); 
      // Re-select customer from new list
      setCustomers(prev => {
        const updated = prev.find(c => c.id === selectedCustomer.id);
        if (updated) setSelectedCustomer(updated);
        return prev;
      });

    } catch (err) {
      console.error(err);
      setStatusMessage({ type: 'error', text: 'API request failed.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditing = () => {
    setIsEditing(true);
    setEditForm({
      firstName: selectedCustomer.firstName || '',
      lastName: selectedCustomer.lastName || '',
      email: selectedCustomer.email || '',
      phone: selectedCustomer.phone || '',
      address1: selectedCustomer.defaultAddress?.address1 || '',
      city: selectedCustomer.defaultAddress?.city || '',
      province: selectedCustomer.defaultAddress?.province || '',
      zip: selectedCustomer.defaultAddress?.zip || '',
      country: selectedCustomer.defaultAddress?.country || 'India'
    });
  };

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    setStatusMessage({ type: '', text: '' });

    try {
      const fullMut = `mutation customerUpdate($input: CustomerInput!) { customerUpdate(input: $input) { userErrors { message } } }`;
      
      const addressesArray = [{
        address1: editForm.address1, city: editForm.city, province: editForm.province, zip: editForm.zip, country: editForm.country
      }];
      
      const hasAddr = selectedCustomer.defaultAddress?.id;
      if (hasAddr) addressesArray[0].id = hasAddr;

      const inputVars = { 
        id: selectedCustomer.id, 
        firstName: editForm.firstName, 
        lastName: editForm.lastName, 
        email: editForm.email, 
        phone: editForm.phone,
        addresses: addressesArray 
      };

      const fullRes = await axios.post('/api/admin/shopify-graphql', { 
        query: fullMut, 
        variables: { input: inputVars } 
      });

      if (fullRes.data?.data?.customerUpdate?.userErrors?.length > 0) {
        throw new Error(fullRes.data.data.customerUpdate.userErrors[0].message);
      }

      setStatusMessage({ type: 'success', text: 'Profile Updated!' });
      setIsEditing(false);
      
      handleSearch({ preventDefault: () => {} });

    } catch(err) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Helper to match notes with transactions
  const getTransactionsWithNotes = (customer) => {
    if (!customer) return [];
    
    let notes = [];
    if (customer.metafield?.value) {
      try { notes = JSON.parse(customer.metafield.value); } catch(e) {}
    }
    
    const transactions = customer.storeCreditAccounts?.edges?.[0]?.node?.transactions?.edges?.map(e => e.node) || [];
    
    // Attempt to pair transactions with notes based on approx timestamp and amount
    return transactions.map(tx => {
      const isCredit = tx.__typename === 'StoreCreditAccountCreditTransaction';
      const txAmount = Math.abs(parseFloat(tx.amount?.amount || 0));
      const txTime = new Date(tx.createdAt).getTime();
      
      let matchedNote = null;
      for (const note of notes) {
        const noteAmount = parseFloat(note.amount);
        const noteType = note.type;
        const noteTime = new Date(note.timestamp || note.date).getTime();
        
        // Match if amount is same, type matches, and happened within 2 minutes of each other
        if (noteAmount === txAmount && ((isCredit && noteType==='credit') || (!isCredit && noteType==='debit'))) {
          if (Math.abs(txTime - noteTime) < 120000) {
            matchedNote = note.note || note.reason;
            break;
          }
        }
      }
      
      return {
        ...tx,
        isCredit,
        displayAmount: tx.amount?.amount || '0.00',
        note: matchedNote || (isCredit ? 'Credit added' : 'Credit deducted')
      };
    });
  };

  return (
    <div className="bg-[#151D30] border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col h-[calc(100vh-140px)]">
      <div className="p-6 border-b border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0 bg-[#1E293B]">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Wallet className="w-6 h-6 text-yellow-500" />
            Wallet & Customer Manager
          </h2>
          <p className="text-sm text-slate-400 mt-1">Search customers (by phone/email), manage store credit, and edit profiles.</p>
        </div>
        
        <form onSubmit={handleSearch} className="flex items-center w-full md:w-auto relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search phone, email, or name..."
            className="w-full md:w-80 pl-10 pr-4 py-2 bg-[#0F172A] border border-slate-700 text-white rounded-xl focus:outline-none focus:border-yellow-500 transition-colors"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <button 
            type="submit" 
            disabled={isSearching}
            className="ml-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
          >
            {isSearching ? '...' : 'Search'}
          </button>
        </form>
      </div>

      <div className="flex-1 overflow-hidden p-6 flex flex-col md:flex-row gap-6">
        
        {/* Customer List */}
        <div className="w-full md:w-[40%] flex flex-col gap-3 h-full overflow-y-auto pr-2">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-2">Customers ({customers.length})</h3>
          {customers.length === 0 && !isSearching && (
            <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-8 flex flex-col items-center justify-center text-slate-500 text-center">
              <Search className="w-8 h-8 mb-3 opacity-50" />
              <p>No customers found.</p>
            </div>
          )}
          
          {customers.map(c => (
            <div 
              key={c.id}
              onClick={() => { setSelectedCustomer(c); setIsEditing(false); setStatusMessage({type:'', text:''}); setTransactionNote(''); setAmount(''); }}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedCustomer?.id === c.id ? 'bg-yellow-500/10 border-yellow-500/50' : 'bg-[#1E293B] border-slate-800 hover:border-slate-600'}`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-white text-base">{c.firstName} {c.lastName}</h4>
                  <p className="text-sm text-slate-400">{c.email || 'No email'} • {c.phone || 'No phone'}</p>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold text-slate-500 uppercase">Balance</div>
                  <div className="font-black text-lg text-yellow-500">
                    ₹{c.storeCreditAccounts?.edges[0]?.node?.balance?.amount || '0.00'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Adjust Balance & History Panel */}
        {selectedCustomer && (
          <div className="w-full md:w-[60%] flex flex-col gap-6 h-full overflow-y-auto pr-2 pb-6">
            
            {/* Wallet Panel */}
            <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-6">
              <h3 className="text-lg font-black text-white mb-6 border-b border-slate-800 pb-4 flex items-center gap-2"><Wallet className="w-5 h-5 text-yellow-500"/> Manage Wallet</h3>
              
              <div className="bg-[#0F172A] rounded-xl p-5 border border-slate-800 mb-6 flex flex-col items-center text-center">
                <p className="text-sm text-slate-400 font-medium mb-1">Current Balance</p>
                <h4 className="text-4xl font-black text-white">
                  ₹{selectedCustomer.storeCreditAccounts?.edges[0]?.node?.balance?.amount || '0.00'}
                </h4>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Adjust Amount (₹)</label>
                    <input
                      type="number"
                      min="1"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="e.g. 500"
                      className="w-full px-4 py-3 bg-[#0F172A] border border-slate-700 text-white rounded-xl focus:outline-none focus:border-yellow-500 transition-colors text-lg font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Internal Note (Optional)</label>
                    <input
                      type="text"
                      value={transactionNote}
                      onChange={(e) => setTransactionNote(e.target.value)}
                      placeholder="Reason for adjustment..."
                      className="w-full px-4 py-3 bg-[#0F172A] border border-slate-700 text-white rounded-xl focus:outline-none focus:border-yellow-500 transition-colors text-sm"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => handleAdjustBalance('credit')}
                    disabled={isSubmitting}
                    className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" /> Add Credit
                  </button>
                  <button
                    onClick={() => handleAdjustBalance('debit')}
                    disabled={isSubmitting}
                    className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2"
                  >
                    <Minus className="w-5 h-5" /> Deduct
                  </button>
                </div>
              </div>
            </div>

            {/* Transaction History Panel */}
            <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-6">
              <h3 className="text-lg font-black text-white mb-6 border-b border-slate-800 pb-4 flex items-center gap-2"><History className="w-5 h-5 text-yellow-500"/> Adjustment History</h3>
              
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {getTransactionsWithNotes(selectedCustomer).length === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-4">No transaction history found.</p>
                ) : (
                  getTransactionsWithNotes(selectedCustomer).map((tx, idx) => (
                    <div key={idx} className="bg-[#0F172A] border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${tx.isCredit ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                            {tx.isCredit ? 'Credit' : 'Debit'}
                          </span>
                          <span className="text-xs text-slate-500">{new Date(tx.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-sm text-slate-300 mt-1 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-slate-500"/> {tx.note}</p>
                      </div>
                      <div className={`font-black ${tx.isCredit ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {tx.isCredit ? '+' : '-'}₹{Math.abs(parseFloat(tx.displayAmount)).toFixed(2)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Profile Edit Panel */}
            <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
                <h3 className="text-lg font-black text-white">Customer Profile</h3>
                {!isEditing ? (
                  <button onClick={startEditing} className="text-yellow-500 hover:text-yellow-400 flex items-center gap-1 text-sm font-bold"><Edit2 className="w-4 h-4"/> Edit</button>
                ) : (
                  <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-white flex items-center gap-1 text-sm font-bold"><X className="w-4 h-4"/> Cancel</button>
                )}
              </div>

              {!isEditing ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-slate-500">First Name</span>
                      <span className="text-sm text-white font-medium">{selectedCustomer.firstName || '-'}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-slate-500">Last Name</span>
                      <span className="text-sm text-white font-medium">{selectedCustomer.lastName || '-'}</span>
                    </div>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-500">Email</span>
                    <span className="text-sm text-white font-medium">{selectedCustomer.email || '-'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-500">Phone</span>
                    <span className="text-sm text-white font-medium">{selectedCustomer.phone || '-'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-500">Default Address</span>
                    <span className="text-sm text-white font-medium block">{selectedCustomer.defaultAddress?.address1 || '-'}</span>
                    <span className="text-sm text-white font-medium block">{selectedCustomer.defaultAddress?.city || ''} {selectedCustomer.defaultAddress?.province || ''} {selectedCustomer.defaultAddress?.zip || ''}</span>
                    <span className="text-sm text-slate-400 font-medium block">{selectedCustomer.defaultAddress?.country || ''}</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <input type="text" value={editForm.firstName} onChange={e=>setEditForm({...editForm, firstName:e.target.value})} placeholder="First Name" className="w-full px-3 py-2 bg-[#0F172A] border border-slate-700 text-white rounded-lg text-sm" />
                    <input type="text" value={editForm.lastName} onChange={e=>setEditForm({...editForm, lastName:e.target.value})} placeholder="Last Name" className="w-full px-3 py-2 bg-[#0F172A] border border-slate-700 text-white rounded-lg text-sm" />
                  </div>
                  <input type="email" value={editForm.email} onChange={e=>setEditForm({...editForm, email:e.target.value})} placeholder="Email" className="w-full px-3 py-2 bg-[#0F172A] border border-slate-700 text-white rounded-lg text-sm" />
                  <input type="text" value={editForm.phone} onChange={e=>setEditForm({...editForm, phone:e.target.value})} placeholder="Phone (+91...)" className="w-full px-3 py-2 bg-[#0F172A] border border-slate-700 text-white rounded-lg text-sm" />
                  <input type="text" value={editForm.address1} onChange={e=>setEditForm({...editForm, address1:e.target.value})} placeholder="Address Line 1" className="w-full px-3 py-2 bg-[#0F172A] border border-slate-700 text-white rounded-lg text-sm" />
                  <div className="grid grid-cols-2 gap-4">
                    <input type="text" value={editForm.city} onChange={e=>setEditForm({...editForm, city:e.target.value})} placeholder="City" className="w-full px-3 py-2 bg-[#0F172A] border border-slate-700 text-white rounded-lg text-sm" />
                    <input type="text" value={editForm.province} onChange={e=>setEditForm({...editForm, province:e.target.value})} placeholder="State" className="w-full px-3 py-2 bg-[#0F172A] border border-slate-700 text-white rounded-lg text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <input type="text" value={editForm.zip} onChange={e=>setEditForm({...editForm, zip:e.target.value})} placeholder="ZIP/PIN" className="w-full px-3 py-2 bg-[#0F172A] border border-slate-700 text-white rounded-lg text-sm" />
                    <input type="text" value={editForm.country} onChange={e=>setEditForm({...editForm, country:e.target.value})} placeholder="Country" className="w-full px-3 py-2 bg-[#0F172A] border border-slate-700 text-white rounded-lg text-sm" />
                  </div>
                  
                  <button onClick={handleSaveProfile} disabled={isSavingProfile} className="w-full py-2 mt-2 bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold rounded-lg flex items-center justify-center gap-2">
                    {isSavingProfile ? 'Saving...' : <><Save className="w-4 h-4"/> Save Profile</>}
                  </button>
                </div>
              )}
            </div>

            {statusMessage.text && (
              <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-semibold ${statusMessage.type === 'error' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                {statusMessage.type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 shrink-0" />}
                {statusMessage.text}
              </div>
            )}
            
          </div>
        )}
      </div>
    </div>
  );
}
