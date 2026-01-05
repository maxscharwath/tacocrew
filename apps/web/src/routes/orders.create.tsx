/**
 * Order Creation Route
 * Professional architecture: Clean separation of concerns, minimal component logic
 */

import { TacoSize } from '@tacocrew/gigatacos-client';
import { Alert } from '@tacocrew/ui-kit';
import { ArrowLeft } from 'lucide-react';
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
  OrderCreateHero,
  OrderSummary,
  PreviousTacos,
  TacoBuilder,
  TacoSizeSelector,
} from '@/components/orders';
import { useOrderCreationData } from '@/hooks/useOrderCreationData';
import { useOrderForm } from '@/hooks/useOrderForm';
import { useOrderFormUI } from '@/hooks/useOrderFormUI';
import { useOrderValidation } from '@/hooks/useOrderValidation';
import { useProgressSteps } from '@/hooks/useProgressSteps';
import { getStock } from '@/lib/api/stock';
import { TacoKind } from '@/lib/api/types';
import { routes } from '@/lib/routes';
import { createActionHandler } from '@/lib/utils/action-handler';
import { requireParam } from '@/lib/utils/param-validators';
import { upsertUserOrder } from '@/services/order.service';
import { type ParsedOrderFormData, parseOrderFormData } from '@/utils/order-form-parser';
import { getSummaryBreakdown } from '@/utils/order-helpers';
import { buildUpsertOrderRequest } from '@/utils/order-request-builder';

// ============================================================================
// Loader & Action
// ============================================================================

export function orderCreateLoader({ params }: LoaderFunctionArgs) {
  const groupOrderId = requireParam(params, 'orderId', 'Order not found');
  return Response.json({ groupOrderId });
}

/**
 * Validate order form before submission
 */
function validateOrderForm(
  data: ParsedOrderFormData,
  tacoSize: { allowGarnitures: boolean } | undefined
): void {
  const hasTaco = data.size !== undefined;
  const hasOtherItems =
    data.extras.length > 0 || data.drinks.length > 0 || data.desserts.length > 0;

  if (!hasTaco && !hasOtherItems) {
    throw new Response('Missing selection', { status: 400 });
  }
  const isMystery = data.kind === TacoKind.MYSTERY;

  if (!isMystery && data.size && tacoSize && !tacoSize.allowGarnitures && data.garnitures.length > 0) {
    throw new Response('Garnish not available', { status: 400 })
  }
}

export const orderCreateAction = createActionHandler({
  handlers: {
    POST: async ({ formData }, _request, params) => {
      const groupOrderId = params?.orderId;
      if (!groupOrderId) throw new Response('Order not found', { status: 404 });

      const formDataParsed = parseOrderFormData(formData);
      const stock = await getStock();
      const tacoSize = stock.tacos.find((t: { code: string }) => t.code === formDataParsed.size);

      validateOrderForm(formDataParsed, tacoSize);

      const requestBody = buildUpsertOrderRequest(formDataParsed);
      await upsertUserOrder(groupOrderId, requestBody, formDataParsed.editOrderId);
    },
  },
  getFormName: () => 'create',
  onSuccess: (_request, params) => {
    const groupOrderId = params.orderId;
    if (!groupOrderId) throw new Response('Order not found', { status: 404 });
    return redirect(routes.root.orderDetail({ orderId: groupOrderId }));
  },
});

// ============================================================================
// Component
// ============================================================================

interface ActionData {
  errorKey?: string;
  errorMessage?: string;
}

/**
 * Main route component - Clean and focused
 * - Data loading via custom hooks
 * - Form state via custom hooks
 * - Rendering via composed components
 */
