import { useEffect, useState } from 'react';
import { CalendarDays, RefreshCw } from 'lucide-react';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Field from '../../components/ui/Field.jsx';
import Input from '../../components/ui/Input.jsx';
import Select from '../../components/ui/Select.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { getApiErrorMessage } from '../../lib/api.js';
import {
  getAdminReservations,
  updateAdminReservationStatus,
} from '../../services/adminApi.js';

const STATUS_VARIANT = {
  pending: 'warning',
  confirmed: 'success',
  declined: 'danger',
  cancelled: 'neutral',
  completed: 'info',
  no_show: 'danger',
};

const NEXT_ACTIONS = {
  pending: [
    { status: 'confirmed', label: 'Approve' },
    { status: 'declined', label: 'Decline', variant: 'danger' },
    { status: 'cancelled', label: 'Cancel', variant: 'secondary' },
  ],
  confirmed: [
    { status: 'completed', label: 'Mark completed' },
    { status: 'no_show', label: 'No show', variant: 'secondary' },
    { status: 'cancelled', label: 'Cancel', variant: 'danger' },
  ],
  declined: [],
  cancelled: [],
  completed: [],
  no_show: [],
};

const STATUSES = ['pending', 'confirmed', 'declined', 'cancelled', 'completed', 'no_show'];

export function AdminReservations() {
  const { addToast } = useToast();
  const [status, setStatus] = useState('pending');
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  async function load(nextStatus = status) {
    setLoading(true);
    setError('');
    try {
      const result = await getAdminReservations(nextStatus ? { status: nextStatus } : {});
      setReservations(result.reservations);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, 'Reservations could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(status);
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  async function changeStatus(nextStatus) {
    if (!selected) return;
    setBusy(true);
    setError('');
    try {
      const updated = await updateAdminReservationStatus(selected.id, {
        status: nextStatus,
        note,
      });
      setSelected(updated);
      setReservations((current) =>
        current.map((entry) => (entry.id === updated.id ? updated : entry)),
      );
      setNote('');
      addToast({
        title: `Reservation marked ${nextStatus.replaceAll('_', ' ')}`,
        variant: 'success',
      });
    } catch (updateError) {
      setError(getApiErrorMessage(updateError, 'The reservation could not be updated.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-semibold text-cocoa-950">Reservations</h2>
          <p className="mt-1 text-sm text-cocoa-600">
            Requests stay pending until a staff member explicitly approves them.
          </p>
        </div>
        <div className="flex items-end gap-2">
          <Field label="Status" className="w-44">
            <Select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="">All requests</option>
              {STATUSES.map((entry) => (
                <option key={entry} value={entry}>
                  {entry.replaceAll('_', ' ')}
                </option>
              ))}
            </Select>
          </Field>
          <Button variant="secondary" onClick={() => load()}>
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
          ) : reservations.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="No requests found"
              description="New table requests will appear here."
            />
          ) : (
            reservations.map((reservation) => (
              <button
                key={reservation.id}
                type="button"
                onClick={() => {
                  setSelected(reservation);
                  setNote('');
                }}
                className={`block w-full rounded-xl border bg-white p-4 text-left transition-colors hover:border-ember-500/40 ${
                  selected?.id === reservation.id
                    ? 'border-ember-500 ring-1 ring-ember-500/30'
                    : 'border-cocoa-900/10'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-cocoa-950">
                      {reservation.date} at {reservation.time}
                    </p>
                    <p className="mt-1 text-xs text-cocoa-500">
                      {reservation.name} · {reservation.partySize} guests
                    </p>
                  </div>
                  <Badge variant={STATUS_VARIANT[reservation.status] ?? 'neutral'} dot>
                    {reservation.statusLabel}
                  </Badge>
                </div>
                <p className="mt-2 text-xs text-cocoa-500">Ref {reservation.reference}</p>
              </button>
            ))
          )}
        </div>

        <aside className="h-fit rounded-2xl border border-cocoa-900/10 bg-white p-5 xl:sticky xl:top-6">
          {!selected ? (
            <p className="text-sm text-cocoa-600">Select a request to review and respond.</p>
          ) : (
            <div>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="font-display text-xl font-semibold text-cocoa-950">
                    {selected.reference}
                  </h3>
                  <p className="text-xs text-cocoa-500">
                    {selected.name} · {selected.phone}
                  </p>
                </div>
                <Badge variant={STATUS_VARIANT[selected.status] ?? 'neutral'} dot>
                  {selected.statusLabel}
                </Badge>
              </div>

              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-cocoa-600">Date</dt>
                  <dd className="font-medium">
                    {selected.date} at {selected.time}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-cocoa-600">Party</dt>
                  <dd className="font-medium">{selected.partySize} guests</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-cocoa-600">Email</dt>
                  <dd className="text-right text-xs">{selected.email}</dd>
                </div>
                {selected.occasion ? (
                  <div className="flex justify-between gap-3">
                    <dt className="text-cocoa-600">Occasion</dt>
                    <dd className="text-right">{selected.occasion}</dd>
                  </div>
                ) : null}
              </dl>

              {selected.specialRequests ? (
                <p className="mt-3 rounded-lg bg-cream-50 p-3 text-xs text-cocoa-600">
                  Request: {selected.specialRequests}
                </p>
              ) : null}

              <div className="mt-4">
                <Field label="Staff note" hint="Optional note saved with the decision.">
                  <Input value={note} onChange={(event) => setNote(event.target.value)} />
                </Field>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {(NEXT_ACTIONS[selected.status] ?? []).map((action) => (
                  <Button
                    key={action.status}
                    size="sm"
                    variant={action.variant ?? 'secondary'}
                    onClick={() => changeStatus(action.status)}
                    loading={busy}
                  >
                    {action.label}
                  </Button>
                ))}
                {(NEXT_ACTIONS[selected.status] ?? []).length === 0 ? (
                  <p className="text-xs text-cocoa-500">No further actions are available.</p>
                ) : null}
              </div>

              {selected.statusHistory?.length ? (
                <div className="mt-4 border-t border-cocoa-900/10 pt-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cocoa-500">
                    History
                  </p>
                  <ul className="mt-2 space-y-2 text-xs text-cocoa-600">
                    {selected.statusHistory.map((event, index) => (
                      <li key={`${event.status}-${index}`}>
                        {event.status.replaceAll('_', ' ')} ·{' '}
                        {new Date(event.changedAt).toLocaleString('en-RW', {
                          timeZone: 'Africa/Kigali',
                        })}
                        {event.note ? ` · ${event.note}` : ''}
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

export default AdminReservations;
