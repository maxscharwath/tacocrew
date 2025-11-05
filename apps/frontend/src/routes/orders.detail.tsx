import { CheckCircle } from '@untitledui/icons/CheckCircle';
import { Edit03 } from '@untitledui/icons/Edit03';
import { Lock01 } from '@untitledui/icons/Lock01';
import { Plus } from '@untitledui/icons/Plus';
import { ShoppingBag01 } from '@untitledui/icons/ShoppingBag01';
import { Trash01 } from '@untitledui/icons/Trash01';
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
  AvatarLabelGroup,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  StatusBadge,
} from '@/components/ui';
import { cn } from '@/lib/utils';
import { OrdersApi, StockApi } from '../lib/api';
import { ApiError } from '../lib/api/http';
import type { UpsertUserOrderBody } from '../lib/api/orders';
import { sessionStore } from '../lib/session/store';
import { TACO_SIZE_CONFIG } from '../lib/taco-config';

type LoaderData = {
  groupOrder: Awaited<ReturnType<typeof OrdersApi.getGroupOrderWithOrders>>['groupOrder'];
  userOrders: Awaited<ReturnType<typeof OrdersApi.getGroupOrderWithOrders>>['userOrders'];
  myOrders: Awaited<ReturnType<typeof OrdersApi.getGroupOrderWithOrders>>['userOrders'];
  isLeader: boolean;
  stock: Awaited<ReturnType<typeof StockApi.getStock>>;
};

type ActionData = {
  form: 'user-order' | 'submit' | 'delete';
  error: string;
};

export async function orderDetailLoader({ params }: LoaderFunctionArgs) {
  const groupOrderId = params.orderId;
  if (!groupOrderId) {
    throw new Response('Order not found', { status: 404 });
  }

  const session = sessionStore.getSession();
  if (!session) {
    throw redirect('/login');
  }

  const [groupOrderWithUsers, stock] = await Promise.all([
    OrdersApi.getGroupOrderWithOrders(groupOrderId),
    StockApi.getStock(),
  ]);

  const myOrders = groupOrderWithUsers.userOrders.filter(
    (order) => order.userId === session.userId
  );
  const isLeader = groupOrderWithUsers.groupOrder.leaderId === session.userId;

  return Response.json({
    groupOrder: groupOrderWithUsers.groupOrder,
    userOrders: groupOrderWithUsers.userOrders,
    myOrders,
    isLeader,
    stock,
  });
}

