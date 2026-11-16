import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Bike, CreditCard, Loader2, ShoppingBag, Store } from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import Field from '../../components/ui/Field.jsx';
import Input, { inputClasses } from '../../components/ui/Input.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import usePageMeta from '../../hooks/usePageMeta.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useCart } from '../../contexts/CartContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { formatRwf } from '../../lib/format.js';
import { getApiErrorMessage } from '../../lib/api.js';
import { checkoutFormSchema } from '../../lib/validation.js';
import { createOrder, quoteOrder } from '../../services/publicApi.js';

const PAYMENT_LABELS = {
  mobile_money: {
    label: 'Mobile money',
    description: 'Pay with MTN Mobile Money or Airtel Money through the payment provider.',
  },
  bank_card: {
    label: 'Bank card',
    description: 'Pay securely with a Visa or Mastercard through the payment provider.',
  },
  pay_at_restaurant: {
    label: 'Pay at the restaurant',
    description: 'Place the order now and pay when you collect it.',
  },
  cash_on_delivery: {
    label: 'Cash on delivery',
    description: 'Pay the rider when your delivery arrives.',
  },
};

function newIdempotencyKey() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `checkout-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function CheckoutPage() {
  const { user } = useAuth();
  const { items, subtotal, clearCart } = useCart();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [quote, setQuote] = useState(null);
  const [quoteError, setQuoteError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [loadingQuote, setLoadingQuote] = useState(false);
  const idempotencyKey = useRef(newIdempotencyKey());
  const {
    register,
    watch,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      name: user?.name ?? '',
      email: user?.email ?? '',
      phone: user?.phone ?? '',
      fulfillmentType: 'pickup',
      paymentMethod: '',
      notes: '',
      deliveryLine1: '',
      deliveryLine2: '',
      deliveryCity: 'Kigali',
      deliveryDistrict: '',
      deliverySector: '',
      deliveryNotes: '',
    },
  });
  const fulfillmentType = watch('fulfillmentType');
  const paymentMethod = watch('paymentMethod');
  const deliveryLine1 = watch('deliveryLine1');
  const deliveryLine2 = watch('deliveryLine2');
  const deliveryCity = watch('deliveryCity');
  const deliveryDistrict = watch('deliveryDistrict');
  const deliverySector = watch('deliverySector');

  usePageMeta({
    title: 'Checkout',
    description: 'Review and place your FAB FOODS order.',
  });

  const payload = useMemo(
    () =>
      items.map((line) => ({
        slug: line.slug,
        quantity: line.quantity,
        sizeLabel: line.sizeLabel || undefined,
        servingSelections: line.servingSelections,
        addonSelections: line.addonSelections,
      })),
    [items],
  );

  const deliveryAddress = useMemo(
    () => ({
      line1: deliveryLine1 ?? '',
      line2: deliveryLine2 ?? '',
      city: deliveryCity ?? '',
      district: deliveryDistrict ?? '',
      sector: deliverySector ?? '',
    }),
    [deliveryLine1, deliveryLine2, deliveryCity, deliveryDistrict, deliverySector],
  );

  useEffect(() => {
    if (items.length === 0) return undefined;
    let active = true;
    setLoadingQuote(true);
    setQuoteError('');

    quoteOrder({
      items: payload,
      fulfillmentType,
      deliveryAddress: fulfillmentType === 'delivery' ? deliveryAddress : undefined,
    })
      .then((data) => {
        if (active) setQuote(data);
      })
      .catch((error) => {
        if (active) {
          setQuote(null);
          setQuoteError(
            getApiErrorMessage(
              error,
              'The order could not be priced. Remove any item that is awaiting confirmation.',
            ),
          );
        }
      })
      .finally(() => {
        if (active) setLoadingQuote(false);
      });

    return () => {
      active = false;
    };
  }, [payload, fulfillmentType, deliveryAddress, items.length]);

  const enabledMethods = useMemo(
    () => quote?.payment.enabledMethods ?? [],
    [quote?.payment.enabledMethods],
  );

  useEffect(() => {
    if (enabledMethods.length === 0) return;
    if (!enabledMethods.includes(paymentMethod)) {
      setValue('paymentMethod', enabledMethods[0], { shouldValidate: true });
    }
  }, [enabledMethods, paymentMethod, setValue]);

  async function onSubmit(values) {
    setSubmitError('');
    if (!quote) {
      setSubmitError('Wait for the order summary to finish pricing.');
      return;
    }
    if (!quote.fulfillment.available) {
      setSubmitError(quote.fulfillment.message ?? 'That fulfilment option is not available.');
      return;
    }
    if (!enabledMethods.includes(values.paymentMethod)) {
      setSubmitError('Choose an available payment method.');
      return;
    }

    try {
      const result = await createOrder(
        {
          items: payload,
          fulfillmentType: values.fulfillmentType,
          deliveryAddress:
            values.fulfillmentType === 'delivery'
              ? {
                  line1: values.deliveryLine1,
                  line2: values.deliveryLine2,
                  city: values.deliveryCity,
                  district: values.deliveryDistrict,
                  sector: values.deliverySector,
                  notes: values.deliveryNotes,
                }
              : undefined,
          customer: { name: values.name, email: values.email, phone: values.phone },
          notes: values.notes,
          paymentMethod: values.paymentMethod,
        },
        idempotencyKey.current,
      );

      clearCart();
      sessionStorage.setItem(`ff_order_email_${result.order.orderNumber}`, values.email);
      sessionStorage.setItem(`ff_order_${result.order.orderNumber}`, JSON.stringify(result.order));

      if (result.paymentAction?.checkoutUrl) {
        window.location.assign(result.paymentAction.checkoutUrl);
        return;
      }

      addToast({ title: 'Order placed', variant: 'success' });
      navigate(`/order/${result.order.orderNumber}`, {
        state: { order: result.order, email: values.email },
      });
    } catch (error) {
      idempotencyKey.current = newIdempotencyKey();
      setSubmitError(getApiErrorMessage(error, 'The order could not be placed.'));
    }
  }

  if (items.length === 0) {
    return (
      <section className="mx-auto max-w-3xl px-5 py-20 sm:px-8">
        <EmptyState
          icon={ShoppingBag}
          title="Nothing to check out"
          description="Add something from the menu first."
          action={
            <Button asChild>
              <Link to="/menu">Explore the menu</Link>
            </Button>
          }
        />
      </section>
    );
  }

  const selectedPayment = PAYMENT_LABELS[paymentMethod];
  const canSubmit =
    Boolean(quote) &&
    quote.fulfillment.available &&
    enabledMethods.length > 0 &&
    !loadingQuote &&
    !isSubmitting;

  return (
    <section className="mx-auto max-w-[1180px] px-5 py-12 sm:px-8 lg:py-16">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-ember-700">
          Checkout
        </p>
        <h1 className="mt-3 font-display text-display-lg font-semibold text-cocoa-950">
          Finish your order.
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-cocoa-600">
          The restaurant re-prices every line on the server before you place the order. Online
          payments are confirmed by the payment provider, never by this browser.
        </p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <form className="space-y-6" onSubmit={onSubmit} noValidate>
          <div className="rounded-2xl border border-cocoa-900/10 bg-white p-6">
            <h2 className="font-display text-xl font-semibold text-cocoa-950">Your details</h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <Field label="Full name" required error={errors.name?.message}>
                <Input autoComplete="name" {...register('name')} />
              </Field>
              <Field label="Email" required error={errors.email?.message}>
                <Input type="email" autoComplete="email" {...register('email')} />
              </Field>
              <Field label="Phone" required error={errors.phone?.message} className="sm:col-span-2">
                <Input type="tel" autoComplete="tel" {...register('phone')} />
              </Field>
            </div>
          </div>

          <fieldset className="rounded-2xl border border-cocoa-900/10 bg-white p-6">
            <legend className="px-1 font-display text-xl font-semibold text-cocoa-950">
              How would you like it?
            </legend>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-cocoa-900/10 p-4 has-[:checked]:border-ember-500 has-[:checked]:bg-ember-500/5">
                <input
                  type="radio"
                  value="pickup"
                  {...register('fulfillmentType')}
                  className="mt-1 h-4 w-4 accent-ember-600"
                />
                <span>
                  <span className="flex items-center gap-2 text-sm font-semibold text-cocoa-900">
                    <Store className="h-4 w-4" aria-hidden="true" />
                    Pickup
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-cocoa-600">
                    Collect from the restaurant. Timing is confirmed by the team.
                  </span>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-cocoa-900/10 p-4 has-[:checked]:border-ember-500 has-[:checked]:bg-ember-500/5">
                <input
                  type="radio"
                  value="delivery"
                  {...register('fulfillmentType')}
                  className="mt-1 h-4 w-4 accent-ember-600"
                />
                <span>
                  <span className="flex items-center gap-2 text-sm font-semibold text-cocoa-900">
                    <Bike className="h-4 w-4" aria-hidden="true" />
                    Delivery
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-cocoa-600">
                    Available only in approved delivery zones. The fee is calculated by the server.
                  </span>
                </span>
              </label>
            </div>

            {fulfillmentType === 'delivery' ? (
              <div className="mt-5 grid gap-5 border-t border-cocoa-900/10 pt-5 sm:grid-cols-2">
                <Field
                  label="Address line"
                  required
                  error={errors.deliveryLine1?.message}
                  className="sm:col-span-2"
                >
                  <Input autoComplete="address-line1" {...register('deliveryLine1')} />
                </Field>
                <Field label="Apartment, floor or landmark" error={errors.deliveryLine2?.message}>
                  <Input autoComplete="address-line2" {...register('deliveryLine2')} />
                </Field>
                <Field label="Sector" error={errors.deliverySector?.message}>
                  <Input {...register('deliverySector')} />
                </Field>
                <Field label="City" error={errors.deliveryCity?.message}>
                  <Input autoComplete="address-level2" {...register('deliveryCity')} />
                </Field>
                <Field
                  label="District"
                  error={errors.deliveryDistrict?.message}
                  hint="City or district helps the server match a delivery zone."
                >
                  <Input autoComplete="address-level1" {...register('deliveryDistrict')} />
                </Field>
                <Field label="Delivery notes" error={errors.deliveryNotes?.message} className="sm:col-span-2">
                  <Input {...register('deliveryNotes')} />
                </Field>
              </div>
            ) : null}

            <Field
              label="Order notes"
              error={errors.notes?.message}
              hint="Allergies, preferences or anything the kitchen should know."
              className="mt-5"
            >
              <textarea rows={3} className={inputClasses} {...register('notes')} />
            </Field>
          </fieldset>

          <fieldset className="rounded-2xl border border-cocoa-900/10 bg-white p-6">
            <legend className="px-1 font-display text-xl font-semibold text-cocoa-950">
              Payment
            </legend>
            {loadingQuote ? (
              <div className="mt-4 space-y-2">
                <Skeleton className="h-14" />
                <Skeleton className="h-14" />
              </div>
            ) : enabledMethods.length === 0 ? (
              <div className="mt-4 rounded-xl border border-warning/25 bg-warning/5 p-4 text-sm text-cocoa-700">
                <p className="font-semibold text-cocoa-950">Ordering is not open yet.</p>
                <p className="mt-1">
                  {quote?.payment.message ??
                    'The restaurant has not enabled a payment method for online orders.'}
                </p>
              </div>
            ) : (
              <div className="mt-4 grid gap-3">
                {enabledMethods.map((method) => {
                  const copy = PAYMENT_LABELS[method] ?? {
                    label: method,
                    description: 'Pay using this method.',
                  };
                  return (
                    <label
                      key={method}
                      className="flex cursor-pointer items-start gap-3 rounded-xl border border-cocoa-900/10 p-4 has-[:checked]:border-ember-500 has-[:checked]:bg-ember-500/5"
                    >
                      <input
                        type="radio"
                        value={method}
                        {...register('paymentMethod')}
                        className="mt-1 h-4 w-4 accent-ember-600"
                      />
                      <span>
                        <span className="flex items-center gap-2 text-sm font-semibold text-cocoa-900">
                          <CreditCard className="h-4 w-4" aria-hidden="true" />
                          {copy.label}
                        </span>
                        <span className="mt-1 block text-xs leading-relaxed text-cocoa-600">
                          {copy.description}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
            {selectedPayment && quote?.payment.onlineEnabled ? (
              <p className="mt-3 text-xs leading-relaxed text-cocoa-500">
                You will be redirected to the payment provider. The order stays pending until the
                provider confirms payment.
              </p>
            ) : null}
            {errors.paymentMethod?.message ? (
              <p role="alert" className="mt-3 text-xs font-medium text-danger">
                {errors.paymentMethod.message}
              </p>
            ) : null}
            <p className="mt-3 text-xs leading-relaxed text-cocoa-500">
              {quote?.payment.message ?? 'Payment options are loaded with the order summary.'}
            </p>
          </fieldset>

          {submitError ? (
            <p role="alert" className="rounded-xl border border-danger/20 bg-danger/5 p-4 text-sm text-danger">
              {submitError}
            </p>
          ) : null}
        </form>

        <aside className="h-fit rounded-2xl border border-cocoa-900/10 bg-cream-50 p-6 lg:sticky lg:top-24">
          <h2 className="font-display text-xl font-semibold text-cocoa-950">Order summary</h2>

          {loadingQuote ? (
            <div className="mt-4 space-y-3">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          ) : quoteError ? (
            <p className="mt-4 rounded-lg bg-danger/5 p-3 text-sm text-danger">{quoteError}</p>
          ) : quote ? (
            <>
              <ul className="mt-4 space-y-3 border-b border-cocoa-900/10 pb-4">
                {quote.items.map((line) => (
                  <li
                    key={`${line.slug}-${line.selectionSummary.join('-')}`}
                    className="flex justify-between gap-3 text-sm"
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
              <div className="mt-4 flex justify-between text-sm">
                <span className="text-cocoa-600">Subtotal</span>
                <span className="font-semibold tabular-nums">{formatRwf(quote.subtotal)}</span>
              </div>
              <div className="mt-2 flex justify-between text-sm">
                <span className="text-cocoa-600">Fulfilment</span>
                <span className="text-right text-xs text-cocoa-500">{quote.fulfillment.label}</span>
              </div>
              {quote.deliveryFee > 0 ? (
                <div className="mt-2 flex justify-between text-sm">
                  <span className="text-cocoa-600">Delivery fee</span>
                  <span className="font-semibold tabular-nums">{formatRwf(quote.deliveryFee)}</span>
                </div>
              ) : null}
              <div className="mt-4 flex justify-between border-t border-cocoa-900/10 pt-4">
                <span className="font-semibold text-cocoa-950">Total</span>
                <span className="font-display text-2xl font-semibold tabular-nums text-cocoa-950">
                  {formatRwf(quote.total)}
                </span>
              </div>
              {!quote.fulfillment.available ? (
                <p className="mt-3 rounded-lg bg-warning/10 p-3 text-xs leading-relaxed text-cocoa-700">
                  {quote.fulfillment.message}
                </p>
              ) : null}
            </>
          ) : (
            <p className="mt-4 text-sm text-cocoa-600">
              Estimated subtotal: {formatRwf(subtotal)}. Add valid items to see the server quote.
            </p>
          )}

          <Button
            size="lg"
            className="mt-5 w-full"
            onClick={handleSubmit(onSubmit)}
            disabled={!canSubmit}
            loading={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Placing order
              </>
            ) : quote?.payment.onlineEnabled && paymentMethod !== 'pay_at_restaurant' ? (
              'Continue to payment'
            ) : (
              'Place order'
            )}
          </Button>
          <Button asChild variant="ghost" className="mt-2 w-full">
            <Link to="/cart">Back to your order</Link>
          </Button>
          <p className="mt-3 text-center text-xs text-cocoa-500">
            No card details are collected or stored on this site.
          </p>
        </aside>
      </div>
    </section>
  );
}

export default CheckoutPage;
