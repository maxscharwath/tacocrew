const fs = require('fs');

let content = fs.readFileSync('bundle.js', 'utf8');

// Remaining obfuscated variables that need replacement
const remainingReplacements = {
  _4102619: 'select',
  _6928111: 'selectProduct',
  _6700950: 'inputs',
  _3200351: 'disabled',
  _8548585: 'input',
  _2254693: 'meatLimit',
  _1475473: 'selectedMeatsCount',
  _2574001: 'checkbox',
  _5999727: 'checkbox',
  _3017667: 'checkbox',
  _5995457: 'checkbox',
  _11668014: 'checkbox',
  _1666559: 'tacoSize',
  _2121723: 'checkbox',
  _3960230: 'checkbox',
  _6200860: 'checkbox',
  _6022972: 'button',
  _4384275: 'event',
  _3420952: 'tacoType',
  _5102302: 'checkbox',
};

// Apply replacements
Object.keys(remainingReplacements).forEach((oldName) => {
  const regex = new RegExp(`\\b${oldName}\\b`, 'g');
  content = content.replace(regex, remainingReplacements[oldName]);
});

// Fix the orderCard variable shadowing issue
content = content.replace(
  /const orderCard = function\(orderData\) \{[\s\S]*?orderItemsHtml = function/g,
  'const orderCard = function(orderData) {\n          const orderItemsHtml = function'
);

// Also fix the duplicate orderCard assignment
content = content.replace(
  /orderItemsHtml = function\(order\) \{[\s\S]*?orderCard = document\.createElement/g,
  'const orderItemsHtml = function(order) {\n              let itemsHtml = "<ul class=\\"list-group list-group-flush\\">";\n              return itemsHtml += buildOrderItemsList(order.tacos, "Tacos"), itemsHtml += buildOrderItemsList(order.extras, \'Extras\'), itemsHtml += buildOrderItemsList(order.boissons, "Boissons"), itemsHtml += buildOrderItemsList(order.desserts, \'Desserts\'), itemsHtml += \'</ul>\', itemsHtml;\n            }(orderData);\n            const orderCard = document.createElement'
);

fs.writeFileSync('bundle.js', content);