export async function orderDetailAction({ request, params }: ActionFunctionArgs) {
  const groupOrderId = params.orderId;
  if (!groupOrderId) {
    throw new Response('Order not found', { status: 404 });
  }

  const formData = await request.formData();
  const intent = formData.get('_intent');

  try {
    if (intent === 'user-order') {
      type TacoSize = UpsertUserOrderBody['items']['tacos'][number]['size'];

      const size = formData.get('tacoSize')?.toString() as TacoSize | undefined;
      const meats = formData
        .getAll('meats')
        .map((value) => ({ id: value.toString(), quantity: 1 }));
      const sauces = formData.getAll('sauces').map((value) => ({ id: value.toString() }));
      const garnitures = formData.getAll('garnitures').map((value) => ({ id: value.toString() }));
      const extras = formData
        .getAll('extras')
        .map((value) => ({ id: value.toString(), quantity: 1 }));
      const drinks = formData
        .getAll('drinks')
        .map((value) => ({ id: value.toString(), quantity: 1 }));
      const desserts = formData
        .getAll('desserts')
        .map((value) => ({ id: value.toString(), quantity: 1 }));
      const note = formData.get('note')?.toString().trim();
      const tacoQuantity = Number(formData.get('tacoQuantity') ?? 1) || 1;

      if (!size || meats.length === 0 || sauces.length === 0 || garnitures.length === 0) {
        return Response.json(
          {
            form: 'user-order',
            error: 'Please select at least one meat, sauce, and garnish.',
          },
          { status: 400 }
        );
      }

      await OrdersApi.upsertUserOrder(groupOrderId, {
        items: {
          tacos: [
            {
              size,
              meats,
              sauces,
              garnitures,
              note: note || undefined,
              quantity: tacoQuantity,
            },
          ],
          extras,
          drinks,
          desserts,
        },
      });

      return redirect(`/orders/${groupOrderId}`);
    }

    if (intent === 'delete-user-order') {
      const itemId = formData.get('itemId')?.toString();
      if (!itemId) {
        return Response.json(
          { form: 'delete', error: 'Missing order identifier.' },
          { status: 400 }
        );
      }

      await OrdersApi.deleteUserOrder(groupOrderId, itemId);
      return redirect(`/orders/${groupOrderId}`);
    }

    if (intent === 'submit-group-order') {
      const customerName = formData.get('customerName')?.toString().trim();
      const customerPhone = formData.get('customerPhone')?.toString().trim();
      const deliveryType = formData.get('deliveryType')?.toString() as 'livraison' | 'emporter';
      const road = formData.get('road')?.toString().trim();
      const houseNumber = formData.get('houseNumber')?.toString().trim();
      const postcode = formData.get('postcode')?.toString().trim();
      const city = formData.get('city')?.toString().trim();
      const state = formData.get('state')?.toString().trim();
      const country = formData.get('country')?.toString().trim();
      const requestedFor = formData.get('requestedFor')?.toString();

      if (
        !customerName ||
        !customerPhone ||
        !deliveryType ||
        !road ||
        !postcode ||
        !city ||
        !requestedFor
      ) {
        return Response.json(
          {
            form: 'submit',
            error: 'All customer, delivery type, address, and requested time fields are required.',
          },
          { status: 400 }
        );
      }

      await OrdersApi.submitGroupOrder(groupOrderId, {
        customer: {
          name: customerName,
          phone: customerPhone,
        },
        delivery: {
          type: deliveryType,
          address: {
            road,
            house_number: houseNumber || undefined,
            postcode,
            city,
            state: state || undefined,
            country: country || undefined,
          },
          requestedFor,
        },
      });

      return redirect(`/orders/${groupOrderId}`);
    }
  } catch (error) {
    if (error instanceof ApiError) {
      const errorMessage =
        typeof error.body === 'object' && error.body && 'error' in error.body
          ? ((error.body as { error?: { message?: string } }).error?.message ?? error.message)
          : error.message;

      const form =
        intent === 'submit-group-order'
          ? 'submit'
          : intent === 'delete-user-order'
            ? 'delete'
            : 'user-order';
      return Response.json({ form, error: errorMessage }, { status: error.status });
    }

    return Response.json(
      { form: 'user-order', error: 'Unexpected error occurred.' },
      { status: 500 }
    );
  }

  return redirect(`/orders/${groupOrderId}`);
}

function _OrderItemChip({ label, value }: { label: string; value: string }) {
  if (!value || value === '—') {
    return null;
  }

  return (
    <div className="group flex items-center gap-2 rounded-xl border border-white/10 bg-slate-800/50 px-3 py-2 transition hover:border-brand-400/30 hover:bg-slate-800/70">
      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
        {label}
      </span>
      <span className="text-sm font-medium text-white">{value}</span>
    </div>
  );
}

