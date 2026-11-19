import { useState } from 'react';
import { useController, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, Users } from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import DatePicker from '../../components/ui/DatePicker.jsx';
import Field from '../../components/ui/Field.jsx';
import Input, { inputClasses } from '../../components/ui/Input.jsx';
import SelectMenu from '../../components/ui/SelectMenu.jsx';
import usePageMeta from '../../hooks/usePageMeta.js';
import { getApiErrorMessage } from '../../lib/api.js';
import { getKigaliDateString } from '../../lib/calendarDate.js';
import { cateringFormSchema } from '../../lib/validation.js';
import { submitCateringRequest } from '../../services/publicApi.js';

const EVENT_TYPES = [
  { value: 'corporate', label: 'Corporate event' },
  { value: 'private', label: 'Private celebration' },
  { value: 'wedding', label: 'Wedding' },
  { value: 'community', label: 'Community gathering' },
  { value: 'other', label: 'Other' },
];

export function CateringPage() {
  const [sent, setSent] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const minDate = getKigaliDateString();
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(cateringFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      eventType: '',
      eventDate: '',
      guestCount: 20,
      location: '',
      message: '',
    },
  });

  const { field: eventTypeField } = useController({ control, name: 'eventType' });
  const { field: eventDateField } = useController({ control, name: 'eventDate' });

  usePageMeta({
    title: 'Catering requests',
    description:
      'Send a catering request to FAB FOODS in Kigali without creating an account or signing in.',
  });

  async function onSubmit(values) {
    setSubmitError('');
    try {
      await submitCateringRequest(values);
      setSent(true);
      reset();
    } catch (error) {
      setSubmitError(
        getApiErrorMessage(error, 'Your catering request could not be sent. Please try again.'),
      );
    }
  }

  return (
    <>
      <section className="border-b border-cocoa-900/10 bg-cream-50">
        <div className="mx-auto max-w-[1240px] px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
          <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-ember-700">
            Catering
          </p>
          <div className="mt-4 max-w-2xl">
            <h1 className="font-display text-display-lg font-semibold text-cocoa-950">
              Feed the whole room.
            </h1>
            <p className="mt-3 text-base leading-relaxed text-cocoa-600">
              Tell us about your event and how many people you expect. You do not need an account to
              send a catering request — the restaurant team reviews every enquiry.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1240px] gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[0.7fr_1fr] lg:px-12 lg:py-16">
        <aside className="space-y-4">
          <div className="rounded-2xl border border-cocoa-900/10 bg-white p-5">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ember-500/10 text-ember-700">
              <Users className="h-6 w-6" aria-hidden="true" />
            </span>
            <h2 className="mt-4 font-display text-xl font-semibold text-cocoa-950">
              What happens next
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-cocoa-600">
              Your request is saved for the restaurant team with the details needed to follow up.
              Email delivery is not connected yet, so this is not an instant confirmation.
            </p>
          </div>
          <div className="rounded-2xl border border-cocoa-900/10 bg-cream-50 p-5 text-sm leading-relaxed text-cocoa-600">
            Looking for a table instead? Use the reservations page so your date, time and party size
            reach the team in the right format.
          </div>
        </aside>

        <div className="rounded-2xl border border-cocoa-900/10 bg-white p-6 shadow-soft sm:p-8">
          {sent ? (
            <div>
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success">
                <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
              </span>
              <h2 className="mt-5 font-display text-2xl font-semibold text-cocoa-950">
                Catering request received.
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-cocoa-600">
                The restaurant team will review your event details. No account was created.
              </p>
              <Button variant="secondary" className="mt-5" onClick={() => setSent(false)}>
                Send another request
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <h2 className="font-display text-2xl font-semibold text-cocoa-950">
                Tell us about it
              </h2>
              <p className="mt-1 text-sm text-cocoa-600">
                All fields are required unless marked optional.
              </p>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <Field label="Your name" required error={errors.name?.message}>
                  <Input autoComplete="name" {...register('name')} />
                </Field>
                <Field label="Email" required error={errors.email?.message}>
                  <Input type="email" autoComplete="email" {...register('email')} />
                </Field>
                <Field label="Phone" error={errors.phone?.message} hint="Optional">
                  <Input type="tel" autoComplete="tel" {...register('phone')} />
                </Field>
                <Field label="Event type" required error={errors.eventType?.message}>
                  <SelectMenu
                    value={eventTypeField.value}
                    onValueChange={eventTypeField.onChange}
                    onBlur={eventTypeField.onBlur}
                    ref={eventTypeField.ref}
                    name={eventTypeField.name}
                    options={EVENT_TYPES}
                    placeholder="Select event type"
                    invalid={Boolean(errors.eventType)}
                  />
                </Field>
                <Field label="Event date" error={errors.eventDate?.message} hint="Optional">
                  <DatePicker
                    value={eventDateField.value}
                    onChange={eventDateField.onChange}
                    onBlur={eventDateField.onBlur}
                    ref={eventDateField.ref}
                    name={eventDateField.name}
                    min={minDate}
                    placeholder="Pick a date (optional)"
                    invalid={Boolean(errors.eventDate)}
                  />
                </Field>
                <Field label="Expected guests" required error={errors.guestCount?.message}>
                  <Input type="number" min="1" max="1000" {...register('guestCount')} />
                </Field>
                <Field
                  label="Location"
                  error={errors.location?.message}
                  hint="Optional"
                  className="sm:col-span-2"
                >
                  <Input {...register('location')} />
                </Field>
                <Field
                  label="What do you need?"
                  required
                  error={errors.message?.message}
                  className="sm:col-span-2"
                >
                  <textarea rows={6} className={inputClasses} {...register('message')} />
                </Field>
              </div>

              {submitError ? (
                <p
                  role="alert"
                  className="mt-4 rounded-lg bg-danger/5 p-3 text-sm font-medium text-danger"
                >
                  {submitError}
                </p>
              ) : null}

              <Button
                type="submit"
                variant="order"
                size="lg"
                className="mt-6"
                loading={isSubmitting}
              >
                Send catering request
              </Button>
            </form>
          )}
        </div>
      </section>
    </>
  );
}

export default CateringPage;
