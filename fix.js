const fs = require('fs');
let c = fs.readFileSync('src/app/master-liquid.ts', 'utf8');

c = c.replace(/<button type="button" class="wa-btn-primary" id="wa-send-btn"[\s\S]*?It only takes a few seconds<\/span>\r\n          <\/button>/, 
`<button type="button" class="wa-btn-primary" id="wa-send-btn" onclick="sendWaOtp()" style="background:#0f172a; padding:18px; margin-bottom:16px; display:flex; flex-direction:column; align-items:center; gap:4px; border-radius:12px; width:100%; border:none; cursor:pointer;">
            <div style="display:flex; align-items:center; justify-content:center; gap:8px; color:#fff; width:100%;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" style="flex-shrink:0;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
              <span style="font-size:16px; font-weight:700; display:flex; align-items:center; gap:4px; white-space:nowrap;">
                Continue Securely 
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="flex-shrink:0;"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </span>
            </div>
            <span style="font-size:11px; font-weight:500; color:#94a3b8;">It only takes a few seconds</span>
          </button>`.replace(/\n/g, '\r\n'));

c = c.replace(/if \(!localStorage.getItem\('fit11_device_id'\)\) \{\r\n      localStorage.setItem\('fit11_device_id', 'dev_' \+ Math.random\(\).toString\(36\).substr\(2, 9\)\);\r\n    \}/,
`if (!localStorage.getItem('fit11_device_id')) {
      if (localStorage.getItem('wa_device_id')) {
        localStorage.setItem('fit11_device_id', localStorage.getItem('wa_device_id'));
      } else {
        localStorage.setItem('fit11_device_id', 'dev_' + Math.random().toString(36).substr(2, 9));
      }
    }`.replace(/\n/g, '\r\n'));

fs.writeFileSync('src/app/master-liquid.ts', c);
console.log('done');
