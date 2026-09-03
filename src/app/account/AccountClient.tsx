"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Package, User, MapPin, ShieldCheck, LogOut,
  ExternalLink, ArrowRight, CheckCircle2, Clock, Truck, Wallet,
  Sparkles, RefreshCw, AlertCircle, Edit2, ShoppingBag,
  ArrowLeft, Plus, RotateCcw, MessageCircle, Download, CheckCircle,
  Circle, History, TrendingUp, ArrowLeftRight, Camera, X, ChevronRight, Tag, Check
} from 'lucide-react';

interface Props {
  initialMerchantKey: string;
  initialStoreUrl: string;
  initialPhone: string;
  mode?: string;
}

interface OrderItem {
  id: number;
  variant_id?: number | null;
  product_id?: number | null;
  title: string;
  variant_title: string;
  quantity: number;
  price: string;
  image_url?: string | null;
}

interface Order {
  id: number;
  order_number: string;
  created_at: string;
  financial_status: string;
  fulfillment_status: string;
  total_price: string;
  amount_paid?: string;
  cod_amount?: string;
  payment_method_label?: string;
  currency: string;
  order_status_url?: string | null;
  tracking_url?: string | null;
  tracking_number?: string | null;
  tracking_company?: string | null;
  line_items: OrderItem[];
  shipping_address?: any;
  note?: string;
}

interface ReturnRequest {
  id: string;
  created_at: string;
  order_name: string;
  product_title: string;
  variant_title?: string;
  image_url?: string;
  request_type: 'return' | 'exchange';
  reason: string;
  reason_detail?: string;
  exchange_size?: string;
  status: string;
  admin_note?: string;
  return_tracking_number?: string;
  return_tracking_company?: string;
  return_tracking_url?: string;
  exchange_tracking_number?: string;
  exchange_tracking_company?: string;
  exchange_tracking_url?: string;
  refund_method?: string;
  approved_at?: string;
  rejected_at?: string;
  completed_at?: string;
}

