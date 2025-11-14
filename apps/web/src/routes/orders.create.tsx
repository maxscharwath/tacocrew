import { ArrowLeft, Droplets, FileText, Leaf, Sliders } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  Form,
  Link,
  type LoaderFunctionArgs,
  redirect,
  useActionData,
  useLoaderData,
  useNavigate,
  useNavigation,
  useParams,
  useSearchParams,
} from 'react-router';
import {
  ExtrasSection,
  MeatSelector,
  OrderCreateHero,
  OrderSummary,
  PreviousTacos,
  SelectionGroup,
  TacoSizeSelector,
} from '@/components/orders';
import {
  Alert,
  Avatar,
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Textarea,
} from '@/components/ui';
import { useOrderForm } from '@/hooks/useOrderForm';
import { useOrderValidation } from '@/hooks/useOrderValidation';
import { useProgressSteps } from '@/hooks/useProgressSteps';
import { OrdersApi, StockApi, UserApi } from '../lib/api';
import { ApiError } from '../lib/api/http';
import type { UpsertUserOrderBody } from '../lib/api/orders';
import { authClient } from '../lib/auth-client';
import { routes } from '../lib/routes';
import { createActionHandler } from '../lib/utils/action-handler';
import { getSummaryBreakdown } from '../utils/order-helpers';

type LoaderData = {
  groupOrder: Awaited<ReturnType<typeof OrdersApi.getGroupOrderWithOrders>>['groupOrder'];
  myOrder?: Awaited<ReturnType<typeof OrdersApi.getGroupOrderWithOrders>>['userOrders'][number];
  stock: Awaited<ReturnType<typeof StockApi.getStock>>;
  previousOrders: Awaited<ReturnType<typeof UserApi.getPreviousOrders>>;
};

type ActionData = {
  errorKey?: string;
  errorMessage?: string;
};

export async function orderCreateLoader({
  params,
  request,
}: LoaderFunctionArgs): Promise<Response> {
  const groupOrderId = params.orderId;
  if (!groupOrderId) {
    throw new Response('Order not found', { status: 404 });
  }

  // Check Better Auth session
  const session = await authClient.getSession();
  if (!session?.data?.user) {
    throw redirect(routes.signin());
  }

  const userId = session.data.user.id;

  const url = new URL(request.url);
  const orderId = url.searchParams.get('orderId');
  const duplicateId = url.searchParams.get('duplicate');

  try {
    const [groupOrderWithUsers, stock, previousOrders] = await Promise.all([
      OrdersApi.getGroupOrderWithOrders(groupOrderId),
      StockApi.getStock(),
      UserApi.getPreviousOrders().catch(() => []), // Fetch previous orders, fallback to empty array on error
    ]);

    const groupOrder = groupOrderWithUsers.groupOrder;

    if (!groupOrder.canAcceptOrders) {
      return redirect(routes.root.orderDetail({ orderId: groupOrderId }));
    }

    const isLeader = groupOrder.leader.id === userId;
    const prefillOrderId = orderId ?? duplicateId ?? undefined;

    let myOrder: LoaderData['myOrder'] = undefined;

    if (prefillOrderId) {
      try {
        const orderDetail = await OrdersApi.getUserOrder(groupOrderId, prefillOrderId);
        if (orderId && !isLeader && orderDetail.userId !== userId) {
          throw new Response('Unauthorized', { status: 403 });
        }
        myOrder = orderDetail;
      } catch {
        return redirect(routes.root.orderCreate({ orderId: groupOrderId }));
      }
    }

    return Response.json({
      groupOrder,
      myOrder,
      stock,
      previousOrders,
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      throw redirect(routes.signin());
    }
    throw error;
  }
}

export const orderCreateAction = createActionHandler({
  handlers: {
    POST: async ({ formData }, _request, params) => {
      const groupOrderId = params?.orderId;
      if (!groupOrderId) throw new Response('Order not found', { status: 404 });

      // Check Better Auth session
      const session = await authClient.getSession();
      if (!session?.data?.user) {
        throw redirect(routes.signin());
      }

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

      // Validation: must have either a taco OR other items
      // Get taco size config to validate garnitures availability
      const stock = await StockApi.getStock();
      const tacoSize = stock.tacos.find((t) => t.code === size);

      // Garnitures are always optional - never required
      const hasTaco = size && meats.length > 0 && sauces.length > 0;
      const hasOtherItems = extras.length > 0 || drinks.length > 0 || desserts.length > 0;

      if (!hasTaco && !hasOtherItems) {
        throw new Response('Missing selection', { status: 400 });
      }

      // If taco is selected, validate it
      if (size && (!meats.length || !sauces.length)) {
        throw new Response('Missing fillings', { status: 400 });
      }

      // Validate that garnitures are not selected if they're not available
      if (size && tacoSize && !tacoSize.allowGarnitures && garnitures.length > 0) {
        throw new Response('Garnish not available', { status: 400 });
      }

      // If editing an existing order, delete it first
      if (editOrderId) {
        try {
          await OrdersApi.deleteUserOrder(groupOrderId, editOrderId);
        } catch {
          // If delete fails, continue to create
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
                  note,
                  quantity: 1,
                },
              ]
            : [],
          extras,
          drinks,
          desserts,
        },
      });
    },
  },
  getFormName: () => 'create',
  onSuccess: (_request, params) => {
    const groupOrderId = params.orderId;
    if (!groupOrderId) throw new Response('Order not found', { status: 404 });
    return redirect(routes.root.orderDetail({ orderId: groupOrderId }));
  },
});

