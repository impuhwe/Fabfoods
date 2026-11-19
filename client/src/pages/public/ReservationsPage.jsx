import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useController, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Briefcase,
  Cake,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  Coffee,
  Heart,
  ListChecks,
  Users,
} from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import DatePicker from '../../components/ui/DatePicker.jsx';
import Field from '../../components/ui/Field.jsx';
import Input, { inputClasses } from '../../components/ui/Input.jsx';
import usePageMeta from '../../hooks/usePageMeta.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { getApiErrorMessage } from '../../lib/api.js';
import { getKigaliDateBounds } from '../../lib/calendarDate.js';
import { OCCASIONS } from '../../lib/site.js';
import { HIGH_PRIORITY_IMAGE_PROPS, RESERVATION_IMAGE } from '../../lib/imagery.js';
import { reservationFormSchema } from '../../lib/validation.js';
import { requestReservation } from '../../services/publicApi.js';

const OCCASION_ICONS = {
  Birthday: Cake,
  Anniversary: Heart,
  'Business meal': Briefcase,
  'Family gathering': Users,
  Other: Coffee,
};

export function ReservationsPage() {
  const { user } = useAuth();
  const [reservation, setReservation] = useState(null);
  const [submitError, setSubmitError] = useState('');
  const { min: minDate, max: maxDate } = getKigaliDateBounds();
  const {
    register,
    control,
    handleSubmit,
    reset,
    getValues,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(reservationFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      date: minDate,
      time: '19:00',
      partySize: 2,
      occasion: '',
      specialRequests: '',
    },
  });
  const currentValues = watch();

  const { field: dateField } = useController({ control, name: 'date' });
  const { field: occasionField } = useController({ control, name: 'occasion' });

  usePageMeta({
    title: 'Reservations',
    description:
      'Request a table at FAB FOODS in Kigali. Requests are reviewed and confirmed by the restaurant.',
    image: RESERVATION_IMAGE,
  });

  useEffect(() => {
    if (user) {
      reset({
        ...getValues(),
        name: user.name ?? '',
        email: user.email ?? '',
        phone: user.phone ?? '',
      });
    }
  }, [user, reset, getValues]);

  async function onSubmit(formValues) {
    setSubmitError('');
    try {
      const data = await requestReservation(formValues);
      setReservation(data.reservation);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      setSubmitError(
        getApiErrorMessage(error, 'Your request could not be sent. Please try again.'),
      );
    }
  }

  if (reservation) {
    return (
      <section className="mx-auto max-w-3xl px-5 py-16 sm:px-8 lg:py-24">
        <div className="rounded-2xl border border-cocoa-900/10 bg-white p-6 shadow-soft sm:p-10">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success">
            <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
          </span>
          <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.24em] text-success">
            Request received
          </p>
          <h1 className="mt-2 font-display text-display-md font-semibold text-cocoa-950">
            Thank you, {reservation.name.split(' ')[0]}.
          </h1>
          <p className="mt-3 text-base leading-relaxed text-cocoa-600">
            Your table request has been sent. It is <strong>not confirmed</strong> yet — the
            restaurant will review it and contact you using the details you provided.
          </p>

          <dl className="mt-6 grid gap-4 rounded-xl bg-cream-50 p-5 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-cocoa-500">
                Reference
              </dt>
              <dd className="mt-1 font-semibold tabular-nums text-cocoa-950">
                {reservation.reference}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-cocoa-500">
                Status
              </dt>
              <dd className="mt-1 font-semibold text-cocoa-950">{reservation.statusLabel}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-cocoa-500">
                Date & time
              </dt>
              <dd className="mt-1 text-cocoa-900">
                {reservation.date} at {reservation.time}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-cocoa-500">
                Party
              </dt>
              <dd className="mt-1 text-cocoa-900">{reservation.partySize} guests</dd>
            </div>
          </dl>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild variant="order">
              <Link to="/menu">Browse the menu</Link>
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setReservation(null);
                reset({ ...getValues(), specialRequests: '' });
              }}
            >
              Make another request
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="relative isolate overflow-hidden bg-cocoa-950 text-cream-50">
        <img
          src={RESERVATION_IMAGE}
          alt="Restaurant table set for service"
          {...HIGH_PRIORITY_IMAGE_PROPS}
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-cocoa-950/95 via-cocoa-950/75 to-cocoa-950/30" />
        <div className="relative mx-auto max-w-[1240px] px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
          <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-ember-300">
            Reservations
          </p>
          <h1 className="mt-4 max-w-2xl font-display text-display-xl font-semibold leading-[0.92]">
            Request a table.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-cream-100/75">
            Tell us when you would like to come in. The restaurant will review your request and
            confirm it with you directly. Submitting this form does not confirm a table.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1240px] gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[1fr_0.65fr] lg:px-12 lg:py-16">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="min-w-0 rounded-2xl border border-cocoa-900/10 bg-white p-6 shadow-soft sm:p-8"
          noValidate
        >
          <h2 className="font-display text-2xl font-semibold text-cocoa-950">Your request</h2>
          <p className="mt-1 text-sm text-cocoa-600">All fields marked * are required.</p>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <Field label="Full name" required error={errors.name?.message}>
              <Input autoComplete="name" {...register('name')} />
            </Field>
            <Field label="Email" required error={errors.email?.message}>
              <Input type="email" autoComplete="email" {...register('email')} />
            </Field>
            <Field label="Phone" required error={errors.phone?.message}>
              <Input type="tel" autoComplete="tel" {...register('phone')} />
            </Field>
            <Field label="Guests" required error={errors.partySize?.message}>
              <Input type="number" min={1} max={20} {...register('partySize')} />
            </Field>
            <Field label="Date" required error={errors.date?.message}>
              <DatePicker
                value={dateField.value}
                onChange={dateField.onChange}
                onBlur={dateField.onBlur}
                ref={dateField.ref}
                name={dateField.name}
                min={minDate}
                max={maxDate}
                placeholder="Pick a date"
                invalid={Boolean(errors.date)}
              />
            </Field>
            <Field
              label="Time"
              required
              error={errors.time?.message}
              hint="A preferred request window — not a published opening-hours slot."
            >
              <Input type="time" step={900} {...register('time')} />
            </Field>
            <fieldset className="sm:col-span-2">
              <legend
                id="reservation-occasion-legend"
                className="text-sm font-medium text-cocoa-800"
              >
                Occasion
              </legend>
              <div className="mt-0.5 flex flex-wrap items-center gap-3">
                <p className="text-xs text-cocoa-500">
                  Optional — leave unselected for a normal reservation.
                </p>
                {occasionField.value ? (
                  <button
                    type="button"
                    onClick={() => occasionField.onChange('')}
                    className="text-xs font-semibold text-ember-700 underline"
                  >
                    Clear occasion
                  </button>
                ) : null}
              </div>
              <div
                role="radiogroup"
                aria-labelledby="reservation-occasion-legend"
                className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3"
              >
                {OCCASIONS.map((occasion) => {
                  const Icon = OCCASION_ICONS[occasion] ?? Coffee;
                  const checked = occasionField.value === occasion;
                  return (
                    <label key={occasion} className="cursor-pointer">
                      <input
                        type="radio"
                        name="occasion"
                        value={occasion}
                        checked={checked}
                        onChange={() => occasionField.onChange(occasion)}
                        onBlur={occasionField.onBlur}
                        className="peer sr-only"
                      />
                      <span
                        className={`flex h-full items-center gap-2 rounded-xl border px-3 py-3 text-left transition-colors ${
                          checked
                            ? 'border-ember-500 bg-ember-500/10 text-cocoa-950'
                            : 'border-cocoa-900/15 bg-white text-cocoa-700 hover:bg-cream-100'
                        } peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ember-500`}
                      >
                        <Icon className="h-4 w-4 shrink-0 text-ember-700" aria-hidden="true" />
                        <span className="font-display text-base font-semibold leading-tight">
                          {occasion}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
              {errors.occasion?.message ? (
                <p role="alert" className="mt-2 text-xs font-medium text-danger">
                  {errors.occasion.message}
                </p>
              ) : null}
            </fieldset>
            <Field
              label="Special requests"
              error={errors.specialRequests?.message}
              hint="Accessibility, seating, dietary needs — anything the restaurant should know."
              className="sm:col-span-2"
            >
              <textarea rows={4} className={inputClasses} {...register('specialRequests')} />
            </Field>
          </div>

          <div className="mt-6 rounded-2xl border border-cocoa-900/10 bg-cream-50 p-5">
            <div className="flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-ember-700" aria-hidden="true" />
              <h2 className="font-display text-xl font-semibold text-cocoa-950">
                Review before sending
              </h2>
            </div>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-cocoa-500">
                  Guest
                </dt>
                <dd className="mt-0.5 text-cocoa-900">{currentValues.name || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-cocoa-500">
                  Contact
                </dt>
                <dd className="mt-0.5 text-cocoa-900">
                  {currentValues.email || '—'} · {currentValues.phone || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-cocoa-500">
                  Requested table
                </dt>
                <dd className="mt-0.5 text-cocoa-900">
                  {currentValues.date || '—'} at {currentValues.time || '—'} ·{' '}
                  {currentValues.partySize || '—'} guests
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-cocoa-500">
                  Occasion
                </dt>
                <dd className="mt-0.5 text-cocoa-900">{currentValues.occasion || '—'}</dd>
              </div>
            </dl>
            {currentValues.specialRequests ? (
              <p className="mt-4 rounded-lg bg-white p-3 text-xs text-cocoa-600">
                Special requests: {currentValues.specialRequests}
              </p>
            ) : null}
          </div>

          {submitError ? (
            <p
              role="alert"
              className="mt-4 rounded-lg bg-danger/5 p-3 text-sm font-medium text-danger"
            >
              {submitError}
            </p>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button type="submit" variant="order" size="lg" loading={isSubmitting}>
              <CalendarCheck className="h-4 w-4" aria-hidden="true" />
              Send table request
            </Button>
            <p className="text-xs text-cocoa-500">This is a request, not a confirmed booking.</p>
          </div>
        </form>

        <aside className="min-w-0 space-y-5">
          <div className="rounded-2xl border border-cocoa-900/10 bg-cream-50 p-5">
            <h2 className="font-display text-xl font-semibold text-cocoa-950">Good to know</h2>
            <ul className="mt-4 space-y-4 text-sm text-cocoa-600">
              <li className="flex gap-3">
                <Users className="mt-0.5 h-4 w-4 shrink-0 text-ember-700" aria-hidden="true" />
                <span>For parties over 20, send a message through the contact form.</span>
              </li>
              <li className="flex gap-3">
                <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-ember-700" aria-hidden="true" />
                <span>Times shown are requests. The restaurant confirms the final time.</span>
              </li>
              <li className="flex gap-3">
                <CalendarCheck
                  className="mt-0.5 h-4 w-4 shrink-0 text-ember-700"
                  aria-hidden="true"
                />
                <span>You will be contacted using the email or phone number you provide.</span>
              </li>
            </ul>
          </div>
          <div className="rounded-2xl border border-warning/25 bg-warning/5 p-5 text-sm text-cocoa-700">
            <p className="font-semibold">Opening hours are being confirmed.</p>
            <p className="mt-1">
              We are not publishing hours until the owner approves them. The restaurant will advise
              on timing when it responds to your request.
            </p>
          </div>
        </aside>
      </section>
    </>
  );
}

export default ReservationsPage;
