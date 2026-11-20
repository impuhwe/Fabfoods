import { useEffect, useState } from 'react';
import { CalendarDays, RefreshCw, ShoppingBag } from 'lucide-react';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Field from '../../components/ui/Field.jsx';
import Input from '../../components/ui/Input.jsx';
import Select from '../../components/ui/Select.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { getApiErrorMessage } from '../../lib/api.js';
import { formatRwf } from '../../lib/format.js';
import { can, PERMISSIONS } from '../../lib/permissions.js';
import {
  getAdminReservation,
  getAdminReservations,
  rescheduleAdminReservation,
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

const SELECTION_STATUS_VARIANT = {
  not_requested: 'neutral',
  pending_review: 'warning',
  confirmed: 'success',
  declined: 'danger',
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
  const { user } = useAuth();
  const { addToast } = useToast();
  const [status, setStatus] = useState('pending');
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState('');
  const [reschedule, setReschedule] = useState({ date: '', time: '', partySize: '' });
  const [busy, setBusy] = useState(false);

  const canChangeStatus = can(user, PERMISSIONS.RESERVATIONS_STATUS_UPDATE);
  const canReschedule = can(user, PERMISSIONS.RESERVATIONS_RESCHEDULE);
  const hasLegacySelection = Boolean(
    selected?.menuSelections?.length || selected?.selectionEstimate || selected?.preparationNotes,
  );

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

  async function selectReservation(id) {
    setBusy(true);
    setError('');
    try {
      const reservation = await getAdminReservation(id);
      setSelected(reservation);
      setNote('');
      setReschedule({
        date: reservation.date ?? '',
        time: reservation.time ?? '',
        partySize: String(reservation.partySize ?? ''),
      });
    } catch (detailError) {
      setError(getApiErrorMessage(detailError, 'That reservation could not be loaded.'));
    } finally {
      setBusy(false);
    }
  }

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

  async function saveReschedule(event) {
    event.preventDefault();
    if (!selected) return;
    setBusy(true);
    setError('');
    try {
      const updated = await rescheduleAdminReservation(selected.id, {
        date: reschedule.date,
        time: reschedule.time,
        partySize: Number(reschedule.partySize),
        note,
      });
      setSelected(updated);
      setReservations((current) =>
        current.map((entry) => (entry.id === updated.id ? updated : entry)),
      );
      setNote('');
      addToast({ title: 'Reservation rescheduled', variant: 'success' });
    } catch (rescheduleError) {
      setError(getApiErrorMessage(rescheduleError, 'The reservation could not be rescheduled.'));
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
            Table requests stay pending until staff approve.
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
                onClick={() => selectReservation(reservation.id)}
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
                  Special request: {selected.specialRequests}
                </p>
              ) : null}

              {hasLegacySelection ? (
                <div className="mt-4 rounded-xl border border-cocoa-900/10 bg-cream-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-cocoa-500">
                      <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                      Earlier food and drink preferences
                    </p>
                    {selected.selectionStatusLabel ? (
                      <Badge
                        variant={SELECTION_STATUS_VARIANT[selected.selectionStatus] ?? 'neutral'}
                        dot
                      >
                        {selected.selectionStatusLabel}
                      </Badge>
                    ) : null}
                  </div>

                  {selected.menuSelections?.length ? (
                    <ul className="mt-3 divide-y divide-cocoa-900/10">
                      {selected.menuSelections.map((line, index) => (
                        <li
                          key={`${line.slug}-${index}`}
                          className="flex flex-wrap items-start justify-between gap-2 py-2 first:pt-0"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-cocoa-950">
                              {line.quantity} × {line.name}
                            </p>
                            {line.selectionSummary?.length ? (
                              <p className="mt-0.5 text-xs text-cocoa-600">
                                {line.selectionSummary.join(' · ')}
                              </p>
                            ) : null}
                            <p className="mt-0.5 text-xs text-cocoa-500">
                              {formatRwf(line.unitPrice)} each
                            </p>
                          </div>
                          <span className="font-semibold tabular-nums text-cocoa-900">
                            {formatRwf(line.lineTotal)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  {selected.selectionEstimate ? (
                    <div className="mt-3 flex items-center justify-between border-t border-cocoa-900/10 pt-3 text-sm">
                      <span className="font-semibold text-cocoa-800">Estimated total</span>
                      <span className="font-display text-lg font-semibold text-cocoa-950">
                        {formatRwf(selected.selectionEstimate.total)}
                      </span>
                    </div>
                  ) : null}

                  {selected.preparationNotes ? (
                    <p className="mt-3 rounded-lg bg-white p-3 text-xs text-cocoa-600">
                      Preparation notes: {selected.preparationNotes}
                    </p>
                  ) : null}

                  {selected.selectionStatusHistory?.length ? (
                    <div className="mt-4 border-t border-cocoa-900/10 pt-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cocoa-500">
                        Selection history
                      </p>
                      <ul className="mt-2 space-y-1 text-xs text-cocoa-600">
                        {selected.selectionStatusHistory.map((event, index) => (
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
              ) : null}

              {canChangeStatus || canReschedule ? (
                <div className="mt-4">
                  <Field label="Staff note" hint="Saved with the next decision or reschedule.">
                    <Input value={note} onChange={(event) => setNote(event.target.value)} />
                  </Field>
                </div>
              ) : null}

              {canChangeStatus ? (
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
                    <p className="text-xs text-cocoa-500">
                      No further status changes are available.
                    </p>
                  ) : null}
                </div>
              ) : null}

              {canReschedule && ['pending', 'confirmed'].includes(selected.status) ? (
                <form className="mt-5 border-t border-cocoa-900/10 pt-4" onSubmit={saveReschedule}>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cocoa-500">
                    Reschedule
                  </p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <Field label="Date">
                      <Input
                        required
                        type="date"
                        value={reschedule.date}
                        onChange={(event) =>
                          setReschedule((current) => ({ ...current, date: event.target.value }))
                        }
                      />
                    </Field>
                    <Field label="Time">
                      <Input
                        required
                        type="time"
                        value={reschedule.time}
                        onChange={(event) =>
                          setReschedule((current) => ({ ...current, time: event.target.value }))
                        }
                      />
                    </Field>
                    <Field label="Guests">
                      <Input
                        required
                        type="number"
                        min="1"
                        value={reschedule.partySize}
                        onChange={(event) =>
                          setReschedule((current) => ({
                            ...current,
                            partySize: event.target.value,
                          }))
                        }
                      />
                    </Field>
                  </div>
                  <Button className="mt-3" size="sm" variant="secondary" disabled={busy}>
                    Save new time
                  </Button>
                </form>
              ) : null}

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
