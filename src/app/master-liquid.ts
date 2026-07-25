export const masterLiquid = `\n{% style %}
  #wa-otp-overlay * { box-sizing: border-box; font-family: var(--wa-font-family, 'Inter', -apple-system, BlinkMacSystemFont, sans-serif); }

  #wa-otp-overlay {
    position: fixed !important; top: 0 !important; left: 0 !important;
    width: 100% !important; height: 100% !important;
    z-index: 2147483647 !important; display: none;
    overflow-y: auto !important;
    background: rgba(15, 23, 42, 0.6) !important;
    backdrop-filter: blur(6px) !important;
    -webkit-backdrop-filter: blur(6px) !important;
    align-items: flex-start !important;
    justify-content: center !important;
    padding: 0 !important;
  }

  /* ── MAIN WRAPPER ── */
  .wa-checkout-wrapper { width: 100%; min-height: 100%; display: flex; align-items: center; justify-content: center; }

  /* ── RIGHT PANEL ── */
  .wa-right-panel { width: 100%; max-width: 480px; background: #fdfdfd; display: flex; flex-direction: column; min-height: 100%; position: relative; box-shadow: 0 0 20px rgba(0,0,0,0.05); } @media (min-width: 481px) { .wa-right-panel { min-height: auto; height: 95%; max-height: 900px; border-radius: 16px; overflow-y: auto; } }

  /* ── HEADER ── */
  .wa-modal-header {
    display: flex; align-items: center; justify-content: center;
    padding: 18px 28px;
    border-bottom: 1px solid #f1f5f9;
    position: sticky; top: 0; background: var(--wa-card-bg, #fff); z-index: 10;
    box-shadow: 0 1px 6px rgba(0,0,0,0.05);
  }
  .wa-mobile-brand { display: flex; align-items: center; gap: 10px; }
  #wa-brand-name-mobile {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  #wa-brand-name-mobile img {
    max-height: 36px !important;
    max-width: 120px !important;
    object-fit: contain !important;
  }
  .wa-mobile-logo-text {
    font-size: 18px; font-weight: 800; color: var(--wa-theme, #0f172a); letter-spacing: -0.5px;
  }
  .wa-secure-badge {
    display: flex; align-items: center; gap: 5px;
    font-size: 11px; color: #16a34a; font-weight: 600;
    background: #f0fdf4; border: 1px solid #bbf7d0;
    padding: 4px 10px; border-radius: 20px;
  }
  .wa-secure-badge svg { width: 11px; height: 11px; color: #16a34a; }
  .wa-close-btn {
    position: absolute; right: 28px;
    width: 36px; height: 36px; border-radius: 50%;
    background: #f1f5f9; border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; color: #64748b;
    transition: all 0.2s; flex-shrink: 0;
  }
  .wa-close-btn:hover { background: #e2e8f0; color: var(--wa-theme, #0f172a); }

  /* ── CONTENT AREA ── */
  .wa-content-area {
    flex: 1; padding: 36px 28px;
    max-width: 520px; width: 100%; margin: 0 auto;
    background: var(--wa-bg, #f1f5f9);
  }

  /* ── STEP INDICATOR ── */
  .wa-steps {
    display: flex; align-items: center; gap: 0;
    margin-bottom: 36px;
  }
  .wa-step-dot {
    width: 28px; height: 28px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 700;
    background: #f1f5f9; color: #94a3b8;
    flex-shrink: 0; transition: all 0.3s;
  }
  .wa-step-dot.active { background: var(--wa-theme, #0f172a); color: #fff; }
  .wa-step-dot.done { background: #16a34a; color: #fff; }
  .wa-step-line {
    flex: 1; height: 2px; background: #e2e8f0; transition: background 0.3s;
  }
  .wa-step-line.done { background: #16a34a; }

  /* ── SECTION TITLE ── */
  .wa-section-eyebrow {
    font-size: 11px; font-weight: 600; color: #3b82f6;
    text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;
  }
  .wa-section-title {
    font-size: 24px; font-weight: 800; color: var(--wa-heading, #0f172a);
    margin: 0 0 6px 0; letter-spacing: -0.5px; line-height: 1.2;
  }
  .wa-section-desc {
    font-size: 14px; color: var(--wa-subheading, #64748b); margin: 0 0 28px 0; line-height: 1.5;
  }

  /* ── FORM ── */
  .wa-field-group { margin-bottom: 16px; }
  .wa-field-label {
    font-size: 12px; font-weight: 600; color: var(--wa-label, #374151);
    display: block; margin-bottom: 6px; letter-spacing: 0.3px;
  }
  .wa-input {
    width: 100%; padding: 13px 16px;
    border: 1.5px solid var(--wa-border, #e2e8f0); border-radius: 10px;
    font-size: 15px; background: #fff; color: var(--wa-theme, #0f172a);
    transition: all 0.2s; outline: none;
  }
  .wa-input:focus { border-color: var(--wa-theme, #0f172a); box-shadow: 0 0 0 3px rgba(15,23,42,0.06); }
  .wa-input::placeholder { color: #cbd5e1; }
  #wa-otp-overlay input::-webkit-input-placeholder { color: #94a3b8 !important; opacity: 0.45 !important; font-weight: 400 !important; }
  #wa-otp-overlay input::-moz-placeholder { color: #94a3b8 !important; opacity: 0.45 !important; font-weight: 400 !important; }
  #wa-otp-overlay input:-ms-input-placeholder { color: #94a3b8 !important; opacity: 0.45 !important; font-weight: 400 !important; }
  #wa-otp-overlay input::placeholder { color: #94a3b8 !important; opacity: 0.45 !important; font-weight: 400 !important; }

  /* Phone row with +91 */
  .wa-phone-row { display: flex; gap: 0; }
  .wa-phone-prefix {
    padding: 13px 14px; background: #f8fafc;
    border: 1.5px solid #e2e8f0; border-right: none;
    border-radius: 10px 0 0 10px;
    font-size: 14px; font-weight: 600; color: #374151;
    white-space: nowrap; display: flex; align-items: center; gap: 6px;
  }
  .wa-phone-row .wa-input { border-radius: 0 10px 10px 0; }

  /* OTP input boxes */
  .wa-otp-boxes { display: flex; gap: 12px; justify-content: center; margin: 8px 0; }
  .wa-otp-box {
    width: 64px; height: 64px; border: 1.5px solid #e2e8f0;
    border-radius: 12px; text-align: center; font-size: 24px; font-weight: 700;
    color: var(--wa-theme, #0f172a); outline: none; transition: all 0.2s;
  }
  .wa-otp-box:focus { border-color: var(--wa-theme, #0f172a); box-shadow: 0 0 0 3px rgba(15,23,42,0.06); }

  /* ── BUTTON ── */
  .wa-btn-primary {
    width: 100%; padding: 15px;
    background: var(--wa-theme, #0f172a); color: #fff;
    border: none; border-radius: 10px;
    font-size: 15px; font-weight: 700; cursor: pointer;
    transition: all 0.2s; display: flex; align-items: center;
    justify-content: center; gap: 8px; letter-spacing: 0.2px;
  }
  .wa-btn-primary:hover { background: #1e293b; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(15,23,42,0.2); }
  .wa-btn-primary:active { transform: translateY(0); }
  .wa-btn-primary:disabled { background: #cbd5e1; cursor: not-allowed; transform: none; box-shadow: none; }
  .wa-btn-primary.loading { pointer-events: none; }

  .wa-btn-secondary {
    width: 100%; padding: 14px;
    background: transparent; color: #475569;
    border: 1.5px solid var(--wa-border, #e2e8f0); border-radius: 10px;
    font-size: 14px; font-weight: 600; cursor: pointer;
    transition: all 0.2s; margin-top: 10px;
  }
  .wa-btn-secondary:hover { border-color: #cbd5e1; background: #f8fafc; }

  /* ── ADDRESS ── */
  .wa-addr-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 4px; }
  .wa-addr-grid .wa-field-group { margin-bottom: 0; }
  .wa-addr-grid .wa-field-group.full { grid-column: 1 / -1; }
  
  .wa-address-card {
    border: 1.5px solid #e2e8f0; border-radius: 12px;
    padding: 16px; cursor: pointer;
    transition: all 0.2s; margin-bottom: 10px;
    position: relative;
  }
  .wa-address-card:hover { border-color: #94a3b8; }
  .wa-address-card.selected { border-color: var(--wa-theme, var(--wa-theme, #0f172a)); background: #f8fafc; }
  .wa-address-card.selected::after {
    content: '✓';
    position: absolute; top: 12px; right: 14px;
    width: 22px; height: 22px; border-radius: 50%;
    background: var(--wa-theme, var(--wa-theme, #0f172a)); color: #fff;
    font-size: 12px; font-weight: 700;
    display: flex; align-items: center; justify-content: center;
  }
  .wa-addr-name { font-size: 14px; font-weight: 700; color: var(--wa-theme, var(--wa-theme, #0f172a)); margin-bottom: 4px; }
  .wa-addr-text { font-size: 13px; color: #64748b; line-height: 1.5; }

  /* ── ORDER SUMMARY ── */
  .wa-order-summary {
    background: #f8fafc; border: 1px solid #e2e8f0;
    border-radius: 14px; padding: 20px; margin: 20px 0;
  }
  .wa-summary-title { font-size: 13px; font-weight: 700; color: #374151; margin-bottom: 14px; text-transform: uppercase; letter-spacing: 0.5px; }
  .wa-summary-row {
    display: flex; justify-content: space-between; align-items: center;
    font-size: 14px; color: #64748b; padding: 7px 0;
  }
  .wa-summary-row:not(:last-child) { border-bottom: 1px solid #f1f5f9; }
  .wa-summary-row.total {
    font-size: 16px; font-weight: 800; color: var(--wa-theme, var(--wa-theme, #0f172a));
    padding-top: 14px; margin-top: 4px;
    border-top: 2px solid #e2e8f0 !important;
  }
  .wa-free-label { color: #16a34a; font-weight: 600; }

  /* ── COUPON ── */
  .wa-coupon-row { display: flex; gap: 10px; margin-bottom: 16px; }
  .wa-coupon-row .wa-input { flex: 1; font-size: 14px; text-transform: uppercase; }
  .wa-coupon-apply {
    padding: 0 20px; background: #f1f5f9;
    border: 1.5px solid var(--wa-border, #e2e8f0); border-radius: 10px;
    font-size: 14px; font-weight: 700; color: #374151;
    cursor: pointer; white-space: nowrap; transition: all 0.2s;
  }
  .wa-coupon-apply:hover { background: #e2e8f0; }

  /* ── PAYMENT PILLS ── */
  .wa-pay-divider { display: flex; align-items: center; gap: 12px; margin: 20px 0 16px; }
  .wa-pay-divider::before, .wa-pay-divider::after { content: ''; flex: 1; height: 1px; background: #e2e8f0; }
  .wa-pay-divider span { font-size: 12px; color: #94a3b8; font-weight: 500; white-space: nowrap; }
  .wa-pay-online-btn {
    width: 100%; padding: 13px;
    background: #fff; color: #374151;
    border: 1.5px solid var(--wa-border, #e2e8f0); border-radius: 10px;
    font-size: 14px; font-weight: 600; cursor: pointer;
    transition: all 0.2s; display: flex; align-items: center;
    justify-content: center; gap: 8px;
  }
  .wa-pay-online-btn:hover { border-color: #94a3b8; background: #f8fafc; }

  /* ── SUCCESS ── */
  .wa-success-screen {
    display: none; text-align: center; padding: 60px 20px;
    flex-direction: column; align-items: center;
  }
  .wa-success-checkmark {
    width: 80px; height: 80px; border-radius: 50%;
    background: linear-gradient(135deg, #16a34a, #22c55e);
    display: flex; align-items: center; justify-content: center;
    font-size: 36px; margin: 0 auto 24px;
    box-shadow: 0 8px 30px rgba(22, 163, 74, 0.3);
    animation: wa-pop 0.4s cubic-bezier(0.17, 0.89, 0.32, 1.28) forwards;
  }
  @keyframes wa-pop { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }

  /* ── ERROR ── */
  .wa-error-msg {
    font-size: 13px; color: #dc2626; font-weight: 500;
    background: #fef2f2; border: 1px solid #fecaca;
    border-radius: 8px; padding: 10px 14px;
    margin-top: 12px; display: none;
  }

  /* ── RESEND LINK ── */
  .wa-resend { text-align: center; margin-top: 20px; }
  .wa-resend a { font-size: 13px; color: #3b82f6; text-decoration: none; font-weight: 500; }
  .wa-resend a:hover { text-decoration: underline; }

  /* ── WHATSAPP NOTE ── */
  .wa-wa-note {
    display: flex; align-items: center; gap: 8px;
    font-size: 12px; color: #64748b; margin-top: 16px;
    padding: 10px 14px; background: #f0fdf4;
    border-radius: 8px; border: 1px solid #bbf7d0;
  }

  /* ── DESKTOP LAYOUT ── */
  @media (min-width: 768px) {
    .wa-left-panel { display: flex; }
    .wa-checkout-wrapper { min-height: 100vh; }
    .wa-content-area { padding: 48px 44px; }
    .wa-modal-header { padding: 24px 44px; }
    .wa-otp-boxes { gap: 16px; }
    .wa-otp-box { width: 72px; height: 72px; font-size: 28px; }
  }

  /* ── MOBILE ── */
  @media (max-width: 767px) {
    .wa-content-area { padding: 24px 20px; }
    .wa-modal-header { padding: 16px 20px; }
    .wa-section-title { font-size: 20px; }
    .wa-otp-box { width: 56px; height: 56px; font-size: 22px; }
    .wa-otp-boxes { gap: 10px; }
  }

  #wa-step-2, #wa-step-3, #wa-step-4, .wa-success-screen, #wa-new-address-form { display: none; }
  
  .wa-payment-option {
    border: 1.5px solid #e2e8f0;
    border-radius: 12px;
    padding: 18px 16px;
    margin-bottom: 12px;
    cursor: pointer;
    transition: all 0.2s ease-in-out;
    display: flex;
    align-items: flex-start;
    gap: 14px;
    background: #fff;
    position: relative;
    overflow: hidden;
  }
  .wa-payment-option:hover { border-color: #cbd5e1; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
  .wa-payment-option.selected {
    border-color: #2563eb;
    background: #eff6ff;
    box-shadow: 0 4px 14px rgba(37,99,235,0.1);
  }
  .wa-payment-radio {
    width: 22px; height: 22px; border-radius: 50%;
    border: 2px solid #cbd5e1;
    display: flex; align-items: center; justify-content: center;
    margin-top: 2px; flex-shrink: 0;
    transition: all 0.2s;
    background: #fff;
  }
  .wa-payment-option.selected .wa-payment-radio {
    border-color: #2563eb;
  }
  .wa-payment-option.selected .wa-payment-radio::after {
    content: ''; width: 10px; height: 10px; border-radius: 50%;
    background: #2563eb;
  }
{% endstyle %}

<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<script src="https://sdk.cashfree.com/js/v3/cashfree.js"></script>

<!-- Inject logged-in Shopify customer data for pre-fill -->
<script>
window._shopifyCustomer = {
  {% if customer %}
  logged_in: true,
  first_name: {{ customer.first_name | json }},
  last_name: {{ customer.last_name | json }},
  email: {{ customer.email | json }},
  phone: {{ customer.phone | default: '' | json }},
  addresses: [
    {% for addr in customer.addresses %}
    {
      id: {{ addr.id | json }},
      first_name: {{ addr.first_name | json }},
      last_name: {{ addr.last_name | json }},
      address1: {{ addr.address1 | json }},
      city: {{ addr.city | json }},
      zip: {{ addr.zip | json }},
      province: {{ addr.province | json }},
      country: {{ addr.country | json }},
      phone: {{ addr.phone | default: '' | json }}
    }{% unless forloop.last %},{% endunless %}
    {% endfor %}
  ]
  {% else %}
  logged_in: false,
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  addresses: []
  {% endif %}
};
</script>

<div id="wa-otp-overlay">
  <div class="wa-checkout-wrapper">
    
    <!-- RIGHT PANEL -->
    <div class="wa-right-panel">
      
      <!-- HEADER -->
      <div style="position:sticky; top:0; z-index:10; background:#fff; border-bottom:1px solid #f1f5f9;">

        <!-- Logo Bar -->
        <div style="display:flex; align-items:center; justify-content:space-between; padding:16px 24px; position:relative;">
          <button class="wa-back-btn" id="wa-back-btn" onclick="waGoBack()" style="background:none; border:none; cursor:pointer; color:#0f172a; padding:4px; display:none; align-items:center; border-radius:8px; flex-shrink:0; z-index:2;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>

          <div id="wa-brand-name-mobile" style="position:absolute; left:50%; transform:translateX(-50%); display:flex; align-items:center; z-index:1;">
            {% if settings.logo %}
              <img src="{{ settings.logo | img_url: 'master' }}" alt="{{ shop.name }}" style="height:36px; max-width:120px; object-fit:contain;">
            {% else %}
              <span style="font-weight:800; font-size:20px; text-transform:uppercase; color:#0f172a;">{{ shop.domain | remove: '.myshopify.com' }}</span>
            {% endif %}
          </div>

          <button onclick="closeWaModal()" style="background:#f1f5f9; border:none; width:36px; height:36px; border-radius:50%; font-size:18px; cursor:pointer; color:#64748b; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:0.2s; margin-left:auto; z-index:2;">&#x2715;</button>
        </div>
      </div>

      <!-- CONTENT -->
      <div class="wa-content-area" style="padding: 24px 24px;">
        
        <!-- TOP TRUST BADGES -->
        <div id="wa-top-trust-badges" style="display:flex; justify-content:space-between; align-items:center; padding:16px; margin-bottom:28px; background:#fff; border:1px solid #e2e8f0; border-radius:12px; box-shadow:0 1px 3px rgba(0,0,0,0.02); gap:8px;">
          <div style="display:flex; align-items:center; gap:8px; flex:1; justify-content:center;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" style="flex-shrink:0;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
            <div style="text-align:left;">
              <div style="font-size:11px; font-weight:700; color:#0f172a; white-space:nowrap;">100% Secure</div>
              <div style="font-size:10px; color:#64748b; line-height:1.2;">Encrypted & Protected</div>
            </div>
          </div>
          <div style="width:1px; height:24px; background:#e2e8f0; flex-shrink:0;"></div>
          <div style="display:flex; align-items:center; gap:8px; flex:1; justify-content:center;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" style="flex-shrink:0;"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <div style="text-align:left;">
              <div style="font-size:11px; font-weight:700; color:#0f172a; white-space:nowrap;">Privacy First</div>
              <div style="font-size:10px; color:#64748b; line-height:1.2;">We never share your data</div>
            </div>
          </div>
          <div style="width:1px; height:24px; background:#e2e8f0; flex-shrink:0;"></div>
          <div style="display:flex; align-items:center; gap:8px; flex:1; justify-content:center;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" style="flex-shrink:0;"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>
            <div style="text-align:left;">
              <div style="font-size:11px; font-weight:700; color:#0f172a; white-space:nowrap;">24/7 Support</div>
              <div style="font-size:10px; color:#64748b; line-height:1.2;">We're here to help</div>
            </div>
          </div>
        </div>

        <div class="wa-steps" id="wa-steps-indicator" style="display:flex; align-items:center; justify-content:space-between; margin-bottom:32px;">
          <div style="display:flex; align-items:center;">
            <div id="wa-dots-container" style="display:none;">
              <div class="wa-step-dot active" id="wa-dot-1" style="width:24px;height:24px;border-radius:50%;background:#0f172a;color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;">1</div>
              <div class="wa-step-line" id="wa-line-1" style="height:2px;background:#e2e8f0;width:12px;margin:0 4px;"></div>
              <div class="wa-step-dot" id="wa-dot-2" style="width:24px;height:24px;border-radius:50%;background:#f1f5f9;color:#64748b;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;">2</div>
              <div class="wa-step-line" id="wa-line-2" style="height:2px;background:#e2e8f0;width:12px;margin:0 4px;"></div>
              <div class="wa-step-dot" id="wa-dot-3" style="width:24px;height:24px;border-radius:50%;background:#f1f5f9;color:#64748b;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;">3</div>
            </div>
            <div id="wa-step-label" style="font-size:12px; font-weight:700; color:#16a34a; background:#fff; border:1px solid #bbf7d0; padding:6px 10px; border-radius:6px; white-space:nowrap; letter-spacing:0.5px;">STEP 1 OF 3</div>
          </div>
          <button id="wa-change-number-btn" onclick="waSwitchAccount(event)" style="display:none; background:none; border:none; color:#16a34a; font-size:12.5px; font-weight:800; cursor:pointer; text-decoration:underline;">Change Number</button>
        </div>

        <!-- STEP 1: PHONE -->
        <div id="wa-step-1">
          


          <div id="wa-phone-input-section">
            <div class="wa-field-group" id="wa-phone-container" style="margin-bottom:12px;">
              <label class="wa-field-label" style="font-size:13px; font-weight:700; color:#0f172a; margin-bottom:8px;">WhatsApp Number</label>
              <div class="wa-phone-row" style="display:flex; border:1px solid #bbf7d0; border-radius:10px; overflow:hidden; background:#fff;">
                <div class="wa-phone-prefix" style="padding:16px; background:#f8fafc; border-right:1px solid #e2e8f0; font-weight:700; color:#0f172a; font-size:15px; display:flex; align-items:center; gap:6px;">
                  IN +91 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
                <input type="tel" id="wa-phone" class="wa-input" placeholder="98765 43210" maxlength="10" style="border:none; padding:16px; font-size:16px; font-weight:500; color:#0f172a; flex:1; outline:none;" oninput="this.value=this.value.replace(/\D/g,'')">
              </div>
            </div>
            
            <div style="display:flex; align-items:center; gap:6px; font-size:12px; color:#16a34a; font-weight:500; margin-bottom:24px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
              We'll send an OTP to this number on <span style="font-weight:700;">WhatsApp</span>
            </div>
          </div>


          
          <div style="display:flex; justify-content:space-between; align-items:center; padding:16px; border:1px solid #e2e8f0; border-radius:12px; margin-bottom:24px; background:#fff; gap:4px;">
            <div style="display:flex; align-items:center; gap:8px; flex:1; justify-content:center;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" style="flex-shrink:0;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" stroke-width="1.5"/></svg>
              <div style="text-align:left;">
                <div style="font-size:11px; font-weight:700; color:#0f172a; white-space:nowrap;">Trusted by</div>
                <div style="font-size:10px; color:#64748b; line-height:1.2;">1M+ Customers</div>
              </div>
            </div>
            <div style="width:1px; height:28px; background:#e2e8f0; flex-shrink:0;"></div>
            <div style="text-align:center; flex:1.2;">
              <div style="color:#16a34a; display:flex; gap:2px; justify-content:center; margin-bottom:2px;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#16a34a" stroke="#16a34a" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#16a34a" stroke="#16a34a" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#16a34a" stroke="#16a34a" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#16a34a" stroke="#16a34a" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#16a34a" stroke="#16a34a" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              </div>
              <div style="font-size:11px; font-weight:700; color:#0f172a; white-space:nowrap;">4.8/5 Average Rating</div>
              <div style="font-size:10px; color:#64748b; line-height:1.2;">Across Platforms</div>
            </div>
            <div style="width:1px; height:28px; background:#e2e8f0; flex-shrink:0;"></div>
            <div style="display:flex; align-items:center; gap:8px; flex:1; justify-content:center;">
              <div style="background:#16a34a; color:#fff; font-size:11px; font-weight:800; padding:3px 5px; border-radius:4px; flex-shrink:0;">PCI</div>
              <div style="text-align:left;">
                <div style="font-size:11px; font-weight:700; color:#0f172a; white-space:nowrap;">PCI DSS</div>
                <div style="font-size:10px; color:#64748b; line-height:1.2;">Certified</div>
              </div>
            </div>
          </div>

          <button type="button" class="wa-btn-primary" id="wa-send-btn" onclick="sendWaOtp()" style="background:#0f172a; padding:18px; margin-bottom:16px; display:flex; flex-direction:column; align-items:center; gap:4px; border-radius:12px; width:100%; border:none; cursor:pointer;">
            <div style="display:flex; align-items:center; gap:10px; color:#fff;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
              <span style="font-size:16px; font-weight:700;">Continue Securely <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:-3px; margin-left:4px;"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></span>
            </div>
            <span style="font-size:11px; font-weight:500; color:#94a3b8;">It only takes a few seconds</span>
          </button>
          
          <div style="text-align:center; font-size:11px; color:#475569; font-weight:600; display:flex; justify-content:center; align-items:center; gap:6px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            Your security is our priority. We never share your details.
          </div>

          <!-- Switch Account fallback -->
          <div id="wa-switch-account" style="display:none; text-align:center; margin-top:20px;">
            <a href="#" onclick="waSwitchAccount(event)" style="color:#16a34a; font-size:14px; font-weight:600; text-decoration:none;">Not you? Switch account</a>
          </div>
        </div>
        <!-- STEP 2: OTP -->
        <div id="wa-step-2" style="display:none; text-align:center;">
          <div style="display:flex; justify-content:center; margin-bottom:16px;">
            <div style="position:relative; width:64px; height:64px; background:#f0fdf4; border-radius:50%; display:flex; align-items:center; justify-content:center;">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><rect x="9" y="9" width="6" height="8" rx="1" ry="1"/><path d="M12 9v-2"/></svg>
              <div style="position:absolute; bottom:0; right:0; background:#16a34a; color:#fff; border-radius:50%; width:20px; height:20px; display:flex; align-items:center; justify-content:center; border:2px solid #fff;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#bbf7d0" stroke-width="2" style="position:absolute; top:-8px; left:-16px;"><path d="M12 2v20M2 12h20M7 7l10 10M17 7L7 17"/></svg>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#bbf7d0" stroke-width="2" style="position:absolute; top:8px; right:-16px;"><path d="M12 2v20M2 12h20M7 7l10 10M17 7L7 17"/></svg>
            </div>
          </div>
          
          <h2 class="wa-section-title" style="font-size:24px; font-weight:800; margin-bottom:8px; color:#0f172a; letter-spacing:-0.5px;">Verify OTP</h2>
          <p class="wa-section-desc" style="font-size:14px; color:#475569; margin-bottom:4px;">Enter the 4-digit OTP sent to</p>
          <div style="font-size:16px; font-weight:700; color:#15803d; margin-bottom:20px; display:flex; justify-content:center; align-items:center; gap:8px;">
            <span id="wa-otp-desc">+91 MASKED</span>
            <button type="button" onclick="waSwitchAccount(event)" style="background:#f0fdf4; border:none; width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; color:#16a34a;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            </button>
          </div>

          <div style="background:#f8fafc; border-radius:8px; padding:10px; display:inline-flex; align-items:center; gap:6px; font-size:12px; color:#64748b; margin-bottom:24px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
            OTP is valid for <span style="font-weight:700; color:#16a34a;">2 minutes</span> for your security
          </div>

          <div class="wa-otp-boxes" style="display:flex; justify-content:center; gap:12px; margin-bottom:12px;">
            <input type="tel" class="wa-otp-box" maxlength="1" oninput="waOtpInput(this,0)" onkeydown="waOtpKey(event,0)" style="width:56px; height:64px; font-size:24px; font-weight:700; text-align:center; border:1px solid #cbd5e1; border-radius:12px; color:#0f172a; outline:none; transition:0.2s;" onfocus="this.style.borderColor='#16a34a';this.style.boxShadow='0 0 0 4px #dcfce7'" onblur="this.style.borderColor='#cbd5e1';this.style.boxShadow='none'">
            <input type="tel" class="wa-otp-box" maxlength="1" oninput="waOtpInput(this,1)" onkeydown="waOtpKey(event,1)" style="width:56px; height:64px; font-size:24px; font-weight:700; text-align:center; border:1px solid #cbd5e1; border-radius:12px; color:#0f172a; outline:none; transition:0.2s;" onfocus="this.style.borderColor='#16a34a';this.style.boxShadow='0 0 0 4px #dcfce7'" onblur="this.style.borderColor='#cbd5e1';this.style.boxShadow='none'">
            <input type="tel" class="wa-otp-box" maxlength="1" oninput="waOtpInput(this,2)" onkeydown="waOtpKey(event,2)" style="width:56px; height:64px; font-size:24px; font-weight:700; text-align:center; border:1px solid #cbd5e1; border-radius:12px; color:#0f172a; outline:none; transition:0.2s;" onfocus="this.style.borderColor='#16a34a';this.style.boxShadow='0 0 0 4px #dcfce7'" onblur="this.style.borderColor='#cbd5e1';this.style.boxShadow='none'">
            <input type="tel" class="wa-otp-box" maxlength="1" oninput="waOtpInput(this,3)" onkeydown="waOtpKey(event,3)" style="width:56px; height:64px; font-size:24px; font-weight:700; text-align:center; border:1px solid #cbd5e1; border-radius:12px; color:#0f172a; outline:none; transition:0.2s;" onfocus="this.style.borderColor='#16a34a';this.style.boxShadow='0 0 0 4px #dcfce7'" onblur="this.style.borderColor='#cbd5e1';this.style.boxShadow='none'">
          </div>
          
          <div class="wa-error-msg" id="wa-otp-error" style="display:none; color:#dc2626; font-size:13px; margin-bottom:16px;"></div>

          <button type="button" class="wa-btn-primary" id="wa-verify-btn" onclick="verifyWaOtp()" style="background:#0f172a; padding:18px; margin-top:12px; margin-bottom:12px; display:flex; align-items:center; justify-content:center; gap:8px; border-radius:12px; width:100%;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
            <span style="font-size:16px; font-weight:700;">Verify & Continue <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:-3px; margin-left:4px;"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></span>
          </button>

          <div style="background:#f0fdf4; color:#15803d; padding:12px; border-radius:8px; font-size:12px; font-weight:500; display:flex; align-items:center; justify-content:center; gap:6px; margin-bottom:24px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
            Didn't receive OTP? Check your <span style="font-weight:700;">WhatsApp</span>
          </div>

          <div style="display:flex; align-items:center; gap:16px; margin-bottom:24px; width:100%; justify-content:center;">
            <hr style="flex:1; border:none; border-top:1px solid #e2e8f0; margin:0;">
            <div style="font-size:12px; font-weight:700; color:#0f172a; padding:6px 10px; border:1px solid #e2e8f0; border-radius:50px; flex-shrink:0;">OR</div>
            <hr style="flex:1; border:none; border-top:1px solid #e2e8f0; margin:0;">
          </div>

          <div class="wa-resend" id="wa-resend-container" style="margin-bottom:24px;">
            <a href="#" id="wa-resend-link" onclick="sendWaOtp(); return false;" style="display:none; color:#16a34a; font-size:14px; font-weight:600; text-decoration:none;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-3px; margin-right:4px;"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
              Resend OTP Now
            </a>
            <div id="wa-resend-timer-wrap" style="display:flex; flex-direction:column; align-items:center; gap:6px;">
              <div style="display:flex; align-items:center; gap:6px; font-size:14px; font-weight:600; color:#0f172a;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <span id="wa-resend-timer">Resend OTP in 0:50</span>
              </div>
              <div style="font-size:12px; color:#64748b;">You can resend OTP up to 3 times</div>
            </div>
          </div>

          <!-- Bottom Badges -->
          <div style="display:flex; justify-content:space-between; align-items:center; padding:16px; border:1px solid #e2e8f0; border-radius:12px; margin-bottom:24px; background:#f8fafc; text-align:left;">
            <div style="display:flex; align-items:center; gap:8px; flex:1;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
              <div>
                <div style="font-size:11px; font-weight:700; color:#0f172a;">100% Secure</div>
                <div style="font-size:9px; color:#64748b;">Your data is encrypted</div>
              </div>
            </div>
            <div style="display:flex; align-items:center; gap:8px; flex:1; justify-content:center;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="M22 12h-2"/><path d="M4 12H2"/></svg>
              <div>
                <div style="font-size:11px; font-weight:700; color:#0f172a;">Quick & Easy</div>
                <div style="font-size:9px; color:#64748b;">Takes less than 30s</div>
              </div>
            </div>
            <div style="display:flex; align-items:center; gap:8px; flex:1; justify-content:flex-end;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>
              <div>
                <div style="font-size:11px; font-weight:700; color:#0f172a;">Need Help?</div>
                <div style="font-size:9px; color:#64748b;">Support available 24/7</div>
              </div>
            </div>
          </div>

          <div style="text-align:center; font-size:11px; color:#475569; font-weight:600; display:flex; justify-content:center; align-items:center; gap:6px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            Your security is our priority. We never share your details.
          </div>
        </div>

        <!-- STEP 3: ADDRESS -->
        <div id="wa-step-3" style="display:none; padding:0;">

          <!-- Contact Info -->
          <div style="margin-bottom:20px;">
            <div style="font-size:11px; font-weight:800; color:#64748b; margin-bottom:8px; text-transform:uppercase; letter-spacing:0.8px;">Contact Info</div>
            <!-- Email Field (icon-card style) -->
            <div style="background:#fff; border:1.5px solid #e2e8f0; border-radius:14px; padding:14px 16px; display:flex; align-items:center; gap:12px; transition:0.2s;" 
              onfocus="this.style.borderColor='#22c55e'" onblur="this.style.borderColor='#e2e8f0'">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              <div style="flex:1;">
                <div style="font-size:10px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:0.6px; margin-bottom:4px;">
                  Email Address <span id="wa-email-badge" style="color:#ef4444; font-size:10px;">(Required)</span>
                </div>
                <input type="email" id="wa-email" placeholder="your@email.com" autocomplete="email"
                  style="width:100%; border:none; outline:none; font-size:14px; font-weight:500; color:#0f172a; background:transparent; padding:0;">
              </div>
              <div id="wa-email-check" style="display:none;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
            </div>
          </div>

          <div style="font-size:11px; font-weight:800; color:#64748b; margin-bottom:8px; text-transform:uppercase; letter-spacing:0.8px;">Delivery Address</div>

          <!-- Address List (saved addresses - shown when addresses exist) -->
          <div id="wa-address-list"></div>

          <!-- Add New Address button (shown after addresses load) -->
          <button type="button" onclick="waShowAddressForm()" id="wa-add-addr-btn"
            style="width:100%; padding:14px; border:1.5px dashed #cbd5e1; background:transparent; border-radius:12px; font-size:14px; font-weight:600; color:#64748b; cursor:pointer; margin-bottom:16px; transition:0.2s; display:none;">
            + Add New Address
          </button>

          <!-- Deliver to this Address button (shown when a saved address is selected) -->
          <button type="button" id="wa-deliver-here-btn" onclick="waGoToStep(4)"
            style="display:none; width:100%; padding:18px; background:#0f172a; color:#fff; border:none; border-radius:14px; font-size:16px; font-weight:700; cursor:pointer; margin-bottom:20px; align-items:center; justify-content:center; gap:8px; transition:0.2s;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            Deliver to this Address →
          </button>

          <!-- NEW ADDRESS FORM -->
          <div id="wa-new-address-form" style="display:none;">

            <!-- Header -->
            <div style="margin-bottom:20px;">
              <h2 style="font-size:22px; font-weight:800; color:#0f172a; margin:0 0 4px 0;">New Address</h2>
              <p style="font-size:13px; color:#64748b; margin:0;">Enter accurate details for a smooth and timely delivery.</p>
            </div>
            <!-- First Name + Last Name -->
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:12px;">
              <div style="background:#fff; border:1.5px solid #e2e8f0; border-radius:14px; padding:14px 16px; display:flex; align-items:center; gap:10px;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <div style="flex:1;">
                  <div style="font-size:10px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:0.6px; margin-bottom:4px;">First Name</div>
                  <input type="text" id="wa-first-name" placeholder="Rahul" autocomplete="given-name"
                    style="width:100%; border:none; outline:none; font-size:14px; font-weight:500; color:#0f172a; background:transparent; padding:0;">
                </div>
              </div>
              <div style="background:#fff; border:1.5px solid #e2e8f0; border-radius:14px; padding:14px 16px; display:flex; align-items:center; gap:10px;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <div style="flex:1;">
                  <div style="font-size:10px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:0.6px; margin-bottom:4px;">Last Name</div>
                  <input type="text" id="wa-last-name" placeholder="Sharma" autocomplete="family-name"
                    style="width:100%; border:none; outline:none; font-size:14px; font-weight:500; color:#0f172a; background:transparent; padding:0;">
                </div>
              </div>
            </div>

            <!-- Street Address -->
            <div style="background:#fff; border:1.5px solid #e2e8f0; border-radius:14px; padding:14px 16px; margin-bottom:12px; display:flex; align-items:center; gap:12px;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              <div style="flex:1;">
                <div style="font-size:10px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:0.6px; margin-bottom:4px;">Street Address</div>
                <input type="text" id="wa-address1" placeholder="House No, Street, Locality" autocomplete="address-line1"
                  style="width:100%; border:none; outline:none; font-size:14px; font-weight:500; color:#0f172a; background:transparent; padding:0;">
              </div>
            </div>

            <!-- Address Line 2 (optional) -->
            <div style="background:#fff; border:1.5px solid #e2e8f0; border-radius:14px; padding:14px 16px; margin-bottom:12px; display:flex; align-items:center; gap:12px;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
              <div style="flex:1;">
                <div style="font-size:10px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:0.6px; margin-bottom:4px;">Address Line 2 <span style="color:#94a3b8; text-transform:none;">(Optional)</span></div>
                <input type="text" id="wa-address2" placeholder="Apartment, Suite, etc." autocomplete="address-line2"
                  style="width:100%; border:none; outline:none; font-size:14px; font-weight:500; color:#0f172a; background:transparent; padding:0;">
              </div>
            </div>

            <!-- PIN Code + State -->
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:12px;">
              <div style="background:#fff; border:1.5px solid #e2e8f0; border-radius:14px; padding:14px 16px; display:flex; align-items:center; gap:10px;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-4 0v2"/></svg>
                <div style="flex:1;">
                  <div style="font-size:10px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:0.6px; margin-bottom:4px;">
                    PIN Code
                    <span id="wa-pin-spinner" style="display:none; font-size:10px;">⏳</span>
                    <span id="wa-pin-status" style="font-size:10px; font-weight:600; margin-left:4px;"></span>
                  </div>
                  <input type="text" id="wa-zip" placeholder="400001" maxlength="6" autocomplete="postal-code"
                    oninput="if(this.value.length===6) waLookupPincode(this.value); else waResetPinFields();"
                    style="width:100%; border:none; outline:none; font-size:14px; font-weight:500; color:#0f172a; background:transparent; padding:0;">
                </div>
              </div>
              <div style="background:#fff; border:1.5px solid #e2e8f0; border-radius:14px; padding:14px 16px; display:flex; align-items:center; gap:10px;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                <div style="flex:1;">
                  <div style="font-size:10px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:0.6px; margin-bottom:4px;">State</div>
                  <!-- State text (hidden, used as value store by JS after PIN auto-fill) -->
                  <input type="text" id="wa-province" placeholder="Select State" autocomplete="address-level1"
                    style="display:none; width:100%; border:none; outline:none; font-size:14px; font-weight:500; color:#0f172a; background:transparent; padding:0;">
                  <!-- State dropdown (always visible by default) -->
                  <select id="wa-province-select"
                    onchange="document.getElementById('wa-province').value = this.value;"
                    style="width:100%; border:none; outline:none; font-size:14px; font-weight:500; color:#0f172a; background:transparent; padding:0; cursor:pointer; -webkit-appearance:none; appearance:none;">
                    <option value="">Select State</option>
                    <option value="Andhra Pradesh">Andhra Pradesh</option>
                    <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                    <option value="Assam">Assam</option>
                    <option value="Bihar">Bihar</option>
                    <option value="Chhattisgarh">Chhattisgarh</option>
                    <option value="Goa">Goa</option>
                    <option value="Gujarat">Gujarat</option>
                    <option value="Haryana">Haryana</option>
                    <option value="Himachal Pradesh">Himachal Pradesh</option>
                    <option value="Jharkhand">Jharkhand</option>
                    <option value="Karnataka">Karnataka</option>
                    <option value="Kerala">Kerala</option>
                    <option value="Madhya Pradesh">Madhya Pradesh</option>
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Manipur">Manipur</option>
                    <option value="Meghalaya">Meghalaya</option>
                    <option value="Mizoram">Mizoram</option>
                    <option value="Nagaland">Nagaland</option>
                    <option value="Odisha">Odisha</option>
                    <option value="Punjab">Punjab</option>
                    <option value="Rajasthan">Rajasthan</option>
                    <option value="Sikkim">Sikkim</option>
                    <option value="Tamil Nadu">Tamil Nadu</option>
                    <option value="Telangana">Telangana</option>
                    <option value="Tripura">Tripura</option>
                    <option value="Uttar Pradesh">Uttar Pradesh</option>
                    <option value="Uttarakhand">Uttarakhand</option>
                    <option value="West Bengal">West Bengal</option>
                    <optgroup label="Union Territories">
                      <option value="Andaman and Nicobar Islands">Andaman and Nicobar Islands</option>
                      <option value="Chandigarh">Chandigarh</option>
                      <option value="Dadra and Nagar Haveli and Daman and Diu">Dadra and Nagar Haveli and Daman and Diu</option>
                      <option value="Delhi">Delhi</option>
                      <option value="Jammu and Kashmir">Jammu and Kashmir</option>
                      <option value="Ladakh">Ladakh</option>
                      <option value="Lakshadweep">Lakshadweep</option>
                      <option value="Puducherry">Puducherry</option>
                    </optgroup>
                  </select>
                </div>
              </div>
            </div>

            <!-- City + District -->
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:12px;">
              <div style="background:#fff; border:1.5px solid #e2e8f0; border-radius:14px; padding:14px 16px; display:flex; align-items:center; gap:10px;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                <div style="flex:1; min-width:0;">
                  <div style="font-size:10px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:0.6px; margin-bottom:4px;">City / Post Office</div>
                  <!-- Text input (default) -->
                  <input type="text" id="wa-city" placeholder="Enter City" autocomplete="address-level2"
                    style="width:100%; border:none; outline:none; font-size:14px; font-weight:500; color:#0f172a; background:transparent; padding:0;">
                  <!-- Dropdown (PIN found) -->
                  <select id="wa-addr-city-select"
                    style="display:none; width:100%; border:none; outline:none; font-size:14px; font-weight:500; color:#0f172a; background:transparent; padding:0; cursor:pointer;"></select>
                </div>
              </div>
              <div style="background:#fff; border:1.5px solid #e2e8f0; border-radius:14px; padding:14px 16px; display:flex; align-items:center; gap:10px;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <div style="flex:1;">
                  <div style="font-size:10px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:0.6px; margin-bottom:4px;">District</div>
                  <input type="text" id="wa-addr-district" placeholder="Enter District"
                    style="width:100%; border:none; outline:none; font-size:14px; font-weight:500; color:#0f172a; background:transparent; padding:0;">
                </div>
              </div>
            </div>

            <!-- PIN Error -->
            <div id="wa-pin-error" style="display:none; font-size:12px; color:#f59e0b; margin-bottom:12px; padding:10px 14px; background:#fffbeb; border:1px solid #fde68a; border-radius:10px;"></div>

            <!-- Why address info box -->
            <div style="background:#f0fdf4; border:1.5px solid #bbf7d0; border-radius:14px; padding:14px 16px; margin-bottom:20px; display:flex; align-items:center; justify-content:space-between; gap:12px; cursor:pointer;">
              <div style="display:flex; gap:12px; align-items:flex-start;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" style="flex-shrink:0; margin-top:2px;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
                <div>
                  <div style="font-size:13px; font-weight:700; color:#15803d; margin-bottom:2px;">Why we need your address?</div>
                  <div style="font-size:12px; color:#16a34a; line-height:1.5;">To ensure safe delivery, faster returns &amp; real-time order updates</div>
                </div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </div>

            <!-- Save Address Button -->
            <button type="button" id="wa-save-addr-btn" onclick="waSaveNewAddress()"
              style="width:100%; padding:18px; background:#0f172a; color:#fff; border:none; border-radius:14px; font-size:16px; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; margin-bottom:12px; transition:0.2s;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              Save & Deliver to this Address
            </button>
            <div style="text-align:center; font-size:11px; color:#16a34a; font-weight:500; margin-bottom:24px; display:flex; justify-content:center; align-items:center; gap:4px;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              We respect your privacy. Your information is safe with us.
            </div>

            <!-- Dummy IDs for JS compat -->
            <div id="wa-city-select-wrapper" style="display:none;"></div>

          </div><!-- /wa-new-address-form -->

          <!-- Coupon Code -->
          <div style="display:flex; align-items:center; gap:0; margin-bottom:20px; background:#fff; border:1.5px solid #e2e8f0; border-radius:14px; overflow:hidden; padding:4px 4px 4px 16px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2.5" style="flex-shrink:0;"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
            <input type="text" id="wa-coupon-code" placeholder="Have a discount code?" autocomplete="off"
              style="flex:1; border:none; outline:none; padding:12px 10px; font-size:14px; font-weight:500; color:#0f172a; background:transparent; text-transform:uppercase;">
            <button type="button" onclick="waApplyCoupon()"
              style="padding:10px 20px; background:#f0fdf4; color:#16a34a; border:1.5px solid #bbf7d0; border-radius:10px; font-weight:700; font-size:13px; cursor:pointer; white-space:nowrap; margin:0;">
              Apply
            </button>
          </div>
          <div id="wa-coupon-msg" style="display:none; margin:-12px 0 16px 0; font-size:12px; padding:8px 12px; border-radius:8px;"></div>

          <!-- Order Summary -->
          <div style="background:#fff; border:1.5px solid #e2e8f0; border-radius:14px; padding:20px; margin-bottom:24px;">
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:16px;">
              <div style="font-size:16px; font-weight:800; color:#0f172a;">Order Summary</div>
              
              <div id="wa-yay-saving" style="display:{% if cart.total_discount > 0 %}flex{% else %}none{% endif %}; font-size:12px; font-weight:700; color:#16a34a; background:#f0fdf4; border:1px solid #bbf7d0; padding:3px 10px; border-radius:20px; align-items:center;">
                You Save <span id="wa-yay-amt" style="margin-left:3px;">{{ cart.total_discount | money_without_trailing_zeros }}</span>
              </div>
            </div>

            <div style="display:flex; justify-content:space-between; margin-bottom:12px; font-size:14px; color:#475569;">
              <span>Subtotal (MRP)</span>
              <span id="wa-subtotal" style="font-weight:600; color:#0f172a;">₹{{ cart.original_total_price | divided_by: 100.00 }}</span>
            </div>
            <div id="wa-discount-row" style="display:{% if cart.total_discount > 0 %}flex{% else %}none{% endif %}; justify-content:space-between; margin-bottom:12px; font-size:14px; color:#16a34a; font-weight:600;">
              <span>Cart Discounts</span>
              <span id="wa-discount-amt">-₹{{ cart.total_discount | divided_by: 100.00 }}</span>
            </div>
            <div id="wa-coupon-discount-row" style="display:none; justify-content:space-between; margin-bottom:12px; font-size:14px; color:#059669; font-weight:600;">
              <span>Coupon Discount</span>
              <span id="wa-coupon-discount-amt">-₹0</span>
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom:16px; font-size:14px; color:#475569;">
              <span>Shipping</span>
              <span style="color:#16a34a; font-weight:700; background:#f0fdf4; border:1px solid #bbf7d0; padding:2px 10px; border-radius:20px; font-size:12px;">FREE</span>
            </div>

            <!-- Hidden total for JS -->
            <div style="display:none;">
              <span id="wa-total" data-base-total="{{ cart.total_price | divided_by: 100.00 }}">₹{{ cart.total_price | divided_by: 100.00 }}</span>
            </div>
          </div>

        </div>

                <!-- STEP 4: PAYMENT -->
        <div id="wa-step-4" style="display:none;">          <!-- Coupon -->
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:24px;">
            <div>
              <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <h2 class="wa-section-title" style="font-size:24px; margin:0; letter-spacing:-0.5px;">Payment Method</h2>
              </div>
              <p class="wa-section-desc" style="margin:0; font-size:13px; color:#64748b;">Choose the safest and most convenient way to pay.</p>
            </div>
            <div style="display:flex; align-items:center; gap:4px; font-size:11px; color:#16a34a; background:#f0fdf4; border:1px solid #bbf7d0; padding:4px 10px; border-radius:20px; font-weight:600; flex-shrink:0;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> Safe & Secure
            </div>
          </div>

          <div id="wa-payment-error" style="color: #ef4444; font-size: 13px; font-weight: 500; margin-bottom: 12px; display: none; padding:10px; background:#fef2f2; border:1px solid #fecaca; border-radius:8px;"></div>
          
          <div id="wa-payment-methods-container" style="display:flex; flex-direction:column; gap:16px; margin-bottom:24px;">
            <!-- Rendered dynamically by waGoToStep(4) -->
          </div>

          <!-- Store Credit / Wallet Section (shown only if store_credit_enabled) -->
          <div id="wa-wallet-section" style="display:none; margin-bottom:20px;">
            <div style="border:1.5px solid #10b981; border-radius:14px; overflow:hidden; background:#f0fdf4;">
              <div style="display:flex; align-items:center; justify-content:space-between; padding:14px 16px; background:#ecfdf5; border-bottom:1px dashed #a7f3d0;">
                <div style="display:flex; align-items:center; gap:10px;">
                  <div style="width:36px; height:36px; background:#10b981; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>
                  </div>
                  <div>
                    <div style="font-weight:700; font-size:14px; color:#065f46;">Wallet Balance</div>
                    <div style="font-size:12px; color:#047857;">Available: <strong id="wa-wallet-balance-display">₹0</strong></div>
                  </div>
                </div>
                <div>
                  <div style="font-size:11px; color:#047857; text-align:right; margin-bottom:4px;" id="wa-wallet-usable-text">Max usable: ₹0</div>
                  <button type="button" id="wa-wallet-toggle-btn" onclick="waToggleWalletCredit()" style="background:#10b981; color:#fff; border:none; padding:8px 16px; border-radius:8px; font-weight:700; font-size:13px; cursor:pointer; transition:0.2s;">
                    Apply Wallet
                  </button>
                </div>
              </div>
              <div id="wa-wallet-applied-row" style="display:none; padding:10px 16px; display:none; align-items:center; justify-content:space-between; background:#d1fae5;">
                <span style="font-size:13px; font-weight:600; color:#065f46;">✓ Wallet Discount Applied</span>
                <span id="wa-wallet-applied-amt" style="font-size:14px; font-weight:800; color:#059669;"></span>
              </div>
            </div>
          </div>


          <!-- Trust Badges Footer -->
          <div style="display:flex; justify-content:space-between; align-items:flex-start; padding:16px 0; border-top:1px dashed #e2e8f0; margin-bottom:24px;">
            <div style="text-align:center; flex:1;">
              <div style="display:flex; justify-content:center; margin-bottom:6px;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0f172a" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div>
              <div style="font-size:11px; font-weight:700; color:#0f172a; margin-bottom:2px;">Best Price</div>
              <div style="font-size:10px; color:#64748b;">You're getting the best deal!</div>
            </div>
            <div style="text-align:center; flex:1; border-left:1px solid #f1f5f9; border-right:1px solid #f1f5f9;">
              <div style="display:flex; justify-content:center; margin-bottom:6px;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0f172a" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg></div>
              <div style="font-size:11px; font-weight:700; color:#0f172a; margin-bottom:2px;">Easy Returns</div>
              <div style="font-size:10px; color:#64748b;">7-day easy return policy</div>
            </div>
            <div style="text-align:center; flex:1;">
              <div style="display:flex; justify-content:center; margin-bottom:6px;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0f172a" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 10h.01"/><path d="M15 10h.01"/></svg></div>
              <div style="font-size:11px; font-weight:700; color:#0f172a; margin-bottom:2px;">24/7 Support</div>
              <div style="font-size:10px; color:#64748b;">We're here to help you anytime</div>
            </div>
          </div>

          <button type="button" class="wa-btn-primary" id="wa-cod-btn" onclick="waPayNow()" style="background:#0f172a; padding:18px; margin-bottom:12px; display:flex; flex-direction:column; align-items:center; gap:2px;">
            <div style="display:flex; align-items:center; gap:8px;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <span id="wa-pay-btn-text" style="font-size:16px;">Pay Securely Now →</span>
            </div>
            <span id="wa-pay-btn-subtext" style="font-size:11px; font-weight:500; color:rgba(255,255,255,0.8);">Complete your order and save ₹45</span>
          </button>
          
          <button type="button" class="wa-btn-secondary" onclick="waBackToAddress()" style="width:100%; padding:16px; background:#fff; border:1px solid #e2e8f0; border-radius:10px; color:#475569; font-weight:600; font-size:14px; cursor:pointer; margin-bottom:24px; transition:0.2s;">
            ← Back to Address
          </button>

          <div style="text-align:center; font-size:11px; color:#64748b; margin-bottom:24px; display:flex; justify-content:center; align-items:center; gap:4px;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Your security is our priority. We never share your details.
          </div>
        </div>

        <!-- SUCCESS SCREEN -->
        <div class="wa-success-screen" id="wa-success-screen">
          <div class="wa-success-checkmark">✓</div>
          <h2 class="wa-section-title">Order Placed!</h2>
          <p class="wa-section-desc" style="max-width:320px; margin:0 auto 32px;">Your COD order has been successfully placed. You will receive a confirmation on WhatsApp shortly.</p>
          <button type="button" class="wa-btn-primary" style="max-width:280px;" onclick="window.location='/'">Continue Shopping</button>
        </div>

      </div>
    </div>
  </div>
</div>

<script>
  const WA_API_BASE = 'https://checkout-app-one-lilac.vercel.app/api';
  const MERCHANT_KEY = '{{MERCHANT_API_KEY}}';

  let waPhone = null;
  let waSignature = null;
  let waOtpSendCount = 0;
  let waResendInterval = null;
  let waEditingAddressId = null;
  let waSelectedAddress = null;
  let waAddresses = [];
  let waDraftOrderId = null;
  let waInvoiceUrl = null;
  let waEmail = '';
  let waAppliedDiscountCode = null;
  let waShopifyAddressesLoaded = false;
  let waMapSearchTimer = null;
  let waPaymentSettings = {};

  document.addEventListener('DOMContentLoaded', () => {
    if (!localStorage.getItem('fit11_device_id')) {
      localStorage.setItem('fit11_device_id', 'dev_' + Math.random().toString(36).substr(2, 9));
    }
    // Capture UTM parameters for Ad Tracking
    try {
      const params = new URLSearchParams(window.location.search);
      let utm_source = params.get('utm_source');
      let utm_medium = params.get('utm_medium');
      let utm_campaign = params.get('utm_campaign');
      const fbclid = params.get('fbclid');
      const gclid = params.get('gclid');
      const referrer = document.referrer;
      
      if (!utm_source) {
        if (fbclid) { utm_source = 'Meta Ads'; utm_medium = 'cpc'; }
        else if (gclid) { utm_source = 'Google Ads'; utm_medium = 'cpc'; }
        else if (referrer && (referrer.includes('facebook.com') || referrer.includes('instagram.com'))) { 
          utm_source = 'Meta Organic'; utm_medium = 'social'; 
        }
      }
      
      if (utm_source || referrer) {
        let utmData = JSON.parse(localStorage.getItem('wa_utm_data') || '{}');
        if (utm_source) {
          utmData.utm_source = utm_source;
          if (utm_medium) utmData.utm_medium = utm_medium;
          if (utm_campaign) utmData.utm_campaign = utm_campaign;
        }
        if (!utmData.referrer && referrer && !referrer.includes(window.location.hostname)) {
          utmData.referrer = referrer;
        }
        localStorage.setItem('wa_utm_data', JSON.stringify(utmData));
      }
    } catch(e) { console.error('UTM tracking error', e); }
  });

  // ── MAP / LOCATION SEARCH (OpenStreetMap Nominatim - FREE, no API key) ──
  function waSearchAddress(query) {
    clearTimeout(waMapSearchTimer);
    const sugBox = document.getElementById('wa-map-suggestions');
    if (!query || query.length < 3) { sugBox.style.display = 'none'; return; }
    waMapSearchTimer = setTimeout(async () => {
      try {
        const res = await fetch(\\`https://nominatim.openstreetmap.org/search?format=json&countrycodes=in&addressdetails=1&limit=6&q=${encodeURIComponent(query)}\\`, {
          headers: { 'Accept-Language': 'en' }
        });
        const results = await res.json();
        sugBox.innerHTML = '';
        if (!results.length) {
          sugBox.innerHTML = '<div style="padding:12px;font-size:13px;color:#94a3b8;">No results found</div>';
        } else {
          results.forEach(r => {
            const div = document.createElement('div');
            div.style.cssText = 'padding:10px 14px;cursor:pointer;font-size:13px;border-bottom:1px solid #f1f5f9;color:#374151;';
            div.innerText = r.display_name;
            div.onmouseenter = () => div.style.background = '#f8fafc';
            div.onmouseleave = () => div.style.background = '';
            div.onclick = () => waFillFromNominatim(r);
            sugBox.appendChild(div);
          });
        }
        sugBox.style.display = 'block';
      } catch(e) { sugBox.style.display = 'none'; }
    }, 400);
  }

  function waFillFromNominatim(r) {
    const a = r.address || {};
    // Fill fields
    const city = a.city || a.town || a.village || a.suburb || a.neighbourhood || '';
    const district = a.county || a.state_district || '';
    const state = a.state || '';
    const postcode = a.postcode || '';
    const road = [a.house_number, a.road, a.suburb].filter(Boolean).join(', ');

    if (road) document.getElementById('wa-addr-street').value = road;
    if (city) { const c = document.getElementById('wa-addr-city-input') || document.getElementById('wa-addr-city'); if(c) c.value = city; }
    if (district) document.getElementById('wa-addr-district').value = district;
    if (postcode) document.getElementById('wa-addr-zip').value = postcode;

    // Set state dropdown
    if (state) {
      const sel = document.getElementById('wa-addr-state');
      for (let opt of sel.options) {
        if (opt.value.toLowerCase().includes(state.toLowerCase()) || state.toLowerCase().includes(opt.value.toLowerCase())) {
          opt.selected = true; break;
        }
      }
    }

    // Clear search
    document.getElementById('wa-map-search').value = city || state || '';
    document.getElementById('wa-map-suggestions').style.display = 'none';
  }

  function waUseMyLocation() {
    if (!navigator.geolocation) return alert('Geolocation not supported on this device.');
    const btn = event.target;
    btn.innerHTML = '⏳';
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const { latitude, longitude } = pos.coords;
        const res = await fetch(\\`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1\\`, {
          headers: { 'Accept-Language': 'en' }
        });
        const r = await res.json();
        waFillFromNominatim(r);
        document.getElementById('wa-map-search').value = '📍 Location detected';
      } catch(e) {
        alert('Could not detect location. Please search manually.');
      } finally { btn.innerHTML = '📍'; }
    }, () => { alert('Location access denied. Please search manually.'); btn.innerHTML = '📍'; });
  }

  // Close suggestions when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest || !e.target.closest('#wa-new-address-form')) {
      const sugBox = document.getElementById('wa-map-suggestions');
      if (sugBox) sugBox.style.display = 'none';
    }
  });

  
  function waApplyEmailSetting(ps) {
    const emailInput = document.getElementById('wa-email');
    const emailBadge = document.getElementById('wa-email-badge');
    const emailLabel = emailBadge ? emailBadge.closest('label') : null;
    
    const isRequired = ps && ps.email_required === true;
    
    if (emailInput) {
      emailInput.required = isRequired;
      emailInput.placeholder = isRequired ? 'your@email.com *' : 'your@email.com (Optional)';
    }
    if (emailBadge) {
      emailBadge.textContent = isRequired ? '(Required *)' : '(Optional)';
      emailBadge.style.color = isRequired ? '#ef4444' : '#94a3b8';
    }
  }
  
  async function openWaModal() {
    const overlay = document.getElementById('wa-otp-overlay');
    if (!overlay) return;
    if (overlay.parentNode !== document.body) {
      document.body.appendChild(overlay);
    }
    overlay.style.cssText = 'position:fixed!important;top:0!important;left:0!important;width:100vw!important;height:100vh!important;z-index:2147483647!important;display:flex!important;align-items:flex-start!important;justify-content:center!important;overflow-y:auto!important;padding:0!important;background:rgba(15,23,42,0.6)!important;backdrop-filter:blur(6px)!important;-webkit-backdrop-filter:blur(6px)!important;';
    document.body.style.overflow = 'hidden';
    waResetModal();

    // Pre-fill from Shopify logged-in customer data
    const sc = window._shopifyCustomer;
    if (sc && sc.logged_in) {
      // Pre-fill phone if available
      if (sc.phone) {
        const cleanPhone = sc.phone.replace(/\D/g, '').replace(/^91/, '');
        document.getElementById('wa-phone').value = cleanPhone;
      }
      // Pre-fill email
      if (sc.email) {
        document.getElementById('wa-email').value = sc.email;
      }
      // Pre-load Shopify addresses (merge with network_addresses later)
      if (sc.addresses && sc.addresses.length > 0) {
        waAddresses = sc.addresses.map(a => ({
          id: 'shopify_' + a.id,
          first_name: a.first_name || '',
          last_name: a.last_name || '',
          address1: a.address1 || '',
          city: a.city || '',
          zip: a.zip || '',
          province: a.province || '',
          country: a.country || 'India'
        }));
        waShopifyAddressesLoaded = true;
      }
    }

    // Check if they already verified in this tab session
    const cachedPhone = sessionStorage.getItem('fit11_verified_phone');
    if (cachedPhone) {
      waPhone = cachedPhone;
      document.getElementById('wa-step-1').style.display = 'none';
      document.getElementById('wa-step-2').style.display = 'none';
      document.getElementById('wa-step-3').style.display = 'block';
      const cachedEmail = sessionStorage.getItem('fit11_verified_email');
      if (cachedEmail) document.getElementById('wa-email').value = cachedEmail;
      waSetStep(3);
      loadAddresses();
      calculateCheckoutTotals();
      return; // Skip identify check completely!
    }

    // Check identity via device (for "Welcome Back" flow if no session cache)
    try {
      const device_id = localStorage.getItem('fit11_device_id');
      const res = await fetch(\\`${WA_API_BASE}/identify\\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_id, merchant_key: MERCHANT_KEY })
      });
      const data = await res.json();

      // ── Apply branding & settings from identify response immediately ──────────
      if (data.payment_settings && Object.keys(data.payment_settings).length > 0) {
        waPaymentSettings = data.payment_settings;
        const _ps = data.payment_settings;
        const _sv = (name, val, fb) => document.documentElement.style.setProperty(name, val || fb);
        _sv('--wa-theme',      _ps.theme_color,    '#0f172a');
        _sv('--wa-bg',         _ps.bg_main,        '#f1f5f9');
        _sv('--wa-card-bg',    _ps.bg_card,        '#ffffff');
        _sv('--wa-header-bg',  _ps.bg_header,      '#0f172a');
        _sv('--wa-heading',    _ps.text_heading,   '#0f172a');
        _sv('--wa-subheading', _ps.text_subheading,'#64748b');
        _sv('--wa-label',      _ps.text_label,     '#374151');
        _sv('--wa-success',    _ps.accent_success, '#16a34a');
        _sv('--wa-border',     _ps.accent_border,  '#e2e8f0');

        // Apply logo to BOTH left panel and mobile header
        if (_ps.logo_url) {
          const logoImg = \\`<img src="${_ps.logo_url}" alt="Store Logo" style="max-height:40px;max-width:150px;object-fit:contain;display:block;" />\\`;
          const leftBrand = document.getElementById('wa-brand-name-left');
          if (leftBrand) leftBrand.outerHTML = \\`<div id="wa-brand-name-left" style="display:flex; align-items:center; margin-bottom:24px;">
          {% if settings.logo %}
            <img src="{{ settings.logo | img_url: 'master' }}" alt="{{ shop.name }}" style="height:40px; max-width:150px; object-fit:contain; flex-shrink:1;">
          {% else %}
            <span id="wa-brand-text-left" style="font-weight:800; font-size:22px; text-transform:uppercase;">{{ shop.domain | remove: '.myshopify.com' }}</span>
          {% endif %}
        </div>\\`;
          const mobileBrand = document.getElementById('wa-brand-name-mobile');
          if (mobileBrand) mobileBrand.innerHTML = logoImg;
        }

        // Apply email required/optional
        const _emailInput = document.getElementById('wa-email');
        const _emailBadge = document.getElementById('wa-email-badge');
        if (_ps.email_required === true) {
          if (_emailInput) { _emailInput.required = true; _emailInput.placeholder = 'you@example.com'; }
          if (_emailBadge) { _emailBadge.textContent = '(Required)'; _emailBadge.style.color = '#f59e0b'; }
        } else {
          if (_emailInput) { _emailInput.required = false; _emailInput.placeholder = 'you@example.com (Optional)'; }
          if (_emailBadge) { _emailBadge.textContent = '(Optional)'; _emailBadge.style.color = '#94a3b8'; }
        }
      }

      
      if (data.identified && data.masked_phone) {
        const title1 = document.getElementById('wa-title-1');
        const desc1 = document.getElementById('wa-desc-1');
        if (title1) title1.innerText = 'Welcome Back!';
        if (desc1) desc1.innerText = 'Continue as ' + data.masked_phone + '?';
        
        // If we previously deleted the title/desc, inject a clean welcome message so the user isn't confused
        if (!title1 && !document.getElementById('wa-dynamic-welcome')) {
          const step1 = document.getElementById('wa-step-1');
          if (step1) {
             const welcomeHtml = \\`
               <div id="wa-dynamic-welcome" style="margin-bottom:24px;">
                 <h2 style="font-size:26px; font-weight:800; margin-bottom:8px; color:#0f172a; letter-spacing:-0.5px;">Welcome Back!</h2>
                 <p style="font-size:15px; color:#475569;">Continue as <strong style="color:#0f172a;">${data.masked_phone}</strong>?</p>
               </div>
             \\`;
             step1.insertAdjacentHTML('afterbegin', welcomeHtml);
          }
        }

        const pCont = document.getElementById('wa-phone-container'); if(pCont) pCont.style.display = 'none';
        const pSec = document.getElementById('wa-phone-input-section'); if(pSec) pSec.style.display = 'none';
        const midTb = document.getElementById('wa-mid-trust-badges'); if(midTb) midTb.style.display = 'none';
        const greenBox = document.getElementById('wa-green-otp-box'); if(greenBox) greenBox.style.display = 'none';
        document.getElementById('wa-switch-account').style.display = 'block';
        waPhone = 'MASKED';
        if (data.email) {
          document.getElementById('wa-email').value = data.email;
        }
      }
    } catch (e) { /* Silent fail */ }
  }

  function waResetModal() {
    document.getElementById('wa-step-1').style.display = 'block';
    document.getElementById('wa-step-2').style.display = 'none';
    document.getElementById('wa-step-3').style.display = 'none';
    document.getElementById('wa-success-screen').style.display = 'none';
    document.getElementById('wa-steps-indicator').style.display = 'flex';
    waSetStep(1);
  }

  
  function waSetStep(step) {
    let uiStep = step;
    if (step === 4) uiStep = 3;
    [1,2,3].forEach(i => {
      const dot = document.getElementById('wa-dot-' + i);
      if (dot) {
        if(i < uiStep) { 
          dot.innerHTML = i;
          dot.style.background = '#16a34a'; dot.style.color = '#fff'; dot.style.border = 'none'; 
        } else if(i === uiStep) { 
          dot.innerHTML = i;
          dot.style.background = '#0f172a'; dot.style.color = '#fff'; dot.style.border = 'none'; 
        } else { 
          dot.innerHTML = i;
          dot.style.background = '#fff'; dot.style.color = '#94a3b8'; dot.style.border = '1px solid #e2e8f0'; 
        }
      }
    });
    [1,2].forEach(i => {
      const line = document.getElementById('wa-line-' + i);
      if (line) line.style.background = i < uiStep ? '#16a34a' : '#e2e8f0';
    });
    const lbl = document.getElementById('wa-step-label');
    if (lbl) lbl.innerText = 'STEP ' + uiStep + ' OF 3';
  
    const indicator = document.getElementById('wa-steps-indicator');
    if (indicator) {
      indicator.style.display = 'flex';
    }
    const dotsContainer = document.getElementById('wa-dots-container');
    if (dotsContainer) {
      dotsContainer.style.display = 'none';
    }
    
    // Toggle Trust Badges & Change Number button based on step
    const trustBadges = document.getElementById('wa-top-trust-badges');
    const changeNumBtn = document.getElementById('wa-change-number-btn');
    if (trustBadges) trustBadges.style.display = uiStep >= 3 ? 'none' : 'flex';
    if (changeNumBtn) changeNumBtn.style.display = uiStep >= 3 ? 'block' : 'none';
  }

  function waGoToStep(step) {
    if (step === 4) {
      const emailEl = document.getElementById('wa-email');
      let errEl = document.getElementById('wa-email-error');
      if (!errEl) {
        errEl = document.createElement('div');
        errEl.id = 'wa-email-error';
        errEl.style.color = '#ef4444';
        errEl.style.fontSize = '12px';
        errEl.style.marginTop = '6px';
        errEl.style.fontWeight = '600';
        if (emailEl) emailEl.parentElement.parentElement.parentElement.appendChild(errEl);
      }
      
      if (emailEl && waPaymentSettings && waPaymentSettings.email_required === true && !emailEl.value.trim()) {
        errEl.innerText = 'Please enter your email address to continue.';
        errEl.style.display = 'block';
        emailEl.focus();
        return;
      }
      if (emailEl && emailEl.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEl.value.trim())) {
        errEl.innerText = 'Please enter a valid email address.';
        errEl.style.display = 'block';
        emailEl.focus();
        return;
      }
      if (errEl) errEl.style.display = 'none';
      if (emailEl) waEmail = emailEl.value.trim();
    }

    document.getElementById('wa-step-1').style.display = 'none';
    document.getElementById('wa-step-2').style.display = 'none';
    document.getElementById('wa-step-3').style.display = 'none';
    document.getElementById('wa-step-4').style.display = 'none';
    document.getElementById('wa-step-' + step).style.display = 'block';
    waSetStep(step);
    if (step === 4) {
      if (typeof renderPaymentMethods === 'function') {
        renderPaymentMethods();
      }
    }
  }

  function closeWaModal() {
    const overlay = document.getElementById('wa-otp-overlay');
    overlay.style.display = 'none';
    document.body.style.overflow = '';
  }

  function waSwitchAccount(e) {
    if (e) e.preventDefault();
    const title1 = document.getElementById('wa-title-1');
    if (title1) title1.innerText = 'Swift Checkout';
    const desc1 = document.getElementById('wa-desc-1');
    if (desc1) desc1.innerText = 'Enter your WhatsApp number to receive an OTP and complete your order in seconds.';
    
    // Remove the dynamic welcome message if it exists
    const dynWelcome = document.getElementById('wa-dynamic-welcome');
    if (dynWelcome) dynWelcome.remove();
    
    const pCont = document.getElementById('wa-phone-container'); if(pCont) pCont.style.display = 'block';
    const pSec = document.getElementById('wa-phone-input-section'); if(pSec) pSec.style.display = 'block';
    const midTb = document.getElementById('wa-mid-trust-badges'); if(midTb) midTb.style.display = 'flex';
    const greenBox = document.getElementById('wa-green-otp-box'); if(greenBox) greenBox.style.display = 'flex';
    
    const switchAcct = document.getElementById('wa-switch-account'); if (switchAcct) switchAcct.style.display = 'none';
    waPhone = null;
    
    const phoneInput = document.getElementById('wa-phone');
    if (phoneInput) {
      phoneInput.value = '';
      setTimeout(() => phoneInput.focus(), 100);
    }
    
    if (typeof waGoToStep !== 'undefined') {
      waGoToStep(1);
    }
  }

  // OTP box navigation
  function waOtpInput(el, idx) {
    el.value = el.value.replace(/\D/g, '');
    if (el.value.length === 1) {
      const boxes = document.querySelectorAll('.wa-otp-box');
      if (idx < 3) boxes[idx + 1].focus();
    }
    if (waGetOtp().length === 4) {
      verifyWaOtp();
    }
  }
  function waOtpKey(e, idx) {
    if (e.key === 'Backspace') {
      const boxes = document.querySelectorAll('.wa-otp-box');
      if (!boxes[idx].value && idx > 0) boxes[idx - 1].focus();
    }
  }
  function waGetOtp() {
    return [...document.querySelectorAll('.wa-otp-box')].map(b => b.value).join('');
  }

  async function sendWaOtp() {
    let phoneInput = document.getElementById('wa-phone').value.trim();
    if (waPhone !== 'MASKED') {
      if (phoneInput.length < 10) return alert('Please enter a valid 10-digit mobile number');
      waPhone = phoneInput;
    }
    // Validation moved to final checkout / address save
    const btn = document.getElementById('wa-send-btn');
    btn.disabled = true; btn.innerHTML = 'Sending OTP...';
    try {
      const payload = { 
        merchant_key: MERCHANT_KEY,
        device_id: localStorage.getItem('fit11_device_id') || localStorage.getItem('wa_device_id')
      };
      if (waPhone !== 'MASKED') payload.phone = waPhone;
      const res = await fetch(\\`${WA_API_BASE}/send-otp\\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      waOtpSendCount++;
      startResendTimer();
      
      waSignature = data.signature;
      if (data.real_phone) waPhone = data.real_phone;
      document.getElementById('wa-otp-desc').innerText = '+91 ' + waPhone;
      document.getElementById('wa-step-1').style.display = 'none';
      document.getElementById('wa-step-2').style.display = 'block';
      waSetStep(2);
      setTimeout(() => document.querySelectorAll('.wa-otp-box')[0].focus(), 100);
    } catch (err) {
      const errMsg = err.message || 'Failed to send OTP. Please try again.';
      console.error('OTP Error:', errMsg);
      alert(errMsg);
    } finally {
      btn.disabled = false;
      btn.innerHTML = 'Continue <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
    }
  }

  function startResendTimer() {
    clearInterval(waResendInterval);
    let timeLeft = waOtpSendCount === 1 ? 60 : 300;
    const link = document.getElementById('wa-resend-link');
    const timerText = document.getElementById('wa-resend-timer');
    
    link.style.display = 'none';
    timerText.style.display = 'inline-block';
    
    waResendInterval = setInterval(() => {
      timeLeft--;
      if (timeLeft <= 0) {
        clearInterval(waResendInterval);
        link.style.display = 'inline-block';
        timerText.style.display = 'none';
      } else {
        const m = Math.floor(timeLeft / 60);
        const s = timeLeft % 60;
        timerText.innerText = \\`Resend OTP in ${m}:${s.toString().padStart(2, '0')}\\`;
      }
    }, 1000);
  }

  async function verifyWaOtp() {
    const btn = document.getElementById('wa-verify-btn');
    if (btn.disabled) return; // Prevent double-submit
    const otp = waGetOtp();
    if (otp.length < 4) return;
    const errEl = document.getElementById('wa-otp-error');
    btn.disabled = true;
    btn.innerHTML = 'Verifying...';
    errEl.style.display = 'none';
    try {
      const res = await fetch(\\`${WA_API_BASE}/verify-otp\\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchant_key: MERCHANT_KEY,
          phone: waPhone,
          otp,
          signature: waSignature,
          device_id: localStorage.getItem('fit11_device_id'),
          email: typeof waEmail !== 'undefined' ? waEmail : undefined
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid OTP');
      
      // Save to session so they don't have to re-verify if they navigate away and come back
      sessionStorage.setItem('fit11_verified_phone', waPhone);
      if (data.profile && data.profile.email) {
        sessionStorage.setItem('fit11_verified_email', data.profile.email);
        const emailInput = document.getElementById('wa-email');
        if (emailInput) emailInput.value = data.profile.email;
      }

      // Store wallet balance from verify response (avoids extra API call at payment step)
      if (data.storeCreditBalance !== undefined) {
        waWalletBalance = parseFloat(data.storeCreditBalance) || 0;
      }
      
      document.getElementById('wa-step-2').style.display = 'none';
      document.getElementById('wa-step-3').style.display = 'block';
      waSetStep(3);
      await loadAddresses();
      await calculateCheckoutTotals();
    } catch (err) {
      errEl.innerText = err.message || 'Invalid OTP. Please try again.';
      errEl.style.display = 'block';
      document.querySelectorAll('.wa-otp-box').forEach(b => b.value = '');
      document.querySelectorAll('.wa-otp-box')[0].focus();
    } finally {
      btn.disabled = false;
      btn.innerHTML = 'Verify & Continue <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
    }
  }

  async function loadAddresses() {
    try {
      const res = await fetch(\\`${WA_API_BASE}/addresses\\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchant_key: MERCHANT_KEY, phone: waPhone, action: 'FETCH' })
      });
      const data = await res.json();
      const networkAddrs = data.addresses || [];
      
      // Combine existing loaded ones (from Shopify Liquid) and fetched ones
      const combined = [...waAddresses, ...networkAddrs];
      
      // Strong Deduplication based on address string to prevent duplicates
      const unique = [];
      const seen = new Set();
      
      for (const a of combined) {
        // Create a normalized key (lowercase, no spaces)
        const normalize = (str) => (str || '').toLowerCase().replace(/\s/g, '');
        const key = normalize(a.address1) + normalize(a.zip);
        
        if (!seen.has(key)) {
          seen.add(key);
          unique.push(a);
        } else if (String(a.id).startsWith('shopify_') && !unique.find(u => String(u.id).startsWith('shopify_') && normalize(u.address1)+normalize(u.zip) === key)) {
          // Prefer shopify address ID if we have a duplicate
          const existingIdx = unique.findIndex(u => normalize(u.address1)+normalize(u.zip) === key);
          if (existingIdx !== -1 && !String(unique[existingIdx].id).startsWith('shopify_')) {
              unique[existingIdx] = a; // Replace local with shopify equivalent
          }
        }
      }
      
      waAddresses = unique;
      renderAddresses();
    } catch (e) { renderAddresses(); }
  }

  function renderAddresses() {
    const list = document.getElementById('wa-address-list');
    list.innerHTML = '';
    if (waAddresses.length === 0) {
      waShowAddressForm();
      document.getElementById('wa-cod-btn').disabled = true;
      return;
    }
    document.getElementById('wa-add-addr-btn').style.display = 'block';
    const dh = document.getElementById('wa-deliver-here-btn'); if(dh) dh.style.display = 'flex';
    document.getElementById('wa-new-address-form').style.display = 'none';

    if (!waSelectedAddress) waSelectedAddress = waAddresses[0].id;

    // Find the selected address, fallback to first if not found
    let primary = waAddresses.find(a => a.id == waSelectedAddress) || waAddresses[0];
    waSelectedAddress = primary.id;
    const otherAddresses = waAddresses.filter(a => a.id != primary.id);

    let html = \\`
        <div class="wa-address-card selected" style="padding:16px;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start;">
            <div style="cursor:pointer; flex:1;" onclick="waSelectAddress('${primary.id}')">
              <div class="wa-addr-name">${primary.first_name} ${primary.last_name}</div>
              <div class="wa-addr-text">${primary.address1}<br/>${primary.city} - ${primary.zip}</div>
              ${primary.company ? \\`<div class="wa-addr-text" style="color:#94a3b8;">${primary.company}</div>\\` : ''}
              
              <div style="display:flex;gap:12px;margin-top:10px;position:relative;z-index:2;">
                <button onclick="(function(e){ e.stopPropagation(); waEditAddress('${primary.id}'); })(event)" style="background:none;border:none;color:#3b82f6;font-size:13px;font-weight:600;cursor:pointer;padding:4px 8px;margin-left:-8px;text-decoration:none;">Edit</button>
                <button onclick="(function(e){ e.stopPropagation(); waDeleteAddress('${primary.id}'); })(event)" style="background:none;border:none;color:#ef4444;font-size:13px;font-weight:600;cursor:pointer;padding:4px 8px;text-decoration:none;">Delete</button>
              </div>
            </div>
          </div>
        </div>
    \\`;

    // Render the rest in an accordion if there are more
    if (otherAddresses.length > 0) {
      html += \\`
        <button type="button" onclick="document.getElementById('wa-other-addresses').style.display = document.getElementById('wa-other-addresses').style.display === 'none' ? 'block' : 'none';" style="width:100%;text-align:center;background:none;border:none;color:#64748b;font-size:13px;font-weight:600;cursor:pointer;margin: 8px 0 16px;">
          View ${otherAddresses.length} Other Addresses ▼
        </button>
        <div id="wa-other-addresses" style="display:none; margin-bottom: 16px;">
      \\`;
      otherAddresses.forEach(a => {
        html += \\`
          <div class="wa-address-card" style="padding:16px;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
              <div style="cursor:pointer; flex:1;" onclick="waSelectAddress('${a.id}')">
                <div class="wa-addr-name">${a.first_name} ${a.last_name}</div>
                <div class="wa-addr-text">${a.address1}<br/>${a.city} - ${a.zip}</div>
                ${a.company ? \\`<div class="wa-addr-text" style="color:#94a3b8;">${a.company}</div>\\` : ''}
                
                <div style="display:flex;gap:12px;margin-top:10px;position:relative;z-index:2;">
                  <button onclick="(function(e){ e.stopPropagation(); waEditAddress('${a.id}'); })(event)" style="background:none;border:none;color:#3b82f6;font-size:13px;font-weight:600;cursor:pointer;padding:4px 8px;margin-left:-8px;text-decoration:none;">Edit</button>
                  <button onclick="(function(e){ e.stopPropagation(); waDeleteAddress('${a.id}'); })(event)" style="background:none;border:none;color:#ef4444;font-size:13px;font-weight:600;cursor:pointer;padding:4px 8px;text-decoration:none;">Delete</button>
                </div>
              </div>
            </div>
          </div>
        \\`;
      });
      html += \\`</div>\\`;
    }

    list.innerHTML = html;
    document.getElementById('wa-cod-btn').disabled = false;
  }

  function waShowAddressForm() {
    waEditingAddressId = null;
    document.getElementById('wa-add-addr-btn').style.display = 'none';
    const dh = document.getElementById('wa-deliver-here-btn'); if(dh) dh.style.display = 'none';
    document.getElementById('wa-new-address-form').style.display = 'block';
    document.getElementById('wa-save-addr-btn').innerText = 'Save Address';
    
    // Clear fields correctly safely
    ['wa-first-name','wa-last-name','wa-address1','wa-address2','wa-city','wa-zip','wa-province','wa-addr-district'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    
    const citySelectWrap = document.getElementById('wa-city-select-wrapper');
    if (citySelectWrap) citySelectWrap.style.display = 'none';
    const addrCityInp = document.getElementById('wa-addr-city-input');
    if (addrCityInp) addrCityInp.style.display = 'block';
    
    const addrState = document.getElementById('wa-addr-state');
    if (addrState) { addrState.readOnly = false; addrState.style.cursor = 'text'; addrState.style.background = '#fff'; }
    
    const waProv = document.getElementById('wa-province');
    if (waProv) { waProv.readOnly = false; waProv.style.cursor = 'text'; waProv.style.background = '#fff'; }
    
    const dist = document.getElementById('wa-addr-district');
    if (dist) { dist.readOnly = false; dist.style.cursor = 'text'; dist.style.background = '#fff'; }
    
    const errEl = document.getElementById('wa-pin-error');
    if (errEl) errEl.style.display = 'none';
    const statEl = document.getElementById('wa-pin-status');
    if (statEl) statEl.innerText = '';
  }

  function waEditAddress(id) {
    const addr = waAddresses.find(a => String(a.id) === String(id));
    if (!addr) return;
    waEditingAddressId = id;
    
    const addBtn = document.getElementById('wa-add-addr-btn');
    if(addBtn) addBtn.style.display = 'none';
    const dh = document.getElementById('wa-deliver-here-btn'); 
    if(dh) dh.style.display = 'none';
    
    const formEl = document.getElementById('wa-new-address-form');
    if(formEl) formEl.style.display = 'block';
    
    const saveBtn = document.getElementById('wa-save-addr-btn');
    if(saveBtn) saveBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> Update Address';
    
    if(document.getElementById('wa-first-name')) document.getElementById('wa-first-name').value = addr.first_name || '';
    if(document.getElementById('wa-last-name')) document.getElementById('wa-last-name').value = addr.last_name || '';
    if(document.getElementById('wa-address1')) document.getElementById('wa-address1').value = addr.address1 || '';
    let extractedAddr2 = addr.address2 || '';
    let extractedDistrict = addr.company ? addr.company.replace('District: ', '') : '';
    
    if (extractedAddr2.includes('District: ')) {
        const parts = extractedAddr2.split(/\s*\|?\s*District:\s*/);
        if (parts.length > 1) {
            extractedAddr2 = parts[0].trim();
            extractedDistrict = parts[1].trim();
        }
    }
    
    if(document.getElementById('wa-address2')) document.getElementById('wa-address2').value = extractedAddr2;
    if(document.getElementById('wa-zip')) document.getElementById('wa-zip').value = addr.zip || '';
    
    // City
    const cityInput = document.getElementById('wa-city');
    const citySelect = document.getElementById('wa-addr-city-select');
    if (citySelect) citySelect.style.display = 'none';
    if (cityInput) { 
        cityInput.value = addr.city || ''; 
        cityInput.style.display = 'block';
        cityInput.readOnly = false;
        cityInput.style.cursor = 'text';
    }
    
    // State
    const stateInput = document.getElementById('wa-province');
    if(stateInput) stateInput.value = addr.province || '';
    const stateSelect = document.getElementById('wa-province-select');
    if(stateSelect) {
        stateSelect.value = addr.province || '';
        stateSelect.style.display = 'block';
    }
    
    // District
    const districtInput = document.getElementById('wa-addr-district');
    if(districtInput) {
        districtInput.value = extractedDistrict;
        districtInput.readOnly = false;
        districtInput.style.cursor = 'text';
        districtInput.style.background = '#fff';
    }
    
    const errEl = document.getElementById('wa-pin-error');
    if (errEl) errEl.style.display = 'none';
    const statusEl = document.getElementById('wa-pin-status');
    if (statusEl) statusEl.innerText = '';
  }

  async function waDeleteAddress(id) {
    if (!confirm('Are you sure you want to delete this address?')) return;
    
    // Optimistically hide it
    const list = document.getElementById('wa-address-list');
    list.style.opacity = '0.5';

    try {
      await fetch(\\`${WA_API_BASE}/addresses\\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          merchant_key: MERCHANT_KEY, 
          phone: waPhone, 
          action: 'DELETE', 
          address_data: { id: id } 
        })
      });
      // Remove from memory and re-render instantly without reloading from server
      waAddresses = waAddresses.filter(a => String(a.id) !== String(id));
      renderAddresses();
    } catch (e) {
      alert('Failed to delete address.');
    } finally {
      list.style.opacity = '1';
    }
  }

  function waSelectAddress(id) {
    waSelectedAddress = id;
    renderAddresses();
  }

  // ── PINCODE LOOKUP ──
  
  // Union Territories and city-states that need dropdown
  const WA_UT_STATES = {
    'Delhi': ['New Delhi', 'North Delhi', 'South Delhi', 'East Delhi', 'West Delhi', 'Central Delhi', 'North West Delhi', 'North East Delhi', 'South West Delhi', 'Shahdara'],
    'Chandigarh': ['Chandigarh'],
    'Puducherry': ['Puducherry', 'Karaikal', 'Mahé', 'Yanam'],
    'Lakshadweep': ['Kavaratti', 'Agatti', 'Amini', 'Andrott'],
    'Dadra and Nagar Haveli and Daman and Diu': ['Daman', 'Diu', 'Silvassa'],
    'Andaman and Nicobar Islands': ['Port Blair', 'Car Nicobar', 'Campbell Bay'],
    'Ladakh': ['Leh', 'Kargil'],
    'Jammu and Kashmir': ['Jammu', 'Srinagar', 'Anantnag', 'Baramulla']
  };

  function waResetPinFields() {
    const stateInput = document.getElementById('wa-province');
    const stateSelect = document.getElementById('wa-province-select');
    const districtEl = document.getElementById('wa-addr-district');
    const cityInput = document.getElementById('wa-city');
    const citySelect = document.getElementById('wa-addr-city-select');
    const errEl = document.getElementById('wa-pin-error');
    const statusEl = document.getElementById('wa-pin-status');

    // Unlock & show text inputs
    if (stateInput) { stateInput.value = ''; stateInput.readOnly = false; stateInput.style.display = 'block'; stateInput.style.background = ''; stateInput.style.cursor = ''; }
    if (stateSelect) stateSelect.style.display = 'none';
    if (districtEl) { districtEl.value = ''; districtEl.readOnly = false; districtEl.style.background = ''; districtEl.style.cursor = ''; }
    if (cityInput) { cityInput.value = ''; cityInput.style.display = 'block'; }
    if (citySelect) { citySelect.style.display = 'none'; citySelect.innerHTML = ''; }
    if (errEl) errEl.style.display = 'none';
    if (statusEl) statusEl.textContent = '';
  }

  async function waLookupPincode(pin) {
    if (!pin || pin.length !== 6) return;
    
    const spinner = document.getElementById('wa-pin-spinner');
    const statusEl = document.getElementById('wa-pin-status');
    const errEl = document.getElementById('wa-pin-error');
    const stateInput = document.getElementById('wa-province');
    const stateSelect = document.getElementById('wa-province-select');
    const districtEl = document.getElementById('wa-addr-district');
    const cityInput = document.getElementById('wa-city');
    const citySelect = document.getElementById('wa-addr-city-select');

    if (spinner) spinner.style.display = 'inline';
    if (statusEl) statusEl.textContent = 'Looking up...';
    if (errEl) errEl.style.display = 'none';

    try {
      const res = await fetch(\\`https://api.postalpincode.in/pincode/${pin}\\`);
      const data = await res.json();

      if (data && data[0] && data[0].Status === 'Success') {
        const postOffices = data[0].PostOffice;
        const firstPo = postOffices[0];
        const stateName = firstPo.State || '';
        const districtName = firstPo.District || '';

        // Auto-fill & lock District
        if (districtEl) {
          districtEl.value = districtName;
          districtEl.readOnly = true;
          districtEl.style.background = '#f8fafc';
          districtEl.style.cursor = 'not-allowed';
        }

        // Check if this is a UT/city-state that needs a dropdown
        const isUT = WA_UT_STATES.hasOwnProperty(stateName);

        if (isUT) {
          // Show state dropdown
          if (stateInput) stateInput.style.display = 'none';
          if (stateSelect) {
            stateSelect.innerHTML = '';
            const cities = WA_UT_STATES[stateName];
            cities.forEach(c => {
              const opt = document.createElement('option');
              opt.value = c; opt.textContent = c;
              stateSelect.appendChild(opt);
            });
            // Put the state name itself as a locked option 
            stateSelect.innerHTML = '<option value="' + stateName + '" selected>' + stateName + '</option>';
            stateSelect.disabled = true;
            stateSelect.style.display = 'block';
            stateSelect.style.background = '#f8fafc';
          }
        } else {
          // Normal state - auto-fill text input
          if (stateInput) {
            stateInput.value = stateName;
            stateInput.readOnly = true;
            stateInput.style.display = 'block';
            stateInput.style.background = '#f8fafc';
            stateInput.style.cursor = 'not-allowed';
          }
          if (stateSelect) stateSelect.style.display = 'none';
        }

        // Populate city/area dropdown from post offices
        const uniqueAreas = [...new Set(postOffices.map(po => po.Name))].sort();
        if (citySelect) {
          citySelect.innerHTML = '';
          uniqueAreas.forEach(area => {
            const opt = document.createElement('option');
            opt.value = area; opt.textContent = area;
            citySelect.appendChild(opt);
          });
          citySelect.style.display = 'block';
          citySelect.style.cursor = 'pointer';
          // Sync with city hidden input
          citySelect.onchange = () => { if (cityInput) cityInput.value = citySelect.value; };
        }
        if (cityInput) {
          cityInput.value = uniqueAreas[0] || '';
          cityInput.style.display = 'none';
        }

        if (statusEl) statusEl.innerHTML = '<span style="color:#16a34a; font-weight:700;">✓ Location found</span>';

      } else {
        throw new Error('PIN not found');
      }

    } catch(e) {
      // API failed - provide manual fallback with state dropdown
      if (statusEl) statusEl.innerHTML = '<span style="color:#f59e0b; font-weight:600;">⚠ Enter manually</span>';
      if (errEl) {
        errEl.textContent = 'Could not auto-fill. Please select/enter your location below.';
        errEl.style.display = 'block';
      }

      // Unlock district & show text input
      if (districtEl) { districtEl.readOnly = false; districtEl.style.background = ''; districtEl.style.cursor = ''; }

      // Show state dropdown with all Indian states + UTs
      const allStates = [
        'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
        'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
        'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
        'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
        'Uttarakhand','West Bengal',
        '-- Union Territories --',
        'Andaman and Nicobar Islands','Chandigarh','Dadra and Nagar Haveli and Daman and Diu',
        'Delhi','Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry'
      ];

      if (stateInput) stateInput.style.display = 'none';
      if (stateSelect) {
        stateSelect.innerHTML = '<option value="">-- Select State --</option>';
        allStates.forEach(s => {
          const opt = document.createElement('option');
          if (s.startsWith('--')) { opt.disabled = true; opt.textContent = s; }
          else { opt.value = s; opt.textContent = s; }
          stateSelect.appendChild(opt);
        });
        stateSelect.disabled = false;
        stateSelect.style.background = '';
        stateSelect.style.display = 'block';
        stateSelect.style.cursor = 'pointer';

        // When state is selected, show city dropdown or text based on UT
        stateSelect.onchange = () => {
          const sel = stateSelect.value;
          if (stateInput) stateInput.value = sel;
          
          if (WA_UT_STATES.hasOwnProperty(sel)) {
            // Show city dropdown for UT
            if (citySelect) {
              citySelect.innerHTML = '<option value="">-- Select City --</option>';
              WA_UT_STATES[sel].forEach(c => {
                const opt = document.createElement('option');
                opt.value = c; opt.textContent = c;
                citySelect.appendChild(opt);
              });
              citySelect.style.display = 'block';
              citySelect.onchange = () => { if (cityInput) cityInput.value = citySelect.value; };
            }
            if (cityInput) cityInput.style.display = 'none';
          } else {
            // Regular state - free text city
            if (citySelect) citySelect.style.display = 'none';
            if (cityInput) { cityInput.style.display = 'block'; cityInput.value = ''; cityInput.readOnly = false; }
          }
        };
      }

      // City - keep text input visible by default
      if (citySelect) citySelect.style.display = 'none';
      if (cityInput) { cityInput.style.display = 'block'; cityInput.readOnly = false; }

    } finally {
      if (spinner) spinner.style.display = 'none';
    }
  }

  async function waSaveNewAddress() {
    // Get city - prefer city text input (synced from select) or select value
    const cityInput = document.getElementById('wa-city');
    const citySelect = document.getElementById('wa-addr-city-select');
    const citySelectVisible = citySelect && citySelect.style.display !== 'none';
    const cityVal = citySelectVisible ? (citySelect.value || cityInput.value || '').trim() : (cityInput ? cityInput.value.trim() : '');

    // Get state - prefer text input, fallback to select
    const stateInput = document.getElementById('wa-province');
    const stateSelect = document.getElementById('wa-province-select');
    const stateSelectVisible = stateSelect && stateSelect.style.display !== 'none';
    const stateVal = stateSelectVisible ? (stateSelect.value || '').trim() : (stateInput ? stateInput.value.trim() : '');

    const fname = (document.getElementById('wa-first-name') || {}).value?.trim() || '';
    const lname = (document.getElementById('wa-last-name') || {}).value?.trim() || '';
    const email = (document.getElementById('wa-email') || {}).value?.trim() || '';
    const address1 = (document.getElementById('wa-address1') || {}).value?.trim() || '';
    const address2 = (document.getElementById('wa-address2') || {}).value?.trim() || '';
    const zip = (document.getElementById('wa-zip') || {}).value?.trim() || '';
    const district = (document.getElementById('wa-addr-district') || {}).value?.trim() || '';

    const errEl = document.getElementById('wa-pin-error');

    // Validation
    if (!fname) { if (errEl) { errEl.textContent = 'Please enter your First Name.'; errEl.style.display = 'block'; } document.getElementById('wa-first-name').focus(); return; }
    if (!address1) { if (errEl) { errEl.textContent = 'Please enter your Address.'; errEl.style.display = 'block'; } document.getElementById('wa-address1').focus(); return; }
    if (!zip || zip.length !== 6) { if (errEl) { errEl.textContent = 'Please enter a valid 6-digit PIN code.'; errEl.style.display = 'block'; } document.getElementById('wa-zip').focus(); return; }
    if (!stateVal) { if (errEl) { errEl.textContent = 'Please select or enter your State.'; errEl.style.display = 'block'; } return; }
    if (!cityVal) { if (errEl) { errEl.textContent = 'Please select or enter your City.'; errEl.style.display = 'block'; } return; }

    let finalAddress2 = address2;
    if (district) {
        finalAddress2 = finalAddress2 ? finalAddress2 + ' | District: ' + district : 'District: ' + district;
    }
    const addr = {
      first_name: fname,
      last_name: lname,
      email: email,
      address1: address1,
      address2: finalAddress2,
      city: cityVal,
      zip: zip,
      province: stateVal,
      country: 'India',
      company: district ? 'District: ' + district : '' // Keep it for immediate use in UI
    };

    const btn = document.getElementById('wa-save-addr-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Saving...'; }

    try {
      await fetch(WA_API_BASE + '/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          merchant_key: MERCHANT_KEY, 
          phone: waPhone, 
          action: waEditingAddressId ? 'EDIT' : 'ADD', 
          address_data: waEditingAddressId ? Object.assign({ id: waEditingAddressId }, addr) : addr 
        })
      });
      document.getElementById('wa-new-address-form').style.display = 'none';
      document.getElementById('wa-add-addr-btn').style.display = 'block';
      if (errEl) errEl.style.display = 'none';
      waEditingAddressId = null;
      await loadAddresses();
    } catch (e) { 
      alert('Failed to save address. Error: ' + e.message); console.error(e); 
    } finally {
      if (btn) { btn.disabled = false; btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> Save & Deliver to this Address'; }
    }
  }

  async function calculateCheckoutTotals(discountCode = null) {
    const subT = document.getElementById('wa-subtotal'); if (subT) subT.innerText = 'Calculating...';
    const totT = document.getElementById('wa-total'); if (totT) totT.innerText = '...';
    try {
      const cartRes = await fetch('/cart.js');
      const cart = await cartRes.json();
      const items = cart.items.map(i => ({ variant_id: i.variant_id, quantity: i.quantity }));
      const res = await fetch(\\`${WA_API_BASE}/checkout/calculate\\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          merchant_key: MERCHANT_KEY, 
          items, 
          discount_code: discountCode,
          cart_discount: cart.total_discount || 0,
          cart_subtotal: cart.original_total_price || 0,
          phone: waPhone || null,
          device_id: localStorage.getItem('fit11_device_id') || localStorage.getItem('wa_device_id') || null,
          raw_cart: cart,
          utm_data: JSON.parse(localStorage.getItem('wa_utm_data') || '{}')
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to calculate');

      waDraftOrderId = data.draft_order_id;
      waInvoiceUrl = data.invoice_url;
      waAppliedDiscountCode = discountCode;
      
      document.getElementById('wa-subtotal').innerText = \\`₹${parseFloat(data.subtotal).toFixed(2)}\\`;
      document.getElementById('wa-total').innerText = \\`₹${parseFloat(data.total_price).toFixed(2)}\\`;
      document.getElementById('wa-total').setAttribute('data-base-total', parseFloat(data.total_price).toFixed(2));

      document.getElementById('wa-subtotal').innerText = '₹' + parseFloat(data.subtotal).toFixed(2);
      document.getElementById('wa-total').innerText = '₹' + parseFloat(data.total_price).toFixed(2);
      document.getElementById('wa-total').setAttribute('data-base-total', parseFloat(data.total_price).toFixed(2));
      
      const discEl = document.getElementById('wa-discount-amt');
      const yayEl = document.getElementById('wa-yay-saving');
      const yayAmt = document.getElementById('wa-yay-amt');
      
      if (data.discount_amount && parseFloat(data.discount_amount) > 0) {
        if(discEl) discEl.innerText = '-₹' + parseFloat(data.discount_amount).toFixed(2);
        if(yayEl) yayEl.style.display = 'flex';
        if(yayAmt) {
          let discVal = parseFloat(data.discount_amount);
          yayAmt.innerText = '₹' + (Number.isInteger(discVal) ? discVal.toString() : discVal.toFixed(2));
        }
      } else {
        if(discEl) discEl.innerText = '-₹0.00';
        if(yayEl) yayEl.style.display = 'none';
      }
      
      waPaymentSettings = data.payment_settings || {};

      // Apply Branding — inject all theme CSS variables from admin settings
      const _ps = waPaymentSettings;
      const _setVar = (name, val, fallback) => {
        document.documentElement.style.setProperty(name, val || fallback);
      };
      _setVar('--wa-theme',      _ps.theme_color,    '#0f172a');
      _setVar('--wa-bg',         _ps.bg_main,        '#f1f5f9');
      _setVar('--wa-card-bg',    _ps.bg_card,        '#ffffff');
      _setVar('--wa-header-bg',  _ps.bg_header,      '#0f172a');
      _setVar('--wa-heading',    _ps.text_heading,   '#0f172a');
      _setVar('--wa-subheading', _ps.text_subheading,'#64748b');
      _setVar('--wa-label',      _ps.text_label,     '#374151');
      _setVar('--wa-success',    _ps.accent_success, '#16a34a');
      _setVar('--wa-border',     _ps.accent_border,  '#e2e8f0');

      if (_ps.font_family && _ps.font_family !== 'Inter') {
        if (!document.getElementById('wa-custom-font')) {
          const link = document.createElement('link');
          link.id = 'wa-custom-font';
          link.href = \\`https://fonts.googleapis.com/css2?family=${_ps.font_family.replace(/ /g, '+')}:wght@400;500;600;700;800&display=swap\\`;
          link.rel = 'stylesheet';
          document.head.appendChild(link);
        }
        _setVar('--wa-font-family', \\`'${_ps.font_family}', -apple-system, sans-serif\\`);
      } else {
        _setVar('--wa-font-family', \\`'Inter', -apple-system, BlinkMacSystemFont, sans-serif\\`);
      }

      if (_ps.logo_url) {
        const _logoImg = \\`<img src="${_ps.logo_url}" alt="Store Logo" style="max-height:40px;max-width:150px;object-fit:contain;display:block;" />\\`;
        const _leftBrand = document.getElementById('wa-brand-name-left');
        if (_leftBrand) _leftBrand.outerHTML = \\`<div id="wa-brand-name-left">${_logoImg}</div>\\`;
        const _mobileBrand = document.getElementById('wa-brand-name-mobile');
        if (_mobileBrand) _mobileBrand.innerHTML = _logoImg;
      }

      // Apply email required/optional setting from admin
      const _emailInput = document.getElementById('wa-email');
      const _emailBadge = document.getElementById('wa-email-badge');
      if (_ps.email_required === true) {
        if (_emailInput) { _emailInput.required = true; _emailInput.placeholder = 'you@example.com'; }
        if (_emailBadge) { _emailBadge.textContent = '(Required)'; _emailBadge.style.color = '#f59e0b'; }
      } else {
        if (_emailInput) { _emailInput.required = false; _emailInput.placeholder = 'you@example.com (Optional)'; }
        if (_emailBadge) { _emailBadge.textContent = '(Optional)'; _emailBadge.style.color = '#94a3b8'; }
      }

      if (document.getElementById('wa-step-4').style.display === 'block') {
          renderPaymentMethods();
      }

    } catch (e) {
      if (discountCode && String(e.message) === 'invalid_discount') {
        alert('The discount code entered is invalid or expired.');
        waAppliedDiscountCode = null;
        calculateCheckoutTotals(); // Recalculate without code
      } else {
        // Fallback: read from cart
        try {
          const cartRes = await fetch('/cart.js');
          const cart = await cartRes.json();
          const total = (cart.total_price / 100).toFixed(0);
          const subT = document.getElementById('wa-subtotal'); if (subT) subT.innerText = \\`₹${total}\\`;
          const totT = document.getElementById('wa-total'); if (totT) totT.innerText = \\`₹${total}\\`;
          if (totT) totT.setAttribute('data-base-total', total);
        } catch(e2) {
          const subT = document.getElementById('wa-subtotal'); if (subT) subT.innerText = 'See cart';
          const totT = document.getElementById('wa-total'); if (totT) totT.innerText = 'See cart';
        }
        
        if (document.getElementById('wa-step-4').style.display === 'block') {
          if (typeof renderPaymentMethods === 'function') renderPaymentMethods();
        }
      }
    }
  }

  async function waApplyCoupon() {
    const code = document.getElementById('wa-coupon-code').value.trim().toUpperCase();
    if (!code) return;
    const btn = document.querySelector('[onclick="waApplyCoupon()"]');
    const msgDiv = document.getElementById('wa-coupon-msg');
    const couponDiscRow = document.getElementById('wa-coupon-discount-row');
    const couponDiscAmt = document.getElementById('wa-coupon-discount-amt');
    
    if (btn) { btn.textContent = 'Checking...'; btn.disabled = true; }
    
    try {
      await calculateCheckoutTotals(code);
      
      if (waAppliedDiscountCode === code) {
        // Get the current coupon discount from the API response
        if (btn) {
          btn.textContent = '✓ Applied';
          btn.style.backgroundColor = '#16a34a';
          btn.style.color = '#fff';
          btn.style.border = '1.5px solid #16a34a';
        }
        if (msgDiv) {
          msgDiv.style.display = 'block';
          msgDiv.style.background = '#f0fdf4';
          msgDiv.style.color = '#15803d';
          msgDiv.style.border = '1px solid #bbf7d0';
          msgDiv.innerHTML = '🎉 Coupon <strong>' + code + '</strong> applied successfully!';
        }
      } else {
        if (btn) { btn.textContent = 'Apply'; btn.disabled = false; }
        if (msgDiv) {
          msgDiv.style.display = 'block';
          msgDiv.style.background = '#fef2f2';
          msgDiv.style.color = '#dc2626';
          msgDiv.style.border = '1px solid #fecaca';
          msgDiv.textContent = '❌ Invalid or expired coupon code.';
        }
      }
    } catch(e) {
      if (btn) { btn.textContent = 'Apply'; btn.disabled = false; }
      if (msgDiv) {
        msgDiv.style.display = 'block';
        msgDiv.style.background = '#fef2f2';
        msgDiv.style.color = '#dc2626';
        msgDiv.style.border = '1px solid #fecaca';
        msgDiv.textContent = '❌ Could not apply coupon. Please try again.';
      }
    }
  }

  async function waRemoveCoupon() {
    waAppliedDiscountCode = null;
    document.getElementById('wa-coupon-code').value = '';
    const btn = document.querySelector('.wa-coupon-apply');
    btn.innerText = 'Apply';
    btn.style.backgroundColor = '#f1f5f9';
    btn.style.color = 'var(--wa-theme, #0f172a)';
    btn.style.borderColor = '#e2e8f0';
    await calculateCheckoutTotals();
  }

  function waProceedToPayment() {
    if (!waSelectedAddress) {
      alert('Please select a delivery address first.');
      return;
    }
    
    document.getElementById('wa-step-3').style.display = 'none';
    document.getElementById('wa-step-4').style.display = 'block';

    // Reset wallet state when entering payment step
    waWalletApplied = false;
    waWalletAppliedAmt = 0;

    renderPaymentMethods();

    // Fetch customer wallet balance (async, non-blocking)
    if (waPaymentSettings && waPaymentSettings.store_credit_enabled) {
      fetchWalletBalance().then(() => waRenderWalletSection());
    }
  }
  
  function waBackToAddress() {
    document.getElementById('wa-step-4').style.display = 'none';
    document.getElementById('wa-step-3').style.display = 'block';
  }
  
  let waSelectedPayment = null;
  let cashfreeObj = null;

  
    function waUpdateBtnTotal(baseTotal) {
      let subtext = document.getElementById('wa-pay-btn-subtext');
      let btnText = document.getElementById('wa-pay-btn-text');
      if (!subtext) return;
      
      if (waSelectedPayment === 'prepaid') {
        let disc = 0;
        if (waPaymentSettings && waPaymentSettings.prepaid_offer_enabled) {
            disc = waPaymentSettings.prepaid_offer_type === 'percent' ? (baseTotal * waPaymentSettings.prepaid_offer_value) / 100 : waPaymentSettings.prepaid_offer_value;
            disc = Math.min(disc, baseTotal);
        }
        if (disc > 0) {
            subtext.innerHTML = \\`Complete your order and save ₹${Math.round(disc)}\\`;
        } else {
            subtext.innerHTML = \\`Complete your secure online payment\\`;
        }
        if (btnText) btnText.innerText = 'Pay Securely Now →';
      } else if (waSelectedPayment === 'partial_cod') {
        let advanceAmt = 0;
        if (waPaymentSettings && waPaymentSettings.partial_cod_enabled) {
            advanceAmt = waPaymentSettings.partial_cod_type === 'percent' ? (baseTotal * waPaymentSettings.partial_cod_value) / 100 : waPaymentSettings.partial_cod_value;
        }
        subtext.innerHTML = \\`Pay ₹${Math.round(advanceAmt)} now to confirm your order\\`;
        if (btnText) btnText.innerText = \\`Pay ₹${Math.round(advanceAmt)} Advance →\\`;
      } else {
        // COD selected
        let fee = waPaymentSettings ? (waPaymentSettings.cod_fee || 0) : 0;
        if (fee > 0) {
          subtext.innerHTML = \\`Includes ₹${fee} COD fee. Pay securely on delivery\\`;
        } else {
          subtext.innerHTML = \\`Pay securely when your order arrives\\`;
        }
        if (btnText) btnText.innerText = 'Place Order (COD) →';
      }
    }
  
  // ── WALLET / STORE CREDIT ─────────────────────────────────────────
  let waWalletBalance = 0;         // customer's actual balance
  let waWalletApplied = false;     // toggle state
  let waWalletAppliedAmt = 0;      // amount currently deducted from total

  async function fetchWalletBalance() {
    if (!waPhone) return;
    try {
      const res = await fetch(\\`${WA_API_BASE}/identify\\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchant_key: MERCHANT_KEY, phone: waPhone })
      });
      const data = await res.json();
      waWalletBalance = parseFloat(data?.customer?.storeCreditBalance || data?.storeCreditBalance || 0);
    } catch(e) {
      waWalletBalance = 0;
    }
  }

  function computeWalletUsable() {
    if (waWalletBalance <= 0) return 0;
    const ps = waPaymentSettings || {};
    const baseTotal = parseFloat(document.getElementById('wa-total').getAttribute('data-base-total') || '0');
    let maxUsable = waWalletBalance;
    if (ps.store_credit_limit_type === 'percent' && ps.store_credit_limit_value > 0) {
      maxUsable = Math.min(waWalletBalance, (baseTotal * ps.store_credit_limit_value) / 100);
    } else if (ps.store_credit_limit_type === 'fixed' && ps.store_credit_limit_value > 0) {
      maxUsable = Math.min(waWalletBalance, ps.store_credit_limit_value);
    }
    return Math.min(maxUsable, baseTotal); // can't exceed total
  }

  function waRenderWalletSection() {
    const section = document.getElementById('wa-wallet-section');
    const ps = waPaymentSettings || {};
    if (!ps.store_credit_enabled || waWalletBalance <= 0) {
      if (section) section.style.display = 'none';
      return;
    }
    if (section) section.style.display = 'block';
    const usable = computeWalletUsable();
    const balDisplay = document.getElementById('wa-wallet-balance-display');
    if (balDisplay) balDisplay.innerText = \\`₹${waWalletBalance.toFixed(2)}\\`;
    const usableText = document.getElementById('wa-wallet-usable-text');
    if (usableText) {
      if (ps.store_credit_limit_type === 'unlimited' || !ps.store_credit_limit_type) {
        usableText.innerText = \\`Max usable: ₹${usable.toFixed(2)}\\`;
      } else if (ps.store_credit_limit_type === 'percent') {
        usableText.innerText = \\`Max ${ps.store_credit_limit_value}% of order = ₹${usable.toFixed(2)}\\`;
      } else {
        usableText.innerText = \\`Max ₹${ps.store_credit_limit_value} per order\\`;
      }
    }
    const btn = document.getElementById('wa-wallet-toggle-btn');
    const appliedRow = document.getElementById('wa-wallet-applied-row');
    const appliedAmt = document.getElementById('wa-wallet-applied-amt');
    if (waWalletApplied) {
      if (btn) { btn.innerText = 'Remove'; btn.style.background = '#ef4444'; }
      if (appliedRow) { appliedRow.style.display = 'flex'; }
      if (appliedAmt) appliedAmt.innerText = \\`-₹${waWalletAppliedAmt.toFixed(2)}\\`;
    } else {
      if (btn) { btn.innerText = 'Apply Wallet'; btn.style.background = '#10b981'; }
      if (appliedRow) { appliedRow.style.display = 'none'; }
    }
  }

  function waToggleWalletCredit() {
    const totalEl = document.getElementById('wa-total');
    if (!totalEl) return;
    let baseTotal = parseFloat(totalEl.getAttribute('data-base-total') || '0');

    if (!waWalletApplied) {
      const usable = computeWalletUsable();
      if (usable <= 0) return;
      waWalletAppliedAmt = Math.round(usable * 100) / 100;
      waWalletApplied = true;
    } else {
      waWalletApplied = false;
      waWalletAppliedAmt = 0;
    }

    // Re-compute display total (respecting payment method fee/discount too)
    updateTotalDisplay();
    waRenderWalletSection();
  }

function renderPaymentMethods() {
      const container = document.getElementById('wa-payment-methods-container');
      container.innerHTML = '';
      
      let baseTotalText = document.getElementById('wa-total').getAttribute('data-base-total');
      if (!baseTotalText) {
        baseTotalText = document.getElementById('wa-total').innerText.replace('₹', '');
        if (baseTotalText && baseTotalText !== '...') {
          document.getElementById('wa-total').setAttribute('data-base-total', baseTotalText);
        }
      }
      let baseTotal = parseFloat(baseTotalText) || 0;
      
      let methods = [];
      
      if (!waPaymentSettings || Object.keys(waPaymentSettings).length === 0) {
        methods.push({ id: 'cod', type: 'cod', baseTotal });
      } else {
        if (waPaymentSettings.prepaid_enabled) {
          methods.push({ id: 'prepaid', type: 'prepaid', baseTotal });
        }
        if (waPaymentSettings.partial_cod_enabled) {
          methods.push({ id: 'partial_cod', type: 'partial_cod', baseTotal });
        }
        if (waPaymentSettings.cod_enabled) {
          methods.push({ id: 'cod', type: 'cod', baseTotal });
        }
      }
      
      if (methods.length === 0) {
        container.innerHTML = '<p style="color:#ef4444;">No payment methods available.</p>';
        return;
      }
      
      if (!waSelectedPayment || !methods.find(m => m.id === waSelectedPayment)) {
        waSelectedPayment = methods[0].id;
      }
      
      const uniqueCss = \\`
        <style>
          .wa-pay-opt { border:1px solid #e2e8f0; border-radius:14px; padding:20px; cursor:pointer; margin-bottom:16px; transition:0.2s; position:relative; overflow:hidden; }
          .wa-pay-opt.selected { border-color:#22c55e; background:#fff; }

          .wa-rec-badge { position:absolute; top:0; left:16px; background:#22c55e; color:#fff; font-size:9px; font-weight:800; padding:4px 10px; border-radius:0 0 8px 8px; letter-spacing:0.5px; }
          .wa-radio-btn { width:22px; height:22px; border:2px solid #cbd5e1; border-radius:50%; position:relative; flex-shrink:0; margin-top:2px; }
          .wa-pay-opt.selected .wa-radio-btn { border-color:#22c55e; }
          .wa-pay-opt.selected .wa-radio-btn::after { content:''; position:absolute; inset:4px; background:#22c55e; border-radius:50%; }
          .wa-icon-circ { width:48px; height:48px; background:#f8fafc; border-radius:50%; display:flex; align-items:center; justify-content:center; position:relative; flex-shrink:0; }
          .wa-shield-badge { position:absolute; bottom:0; right:0; background:#22c55e; color:#fff; width:16px; height:16px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid #fff; }
          .wa-logos-row img { filter: grayscale(0%); opacity: 1; mix-blend-mode: multiply; }
        </style>
      \\`;
      
      container.innerHTML = uniqueCss;
      
      methods.forEach(m => {
        const opt = document.createElement('div');
        const isSelected = waSelectedPayment === m.id;
        let html = '';
        
        if (m.type === 'prepaid') {
          let disc = 0;
          if (waPaymentSettings.prepaid_offer_enabled) {
              disc = waPaymentSettings.prepaid_offer_type === 'percent' ? (baseTotal * waPaymentSettings.prepaid_offer_value) / 100 : waPaymentSettings.prepaid_offer_value;
              disc = Math.min(disc, baseTotal);
          }
          let payAmt = baseTotal - disc;
          
          opt.className = \\`wa-pay-opt recommended ${isSelected ? 'selected' : ''}\\`;
          html = \\`
            <div class="wa-rec-badge">RECOMMENDED</div>
            <div style="display:flex; width:100%; align-items:flex-start; gap:14px; margin-top:8px;">
               <div class="wa-radio-btn"></div>
               <div style="flex:1;">
                 <div style="display:flex; justify-content:space-between; align-items:flex-start; width:100%;">
                    <div style="display:flex; gap:12px;">
                       <div class="wa-icon-circ">
                         <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                         <div class="wa-shield-badge"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="4"><polyline points="20 6 9 17 4 12"/></svg></div>
                       </div>
                       <div>
                         <div style="font-weight:700; color:#1e293b; font-size:16px;">Pay Online (UPI, Cards)</div>
                         <div style="font-size:12px; color:#64748b; margin-top:2px;">Fast, secure & hassle-free</div>
                         ${disc > 0 ? \\`<div style="margin-top:6px;">
                           <span style="display:inline-flex; align-items:center; color:#059669; font-weight:800; font-size:10px; background: #ecfdf5; padding:3px 8px; border-radius:4px; border:1px dashed #10b981; letter-spacing:0.5px; text-transform:uppercase;">
                             <svg width="12" height="12" style="margin-right:4px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                             YOU SAVE ₹${Math.round(disc)}
                           </span>
                         </div>\\` : ''}
                       </div>
                    </div>
                    <div style="text-align:right;">
                      <div style="font-size:16px; font-weight:800; color:#0f172a;">₹${payAmt.toFixed(2)}</div>
                      ${disc > 0 ? \\`<div style="font-size:13px; color:#94a3b8; text-decoration:line-through; margin-top:2px;">₹${baseTotal.toFixed(2)}</div>\\` : ''}
                    </div>
                 </div>
                 ${isSelected ? \\`
                 <div style="margin-top:20px; animation:waFadeIn 0.3s ease;">
                    <div style="background:#f8fafc; border:1px solid #f1f5f9; border-radius:8px; padding:12px; display:flex; align-items:center; justify-content:space-between;">
                      <div style="display:flex; gap:10px; align-items:center;">
                         <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
                         <div>
                            <div style="color:#059669; font-size:12px; font-weight:700;">100% Secure Payment</div>
                            <div style="color:#64748b; font-size:10px; margin-top:2px; line-height:1.4;">Your payment details are encrypted<br>and protected.</div>
                         </div>
                      </div>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    </div>
                    <div class="wa-logos-row" style="display:flex; align-items:center; justify-content:space-between; margin-top:16px; padding:0 4px;">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg" style="height:14px;" />
                      <img src="https://upload.wikimedia.org/wikipedia/commons/7/71/PhonePe_Logo.svg" style="height:14px;" />
                      <img src="https://upload.wikimedia.org/wikipedia/commons/2/24/Paytm_Logo_%28standalone%29.svg" style="height:10px;" />
                      <img src="https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg" style="height:14px;" />
                      <img src="https://cdn.shopify.com/s/assets/payment_icons/visa-319d545c6fd255c9aad5eeaad21fd6f7f7b4fdbdb1a35ce83b89cca12a187f00.svg" style="height:12px;" />
                    </div>
                 </div>
                 \\` : ''}
               </div>
            </div>
          \\`;
        } else if (m.type === 'partial_cod') {
          let advanceAmt = 0;
          if (waPaymentSettings.partial_cod_type === 'percent') {
            advanceAmt = (baseTotal * waPaymentSettings.partial_cod_value) / 100;
          } else {
            advanceAmt = waPaymentSettings.partial_cod_value;
          }
          let payAmt = advanceAmt;
          let remainingAmt = baseTotal - payAmt;
          
          opt.className = \\`wa-pay-opt ${isSelected ? 'selected' : ''}\\`;
          
          html = \\`
            <div style="display:flex; width:100%; align-items:flex-start; gap:14px;">
               <div class="wa-radio-btn"></div>
               <div style="flex:1;">
                 <div style="display:flex; justify-content:space-between; align-items:flex-start; width:100%;">
                    <div style="display:flex; gap:12px; align-items:flex-start;">
                       <div class="wa-icon-circ">
                         <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                         <div class="wa-shield-badge"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="4"><polyline points="20 6 9 17 4 12"/></svg></div>
                       </div>
                       <div>
                         <div style="font-weight:700; color:#1e293b; font-size:16px;">Partial COD (Advance)</div>
                         <div style="font-size:12px; color:#64748b; margin-top:2px;">Pay ₹${Math.round(payAmt)} now, rest on delivery</div>
                       </div>
                    </div>
                    <div style="text-align:right;">
                      <div style="font-size:16px; font-weight:800; color:#0f172a;">₹${payAmt.toFixed(2)}</div>
                      <div style="font-size:11px; color:#64748b; margin-top:2px;">Now</div>
                    </div>
                 </div>
                 ${isSelected ? \\`
                 <div style="margin-top:20px; animation:waFadeIn 0.3s ease;">
                    <div style="background:#f8fafc; border:1px solid #f1f5f9; border-radius:8px; padding:12px; display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;">
                      <div style="display:flex; gap:10px; align-items:center;">
                         <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
                         <div>
                            <div style="color:#059669; font-size:12px; font-weight:700;">100% Secure Payment</div>
                            <div style="color:#64748b; font-size:10px; margin-top:2px; line-height:1.4;">Your payment details are encrypted<br>and protected.</div>
                         </div>
                      </div>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    </div>
                    
                    <div style="background:#fff; border:1.5px dashed #e2e8f0; border-radius:8px; padding:12px; font-size:12px; color:#475569; margin-bottom:16px;">
                      <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
                        <span>Advance to pay now:</span>
                        <span style="font-weight:700; color:#0f172a;">₹${payAmt.toFixed(2)}</span>
                      </div>
                      <div style="display:flex; justify-content:space-between;">
                        <span>To pay on delivery:</span>
                        <span style="font-weight:700; color:#0f172a;">₹${remainingAmt.toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <div class="wa-logos-row" style="display:flex; align-items:center; justify-content:space-between; padding:0 4px;">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg" style="height:14px;" />
                      <img src="https://upload.wikimedia.org/wikipedia/commons/7/71/PhonePe_Logo.svg" style="height:14px;" />
                      <img src="https://upload.wikimedia.org/wikipedia/commons/2/24/Paytm_Logo_%28standalone%29.svg" style="height:10px;" />
                      <img src="https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg" style="height:14px;" />
                      <img src="https://cdn.shopify.com/s/assets/payment_icons/visa-319d545c6fd255c9aad5eeaad21fd6f7f7b4fdbdb1a35ce83b89cca12a187f00.svg" style="height:12px;" />
                    </div>
                 </div>
                 \\` : ''}
               </div>
            </div>
          \\`;
        } else if (m.type === 'cod') {
          let fee = waPaymentSettings.cod_fee || 0;
          let payAmt = baseTotal + fee;
          
          opt.className = \\`wa-pay-opt ${isSelected ? 'selected' : ''}\\`;
          
          html = \\`
            <div style="display:flex; width:100%; align-items:flex-start; gap:14px;">
               <div class="wa-radio-btn"></div>
               <div style="flex:1;">
                 <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                    <div style="display:flex; gap:12px; align-items:center;">
                       <div class="wa-icon-circ">
                         <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>
                       </div>
                       <div>
                         <div style="font-weight:700; color:#1e293b; font-size:16px;">Cash on Delivery</div>
                         <div style="font-size:12px; color:#64748b; margin-top:2px;">Pay when your order arrives</div>
                         ${fee > 0 ? \\`<div style="font-size:11px; color:#ef4444; margin-top:4px; font-weight:600;">+ ₹${fee} COD fee applies</div>\\` : ''}
                       </div>
                    </div>
                    <div style="text-align:right;">
                      <div style="font-size:16px; font-weight:800; color:#0f172a;">₹${payAmt.toFixed(2)}</div>
                    </div>
                 </div>
               </div>
            </div>
          \\`;
        }
        
        opt.innerHTML = html;
        opt.onclick = () => {
          if (waSelectedPayment === m.id) return;
          waSelectedPayment = m.id;
          renderPaymentMethods();
        };
        container.appendChild(opt);
      });
      
      waUpdateBtnTotal(baseTotal);
      
      // Attempt to load Cashfree if needed
      if ((waSelectedPayment === 'prepaid' || waSelectedPayment === 'partial_cod') && typeof Cashfree !== 'undefined') {
        try {
          waCashfree = Cashfree({ mode: waPaymentSettings.cashfree_env || 'sandbox' });
        } catch(e) { console.error('Cashfree init error', e); }
      }

      // Show wallet section if applicable
      waRenderWalletSection();
    }

  function updateVisualTotalForPaymentMethod() {
    let subtotalEl = document.getElementById('wa-subtotal');
    if (!subtotalEl || !waPaymentSettings) return;
    
    // Get the base total from the DOM (before payment fees are applied)
    let baseTotalText = document.getElementById('wa-total').getAttribute('data-base-total');
    if (!baseTotalText) {
      baseTotalText = document.getElementById('wa-total').innerText.replace('₹', '');
      document.getElementById('wa-total').setAttribute('data-base-total', baseTotalText);
    }
    
    let baseTotal = parseFloat(baseTotalText);
    if (isNaN(baseTotal)) return;

    let displayTotal = baseTotal;

    if (waSelectedPayment === 'cod' && waPaymentSettings.cod_enabled && waPaymentSettings.cod_fee > 0) {
      displayTotal += waPaymentSettings.cod_fee;
    } else if (waSelectedPayment === 'prepaid' && waPaymentSettings.prepaid_offer_enabled) {
      let discount = waPaymentSettings.prepaid_offer_type === 'percent' 
        ? (baseTotal * waPaymentSettings.prepaid_offer_value) / 100 
        : waPaymentSettings.prepaid_offer_value;
      discount = Math.min(discount, baseTotal);
      displayTotal -= discount;
    }

    // Apply wallet credit discount
    if (waWalletApplied && waWalletAppliedAmt > 0) {
      displayTotal = Math.max(0, displayTotal - waWalletAppliedAmt);
    }

    document.getElementById('wa-total').innerText = \\`₹${displayTotal.toFixed(2)}\\`;
  }

  // Alias used by waToggleWalletCredit
  const updateTotalDisplay = updateVisualTotalForPaymentMethod;

  async function waPayNow() {
      const btn = document.getElementById('wa-cod-btn');
      const errEl = document.getElementById('wa-payment-error');
      btn.disabled = true;
      btn.innerHTML = '⏳ Processing...';
      if (window.waProcessingInterval) clearInterval(window.waProcessingInterval);
      window.waProcessingInterval = setInterval(() => {
        if (!btn.disabled) {
           clearInterval(window.waProcessingInterval);
           return;
        }
        const texts = ['⏳ Processing...', '⏳ Creating Order...', '⏳ Confirming...', '⏳ Securely saving...', '⏳ Almost done...'];
        let curText = btn.innerText.trim();
        let nextIdx = texts.indexOf(curText) + 1;
        if (nextIdx >= texts.length || nextIdx === 0) nextIdx = 1; 
        btn.innerHTML = texts[nextIdx];
      }, 2500);
      
      errEl.style.display = 'none';
      
      waEmail = document.getElementById('wa-email').value.trim();
      
      // Email validation
      if (waPaymentSettings?.email_required === true && !waEmail) {
        errEl.innerText = 'Please enter your email address in the address section to continue.';
        errEl.style.display = 'block';
        btn.disabled = false;
        btn.innerHTML = 'Pay Now <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
        return;
      }
      if (waEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(waEmail)) {
        errEl.innerText = 'Please enter a valid email address.';
        errEl.style.display = 'block';
        btn.disabled = false;
        btn.innerHTML = 'Pay Now <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
        return;
      }
      const addr = waAddresses.find(a => String(a.id) === String(waSelectedAddress));
      
      if (waSelectedPayment === 'cod') {
        // Direct complete
        await finishOrderBackend({ payment_method: 'cod', shipping_address: addr });
      } else if (waPaymentSettings.use_shopify_checkout_prepaid) {
        // Shopify Native Checkout flow for Prepaid and Partial COD
        try {
          const res = await fetch(\\`${WA_API_BASE}/checkout/update-draft\\`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              merchant_key: MERCHANT_KEY, 
              draft_order_id: waDraftOrderId,
              payment_method: waSelectedPayment,
              customer_email: waEmail,
              customer_phone: waPhone,
              device_id: localStorage.getItem('fit11_device_id') || localStorage.getItem('wa_device_id'),
              shipping_address: addr
            })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Failed to update draft order');
          
          if (data.invoice_url) {
             window.location.href = data.invoice_url;
          } else {
             throw new Error('No checkout URL returned from Shopify.');
          }
        } catch(e) {
          errEl.innerText = 'Error: ' + e.message;
          errEl.style.display = 'block';
          btn.disabled = false;
          btn.innerHTML = '<span id="wa-pay-btn-text">Pay Now</span> <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
        }
      } else {
        // Cashfree flow (Partial COD or standard Prepaid)
        try {
          const res = await fetch(\\`${WA_API_BASE}/checkout/create-payment\\`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              merchant_key: MERCHANT_KEY, 
              draft_order_id: waDraftOrderId,
              payment_method: waSelectedPayment,
              customer_phone: waPhone,
              device_id: localStorage.getItem('fit11_device_id') || localStorage.getItem('wa_device_id'),
              customer_email: waEmail,
              customer_name: (addr?.first_name || '') + ' ' + (addr?.last_name || '')
            })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);
          
          if (!cashfreeObj) throw new Error('Payment gateway failed to load.');

          // Open Cashfree Modal
          let checkoutOptions = {
            paymentSessionId: data.payment_session_id,
            redirectTarget: "_modal",
            appearance: {
              color: waPaymentSettings.theme_color || '#0f172a'
            }
          };
          
          // CRITICAL FIX: Hide our custom modal overlay so the Cashfree modal is visible!
          // Cashfree's injected iframe modal might have a lower z-index than our 9999999 overlay.
          const overlay = document.getElementById('wa-otp-overlay');
          const originalDisplay = overlay.style.display;
          overlay.style.display = 'none';
          
          cashfreeObj.checkout(checkoutOptions).then(async (result) => {
            // Bring our modal back
            overlay.style.display = originalDisplay;
            
            if (result.error) {
              errEl.innerText = result.error.message || 'Payment failed or cancelled by user.';
              errEl.style.display = 'block';
              btn.disabled = false;
              btn.innerHTML = '<span id="wa-pay-btn-text">Pay Now</span> <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
            } else {
              // Success
              if (result.paymentDetails && result.paymentDetails.paymentMessage) {
                await finishOrderBackend({ payment_method: waSelectedPayment, shipping_address: addr, cashfree_order_id: data.order_id });
              }
            }
          });
  
        } catch(e) {
          // If we hid the overlay, make sure it's back
          const overlay = document.getElementById('wa-otp-overlay');
          if (overlay && overlay.style.display === 'none') overlay.style.display = 'flex';
          
          errEl.innerText = 'Error: ' + e.message;
          errEl.style.display = 'block';
          btn.disabled = false;
          btn.innerHTML = '<span id="wa-pay-btn-text">Pay Now</span> <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
        }
      }
    }

  async function finishOrderBackend(payload) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    try {
      const res = await fetch(\\`${WA_API_BASE}/checkout/complete\\`, {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          merchant_key: MERCHANT_KEY, 
          draft_order_id: waDraftOrderId, 
          shipping_address: payload.shipping_address, 
          email: waEmail, 
          phone: waPhone,
          device_id: localStorage.getItem('fit11_device_id') || localStorage.getItem('wa_device_id'),
          payment_method: payload.payment_method,
          cashfree_order_id: payload.cashfree_order_id,
          wallet_credit_amount: (waWalletApplied && waWalletAppliedAmt > 0) ? waWalletAppliedAmt : 0
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      // Clear Shopify Cart
      try {
        await fetch('/cart/clear.js', { method: 'POST' });
        if (window.lxRefreshCartUI) window.lxRefreshCartUI();
      } catch(e) {}

      document.getElementById('wa-step-4').style.display = 'none';
      document.getElementById('wa-steps-indicator').style.display = 'none';
      const sc = document.getElementById('wa-success-screen');
      sc.style.display = 'flex';
      clearTimeout(timeoutId);
      // 4. Fire Meta Pixel Purchase Event
      try {
        if (typeof fbq === 'function') {
          let rawTotal = document.getElementById('wa-total').innerText.replace(/[^0-9.]/g, '');
          let finalTotal = parseFloat(rawTotal) || 0;
          fbq('track', 'Purchase', {
            value: finalTotal,
            currency: 'INR',
            content_type: 'product',
            payment_type: payload.payment_method === 'cod' ? 'COD' : 'Prepaid'
          }, { eventID: data.order_id });
        }
      } catch(pixelErr) {
        console.error('Meta Pixel Error:', pixelErr);
      }
    } catch (e) {
      if (e.name === 'AbortError') {
        alert('The server is taking too long to respond. Please try again or contact support.');
      } else {
        alert('Order placed but failed to confirm natively. Support will contact you. ' + e.message);
      }
      const btn = document.getElementById('wa-cod-btn');
      btn.disabled = false;
      btn.innerHTML = '<span id="wa-pay-btn-text">Pay Now</span>';
    }
  }

  function waRedirectToShopify(e) {
    if (e) e.preventDefault();
    closeWaModal();
    window.location = '/checkout';
  }

  window.triggerFullCheckout = function() { openWaModal(); };
  window.openWaModal = openWaModal;

  // Block ONLY the cart form from submitting while modal is open (not forms inside modal)
  document.addEventListener('submit', function(e) {
    // Skip if the form being submitted is inside the modal
    if (e.target.closest && e.target.closest('#wa-otp-overlay')) return;
    const ov = document.getElementById('wa-otp-overlay');
    if (ov && window.getComputedStyle(ov).display !== 'none') {
      e.preventDefault(); e.stopPropagation();
    }
  }, true);
  const _origSubmit = HTMLFormElement.prototype.submit;
  HTMLFormElement.prototype.submit = function() {
    const ov = document.getElementById('wa-otp-overlay');
    if (ov && window.getComputedStyle(ov).display !== 'none') return;
    _origSubmit.apply(this, arguments);
  };

  // Global interceptor for the checkout button ONLY (Handles iOS hover bugs via touchstart)
  ['click', 'touchstart'].forEach(function(evt) {
    document.addEventListener(evt, function(e) {
      if (!e.target || !e.target.closest) return;
      // CRITICAL: Never intercept clicks inside the modal itself
      if (e.target.closest('#wa-otp-overlay')) return;
      let target = e.target.closest('button[name="checkout"], a[href^="/checkout"], input[name="checkout"], #checkout, .cart__checkout-button');
      if (target) {
        if (evt === 'touchstart') {
          if (!window._waModalOpening) {
            window._waModalOpening = true;
            e.preventDefault(); e.stopPropagation();
            openWaModal();
            setTimeout(() => window._waModalOpening = false, 500);
          }
        } else if (evt === 'click') {
          e.preventDefault(); e.stopPropagation();
          if (!window._waModalOpening) openWaModal();
        }
      }
    }, { capture: true, passive: false });
  });

  // Reset button state if user navigates back from Shopify Checkout (BFCache)
  window.addEventListener('pageshow', function(e) {
    const btn = document.getElementById('wa-cod-btn');
    if (btn && btn.disabled) {
      btn.disabled = false;
      btn.innerHTML = '<span id="wa-pay-btn-text">Pay Now</span>';
      if (window.waProcessingInterval) clearInterval(window.waProcessingInterval);
    }
  });
</script>
\n`;\n