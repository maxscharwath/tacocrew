import { ArrowLeft } from '@untitledui/icons/ArrowLeft';
import { Lock01 } from '@untitledui/icons/Lock01';
import { Truck01 } from '@untitledui/icons/Truck01';
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
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
} from '@/components/ui';
import { OrdersApi } from '../lib/api';
import { ApiError } from '../lib/api/http';
import { sessionStore } from '../lib/session/store';

type LoaderData = {
  groupOrder: Awaited<ReturnType<typeof OrdersApi.getGroupOrderWithOrders>>['groupOrder'];
  userOrders: Awaited<ReturnType<typeof OrdersApi.getGroupOrderWithOrders>>['userOrders'];
};

type ActionData = {
  error?: string;
};

export async function orderSubmitLoader({ params }: LoaderFunctionArgs) {
  const groupOrderId = params.orderId;
  if (!groupOrderId) {
    throw new Response('Order not found', { status: 404 });
  }

  const session = sessionStore.getSession();
  if (!session) {
    throw redirect('/login');
  }

  const groupOrderWithUsers = await OrdersApi.getGroupOrderWithOrders(groupOrderId);

  // Only leaders can submit
  const isLeader = groupOrderWithUsers.groupOrder.leaderId === session.userId;
  if (!isLeader) {
    throw redirect(`/orders/${groupOrderId}`);
  }

  return Response.json({
    groupOrder: groupOrderWithUsers.groupOrder,
    userOrders: groupOrderWithUsers.userOrders,
  });
}

export async function orderSubmitAction({ request, params }: ActionFunctionArgs) {
  const groupOrderId = params.orderId;
  if (!groupOrderId) {
    throw new Response('Order not found', { status: 404 });
  }

  const formData = await request.formData();
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
        error: 'All customer, delivery type, address, and requested time fields are required.',
      },
      { status: 400 }
    );
  }

  try {
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

export function OrderSubmitRoute() {
  const { userOrders } = useLoaderData() as LoaderData;
  const actionData = useActionData() as ActionData | undefined;
  const navigation = useNavigation();
  const params = useParams();
  const isSubmitting = navigation.state === 'submitting';

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link
          to={`/orders/${params.orderId}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-brand-100 cursor-pointer"
        >
          <ArrowLeft size={18} />
          Back to order
        </Link>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-amber-500/10 via-slate-900/80 to-slate-950/90 p-8">
        <div className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-amber-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-12 h-60 w-60 rounded-full bg-rose-500/20 blur-3xl" />
        <div className="relative space-y-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-rose-500">
              <Lock01 size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-white">
                Submit to kitchen
              </h1>
              <p className="text-sm text-slate-300">
                This will lock the group order and send it to the kitchen. All participants will be
                notified.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Participants</p>
            <p className="mt-2 text-2xl font-semibold text-white">{userOrders.length}</p>
            <p className="mt-1 text-xs text-slate-400">
              {userOrders.length === 0
                ? 'No participants yet'
                : userOrders.length === 1
                  ? '1 participant in this order'
                  : `${userOrders.length} participants in this order`}
            </p>
          </div>
        </div>
      </div>

      <Card className="p-6">
        <CardHeader className="gap-2">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-rose-500">
              <Truck01 size={20} className="text-white" />
            </div>
            <div>
              <CardTitle className="text-white">Delivery information</CardTitle>
              <CardDescription>
                Provide customer and delivery details to finalize the order.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form method="post" className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="customerName" required>
                  Customer name
                </Label>
                <Input
                  id="customerName"
                  name="customerName"
                  type="text"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="customerPhone" required>
                  Phone
                </Label>
                <Input
                  id="customerPhone"
                  name="customerPhone"
                  type="tel"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="deliveryType" required>
                Delivery type
              </Label>
              <Select
                id="deliveryType"
                name="deliveryType"
                required
                disabled={isSubmitting}
                defaultValue="livraison"
              >
                <option value="livraison">Livraison</option>
                <option value="emporter">À emporter</option>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="road" required>
                  Street
                </Label>
                <Input id="road" name="road" type="text" required disabled={isSubmitting} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="houseNumber">Number</Label>
                <Input id="houseNumber" name="houseNumber" type="text" disabled={isSubmitting} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="postcode" required>
                  Postcode
                </Label>
                <Input id="postcode" name="postcode" type="text" required disabled={isSubmitting} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="city" required>
                  City
                </Label>
                <Input id="city" name="city" type="text" required disabled={isSubmitting} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="state">State</Label>
                <Input id="state" name="state" type="text" disabled={isSubmitting} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="country">Country</Label>
                <Input id="country" name="country" type="text" disabled={isSubmitting} />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="requestedFor" required>
                Requested time
              </Label>
              <Input
                id="requestedFor"
                name="requestedFor"
                type="time"
                required
                disabled={isSubmitting}
              />
            </div>

            {actionData?.error && <Alert tone="error">{actionData.error}</Alert>}

            <div className="flex flex-wrap items-center gap-4">
              <Link to={`/orders/${params.orderId}`} className="cursor-pointer">
                <Button type="button" variant="outline" disabled={isSubmitting}>
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                loading={isSubmitting}
                disabled={isSubmitting}
                variant="danger"
                className="gap-2"
              >
                <Lock01 size={16} />
                Lock & Submit Order
              </Button>
            </div>
          </Form>
        </CardContent>
      </Card>

      <Card className="border-amber-400/30 bg-amber-500/10 p-6">
        <div className="flex items-start gap-3">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-amber-500/20">
            <Lock01 size={16} className="text-amber-300" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-amber-100">Important</p>
            <p className="text-xs text-amber-200/80">
              Once submitted, this order will be locked and sent to the kitchen. Participants will
              no longer be able to modify their orders. This action cannot be undone.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
