import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { CheckCircle2, Clock3, CreditCard, MapPin, PackageCheck, XCircle } from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Field from '../../components/ui/Field.jsx';
import Input from '../../components/ui/Input.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import usePageMeta from '../../hooks/usePageMeta.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { formatRwf } from '../../lib/format.js';
import { getApiErrorMessage } from '../../lib/api.js';
import { cancelOrder, getOrder, verifyOrderPayment } from '../../services/publicApi.js';

const STATUS_VARIANT = {
  pending_payment: 'warning',
  confirmed: 'info',
  preparing: 'info',
  ready: 'success',
  out_for_delivery: 'success',
  completed: 'success',
  cancelled: 'danger',
};

const PAYMENT_LABELS = {
  pending: 'Payment pending',
  requires_action: 'Payment not completed',
  processing: 'Payment processing',
  paid: 'Paid',
  failed: 'Payment failed',
  cancelled: 'Payment cancelled',
  refunded: 'Refunded',
  partially_refunded: 'Partially refunded',
};

const PAYMENT_METHOD_LABELS = {
  mobile_money: 'Mobile money',
  bank_card: 'Bank card',
  pay_at_restaurant: 'Pay at the restaurant',
  cash_on_delivery: 'Cash on delivery',
};

function readStoredOrder(orderNumber) {
  try {
    const raw = sessionStorage.getItem(`ff_order_${orderNumber}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function OrderPage() {
  const { orderNumber } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const { addToast } = useToast();
  const [order, setOrder] = useState(location.state?.order ?? readStoredOrder(orderNumber));
  const [email, setEmail] = useState(
    location.state?.email ?? sessionStorage.getItem(`ff_order_email_${orderNumber}`) ?? '',
  );
  const [lookupEmail, setLookupEmail] = useState('');
  const [loading, setLoading] = useState(!order);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState('');

  usePageMeta({
    title: order ? `Order ${order.orderNumber}` : 'Order status',
    description: 'Track your FAB FOODS order.',
  });

  const loadOrder = useCallback(
    async (lookup = email) => {
      setLoading(true);
      setError('');
      try {
        const next = await getOrder(orderNumber, lookup || undefined);
        setOrder(next);
        if (lookup) {
          setEmail(lookup);
          sessionStorage.setItem(`ff_order_email_${orderNumber}`, lookup);
        }
        sessionStorage.setItem(`ff_order_${orderNumber}`, JSON.stringify(next));
        return next;
      } catch (loadError) {
        setError(
          getApiErrorMessage(
            loadError,
            'That order could not be found. Check the order number and email address.',
          ),
        );
        return null;
      } finally {
        setLoading(false);
      }
    },
    [orderNumber, email],
  );

  useEffect(() => {
    if (order) {
      loadOrder(email);
      return;
    }
    if (user) {
      loadOrder('');
      return;
    }
    setLoading(false);
  }, [orderNumber]); // eslint-disable-line react-hooks/exhaustive-deps

  async function submitLookup(event) {
    event.preventDefault();
    if (!lookupEmail.trim()) {
      setError('Enter the email used for this order.');
      return;
    }
    await loadOrder(lookupEmail.trim());
  }

  async function handleVerify() {
    setActionError('');
    setBusy('verify');
    try {
      const result = await verifyOrderPayment(orderNumber, email ? { email } : {});
      setOrder(result.order);
      sessionStorage.setItem(`ff_order_${orderNumber}`, JSON.stringify(result.order));
      if (result.pending) {
        addToast({ title: 'Payment is still pending', variant: 'info' });
      } else if (result.failed) {
        addToast({ title: 'Payment was not completed', variant: 'error' });
      } else {
        addToast({ title: 'Payment verified', variant: 'success' });
      }
    } catch (verifyError) {
      setActionError(getApiErrorMessage(verifyError, 'Payment status could not be checked.'));
    } finally {
      setBusy('');
    }
  }

  async function handleCancel() {
    if (!window.confirm('Cancel this order? This cannot be undone.')) return;
    setActionError('');
    setBusy('cancel');
    try {
      const next = await cancelOrder(orderNumber, email ? { email } : {});
      setOrder(next);
      sessionStorage.setItem(`ff_order_${orderNumber}`, JSON.stringify(next));
      addToast({ title: 'Order cancelled', variant: 'success' });
    } catch (cancelError) {
      setActionError(getApiErrorMessage(cancelError, 'The order could not be cancelled.'));
    } finally {
      setBusy('');
    }
  }

  if (!order && loading) {
    return (
      <section className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="mt-6 h-64" />
      </section>
    );
  }

  if (!order) {
    return (
      <section className="mx-auto max-w-xl px-5 py-16 sm:px-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-ember-700">
          Order status
        </p>
        <h1 className="mt-3 font-display text-display-lg font-semibold text-cocoa-950">
          Find your order.
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-cocoa-600">
          Enter the email address used at checkout. Signed-in customers can open orders from their
          account.
        </p>
        <form onSubmit={submitLookup} className="mt-6 space-y-4">
          <Field label="Email" required>
            <Input
              type="email"
              autoComplete="email"
              value={lookupEmail}
              onChange={(event) => setLookupEmail(event.target.value)}
            />
          </Field>
          {error ? (
            <p role="alert" className="rounded-lg bg-danger/5 p-3 text-sm text-danger">
              {error}
            </p>
          ) : null}
          <Button type="submit" variant="order" loading={loading}>
            Find order
          </Button>
          {user ? (
            <Button asChild variant="ghost" className="ml-2">
              <Link to="/account">Your account</Link>
            </Button>
          ) : null}
        </form>
      </section>
    );
  }

  const cancellable =
    ['pending_payment', 'confirmed'].includes(order.status) && order.paymentStatus !== 'paid';
  const needsPayment =
    order.paymentStatus === 'requires_action' || order.paymentStatus === 'processing';

  return (
    <section className="mx-auto max-w-[1000px] px-5 py-12 sm:px-8 lg:py-16">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-ember-700">
            Order {order.orderNumber}
          </p>
          <h1 className="mt-3 font-display text-display-lg font-semibold text-cocoa-950">
            {order.statusLabel}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-cocoa-600">
            {order.statusMessage}
          </p>
        </div>
        <Badge variant={STATUS_VARIANT[order.status] ?? 'neutral'} dot>
          {order.statusLabel}
        </Badge>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-cocoa-900/10 bg-white p-6">
            <div className="flex items-center gap-2">
              <PackageCheck className="h-5 w-5 text-cocoa-500" aria-hidden="true" />
              <h2 className="font-display text-xl font-semibold text-cocoa-950">Your order</h2>
            </div>
            <ul className="mt-4 divide-y divide-cocoa-900/10">
              {order.items.map((line) => (
                <li
                  key={`${line.slug}-${line.selectionSummary.join('-')}`}
                  className="flex justify-between gap-3 py-3 text-sm"
                >
                  <span className="text-cocoa-700">
                    {line.quantity} × {line.name}
                    {line.selectionSummary.length ? (
                      <span className="block text-xs text-cocoa-500">
                        {line.selectionSummary.join(' · ')}
                      </span>
                    ) : null}
                  </span>
                  <span className="shrink-0 font-semibold tabular-nums">
                    {formatRwf(line.lineTotal)}
                  </span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-2 border-t border-cocoa-900/10 pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-cocoa-600">Subtotal</dt>
                <dd className="font-semibold tabular-nums">{formatRwf(order.subtotal)}</dd>
              </div>
              {order.deliveryFee > 0 ? (
                <div className="flex justify-between">
                  <dt className="text-cocoa-600">Delivery</dt>
                  <dd className="font-semibold tabular-nums">{formatRwf(order.deliveryFee)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between border-t border-cocoa-900/10 pt-2">
                <dt className="font-semibold text-cocoa-950">Total</dt>
                <dd className="font-display text-xl font-semibold tabular-nums text-cocoa-950">
                  {formatRwf(order.total)}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-cocoa-900/10 bg-white p-6">
            <h2 className="font-display text-xl font-semibold text-cocoa-950">Progress</h2>
            <ol className="mt-4 space-y-4">
              {order.statusHistory.map((event, index) => (
                <li key={`${event.status}-${index}`} className="flex gap-3">
                  <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cream-200 text-cocoa-600">
                    <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold capitalize text-cocoa-900">
                      {event.status.replaceAll('_', ' ')}
                    </p>
                    {event.note ? (
                      <p className="text-xs leading-relaxed text-cocoa-500">{event.note}</p>
                    ) : null}
                    <p className="text-xs text-cocoa-400">
                      {new Date(event.changedAt).toLocaleString('en-RW', {
                        timeZone: 'Africa/Kigali',
                      })}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-cocoa-900/10 bg-cream-50 p-6">
            <h2 className="font-display text-lg font-semibold text-cocoa-950">Payment</h2>
            <p className="mt-2 flex items-center gap-2 text-sm text-cocoa-700">
              <CreditCard className="h-4 w-4 text-cocoa-400" aria-hidden="true" />
              {PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod}
            </p>
            <p className="mt-1 text-sm font-semibold text-cocoa-900">
              {PAYMENT_LABELS[order.paymentStatus] ?? order.paymentStatus}
            </p>
            {needsPayment ? (
              <Button
                variant="order"
                className="mt-4 w-full"
                onClick={handleVerify}
                loading={busy === 'verify'}
              >
                Check payment status
              </Button>
            ) : null}
          </div>

          <div className="rounded-2xl border border-cocoa-900/10 bg-white p-6">
            <h2 className="font-display text-lg font-semibold text-cocoa-950">
              {order.fulfillmentType === 'delivery' ? 'Delivery' : 'Pickup'}
            </h2>
            <p className="mt-2 flex items-start gap-2 text-sm text-cocoa-600">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-cocoa-400" aria-hidden="true" />
              {order.fulfillmentType === 'delivery' ? (
                <span>
                  {[
                    order.deliveryAddress?.line1,
                    order.deliveryAddress?.line2,
                    order.deliveryAddress?.sector,
                    order.deliveryAddress?.district,
                    order.deliveryAddress?.city,
                  ]
                    .filter(Boolean)
                    .join(', ') || 'Address saved with your order.'}
                </span>
              ) : (
                <span>Collect from the restaurant. The team will confirm timing.</span>
              )}
            </p>
            <p className="mt-3 text-xs text-cocoa-500">
              Contact: {order.customer.name} · {order.customer.phone}
            </p>
          </div>

          {actionError ? (
            <p role="alert" className="rounded-lg bg-danger/5 p-3 text-sm text-danger">
              {actionError}
            </p>
          ) : null}

          {cancellable ? (
            <Button
              variant="secondary"
              className="w-full"
              onClick={handleCancel}
              loading={busy === 'cancel'}
            >
              <XCircle className="h-4 w-4" aria-hidden="true" />
              Cancel order
            </Button>
          ) : null}
          <Button asChild variant="ghost" className="w-full">
            <Link to="/menu">Back to the menu</Link>
          </Button>
          {user ? (
            <Button asChild variant="ghost" className="w-full">
              <Link to="/account">Your account</Link>
            </Button>
          ) : null}
        </aside>
      </div>

      {order.paymentStatus === 'paid' ? (
        <div className="mt-6 flex items-center gap-2 rounded-xl border border-success/20 bg-success/5 p-4 text-sm text-success">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          Payment verified by the provider.
        </div>
      ) : null}
    </section>
  );
}

export default OrderPage;
