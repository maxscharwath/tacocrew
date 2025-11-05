import { ArrowLeft } from '@untitledui/icons/ArrowLeft';
import { CheckCircle } from '@untitledui/icons/CheckCircle';
import { Minus } from '@untitledui/icons/Minus';
import { Package } from '@untitledui/icons/Package';
import { Plus } from '@untitledui/icons/Plus';
import { ShoppingBag01 } from '@untitledui/icons/ShoppingBag01';
import { useEffect, useMemo, useState } from 'react';
import {
  type ActionFunctionArgs,
  Form,
  Link,
  type LoaderFunctionArgs,
  redirect,
  useActionData,
  useLoaderData,
  useNavigation,
  useParams,
} from 'react-router';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Label,
  Textarea,
} from '@/components/ui';
import { cn } from '@/lib/utils';
import { OrdersApi, StockApi } from '../lib/api';
import { ApiError } from '../lib/api/http';
import type { UpsertUserOrderBody } from '../lib/api/orders';
import { sessionStore } from '../lib/session/store';
import { TACO_SIZE_CONFIG } from '../lib/taco-config';

type LoaderData = {
  groupOrder: Awaited<ReturnType<typeof OrdersApi.getGroupOrderWithOrders>>['groupOrder'];
  myOrder?: Awaited<ReturnType<typeof OrdersApi.getGroupOrderWithOrders>>['userOrders'][number];
  stock: Awaited<ReturnType<typeof StockApi.getStock>>;
};

type ActionData = {
  error?: string;
};

export async function orderCreateLoader({ params, request }: LoaderFunctionArgs) {
  const groupOrderId = params.orderId;
  if (!groupOrderId) {
    throw new Response('Order not found', { status: 404 });
  }

  const session = sessionStore.getSession();
  if (!session) {
    throw redirect('/login');
  }

  // Check if we're editing an existing order
  const url = new URL(request.url);
  const orderId = url.searchParams.get('orderId');

  const [groupOrderWithUsers, stock] = await Promise.all([
    OrdersApi.getGroupOrderWithOrders(groupOrderId),
    StockApi.getStock(),
  ]);

  // If orderId is provided, fetch that specific order
  let myOrder;
  if (orderId) {
    try {
      const orderDetail = await OrdersApi.getUserOrder(groupOrderId, orderId);
      // Verify the user can edit this order (owner or leader)
      const isLeader = groupOrderWithUsers.groupOrder.leaderId === session.userId;
      const isOwner = orderDetail.userId === session.userId;
      if (!isLeader && !isOwner) {
        throw new Response('Unauthorized', { status: 403 });
      }
      myOrder = orderDetail;
    } catch {
      // If order not found or unauthorized, redirect to create new
      return redirect(`/orders/${groupOrderId}/create`);
    }
  } else {
    // No orderId provided, create new order
    myOrder = undefined;
  }

  return Response.json({
    groupOrder: groupOrderWithUsers.groupOrder,
    myOrder,
    stock,
  });
}

