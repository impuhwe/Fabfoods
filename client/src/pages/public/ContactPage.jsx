import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, Mail, MapPin, MessageCircle } from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import Field from '../../components/ui/Field.jsx';
import Input, { inputClasses } from '../../components/ui/Input.jsx';
import usePageMeta from '../../hooks/usePageMeta.js';
import { getApiErrorMessage } from '../../lib/api.js';
import { contactFormSchema } from '../../lib/validation.js';
import { sendContactMessage } from '../../services/publicApi.js';
import { HERO_IMAGE } from '../../lib/imagery.js';

export function ContactPage() {
  const [sent, setSent] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(contactFormSchema),
    defaultValues: { name: '', email: '', phone: '', message: '' },
  });

  usePageMeta({
    title: 'Contact',
    description:
      'Contact FAB FOODS in Kigali. Send a message to the restaurant team. Direct contact details are being confirmed.',
    image: HERO_IMAGE,
  });

  async function onSubmit(values) {
    setSubmitError('');
    try {
      await sendContactMessage(values);
      setSent(true);
      reset();
    } catch (error) {
      setSubmitError(
        getApiErrorMessage(error, 'Your message could not be sent. Please try again.'),
      );
    }
  }

  return (
    <>
      <section className="border-b border-cocoa-900/10 bg-cream-50">
        <div className="mx-auto max-w-[1240px] px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
          <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-ember-700">
            Contact
          </p>
          <div className="mt-4 max-w-2xl">
            <h1 className="font-display text-display-lg font-semibold text-cocoa-950">
              Tell us what you need.
            </h1>
            <p className="mt-3 text-base leading-relaxed text-cocoa-600">
              Send a message to the FAB FOODS team. Direct phone, email, address and opening hours
              are still being confirmed, so they are not published here yet.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1240px] gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[0.75fr_1fr] lg:px-12 lg:py-16">
        <aside className="space-y-4">
          <div className="rounded-2xl border border-cocoa-900/10 bg-cream-50 p-5">
            <h2 className="font-display text-xl font-semibold text-cocoa-950">Direct details</h2>
            <p className="mt-2 text-sm leading-relaxed text-cocoa-600">
              These details are being confirmed with the owner. To avoid publishing wrong
              information, the site does not show a phone number, email address, street address or
              opening hours yet.
            </p>
            <ul className="mt-5 space-y-4 text-sm text-cocoa-600">
              <li className="flex gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ember-700" aria-hidden="true" />
                <span>Kigali, Rwanda</span>
              </li>
              <li className="flex gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-ember-700" aria-hidden="true" />
                <span>Email and phone: pending confirmation</span>
              </li>
              <li className="flex gap-3">
                <MessageCircle
                  className="mt-0.5 h-4 w-4 shrink-0 text-ember-700"
                  aria-hidden="true"
                />
                <span>WhatsApp: pending confirmation</span>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-cocoa-900/10 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cocoa-500">
              Before you write
            </p>
            <p className="mt-2 text-sm leading-relaxed text-cocoa-600">
              For a table request, use the reservations page so the restaurant gets the date, time
              and party size in the right format.
            </p>
          </div>
        </aside>

        <div className="rounded-2xl border border-cocoa-900/10 bg-white p-6 shadow-soft sm:p-8">
          {sent ? (
            <div>
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success">
                <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
              </span>
              <h2 className="mt-5 font-display text-2xl font-semibold text-cocoa-950">
                Message received.
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-cocoa-600">
                Your message has been saved for the restaurant team. Email delivery is not connected
                yet, so this is not an instant reply channel.
              </p>
              <Button variant="secondary" className="mt-5" onClick={() => setSent(false)}>
                Send another message
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <h2 className="font-display text-2xl font-semibold text-cocoa-950">Send a message</h2>
              <p className="mt-1 text-sm text-cocoa-600">
                The restaurant team will review this. Do not include payment details.
              </p>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <Field label="Your name" required error={errors.name?.message}>
                  <Input autoComplete="name" {...register('name')} />
                </Field>
                <Field label="Email" required error={errors.email?.message}>
                  <Input type="email" autoComplete="email" {...register('email')} />
                </Field>
                <Field
                  label="Phone"
                  error={errors.phone?.message}
                  hint="Optional"
                  className="sm:col-span-2"
                >
                  <Input type="tel" autoComplete="tel" {...register('phone')} />
                </Field>
                <Field
                  label="Message"
                  required
                  error={errors.message?.message}
                  hint="Reservations, dietary questions, events or feedback."
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

              <Button type="submit" size="lg" className="mt-6" loading={isSubmitting}>
                Send message
              </Button>
            </form>
          )}
        </div>
      </section>
    </>
  );
}

export default ContactPage;
