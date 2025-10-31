# README - Tacos Ordering API Documentation

## Overview

This repository contains documentation for the tacos ordering system backend API. The frontend code (`bundle.js`) has been deobfuscated and analyzed to understand the backend endpoints.

## Documentation Files

- **`BACKEND_API_DOCUMENTATION.md`** - Complete documentation of all backend endpoints (PHP)
- **`MINIMAL_API_DESIGN.md`** - Proposed minimal REST API design

## Quick Reference

### Backend Endpoints (Current System)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/ajax/refresh_token.php` | GET | Get CSRF token |
| `/ajax/owt.php` | POST | Taco operations (add/update/load) |
| `/ajax/gtd.php` | POST | Get taco details |
| `/ajax/et.php` | POST | Edit taco |
| `/ajax/dt.php` | POST | Delete taco |
| `/ajax/ues.php` | POST | Add/update extra |
| `/ajax/ubs.php` | POST | Add/update drink |
| `/ajax/uds.php` | POST | Add/update dessert |
| `/ajax/cs.php` | POST | Get cart summary |
| `/ajax/RocknRoll.php` | POST | Submit order |
| `/ajax/oh.php` | POST | Get order statuses |
| `/ajax/restore_order.php` | POST | Restore order |

See `BACKEND_API_DOCUMENTATION.md` for complete details.

### Proposed Minimal API

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/resources` | GET | List all resources |
| `/api/v1/cart` | GET | Get cart |
| `/api/v1/cart/tacos` | POST | Add taco |
| `/api/v1/cart/tacos/:id` | GET/PUT/DELETE | Get/update/delete taco |
| `/api/v1/orders` | POST | Create order |
| `/api/v1/orders/:id` | GET | Get order |
| `/api/v1/orders/:id/status` | GET | Get order status |

See `MINIMAL_API_DESIGN.md` for complete API design.

## Next Steps

1. Review `BACKEND_API_DOCUMENTATION.md` to understand backend behavior
2. Review `MINIMAL_API_DESIGN.md` for API wrapper design
3. Implement API wrapper following the design
4. Test endpoints against backend
5. Migrate frontend to use new API