export function OrderCreateRoute() {
  const { t } = useTranslation();
  const { groupOrderId } = useLoaderData<{ groupOrderId: string }>();
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();

  // Extract query parameters
  const isDuplicating = searchParams.has('duplicate');
  const editOrderId = isDuplicating ? null : searchParams.get('orderId');
  const prefillOrderId = searchParams.get('orderId') ?? searchParams.get('duplicate') ?? undefined;

  // Data loading with Result pattern
  const { result, isLoading } = useOrderCreationData(groupOrderId, prefillOrderId);

  // Extract data from result (may be undefined during loading/error)
  const data = result.ok ? result.value : undefined;
  const group = data?.group;
  const stock = data?.stock;
  const previousOrders = data?.previousOrders;
  const editingOrder = data?.editingOrder;

  // Form state - MUST be called unconditionally before any early returns
  const orderForm = useOrderForm({ stock, myOrder: editingOrder });

  // UI state (validation, progress) - MUST be called unconditionally
  const _uiState = useOrderFormUI(
    {
      taco: orderForm.selectedTacoSize
        ? {
            size: orderForm.size as TacoSize,
            meats: orderForm.meats,
            sauces: orderForm.sauces,
            garnitures: orderForm.garnitures,
            kind: orderForm.kind,
            note: orderForm.note,
          }
        : null,
      extras: orderForm.extras.map((e) => ({
        id: e,
        quantity: 1,
      })),
      drinks: orderForm.drinks.map((d) => ({
        id: d,
        quantity: 1,
      })),
      desserts: orderForm.desserts.map((d) => ({
        id: d,
        quantity: 1,
      })),
    },
    stock ?? null,
    orderForm.selectedTacoSize
  );

  // Validation - MUST be called unconditionally
  const orderValidation = useOrderValidation({
    size: orderForm.size,
    meats: orderForm.meats,
    sauces: orderForm.sauces,
    garnitures: orderForm.garnitures,
    extras: orderForm.extras,
    drinks: orderForm.drinks,
    desserts: orderForm.desserts,
    selectedTacoSize: orderForm.selectedTacoSize,
    kind: orderForm.kind,
  });

  // Progress - MUST be called unconditionally
  const progressSteps = useProgressSteps({
    size: orderForm.size,
    selectedTacoSize: orderForm.selectedTacoSize,
    totalMeatQuantity: orderForm.meats.reduce((sum, m) => sum + m.quantity, 0),
    sauces: orderForm.sauces,
    garnitures: orderForm.garnitures,
    kind: orderForm.kind,
  });

  // Handle loading state - AFTER all hooks are called
  if (isLoading) {
    return <div>Loading...</div>;
  }

  // Handle error state with Result pattern - AFTER all hooks are called
  if (!result.ok) {
    const error = result.error;
    // Log error for monitoring
    if (error.originalError) {
      console.error(`[${error.code}] ${error.message}`, error.context, error.originalError);
    } else {
      console.error(`[${error.code}] ${error.message}`, error.context);
    }

    // Redirect on not found errors
    if (error.code === 'USER_ORDER_NOT_FOUND' || error.code === 'GROUP_ORDER_NOT_FOUND') {
      throw new Response(error.message, { status: 404 });
    }

    // Show generic error for other cases
    throw new Response('Failed to load order data', { status: 500 });
  }

  // Redirect if order not accepting new orders
  if (!group?.groupOrder.canAcceptOrders) {
    throw redirect(routes.root.orderDetail({ orderId: groupOrderId }));
  }

  const isSubmitting = navigation.state === 'submitting';
  const currency = t('common.currency.chf');
  const summaryBreakdown = getSummaryBreakdown(
    orderForm.size,
    orderForm.extras,
    orderForm.drinks,
    orderForm.desserts,
    t
  );

  return (
    <div className="space-y-4 sm:space-y-8">
      {/* Navigation */}
      <div className="flex items-center gap-2 sm:gap-4">
        <Link
          to={routes.root.orderDetail({ orderId: params.orderId ?? '' })}
          className="inline-flex cursor-pointer items-center gap-2 font-medium text-slate-300 text-sm transition-colors hover:text-brand-100"
        >
          <ArrowLeft size={16} className="sm:w-4.5" />
          <span className="hidden sm:inline">{t('orders.create.navigation.backToOrder')}</span>
          <span className="sm:hidden">{t('orders.create.navigation.back')}</span>
        </Link>
      </div>

      {/* Hero */}
      <OrderCreateHero />

      {/* Main Content */}
      <div className="grid gap-4 sm:gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)]">
        {/* Form */}
        <Form method="post" className="space-y-4 sm:space-y-8" id="order-form">
          <input type="hidden" name="tacoSize" value={orderForm.size} />
          <input type="hidden" name="kind" value={orderForm.kind} />
          {editOrderId && <input type="hidden" name="editOrderId" value={editOrderId} />}

          {/* Previous Orders */}
          {previousOrders && previousOrders.length > 0 && stock && (
            <PreviousTacos
              previousOrders={previousOrders}
              stock={stock}
              onSelectTaco={(taco) => {
                orderForm.prefillTaco({
                  size: taco.size,
                  meats: taco.meats?.map((m) => ({ id: m.id, quantity: m.quantity ?? 1 })) ?? [],
                  sauces: taco.sauces?.map((s) => ({ id: s.id })) ?? [],
                  garnitures: taco.garnitures?.map((g) => ({ id: g.id })) ?? [],
                  note: taco.note,
                  kind: taco.kind,
                });
              }}
              disabled={isSubmitting}
            />
          )}

          {/* Size Selector */}
          <TacoSizeSelector
            sizes={stock?.tacos ?? []}
            selected={orderForm.size}
            onSelect={orderForm.setSize}
          />

          {/* Taco Builder */}
          {orderForm.size && stock && (
            <TacoBuilder
              taco={{
                size: orderForm.size as TacoSize,
                meats: orderForm.meats,
                sauces: orderForm.sauces,
                garnitures: orderForm.garnitures,
                note: orderForm.note,
                selectedTacoSize: orderForm.selectedTacoSize ?? null,
              }}
              stock={stock}
              isSubmitting={isSubmitting}
              kind={orderForm.kind}
              onUpdateMeatQuantity={orderForm.updateMeatQuantity}
              onToggleSauce={(id) =>
                orderForm.toggleSelection(
                  id,
                  orderForm.sauces,
                  orderForm.setSauces,
                  orderForm.selectedTacoSize?.maxSauces
                )
              }
              onToggleGarniture={(id) =>
                orderForm.toggleSelection(id, orderForm.garnitures, orderForm.setGarnitures)
              }
              onNoteChange={orderForm.setNote}
              onToggleMystery={orderForm.toggleMystery}
            />
          )}

          {/* Extras Section */}
          {stock && (
            <ExtrasSection
              stock={stock}
              extras={orderForm.extras}
              drinks={orderForm.drinks}
              desserts={orderForm.desserts}
              onToggleExtra={(id) =>
                orderForm.toggleSelection(id, orderForm.extras, orderForm.setExtras)
              }
              onToggleDrink={(id) =>
                orderForm.toggleSelection(id, orderForm.drinks, orderForm.setDrinks)
              }
              onToggleDessert={(id) =>
                orderForm.toggleSelection(id, orderForm.desserts, orderForm.setDesserts)
              }
            />
          )}

          {/* Error Alert */}
          {actionData?.errorKey && (
            <Alert tone="error">
              {t(
                actionData.errorKey,
                actionData.errorMessage ? { message: actionData.errorMessage } : undefined
              )}
            </Alert>
          )}
        </Form>

        {/* Order Summary Sidebar */}
        <div className="lg:sticky lg:top-8 lg:h-fit lg:max-h-[calc(100vh-4rem)]">
          <OrderSummary
            selectedTacoSize={orderForm.selectedTacoSize ?? null}
            meats={orderForm.meats}
            sauces={orderForm.sauces}
            garnitures={orderForm.garnitures}
            extras={orderForm.extras}
            drinks={orderForm.drinks}
            desserts={orderForm.desserts}
            note={orderForm.note}
            priceBreakdown={orderForm.priceBreakdown}
            totalPrice={orderForm.totalPrice}
            currency={currency}
            summaryBreakdown={summaryBreakdown}
            hasTaco={!!orderForm.selectedTacoSize}
            hasOtherItems={
              orderForm.extras.length > 0 ||
              orderForm.drinks.length > 0 ||
              orderForm.desserts.length > 0
            }
            canSubmit={orderValidation.canSubmit}
            validationMessages={orderValidation.validationMessages}
            stock={stock ?? null}
            progressSteps={progressSteps}
            formId="order-form"
            isSubmitting={isSubmitting}
            editOrderId={editOrderId}
            kind={orderForm.kind}
            onCancel={() => {
              navigate(routes.root.orderDetail({ orderId: params.orderId ?? '' }));
            }}
          />
        </div>
      </div>
    </div>
  );
}
