import { useEffect, useState } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Checkbox from '../../components/ui/Checkbox.jsx';
import Field from '../../components/ui/Field.jsx';
import Input from '../../components/ui/Input.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { getApiErrorMessage } from '../../lib/api.js';
import { can, PERMISSIONS } from '../../lib/permissions.js';
import { getAdminSettings, updateAdminSettings } from '../../services/adminApi.js';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const PAYMENT_METHODS = [
  { value: 'pay_at_restaurant', label: 'Pay at the restaurant', online: false },
  { value: 'cash_on_delivery', label: 'Cash on delivery', online: false },
  { value: 'mobile_money', label: 'Mobile money', online: true },
  { value: 'bank_card', label: 'Bank card', online: true },
];

function emptyZone() {
  return {
    name: '',
    areasText: '',
    fee: '0',
    minOrder: '0',
    etaMinutes: '',
    isActive: false,
    isVerified: false,
  };
}

function normalizeHours(hours) {
  return DAYS.map((day, index) => {
    const existing = hours.find((entry) => entry.day === index);
    return {
      day: index,
      label: day,
      isClosed: existing?.isClosed ?? true,
      open: existing?.open ?? '09:00',
      close: existing?.close ?? '22:00',
    };
  });
}

function normalizeDraft(settings) {
  return {
    contact: {
      phone: settings.contact?.phone ?? '',
      email: settings.contact?.email ?? '',
      address: settings.contact?.address ?? '',
      whatsapp: settings.contact?.whatsapp ?? '',
    },
    hours: normalizeHours(settings.hours ?? []),
    fulfillment: {
      pickupEnabled: settings.fulfillment?.pickupEnabled ?? true,
      deliveryEnabled: settings.fulfillment?.deliveryEnabled ?? false,
      orderingPaused: settings.fulfillment?.orderingPaused ?? false,
      pickupEtaMinutes:
        settings.fulfillment?.pickupEtaMinutes === null
          ? ''
          : String(settings.fulfillment?.pickupEtaMinutes ?? ''),
      minOrder: String(settings.fulfillment?.minOrder ?? 0),
      deliveryZones: (settings.fulfillment?.deliveryZones ?? []).map((zone) => ({
        name: zone.name,
        areasText: (zone.areas ?? []).join(', '),
        fee: String(zone.fee ?? 0),
        minOrder: String(zone.minOrder ?? 0),
        etaMinutes: zone.etaMinutes === null ? '' : String(zone.etaMinutes ?? ''),
        isActive: Boolean(zone.isActive),
        isVerified: Boolean(zone.isVerified),
      })),
    },
    reservations: {
      enabled: settings.reservations?.enabled ?? true,
      maxPartySize: String(settings.reservations?.maxPartySize ?? 20),
      maxDaysAhead: String(settings.reservations?.maxDaysAhead ?? 90),
      policyText: settings.reservations?.policyText ?? '',
    },
    payments: {
      currency: settings.payments?.currency ?? 'RWF',
      acceptedMethods: settings.payments?.acceptedMethods ?? [],
      enabledMethods: settings.payments?.enabledMethods ?? [],
      onlineEnabled: settings.payments?.onlineEnabled ?? false,
    },
    verification: {
      contactApproved: settings.verification?.contactApproved ?? false,
      hoursApproved: settings.verification?.hoursApproved ?? false,
      deliveryApproved: settings.verification?.deliveryApproved ?? false,
      paymentsApproved: settings.verification?.paymentsApproved ?? false,
    },
  };
}

