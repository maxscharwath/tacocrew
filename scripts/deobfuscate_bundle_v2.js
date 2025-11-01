const fs = require('fs');

// Read the bundle.js file
let content = fs.readFileSync('bundle.js', 'utf8');

// Step 1: Fix empty const declarations
content = content.replace(/const\s*,\s*/g, '');
content = content.replace(/const\s*;\s*/g, '');

// Step 2: Complete string lookup replacements
// Replace remaining function calls with actual strings

// _3304620 / _1668924 replacements
const stringLookupMap = {
  _3304620: {
    365: 'createElement',
    621: 'div',
    799: 'card border-',
    817: 'OrderData',
    703: 'data-order-id',
    577: 'getHours',
    810: 'getMinutes',
    677: 'status',
    634: 'innerHTML',
    583: '<div class="card-body"><h5 class="card-title">',
    352: '<button class="btn btn-sm btn-primary repeat-order-btn" onclick="repeatOrder(',
    597: ')">Répéter la commande</button>',
    828: '',
    708: '</h5>',
    836: '<div class="alert alert-',
    800: '-subtle"><strong>',
    552: '-subtle">En route.</div>',
    429: '-subtle">Livré.</div>',
    544: '</p>',
    655: '<p class="card-subtitle text-end text-muted">Heure de retrait demandée: ',
    572: '',
    780: '</p>',
    642: '<p class="card-subtitle text-end text-muted">Heure de livraison demandée: ',
    778: 'requestedFor',
    769: '</p>',
    354: 'livraison',
    704: 'type',
    392: '<p class="card-text text-end"><strong>Total: ',
    640: '<button class="btn btn-sm btn-warning repeat-order-btn" onclick="repeatOrder(',
    514: 'pending',
    534: 'confirmed',
    792: 'ondelivery',
    486: 'cancelled',
    434: 'delivered',
    601: 'emporter',
  },
  _2269029: {
    336: '<ul class="list-group list-group-flush">',
    637: 'tacos',
    632: 'Tacos',
    696: 'extras',
    560: 'boissons',
    730: 'Boissons',
    724: 'desserts',
  },
  _3113142: {
    440: 'textContent',
    641: 'setItem',
    593: 'true',
    390: 'location',
    635: 'reload',
  },
  stringLookup: {
    823: 'length',
    831: 'https://nominatim.openstreetmap.org/search?',
    360: 'Switzerland',
    565: 'toString',
    737: 'address',
    613: 'Mozilla/5.0',
    656: 'json',
    694: 'error',
    589: 'replace',
    470: 'Chemin ',
    459: 'Avenue ',
    629: 'Place ',
    353: 'Route ',
  },
};

// Replace function calls
Object.keys(stringLookupMap).forEach((funcName) => {
  const map = stringLookupMap[funcName];
  Object.keys(map).forEach((code) => {
    const regex = new RegExp(`${funcName}\\(${code}\\)`, 'g');
    const replacement = typeof map[code] === 'string' ? `"${map[code]}"` : map[code];
    content = content.replace(regex, replacement);
  });
});

// Step 3: Replace property access patterns
content = content.replace(/orderData\["OrderData"\]/g, 'orderData.OrderData');
content = content.replace(/orderData\["OrderData"\]/g, 'orderData.OrderData');

// Step 4: Clean up remaining obfuscated patterns
// Remove any remaining function assignments that are now empty
content = content.replace(/\w+\s*=\s*_1668924\s*,?\s*/g, '');
content = content.replace(/\w+\s*=\s*a0_17364\s*,?\s*/g, '');
content = content.replace(/\w+\s*=\s*_3170210\s*,?\s*/g, '');
content = content.replace(/\w+\s*=\s*_1388808\s*,?\s*/g, '');
content = content.replace(/\w+\s*=\s*stringLookup\s*,?\s*/g, '');

// Step 5: Fix property access with replaced strings
content = content.replace(/orderData\["OrderData"\]/g, 'orderData.OrderData');
content = content.replace(/orderData\.OrderData\["([^"]+)"\]/g, 'orderData.OrderData.$1');

// Step 6: Replace remaining bracket notation
content = content.replace(/(\w+)\["([^"]+)"\]/g, '$1.$2');
content = content.replace(/(\w+)\['([^']+)'\]/g, '$1.$2');

// Step 7: Fix boolean values
content = content.replace(/\b!0\b/g, 'true');
content = content.replace(/\b!1\b/g, 'false');

// Step 8: Basic formatting
// Add newlines after semicolons in some cases for readability
content = content.replace(/;\s*([a-z])/g, ';\n    $1');
content = content.replace(/\}\s*([a-z])/g, '}\n  $1');

// Write the deobfuscated file
fs.writeFileSync('bundle.js', content);
