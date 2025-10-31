const fs = require('fs');
let content = fs.readFileSync('bundle.js', 'utf8');

// Variable mapping based on context analysis
const variableMappings = {
  // Scroll handler variables
  '_0x1c226f': 'whatsappIcon',
  '_0x743a72': 'accordionButton',
  '_0x55d89e': 'isCollapsed',
  '_0x4d7d8b': 'iconElement',
  '_0x60fe56': 'icon',
  '_0x50cf97': 'headerHeight',
  '_0x18e104': 'scrollPosition',
  
  // Token refresh variables
  '_0x312011': 'tokenResponse',
  '_0x16c997': 'tokenData',
  '_0x56c03d': 'tokenError',
  
  // Order history variables
  '_0x8db546': 'orderHistoryElement',
  '_0x2f3d6c': 'orderStories',
  '_0x7e2a0f': 'csrfToken',
  '_0x17e0c6': 'order',
  '_0x302237': 'response',
  '_0x285fc8': 'orderStatuses',
  '_0x533c8e': 'hasStatusChanged',
  '_0x17fd88': 'orderStatus',
  '_0x31f23e': 'orderItem',
  '_0x540227': 'orderIndex',
  '_0x4e06b8': 'orderA',
  '_0x135b23': 'orderB',
  '_0x1bfb86': 'hasActiveOrders',
  '_0xc6ac1d': 'orderData',
  '_0x238232': 'orderCard',
  '_0x457009': 'fetchError',
  
  // Repeat order variables
  '_0x4c0389': 'orderId',
  '_0x46a4f7': 'foundOrder',
  '_0x319017': 'orderItem',
  '_0x19aba6': 'csrfToken',
  '_0x2a5f05': 'repeatButton',
  '_0x12f637': 'restoreResponse',
  '_0x4a7f29': 'restoreResult',
  '_0x4bad2f': 'successModal',
  '_0x12c329': 'modalBody',
  '_0x5dd7f8': 'warningHtml',
  '_0xb2dbd0': 'outOfStockItem',
  '_0x335b7a': 'countdown',
  '_0x393272': 'countdownElement',
  '_0x2744f3': 'countdownInterval',
  '_0x5ea52e': 'error',
  
  // Modal and accordion variables
  '_0x256d78': 'csrfToken',
  '_0x5ae98f': 'orderSummaryResponse',
  '_0x47e711': 'orderSummaryHtml',
  '_0x1981d3': 'error',
  '_0x227261': 'accordionButton',
  '_0x176c22': 'targetSection',
  '_0x52bd76': 'accordionState',
  '_0x45f0a7': 'storedState',
  '_0x164a25': 'activeSection',
  '_0x3d64d9': 'timestamp',
  '_0x84168f': 'targetElement',
  '_0x1ac9d0': 'event',
  
  // Status variant
  '_0x1ee734': 'status'
};

// Apply variable mappings
Object.keys(variableMappings).forEach(oldName => {
  const regex = new RegExp('\\b' + oldName + '\\b', 'g');
  content = content.replace(regex, variableMappings[oldName]);
});

// Convert hex to decimal
content = content.replace(/0x([0-9a-fA-F]+)/g, (match, hex) => {
  return parseInt(hex, 16).toString();
});

// Replace bracket notation with dot notation
content = content.replace(/(\w+)\[\"([^\"]+)\"\]/g, '$1.$2');
content = content.replace(/(\w+)\['([^']+)'\]/g, '$1.$2');

// Fix boolean conversions
content = content.replace(/!0x0/g, 'true');
content = content.replace(/!0x1/g, 'false');
content = content.replace(/!true/g, 'false');
content = content.replace(/!false/g, 'true');

fs.writeFileSync('bundle.js', content);
console.log('Comprehensive deobfuscation complete');
