# Framework Comparison for TypeScript API

## Options

### 1. **NestJS** ⭐ Recommended
**Best for:** Typed controllers, dependency injection, enterprise apps

**Pros:**
- ✅ Built-in dependency injection
- ✅ Fully typed controllers with decorators
- ✅ Uses Express or Fastify under the hood (your choice)
- ✅ Modular architecture
- ✅ Built-in validation (class-validator) + can use Zod
- ✅ Type-safe request/response handling
- ✅ Great testing support
- ✅ Mature, widely adopted

**Cons:**
- ❌ Steeper learning curve
- ❌ More boilerplate initially
- ❌ Heavier framework

**Example Controller:**
```typescript
@Controller('carts/:cartId')
export class CartController {
  constructor(
    private readonly cartService: CartService,
    private readonly orderService: OrderService,
  ) {}

  @Post('tacos')
  @UsePipes(new ZodValidationPipe(schemas.addTaco))
  async addTaco(
    @Param('cartId') cartId: string,
    @Body() body: z.infer<typeof schemas.addTaco>,
  ) {
    const taco = await this.cartService.addTaco(cartId, body);
    return { success: true, data: taco };
  }
}
```

### 2. **Fastify**
**Best for:** Performance-focused apps

**Pros:**
- ✅ Faster than Express
- ✅ TypeScript support with plugins
- ✅ Can add DI with plugins

**Cons:**
- ❌ No built-in DI (need plugins)
- ❌ Less convention over configuration

### 3. **Hono**
**Best for:** Edge computing, modern TypeScript-first

**Pros:**
- ✅ Very fast, modern API
- ✅ Great TypeScript support
- ✅ Lightweight

**Cons:**
- ❌ No built-in DI
- ❌ Newer, smaller ecosystem

### 4. **ts-rest**
**Best for:** Contract-first APIs with end-to-end type safety

**Pros:**
- ✅ Contract-first approach
- ✅ Full type safety client + server
- ✅ Works with Express/Fastify

**Cons:**
- ❌ Different paradigm (contract-first)
- ❌ Still need DI separately

## Recommendation: NestJS

NestJS would transform your codebase:

### Benefits for Your Code:

1. **Dependency Injection:**
```typescript
// Services are automatically injected
@Injectable()
export class CartService {
  constructor(
    @Inject('SessionApiClient') 
    private sessionApiClient: SessionApiClient,
  ) {}
}
```

2. **Typed Controllers:**
```typescript
@Controller('api/v1/carts')
export class ApiController {
  constructor(
    private cartService: CartService,
    private orderService: OrderService,
  ) {}

  @Get(':cartId')
  @UseGuards(SessionGuard) // Replaces your requireSession middleware
  async getCart(@Param('cartId') cartId: string) {
    return this.cartService.getCart(cartId);
  }

  @Post(':cartId/tacos')
  @UseGuards(SessionGuard)
  @UsePipes(new ZodValidationPipe(schemas.addTaco))
  async addTaco(
    @Param('cartId') cartId: string,
    @Body() body: z.infer<typeof schemas.addTaco>, // Fully typed!
  ) {
    return this.cartService.addTaco(cartId, body);
  }
}
```

3. **Modules (Organization):**
```typescript
@Module({
  controllers: [ApiController],
  providers: [CartService, OrderService, SessionService],
  exports: [CartService],
})
export class CartModule {}
```

4. **Guards (Middleware):**
```typescript
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private sessionService: SessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const cartId = request.params.cartId;
    
    if (!cartId) {
      throw new NotFoundException('Cart ID required');
    }
    
    const exists = await this.sessionService.hasSession(cartId);
    if (!exists) {
      throw new NotFoundException('Cart not found');
    }
    
    return true;
  }
}
```

## Migration Path

1. Install NestJS: `npm install @nestjs/core @nestjs/common @nestjs/platform-express`
2. Create modules for your services
3. Convert controllers to NestJS controllers
4. Add DI to services
5. Replace middleware with guards/pipes
6. Keep Zod validation with custom pipe

Would you like me to create a migration example showing how your current code would look in NestJS?

