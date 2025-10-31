# Slack UI Integration Guide

## Overview

The Slack integration uses **only Slack UI components** (modals, buttons, interactive blocks) instead of complex slash commands. This provides a much simpler and more intuitive user experience.

## How It Works

### 1. Main Entry Point
Users type `/tacos` to get a simple menu with two buttons:
- **🚀 Start Group Order** - Opens a modal
- **📋 View Active Orders** - Shows active orders

### 2. Creating a Group Order
Clicking "Start Group Order" opens a modal with:
- Order name (optional)
- Expiration time in minutes (default: 30)

After submission, a message is posted with interactive buttons.

### 3. Group Order Message
Each group order message displays:
- Order details (name, creator, status, time remaining)
- List of all items with who added them
- Total price and participant count
- Interactive buttons:
  - **➕ Add Item** - Opens modal to add a taco
  - **👁️ View Details** - Opens modal with full details
  - **🔒 Close Order** - (Creator only) Closes the order

### 4. Adding Items
Clicking "Add Item" opens a modal with:
- Taco size selection (dropdown)
- Quantity input
- Multi-select for meats
- Multi-select for sauces (max 3)
- Multi-select for garnitures
- Optional note field

After submission, the order message is automatically updated.

### 5. Viewing Active Orders
Clicking "View Active Orders" shows a list of all active orders with:
- Order name
- Creator
- Item count and total price
- Time remaining
- "View" button for each order

## User Flow

```
1. User types /tacos
   ↓
2. Sees menu with buttons
   ↓
3. Clicks "Start Group Order"
   ↓
4. Modal opens → Fill form → Submit
   ↓
5. Group order message appears with buttons
   ↓
6. Anyone clicks "Add Item"
   ↓
7. Modal opens → Fill taco details → Submit
   ↓
8. Order message updates automatically
   ↓
9. Creator clicks "Close Order" when ready
   ↓
10. Order can be submitted via API
```

## Features

- ✅ **Simple UI** - Only buttons and modals, no complex commands
- ✅ **Visual Feedback** - Messages update in real-time
- ✅ **Easy to Use** - No need to remember command syntax
- ✅ **Context Aware** - Buttons appear directly on order messages
- ✅ **Permission Control** - Only creator can close orders
- ✅ **Rich Forms** - Dropdowns and multi-selects for easy selection

## Technical Details

### Action IDs
- `start_group_order` - Opens create modal
- `list_group_orders` - Shows active orders list
- `add_item_to_order` - Opens add item modal
- `view_group_order` - Opens order details modal
- `close_group_order` - Closes the order

### Modal Callbacks
- `create_group_order_modal` - Handles group order creation
- `add_item_modal` - Handles item addition

### Message Updates
When items are added, the order message is automatically updated using `chat.update()` with the message timestamp and channel ID stored in modal metadata.

## Benefits Over Commands

1. **No Syntax Errors** - Users can't mistype commands
2. **Visual Interface** - Everything is clickable and intuitive
3. **Context Preservation** - Order info is always visible
4. **Better UX** - Native Slack UI feels natural
5. **Reduced Learning Curve** - No need to learn commands