export default function AccountClient({ initialMerchantKey, initialStoreUrl, initialPhone, mode }: Props) {
  const isModal = mode === 'modal';
  const [merchantKey, setMerchantKey] = useState(initialMerchantKey || 'default_merchant_key');
  const [phoneInput, setPhoneInput] = useState(initialPhone || '');
  const [otpInput, setOtpInput] = useState('');
  const [notifyOffers, setNotifyOffers] = useState(true);
  const [step, setStep] = useState<'phone' | 'otp' | 'dashboard'>('phone');
  
  // Auth state
  const [verifiedPhone, setVerifiedPhone] = useState('');
  const [signature, setSignature] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  
  // Dashboard data state
  const [activeTab, setActiveTab] = useState<'orders' | 'profile' | 'addresses' | 'wallet' | 'returns'>('orders');
  const [storeName, setStoreName] = useState('Store');
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Return & Exchange state
  const [myReturns, setMyReturns] = useState<ReturnRequest[]>([]);
  const [returnsLoading, setReturnsLoading] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnModalOrder, setReturnModalOrder] = useState<Order | null>(null);
  const [returnModalItem, setReturnModalItem] = useState<OrderItem | null>(null);
  const [selectedReturnItems, setSelectedReturnItems] = useState<OrderItem[]>([]);
  const [returnStep, setReturnStep] = useState<1 | 2 | 3>(1);
  const [returnType, setReturnType] = useState<'return' | 'exchange'>('return');
  const [returnReason, setReturnReason] = useState('');
  const [returnDetail, setReturnDetail] = useState('');
  const [exchangeSize, setExchangeSize] = useState('');
  const [exchangeSizes, setExchangeSizes] = useState<Record<number, string>>({});
  const [returnPhoto, setReturnPhoto] = useState<string | null>(null);
  const [returnPhotoName, setReturnPhotoName] = useState('');
  const [returnSubmitting, setReturnSubmitting] = useState(false);
  const [returnSuccess, setReturnSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<any>({ first_name: '', last_name: '', email: '' });
  const [addresses, setAddresses] = useState<any[]>([]);
  const [storeCreditBalance, setStoreCreditBalance] = useState<number>(0);
  const [profileLoading, setProfileLoading] = useState(false);
  
  // Edit profile state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Address edit state
  const [editingAddress, setEditingAddress] = useState<any | null>(null);
  const [addrForm, setAddrForm] = useState({
    first_name: '',
    last_name: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    pincode: '',
    phone: ''
  });
  const [savingAddress, setSavingAddress] = useState(false);
  const [buyAgainLoading, setBuyAgainLoading] = useState(false);
  const [buyAgainOrderId, setBuyAgainOrderId] = useState<number | null>(null);

  // Check localStorage for persisted session
  useEffect(() => {
    const savedPhone = localStorage.getItem('kwikpass_user_phone') || 
                       localStorage.getItem('fit11_verified_phone') || 
                       localStorage.getItem('wa_saved_phone') || 
                       initialPhone;
    const savedKey = localStorage.getItem('kwikpass_merchant_key') || initialMerchantKey;
    if (savedPhone) {
      setVerifiedPhone(savedPhone);
      setMerchantKey(savedKey);
      setStep('dashboard');
      localStorage.setItem('kwikpass_user_phone', savedPhone);
      localStorage.setItem('fit11_verified_phone', savedPhone);
      try {
        window.parent.postMessage({ type: 'KWIKPASS_LOGIN_SUCCESS', phone: savedPhone }, '*');
      } catch (e) {}
    }
  }, [initialMerchantKey, initialPhone]);

  const loadDashboardData = useCallback(async (phone: string, key: string) => {
    setOrdersLoading(true);
    setProfileLoading(true);
    try {
      const ordRes = await fetch('/api/customer/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, merchant_key: key })
      });
      const ordData = await ordRes.json();
      if (ordData.success) {
        setOrders(ordData.orders || []);
        if (ordData.store_name) setStoreName(ordData.store_name);
      }

      const profRes = await fetch('/api/customer/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, merchant_key: key })
      });
      const profData = await profRes.json();
      if (profData.success) {
        setProfile(profData.profile || { first_name: '', last_name: '', email: '' });
        setEditFirstName(profData.profile?.first_name || '');
        setEditLastName(profData.profile?.last_name || '');
        setEditEmail(profData.profile?.email || '');
        setAddresses(profData.addresses || []);
        setStoreCreditBalance(profData.storeCreditBalance || 0);
        if (profData.store_name) setStoreName(profData.store_name);
      }

      // Load return requests
      try {
        const cleanDigits = phone.replace(/\D/g, '');
        const last10 = cleanDigits.slice(-10);
        const retRes = await fetch(`https://shopify-price-editor.vercel.app/api/returns?phone=${encodeURIComponent('+91' + last10)}`);
        const retData = await retRes.json();
        if (retData.success) setMyReturns(retData.requests || []);
      } catch (_) {}
    } catch (e) {
      console.error('Failed to load dashboard data:', e);
    } finally {
      setOrdersLoading(false);
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    if (step === 'dashboard' && verifiedPhone) {
      loadDashboardData(verifiedPhone, merchantKey);
    }
  }, [step, verifiedPhone, merchantKey, loadDashboardData]);

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAuthError('');
    const cleanPhone = phoneInput.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setAuthError('Please enter a valid 10-digit mobile number');
      return;
    }
    setAuthLoading(true);
    try {
      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleanPhone.length === 10 ? `+91${cleanPhone}` : `+${cleanPhone}`,
          merchant_key: merchantKey
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
      setSignature(data.signature || '');
      setStep('otp');
    } catch (err: any) {
      setAuthError(err.message || 'Error sending OTP');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifyOtp = async (code?: string) => {
    const otpToVerify = code || otpInput;
    if (otpToVerify.length < 4) return;
    setAuthError('');
    setAuthLoading(true);
    try {
      const cleanPhone = phoneInput.replace(/\D/g, '');
      const formatted = cleanPhone.length === 10 ? `+91${cleanPhone}` : `+${cleanPhone}`;
      const res = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: formatted,
          otp: otpToVerify,
          signature,
          merchant_key: merchantKey
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid OTP');

      setVerifiedPhone(formatted);
      localStorage.setItem('kwikpass_user_phone', formatted);
      localStorage.setItem('fit11_verified_phone', formatted);
      localStorage.setItem('kwikpass_merchant_key', merchantKey);
      setStep('dashboard');
      try {
        window.parent.postMessage({ type: 'KWIKPASS_LOGIN_SUCCESS', phone: formatted }, '*');
      } catch (e) {}
    } catch (err: any) {
      setAuthError(err.message || 'Verification failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('kwikpass_user_phone');
    localStorage.removeItem('fit11_verified_phone');
    localStorage.removeItem('kwikpass_merchant_key');
    setVerifiedPhone('');
    setPhoneInput('');
    setOtpInput('');
    setOrders([]);
    setStep('phone');
    try {
      window.parent.postMessage({ type: 'KWIKPASS_LOGOUT' }, '*');
    } catch (e) {}
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await fetch('/api/customer/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: verifiedPhone,
          merchant_key: merchantKey,
          first_name: editFirstName,
          last_name: editLastName,
          email: editEmail
        })
      });
      const data = await res.json();
      if (data.success) {
        setProfile({ ...profile, first_name: editFirstName, last_name: editLastName, email: editEmail });
        setIsEditingProfile(false);
      }
    } catch (e) {
      console.error('Error saving profile:', e);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleEditAddressClick = (addr: any) => {
    setEditingAddress(addr);
    setAddrForm({
      first_name: addr?.first_name || profile?.first_name || '',
      last_name: addr?.last_name || profile?.last_name || '',
      address1: addr?.address1 || '',
      address2: addr?.address2 || '',
      city: addr?.city || '',
      state: addr?.state || addr?.province || '',
      pincode: addr?.pincode || addr?.zip || '',
      phone: addr?.phone || verifiedPhone || ''
    });
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAddress(true);
    try {
      const action = editingAddress?.id ? 'EDIT' : 'ADD';
      const payload: any = {
        merchant_key: merchantKey,
        phone: verifiedPhone,
        action,
        address_data: {
          ...addrForm
        }
      };
      if (editingAddress?.id) {
        payload.address_data.id = editingAddress.id;
      }
      const res = await fetch('/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        await loadDashboardData(verifiedPhone, merchantKey);
        setEditingAddress(null);
      } else {
        alert(data.error || 'Failed to save address');
      }
    } catch (err) {
      console.error('Error saving address:', err);
    } finally {
      setSavingAddress(false);
    }
  };

  // --- RETURN & EXCHANGE SUBMIT ---
  const handleSubmitReturnRequest = async () => {
    const itemsToSubmit = selectedReturnItems.length > 0 ? selectedReturnItems : (returnModalItem ? [returnModalItem] : []);
    if (!returnModalOrder || itemsToSubmit.length === 0 || !returnReason) return;
    if (returnType === 'exchange') {
      const missingSize = itemsToSubmit.some(i => !exchangeSizes[i.id] && !exchangeSize);
      if (missingSize) {
        alert('Please select an exchange size for all selected items.');
        return;
      }
    }
    if (!returnPhoto) { alert('Please upload a photo of the product before submitting.'); return; }
    setReturnSubmitting(true);
    try {
      const cleanDigits = verifiedPhone.replace(/\D/g, '');
      const last10 = cleanDigits.slice(-10);
      const createdRequests: any[] = [];
      for (const item of itemsToSubmit) {
        const payload = {
          phone: `+91${last10}`,
          customer_name: profile.first_name ? `${profile.first_name} ${profile.last_name}` : undefined,
          email: profile.email || undefined,
          order_id: String(returnModalOrder.id),
          order_name: returnModalOrder.order_number,
          order_date: returnModalOrder.created_at,
          line_item_id: String(item.id),
          product_title: item.title,
          variant_title: item.variant_title || undefined,
          quantity: item.quantity,
          item_price: parseFloat(item.price),
          image_url: item.image_url || undefined,
          request_type: returnType,
          reason: returnReason,
          reason_detail: returnDetail || undefined,
          exchange_size: returnType === 'exchange' ? (exchangeSizes[item.id] || exchangeSize || undefined) : undefined,
          photo_url: returnPhoto,
          merchant_key: merchantKey,
          store: initialStoreUrl
        };
        const res = await fetch('https://shopify-price-editor.vercel.app/api/returns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success && data.request) {
          createdRequests.push(data.request);
        } else if (!data.success) {
          alert(data.error || `Failed to submit request for ${item.title}.`);
          setReturnSubmitting(false);
          return;
        }
      }
      if (createdRequests.length > 0) {
        setReturnSuccess(true);
        setMyReturns(prev => [...createdRequests, ...prev]);
        setTimeout(() => {
          setShowReturnModal(false);
          setReturnSuccess(false);
          setReturnStep(1);
          setReturnReason('');
          setReturnDetail('');
          setExchangeSize('');
          setExchangeSizes({});
          setReturnPhoto(null);
          setReturnPhotoName('');
          setReturnType('return');
          setActiveTab('returns');
        }, 2000);
      }
    } catch (e) {
      alert('Network error. Please try again.');
    } finally {
      setReturnSubmitting(false);
    }
  };

  const openReturnModal = (order: Order, item?: OrderItem) => {
    setReturnModalOrder(order);
    const initialItems = item ? [item] : (order.line_items.length > 0 ? [order.line_items[0]] : []);
    setSelectedReturnItems(initialItems);
    setReturnModalItem(initialItems[0] || null);
    setReturnStep(1);
    setReturnType('return');
    setReturnReason('');
    setReturnDetail('');
    setExchangeSize('');
    setExchangeSizes({});
    setReturnPhoto(null);
    setReturnPhotoName('');
    setReturnSuccess(false);
    setShowReturnModal(true);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('Photo must be less than 5MB'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setReturnPhoto(ev.target?.result as string);
      setReturnPhotoName(file.name);
    };
    reader.readAsDataURL(file);
  };

  // --- BUY AGAIN: postMessage parent Shopify theme → add to cart → custom checkout ---
  const handleBuyAgain = async (order: Order) => {
    setBuyAgainLoading(true);
    setBuyAgainOrderId(order.id);
    try {
      const itemsWithVariant = order.line_items
        .filter(item => item.variant_id)
        .map(item => ({ id: item.variant_id, quantity: item.quantity }));

      if (itemsWithVariant.length > 0) {
        // Send to parent Shopify theme which will add to cart + redirect to checkout
        try {
          window.parent.postMessage({
            type: 'SWIFT_REORDER',
            items: itemsWithVariant
          }, '*');
        } catch (e) {
          // If no parent (standalone page), use direct cart permalink as fallback
          const rawStore = (initialStoreUrl || '').trim().replace(/\/+$/, '');
          const storeBase = rawStore.startsWith('http') ? rawStore : `https://${rawStore}`;
          const cartPath = `/cart/${itemsWithVariant.map(i => `${i.id}:${i.quantity}`).join(',')}`;
          window.open(`${storeBase}${cartPath}`, '_top');
        }
      }
    } finally {
      setBuyAgainLoading(false);
      setBuyAgainOrderId(null);
    }
  };

  // --- GENERATE PRINTABLE INVOICE (opens print dialog → Save as PDF) ---
  const handleDownloadInvoice = (order: Order) => {
    const customerName = order.shipping_address
      ? (order.shipping_address.name || `${order.shipping_address.first_name || ''} ${order.shipping_address.last_name || ''}`.trim())
      : (profile.first_name ? `${profile.first_name} ${profile.last_name}` : verifiedPhone);
    const address = order.shipping_address
      ? [order.shipping_address.address1, order.shipping_address.address2, order.shipping_address.city, order.shipping_address.province, order.shipping_address.zip].filter(Boolean).join(', ')
      : '';
    const itemRows = order.line_items.map(item =>
      `<tr><td style="padding:8px 6px;border-bottom:1px solid #f1f5f9">${item.title}${item.variant_title ? `<br><span style="color:#64748b;font-size:11px">${item.variant_title}</span>` : ''}</td><td style="padding:8px 6px;border-bottom:1px solid #f1f5f9;text-align:center">${item.quantity}</td><td style="padding:8px 6px;border-bottom:1px solid #f1f5f9;text-align:right">₹${parseFloat(item.price).toFixed(2)}</td><td style="padding:8px 6px;border-bottom:1px solid #f1f5f9;text-align:right">₹${(parseFloat(item.price) * item.quantity).toFixed(2)}</td></tr>`
    ).join('');
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Invoice ${order.order_number} - ${storeName}</title><style>@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#1e293b;margin:0;padding:32px;max-width:720px;margin:auto}h1{color:#143424;margin:0;font-size:22px}table{width:100%;border-collapse:collapse;font-size:13px;margin-top:8px}th{background:#f8fafc;padding:10px 6px;text-align:left;font-weight:700;font-size:11px;text-transform:uppercase;color:#64748b;letter-spacing:.06em;border-bottom:2px solid #e2e8f0}.total{font-weight:700;font-size:14px}.label{color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px}.section{margin-bottom:24px}.header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:20px;border-bottom:3px solid #143424;margin-bottom:24px}.badge{display:inline-block;padding:4px 10px;border-radius:20px;font-weight:700;font-size:12px}</style></head><body><div class="header"><div><h1>TAX INVOICE</h1><p style="color:#64748b;margin:6px 0 0;font-size:13px;font-weight:600">${storeName}</p></div><div style="text-align:right"><p style="font-weight:800;font-size:20px;margin:0;color:#143424">${order.order_number}</p><p class="label" style="margin:6px 0 0">Date: ${new Date(order.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p></div></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-bottom:28px"><div><p class="label">Bill To</p><p style="font-weight:700;margin:4px 0;font-size:14px">${customerName}</p><p style="color:#64748b;font-size:12px;line-height:1.7;margin:4px 0">${address}</p><p style="color:#64748b;font-size:12px;margin:4px 0">${verifiedPhone}</p></div><div style="text-align:right"><p class="label">Payment Method</p><p style="font-weight:700;color:${order.financial_status === 'paid' ? '#16a34a' : '#d97706'};margin:4px 0;font-size:13px">${order.payment_method_label || order.financial_status.toUpperCase()}</p></div></div><table><thead><tr><th>Item Description</th><th style="text-align:center">Qty</th><th style="text-align:right">Unit Price</th><th style="text-align:right">Total</th></tr></thead><tbody>${itemRows}</tbody><tfoot><tr><td colspan="3" style="padding:14px 6px 4px;text-align:right;font-weight:600;color:#64748b">Order Total:</td><td style="padding:14px 6px 4px;text-align:right" class="total">₹${parseFloat(order.total_price).toFixed(2)}</td></tr>${order.amount_paid && parseFloat(order.amount_paid) > 0 ? `<tr><td colspan="3" style="padding:3px 6px;text-align:right;color:#16a34a;font-weight:600">Paid Online:</td><td style="padding:3px 6px;text-align:right;color:#16a34a;font-weight:700">₹${parseFloat(order.amount_paid).toFixed(2)}</td></tr>` : ''}${order.cod_amount && parseFloat(order.cod_amount) > 0 ? `<tr><td colspan="3" style="padding:3px 6px;text-align:right;color:#d97706;font-weight:600">COD Due on Delivery:</td><td style="padding:3px 6px;text-align:right;color:#d97706;font-weight:800">₹${parseFloat(order.cod_amount).toFixed(2)}</td></tr>` : ''}</tfoot></table><div style="margin-top:48px;padding-top:16px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center"><p style="color:#94a3b8;font-size:11px;margin:0">Computer-generated document — no signature required.</p><p style="color:#94a3b8;font-size:11px;margin:0">Thank you for shopping with ${storeName}!</p></div><script>window.onload=function(){window.print();}<\/script></body></html>`;
    const w = window.open('', '_blank', 'width=800,height=900');
    if (w) {
      w.document.write(html);
      w.document.close();
    }
  };

  // --- BADGE DISPLAY HELPERS ---
  const getFulfillmentDisplay = (status?: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'fulfilled' || s === 'delivered') return { label: 'DELIVERED', color: 'bg-emerald-50 text-emerald-700 border border-emerald-200' };
    if (s === 'in_transit' || s === 'out_for_delivery') return { label: 'IN TRANSIT', color: 'bg-violet-50 text-violet-700 border border-violet-200' };
    if (s === 'unfulfilled') return { label: 'PROCESSING', color: 'bg-amber-50 text-amber-700 border border-amber-200' };
    if (s === 'partial') return { label: 'PARTIALLY DELIVERED', color: 'bg-blue-50 text-blue-700 border border-blue-200' };
    if (s === 'restocked' || s === 'cancelled') return { label: 'CANCELLED', color: 'bg-rose-50 text-rose-700 border border-rose-200' };
    return { label: (status || 'PROCESSING').toUpperCase(), color: 'bg-slate-100 text-slate-700 border border-slate-200' };
  };

  const getPaymentDisplay = (order: Order) => {
    const s = (order.financial_status || '').toLowerCase();
    if (s === 'voided' || s === 'refunded') return { label: s.toUpperCase(), color: 'bg-rose-50 text-rose-600 border border-rose-200' };
    if (s === 'paid' || s === 'authorized') return { label: 'PREPAID', color: 'bg-emerald-50 text-emerald-600 border border-emerald-200' };
    if (s === 'pending' || s === 'unpaid') return { label: 'COD', color: 'bg-yellow-50 text-yellow-700 border border-yellow-200' };
    if (s === 'partially_paid' || s === 'partially_refunded') return { label: 'PARTIAL COD', color: 'bg-blue-50 text-blue-600 border border-blue-200' };
    return { label: (order.payment_method_label || s).toUpperCase(), color: 'bg-slate-100 text-slate-700 border border-slate-200' };
  };

  // --- ORDER TIMELINE HELPER ---
  const getOrderTimeline = (order: Order) => {
    const status = (order.fulfillment_status || '').toLowerCase();
    const fin = (order.financial_status || '').toLowerCase();
    const isVoided = fin === 'voided' || fin === 'refunded';
    const steps = [
      { key: 'placed', label: 'Order Placed', sublabel: new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), icon: CheckCircle2 },
      { key: 'confirmed', label: 'Confirmed', sublabel: fin === 'paid' || fin === 'partially_paid' || fin === 'pending' ? 'Payment Verified' : 'Processing', icon: ShieldCheck },
      { key: 'shipped', label: 'Shipped', sublabel: order.tracking_number ? `#${order.tracking_number}` : 'In Transit', icon: Truck },
      { key: 'delivered', label: 'Delivered', sublabel: 'Order Complete', icon: CheckCircle }
    ];
    let activeStep = 0;
    if (isVoided) { activeStep = -1; }
    else if (status === 'delivered' || status === 'fulfilled') { activeStep = 3; }
    else if (status === 'out_for_delivery' || status === 'in_transit') { activeStep = 2; }
    else if (status === 'partial' || fin === 'paid' || fin === 'partially_paid' || fin === 'pending') { activeStep = 1; }
    else { activeStep = 0; }
    return { steps, activeStep };
  };

  // --- LIGHT MODAL LOGIN UI (Matching Kwikpass Screenshot #2) ---
  if (isModal && (step === 'phone' || step === 'otp')) {
    return (
      <div className="w-full h-full min-h-[380px] bg-white flex flex-col justify-between p-6 text-slate-900">
        <div>
          <h2 className="text-xl font-bold text-slate-900 text-center mb-1">
            {step === 'phone' ? 'Unlock Exclusive Deals Now!' : 'Enter Verification Code'}
          </h2>
          <p className="text-xs text-slate-500 text-center mb-6">
            {step === 'phone'
              ? 'Enter your mobile number to view orders and access your account'
              : `We sent a 4-digit code via WhatsApp to ${phoneInput}`}
          </p>

          {authError && (
            <div className="mb-4 p-2.5 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {step === 'phone' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="relative flex items-center border border-slate-300 rounded-xl overflow-hidden focus-within:border-emerald-600 focus-within:ring-1 focus-within:ring-emerald-600 transition">
                <div className="bg-slate-50 px-3 py-3 text-slate-700 text-sm font-semibold border-r border-slate-300 flex items-center gap-1.5 shrink-0">
                  <span>🇮🇳</span>
                  <span>+91</span>
                </div>
                <input
                  type="tel"
                  required
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="Enter Mobile Number"
                  className="w-full px-4 py-3 text-sm text-slate-900 font-medium focus:outline-none"
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyOffers}
                  onChange={(e) => setNotifyOffers(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span>Notify me with offers & updates</span>
              </label>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-[#143424] hover:bg-[#0f281b] text-white font-bold py-3.5 rounded-xl transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
              >
                {authLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Sending Code...</span>
                  </>
                ) : (
                  <span>Submit</span>
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  maxLength={4}
                  autoFocus
                  value={otpInput}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setOtpInput(val);
                    if (val.length === 4) handleVerifyOtp(val);
                  }}
                  placeholder="••••"
                  className="w-full border border-slate-300 rounded-xl px-4 py-3.5 text-center text-2xl font-bold tracking-[0.4em] text-slate-900 focus:outline-none focus:border-emerald-600 transition"
                />
              </div>

              <button
                onClick={() => handleVerifyOtp()}
                disabled={authLoading || otpInput.length < 4}
                className="w-full bg-[#143424] hover:bg-[#0f281b] text-white font-bold py-3.5 rounded-xl transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
              >
                {authLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <span>Verify & Continue</span>
                )}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setStep('phone');
                    setOtpInput('');
                    setAuthError('');
                  }}
                  className="text-xs text-slate-500 hover:text-slate-900 transition inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Use a different mobile number</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-slate-100 text-center text-[11px] text-slate-400">
          I accept that I have read & understood your Privacy Policy and T&Cs.
        </div>
      </div>
    );
  }

  // --- DARK SLATE LOGIN UI (Standard Page Mode) ---
  if (!isModal && (step === 'phone' || step === 'otp')) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="max-w-md w-full bg-slate-900/90 border border-slate-800/80 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-red-500 flex items-center justify-center shadow-lg shadow-red-500/20">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-center text-white mb-1">
            {step === 'phone' ? 'Login with OTP' : 'Enter Verification Code'}
          </h1>
          <p className="text-sm text-slate-400 text-center mb-8">
            {step === 'phone' 
              ? `Enter your mobile number to view orders and profile for ${storeName}` 
              : `We sent a 4-digit verification code via WhatsApp to ${phoneInput}`}
          </p>

          {authError && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {step === 'phone' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Mobile Number
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-4 text-slate-400 text-sm font-semibold border-r border-slate-800 pr-3 flex items-center gap-1.5">
                    <span>IN</span>
                    <span>+91</span>
                  </div>
                  <input
                    type="tel"
                    required
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="9876543210"
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-24 pr-4 py-3.5 text-white font-medium focus:outline-none focus:border-red-500 transition shadow-inner"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-red-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {authLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Sending Code...</span>
                  </>
                ) : (
                  <>
                    <span>Get Verification Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  4-Digit Code
                </label>
                <input
                  type="text"
                  maxLength={4}
                  autoFocus
                  value={otpInput}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setOtpInput(val);
                    if (val.length === 4) handleVerifyOtp(val);
                  }}
                  placeholder="••••"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-4 text-center text-2xl font-bold tracking-[0.5em] text-white focus:outline-none focus:border-red-500 transition shadow-inner"
                />
              </div>

              <button
                onClick={() => handleVerifyOtp()}
                disabled={authLoading || otpInput.length < 4}
                className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-red-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {authLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <span>Verify & Continue</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setStep('phone');
                    setOtpInput('');
                    setAuthError('');
                  }}
                  className="text-xs text-slate-400 hover:text-white transition inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Use a different mobile number</span>
                </button>
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-slate-800/80 flex items-center justify-center gap-2 text-xs text-slate-500">
            <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
            <span>Powered by Swift Network Account</span>
          </div>
        </div>
      </div>
    );
  }

  // --- DASHBOARD UI (Responsive for Modal & Page) ---
  return (
    <div className={`min-h-screen ${isModal ? 'bg-white text-slate-900' : 'bg-slate-950 text-slate-200'}`}>
      <header className={`border-b sticky top-0 z-30 ${
        isModal ? 'bg-white/90 border-slate-200' : 'border-slate-800/80 bg-slate-900/60 backdrop-blur-lg'
      }`}>
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 flex flex-wrap items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
              isModal ? 'bg-slate-900 text-white' : 'bg-gradient-to-br from-red-600 to-red-500 text-white shadow-md'
            }`}>
              <User className="w-4 h-4" />
            </div>
            <div>
              <h1 className={`font-bold text-sm leading-tight ${isModal ? 'text-slate-900' : 'text-white'}`}>
                {profile.first_name || profile.last_name ? `${profile.first_name} ${profile.last_name}` : storeName}
              </h1>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>{verifiedPhone}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold ${
              isModal
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
            }`}>
              <Wallet className="w-3.5 h-3.5 shrink-0" />
              <span>₹{storeCreditBalance.toFixed(2)} Credit</span>
            </div>

            <button
              onClick={handleLogout}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition text-xs font-semibold ${
                isModal
                  ? 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 sm:mr-10 mr-7'
                  : 'bg-slate-800/50 hover:bg-red-500/20 text-slate-400 hover:text-red-400'
              }`}
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-3 sm:px-4 flex items-center gap-4 sm:gap-6 text-xs font-medium overflow-x-auto no-scrollbar [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-2.5 border-b-2 transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'orders'
                ? isModal
                  ? 'border-slate-900 text-slate-900 font-bold'
                  : 'border-red-500 text-white font-semibold'
                : isModal
                  ? 'border-transparent text-slate-500 hover:text-slate-800'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>My Orders</span>
            {orders.length > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                isModal ? 'bg-slate-100 text-slate-700' : 'bg-slate-800 text-slate-300'
              }`}>
                {orders.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('wallet')}
            className={`py-2.5 border-b-2 transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'wallet'
                ? isModal
                  ? 'border-slate-900 text-slate-900 font-bold'
                  : 'border-red-500 text-white font-semibold'
                : isModal
                  ? 'border-transparent text-slate-500 hover:text-slate-800'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Wallet</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`py-2.5 border-b-2 transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'profile'
                ? isModal
                  ? 'border-slate-900 text-slate-900 font-bold'
                  : 'border-red-500 text-white font-semibold'
                : isModal
                  ? 'border-transparent text-slate-500 hover:text-slate-800'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile</span>
          </button>

          <button
            onClick={() => setActiveTab('returns')}
            className={`py-2.5 border-b-2 transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'returns'
                ? isModal
                  ? 'border-rose-600 text-rose-700 font-bold'
                  : 'border-rose-500 text-white font-semibold'
                : isModal
                  ? 'border-transparent text-slate-500 hover:text-slate-800'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>My Returns</span>
            {myReturns.filter(r => r.status === 'pending' || r.status === 'approved').length > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${isModal ? 'bg-rose-100 text-rose-700' : 'bg-rose-500/20 text-rose-400'}`}>
                {myReturns.filter(r => r.status === 'pending' || r.status === 'approved').length}
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {ordersLoading ? (
              <div className="py-16 text-center">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
                <p className="text-slate-500 text-xs">Loading your store orders...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className={`rounded-2xl p-8 text-center max-w-lg mx-auto my-4 border ${
                isModal ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800/80'
              }`}>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 ${
                  isModal ? 'bg-slate-200 text-slate-500' : 'bg-slate-800/80 text-slate-400'
                }`}>
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <h3 className={`text-sm font-bold mb-1 ${isModal ? 'text-slate-900' : 'text-white'}`}>
                  No Orders Found
                </h3>
                <p className="text-xs text-slate-500">
                  No orders found linked to <strong>{verifiedPhone}</strong> on {storeName}.
                </p>
              </div>
            ) : selectedOrder ? (
              <div className="space-y-4">
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition"
                  >
                    <span>← Back to My Orders</span>
                  </button>

                  <div className={`border rounded-xl p-5 shadow-sm ${isModal ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                    {/* Order Top Summary */}
                    <div className="pb-4 border-b border-slate-100 mb-4">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={`text-lg font-extrabold ${isModal ? 'text-slate-900' : 'text-white'}`}>
                          {selectedOrder.order_number}
                        </span>
                        {(() => {
                          const pay = getPaymentDisplay(selectedOrder);
                          const ful = getFulfillmentDisplay(selectedOrder.fulfillment_status);
                          return (
                            <>
                              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${pay.color}`}>
                                {pay.label}
                              </span>
                              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${ful.color}`}>
                                {ful.label}
                              </span>
                            </>
                          );
                        })()}
                      </div>
                      <p className="text-xs text-slate-400">
                        Placed on {new Date(selectedOrder.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>

                    {/* Order Status Timeline */}
                    {(() => {
                      const { steps, activeStep } = getOrderTimeline(selectedOrder);
                      const isVoided = selectedOrder.financial_status === 'voided' || selectedOrder.financial_status === 'refunded';
                      return (
                        <div className="mb-6 pb-4 border-b border-slate-100">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Order Status</h4>
                          {isVoided ? (
                            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
                              <span className="text-red-600 text-xs font-bold uppercase">{selectedOrder.financial_status === 'refunded' ? '🔄 Refunded' : '❌ Cancelled / Voided'}</span>
                            </div>
                          ) : (
                            <div className="flex items-start">
                              {steps.map((step, idx) => {
                                const isDone = idx <= activeStep;
                                const isActive = idx === activeStep;
                                const StepIcon = step.icon;
                                return (
                                  <div key={step.key} className="flex-1 flex flex-col items-center relative">
                                    {/* connector line */}
                                    {idx < steps.length - 1 && (
                                      <div className={`absolute top-3.5 left-1/2 w-full h-0.5 ${
                                        idx < activeStep ? 'bg-emerald-500' : 'bg-slate-200'
                                      }`} style={{ left: '50%', width: '100%', zIndex: 0 }} />
                                    )}
                                    {/* icon circle */}
                                    <div className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${
                                      isDone
                                        ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-200'
                                        : 'bg-white border-slate-200 text-slate-300'
                                    } ${isActive ? 'ring-2 ring-emerald-300 ring-offset-1' : ''}`}>
                                      <StepIcon className="w-3.5 h-3.5" />
                                    </div>
                                    {/* label */}
                                    <p className={`text-[10px] font-bold mt-1.5 text-center leading-tight ${
                                      isDone ? 'text-emerald-700' : 'text-slate-400'
                                    }`}>{step.label}</p>
                                    {isActive && (
                                      <p className="text-[9px] text-slate-400 text-center mt-0.5 leading-tight">{step.sublabel}</p>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Items List */}
                    <div className="mb-6">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                        Items in this Order ({selectedOrder.line_items.length})
                      </h4>
                      {(() => {
                        const isDelivered = ['fulfilled','delivered'].includes((selectedOrder.fulfillment_status || '').toLowerCase());
                        const deliveredAt = new Date(selectedOrder.created_at);
                        const windowEnd = new Date(deliveredAt.getTime() + 7 * 24 * 60 * 60 * 1000);
                        const canReturn = isDelivered && new Date() <= windowEnd && selectedOrder.financial_status !== 'voided' && selectedOrder.financial_status !== 'refunded';
                        const daysLeft = canReturn ? Math.max(0, Math.ceil((windowEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0;
                        return (
                          <>
                            {canReturn && (
                              <div className="mb-3 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 shrink-0" />
                                Return/exchange window open — {daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining
                              </div>
                            )}
                            <div className="divide-y divide-slate-100">
                              {selectedOrder.line_items.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-4 py-3">
                                  {item.image_url ? (
                                    <img src={item.image_url} alt={item.title} className="w-14 h-14 rounded-xl object-cover bg-slate-100 shrink-0 border border-slate-200" />
                                  ) : (
                                    <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 text-slate-400 border border-slate-200">
                                      <Package className="w-6 h-6" />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-bold ${isModal ? 'text-slate-900' : 'text-white'}`}>
                                      {item.title}
                                    </p>
                                    {item.variant_title && (
                                      <p className="text-xs text-slate-500 mt-0.5">{item.variant_title}</p>
                                    )}
                                    <p className="text-xs font-semibold text-slate-400 mt-1">Quantity: {item.quantity}</p>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <p className={`text-sm font-extrabold ${isModal ? 'text-slate-900' : 'text-white'}`}>
                                      {selectedOrder.currency || '₹'} {parseFloat(item.price).toFixed(2)}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                            {canReturn && (
                              <div className="mt-4 pt-3 border-t border-slate-100">
                                <button
                                  onClick={() => openReturnModal(selectedOrder)}
                                  className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold rounded-xl shadow-sm transition flex items-center justify-center gap-2"
                                >
                                  <RotateCcw className="w-4 h-4" />
                                  <span>Request Return / Exchange</span>
                                </button>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>


                    {/* Shipping & Payment Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                      <div className="bg-slate-50 rounded-xl p-3.5">
                        <h5 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Delivery Details</span>
                        </h5>
                        <p className="text-xs font-semibold text-slate-800">
                          {selectedOrder.shipping_address?.name ||
                            (selectedOrder.shipping_address?.first_name
                              ? `${selectedOrder.shipping_address.first_name} ${selectedOrder.shipping_address.last_name || ''}`
                              : profile.first_name || profile.last_name
                              ? `${profile.first_name} ${profile.last_name}`
                              : `${selectedOrder.order_number} Customer`)}
                        </p>
                        {selectedOrder.shipping_address ? (
                          <div className="text-xs text-slate-600 mt-1 leading-relaxed space-y-0.5">
                            {selectedOrder.shipping_address.address1 && <p>{selectedOrder.shipping_address.address1}</p>}
                            {selectedOrder.shipping_address.address2 && <p>{selectedOrder.shipping_address.address2}</p>}
                            <p>
                              {[selectedOrder.shipping_address.city, selectedOrder.shipping_address.province, selectedOrder.shipping_address.zip]
                                .filter(Boolean)
                                .join(', ')}
                            </p>
                            {selectedOrder.shipping_address.phone && (
                              <p className="text-slate-500 pt-0.5 font-medium">📞 {selectedOrder.shipping_address.phone}</p>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                            Delivery linked to verified phone ({verifiedPhone})
                          </p>
                        )}
                      </div>
                      <div className="bg-slate-50 rounded-xl p-3.5 flex flex-col justify-between">
                        <div>
                          <h5 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Payment Status</span>
                          </h5>
                          <p className="text-xs font-bold text-slate-800 uppercase">
                            {selectedOrder.payment_method_label || (selectedOrder.financial_status === 'paid' ? 'Online / Prepaid (Verified)' : selectedOrder.financial_status === 'pending' ? 'Cash on Delivery (COD)' : 'Partial COD (Advance Paid)')}
                          </p>
                          <div className="mt-2 pt-2 border-t border-slate-200 text-xs space-y-1">
                            <div className="flex justify-between text-slate-600">
                              <span>Order Total:</span>
                              <span className="font-semibold text-slate-900">₹{parseFloat(selectedOrder.total_price).toFixed(2)}</span>
                            </div>
                            {selectedOrder.amount_paid && parseFloat(selectedOrder.amount_paid) > 0 && (
                              <div className="flex justify-between text-emerald-700">
                                <span>Paid Online:</span>
                                <span className="font-bold">₹{parseFloat(selectedOrder.amount_paid).toFixed(2)}</span>
                              </div>
                            )}
                            {selectedOrder.cod_amount && parseFloat(selectedOrder.cod_amount) > 0 && (
                              <div className="flex justify-between text-amber-700 font-bold">
                                <span>COD Due on Delivery:</span>
                                <span>₹{parseFloat(selectedOrder.cod_amount).toFixed(2)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        {(() => {
                          const statusLower = (selectedOrder.fulfillment_status || '').toLowerCase();
                          const isOrderFulfilled =
                            (statusLower === 'fulfilled' || statusLower === 'partial' || statusLower === 'in_transit' || statusLower === 'out_for_delivery' || statusLower === 'delivered') &&
                            selectedOrder.financial_status !== 'voided' &&
                            selectedOrder.financial_status !== 'refunded';

                          if (!isOrderFulfilled) return null;

                          if (selectedOrder.tracking_url) {
                            return (
                              <a
                                href={selectedOrder.tracking_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-3 inline-flex items-center justify-center gap-1.5 w-full py-2 bg-[#143424] hover:bg-[#1b4430] text-white text-xs font-bold rounded-lg transition"
                              >
                                <span>
                                  Track Order
                                  {selectedOrder.tracking_number ? ` (#${selectedOrder.tracking_number})` : ''}
                                </span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            );
                          }

                          if (selectedOrder.tracking_number) {
                            return (
                              <div className="mt-3 py-2 px-3 bg-slate-100 rounded-lg text-slate-700 text-xs font-semibold text-center">
                                Tracking #: {selectedOrder.tracking_number}
                              </div>
                            );
                          }

                          return null;
                        })()}
                      </div>
                    </div>
                    {/* Action Buttons: WhatsApp Help, Download Invoice, Buy Again */}
                    <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2">
                      {/* WhatsApp icon-only button */}
                      <a
                        href={`https://wa.me/917494961428?text=${encodeURIComponent(`Hi! I need help with my order ${selectedOrder.order_number}. Can you assist me?`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Get help on WhatsApp"
                        className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-[#25D366] hover:bg-[#20b858] text-white transition shrink-0"
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4.5 h-4.5" style={{width:'18px',height:'18px'}}><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      </a>
                      {/* Download Invoice */}
                      <button
                        onClick={() => handleDownloadInvoice(selectedOrder)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Invoice</span>
                      </button>
                      {/* Buy Again → adds to cart */}
                      <button
                        onClick={() => handleBuyAgain(selectedOrder)}
                        disabled={buyAgainLoading && buyAgainOrderId === selectedOrder.id}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-[#143424] hover:bg-[#1b4430] text-white text-xs font-bold rounded-lg transition disabled:opacity-60"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>{buyAgainLoading && buyAgainOrderId === selectedOrder.id ? 'Adding to Cart...' : 'Buy Again'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map((order) => {
                    const isPaid = order.financial_status === 'paid' || order.financial_status === 'partially_paid';
                    const isDelivered = order.fulfillment_status === 'fulfilled' || order.fulfillment_status === 'delivered';
                    const firstItem = order.line_items[0];
                    const remainingCount = order.line_items.length - 1;

                    return (
                      <div
                        key={order.id}
                        onClick={() => setSelectedOrder(order)}
                        className={`border rounded-xl p-4 transition shadow-sm cursor-pointer ${
                          isModal
                            ? 'bg-white border-slate-200 hover:border-emerald-600 hover:shadow-md'
                            : 'bg-slate-900/70 border-slate-800/80 hover:border-slate-700'
                        }`}
                      >
                        <div className="pb-3 border-b border-slate-100 mb-3">
                          {/* Row 1: Order Number + Date on Left, Price on Right -> NEVER WRAPS */}
                          <div className="flex items-center justify-between w-full mb-2">
                            <div className="flex items-center gap-2">
                              <span className={`font-bold text-sm ${isModal ? 'text-slate-900' : 'text-white'}`}>
                                {order.order_number}
                              </span>
                              <span className="text-slate-300">•</span>
                              <span className="text-xs text-slate-400 font-medium">
                                {new Date(order.created_at).toLocaleDateString('en-IN', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </span>
                            </div>
                            <p className={`text-sm font-extrabold shrink-0 ${isModal ? 'text-slate-900' : 'text-white'}`}>
                              {order.currency || '₹'} {parseFloat(order.total_price).toFixed(2)}
                            </p>
                          </div>

                          {/* Row 2: Compact Badges on Left, View Details on Right */}
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {(() => {
                                const pay = getPaymentDisplay(order);
                                const ful = getFulfillmentDisplay(order.fulfillment_status);
                                return (
                                  <>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${pay.color}`}>
                                      {pay.label}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${ful.color}`}>
                                      {ful.label}
                                    </span>
                                  </>
                                );
                              })()}
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-[11px] font-bold text-emerald-600 flex items-center justify-end gap-0.5">
                                <span>View Details</span>
                                <ArrowRight className="w-3 h-3" />
                              </p>
                            </div>
                          </div>
                        </div>

                        {firstItem && (
                          <div className="flex items-center gap-3">
                            {firstItem.image_url ? (
                              <img
                                src={firstItem.image_url}
                                alt={firstItem.title}
                                className="w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0 border border-slate-200"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 text-slate-400">
                                <Package className="w-4 h-4" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-bold truncate ${isModal ? 'text-slate-900' : 'text-white'}`}>
                                {firstItem.title}
                              </p>
                              <p className="text-[11px] text-slate-400">
                                {firstItem.variant_title ? `${firstItem.variant_title} • ` : ''}Qty: {firstItem.quantity}
                              </p>
                            </div>
                            {remainingCount > 0 && (
                              <span className="px-2 py-1 bg-slate-100 text-slate-600 font-bold text-[11px] rounded-lg shrink-0">
                                +{remainingCount} more
                              </span>
                            )}
                          </div>
                        )}
                        {/* Buy Again button on order card */}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleBuyAgain(order); }}
                          disabled={buyAgainLoading && buyAgainOrderId === order.id}
                          className="mt-2.5 w-full inline-flex items-center justify-center gap-1.5 py-1.5 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-700 hover:text-emerald-700 text-[11px] font-semibold rounded-lg transition"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>{buyAgainLoading && buyAgainOrderId === order.id ? 'Adding to Cart...' : 'Buy Again'}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
        )}

        {/* ── MY RETURNS TAB ───────────────────────────────────────────── */}
        {activeTab === 'returns' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className={`text-base font-extrabold ${isModal ? 'text-slate-900' : 'text-white'}`}>My Returns & Exchanges</h2>
                <p className="text-xs text-slate-400 mt-0.5">Track your return and exchange requests</p>
              </div>
              <button onClick={() => loadDashboardData(verifiedPhone, merchantKey)}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition px-2 py-1.5 rounded-lg hover:bg-slate-800">
                <RefreshCw className="w-3.5 h-3.5" />Refresh
              </button>
            </div>

            {myReturns.length === 0 ? (
              <div className={`rounded-2xl p-10 text-center border ${isModal ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800/80'}`}>
                <RotateCcw className={`w-10 h-10 mx-auto mb-3 ${isModal ? 'text-slate-400' : 'text-slate-600'}`} />
                <h3 className={`text-sm font-bold mb-1 ${isModal ? 'text-slate-700' : 'text-white'}`}>No Requests Yet</h3>
                <p className="text-xs text-slate-400">You haven't made any return or exchange requests. Open a delivered order to request one.</p>
                <button onClick={() => setActiveTab('orders')}
                  className="mt-4 px-4 py-2 bg-[#143424] text-white text-xs font-bold rounded-xl hover:bg-[#1b4430] transition">
                  View My Orders
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {myReturns.map(req => {
                  const statusColors: Record<string, string> = {
                    pending: isModal ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                    approved: isModal ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                    rejected: isModal ? 'bg-red-50 text-red-700 border-red-200' : 'bg-red-500/10 text-red-400 border-red-500/20',
                    pickup_scheduled: isModal ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                    in_transit: isModal ? 'bg-violet-50 text-violet-700 border-violet-200' : 'bg-violet-500/10 text-violet-400 border-violet-500/20',
                    received: isModal ? 'bg-cyan-50 text-cyan-700 border-cyan-200' : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
                    completed: isModal ? 'bg-green-50 text-green-700 border-green-200' : 'bg-green-500/10 text-green-400 border-green-500/20',
                    cancelled: isModal ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-slate-800 text-slate-400 border-slate-700',
                  };
                  const statusLabels: Record<string, string> = {
                    pending: '🟡 Pending Review', approved: '✅ Approved', rejected: '❌ Rejected',
                    pickup_scheduled: '📦 Pickup Scheduled', in_transit: '🚚 In Transit',
                    received: '📬 Package Received', completed: '🎉 Completed', cancelled: 'Cancelled',
                  };
                  const sc = statusColors[req.status] || statusColors.pending;
                  const sl = statusLabels[req.status] || req.status;
                  return (
                    <div key={req.id} className={`border rounded-xl p-4 space-y-3 ${isModal ? 'bg-white border-slate-200' : 'bg-slate-900/70 border-slate-800'}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${req.request_type === 'exchange' ? (isModal ? 'bg-indigo-50 text-indigo-600 border border-indigo-200' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20') : (isModal ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-rose-500/10 text-rose-400 border-rose-500/20')}`}>
                              {req.request_type === 'exchange' ? <ArrowLeftRight className="w-3 h-3" /> : <RotateCcw className="w-3 h-3" />}
                              {req.request_type.toUpperCase()}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${sc}`}>{sl}</span>
                          </div>
                          <p className={`text-sm font-bold ${isModal ? 'text-slate-900' : 'text-white'}`}>{req.product_title}</p>
                          {req.variant_title && <p className="text-xs text-slate-400">{req.variant_title}</p>}
                          <p className="text-[11px] text-slate-400 mt-0.5">Order {req.order_name} · {new Date(req.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                        </div>
                        {req.image_url && <img src={req.image_url} alt={req.product_title} className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0" />}
                      </div>

                      {/* Status-specific info */}
                      {req.status === 'rejected' && req.admin_note && (
                        <div className={`p-2.5 rounded-lg text-xs ${isModal ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
                          <p className="font-bold mb-0.5">Rejection Reason:</p>
                          <p>{req.admin_note}</p>
                        </div>
                      )}
                      {req.status === 'completed' && (
                        <div className={`p-2.5 rounded-lg text-xs ${isModal ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-green-500/10 border border-green-500/20 text-green-400'}`}>
                          <p className="font-bold">🎉 {req.request_type === 'exchange' ? 'Exchange dispatched!' : 'Store credit has been added to your wallet!'}</p>
                        </div>
                      )}
                      {req.admin_note && req.status !== 'rejected' && (
                        <div className={`p-2.5 rounded-lg text-xs ${isModal ? 'bg-slate-50 border border-slate-200 text-slate-600' : 'bg-slate-800 border border-slate-700 text-slate-400'}`}>
                          <p className="font-semibold">Note from team: {req.admin_note}</p>
                        </div>
                      )}

                      {/* Tracking info */}
                      {req.return_tracking_number && (
                        <div className={`text-xs ${isModal ? 'text-slate-600' : 'text-slate-400'}`}>
                          <p className="font-semibold">Return Tracking: {req.return_tracking_company} #{req.return_tracking_number}</p>
                          {req.return_tracking_url && (
                            <a href={req.return_tracking_url.startsWith('http://') || req.return_tracking_url.startsWith('https://') ? req.return_tracking_url : `https://${req.return_tracking_url}`} target="_blank" rel="noreferrer" className="text-blue-500 underline">Track Shipment →</a>
                          )}
                        </div>
                      )}
                      {req.exchange_tracking_number && (
                        <div className={`text-xs ${isModal ? 'text-slate-600' : 'text-slate-400'}`}>
                          <p className="font-semibold">Exchange Dispatch: {req.exchange_tracking_company} #{req.exchange_tracking_number}</p>
                          {req.exchange_tracking_url && (
                            <a href={req.exchange_tracking_url.startsWith('http://') || req.exchange_tracking_url.startsWith('https://') ? req.exchange_tracking_url : `https://${req.exchange_tracking_url}`} target="_blank" rel="noreferrer" className="text-blue-500 underline">Track Delivery →</a>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'wallet' && (
          <div className="space-y-4">
            {/* Wallet Balance Hero */}
            <div className={`rounded-2xl p-6 ${
              isModal
                ? 'bg-gradient-to-br from-emerald-600 to-emerald-700'
                : 'bg-gradient-to-br from-emerald-700 to-emerald-900'
            } text-white shadow-lg`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-emerald-100 text-xs font-semibold uppercase tracking-wider">Available Store Credit</p>
                  <p className="text-4xl font-extrabold mt-1">₹{storeCreditBalance.toFixed(2)}</p>
                  <p className="text-emerald-200 text-xs mt-1">Linked to {verifiedPhone}</p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                  <Wallet className="w-7 h-7 text-white" />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="bg-white/20 rounded-lg px-3 py-1.5 text-xs font-semibold">
                  💡 Auto-applied at Checkout
                </div>
                <div className="bg-white/20 rounded-lg px-3 py-1.5 text-xs font-semibold">
                  🛡️ No Expiry on Refund Credits
                </div>
              </div>
            </div>

            {/* How Credits Are Earned */}
            <div className={`border rounded-xl p-5 shadow-sm ${
              isModal ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}>
              <h3 className={`font-bold text-sm flex items-center gap-1.5 mb-4 ${
                isModal ? 'text-slate-900' : 'text-white'
              }`}>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                How to Earn Store Credit
              </h3>
              <div className="space-y-3">
                {[
                  { icon: '🔄', title: 'Order Returns / Refunds', desc: 'Credits are issued when your return is processed or a refund is approved as store credit.' },
                  { icon: '🎁', title: 'Promotional Cashback', desc: 'Special offers and seasonal campaigns may reward you with store credit.' },
                  { icon: '✅', title: 'Loyalty Rewards', desc: 'Repeat purchases and referrals may be rewarded with store credit by the store.' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-xl shrink-0">{item.icon}</span>
                    <div>
                      <p className={`text-xs font-bold ${isModal ? 'text-slate-900' : 'text-white'}`}>{item.title}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Credit Activity from Orders */}
            <div className={`border rounded-xl p-5 shadow-sm ${
              isModal ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}>
              <h3 className={`font-bold text-sm flex items-center gap-1.5 mb-4 ${
                isModal ? 'text-slate-900' : 'text-white'
              }`}>
                <History className="w-4 h-4 text-emerald-600" />
                Credit Activity (From Orders)
              </h3>
              {orders.filter(o => o.financial_status === 'refunded' || o.financial_status === 'partially_refunded').length === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-slate-400 text-xs">No credit transactions found from your orders.</p>
                  <p className="text-slate-300 text-[11px] mt-1">Credits from refunds or cashback will appear here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders
                    .filter(o => o.financial_status === 'refunded' || o.financial_status === 'partially_refunded')
                    .map((o) => (
                      <div key={o.id} className="flex items-center justify-between py-2 border-b border-slate-100">
                        <div>
                          <p className={`text-xs font-bold ${isModal ? 'text-slate-900' : 'text-white'}`}>{o.order_number}</p>
                          <p className="text-[11px] text-slate-400">{new Date(o.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-emerald-600">Refunded</p>
                          <p className={`text-sm font-extrabold ${isModal ? 'text-slate-900' : 'text-white'}`}>₹{parseFloat(o.total_price).toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                </div>
              )}
              <div className="mt-4 pt-3 border-t border-slate-100 text-center">
                <p className="text-[11px] text-slate-400">Current Balance: <span className="font-bold text-emerald-600">₹{storeCreditBalance.toFixed(2)}</span></p>
                <p className="text-[11px] text-slate-300 mt-0.5">For detailed credit history, contact {storeName} support on WhatsApp.</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`border rounded-xl p-5 shadow-sm h-fit ${
              isModal ? 'bg-white border-slate-200' : 'bg-slate-900/70 border-slate-800/80'
            }`}>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <h3 className={`font-bold text-sm flex items-center gap-1.5 ${isModal ? 'text-slate-900' : 'text-white'}`}>
                  <User className="w-4 h-4 text-emerald-600" />
                  <span>Personal Details</span>
                </h3>
                {!isEditingProfile && (
                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 transition"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                )}
              </div>

              {isEditingProfile ? (
                <form onSubmit={handleSaveProfile} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">First Name</label>
                    <input
                      type="text"
                      value={editFirstName}
                      onChange={(e) => setEditFirstName(e.target.value)}
                      placeholder="First Name"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Last Name</label>
                    <input
                      type="text"
                      value={editLastName}
                      onChange={(e) => setEditLastName(e.target.value)}
                      placeholder="Last Name"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Email</label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="flex-1 bg-slate-900 text-white font-bold py-2 rounded-lg text-xs transition"
                    >
                      {savingProfile ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-3 text-xs">
                  <div>
                    <p className="text-[11px] text-slate-400 mb-0.5">Full Name</p>
                    <p className={`font-semibold ${isModal ? 'text-slate-900' : 'text-white'}`}>
                      {profile.first_name || profile.last_name
                        ? `${profile.first_name} ${profile.last_name}`
                        : 'Not set'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400 mb-0.5">Mobile Number</p>
                    <p className="font-semibold text-slate-900 flex items-center gap-2">
                      <span>{verifiedPhone}</span>
                      <span className="text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                        VERIFIED
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400 mb-0.5">Email Address</p>
                    <p className={`font-semibold ${isModal ? 'text-slate-900' : 'text-white'}`}>
                      {profile.email || 'Not set'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className={`border rounded-xl p-5 shadow-sm h-fit ${
              isModal ? 'bg-white border-slate-200' : 'bg-slate-900/70 border-slate-800/80'
            }`}>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <h3 className={`font-bold text-sm flex items-center gap-1.5 ${isModal ? 'text-slate-900' : 'text-white'}`}>
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>{editingAddress ? (editingAddress.id ? 'Edit Address' : 'Add New Address') : `Saved Addresses (${addresses.length})`}</span>
                </h3>
                {!editingAddress && (
                  <button
                    onClick={() => handleEditAddressClick({})}
                    className="text-xs text-slate-700 hover:text-slate-900 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 transition font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Add Address</span>
                  </button>
                )}
              </div>

              {editingAddress ? (
                <form onSubmit={handleSaveAddress} className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">First Name</label>
                      <input
                        type="text"
                        value={addrForm.first_name}
                        onChange={(e) => setAddrForm({ ...addrForm, first_name: e.target.value })}
                        required
                        placeholder="First Name"
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">Last Name</label>
                      <input
                        type="text"
                        value={addrForm.last_name}
                        onChange={(e) => setAddrForm({ ...addrForm, last_name: e.target.value })}
                        required
                        placeholder="Last Name"
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Mobile Number</label>
                    <input
                      type="tel"
                      value={addrForm.phone}
                      onChange={(e) => setAddrForm({ ...addrForm, phone: e.target.value })}
                      placeholder="10-digit mobile number"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Address Line 1 (House No, Building, Street)</label>
                    <input
                      type="text"
                      value={addrForm.address1}
                      onChange={(e) => setAddrForm({ ...addrForm, address1: e.target.value })}
                      required
                      placeholder="House No, Building, Street"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Address Line 2 (Landmark, Area, Colony)</label>
                    <input
                      type="text"
                      value={addrForm.address2}
                      onChange={(e) => setAddrForm({ ...addrForm, address2: e.target.value })}
                      placeholder="Landmark, Area, Colony"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">Pincode</label>
                      <input
                        type="text"
                        value={addrForm.pincode}
                        onChange={(e) => setAddrForm({ ...addrForm, pincode: e.target.value })}
                        required
                        placeholder="PIN Code"
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">City / District</label>
                      <input
                        type="text"
                        value={addrForm.city}
                        onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })}
                        required
                        placeholder="City"
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">State</label>
                    <input
                      type="text"
                      value={addrForm.state}
                      onChange={(e) => setAddrForm({ ...addrForm, state: e.target.value })}
                      required
                      placeholder="State"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={savingAddress}
                      className="flex-1 bg-slate-900 text-white font-bold py-2 rounded-lg text-xs transition"
                    >
                      {savingAddress ? 'Saving...' : 'Save Address'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingAddress(null)}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : addresses.length === 0 ? (
                <div className="py-6 text-center text-slate-400 text-xs">
                  <p>No saved addresses found.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.map((addr, index) => (
                    <div
                      key={index}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">
                            {addr.first_name} {addr.last_name}
                          </span>
                          {addr.is_default && (
                            <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded-full font-bold">
                              DEFAULT
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleEditAddressClick(addr)}
                          className="text-[11px] text-slate-500 hover:text-slate-900 flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-slate-200 transition font-medium shadow-2xs"
                        >
                          <Edit2 className="w-3 h-3 text-emerald-600" />
                          <span>Edit</span>
                        </button>
                      </div>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        {addr.address1}
                        {addr.address2 ? `, ${addr.address2}` : ''}
                        <br />
                        {addr.city}, {addr.state || addr.province} - {addr.pincode || addr.zip}
                      </p>
                      {(addr.phone || verifiedPhone) && (
                        <p className="text-slate-500 text-[11px] font-medium mt-1">
                          📞 {addr.phone || verifiedPhone}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ── RETURN / EXCHANGE MODAL ────────────────────────────────────── */}
      {showReturnModal && returnModalItem && (
        <div className={`fixed inset-0 z-50 flex flex-col ${isModal ? 'bg-white p-0' : 'bg-black/80 backdrop-blur-sm items-center justify-center p-0 sm:p-4'}`}>
          <div className={`w-full flex flex-col overflow-hidden ${isModal ? 'h-full bg-white max-w-none rounded-none border-none shadow-none' : 'max-w-md rounded-2xl shadow-2xl bg-[#0F172A] border border-slate-800'}`}>
            {/* Modal Header */}
            <div className={`px-5 py-4 border-b flex items-center justify-between shrink-0 ${isModal ? 'border-slate-200' : 'border-slate-800'}`}>
              <div>
                <h3 className={`text-sm font-extrabold ${isModal ? 'text-slate-900' : 'text-white'}`}>
                  {returnStep === 1 ? 'Select Type & Item' : returnStep === 2 ? 'Reason & Details' : 'Review & Submit'}
                </h3>
                <div className="flex items-center gap-1 mt-1">
                  {[1,2,3].map(s => (
                    <div key={s} className={`h-1 rounded-full transition-all ${s <= returnStep ? 'bg-rose-500' : (isModal ? 'bg-slate-200' : 'bg-slate-700')} ${s === returnStep ? 'w-6' : 'w-3'}`} />
                  ))}
                </div>
              </div>
              <button onClick={() => setShowReturnModal(false)} className={`p-1.5 rounded-lg ${isModal ? 'hover:bg-slate-100' : 'hover:bg-slate-800'} transition`}>
                <X className={`w-4 h-4 ${isModal ? 'text-slate-500' : 'text-slate-400'}`} />
              </button>
            </div>

            <div className={`p-5 overflow-y-auto space-y-4 ${isModal ? 'flex-1 max-h-none' : 'max-h-[75vh]'}`}>
              {returnSuccess ? (
                <div className="text-center py-8">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h4 className={`font-extrabold text-base ${isModal ? 'text-slate-900' : 'text-white'}`}>Request Submitted! 🎉</h4>
                  <p className="text-xs text-slate-400 mt-1">We'll review within 24-48 hours. Check "My Returns" for status.</p>
                </div>
              ) : returnStep === 1 ? (
                <>
                  {/* Selectable Items for Return / Exchange */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className={`text-xs font-bold ${isModal ? 'text-slate-700' : 'text-slate-300'}`}>
                        Select Item(s) to {returnType === 'return' ? 'Return' : 'Exchange'} ({selectedReturnItems.length} selected)
                      </p>
                      {returnModalOrder && returnModalOrder.line_items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            if (selectedReturnItems.length === returnModalOrder.line_items.length) {
                              setSelectedReturnItems([returnModalOrder.line_items[0]]);
                            } else {
                              setSelectedReturnItems([...returnModalOrder.line_items]);
                            }
                          }}
                          className="text-[11px] font-bold text-rose-600 hover:underline"
                        >
                          {selectedReturnItems.length === returnModalOrder.line_items.length ? 'Deselect All' : 'Select All'}
                        </button>
                      )}
                    </div>

                    <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                      {returnModalOrder?.line_items.map((item, idx) => {
                        const isSelected = selectedReturnItems.some(i => i.id === item.id);
                        return (
                          <div
                            key={idx}
                            onClick={() => {
                              if (isSelected && selectedReturnItems.length === 1) {
                                return; // Keep at least one selected
                              }
                              if (isSelected) {
                                setSelectedReturnItems(selectedReturnItems.filter(i => i.id !== item.id));
                              } else {
                                setSelectedReturnItems([...selectedReturnItems, item]);
                              }
                            }}
                            className={`flex items-center gap-3 p-3 rounded-xl border-2 transition cursor-pointer ${
                              isSelected
                                ? 'border-rose-500 bg-rose-50/50'
                                : isModal
                                ? 'border-slate-200 bg-white hover:border-slate-300'
                                : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition ${
                              isSelected ? 'bg-rose-600 border-rose-600 text-white' : 'border-slate-300 bg-white'
                            }`}>
                              {isSelected && <Check className="w-3.5 h-3.5" />}
                            </div>
                            {item.image_url ? (
                              <img src={item.image_url} alt={item.title} className="w-11 h-11 rounded-lg object-cover border border-slate-200 shrink-0" />
                            ) : (
                              <div className="w-11 h-11 rounded-lg bg-slate-200 flex items-center justify-center shrink-0"><Package className="w-5 h-5 text-slate-400" /></div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-bold truncate ${isModal ? 'text-slate-900' : 'text-white'}`}>{item.title}</p>
                              {item.variant_title && <p className="text-[11px] text-slate-500 truncate">{item.variant_title}</p>}
                              <p className="text-[11px] font-semibold text-slate-400">Qty: {item.quantity} — {returnModalOrder.currency || '₹'}{parseFloat(item.price).toFixed(2)}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Type toggle */}
                  <div>
                    <p className={`text-xs font-bold mb-2 ${isModal ? 'text-slate-700' : 'text-slate-300'}`}>Request Type</p>
                    <div className="grid grid-cols-2 gap-2">
                      {(['return', 'exchange'] as const).map(t => (
                        <button key={t} onClick={() => setReturnType(t)}
                          className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-bold transition ${returnType === t ? 'border-rose-500 bg-rose-50 text-rose-700' : (isModal ? 'border-slate-200 text-slate-600' : 'border-slate-700 text-slate-400')}`}>
                          {t === 'return' ? <RotateCcw className="w-4 h-4" /> : <ArrowLeftRight className="w-4 h-4" />}
                          {t === 'return' ? 'Return & Refund' : 'Exchange'}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1.5">
                      {returnType === 'return' ? '💰 Refund will be issued as store credits (wallet)' : '🔄 We\'ll send you a new product'}
                    </p>
                  </div>

                  {returnType === 'exchange' && (
                    <div>
                      <p className={`text-xs font-bold mb-2 ${isModal ? 'text-slate-700' : 'text-slate-300'}`}>Exchange Size *</p>
                      <div className="flex flex-wrap gap-2">
                        {['XS','S','M','L','XL','XXL','XXXL'].map(size => (
                          <button key={size} onClick={() => setExchangeSize(size)}
                            className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition ${exchangeSize === size ? 'border-rose-500 bg-rose-50 text-rose-700' : (isModal ? 'border-slate-200 text-slate-600' : 'border-slate-700 text-slate-400')}`}>
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : returnStep === 2 ? (
                <>
                  <div>
                    <p className={`text-xs font-bold mb-2 ${isModal ? 'text-slate-700' : 'text-slate-300'}`}>Reason for {returnType === 'return' ? 'Return' : 'Exchange'} *</p>
                    <div className="space-y-2">
                      {[
                        { value: 'size_issue', label: '📏 Size Issue' },
                        { value: 'damaged', label: '💔 Damaged / Defective' },
                        { value: 'wrong_product', label: '📦 Wrong Product Received' },
                        { value: 'quality', label: '⚠️ Quality Issue' },
                        { value: 'other', label: '💬 Other' },
                      ].map(r => (
                        <button key={r.value} onClick={() => setReturnReason(r.value)}
                          className={`w-full text-left px-3 py-2.5 rounded-xl border text-xs font-semibold transition ${returnReason === r.value ? 'border-rose-500 bg-rose-50 text-rose-700' : (isModal ? 'border-slate-200 text-slate-700 hover:bg-slate-50' : 'border-slate-700 text-slate-300 hover:bg-slate-800')}`}>
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className={`text-xs font-bold mb-1.5 ${isModal ? 'text-slate-700' : 'text-slate-300'}`}>Additional Details (optional)</p>
                    <textarea value={returnDetail} onChange={e => setReturnDetail(e.target.value)} maxLength={200} rows={2} placeholder="Describe the issue in more detail..."
                      className={`w-full rounded-xl border px-3 py-2 text-xs resize-none focus:outline-none ${isModal ? 'border-slate-300 text-slate-900 focus:border-rose-500 bg-white' : 'border-slate-700 text-white focus:border-rose-500 bg-slate-900'}`} />
                    <p className="text-[10px] text-slate-400 text-right">{returnDetail.length}/200</p>
                  </div>

                  {/* Photo upload */}
                  <div>
                    <p className={`text-xs font-bold mb-1.5 ${isModal ? 'text-slate-700' : 'text-slate-300'}`}>Product Photo * <span className="font-normal text-slate-400">(required)</span></p>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                    {returnPhoto ? (
                      <div className="flex items-center gap-3">
                        <img src={returnPhoto} alt="proof" className="w-16 h-16 rounded-lg object-cover border border-emerald-300" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-emerald-600 truncate">{returnPhotoName}</p>
                          <button onClick={() => { setReturnPhoto(null); setReturnPhotoName(''); }} className="text-[10px] text-slate-400 hover:text-red-500 transition mt-0.5">Remove</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => fileInputRef.current?.click()}
                        className={`w-full flex flex-col items-center justify-center gap-1.5 py-5 rounded-xl border-2 border-dashed text-xs font-semibold transition ${isModal ? 'border-slate-300 text-slate-500 hover:border-rose-400 hover:text-rose-600' : 'border-slate-700 text-slate-500 hover:border-rose-500 hover:text-rose-400'}`}>
                        <Camera className="w-6 h-6" />
                        Click to upload photo (max 5MB)
                      </button>
                    )}
                    <p className="text-[10px] text-slate-400 mt-1">Photo will be auto-deleted after 30 days</p>
                  </div>
                </>
              ) : (
                <>
                  {/* Step 3: Review */}
                  <div className={`rounded-xl p-4 space-y-2 text-xs ${isModal ? 'bg-slate-50' : 'bg-slate-900/60 border border-slate-800'}`}>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Type</span>
                      <span className={`font-bold ${isModal ? 'text-slate-900' : 'text-white'}`}>{returnType === 'return' ? '🔄 Return & Refund' : '🔁 Exchange'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Product</span>
                      <span className={`font-bold truncate max-w-[60%] text-right ${isModal ? 'text-slate-900' : 'text-white'}`}>{returnModalItem.title}</span>
                    </div>
                    {returnType === 'exchange' && exchangeSize && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Exchange Size</span>
                        <span className={`font-bold ${isModal ? 'text-slate-900' : 'text-white'}`}>{exchangeSize}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-400">Reason</span>
                      <span className={`font-bold ${isModal ? 'text-slate-900' : 'text-white'}`}>{returnReason.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}</span>
                    </div>
                    {returnType === 'return' && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Refund Method</span>
                        <span className="font-bold text-emerald-600">💰 Store Credits</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-400">Photo</span>
                      {returnPhoto ? <span className="text-emerald-600 font-bold">✅ Uploaded</span> : <span className="text-red-500 font-bold">❌ Missing</span>}
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg text-xs ${isModal ? 'bg-amber-50 border border-amber-200 text-amber-700' : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'}`}>
                    <p className="font-bold mb-0.5">Policy Reminder</p>
                    <p>We'll review your request within 24-48 hours. Refunds are issued as store credits. Return shipping will be arranged by our team if approved.</p>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            {!returnSuccess && (
              <div className={`px-5 py-4 border-t flex gap-2 ${isModal ? 'border-slate-200' : 'border-slate-800'}`}>
                {returnStep > 1 && (
                  <button onClick={() => setReturnStep(s => (s - 1) as 1|2|3)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition ${isModal ? 'border-slate-300 text-slate-600 hover:bg-slate-50' : 'border-slate-700 text-slate-400 hover:bg-slate-800'}`}>
                    <ArrowLeft className="w-3.5 h-3.5" />Back
                  </button>
                )}
                <button
                  onClick={() => {
                    if (returnStep < 3) setReturnStep(s => (s + 1) as 1|2|3);
                    else handleSubmitReturnRequest();
                  }}
                  disabled={
                    returnSubmitting ||
                    (returnStep === 1 && returnType === 'exchange' && !exchangeSize) ||
                    (returnStep === 2 && !returnReason) ||
                    (returnStep === 3 && (!returnPhoto || returnSubmitting))
                  }
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5"
                >
                  {returnSubmitting ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" />Submitting...</> : returnStep === 3 ? '✅ Submit Request' : <>Next <ChevronRight className="w-3.5 h-3.5" /></>}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hidden file input for photo upload */}
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
    </div>
  );
}