function _OrderSection({
  title,
  items,
  icon: Icon,
  emptyText = 'None selected',
  showQuantity = false,
}: {
  title: string;
  items: string[] | Array<{ name: string; quantity?: number }>;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  emptyText?: string;
  showQuantity?: boolean;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/10 bg-slate-900/30 p-3">
        <p className="text-xs text-slate-500">{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Icon size={16} className="text-brand-400" />
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          {title}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item, idx) => {
          const name = typeof item === 'string' ? item : item.name;
          const quantity =
            typeof item === 'object' && 'quantity' in item ? item.quantity : undefined;

          return (
            <span
              key={idx}
              className="inline-flex items-center gap-1.5 rounded-lg border border-brand-400/20 bg-brand-500/10 px-2.5 py-1 text-xs font-medium text-brand-100"
            >
              <CheckCircle size={12} className="text-brand-300" />
              {name}
              {quantity !== undefined && quantity > 1 && (
                <Badge tone="brand" className="text-[9px] px-1.5 py-0 font-semibold">
                  ×{quantity}
                </Badge>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function _formatList(values: string[]) {
  if (values.length === 0) {
    return '—';
  }

  return values.join(', ');
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDateTimeRange(start: string, end: string) {
  return `${formatDateTime(start)} → ${formatDateTime(end)}`;
}

export function OrderDetailRoute() {
  const { groupOrder, userOrders, isLeader, stock } = useLoaderData() as LoaderData;
  const _actionData = useActionData() as ActionData | undefined;
  const navigation = useNavigation();
  const params = useParams();
  const isSubmitting = navigation.state === 'submitting';
  const session = sessionStore.getSession();
  const currentUserId = session?.userId;

  // Calculate total price across all orders
  // Backend stores taco.price as sum of meat prices only (not including base taco size price)
  // So we need: base taco size price + taco.price (meat prices)
  const totalPrice = userOrders.reduce((sum, order) => {
    const taco = order.items.tacos[0];

    // Get base taco size price from stock
    const tacoSizeBasePrice = taco
      ? (() => {
          const tacoSize = stock.tacos.find((t) => t.code === taco.size);
          return tacoSize ? tacoSize.price * (taco.quantity ?? 1) : 0;
        })()
      : 0;

    // taco.price is already the sum of meat prices (from backend)
    const meatPrices = taco ? taco.price * (taco.quantity ?? 1) : 0;
    const tacoTotalPrice = tacoSizeBasePrice + meatPrices;

    const orderTotal =
      tacoTotalPrice +
      order.items.extras.reduce((s, extra) => s + extra.price * (extra.quantity ?? 1), 0) +
      order.items.drinks.reduce((s, drink) => s + drink.price * (drink.quantity ?? 1), 0) +
      order.items.desserts.reduce((s, dessert) => s + dessert.price * (dessert.quantity ?? 1), 0);
    return sum + orderTotal;
  }, 0);

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-brand-500/20 via-slate-900/80 to-slate-950/90 p-6 lg:p-8">
        <div className="pointer-events-none absolute -top-24 right-0 h-60 w-60 rounded-full bg-brand-400/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-10 h-56 w-56 rounded-full bg-purple-500/25 blur-3xl" />
        <div className="relative space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <Badge tone="brand" pill>
                Group order
              </Badge>
              <StatusBadge status={groupOrder.status} />
            </div>
            {userOrders.length > 0 && (
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Participants
                  </p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {new Set(userOrders.map((o) => o.userId)).size}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {userOrders.length} order{userOrders.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="h-12 w-px bg-white/10" />
                <div className="text-right">
                  <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Total Price
                  </p>
                  <p className="text-2xl font-bold text-brand-100 mt-1">
                    {totalPrice.toFixed(2)} CHF
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">All orders</p>
                </div>
              </div>
            )}
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight text-white">
              {groupOrder.name ?? 'Untitled group order'}
            </h1>
            <p className="text-sm text-slate-200">
              {formatDateTimeRange(groupOrder.startDate, groupOrder.endDate)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-white/10">
            <Link to={`/orders/${params.orderId}/create`} className="cursor-pointer">
              <Button variant="outline" className="gap-2" size="sm">
                <Plus size={16} />
                Create new order
              </Button>
            </Link>
            {isLeader && groupOrder.status !== 'submitted' && (
              <Link to={`/orders/${params.orderId}/submit`} className="cursor-pointer">
                <Button
                  variant="primary"
                  className="gap-2 bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-600 hover:via-emerald-700 hover:to-teal-700 shadow-xl shadow-emerald-500/30 text-white font-bold"
                  size="sm"
                >
                  <Lock01 size={18} />
                  Submit to Kitchen
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      <div className="space-y-6">
        <Card className="p-5 border-white/10 bg-slate-900/50">
          <CardHeader className="gap-2 pb-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-400 via-brand-500 to-sky-500 shadow-lg shadow-brand-500/25">
                <ShoppingBag01 size={18} className="text-white" />
              </div>
              <div>
                <CardTitle className="text-white text-lg">All orders</CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  View all orders in this group order
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="gap-4 pt-0">
            {userOrders.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {userOrders.map((order) => {
                  const canEdit = isLeader || order.userId === currentUserId;
                  const canDelete = isLeader || order.userId === currentUserId;

                  const taco = order.items.tacos[0];
                  const meatsList = taco
                    ? taco.meats.map((item) => ({ name: item.name, quantity: item.quantity ?? 1 }))
                    : [];
                  const saucesList = taco ? taco.sauces.map((item) => item.name) : [];
                  const garnishesList = taco ? taco.garnitures.map((item) => item.name) : [];
                  const extrasList = order.items.extras.map((extra) => extra.name);
                  const drinksList = order.items.drinks.map((drink) => drink.name);
                  const dessertsList = order.items.desserts.map((dessert) => dessert.name);

                  // Calculate total price for this order
                  // Backend stores taco.price as sum of meat prices only
                  // So we need: base taco size price + taco.price (meat prices)
                  const tacoSizeBasePrice = taco
                    ? (() => {
                        const tacoSize = stock.tacos.find((t) => t.code === taco.size);
                        return tacoSize ? tacoSize.price * (taco.quantity ?? 1) : 0;
                      })()
                    : 0;
                  const meatPrices = taco ? taco.price * (taco.quantity ?? 1) : 0;
                  const tacoTotalPrice = tacoSizeBasePrice + meatPrices;

                  const totalPrice =
                    tacoTotalPrice +
                    order.items.extras.reduce(
                      (sum, extra) => sum + extra.price * (extra.quantity ?? 1),
                      0
                    ) +
                    order.items.drinks.reduce(
                      (sum, drink) => sum + drink.price * (drink.quantity ?? 1),
                      0
                    ) +
                    order.items.desserts.reduce(
                      (sum, dessert) => sum + dessert.price * (dessert.quantity ?? 1),
                      0
                    );

                  const itemCount =
                    (taco ? 1 : 0) + extrasList.length + drinksList.length + dessertsList.length;

                  const isMyOrder = order.userId === currentUserId;

                  return (
                    <div
                      key={order.id}
                      className={cn(
                        'group relative flex flex-col rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-0.5',
                        isMyOrder
                          ? 'border-brand-400/60 bg-gradient-to-br from-brand-500/20 via-slate-900/80 to-slate-950/90 shadow-[0_8px_24px_rgba(99,102,241,0.35)] hover:border-brand-400/80 hover:shadow-2xl hover:shadow-brand-500/40'
                          : 'border-white/10 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-slate-950/90 hover:border-brand-400/50 hover:shadow-2xl hover:shadow-brand-500/25'
                      )}
                    >
                      <div className="absolute top-4 right-4 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        {canEdit && (
                          <Link
                            to={`/orders/${params.orderId}/create?orderId=${order.id}`}
                            className="cursor-pointer"
                          >
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 rounded-lg hover:bg-brand-500/25 hover:scale-110 transition-transform"
                            >
                              <Edit03 size={16} className="text-brand-300" />
                            </Button>
                          </Link>
                        )}
                        {canDelete && (
                          <Form method="post">
                            <input type="hidden" name="_intent" value="delete-user-order" />
                            <input type="hidden" name="itemId" value={order.id} />
                            <Button
                              type="submit"
                              variant="ghost"
                              size="sm"
                              disabled={isSubmitting}
                              className="h-8 w-8 p-0 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/25 hover:scale-110 transition-transform"
                            >
                              <Trash01 size={16} />
                            </Button>
                          </Form>
                        )}
                      </div>

                      <div className="flex flex-col flex-1 space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-brand-500/30 via-brand-500/20 to-sky-500/25 border border-brand-400/50 shadow-md shadow-brand-500/20">
                            <span className="text-xl">
                              {taco
                                ? (() => {
                                    const config =
                                      TACO_SIZE_CONFIG[taco.size as keyof typeof TACO_SIZE_CONFIG];
                                    return config?.emoji || '🌮';
                                  })()
                                : '🌮'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                              {isMyOrder ? (
                                <Badge
                                  tone="brand"
                                  className="text-[9px] px-1.5 py-0.5 font-bold bg-brand-400/30 border border-brand-400/50 shrink-0"
                                >
                                  MY ORDER
                                </Badge>
                              ) : (
                                <Badge
                                  tone="brand"
                                  className="text-[10px] px-2 py-0.5 font-semibold shrink-0"
                                >
                                  {order.username ?? 'Unknown'}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm font-bold text-white leading-tight">
                              {taco?.size?.replace('tacos_', '').replace('_', ' ') ?? 'Extras only'}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {taco && (
                              <span className="inline-flex items-center rounded-lg border border-brand-400/35 bg-brand-500/20 px-2.5 py-1 text-[11px] font-semibold text-brand-100 shadow-sm">
                                {taco.quantity ?? 1} taco{(taco.quantity ?? 1) !== 1 ? 's' : ''}
                              </span>
                            )}
                            {meatsList.length > 0 &&
                              meatsList.map((meat, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 rounded-lg border border-brand-400/25 bg-brand-500/12 px-2.5 py-1 text-[11px] font-semibold text-brand-100"
                                >
                                  {meat.name}
                                  {meat.quantity > 1 && (
                                    <span className="text-brand-300">×{meat.quantity}</span>
                                  )}
                                </span>
                              ))}
                            {saucesList.length > 0 &&
                              saucesList.map((sauce, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center rounded-lg border border-violet-400/25 bg-violet-500/12 px-2.5 py-1 text-[11px] font-medium text-violet-100"
                                >
                                  {sauce}
                                </span>
                              ))}
                            {garnishesList.length > 0 &&
                              garnishesList.map((garnish, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center rounded-lg border border-emerald-400/25 bg-emerald-500/12 px-2.5 py-1 text-[11px] font-medium text-emerald-100"
                                >
                                  {garnish}
                                </span>
                              ))}
                            {extrasList.length > 0 && (
                              <span className="inline-flex items-center rounded-lg border border-slate-600/50 bg-slate-800/70 px-2.5 py-1 text-[11px] font-semibold text-slate-300">
                                {extrasList.length} extra{extrasList.length !== 1 ? 's' : ''}
                              </span>
                            )}
                            {drinksList.length > 0 && (
                              <span className="inline-flex items-center rounded-lg border border-slate-600/50 bg-slate-800/70 px-2.5 py-1 text-[11px] font-semibold text-slate-300">
                                {drinksList.length} drink{drinksList.length !== 1 ? 's' : ''}
                              </span>
                            )}
                            {dessertsList.length > 0 && (
                              <span className="inline-flex items-center rounded-lg border border-slate-600/50 bg-slate-800/70 px-2.5 py-1 text-[11px] font-semibold text-slate-300">
                                {dessertsList.length} dessert{dessertsList.length !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 mt-auto border-t border-white/10">
                          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                            {itemCount} item{itemCount !== 1 ? 's' : ''}
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-brand-100 leading-none">
                              {totalPrice.toFixed(2)}
                            </p>
                            <p className="text-[10px] font-semibold text-slate-400 mt-0.5 uppercase tracking-wide">
                              CHF
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-4 py-8">
                <EmptyState
                  icon={ShoppingBag01}
                  title="No order yet"
                  description="Create your perfect taco to join this group order."
                />
                <Link to={`/orders/${params.orderId}/create`} className="cursor-pointer">
                  <Button fullWidth className="gap-2">
                    <Plus size={16} />
                    Create my order
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-3 border-t border-white/10 pt-4 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
        <Link
          to="/orders"
          className="inline-flex items-center gap-2 text-brand-100 hover:text-brand-50 transition-colors cursor-pointer"
        >
          ← Back to orders
        </Link>
        <span className="text-xs uppercase tracking-[0.3em] text-slate-500">
          Order ID: {params.orderId?.slice(0, 8)}
        </span>
      </div>
    </div>
  );
}
