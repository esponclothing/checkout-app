const fs = require('fs');

const oldHtml = `          <div id="wa-wallet-section" style="display:none; margin-bottom:20px;">
            <div style="border:1.5px solid #10b981; border-radius:14px; overflow:hidden; background:#f0fdf4;">
              <div style="display:flex; align-items:center; justify-content:space-between; padding:14px 16px; background:#ecfdf5; border-bottom:1px dashed #a7f3d0;">
                <div style="display:flex; align-items:center; gap:10px;">
                  <div style="width:36px; height:36px; background:#10b981; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>
                  </div>
                  <div>
                    <div style="font-weight:700; font-size:14px; color:#065f46;">Wallet Balance</div>
                    <div style="font-size:12px; color:#047857;">Available: <strong id="wa-wallet-balance-display">?0</strong></div>
                  </div>
                </div>
                <div>
                  <div style="font-size:11px; color:#047857; text-align:right; margin-bottom:4px;" id="wa-wallet-usable-text">Max usable: ?0</div>
                  <button type="button" id="wa-wallet-toggle-btn" onclick="waToggleWalletCredit()" style="background:#10b981; color:#fff; border:none; padding:8px 16px; border-radius:8px; font-weight:700; font-size:13px; cursor:pointer; transition:0.2s;">
                    Apply Wallet
                  </button>
                </div>
              </div>
              <div id="wa-wallet-applied-row" style="display:none; padding:10px 16px; display:none; align-items:center; justify-content:space-between; background:#d1fae5;">
                <span style="font-size:13px; font-weight:600; color:#065f46;">? Wallet Discount Applied</span>
                <span style="font-size:14px; font-weight:800; color:#065f46;" id="wa-wallet-applied-amt">-?0</span>
              </div>
            </div>
          </div>`;

const newHtml = `          <div id="wa-wallet-section" style="display:none; margin-bottom:20px;">
             <div class="wa-payment-option wa-pay-opt" id="wa-wallet-card" style="margin-top:12px; cursor: pointer; transition: 0.2s; border:1.5px dashed #e2e8f0;" onclick="waToggleWalletCredit()">
                <div style="display:flex; width:100%; align-items:flex-start; gap:14px;">
                   <div class="wa-checkbox-btn" id="wa-wallet-checkbox" style="width:20px; height:20px; border-radius:4px; border:2px solid #94a3b8; display:flex; align-items:center; justify-content:center; margin-top:2px; transition:0.2s;">
                      <svg id="wa-wallet-check-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" style="display:none;"><polyline points="20 6 9 17 4 12"></polyline></svg>
                   </div>
                   <div style="flex:1;">
                     <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                        <div style="display:flex; gap:12px; align-items:center;">
                           <div class="wa-icon-circ" style="background:#f1f5f9;">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" stroke-width="2"><path d="M21 12V7H5a2 2 0 0 1 2-2h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5H5a2 2 0 0 1-2-2z"/></svg>
                           </div>
                           <div>
                             <div style="font-weight:700; color:#1e293b; font-size:16px;">Store Credit Wallet</div>
                             <div style="font-size:12px; color:#64748b; margin-top:2px;">Available Balance: <strong id="wa-wallet-balance-display">?0</strong></div>
                           </div>
                        </div>
                     </div>
                     <div id="wa-wallet-usable-text" style="font-size:11px; color:#64748b; margin-top:8px;">Max usable: ?0</div>
                     <div id="wa-wallet-applied-row" style="display:none; margin-top:12px; background:#fff; border-radius:8px; padding:10px; border:1px solid #c7d2fe; display:none; align-items:center; justify-content:space-between;">
                        <span style="font-size:13px; font-weight:600; color:#4f46e5;">Applied to order</span>
                        <span style="font-size:14px; font-weight:800; color:#1e293b;" id="wa-wallet-applied-amt">-?0</span>
                     </div>
                   </div>
                </div>
             </div>
          </div>`;

const oldJS = `    const btn = document.getElementById('wa-wallet-toggle-btn');
    const appliedRow = document.getElementById('wa-wallet-applied-row');
    const appliedAmt = document.getElementById('wa-wallet-applied-amt');
    if (waWalletApplied) {
      if (btn) { btn.innerText = 'Remove'; btn.style.background = '#ef4444'; }
      if (appliedRow) appliedRow.style.display = 'flex';
      if (appliedAmt) appliedAmt.innerText = \`-?\${waWalletAppliedAmt.toFixed(2)}\`;
    } else {
      if (btn) { btn.innerText = 'Apply Wallet'; btn.style.background = '#10b981'; }
      if (appliedRow) appliedRow.style.display = 'none';
    }`;

const newJS = `    const card = document.getElementById('wa-wallet-card');
    const checkbox = document.getElementById('wa-wallet-checkbox');
    const checkIcon = document.getElementById('wa-wallet-check-icon');
    const appliedRow = document.getElementById('wa-wallet-applied-row');
    const appliedAmt = document.getElementById('wa-wallet-applied-amt');
    if (waWalletApplied) {
      if (card) { card.style.borderColor = 'var(--wa-primary)'; card.style.background = '#f8fafc'; }
      if (checkbox) { checkbox.style.borderColor = 'var(--wa-primary)'; checkbox.style.background = 'var(--wa-primary)'; }
      if (checkIcon) checkIcon.style.display = 'block';
      if (appliedRow) { appliedRow.style.display = 'flex'; appliedRow.style.background = '#eff6ff'; }
      if (appliedAmt) appliedAmt.innerText = \`-?\${waWalletAppliedAmt.toFixed(2)}\`;
    } else {
      if (card) { card.style.borderColor = '#e2e8f0'; card.style.background = '#fff'; }
      if (checkbox) { checkbox.style.borderColor = '#94a3b8'; checkbox.style.background = 'transparent'; }
      if (checkIcon) checkIcon.style.display = 'none';
      if (appliedRow) appliedRow.style.display = 'none';
    }`;

let f1 = fs.readFileSync('src/app/master-liquid.ts', 'utf8');
f1 = f1.replace(oldHtml, newHtml).replace(oldJS, newJS);
fs.writeFileSync('src/app/master-liquid.ts', f1);

let f2 = fs.readFileSync('../Esponsports theme/snippets/tinkal-x-esponsports-checkout.liquid', 'utf8');
f2 = f2.replace(oldHtml, newHtml).replace(oldJS, newJS);
fs.writeFileSync('../Esponsports theme/snippets/tinkal-x-esponsports-checkout.liquid', f2);

console.log('Done wallet UI overhaul');
