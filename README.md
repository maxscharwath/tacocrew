# Tacos Ordering System - Documentation & Refactoring Guide

## 📋 Overview

This repository contains the deobfuscated and documented tacos ordering system codebase. The goal is to create a modern REST API wrapper that abstracts the existing PHP endpoints into a clean, maintainable interface.

## 📁 Files

- **`bundle.js`** - Deobfuscated and prettified main JavaScript file
- **`API_DOCUMENTATION.md`** - Complete API endpoint documentation
- **`API_WRAPPER_GUIDE.md`** - Guide for implementing the new API wrapper
- **`REFACTORING.md`** - Code refactoring plan and structure
- **`api_client_example.js`** - Example client implementation

## 🚀 Quick Start

### Current API Endpoints

The system uses the following endpoint categories:

1. **Resources** - Get available products and stock
2. **Cart Management** - Add/update/remove items from cart
3. **Orders** - Create, view, and manage orders
4. **Delivery** - Check delivery slots and demand

### Key Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/ajax/refresh_token.php` | GET | Refresh CSRF token |
| `/ajax/owt.php` | POST | Add/update tacos in cart |
| `/ajax/ues.php` | POST | Add extras to cart |
| `/ajax/ubs.php` | POST | Add drinks to cart |
| `/ajax/uds.php` | POST | Add desserts to cart |
| `/ajax/cs.php` | POST | Get cart summary |
| `/ajax/RocknRoll.php` | POST | Submit order |
| `/ajax/oh.php` | POST | Check order statuses |
| `/ajax/restore_order.php` | POST | Restore previous order |

See `API_DOCUMENTATION.md` for complete details.

## 📊 Proposed New API Structure

### Resources
- `GET /api/resources` - List all resources (viandes, sauces, garnitures, etc.)
- `GET /api/resources/stock` - Get stock availability

### Cart
- `GET /api/cart` - Get current cart contents
- `POST /api/cart/tacos` - Add taco to cart
- `PUT /api/cart/tacos/:id` - Update taco
- `DELETE /api/cart/tacos/:id` - Remove taco from cart
- `POST /api/cart/extras` - Add extra to cart
- `POST /api/cart/drinks` - Add drink to cart
- `POST /api/cart/desserts` - Add dessert to cart
- `GET /api/cart/summary` - Get cart summary

### Orders
- `POST /api/orders` - Create new order
- `GET /api/orders/:id` - Get order details
- `GET /api/orders/:id/status` - Get order status
- `POST /api/orders/:id/restore` - Restore order to cart
- `GET /api/orders` - List user orders

### Delivery
- `GET /api/delivery/time-slots` - Get available time slots
- `GET /api/delivery/demand/:time` - Check delivery demand for time slot

## 🏗️ Architecture

```
Client Application
       ↓
  API Wrapper (Node.js/Express/FastAPI)
       ↓
  Legacy PHP Endpoints (ajax/*.php)
```

## 📝 Data Structures

### Taco Object
```javascript
{
  size: "tacos_XL",
  meats: [
    { id: "viande_hachee", quantity: 2 }
  ],
  sauces: ["harissa", "algérienne", "blanche"],
  garnitures: ["salade", "tomates", "oignons"],
  note: "Pas trop épicé"
}
```

### Order Object
```javascript
{
  orderId: "1234567890_abc123",
  OrderData: {
    status: "pending",
    type: "livraison",
    date: "2024-01-15 14:30:00",
    price: 40.50,
    requestedFor: "15:00",
    tacos: [...],
    extras: [...],
    boissons: [...],
    desserts: [...]
  }
}
```

## 🔧 Implementation Steps

1. **Phase 1**: Create API wrapper core with CSRF token management
2. **Phase 2**: Implement resource endpoints
3. **Phase 3**: Implement cart management endpoints
4. **Phase 4**: Implement order endpoints
5. **Phase 5**: Implement delivery and utility endpoints

See `API_WRAPPER_GUIDE.md` for detailed implementation steps.

## 📚 Code Refactoring

The current `bundle.js` should be refactored into:

```
src/
├── api/          # API client and endpoints
├── services/     # Business logic services
├── models/       # Data models
├── utils/        # Utility functions
└── ui/           # UI manipulation
```

See `REFACTORING.md` for the complete refactoring plan.

## 🔐 Security

- All endpoints require CSRF token validation
- Order submission rate limited to 1 per minute
- Tokens refresh every 30 minutes

## 📈 Next Steps

1. Review `API_DOCUMENTATION.md` for endpoint details
2. Review `API_WRAPPER_GUIDE.md` for implementation guidance
3. Review `REFACTORING.md` for code organization
4. Start implementing the API wrapper following the phases outlined

## 📞 Support

For questions about endpoints or implementation, refer to:
- `API_DOCUMENTATION.md` - Complete endpoint reference
- `API_WRAPPER_GUIDE.md` - Implementation examples
- `REFACTORING.md` - Code structure recommendations
