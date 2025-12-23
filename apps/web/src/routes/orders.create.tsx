import { TacoSize } from '@tacocrew/gigatacos-client';
import { TacoKind } from '@/lib/api/types';
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
import { useOrderForm } from '@/hooks/useOrderForm';
import { useOrderValidation } from '@/hooks/useOrderValidation';
import { useProgressSteps } from '@/hooks/useProgressSteps';
import { StockApi, UserApi } from '@/lib/api';
import { OrdersApi } from '@/lib/api';
import { routes } from '@/lib/routes';
import { createActionHandler } from '@/lib/utils/action-handler';
import { createLoader } from '@/lib/utils/loader-factory';
import { requireParam } from '@/lib/utils/param-validators';
import { upsertUserOrder } from '@/services/order.service';
import { buildUpsertOrderRequest } from '@/utils/order-request-builder';
import { parseOrderFormData, type ParsedOrderFormData } from '@/utils/order-form-parser';
import { getSummaryBreakdown } from '@/utils/order-helpers';

type ActionData = {
  errorKey?: string;
  errorMessage?: string;
};

async function fetchPrefillOrder(
  groupOrderId: string,
  prefillOrderId: string
): Promise<LoaderData['myOrder']> {
  try {
    return await OrdersApi.getUserOrder(groupOrderId, prefillOrderId);
  } catch {
    throw redirect(routes.root.orderCreate({ orderId: groupOrderId }));
  }
}

export const orderCreateLoader = createLoader(async ({ params, request }: LoaderFunctionArgs) => {
  const groupOrderId = requireParam(params, 'orderId', 'Order not found');

  const url = new URL(request.url);
  const orderId = url.searchParams.get('orderId');
  const duplicateId = url.searchParams.get('duplicate');
  const prefillOrderId = orderId ?? duplicateId ?? undefined;

  const [groupOrderWithUsers, stock, previousOrders, myOrder] = await Promise.all([
    OrdersApi.getGroupOrderWithOrders(groupOrderId),
    StockApi.getStock(),
    UserApi.getPreviousOrders().catch(() => []),
    prefillOrderId ? fetchPrefillOrder(groupOrderId, prefillOrderId) : Promise.resolve(undefined),
  ]);

  const groupOrder = groupOrderWithUsers.groupOrder;

  if (!groupOrder.canAcceptOrders) {
    throw redirect(routes.root.orderDetail({ orderId: groupOrderId }));
  }

  return {
    groupOrder,
    myOrder,
    stock,
    previousOrders,
  };
});

type LoaderData = {
  groupOrder: Awaited<ReturnType<typeof OrdersApi.getGroupOrderWithOrders>>['groupOrder'];
  myOrder?: Awaited<ReturnType<typeof OrdersApi.getGroupOrderWithOrders>>['userOrders'][number];
  stock: Awaited<ReturnType<typeof StockApi.getStock>>;
  previousOrders: Awaited<ReturnType<typeof UserApi.getPreviousOrders>>;
};


/**
 * Validate taco selection and ingredients
 */
function validateOrderForm(
  data: ParsedOrderFormData,
  tacoSize: { allowGarnitures: boolean } | undefined
): void {
  const isMystery = data.kind === TacoKind.MYSTERY;
  // Meats and sauces will be added automatically if not selected (handled in buildUpsertOrderRequest)
  const hasTaco = data.size !== undefined;
  const hasOtherItems = data.extras.length > 0 || data.drinks.length > 0 || data.desserts.length > 0;

  if (!hasTaco && !hasOtherItems) {
    throw new Response('Missing selection', { status: 400 });
  }

  // Don't validate missing meats/sauces - they'll be added automatically
  // Only validate garnitures if they're not allowed
  if (data.size && tacoSize && !tacoSize.allowGarnitures && data.garnitures.length > 0) {
    throw new Response('Garnish not available', { status: 400 });
  }
}

export const orderCreateAction = createActionHandler({
  handlers: {
    POST: async ({ formData }, _request, params) => {
      const groupOrderId = params?.orderId;
      if (!groupOrderId) throw new Response('Order not found', { status: 404 });

      const formDataParsed = parseOrderFormData(formData);
      const stock = await StockApi.getStock();
      const tacoSize = stock.tacos.find((t) => t.code === formDataParsed.size);

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

export function OrderCreateRoute() {
  const { t } = useTranslation();
  const currency = t('common.currency.chf');
  const { myOrder, stock, previousOrders } = useLoaderData<LoaderData>();
  const actionData = useActionData<ActionData | undefined>();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const isSubmitting = navigation.state === 'submitting';

  const isDuplicating = searchParams.has('duplicate');
  const editOrderId = isDuplicating ? null : searchParams.get('orderId');

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
    kind,
    selectedTacoSize,
    totalPrice,
    priceBreakdown,
    toggleSelection,
    updateMeatQuantity,
    prefillTaco,
    toggleMystery,
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
    kind,
  });

  const totalMeatQuantity = meats.reduce((sum, m) => sum + m.quantity, 0);
  const summaryBreakdown = getSummaryBreakdown(size, extras, drinks, desserts, t);
  const progressSteps = useProgressSteps({
    size,
    selectedTacoSize,
    totalMeatQuantity,
    sauces,
    garnitures,
    kind,
  });

  return (
    <div className="space-y-4 sm:space-y-8">
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

      <OrderCreateHero />

      <div className="grid gap-4 sm:gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)]">
        <Form method="post" className="space-y-4 sm:space-y-8" id="order-form">
          <input type="hidden" name="tacoSize" value={size} />
          <input type="hidden" name="kind" value={kind} />
          {editOrderId && <input type="hidden" name="editOrderId" value={editOrderId} />}

          <PreviousTacos
            previousOrders={previousOrders}
            stock={stock}
            onSelectTaco={(taco) => {
              prefillTaco({
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

          <TacoSizeSelector sizes={stock.tacos} selected={size} onSelect={setSize} />

          {size && (
            <TacoBuilder
              taco={{
                size: size as TacoSize,
                meats,
                sauces,
                garnitures,
                note,
                selectedTacoSize: selectedTacoSize ?? null,
              }}
              stock={stock}
              isSubmitting={isSubmitting}
              kind={kind}
              onUpdateMeatQuantity={updateMeatQuantity}
              onToggleSauce={(id) =>
                toggleSelection(id, sauces, setSauces, selectedTacoSize?.maxSauces)
              }
              onToggleGarniture={(id) => toggleSelection(id, garnitures, setGarnitures)}
              onNoteChange={setNote}
              onToggleMystery={toggleMystery}
            />
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
            hasOtherItems={hasOtherItems}
            canSubmit={canSubmit}
            validationMessages={validationMessages}
            stock={stock}
            progressSteps={progressSteps}
            formId="order-form"
            isSubmitting={isSubmitting}
            editOrderId={editOrderId}
            kind={kind}
            onCancel={() => {
              navigate(routes.root.orderDetail({ orderId: params.orderId ?? '' }));
            }}
          />
        </div>
      </div>
    </div>
  );
}
