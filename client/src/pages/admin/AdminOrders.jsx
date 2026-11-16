import { useEffect, useState } from 'react';
import { ChevronRight, RefreshCw } from 'lucide-react';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Field from '../../components/ui/Field.jsx';
import Input from '../../components/ui/Input.jsx';
import Select from '../../components/ui/Select.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { formatRwf } from '../../lib/format.js';
import { getApiErrorMessage } from '../../lib/api.js';
import {
  getAdminOrder,
  getAdminOrders,
  updateAdminOrderPayment,
  updateAdminOrderStatus,
} from '../../services/adminApi.js';

const STATUS_VARIANT = {
  pending_payment: 'warning',
  confirmed: 'info',
  preparing: 'info',
  ready: 'success',
  out_for_delivery: 'success',
  completed: 'success',
  cancelled: 'danger',
};

const STATUSES = [
  'pending_payment',
  'confirmed',
  'preparing',
  'ready',
  'out_for_delivery',
  'completed',
  'cancelled',
];

const NEXT_STATUSES = {
  pending_payment: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['out_for_delivery', 'completed', 'cancelled'],
  out_for_delivery: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

const PAYMENT_LABELS = {
  mobile_money: 'Mobile money',
  bank_card: 'Bank card',
  pay_at_restaurant: 'Pay at the restaurant',
  cash_on_delivery: 'Cash on delivery',
};

export function AdminOrders() {
  const { addToast } = useToast();
  const [status, setStatus] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState('');

  async function loadOrders(nextStatus = status) {
    setLoading(true);
    setError('');
    try {
      const result = await getAdminOrders(nextStatus ? { status: nextStatus } : {});
      setOrders(result.orders);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, 'Orders could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders(status);
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  async function openOrder(id) {
    setDetailLoading(true);
    setError('');
    try {
      const result = await getAdminOrder(id);
      setSelected(result);
      setNote('');
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, 'That order could not be loaded.'));
    } finally {
      setDetailLoading(false);
    }
  }

  async function changeStatus(nextStatus) {
    if (!selected) return;
    setBusy('status');
    setError('');
    try {
      const order = await updateAdminOrderStatus(selected.order.id, {
        status: nextStatus,
        note,
      });
      setSelected((current) => ({ ...current, order }));
      setOrders((current) =>
        current.map((entry) => (entry.id === order.id ? order : entry)),
      );
      setNote('');
      addToast({ title: `Order marked ${nextStatus.replaceAll('_', ' ')}`, variant: 'success' });
    } catch (updateError) {
      setError(getApiErrorMessage(updateError, 'The order status could not be changed.'));
    } finally {
      setBusy('');
    }
  }

  async function changePayment(paymentStatus) {
    if (!selected) return;
    setBusy('payment');
    setError('');
    try {
      const order = await updateAdminOrderPayment(selected.order.id, {
        paymentStatus,
        note,
      });
      setSelected((current) => ({ ...current, order }));
      setOrders((current) =>
        current.map((entry) => (entry.id === order.id ? order : entry)),
      );
      setNote('');
      addToast({ title: `Payment marked ${paymentStatus}`, variant: 'success' });
    } catch (updateError) {
      setError(getApiErrorMessage(updateError, 'The payment status could not be changed.'));
    } finally {
      setBusy('');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-semibold text-cocoa-950">Orders</h2>
          <p className="mt-1 text-sm text-cocoa-600">
            Review incoming orders, move them through the kitchen and record offline payments.
          </p>
        </div>
        <div className="flex items-end gap-2">
          <Field label="Status" className="w-44">
            <Select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="">All orders</option>
              {STATUSES.map((entry) => (
                <option key={entry} value={entry}>
                  {entry.replaceAll('_', ' ')}
                </option>
              ))}
            </Select>
          </Field>
          <Button variant="secondary" onClick={() => loadOrders()}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Refresh
          </Button>
        </div>
      </div>

      {error ? (
        <p role="alert" className="rounded-lg bg-danger/5 p-3 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-3">
          {loading ? (
            <>
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </>
          ) : orders.length === 0 ? (
            <EmptyState
              icon={ChevronRight}
              title="No orders found"
              description="New website orders will appear here."
            />
          ) : (
            orders.map((order) => (
              <button
                key={order.id}
                type="button"
                onClick={() => openOrder(order.id)}
                className={`block w-full rounded-xl border bg-white p-4 text-left transition-colors hover:border-ember-500/40 ${
                  selected?.order.id === order.id
                    ? 'border-ember-500 ring-1 ring-ember-500/30'
                    : 'border-cocoa-900/10'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-cocoa-950">{order.orderNumber}</p>
                    <p className="mt-1 text-xs text-cocoa-500">
                      {order.customer.name} · {order.customer.phone}
                    </p>
                  </div>
                  <Badge variant={STATUS_VARIANT[order.status] ?? 'neutral'} dot>
                    {order.statusLabel}
                  </Badge>
                </div>
                <div className="mt-3 flex flex-wrap justify-between gap-2 border-t border-cocoa-900/10 pt-2 text-xs text-cocoa-500">
                  <span>
                    {order.items.reduce((total, line) => total + line.quantity, 0)} items ·{' '}
                    {order.fulfillmentType}
                  </span>
                  <span className="font-semibold text-cocoa-800">{formatRwf(order.total)}</span>
                </div>
              </button>
            ))
          )}
        </div>

        <aside className="h-fit rounded-2xl border border-cocoa-900/10 bg-white p-5 xl:sticky xl:top-6">
          {detailLoading ? (
            <Skeleton className="h-80" />
          ) : !selected ? (
            <p className="text-sm text-cocoa-600">Select an order to review and update it.</p>
          ) : (
            <div>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="font-display text-xl font-semibold text-cocoa-950">
                    {selected.order.orderNumber}
                  </h3>
                  <p className="text-xs text-cocoa-500">
                    {selected.order.customer.name} · {selected.order.customer.email}
                  </p>
                </div>
                <Badge variant={STATUS_VARIANT[selected.order.status] ?? 'neutral'} dot>
                  {selected.order.statusLabel}
                </Badge>
              </div>

              <ul className="mt-4 divide-y divide-cocoa-900/10 text-sm">
                {selected.order.items.map((line) => (
                  <li
                    key={`${line.slug}-${line.selectionSummary.join('-')}`}
                    className="flex justify-between gap-2 py-2"
                  >
                    <span>
                      {line.quantity} × {line.name}
                      {line.selectionSummary.length ? (
                        <span className="block text-xs text-cocoa-500">
                          {line.selectionSummary.join(' · ')}
                        </span>
                      ) : null}
                    </span>
                    <span className="shrink-0 tabular-nums">{formatRwf(line.lineTotal)}</span>
                  </li>
                ))}
              </ul>

              <dl className="mt-3 space-y-1 border-t border-cocoa-900/10 pt-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-cocoa-600">Total</dt>
                  <dd className="font-semibold tabular-nums">{formatRwf(selected.order.total)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-cocoa-600">Payment</dt>
                  <dd className="capitalize">{selected.order.paymentStatus.replaceAll('_', ' ')}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-cocoa-600">Method</dt>
                  <dd>{PAYMENT_LABELS[selected.order.paymentMethod] ?? selected.order.paymentMethod}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-cocoa-600">Fulfilment</dt>
                  <dd className="capitalize">{selected.order.fulfillmentType}</dd>
                </div>
              </dl>

              {selected.order.notes ? (
                <p className="mt-3 rounded-lg bg-cream-50 p-3 text-xs text-cocoa-600">
                  Note: {selected.order.notes}
                </p>
              ) : null}

              <div className="mt-4">
                <Field label="Staff note" hint="Optional note saved with the status change.">
                  <Input value={note} onChange={(event) => setNote(event.target.value)} />
                </Field>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {(NEXT_STATUSES[selected.order.status] ?? []).map((nextStatus) => (
                  <Button
                    key={nextStatus}
                    size="sm"
                    variant={nextStatus === 'cancelled' ? 'danger' : 'secondary'}
                    onClick={() => changeStatus(nextStatus)}
                    loading={busy === 'status'}
                  >
                    Mark {nextStatus.replaceAll('_', ' ')}
                  </Button>
                ))}
                {(NEXT_STATUSES[selected.order.status] ?? []).length === 0 ? (
                  <p className="text-xs text-cocoa-500">No further status changes are available.</p>
                ) : null}
              </div>

              {!['mobile_money', 'bank_card'].includes(selected.order.paymentMethod) &&
              selected.order.paymentStatus !== 'paid' ? (
                <div className="mt-4 border-t border-cocoa-900/10 pt-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cocoa-500">
                    Offline payment
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() => changePayment('paid')}
                      loading={busy === 'payment'}
                    >
                      Mark paid
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => changePayment('pending')}
                      loading={busy === 'payment'}
                    >
                      Mark pending
                    </Button>
                  </div>
                </div>
              ) : null}

              {selected.payments?.length ? (
                <div className="mt-4 border-t border-cocoa-900/10 pt-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cocoa-500">
                    Provider transactions
                  </p>
                  <ul className="mt-2 space-y-2 text-xs text-cocoa-600">
                    {selected.payments.map((payment) => (
                      <li key={payment.id} className="rounded-lg bg-cream-50 p-2">
                        {payment.provider} · {payment.status} · {payment.providerReference || 'no reference'}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

export default AdminOrders;
