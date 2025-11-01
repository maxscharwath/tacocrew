const fs = require('fs');

let content = fs.readFileSync('bundle.js', 'utf8');

// Step 1: Fix missing const/let declarations
content = content.replace(
  /^(\s+)(orderItemsHtml|orderCard)\s*=\s*function/gm,
  '$1const $2 = function'
);

// Step 2: Convert remaining bracket notation to dot notation
content = content.replace(/new Date\(\)\["getHours"\]\(\)/g, 'new Date().getHours()');
content = content.replace(/new Date\(\)\["getMinutes"\]\(\)/g, 'new Date().getMinutes()');
content = content.replace(/new Date\(\)\["getDay"\]\(\)/g, 'new Date().getDay()');
content = content.replace(/new Date\(\)\["getTime"\]\(\)/g, 'new Date().getTime()');
content = content.replace(/new Date\(\)\["toDateString"\]\(\)/g, 'new Date().toDateString()');

// Step 3: Replace escaped spaces and newlines with actual characters for readability
content = content.replace(/\\x20/g, ' ');
content = content.replace(/\\x0a/g, '\n');
content = content.replace(/\\x27/g, "'");
content = content.replace(/\\x22/g, '"');

// Step 4: Clean up any remaining bracket notation patterns
content = content.replace(/(\w+)\["([^"]+)"\]/g, '$1.$2');
content = content.replace(/(\w+)\['([^']+)'\]/g, '$1.$2');

// Step 5: Fix the issue where orderCard is assigned twice
content = content.replace(
  /orderCard\s*=\s*function\(orderData\)\s*\{[\s\S]*?orderItemsHtml\s*=\s*function/g,
  'orderCard = function(orderData) {\n          const orderItemsHtml = function'
);

// Step 6: Clean up multiple assignments on same line
content = content.replace(
  /orderCard\s*=\s*function\(orderData\)\s*\{\s*orderItemsHtml\s*=\s*function/g,
  'orderCard = function(orderData) {\n          const orderItemsHtml = function'
);

// Step 7: Format the code better - add proper indentation
// Fix function declarations
content = content.replace(/(\w+)\s*=\s*function\s*\(/g, 'const $1 = function(');

// Step 8: Clean up the orderCard function structure
content = content.replace(
  /(const orderCard = function\(orderData\) \{)\s*orderItemsHtml = function/g,
  '$1\n          const orderItemsHtml = function'
);

// Write the cleaned file
fs.writeFileSync('bundle.js', content);