export function OrderCreateRoute() {
  const { t } = useTranslation();
  const currency = t('common.currency.chf');
  const { myOrder, stock, previousOrders } = useLoaderData<LoaderData>();
  const actionData = useActionData() as ActionData | undefined;
  const navigation = useNavigation();
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const isSubmitting = navigation.state === 'submitting';

  const isDuplicating = searchParams.has('duplicate');
  const editOrderId = !isDuplicating ? searchParams.get('orderId') : null;

  // Use custom hooks for form state and validation
  const {
    size,
    setSize,
    meats,
    sauces,
    setSauces,
    garnitures,
    setGarnitures,
    extras,
    setExtras,
    drinks,
    setDrinks,
    desserts,
    setDesserts,
    note,
    setNote,
    selectedTacoSize,
    totalPrice,
    priceBreakdown,
    toggleSelection,
    updateMeatQuantity,
    prefillTaco,
  } = useOrderForm({ stock, myOrder });

  const { hasTaco, hasOtherItems, validationMessages, canSubmit } = useOrderValidation({
    size,
    meats,
    sauces,
    garnitures,
    extras,
    drinks,
    desserts,
    selectedTacoSize,
  });

  const totalMeatQuantity = meats.reduce((sum, m) => sum + m.quantity, 0);
  const summaryBreakdown = getSummaryBreakdown(size, extras, drinks, desserts, t);
  const progressSteps = useProgressSteps({
    size,
    selectedTacoSize,
    totalMeatQuantity,
    sauces,
    garnitures,
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link
          to={routes.root.orderDetail({ orderId: params.orderId ?? '' })}
          className="inline-flex cursor-pointer items-center gap-2 font-medium text-slate-300 text-sm transition-colors hover:text-brand-100"
        >
          <ArrowLeft size={18} />
          {t('orders.create.navigation.backToOrder')}
        </Link>
      </div>

      <OrderCreateHero />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)]">
        <Form method="post" className="space-y-8" id="order-form">
          <input type="hidden" name="tacoSize" value={size} />
          {editOrderId && <input type="hidden" name="editOrderId" value={editOrderId} />}

          <PreviousTacos
            previousOrders={previousOrders}
            stock={stock}
            onSelectTaco={(taco) => {
              prefillTaco({
                size: taco.size,
                meats: taco.meats.map((m) => ({ id: m.id, quantity: m.quantity ?? 1 })),
                sauces: taco.sauces.map((s) => ({ id: s.id })),
                garnitures: taco.garnitures.map((g) => ({ id: g.id })),
                note: taco.note,
              });
            }}
            disabled={isSubmitting}
          />

          <TacoSizeSelector
            sizes={stock.tacos}
            selected={size}
            onSelect={setSize}
            currency={currency}
          />

          {size && (
            <div className="space-y-6 rounded-3xl border border-white/10 bg-slate-900/50 p-6">
              <div className="flex items-center gap-3 border-white/10 border-b pb-4">
                <Avatar color="orange" size="md">
                  <Sliders />
                </Avatar>
                <div>
                  <h2 className="font-semibold text-lg text-white">
                    {t('orders.create.customizeSection.title')}
                  </h2>
                  <p className="text-slate-400 text-xs">
                    {t('orders.create.customizeSection.subtitle')}
                  </p>
                </div>
              </div>

              <MeatSelector
                meats={meats}
                stock={stock}
                selectedTacoSize={selectedTacoSize}
                size={size}
                currency={currency}
                isSubmitting={isSubmitting}
                updateMeatQuantity={updateMeatQuantity}
              />

              <Card className="border-white/10 bg-slate-800/30">
                <CardHeader className="gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Droplets size={18} className="text-brand-400" />
                      <CardTitle className="text-sm text-white normal-case tracking-normal">
                        {t('common.labels.sauces')}
                        <span className="ml-1 text-rose-400">*</span>
                      </CardTitle>
                    </div>
                    {selectedTacoSize?.maxSauces !== undefined && (
                      <Badge tone="brand" className="text-xs">
                        {sauces.length}/{selectedTacoSize.maxSauces}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <SelectionGroup
                    items={stock.sauces}
                    selected={sauces}
                    onToggle={(id) =>
                      toggleSelection(id, sauces, setSauces, selectedTacoSize?.maxSauces)
                    }
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
                  <CardHeader className="gap-2">
                    <div className="flex items-center gap-2">
                      <Leaf size={18} className="text-brand-400" />
                      <CardTitle className="text-sm text-white normal-case tracking-normal">
                        {t('common.labels.garnishes')}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <SelectionGroup
                      items={stock.garnishes}
                      selected={garnitures}
                      onToggle={(id) => toggleSelection(id, garnitures, setGarnitures)}
                      disabled={!size}
                    />
                    {garnitures.map((id) => (
                      <input key={id} type="hidden" name="garnitures" value={id} />
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {size && (
            <Card className="border-white/10 bg-slate-800/30">
              <CardHeader className="gap-2">
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-brand-400" />
                  <CardTitle className="text-white">{t('orders.create.notes.title')}</CardTitle>
                </div>
                <CardDescription>{t('orders.create.notes.subtitle')}</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  name="note"
                  placeholder={t('common.placeholders.specialInstructions')}
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

          <ExtrasSection
            stock={stock}
            extras={extras}
            drinks={drinks}
            desserts={desserts}
            onToggleExtra={(id) => toggleSelection(id, extras, setExtras)}
            onToggleDrink={(id) => toggleSelection(id, drinks, setDrinks)}
            onToggleDessert={(id) => toggleSelection(id, desserts, setDesserts)}
          />

          {actionData?.errorKey ? (
            <Alert tone="error">
              {t(
                actionData.errorKey,
                actionData.errorMessage ? { message: actionData.errorMessage } : undefined
              )}
            </Alert>
          ) : null}
        </Form>

        {/* Sticky Order Preview Sidebar */}
        <div className="lg:sticky lg:top-8 lg:h-fit lg:max-h-[calc(100vh-4rem)]">
          <OrderSummary
            selectedTacoSize={selectedTacoSize ?? null}
            meats={meats}
            sauces={sauces}
            garnitures={garnitures}
            extras={extras}
            drinks={drinks}
            desserts={desserts}
            note={note}
            priceBreakdown={priceBreakdown}
            totalPrice={totalPrice}
            currency={currency}
            summaryBreakdown={summaryBreakdown}
            hasTaco={!!hasTaco}
            hasOtherItems={!!hasOtherItems}
            canSubmit={canSubmit}
            validationMessages={validationMessages}
            stock={stock}
            progressSteps={progressSteps}
            formId="order-form"
            isSubmitting={isSubmitting}
            editOrderId={editOrderId}
            onCancel={() => {
              navigate(routes.root.orderDetail({ orderId: params.orderId ?? '' }));
            }}
          />
        </div>
      </div>
    </div>
  );
}
