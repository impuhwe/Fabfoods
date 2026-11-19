import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, Clock3, Mail, MapPin, Phone } from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import Field from '../../components/ui/Field.jsx';
import Input, { inputClasses } from '../../components/ui/Input.jsx';
import usePageMeta from '../../hooks/usePageMeta.js';
import { getApiErrorMessage } from '../../lib/api.js';
import { resolveContactDetails } from '../../lib/site.js';
import { contactFormSchema } from '../../lib/validation.js';
import { getPublicSettings, sendContactMessage } from '../../services/publicApi.js';
import { HERO_IMAGE } from '../../lib/imagery.js';

export function ContactPage() {
  const [sent, setSent] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [contact, setContact] = useState(() => resolveContactDetails(null));
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(contactFormSchema),
    defaultValues: { name: '', email: '', phone: '', message: '' },
  });

  useEffect(() => {
    let active = true;
    getPublicSettings()
      .then((settings) => {
        if (active) setContact(resolveContactDetails(settings));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  usePageMeta({
    title: 'Contact',
    description:
      'Contact FAB FOODS in Kigali by phone, email or message. Find our address and opening hours.',
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
              Call, email or send a message to the FAB FOODS team. You can also find us in Kacyiru
              and see our opening hours below.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1240px] gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[0.75fr_1fr] lg:px-12 lg:py-16">
        <aside className="space-y-4">
          <div className="rounded-2xl border border-cocoa-900/10 bg-cream-50 p-5">
            <h2 className="font-display text-xl font-semibold text-cocoa-950">Direct details</h2>
            <p className="mt-2 text-sm leading-relaxed text-cocoa-600">
              Reach the restaurant team directly, or use the form for a saved enquiry.
            </p>
            <ul className="mt-5 space-y-4 text-sm text-cocoa-600">
              <li className="flex gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ember-700" aria-hidden="true" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cocoa-500">
                    Find us
                  </p>
                  <a
                    href={contact.directionsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 block font-medium text-cocoa-900 underline decoration-ember-700/40 underline-offset-4 hover:text-ember-700"
                  >
                    {contact.address}
                  </a>
                </div>
              </li>
              <li className="flex gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-ember-700" aria-hidden="true" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cocoa-500">
                    Call
                  </p>
                  <a
                    href={contact.phoneHref}
                    className="mt-1 block font-medium text-cocoa-900 underline decoration-ember-700/40 underline-offset-4 hover:text-ember-700"
                  >
                    {contact.phone}
                  </a>
                </div>
              </li>
              <li className="flex gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-ember-700" aria-hidden="true" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cocoa-500">
                    Email
                  </p>
                  <a
                    href={contact.emailHref}
                    className="mt-1 block font-medium text-cocoa-900 underline decoration-ember-700/40 underline-offset-4 hover:text-ember-700"
                  >
                    {contact.email}
                  </a>
                </div>
              </li>
              <li className="flex gap-3">
                <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-ember-700" aria-hidden="true" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cocoa-500">
                    Opening hours
                  </p>
                  <ul className="mt-1 space-y-1">
                    {contact.hours.map((entry) => (
                      <li key={entry.label} className="flex justify-between gap-4">
                        <span>{entry.label}</span>
                        <span className="font-medium text-cocoa-900">{entry.value}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-cocoa-900/10 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cocoa-500">
              Before you write
            </p>
            <p className="mt-2 text-sm leading-relaxed text-cocoa-600">
              For a table request, use the reservations page so the restaurant gets the date, time
              and party size in the right format. For a catered event, use the catering request
              form.
            </p>
            <Link
              to="/catering"
              className="mt-3 inline-block text-sm font-semibold text-ember-700 underline"
            >
              Send a catering request
            </Link>
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

              <Button
                type="submit"
                variant="order"
                size="lg"
                className="mt-6"
                loading={isSubmitting}
              >
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
