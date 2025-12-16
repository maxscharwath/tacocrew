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
import { useOrderForm } from '@/hooks/useOrderForm';
import { useOrderValidation } from '@/hooks/useOrderValidation';
import { useProgressSteps } from '@/hooks/useProgressSteps';
import { OrdersApi, StockApi, UserApi } from '@/lib/api';
import type { UpsertUserOrderBody } from '@/lib/api/orders';
import { authClient } from '@/lib/auth-client';
import { routes } from '@/lib/routes';
import { createActionHandler } from '@/lib/utils/action-handler';
import { createLoader } from '@/lib/utils/loader-factory';
import { requireParam } from '@/lib/utils/param-validators';
import { getSummaryBreakdown } from '@/utils/order-helpers';

type ActionData = {
  errorKey?: string;
  errorMessage?: string;
};

/**
 * Get and validate user session
 */
async function getUserSession(): Promise<string> {
  const session = await authClient.getSession();
  if (!session?.data?.user) {
    throw redirect(routes.signin());
  }
  return session.data.user.id;
}

/**
 * Fetch order to prefill (either edit or duplicate)
 */
async function fetchPrefillOrder(
  groupOrderId: string,
  prefillOrderId: string,
  userId: string,
  isLeader: boolean,
  isEdit: boolean
): Promise<LoaderData['myOrder']> {
  try {
    const orderDetail = await OrdersApi.getUserOrder(groupOrderId, prefillOrderId);
    if (isEdit && !isLeader && orderDetail.userId !== userId) {
      throw new Response('Unauthorized', { status: 403 });
    }
    return orderDetail;
  } catch {
    throw redirect(routes.root.orderCreate({ orderId: groupOrderId }));
  }
}

export const orderCreateLoader = createLoader(
  async ({ params, request }: LoaderFunctionArgs) => {
    const groupOrderId = requireParam(params, 'orderId', 'Order not found');
    const userId = await getUserSession();

    const url = new URL(request.url);
    const orderId = url.searchParams.get('orderId');
    const duplicateId = url.searchParams.get('duplicate');

    const [groupOrderWithUsers, stock, previousOrders] = await Promise.all([
      OrdersApi.getGroupOrderWithOrders(groupOrderId),
      StockApi.getStock(),
      UserApi.getPreviousOrders().catch(() => []),
    ]);

    const groupOrder = groupOrderWithUsers.groupOrder;

    if (!groupOrder.canAcceptOrders) {
      throw redirect(routes.root.orderDetail({ orderId: groupOrderId }));
    }

    const isLeader = groupOrder.leader.id === userId;
    const prefillOrderId = orderId ?? duplicateId ?? undefined;

    const myOrder = prefillOrderId
      ? await fetchPrefillOrder(groupOrderId, prefillOrderId, userId, isLeader, !!orderId)
      : undefined;

    return {
      groupOrder,
      myOrder,
      stock,
      previousOrders,
    };
  },
  { requireAuth: true }
);

type LoaderData = {
  groupOrder: Awaited<ReturnType<typeof OrdersApi.getGroupOrderWithOrders>>['groupOrder'];
  myOrder?: Awaited<ReturnType<typeof OrdersApi.getGroupOrderWithOrders>>['userOrders'][number];
  stock: Awaited<ReturnType<typeof StockApi.getStock>>;
  previousOrders: Awaited<ReturnType<typeof UserApi.getPreviousOrders>>;
};

/**
 * Parse meats with quantities from form data
 */
function parseMeatsFromFormData(formData: FormData): Array<{ id: string; quantity: number }> {
  const meatIds = formData.getAll('meats').map((value) => value.toString());
  return meatIds
    .map((id) => {
      const quantityStr = formData.get(`meat_quantity_${id}`);
      const quantity = quantityStr ? Number(quantityStr) : 0;
      return quantity > 0 ? { id, quantity } : null;
    })
    .filter((m): m is { id: string; quantity: number } => m !== null);
}