export function AdminSettings() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [draft, setDraft] = useState(null);
  const [onlineReady, setOnlineReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const canUpdate = can(user, PERMISSIONS.SETTINGS_UPDATE);
  const canSensitive = can(user, PERMISSIONS.SETTINGS_SENSITIVE_UPDATE);
  const canApprove = can(user, PERMISSIONS.SETTINGS_VERIFICATION_APPROVE);

  useEffect(() => {
    let active = true;
    getAdminSettings()
      .then((result) => {
        if (!active) return;
        setDraft(normalizeDraft(result.settings));
        setOnlineReady(Boolean(result.publicSettings?.payments?.onlineEnabled));
      })
      .catch((loadError) => {
        if (active) setError(getApiErrorMessage(loadError, 'Settings could not be loaded.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  function patchSection(section, patch) {
    setDraft((current) => ({
      ...current,
      [section]: { ...current[section], ...patch },
    }));
  }

  function patchHour(index, patch) {
    setDraft((current) => ({
      ...current,
      hours: current.hours.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, ...patch } : entry,
      ),
    }));
  }

  function patchZone(index, patch) {
    setDraft((current) => ({
      ...current,
      fulfillment: {
        ...current.fulfillment,
        deliveryZones: current.fulfillment.deliveryZones.map((zone, zoneIndex) =>
          zoneIndex === index ? { ...zone, ...patch } : zone,
        ),
      },
    }));
  }

  function addZone() {
    setDraft((current) => ({
      ...current,
      fulfillment: {
        ...current.fulfillment,
        deliveryZones: [...current.fulfillment.deliveryZones, emptyZone()],
      },
    }));
  }

  function removeZone(index) {
    setDraft((current) => ({
      ...current,
      fulfillment: {
        ...current.fulfillment,
        deliveryZones: current.fulfillment.deliveryZones.filter(
          (_zone, zoneIndex) => zoneIndex !== index,
        ),
      },
    }));
  }

  function toggleMethod(field, method) {
    const current = draft.payments[field];
    const next = current.includes(method)
      ? current.filter((entry) => entry !== method)
      : [...current, method];
    patchSection('payments', { [field]: next });
  }

  async function save() {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const payload = {
        contact: draft.contact,
        hours: draft.hours.map(({ day, isClosed, open, close }) => ({
          day,
          isClosed,
          open: open || '00:00',
          close: close || '00:00',
        })),
        fulfillment: {
          pickupEnabled: draft.fulfillment.pickupEnabled,
          orderingPaused: draft.fulfillment.orderingPaused,
          pickupEtaMinutes:
            draft.fulfillment.pickupEtaMinutes === ''
              ? null
              : Number(draft.fulfillment.pickupEtaMinutes),
          minOrder: Number(draft.fulfillment.minOrder || 0),
          deliveryZones: draft.fulfillment.deliveryZones.map((zone) => ({
            name: zone.name,
            areas: zone.areasText
              .split(',')
              .map((area) => area.trim())
              .filter(Boolean),
            fee: Number(zone.fee || 0),
            minOrder: Number(zone.minOrder || 0),
            etaMinutes: zone.etaMinutes === '' ? null : Number(zone.etaMinutes),
            isActive: zone.isActive,
            ...(canSensitive ? { isVerified: zone.isVerified } : {}),
          })),
          ...(canSensitive ? { deliveryEnabled: draft.fulfillment.deliveryEnabled } : {}),
        },
        reservations: {
          enabled: draft.reservations.enabled,
          maxPartySize: Number(draft.reservations.maxPartySize || 1),
          maxDaysAhead: Number(draft.reservations.maxDaysAhead || 1),
          policyText: draft.reservations.policyText,
        },
        payments: {
          currency: draft.payments.currency,
          acceptedMethods: draft.payments.acceptedMethods,
          ...(canSensitive
            ? {
                enabledMethods: draft.payments.enabledMethods,
                onlineEnabled: draft.payments.onlineEnabled,
              }
            : {}),
        },
        ...(canApprove ? { verification: draft.verification } : {}),
      };
      const result = await updateAdminSettings(payload);
      setDraft(normalizeDraft(result.settings));
      setOnlineReady(Boolean(result.publicSettings?.payments?.onlineEnabled));
      setMessage('Settings saved.');
      addToast({ title: 'Settings saved', variant: 'success' });
    } catch (saveError) {
      setError(getApiErrorMessage(saveError, 'Settings could not be saved.'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40" />
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!draft) {
    return (
      <p role="alert" className="rounded-lg bg-danger/5 p-3 text-sm text-danger">
        {error || 'Settings could not be loaded.'}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-semibold text-cocoa-950">Business settings</h2>
          <p className="mt-1 max-w-2xl text-sm text-cocoa-600">
            Only approved information is shown on the public site. Delivery and online payments stay
            unavailable until verified and configured.
          </p>
        </div>
        {canUpdate ? (
          <Button onClick={save} loading={saving}>
            <Save className="h-4 w-4" aria-hidden="true" />
            Save settings
          </Button>
        ) : (
          <Badge variant="neutral">Read-only</Badge>
        )}
      </div>

      {error ? (
        <p role="alert" className="rounded-lg bg-danger/5 p-3 text-sm text-danger">
          {error}
        </p>
      ) : null}
      {message ? (
        <p role="status" className="rounded-lg bg-success/10 p-3 text-sm font-medium text-success">
          {message}
        </p>
      ) : null}

      <section className="rounded-2xl border border-cocoa-900/10 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-xl font-semibold text-cocoa-950">Contact details</h3>
            <p className="mt-1 text-sm text-cocoa-600">
              Public contact details remain hidden until marked approved.
            </p>
          </div>
          <Checkbox
            id="contact-approved"
            label="Approved for public site"
            checked={draft.verification.contactApproved}
            disabled={!canApprove}
            onChange={(event) =>
              patchSection('verification', { contactApproved: event.target.checked })
            }
          />
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Phone">
            <Input
              value={draft.contact.phone}
              onChange={(event) => patchSection('contact', { phone: event.target.value })}
            />
          </Field>
          <Field label="WhatsApp">
            <Input
              value={draft.contact.whatsapp}
              onChange={(event) => patchSection('contact', { whatsapp: event.target.value })}
            />
          </Field>
          <Field label="Email">
            <Input
              type="email"
              value={draft.contact.email}
              onChange={(event) => patchSection('contact', { email: event.target.value })}
            />
          </Field>
          <Field label="Address">
            <Input
              value={draft.contact.address}
              onChange={(event) => patchSection('contact', { address: event.target.value })}
            />
          </Field>
        </div>
      </section>

      <section className="rounded-2xl border border-cocoa-900/10 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-xl font-semibold text-cocoa-950">Opening hours</h3>
            <p className="mt-1 text-sm text-cocoa-600">
              Hours appear publicly only after approval.
            </p>
          </div>
          <Checkbox
            id="hours-approved"
            label="Approved for public site"
            checked={draft.verification.hoursApproved}
            disabled={!canApprove}
            onChange={(event) =>
              patchSection('verification', { hoursApproved: event.target.checked })
            }
          />
        </div>
        <div className="mt-5 space-y-2">
          {draft.hours.map((hour, index) => (
            <div
              key={hour.day}
              className="grid items-center gap-2 rounded-lg bg-cream-50 p-3 sm:grid-cols-[8rem_auto_1fr_1fr]"
            >
              <p className="text-sm font-medium text-cocoa-800">{hour.label}</p>
              <Checkbox
                id={`closed-${hour.day}`}
                label="Closed"
                checked={hour.isClosed}
                onChange={(event) => patchHour(index, { isClosed: event.target.checked })}
              />
              <Input
                type="time"
                aria-label={`${hour.label} opening time`}
                value={hour.open}
                disabled={hour.isClosed}
                onChange={(event) => patchHour(index, { open: event.target.value })}
              />
              <Input
                type="time"
                aria-label={`${hour.label} closing time`}
                value={hour.close}
                disabled={hour.isClosed}
                onChange={(event) => patchHour(index, { close: event.target.value })}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-cocoa-900/10 bg-white p-6">
        <h3 className="font-display text-xl font-semibold text-cocoa-950">Fulfilment</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Checkbox
            id="pickup-enabled"
            label="Pickup enabled"
            checked={draft.fulfillment.pickupEnabled}
            onChange={(event) =>
              patchSection('fulfillment', { pickupEnabled: event.target.checked })
            }
          />
          <Checkbox
            id="ordering-paused"
            label="Pause new orders"
            description="Temporarily stop all new orders."
            checked={draft.fulfillment.orderingPaused}
            onChange={(event) =>
              patchSection('fulfillment', { orderingPaused: event.target.checked })
            }
          />
          <Checkbox
            id="delivery-enabled"
            label="Delivery enabled"
            description={
              canSensitive
                ? 'Requires approved delivery zones.'
                : 'Only administrators can change sensitive delivery settings.'
            }
            checked={draft.fulfillment.deliveryEnabled}
            disabled={!canSensitive}
            onChange={(event) =>
              patchSection('fulfillment', { deliveryEnabled: event.target.checked })
            }
          />
          <Checkbox
            id="delivery-approved"
            label="Delivery zones approved"
            checked={draft.verification.deliveryApproved}
            disabled={!canApprove}
            onChange={(event) =>
              patchSection('verification', { deliveryApproved: event.target.checked })
            }
          />
          <Field label="Pickup estimate (minutes)">
            <Input
              type="number"
              min="0"
              max="240"
              value={draft.fulfillment.pickupEtaMinutes}
              onChange={(event) =>
                patchSection('fulfillment', { pickupEtaMinutes: event.target.value })
              }
            />
          </Field>
          <Field label="Minimum order (RWF)">
            <Input
              type="number"
              min="0"
              value={draft.fulfillment.minOrder}
              onChange={(event) => patchSection('fulfillment', { minOrder: event.target.value })}
            />
          </Field>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="font-semibold text-cocoa-950">Delivery zones</h4>
            <p className="text-xs text-cocoa-500">
              A zone must be active and verified before it is offered publicly.
            </p>
          </div>
          <Button size="sm" variant="secondary" onClick={addZone}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add zone
          </Button>
        </div>

        {draft.fulfillment.deliveryZones.length === 0 ? (
          <p className="mt-3 rounded-lg bg-cream-50 p-3 text-sm text-cocoa-500">
            No delivery zones have been added.
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            {draft.fulfillment.deliveryZones.map((zone, index) => (
              <div key={index} className="rounded-xl border border-cocoa-900/10 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Zone name">
                    <Input
                      value={zone.name}
                      onChange={(event) => patchZone(index, { name: event.target.value })}
                    />
                  </Field>
                  <Field label="Areas" hint="Comma-separated area names.">
                    <Input
                      value={zone.areasText}
                      onChange={(event) => patchZone(index, { areasText: event.target.value })}
                    />
                  </Field>
                  <Field label="Fee (RWF)">
                    <Input
                      type="number"
                      min="0"
                      value={zone.fee}
                      onChange={(event) => patchZone(index, { fee: event.target.value })}
                    />
                  </Field>
                  <Field label="Minimum order (RWF)">
                    <Input
                      type="number"
                      min="0"
                      value={zone.minOrder}
                      onChange={(event) => patchZone(index, { minOrder: event.target.value })}
                    />
                  </Field>
                  <Field label="ETA (minutes)">
                    <Input
                      type="number"
                      min="0"
                      max="240"
                      value={zone.etaMinutes}
                      onChange={(event) => patchZone(index, { etaMinutes: event.target.value })}
                    />
                  </Field>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-4">
                    <Checkbox
                      id={`zone-active-${index}`}
                      label="Active"
                      checked={zone.isActive}
                      onChange={(event) => patchZone(index, { isActive: event.target.checked })}
                    />
                    <Checkbox
                      id={`zone-verified-${index}`}
                      label="Verified"
                      checked={zone.isVerified}
                      disabled={!canSensitive}
                      onChange={(event) => patchZone(index, { isVerified: event.target.checked })}
                    />
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => removeZone(index)}>
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-cocoa-900/10 bg-white p-6">
        <h3 className="font-display text-xl font-semibold text-cocoa-950">Reservations</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="flex items-end">
            <Checkbox
              id="reservations-enabled"
              label="Accept table requests"
              checked={draft.reservations.enabled}
              onChange={(event) => patchSection('reservations', { enabled: event.target.checked })}
            />
          </div>
          <Field label="Maximum party size">
            <Input
              type="number"
              min="1"
              max="100"
              value={draft.reservations.maxPartySize}
              onChange={(event) =>
                patchSection('reservations', { maxPartySize: event.target.value })
              }
            />
          </Field>
          <Field label="Maximum days ahead">
            <Input
              type="number"
              min="1"
              max="365"
              value={draft.reservations.maxDaysAhead}
              onChange={(event) =>
                patchSection('reservations', { maxDaysAhead: event.target.value })
              }
            />
          </Field>
        </div>
        <div className="mt-4">
          <Field label="Reservation policy">
            <textarea
              rows={3}
              value={draft.reservations.policyText}
              onChange={(event) => patchSection('reservations', { policyText: event.target.value })}
              className="w-full rounded-lg border border-cocoa-900/15 bg-white px-3 py-2 text-sm text-cocoa-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember-400"
            />
          </Field>
        </div>
        <p className="mt-3 text-xs text-cocoa-500">
          Requests always stay pending until staff approve them. Automatic confirmation is disabled.
        </p>
      </section>

      <section className="rounded-2xl border border-cocoa-900/10 bg-white p-6">
        <h3 className="font-display text-xl font-semibold text-cocoa-950">Payments</h3>
        <p className="mt-1 text-sm text-cocoa-600">
          Offline methods can be enabled now. Online methods require a configured provider and
          payment approval.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Currency">
            <Input
              value={draft.payments.currency}
              maxLength={3}
              onChange={(event) =>
                patchSection('payments', { currency: event.target.value.toUpperCase() })
              }
            />
          </Field>
          <div className="flex items-end">
            <Checkbox
              id="payments-approved"
              label="Payment setup approved"
              checked={draft.verification.paymentsApproved}
              disabled={!canApprove}
              onChange={(event) =>
                patchSection('verification', { paymentsApproved: event.target.checked })
              }
            />
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-cocoa-800">Accepted methods</p>
            <div className="mt-2 space-y-2">
              {PAYMENT_METHODS.map((method) => (
                <Checkbox
                  key={method.value}
                  id={`accepted-${method.value}`}
                  label={method.label}
                  checked={draft.payments.acceptedMethods.includes(method.value)}
                  onChange={() => toggleMethod('acceptedMethods', method.value)}
                />
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-cocoa-800">Enabled at checkout</p>
            <div className="mt-2 space-y-2">
              {PAYMENT_METHODS.map((method) => {
                const blocked = method.online && !onlineReady;
                return (
                  <Checkbox
                    key={method.value}
                    id={`enabled-${method.value}`}
                    label={method.label}
                    description={
                      blocked
                        ? 'Unavailable until the online provider is configured.'
                        : method.online && !canSensitive
                          ? 'Only administrators can enable online methods.'
                          : undefined
                    }
                    disabled={blocked || !canSensitive}
                    checked={draft.payments.enabledMethods.includes(method.value)}
                    onChange={() => toggleMethod('enabledMethods', method.value)}
                  />
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-end">
          <Checkbox
            id="online-enabled"
            label="Online payments enabled"
            description={
              onlineReady
                ? 'Provider is configured and ready.'
                : 'Provider is not configured; online methods cannot be enabled.'
            }
            disabled={!onlineReady || !canSensitive}
            checked={draft.payments.onlineEnabled}
            onChange={(event) => patchSection('payments', { onlineEnabled: event.target.checked })}
          />
        </div>
      </section>

      {canUpdate ? (
        <div className="flex justify-end">
          <Button onClick={save} loading={saving}>
            <Save className="h-4 w-4" aria-hidden="true" />
            Save settings
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export default AdminSettings;
