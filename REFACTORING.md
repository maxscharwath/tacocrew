# Code Refactoring Plan

## Current Structure Issues

The current `bundle.js` file is a single large file (~1650 lines) with:
- Mixed concerns (UI, API calls, business logic)
- Global variables
- Inline event handlers
- Hard to test and maintain

## Proposed Refactoring Structure

```
src/
├── api/
│   ├── client.js           # API client wrapper
│   ├── endpoints.js        # Endpoint definitions
│   └── csrf.js             # CSRF token management
├── services/
│   ├── cartService.js      # Cart operations
│   ├── orderService.js     # Order operations
│   ├── stockService.js     # Stock management
│   └── validationService.js # Input validation
├── models/
│   ├── Cart.js             # Cart model
│   ├── Order.js            # Order model
│   └── Taco.js             # Taco model
├── utils/
│   ├── domHelpers.js       # DOM manipulation helpers
│   ├── formatters.js       # Data formatting
│   └── constants.js        # Constants (taco sizes, limits, etc.)
├── ui/
│   ├── cartUI.js           # Cart UI updates
│   ├── orderUI.js          # Order UI updates
│   └── modals.js           # Modal management
└── main.js                 # Application entry point
```

## Refactoring Steps

### Step 1: Extract Constants
```javascript
// utils/constants.js
export const TACO_SIZES = {
  L: 'tacos_L',
  BOWL: 'tacos_BOWL',
  L_MIXTE: 'tacos_L_mixte',
  XL: 'tacos_XL',
  XXL: 'tacos_XXL',
  GIGA: 'tacos_GIGA'
};

export const MEAT_LIMITS = {
  [TACO_SIZES.L]: 1,
  [TACO_SIZES.BOWL]: 2,
  [TACO_SIZES.L_MIXTE]: 3,
  [TACO_SIZES.XL]: 3,
  [TACO_SIZES.XXL]: 4,
  [TACO_SIZES.GIGA]: 5
};

export const MAX_SAUCES = 3;
export const DELIVERY_FEE = 2.00;
```

### Step 2: Create API Client
```javascript
// api/client.js
class APIClient {
  constructor() {
    this.baseURL = '/ajax';
    this.csrfToken = null;
  }

  async getCSRFToken() {
    if (!this.csrfToken) {
      const response = await fetch(`${this.baseURL}/refresh_token.php`);
      const data = await response.json();
      this.csrfToken = data.csrf_token;
    }
    return this.csrfToken;
  }

  async request(endpoint, options = {}) {
    const token = await this.getCSRFToken();
    const response = await fetch(`${this.baseURL}/${endpoint}`, {
      ...options,
      headers: {
        'X-CSRF-Token': token,
        ...options.headers
      }
    });
    
    if (response.status === 403) {
      this.csrfToken = null; // Refresh token
      throw new Error('CSRF token expired');
    }
    
    return response;
  }
}

export default new APIClient();
```

### Step 3: Create Service Layer
```javascript
// services/cartService.js
import apiClient from '../api/client.js';
import { MEAT_LIMITS, MAX_SAUCES } from '../utils/constants.js';

class CartService {
  async addTaco(tacoData) {
    const formData = this.buildTacoFormData(tacoData);
    const response = await apiClient.request('owt.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData
    });
    return response.text();
  }

  buildTacoFormData(taco) {
    const formData = new URLSearchParams();
    formData.append('selectProduct', taco.size);
    
    taco.meats.forEach(meat => {
      formData.append('viande[]', meat.id);
      formData.append(`meat_quantity[${meat.id}]`, meat.quantity || 1);
    });
    
    taco.sauces.forEach(sauce => {
      formData.append('sauce[]', sauce);
    });
    
    taco.garnitures.forEach(garnish => {
      formData.append('garniture[]', garnish);
    });
    
    if (taco.note) {
      formData.append('tacosNote', taco.note);
    }
    
    return formData;
  }

  validateTaco(taco) {
    const errors = [];
    
    if (!taco.meats || taco.meats.length === 0) {
      errors.push('At least one meat is required');
    }
    
    if (!taco.sauces || taco.sauces.length === 0) {
      errors.push('At least one sauce is required');
    }
    
    if (taco.sauces.length > MAX_SAUCES) {
      errors.push(`Maximum ${MAX_SAUCES} sauces allowed`);
    }
    
    const meatLimit = MEAT_LIMITS[taco.size];
    if (taco.meats.length > meatLimit) {
      errors.push(`Maximum ${meatLimit} meats allowed for ${taco.size}`);
    }
    
    return errors;
  }
}

export default new CartService();
```

### Step 4: Create Model Classes
```javascript
// models/Taco.js
export class Taco {
  constructor(data) {
    this.size = data.size;
    this.meats = data.meats || [];
    this.sauces = data.sauces || [];
    this.garnitures = data.garnitures || [];
    this.note = data.note || '';
  }

  getTotalMeatQuantity() {
    return this.meats.reduce((sum, meat) => sum + (meat.quantity || 1), 0);
  }

  isValid() {
    return this.meats.length > 0 && 
           this.sauces.length > 0 && 
           this.sauces.length <= 3;
  }
}
```

### Step 5: Separate UI Logic
```javascript
// ui/cartUI.js
import cartService from '../services/cartService.js';

class CartUI {
  async refreshCart() {
    const summary = await cartService.getSummary();
    this.updateCartDisplay(summary);
  }

  updateCartDisplay(summary) {
    const cartElement = document.getElementById('cart-summary');
    if (cartElement) {
      cartElement.innerHTML = summary.html;
    }
  }

  async addTaco(tacoData) {
    try {
      const html = await cartService.addTaco(tacoData);
      this.appendTacoToCart(html);
      await this.refreshCart();
    } catch (error) {
      this.showError(error.message);
    }
  }

  appendTacoToCart(html) {
    const productsList = document.getElementById('products-list');
    if (productsList) {
      productsList.insertAdjacentHTML('beforeend', html);
    }
  }

  showError(message) {
    alert(message);
  }
}

export default new CartUI();
```

## Benefits of Refactoring

1. **Testability**: Each module can be tested independently
2. **Maintainability**: Clear separation of concerns
3. **Reusability**: Services can be reused across different UIs
4. **Scalability**: Easy to add new features
5. **Type Safety**: Can add TypeScript for better type checking

## Migration Strategy

1. **Phase 1**: Extract constants and utilities (no breaking changes)
2. **Phase 2**: Create API client layer (backward compatible)
3. **Phase 3**: Extract services (gradual migration)
4. **Phase 4**: Separate UI logic (refactor event handlers)
5. **Phase 5**: Full modular structure (complete refactor)

## Testing Example

```javascript
// tests/services/cartService.test.js
import cartService from '../../src/services/cartService.js';

describe('CartService', () => {
  describe('validateTaco', () => {
    it('should reject taco without meats', () => {
      const taco = { size: 'tacos_XL', sauces: ['harissa'] };
      const errors = cartService.validateTaco(taco);
      expect(errors).toContain('At least one meat is required');
    });

    it('should reject taco with too many sauces', () => {
      const taco = {
        size: 'tacos_XL',
        meats: [{ id: 'viande_hachee' }],
        sauces: ['sauce1', 'sauce2', 'sauce3', 'sauce4']
      };
      const errors = cartService.validateTaco(taco);
      expect(errors).toContain('Maximum 3 sauces allowed');
    });
  });
});
```