/**
 * Parse simple item lists from form data
 */
function parseItemsFromFormData(
  formData: FormData,
  fieldName: string
): Array<{ id: string; quantity: number }> {
  return formData.getAll(fieldName).map((value) => ({ id: value.toString(), quantity: 1 }));
}

/**
 * Validate taco selection and ingredients
 */
function validateTacoSelection(params: {
  readonly size: string | undefined;
  readonly meats: ReadonlyArray<{ readonly id: string; readonly quantity: number }>;
  readonly sauces: ReadonlyArray<{ readonly id: string }>;
  readonly garnitures: ReadonlyArray<{ readonly id: string }>;
  readonly extras: ReadonlyArray<{ readonly id: string; readonly quantity: number }>;
  readonly drinks: ReadonlyArray<{ readonly id: string; readonly quantity: number }>;
  readonly desserts: ReadonlyArray<{ readonly id: string; readonly quantity: number }>;
  readonly tacoSize: { readonly allowGarnitures: boolean } | undefined;
}): void {
  const { size, meats, sauces, garnitures, extras, drinks, desserts, tacoSize } = params;
  const hasTaco = size && meats.length > 0 && sauces.length > 0;
  const hasOtherItems = extras.length > 0 || drinks.length > 0 || desserts.length > 0;

  if (!hasTaco && !hasOtherItems) {
    throw new Response('Missing selection', { status: 400 });
  }

  if (size && (!meats.length || !sauces.length)) {
    throw new Response('Missing fillings', { status: 400 });
  }

  if (size && tacoSize && !tacoSize.allowGarnitures && garnitures.length > 0) {
    throw new Response('Garnish not available', { status: 400 });
  }
}

export const orderCreateAction = createActionHandler({
  handlers: {
    POST: async ({ formData }, _request, params) => {
      const groupOrderId = params?.orderId;
      if (!groupOrderId) throw new Response('Order not found', { status: 404 });

      await getUserSession();

      type TacoSize = UpsertUserOrderBody['items']['tacos'][number]['size'];

      const size = formData.get('tacoSize')?.toString() as TacoSize | undefined;
      const editOrderId = formData.get('editOrderId')?.toString();

      const meats = parseMeatsFromFormData(formData);
      const sauces = formData.getAll('sauces').map((value) => ({ id: value.toString() }));
      const garnitures = formData.getAll('garnitures').map((value) => ({ id: value.toString() }));
      const extras = parseItemsFromFormData(formData, 'extras');
      const drinks = parseItemsFromFormData(formData, 'drinks');
      const desserts = parseItemsFromFormData(formData, 'desserts');
      const note = formData.get('note')?.toString().trim();

      const stock = await StockApi.getStock();
      const tacoSize = stock.tacos.find((t) => t.code === size);

      validateTacoSelection({
        size,
        meats,
        sauces,
        garnitures,
        extras,
        drinks,
        desserts,
        tacoSize,
      });

      if (editOrderId) {
        try {
          await OrdersApi.deleteUserOrder(groupOrderId, editOrderId);
        } catch {
          // If delete fails, continue to create
        }
      }

      const hasTaco = size && meats.length > 0 && sauces.length > 0;

      await OrdersApi.upsertUserOrder(groupOrderId, {
        items: {
          tacos:
            hasTaco && size
              ? [
                  {
                    size,
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
              currency={currency}
              isSubmitting={isSubmitting}
              onUpdateMeatQuantity={updateMeatQuantity}
              onToggleSauce={(id) =>
                toggleSelection(id, sauces, setSauces, selectedTacoSize?.maxSauces)
              }
              onToggleGarniture={(id) => toggleSelection(id, garnitures, setGarnitures)}
              onNoteChange={setNote}
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
            onCancel={() => {
              navigate(routes.root.orderDetail({ orderId: params.orderId ?? '' }));
            }}
          />
        </div>
      </div>
    </div>
  );
}