export async function orderCreateAction({ request, params }: ActionFunctionArgs) {
  const groupOrderId = params.orderId;
  if (!groupOrderId) {
    throw new Response('Order not found', { status: 404 });
  }

  const session = sessionStore.getSession();
  if (!session) {
    throw redirect('/login');
  }

  const formData = await request.formData();
  type TacoSize = UpsertUserOrderBody['items']['tacos'][number]['size'];

  const size = formData.get('tacoSize')?.toString() as TacoSize | undefined;
  const editOrderId = formData.get('editOrderId')?.toString();

  // Parse meats with quantities (only include meats with quantity > 0)
  const meatIds = formData.getAll('meats').map((value) => value.toString());
  const meats = meatIds
    .map((id) => {
      const quantityStr = formData.get(`meat_quantity_${id}`);
      const quantity = quantityStr ? Number(quantityStr) : 0;
      return quantity > 0 ? { id, quantity } : null;
    })
    .filter((m): m is { id: string; quantity: number } => m !== null);

  const sauces = formData.getAll('sauces').map((value) => ({ id: value.toString() }));
  const garnitures = formData.getAll('garnitures').map((value) => ({ id: value.toString() }));
  const extras = formData.getAll('extras').map((value) => ({ id: value.toString(), quantity: 1 }));
  const drinks = formData.getAll('drinks').map((value) => ({ id: value.toString(), quantity: 1 }));
  const desserts = formData
    .getAll('desserts')
    .map((value) => ({ id: value.toString(), quantity: 1 }));
  const note = formData.get('note')?.toString().trim();

  // Validation: must have either a taco OR other items
  // Get taco size config to validate garnitures availability
  const stock = await StockApi.getStock();
  const tacoSize = stock.tacos.find((t) => t.code === size);

  // Garnitures are always optional - never required
  const hasTaco = size && meats.length > 0 && sauces.length > 0;
  const hasOtherItems = extras.length > 0 || drinks.length > 0 || desserts.length > 0;

  if (!hasTaco && !hasOtherItems) {
    return Response.json(
      {
        error: 'Please select at least a taco or some extras/drinks/desserts.',
      },
      { status: 400 }
    );
  }

  // If taco is selected, validate it
  // Garnitures are optional - only validate that they're not selected if allowGarnitures is false
  if (size && (!meats.length || !sauces.length)) {
    return Response.json(
      {
        error: 'If selecting a taco, please select at least one meat and sauce.',
      },
      { status: 400 }
    );
  }

  // Validate that garnitures are not selected if they're not available
  if (size && tacoSize && !tacoSize.allowGarnitures && garnitures.length > 0) {
    return Response.json(
      {
        error: 'Garnishes are not available for this taco size.',
      },
      { status: 400 }
    );
  }

  try {
    // If editing an existing order, delete it first
    if (editOrderId) {
      try {
        await OrdersApi.deleteUserOrder(groupOrderId, editOrderId);
      } catch {
        // If delete fails (e.g., order doesn't exist or unauthorized), continue to create
        // This allows creating a new order even if the old one can't be deleted
      }
    }

    await OrdersApi.upsertUserOrder(groupOrderId, {
      items: {
        tacos: hasTaco
          ? [
              {
                size: size!,
                meats,
                sauces,
                garnitures,
                note: note || undefined,
                quantity: 1, // Always 1
              },
            ]
          : [],
        extras,
        drinks,
        desserts,
      },
    });

    return redirect(`/orders/${groupOrderId}`);
  } catch (error) {
    if (error instanceof ApiError) {
      const errorMessage =
        typeof error.body === 'object' && error.body && 'error' in error.body
          ? ((error.body as { error?: { message?: string } }).error?.message ?? error.message)
          : error.message;

      return Response.json({ error: errorMessage }, { status: error.status });
    }

    return Response.json({ error: 'Unexpected error occurred.' }, { status: 500 });
  }
}

function SelectionGroup({
  title,
  items,
  selected,
  onToggle,
  icon: Icon,
  required = false,
  disabled = false,
  maxSelections,
}: {
  title: string;
  items: Array<{ id: string; name: string; price?: number; in_stock: boolean }>;
  selected: string[];
  onToggle: (id: string) => void;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  required?: boolean;
  disabled?: boolean;
  maxSelections?: number;
}) {
  const canSelectMore = maxSelections === undefined || selected.length < maxSelections;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon size={18} className="text-brand-400" />
          <Label className="text-sm normal-case tracking-normal">
            {title}
            {required && <span className="ml-1 text-rose-400">*</span>}
          </Label>
        </div>
        {maxSelections !== undefined && (
          <span className="text-xs text-slate-400">
            {selected.length}/{maxSelections}
          </span>
        )}
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const isSelected = selected.includes(item.id);
          const isDisabled = disabled || !item.in_stock || (!isSelected && !canSelectMore);
          const price = item.price ?? 0;

          return (
            <label
              key={item.id}
              className={cn(
                'group relative flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition',
                isSelected
                  ? 'border-brand-400/50 bg-brand-500/20 shadow-[0_4px_12px_rgba(99,102,241,0.25)]'
                  : 'border-white/10 bg-slate-800/50 hover:border-brand-400/30 hover:bg-slate-800/70',
                isDisabled && 'cursor-not-allowed',
                !item.in_stock &&
                  'opacity-60 grayscale border-slate-700/50 bg-slate-900/40 hover:border-slate-700/50 hover:bg-slate-900/40'
              )}
            >
              <Checkbox
                checked={isSelected}
                onChange={() => !isDisabled && onToggle(item.id)}
                disabled={isDisabled}
                className="shrink-0"
              />
              <div className="flex-1 min-w-0">
                <span
                  className={cn(
                    'block text-sm font-medium truncate',
                    !item.in_stock ? 'text-slate-500 line-through' : 'text-white'
                  )}
                >
                  {item.name}
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  {price > 0 && item.in_stock && (
                    <span className="text-xs text-slate-400">{price.toFixed(2)} CHF</span>
                  )}
                  {!item.in_stock && (
                    <Badge tone="warning" className="text-[9px] px-1.5 py-0 font-semibold">
                      Out of stock
                    </Badge>
                  )}
                </div>
              </div>
              {isSelected && !item.in_stock && (
                <div className="absolute inset-0 rounded-xl bg-slate-900/60 border-2 border-dashed border-slate-600/50 pointer-events-none" />
              )}
            </label>
          );
        })}
      </div>
    </div>
  );
}

