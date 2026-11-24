import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CalendarDays,
  ChevronRight,
  LogOut,
  Mail,
  Phone,
  ShoppingBag,
  UserRound,
} from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Field from '../../components/ui/Field.jsx';
import Input from '../../components/ui/Input.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import usePageMeta from '../../hooks/usePageMeta.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { formatRwf } from '../../lib/format.js';
import { getApiErrorMessage } from '../../lib/api.js';
import { passwordFormSchema, profileFormSchema } from '../../lib/validation.js';
import {
  cancelReservation,
  changePassword,
  getMyOrders,
  getMyReservations,
  updateProfile,
} from '../../services/publicApi.js';

const RESERVATION_VARIANT = {
  pending: 'warning',
  confirmed: 'success',
  declined: 'danger',
  cancelled: 'neutral',
  completed: 'info',
  no_show: 'danger',
};

const ORDER_VARIANT = {
  pending_payment: 'warning',
  confirmed: 'info',
  preparing: 'info',
  ready: 'success',
  out_for_delivery: 'success',
  completed: 'success',
  cancelled: 'danger',
};

export function AccountPage() {
  const { user, logout, refreshUser } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [reservations, setReservations] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState('');
  const [profileMessage, setProfileMessage] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [actionError, setActionError] = useState('');

  const profileForm = useForm({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.name ?? '',
      email: user?.email ?? '',
      phone: user?.phone ?? '',
    },
  });

  const passwordForm = useForm({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  usePageMeta({
    title: 'Your account',
    description: 'Your FAB FOODS profile, orders and table requests.',
  });

  useEffect(() => {
    profileForm.reset({
      name: user?.name ?? '',
      email: user?.email ?? '',
      phone: user?.phone ?? '',
    });
  }, [user, profileForm]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([getMyReservations(), getMyOrders()])
      .then(([nextReservations, nextOrders]) => {
        if (!active) return;
        setReservations(nextReservations);
        setOrders(nextOrders.orders);
      })
      .catch(() => {
        if (active) setError('Your account history could not be loaded.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function signOut() {
    await logout();
    navigate('/');
  }

  async function saveProfile(values) {
    setProfileMessage('');
    setActionError('');
    try {
      await updateProfile({
        name: values.name,
        email: values.email,
        phone: values.phone,
      });
      await refreshUser();
      setProfileMessage('Profile updated.');
      addToast({ title: 'Profile updated', variant: 'success' });
    } catch (saveError) {
      setActionError(getApiErrorMessage(saveError, 'Your profile could not be updated.'));
    }
  }

  async function savePassword(values) {
    setPasswordMessage('');
    setPasswordError('');
    try {
      const result = await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      passwordForm.reset();
      setPasswordMessage(result.message ?? 'Password updated.');
      addToast({ title: 'Password updated', variant: 'success' });
    } catch (saveError) {
      setPasswordError(getApiErrorMessage(saveError, 'Your password could not be changed.'));
    }
  }

  async function handleCancelReservation(reference) {
    if (!window.confirm('Cancel this table request?')) return;
    setActionError('');
    setCancelling(reference);
    try {
      const updated = await cancelReservation(reference);
      setReservations((current) =>
        current.map((reservation) => (reservation.reference === reference ? updated : reservation)),
      );
      addToast({ title: 'Table request cancelled', variant: 'success' });
    } catch (cancelError) {
      setActionError(getApiErrorMessage(cancelError, 'The request could not be cancelled.'));
    } finally {
      setCancelling('');
    }
  }

  return (
    <section className="mx-auto max-w-[1240px] px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-ember-700">
            Your account
          </p>
          <h1 className="mt-3 font-display text-display-lg font-semibold text-cocoa-950">
            Hello, {user?.name?.split(' ')[0] ?? 'there'}.
          </h1>
          <p className="mt-2 text-sm text-cocoa-600">
            Manage your details, orders and table requests in one place.
          </p>
        </div>
        <Button variant="secondary" onClick={signOut}>
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Sign out
        </Button>
      </div>

      {actionError ? (
        <p role="alert" className="mt-6 rounded-lg bg-danger/5 p-3 text-sm text-danger">
          {actionError}
        </p>
      ) : null}

      <div className="mt-10 grid gap-6 lg:grid-cols-[0.7fr_1.3fr]">
        <aside className="space-y-4">
          <div className="rounded-2xl border border-cocoa-900/10 bg-white p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-cream-200 text-cocoa-700">
                <UserRound className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="font-semibold text-cocoa-950">{user?.name}</p>
                <p className="text-xs uppercase tracking-[0.16em] text-cocoa-500">{user?.role}</p>
              </div>
            </div>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex items-center gap-2 text-cocoa-600">
                <Mail className="h-4 w-4 text-cocoa-400" aria-hidden="true" />
                <dd>{user?.email}</dd>
              </div>
              <div className="flex items-center gap-2 text-cocoa-600">
                <Phone className="h-4 w-4 text-cocoa-400" aria-hidden="true" />
                <dd>{user?.phone || 'No phone number saved'}</dd>
              </div>
            </dl>
          </div>

          <form
            onSubmit={profileForm.handleSubmit(saveProfile)}
            className="rounded-2xl border border-cocoa-900/10 bg-white p-6"
            noValidate
          >
            <h2 className="font-display text-lg font-semibold text-cocoa-950">Profile details</h2>
            <div className="mt-4 space-y-4">
              <Field label="Full name" error={profileForm.formState.errors.name?.message}>
                <Input autoComplete="name" {...profileForm.register('name')} />
              </Field>
              <Field label="Email" error={profileForm.formState.errors.email?.message}>
                <Input type="email" autoComplete="email" {...profileForm.register('email')} />
              </Field>
              <Field label="Phone" error={profileForm.formState.errors.phone?.message}>
                <Input type="tel" autoComplete="tel" {...profileForm.register('phone')} />
              </Field>
            </div>
            {profileMessage ? (
              <p role="status" className="mt-3 text-sm font-medium text-success">
                {profileMessage}
              </p>
            ) : null}
            <Button
              type="submit"
              variant="order"
              className="mt-4 w-full"
              loading={profileForm.formState.isSubmitting}
            >
              Save profile
            </Button>
          </form>

          <form
            onSubmit={passwordForm.handleSubmit(savePassword)}
            className="rounded-2xl border border-cocoa-900/10 bg-cream-50 p-6"
            noValidate
          >
            <h2 className="font-display text-lg font-semibold text-cocoa-950">Change password</h2>
            <p className="mt-1 text-xs leading-relaxed text-cocoa-500">
              Changing your password signs out other devices.
            </p>
            <div className="mt-4 space-y-4">
              <Field
                label="Current password"
                error={passwordForm.formState.errors.currentPassword?.message}
              >
                <Input
                  type="password"
                  autoComplete="current-password"
                  {...passwordForm.register('currentPassword')}
                />
              </Field>
              <Field
                label="New password"
                error={passwordForm.formState.errors.newPassword?.message}
                hint="At least 12 characters with upper and lower case letters and a number."
              >
                <Input
                  type="password"
                  autoComplete="new-password"
                  {...passwordForm.register('newPassword')}
                />
              </Field>
              <Field
                label="Confirm new password"
                error={passwordForm.formState.errors.confirmPassword?.message}
              >
                <Input
                  type="password"
                  autoComplete="new-password"
                  {...passwordForm.register('confirmPassword')}
                />
              </Field>
            </div>
            {passwordError ? (
              <p role="alert" className="mt-3 text-sm font-medium text-danger">
                {passwordError}
              </p>
            ) : null}
            {passwordMessage ? (
              <p role="status" className="mt-3 text-sm font-medium text-success">
                {passwordMessage}
              </p>
            ) : null}
            <Button
              type="submit"
              variant="secondary"
              className="mt-4 w-full"
              loading={passwordForm.formState.isSubmitting}
            >
              Update password
            </Button>
          </form>
        </aside>

        <div className="space-y-8">
          <div>
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-2xl font-semibold text-cocoa-950">Your orders</h2>
              <Button asChild size="sm" variant="secondary">
                <Link to="/menu">Order again</Link>
              </Button>
            </div>

            {error ? (
              <p className="mt-4 rounded-lg bg-danger/5 p-3 text-sm text-danger">{error}</p>
            ) : null}

            {loading ? (
              <div className="mt-4 space-y-3">
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
              </div>
            ) : orders.length === 0 ? (
              <EmptyState
                icon={ShoppingBag}
                title="No orders yet"
                description="Your online orders will appear here after checkout."
                action={
                  <Button asChild variant="order">
                    <Link to="/menu">Explore the menu</Link>
                  </Button>
                }
                className="mt-4"
              />
            ) : (
              <ul className="mt-4 space-y-3">
                {orders.map((order) => (
                  <li key={order.id}>
                    <Link
                      to={`/order/${order.orderNumber}`}
                      className="block rounded-xl border border-cocoa-900/10 bg-white p-5 transition-colors hover:border-ember-500/40 hover:bg-cream-50"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-display text-lg font-semibold text-cocoa-950">
                            {order.orderNumber}
                          </p>
                          <p className="mt-1 text-sm text-cocoa-600">
                            {order.items.reduce((total, line) => total + line.quantity, 0)} items ·{' '}
                            {order.fulfillmentType === 'delivery' ? 'Delivery' : 'Pickup'}
                          </p>
                        </div>
                        <Badge variant={ORDER_VARIANT[order.status] ?? 'neutral'} dot>
                          {order.statusLabel}
                        </Badge>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-cocoa-900/10 pt-3 text-xs text-cocoa-500">
                        <span>
                          {new Date(order.createdAt).toLocaleDateString('en-RW', {
                            timeZone: 'Africa/Kigali',
                          })}
                        </span>
                        <span className="flex items-center gap-1 font-semibold text-cocoa-800">
                          {formatRwf(order.total)}
                          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-2xl font-semibold text-cocoa-950">Table requests</h2>
              <Button asChild size="sm" variant="secondary">
                <Link to="/reservations">New request</Link>
              </Button>
            </div>

            {loading ? (
              <div className="mt-4 space-y-3">
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
              </div>
            ) : reservations.length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title="No table requests yet"
                description="When you request a table while signed in, it will appear here."
                action={
                  <Button asChild variant="order">
                    <Link to="/reservations">Request a table</Link>
                  </Button>
                }
                className="mt-4"
              />
            ) : (
              <ul className="mt-4 space-y-3">
                {reservations.map((reservation) => {
                  const cancellable = ['pending', 'confirmed'].includes(reservation.status);
                  return (
                    <li
                      key={reservation.id}
                      className="rounded-xl border border-cocoa-900/10 bg-white p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-display text-lg font-semibold text-cocoa-950">
                            {reservation.date} at {reservation.time}
                          </p>
                          <p className="mt-1 text-sm text-cocoa-600">
                            {reservation.partySize} guests
                            {reservation.occasion && reservation.occasion !== 'No special occasion'
                              ? ` · ${reservation.occasion}`
                              : ''}
                          </p>
                        </div>
                        <Badge variant={RESERVATION_VARIANT[reservation.status] ?? 'neutral'} dot>
                          {reservation.statusLabel}
                        </Badge>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-cocoa-900/10 pt-3 text-xs text-cocoa-500">
                        <span className="tabular-nums">Ref {reservation.reference}</span>
                        <span>{reservation.statusMessage}</span>
                      </div>
                      {cancellable ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="mt-3"
                          onClick={() => handleCancelReservation(reservation.reference)}
                          loading={cancelling === reservation.reference}
                        >
                          Cancel request
                        </Button>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default AccountPage;
