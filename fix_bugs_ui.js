const fs = require('fs');
let c = fs.readFileSync('src/app/master-liquid.ts', 'utf8');

c = c.replace(
  'waCashfree = Cashfree({ mode: waPaymentSettings.cashfree_env || \'sandbox\' });',
  'cashfreeObj = Cashfree({ mode: waPaymentSettings.cashfree_env || \'sandbox\' });'
);
c = c.replace(
  'updateTotalDisplay();\r\n    waRenderWalletSection();\r\n  }',
  'updateTotalDisplay();\r\n    waRenderWalletSection();\r\n    renderPaymentMethods();\r\n  }'
);
c = c.replace(
  'updateTotalDisplay();\n    waRenderWalletSection();\n  }',
  'updateTotalDisplay();\n    waRenderWalletSection();\n    renderPaymentMethods();\n  }'
);

fs.writeFileSync('src/app/master-liquid.ts', c);

let t = fs.readFileSync('../Esponsports theme/snippets/tinkal-x-esponsports-checkout.liquid', 'utf8');
t = t.replace(
  'waCashfree = Cashfree({ mode: waPaymentSettings.cashfree_env || \'sandbox\' });',
  'cashfreeObj = Cashfree({ mode: waPaymentSettings.cashfree_env || \'sandbox\' });'
);
t = t.replace(
  'updateTotalDisplay();\r\n    waRenderWalletSection();\r\n  }',
  'updateTotalDisplay();\r\n    waRenderWalletSection();\r\n    renderPaymentMethods();\r\n  }'
);
t = t.replace(
  'updateTotalDisplay();\n    waRenderWalletSection();\n  }',
  'updateTotalDisplay();\n    waRenderWalletSection();\n    renderPaymentMethods();\n  }'
);

fs.writeFileSync('../Esponsports theme/snippets/tinkal-x-esponsports-checkout.liquid', t);
console.log('done fixes');