export function OrderCreateRoute() {
  const { myOrder, stock } = useLoaderData() as LoaderData;
  const actionData = useActionData() as ActionData | undefined;
  const navigation = useNavigation();
  const params = useParams();
  const isSubmitting = navigation.state === 'submitting';

  // Get orderId from URL if editing
  const searchParams = new URLSearchParams(window.location.search);
  const editOrderId = searchParams.get('orderId');

  const defaultSelections = useMemo(() => {
    if (!myOrder) {
      return {
        size: '',
        meats: [] as Array<{ id: string; quantity: number }>,
        sauces: [] as string[],
        garnitures: [] as string[],
        extras: [] as string[],
        drinks: [] as string[],
        desserts: [] as string[],
        note: '',
      };
    }

    const taco = myOrder.items.tacos[0];
    return {
      size: taco?.size ?? '',
      meats: taco ? taco.meats.map((item) => ({ id: item.id, quantity: item.quantity ?? 1 })) : [],
      sauces: taco ? taco.sauces.map((item) => item.id) : [],
      garnitures: taco ? taco.garnitures.map((item) => item.id) : [],
      extras: myOrder.items.extras.map((extra) => extra.id),
      drinks: myOrder.items.drinks.map((drink) => drink.id),
      desserts: myOrder.items.desserts.map((dessert) => dessert.id),
      note: taco?.note ?? '',
    };
  }, [myOrder]);

  const [size, setSize] = useState(defaultSelections.size);
  const [meats, setMeats] = useState<Array<{ id: string; quantity: number }>>(
    defaultSelections.meats
  );
  const [sauces, setSauces] = useState<string[]>(defaultSelections.sauces);
  const [garnitures, setGarnitures] = useState<string[]>(defaultSelections.garnitures);
  const [extras, setExtras] = useState<string[]>(defaultSelections.extras);
  const [drinks, setDrinks] = useState<string[]>(defaultSelections.drinks);
  const [desserts, setDesserts] = useState<string[]>(defaultSelections.desserts);
  const [note, setNote] = useState(defaultSelections.note);

  const selectedTacoSize = useMemo(() => {
    if (!size) return null;
    return stock.tacos.find((t) => t.code === size);
  }, [size, stock.tacos]);

  const toggleSelection = (
    id: string,
    current: string[],
    setter: (value: string[]) => void,
    max?: number
  ) => {
    // Check if item is in stock
    const item = [
      ...stock.sauces,
      ...stock.garnishes,
      ...stock.extras,
      ...stock.drinks,
      ...stock.desserts,
    ].find((i) => i.id === id);
    if (item && !item.in_stock) {
      return; // Don't allow selection of out-of-stock items
    }

    if (current.includes(id)) {
      setter(current.filter((item) => item !== id));
    } else if (max === undefined || current.length < max) {
      setter([...current, id]);
    }
  };

  const updateMeatQuantity = (id: string, delta: number) => {
    // Don't allow if no taco size is selected
    if (!size || !selectedTacoSize) {
      return;
    }

    const meatItem = stock.meats.find((m) => m.id === id);
    // Don't allow if item is out of stock
    if (meatItem && !meatItem.in_stock) {
      return;
    }

    const existing = meats.find((m) => m.id === id);
    const currentQuantity = existing?.quantity ?? 0;
    const newQuantity = Math.max(0, currentQuantity + delta);

    // Calculate current total quantity
    const currentTotal = meats.reduce((sum, m) => sum + m.quantity, 0);
    const quantityChange = newQuantity - currentQuantity;
    const newTotal = currentTotal + quantityChange;

    // Check max meats limit (total quantity)
    if (newTotal > selectedTacoSize.maxMeats) {
      return; // Don't allow if it would exceed the limit
    }

    if (newQuantity === 0) {
      // Remove meat if quantity becomes 0
      setMeats(meats.filter((m) => m.id !== id));
    } else {
      // Add or update meat quantity
      if (existing) {
        setMeats(meats.map((m) => (m.id === id ? { ...m, quantity: newQuantity } : m)));
      } else {
        // Check max meats limit before adding (check total quantity)
        if (newTotal <= selectedTacoSize.maxMeats) {
          setMeats([...meats, { id, quantity: newQuantity }]);
        }
      }
    }
  };

  // Reset selections when size changes if they exceed limits
  useEffect(() => {
    if (!selectedTacoSize) {
      // Clear taco-related selections if size is unselected
      if (!size) {
        setMeats([]);
        setSauces([]);
        setGarnitures([]);
      }
      return;
    }

    // Check total quantity limit
    const currentTotal = meats.reduce((sum, m) => sum + m.quantity, 0);
    if (currentTotal > selectedTacoSize.maxMeats) {
      // Reduce quantities to fit within limit
      let remaining = selectedTacoSize.maxMeats;
      setMeats(
        meats
          .map((m) => {
            const take = Math.min(m.quantity, remaining);
            remaining -= take;
            return { ...m, quantity: take };
          })
          .filter((m) => m.quantity > 0)
      );
    }
    if (sauces.length > selectedTacoSize.maxSauces) {
      setSauces(sauces.slice(0, selectedTacoSize.maxSauces));
    }
    if (!selectedTacoSize.allowGarnitures && garnitures.length > 0) {
      setGarnitures([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size]);

  // Calculate total price
  const totalPrice = useMemo(() => {
    let total = 0;

    // Taco base price (fixed price per size, always quantity 1)
    if (selectedTacoSize) {
      total += selectedTacoSize.price;
    }

    // Meat prices (meats are added on top of base taco price)
    meats.forEach((meatSelection) => {
      const meat = stock.meats.find((m) => m.id === meatSelection.id);
      if (meat?.price) {
        total += meat.price * meatSelection.quantity;
      }
    });

    // Extras
    extras.forEach((extraId) => {
      const extra = stock.extras.find((e) => e.id === extraId);
      if (extra?.price) total += extra.price;
    });

    // Drinks
    drinks.forEach((drinkId) => {
      const drink = stock.drinks.find((d) => d.id === drinkId);
      if (drink?.price) total += drink.price;
    });

    // Desserts
    desserts.forEach((dessertId) => {
      const dessert = stock.desserts.find((d) => d.id === dessertId);
      if (dessert?.price) total += dessert.price;
    });

    return total;
  }, [selectedTacoSize, meats, extras, drinks, desserts, stock]);

  // Can submit if: (has taco with valid selections) OR (has other items)
  const totalMeatQuantity = meats.reduce((sum, m) => sum + m.quantity, 0);
  // Garnitures are always optional - never required
  const hasTaco = size && totalMeatQuantity > 0 && sauces.length > 0;
  const hasOtherItems = extras.length > 0 || drinks.length > 0 || desserts.length > 0;
  const tacoValid =
    !size || // No taco selected is OK
    (totalMeatQuantity > 0 &&
      sauces.length > 0 &&
      (!selectedTacoSize || totalMeatQuantity <= selectedTacoSize.maxMeats) &&
      (!selectedTacoSize || sauces.length <= selectedTacoSize.maxSauces) &&
      // Garnitures are optional - only validate if they're not available (allowGarnitures is false)
      (!selectedTacoSize || selectedTacoSize.allowGarnitures || garnitures.length === 0));

  const canSubmit = (hasTaco || hasOtherItems) && tacoValid;

  // Calculate completion progress (only if taco is selected)
  // Only show garnishes step if they are available (allowGarnitures is true)
  const progressSteps = size
    ? [
        {
          key: 'size',
          completed: !!size,
          label: 'Size',
          icon: Package,
          description: selectedTacoSize?.name ?? 'Select size',
        },
        {
          key: 'meats',
          completed: meats.reduce((sum, m) => sum + m.quantity, 0) > 0,
          label: 'Meats',
          icon: Plus,
          description: (() => {
            const qty = meats.reduce((sum, m) => sum + m.quantity, 0);
            return qty > 0
              ? `${qty} selected${selectedTacoSize ? ` (max ${selectedTacoSize.maxMeats})` : ''}`
              : 'Add meats';
          })(),
        },
        {
          key: 'sauces',
          completed: sauces.length > 0,
          label: 'Sauces',
          icon: Plus,
          description:
            sauces.length > 0
              ? `${sauces.length} selected${selectedTacoSize ? ` (max ${selectedTacoSize.maxSauces})` : ''}`
              : 'Add sauces',
        },
        // Only show garnishes step if they are available
        ...(selectedTacoSize && selectedTacoSize.allowGarnitures
          ? [
              {
                key: 'garnishes',
                completed: garnitures.length > 0,
                label: 'Garnishes',
                icon: CheckCircle,
                description:
                  garnitures.length > 0
                    ? `${garnitures.length} selected`
                    : 'Add garnishes (optional)',
              },
            ]
          : []),
      ]
    : [];
  const completedSteps = progressSteps.filter((s) => s.completed).length;
  const progressPercentage =
    progressSteps.length > 0 ? (completedSteps / progressSteps.length) * 100 : 0;

  // Price breakdown
  const priceBreakdown = useMemo(() => {
    const breakdown = [];
    if (selectedTacoSize) {
      breakdown.push({
        label: selectedTacoSize.name,
        price: selectedTacoSize.price,
      });
    }
    extras.forEach((extraId) => {
      const extra = stock.extras.find((e) => e.id === extraId);
      if (extra?.price) {
        breakdown.push({ label: extra.name, price: extra.price });
      }
    });
    drinks.forEach((drinkId) => {
      const drink = stock.drinks.find((d) => d.id === drinkId);
      if (drink?.price) {
        breakdown.push({ label: drink.name, price: drink.price });
      }
    });
    desserts.forEach((dessertId) => {
      const dessert = stock.desserts.find((d) => d.id === dessertId);
      if (dessert?.price) {
        breakdown.push({ label: dessert.name, price: dessert.price });
      }
    });
    return breakdown;
  }, [selectedTacoSize, extras, drinks, desserts, stock]);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link
          to={`/orders/${params.orderId}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-brand-100 transition-colors cursor-pointer"
        >
          <ArrowLeft size={18} />
          Back to order
        </Link>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-brand-500/15 via-slate-900/80 to-slate-950/90 p-8 shadow-[0_40px_120px_rgba(8,47,73,0.35)]">
        <div className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-brand-400/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-12 h-60 w-60 rounded-full bg-purple-500/25 blur-3xl" />
        <div className="relative space-y-6">
          <div className="flex items-center gap-3">
            <div className="grid h-14 w-14 place-items-center rounded-xl bg-gradient-to-br from-brand-400 via-brand-500 to-sky-500 shadow-[0_10px_30px_rgba(99,102,241,0.35)]">
              <span className="text-3xl">🌮</span>
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-semibold tracking-tight text-white lg:text-4xl">
                Build your perfect taco
              </h1>
              <p className="text-sm text-slate-300 mt-1">
                Craft your custom order with all your favorite ingredients
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)]">
        <Form method="post" className="space-y-8">
          <input type="hidden" name="tacoSize" value={size} />
          {editOrderId && <input type="hidden" name="editOrderId" value={editOrderId} />}
          <Card className="p-6">
            <CardHeader className="gap-3 pb-6">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-400/20 to-sky-500/20 border border-brand-400/30">
                  <Package size={20} className="text-brand-300" />
                </div>
                <div>
                  <CardTitle className="text-white">Choose your size</CardTitle>
                  <CardDescription className="mt-0.5">
                    Select the perfect size for your taco
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {stock.tacos.map((tacoSize) => {
                  const config = TACO_SIZE_CONFIG[tacoSize.code];
                  const emoji = config?.emoji || '🌮';
                  const isSelected = size === tacoSize.code;

                  return (
                    <div
                      key={tacoSize.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSize(isSelected ? '' : tacoSize.code)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSize(isSelected ? '' : tacoSize.code);
                        }
                      }}
                      className={cn(
                        'group relative flex cursor-pointer flex-col items-center gap-3 rounded-2xl border p-5 transition-all duration-200',
                        isSelected
                          ? 'border-brand-400/60 bg-gradient-to-br from-brand-500/25 via-brand-500/15 to-sky-500/10 shadow-[0_8px_24px_rgba(99,102,241,0.35)] scale-[1.02]'
                          : 'border-white/10 bg-slate-800/50 hover:border-brand-400/40 hover:bg-slate-800/70 hover:shadow-[0_4px_12px_rgba(99,102,241,0.15)]'
                      )}
                    >
                      <div className="relative">
                        <span className="text-4xl transition-transform duration-200 group-hover:scale-110">
                          {emoji}
                        </span>
                        {isSelected && (
                          <div className="absolute -top-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-brand-500 border-2 border-slate-900">
                            <CheckCircle size={14} className="text-white" />
                          </div>
                        )}
                      </div>
                      <div className="text-center space-y-1">
                        <span className="block text-sm font-semibold text-white">
                          {tacoSize.name}
                        </span>
                        <span className="block text-xs font-medium text-brand-200">
                          {tacoSize.price.toFixed(2)} CHF
                        </span>
                        {config && (
                          <span className="block text-xs text-slate-400">
                            {config.maxMeats} meat{config.maxMeats !== 1 ? 's' : ''} ·{' '}
                            {config.maxSauces} sauces
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6 rounded-3xl border border-white/10 bg-slate-900/50 p-6">
            <div className="flex items-center gap-3 pb-4 border-b border-white/10">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-amber-400/20 to-rose-500/20 border border-amber-400/30">
                <span className="text-xl">🍖</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Customize your taco</h2>
                <p className="text-xs text-slate-400">Select your meats, sauces, and garnishes</p>
              </div>
            </div>

            <Card className="border-white/10 bg-slate-800/30">
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Plus size={18} className="text-brand-400" />
                      <Label className="text-sm normal-case tracking-normal">
                        Meats
                        {size && <span className="ml-1 text-rose-400">*</span>}
                      </Label>
                    </div>
                    <div className="flex items-center gap-3">
                      {selectedTacoSize?.maxMeats !== undefined && (
                        <span className="text-xs text-slate-400">
                          {meats.reduce((sum, m) => sum + m.quantity, 0)}/
                          {selectedTacoSize.maxMeats} total
                        </span>
                      )}
                      {meats.filter((m) => m.quantity > 0).length > 0 && (
                        <Badge tone="brand" className="text-xs">
                          {meats.filter((m) => m.quantity > 0).length} type
                          {meats.filter((m) => m.quantity > 0).length !== 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {stock.meats.map((item) => {
                      const existing = meats.find((m) => m.id === item.id);
                      const quantity = existing?.quantity ?? 0;
                      const hasQuantity = quantity > 0;
                      const currentTotal = meats.reduce((sum, m) => sum + m.quantity, 0);
                      const canAddMore =
                        size &&
                        selectedTacoSize &&
                        (currentTotal < selectedTacoSize.maxMeats || hasQuantity);
                      const isDisabled =
                        !size ||
                        !selectedTacoSize ||
                        !item.in_stock ||
                        (!canAddMore && quantity === 0);

                      const canClickToAdd =
                        quantity === 0 &&
                        size &&
                        selectedTacoSize &&
                        item.in_stock &&
                        canAddMore &&
                        !isSubmitting;

                      return (
                        <div
                          key={item.id}
                          onClick={() => {
                            if (canClickToAdd) {
                              updateMeatQuantity(item.id, 1);
                            }
                          }}
                          role={canClickToAdd ? 'button' : undefined}
                          tabIndex={canClickToAdd ? 0 : undefined}
                          onKeyDown={(e) => {
                            if (canClickToAdd && (e.key === 'Enter' || e.key === ' ')) {
                              e.preventDefault();
                              updateMeatQuantity(item.id, 1);
                            }
                          }}
                          className={cn(
                            'group relative rounded-2xl border p-4 transition-all duration-200',
                            hasQuantity
                              ? 'border-brand-400/60 bg-gradient-to-br from-brand-500/25 via-brand-500/15 to-sky-500/10 shadow-[0_8px_24px_rgba(99,102,241,0.35)] scale-[1.01]'
                              : 'border-white/10 bg-slate-800/50 hover:border-brand-400/40 hover:bg-slate-800/70 hover:shadow-[0_4px_12px_rgba(99,102,241,0.15)]',
                            canClickToAdd && 'cursor-pointer',
                            isDisabled && quantity === 0 && !canClickToAdd && 'cursor-not-allowed',
                            !item.in_stock &&
                              'opacity-60 grayscale border-slate-700/50 bg-slate-900/40 hover:border-slate-700/50 hover:bg-slate-900/40'
                          )}
                        >
                          {!item.in_stock && (
                            <div className="absolute inset-0 rounded-2xl bg-slate-900/40 border-2 border-dashed border-slate-600/30 pointer-events-none z-10" />
                          )}
                          <div className="flex items-start gap-3 mb-4 relative z-0">
                            <div className="flex-1 min-w-0">
                              <span
                                className={cn(
                                  'block text-sm font-semibold truncate',
                                  !item.in_stock ? 'text-slate-500 line-through' : 'text-white'
                                )}
                              >
                                {item.name}
                              </span>
                              <div className="flex items-center gap-2 mt-0.5">
                                {(item.price ?? 0) > 0 && item.in_stock && (
                                  <span className="text-xs text-slate-400">
                                    {item.price!.toFixed(2)} CHF
                                  </span>
                                )}
                                {!item.in_stock && (
                                  <Badge
                                    tone="warning"
                                    className="text-[9px] px-1.5 py-0 font-semibold"
                                  >
                                    Out of stock
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-3 border-t border-white/10">
                            <span className="text-xs font-medium text-slate-300">Quantity</span>
                            <div
                              className="flex items-center gap-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={() => updateMeatQuantity(item.id, -1)}
                                disabled={isSubmitting || quantity <= 0}
                                className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-slate-900/60 text-white transition-all hover:border-brand-400/50 hover:bg-slate-800/80 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-sm"
                              >
                                <Minus size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={() => updateMeatQuantity(item.id, 1)}
                                disabled={isSubmitting || !item.in_stock || !canAddMore}
                                className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-slate-900/60 text-white transition-all hover:border-brand-400/50 hover:bg-slate-800/80 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                          </div>
                          {hasQuantity && quantity > 1 && (
                            <div className="absolute top-2 right-2">
                              <Badge tone="brand" className="text-[10px] px-1.5 py-0.5 font-bold">
                                ×{quantity}
                              </Badge>
                            </div>
                          )}
                          {hasQuantity && (
                            <input
                              type="hidden"
                              name={`meat_quantity_${item.id}`}
                              value={quantity}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                {meats
                  .filter((m) => m.quantity > 0)
                  .map((meat) => (
                    <input key={meat.id} type="hidden" name="meats" value={meat.id} />
                  ))}
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-slate-800/30">
              <CardContent className="p-6 space-y-6">
                <SelectionGroup
                  title="Sauces"
                  items={stock.sauces}
                  selected={sauces}
                  onToggle={(id) =>
                    toggleSelection(id, sauces, setSauces, selectedTacoSize?.maxSauces)
                  }
                  icon={Plus}
                  required
                  maxSelections={selectedTacoSize?.maxSauces}
                  disabled={!size}
                />
                {sauces.map((id) => (
                  <input key={id} type="hidden" name="sauces" value={id} />
                ))}
              </CardContent>
            </Card>

            {selectedTacoSize && selectedTacoSize.allowGarnitures && (
              <Card className="border-white/10 bg-slate-800/30">
                <CardContent className="p-6 space-y-6">
                  <SelectionGroup
                    title="Garnishes"
                    items={stock.garnishes}
                    selected={garnitures}
                    onToggle={(id) => toggleSelection(id, garnitures, setGarnitures)}
                    icon={CheckCircle}
                    disabled={!size}
                  />
                  {garnitures.map((id) => (
                    <input key={id} type="hidden" name="garnitures" value={id} />
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {size && (
            <Card className="p-6">
              <CardHeader className="gap-2">
                <CardTitle className="text-white">Special instructions</CardTitle>
                <CardDescription>Any special requests for the kitchen?</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  name="note"
                  placeholder="e.g., No onions, extra spicy, extra sauce on the side..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  disabled={isSubmitting}
                  rows={3}
                  className="resize-none"
                />
                <input type="hidden" name="note" value={note} />
              </CardContent>
            </Card>
          )}

          <div className="space-y-6 rounded-3xl border border-white/10 bg-slate-900/50 p-6">
            <div className="flex items-center gap-3 pb-4 border-b border-white/10">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-violet-400/20 to-purple-500/20 border border-violet-400/30">
                <ShoppingBag01 size={20} className="text-violet-300" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Add extras</h2>
                <p className="text-xs text-slate-400">Complete your meal with sides and drinks</p>
              </div>
            </div>

            <Card className="border-white/10 bg-slate-800/30">
              <CardContent className="p-6 space-y-6">
                <SelectionGroup
                  title="Extras"
                  items={stock.extras}
                  selected={extras}
                  onToggle={(id) => toggleSelection(id, extras, setExtras)}
                  icon={Plus}
                />
                {extras.map((id) => (
                  <input key={id} type="hidden" name="extras" value={id} />
                ))}
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-slate-800/30">
              <CardContent className="p-6 space-y-6">
                <SelectionGroup
                  title="Drinks"
                  items={stock.drinks}
                  selected={drinks}
                  onToggle={(id) => toggleSelection(id, drinks, setDrinks)}
                  icon={Plus}
                />
                {drinks.map((id) => (
                  <input key={id} type="hidden" name="drinks" value={id} />
                ))}
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-slate-800/30">
              <CardContent className="p-6 space-y-6">
                <SelectionGroup
                  title="Desserts"
                  items={stock.desserts}
                  selected={desserts}
                  onToggle={(id) => toggleSelection(id, desserts, setDesserts)}
                  icon={Plus}
                />
                {desserts.map((id) => (
                  <input key={id} type="hidden" name="desserts" value={id} />
                ))}
              </CardContent>
            </Card>
          </div>

          {actionData?.error && <Alert tone="error">{actionData.error}</Alert>}

          <div className="flex flex-wrap items-center gap-4 pb-8">
            <Link to={`/orders/${params.orderId}`} className="cursor-pointer">
              <Button type="button" variant="outline" disabled={isSubmitting}>
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              loading={isSubmitting}
              disabled={!canSubmit || isSubmitting}
              fullWidth
              className="sm:w-auto"
            >
              {editOrderId ? 'Update order' : 'Save my order'}
            </Button>
          </div>
        </Form>

        {/* Sticky Order Preview Sidebar */}
        <div className="lg:sticky lg:top-8 lg:h-fit lg:max-h-[calc(100vh-4rem)]">
          <Card className="p-6 border-brand-400/30 bg-gradient-to-br from-brand-500/10 via-slate-900/80 to-slate-950/90 shadow-[0_30px_90px_rgba(8,47,73,0.35)] flex flex-col h-full max-h-[calc(100vh-4rem)]">
            {/* Compact Progress Stepper (only show if taco is selected) */}
            {size && progressSteps.length > 0 && (
              <div className="mb-6 pb-6 border-b border-white/10">
                <div className="space-y-3">
                  {/* Progress bar */}
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800/60">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand-400 via-brand-500 to-sky-500 transition-all duration-700 ease-out shadow-[0_0_8px_rgba(99,102,241,0.4)]"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>

                  {/* Compact step indicators */}
                  <div className="flex items-center justify-between gap-2">
                    {progressSteps.map((step, index) => {
                      const StepIcon = step.icon;
                      const isActive = step.completed;
                      const isCurrent =
                        !step.completed && (index === 0 || progressSteps[index - 1]?.completed);

                      return (
                        <div
                          key={step.key}
                          className="flex flex-col items-center gap-1 flex-1 min-w-0"
                        >
                          <div
                            className={cn(
                              'relative z-10 grid h-7 w-7 place-items-center rounded-full border-2 transition-all duration-300 shrink-0',
                              isActive
                                ? 'border-brand-400/60 bg-gradient-to-br from-brand-500/30 to-sky-500/20 shadow-[0_2px_8px_rgba(99,102,241,0.3)] scale-105'
                                : isCurrent
                                  ? 'border-brand-400/40 bg-brand-500/10 shadow-[0_1px_4px_rgba(99,102,241,0.2)]'
                                  : 'border-white/20 bg-slate-800/50'
                            )}
                          >
                            {isActive ? (
                              <CheckCircle size={14} className="text-brand-300" />
                            ) : (
                              <StepIcon
                                size={12}
                                className={isCurrent ? 'text-brand-400' : 'text-slate-500'}
                              />
                            )}
                          </div>
                          <p
                            className={cn(
                              'text-[10px] font-medium transition-colors text-center truncate w-full',
                              isActive
                                ? 'text-brand-100'
                                : isCurrent
                                  ? 'text-slate-300'
                                  : 'text-slate-500'
                            )}
                            title={step.label}
                          >
                            {step.label}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            <CardHeader className="gap-3 pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-400 via-brand-500 to-sky-500">
                  <ShoppingBag01 size={20} className="text-white" />
                </div>
                <div>
                  <CardTitle className="text-white">Order summary</CardTitle>
                  <CardDescription className="mt-0.5">Review your selections</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col flex-1 min-h-0 pt-4 overflow-hidden">
              {/* Scrollable content area */}
              <div className="space-y-4 overflow-y-auto flex-1 min-h-0 max-h-full pr-2 -mr-2">
                {selectedTacoSize ? (
                  <div className="space-y-3">
                    <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">
                            {selectedTacoSize.name}
                          </p>
                          <div className="mt-1.5 flex flex-wrap gap-1.5 text-xs">
                            {meats.length > 0 && (
                              <span className="rounded-full bg-slate-800/60 px-2 py-0.5 text-slate-300">
                                {meats.reduce((sum, m) => sum + m.quantity, 0)} meat
                                {meats.reduce((sum, m) => sum + m.quantity, 0) !== 1 ? 's' : ''}
                              </span>
                            )}
                            {sauces.length > 0 && (
                              <span className="rounded-full bg-slate-800/60 px-2 py-0.5 text-slate-300">
                                {sauces.length} sauce{sauces.length !== 1 ? 's' : ''}
                              </span>
                            )}
                            {garnitures.length > 0 && (
                              <span className="rounded-full bg-slate-800/60 px-2 py-0.5 text-slate-300">
                                {garnitures.length} garnish{garnitures.length !== 1 ? 'es' : ''}
                              </span>
                            )}
                          </div>
                          {meats.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {meats.map((meat) => {
                                const meatItem = stock.meats.find((m) => m.id === meat.id);
                                return (
                                  <div key={meat.id} className="text-xs text-slate-400">
                                    {meat.quantity}x {meatItem?.name ?? meat.id}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-brand-100 shrink-0">
                          {selectedTacoSize.price.toFixed(2)} CHF
                        </p>
                      </div>
                    </div>

                    {priceBreakdown.length > 1 && (
                      <div className="space-y-2 pt-2 border-t border-white/10">
                        {priceBreakdown.slice(1).map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs">
                            <span className="text-slate-400">{item.label}</span>
                            <span className="font-medium text-slate-300">
                              {item.price.toFixed(2)} CHF
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {note.trim() && (
                      <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300 mb-1">
                          Special instructions
                        </p>
                        <p className="text-xs text-amber-100">{note.trim()}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-white/15 bg-slate-900/30 p-8 text-center">
                    <p className="text-sm text-slate-400">
                      Select a taco size to see your order summary
                    </p>
                  </div>
                )}
              </div>

              {/* Fixed total price section - always visible */}
              <div className="pt-4 border-t border-white/10 shrink-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">Total</span>
                  <span className="text-2xl font-bold text-brand-100">
                    {totalPrice.toFixed(2)} CHF
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  {size ? '1 taco' : 'No taco'} · {extras.length} extra
                  {extras.length !== 1 ? 's' : ''} · {drinks.length} drink
                  {drinks.length !== 1 ? 's' : ''} · {desserts.length} dessert
                  {desserts.length !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Fixed validation message - always visible */}
              {!canSubmit && (
                <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-500/10 p-3 shrink-0">
                  <p className="text-xs text-amber-200">
                    {size && meats.length === 0 && 'Select at least one meat. '}
                    {size && sauces.length === 0 && 'Select at least one sauce. '}
                    {size &&
                      garnitures.length === 0 &&
                      selectedTacoSize?.allowGarnitures &&
                      'Select at least one garnish. '}
                    {!size &&
                      !hasOtherItems &&
                      'Select at least a taco or some extras/drinks/desserts. '}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
