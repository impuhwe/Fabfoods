import { useEffect, useMemo, useState } from 'react';
import { Search, Sparkles, UtensilsCrossed, Wine } from 'lucide-react';
import Badge from '../ui/Badge.jsx';
import Button from '../ui/Button.jsx';
import Chip from '../ui/Chip.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import Input from '../ui/Input.jsx';
import Modal from '../ui/Modal.jsx';
import Price from '../ui/Price.jsx';
import Skeleton from '../ui/Skeleton.jsx';
import QuantityStepper from './QuantityStepper.jsx';
import { DEMO_MODE } from '../../lib/demo.js';
import { formatRwf } from '../../lib/format.js';
import { getApiErrorMessage } from '../../lib/api.js';
import {
  buildReservationLine,
  createReservationSelection,
  estimateReservationSelection,
  validateReservationLine,
} from '../../lib/reservationMenu.js';
import { getMenuItem, getMenuItems } from '../../services/publicApi.js';

const KINDS = [
  { value: '', label: 'Everything' },
  { value: 'food', label: 'Food' },
  { value: 'drink', label: 'Drinks' },
  { value: 'dessert', label: 'Desserts' },
];

function OptionGroup({ title, required, hint, children }) {
  return (
    <fieldset className="mt-5">
      <legend className="flex flex-wrap items-baseline gap-2 text-sm font-semibold text-cocoa-900">
        {title}
        {required ? <span className="text-xs font-normal text-ember-700">Required</span> : null}
      </legend>
      {hint ? <p className="mt-0.5 text-xs text-cocoa-500">{hint}</p> : null}
      <div className="mt-3 space-y-2">{children}</div>
    </fieldset>
  );
}

function OptionRow({ type, name, checked, onChange, label, price, note }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-cocoa-900/10 bg-white p-3 transition-colors has-[:checked]:border-ember-500 has-[:checked]:bg-ember-500/5">
      <input
        type={type}
        name={name}
        checked={checked}
        onChange={onChange}
        className="mt-0.5 h-4 w-4 accent-ember-600"
      />
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-3">
          <span className="text-sm font-medium text-cocoa-900">{label}</span>
          {price ? (
            <span className="shrink-0 text-xs font-semibold tabular-nums text-cocoa-600">
              +{formatRwf(price)}
            </span>
          ) : null}
        </span>
        {note ? <span className="mt-0.5 block text-xs text-cocoa-500">{note}</span> : null}
      </span>
    </label>
  );
}

export function ReservationMenuPicker({ selections, onAdd }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [kind, setKind] = useState('');
  const [category, setCategory] = useState('');
  const [activeItem, setActiveItem] = useState(null);
  const [selection, setSelection] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    let active = true;
    getMenuItems({ limit: 60, sort: 'recommended' })
      .then(({ items: menuItems }) => {
        if (active) setItems(menuItems.filter((item) => item.isOrderable));
      })
      .catch((loadError) => {
        if (active) setError(getApiErrorMessage(loadError, 'The menu could not be loaded.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const categories = useMemo(() => {
    const map = new Map();
    for (const item of items) {
      if (item.category?.slug) map.set(item.category.slug, item.category.name);
    }
    return [...map.entries()].map(([slug, name]) => ({ slug, name }));
  }, [items]);

  const visibleItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      if (kind && item.category?.kind !== kind) return false;
      if (category && item.category?.slug !== category) return false;
      if (!query) return true;
      return [item.name, item.description, item.category?.name, ...(item.includedItems ?? [])]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [items, search, kind, category]);

  const groupedVisibleItems = useMemo(() => {
    const groups = new Map();
    for (const item of visibleItems) {
      const key = item.category?.slug ?? 'other';
      const name = item.category?.name ?? 'Kitchen';
      if (!groups.has(key)) groups.set(key, { key, name, items: [] });
      groups.get(key).items.push(item);
    }
    return [...groups.values()];
  }, [visibleItems]);

  async function openItem(item) {
    setFormError('');
    setDetailLoading(true);
    setActiveItem(item);
    try {
      const detail = await getMenuItem(item.slug);
      setSelection(createReservationSelection(detail));
      setActiveItem(detail);
    } catch (loadError) {
      setFormError(getApiErrorMessage(loadError, 'This item could not be loaded.'));
    } finally {
      setDetailLoading(false);
    }
  }

  function addDirect(item) {
    onAdd(buildReservationLine(item, createReservationSelection(item)));
  }

  function addSampleSelection() {
    const simple = visibleItems.filter(
      (item) => !item.hasSizeOptions && !item.hasServingOptions && !item.hasAddonGroups,
    );
    const food = simple.find((item) => item.category?.kind !== 'drink');
    const drink = simple.find((item) => item.category?.kind === 'drink');
    const samples = [food, drink].filter(Boolean);
    for (const item of samples) addDirect(item);
  }

  function closeModal() {
    setActiveItem(null);
    setSelection(null);
    setFormError('');
  }

  function toggleOption(group, key, optionName, checked, single) {
    setFormError('');
    setSelection((current) => {
      const selected = current[key][group.name] ?? [];
      const next =
        single || group.selectionType === 'single'
          ? checked
            ? [optionName]
            : []
          : checked
            ? [...selected, optionName].slice(0, group.maxSelections)
            : selected.filter((name) => name !== optionName);
      return { ...current, [key]: { ...current[key], [group.name]: next } };
    });
  }

  function confirmSelection() {
    const validationError = validateReservationLine(activeItem, selection);
    if (validationError) {
      setFormError(validationError);
      return;
    }
    onAdd(buildReservationLine(activeItem, selection));
    closeModal();
  }

  return (
    <section className="rounded-2xl border border-cocoa-900/10 bg-white p-6 shadow-soft sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-semibold text-cocoa-950">
            Food & drink pre-selection
          </h2>
          <p className="mt-1 text-sm text-cocoa-600">
            Optional. Browse the menu and tell us what you might like — nothing is charged and no
            order is placed.
          </p>
        </div>
        <Badge variant="neutral">Optional</Badge>
      </div>

      {DEMO_MODE ? (
        <Button className="mt-4" size="sm" variant="secondary" onClick={addSampleSelection}>
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          Add sample demo selection
        </Button>
      ) : null}

      <div className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <FieldlessSearch value={search} onChange={setSearch} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {KINDS.map((entry) => (
          <Chip
            key={entry.value}
            pressed={kind === entry.value}
            onClick={() => {
              setKind(entry.value);
              setCategory('');
            }}
          >
            {entry.value === 'food' ? <UtensilsCrossed className="mr-1.5 h-3.5 w-3.5" /> : null}
            {entry.value === 'drink' ? <Wine className="mr-1.5 h-3.5 w-3.5" /> : null}
            {entry.label}
          </Chip>
        ))}
      </div>

      {categories.length ? (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
          <Chip pressed={!category} onClick={() => setCategory('')}>
            All categories
          </Chip>
          {categories.map((entry) => (
            <Chip
              key={entry.slug}
              pressed={category === entry.slug}
              onClick={() => setCategory(entry.slug)}
            >
              {entry.name}
            </Chip>
          ))}
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="mt-4 rounded-lg bg-danger/5 p-3 text-sm text-danger">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      ) : visibleItems.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon={Search}
          title="No matching menu items"
          description="Try a different search or filter. You can still send the reservation with no selections."
        />
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-2 lg:gap-x-10">
          {groupedVisibleItems.map((group) => (
            <section key={group.key}>
              <h3 className="border-b border-cocoa-900/15 pb-1.5 font-display text-lg font-semibold text-cocoa-950">
                {group.name}
              </h3>
              <ul className="divide-y divide-cocoa-900/10">
                {group.items.map((item) => {
                  const hasOptions =
                    item.hasSizeOptions || item.hasServingOptions || item.hasAddonGroups;
                  const alreadyAdded = selections.some((line) => line.slug === item.slug);
                  return (
                    <li
                      key={item.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                          <p className="font-semibold text-cocoa-950">{item.name}</p>
                          <div className="flex items-baseline gap-1.5">
                            {item.hasSizeOptions ? (
                              <span className="text-xs text-cocoa-500">from</span>
                            ) : null}
                            <Price amount={item.price} />
                          </div>
                        </div>
                        {item.description ? (
                          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-cocoa-600">
                            {item.description}
                          </p>
                        ) : null}
                      </div>
                      <Button
                        size="sm"
                        variant={alreadyAdded ? 'secondary' : 'primary'}
                        onClick={() => (hasOptions ? openItem(item) : addDirect(item))}
                      >
                        {alreadyAdded ? 'Add another' : hasOptions ? 'Choose options' : 'Add'}
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}

      <p className="mt-5 text-xs text-cocoa-500">
        Prices shown here are estimates; the restaurant confirms final pricing and availability when
        it reviews your request.
      </p>

      <Modal
        open={Boolean(activeItem)}
        onClose={closeModal}
        size="lg"
        title={activeItem?.name ?? 'Choose options'}
        description={activeItem?.description}
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button onClick={confirmSelection} disabled={detailLoading}>
              Add to reservation
            </Button>
          </>
        }
      >
        {detailLoading || !selection ? (
          <Skeleton className="h-64" />
        ) : (
          <div>
            {activeItem.sizeOptions?.length ? (
              <OptionGroup title="Size" required>
                {activeItem.sizeOptions
                  .filter((option) => option.isAvailable !== false)
                  .map((option) => (
                    <OptionRow
                      key={option.label}
                      type="radio"
                      name="reservation-size"
                      label={option.label}
                      price={option.price}
                      checked={selection.sizeLabel === option.label}
                      onChange={() =>
                        setSelection((current) => ({ ...current, sizeLabel: option.label }))
                      }
                    />
                  ))}
              </OptionGroup>
            ) : null}

            {(activeItem.servingOptions ?? []).map((group) => (
              <OptionGroup
                key={group.name}
                title={group.name}
                required={group.isRequired}
                hint={
                  group.selectionType === 'single'
                    ? 'Choose one.'
                    : `Choose up to ${group.maxSelections}.`
                }
              >
                {(group.options ?? [])
                  .filter((option) => option.isAvailable !== false)
                  .map((option) => (
                    <OptionRow
                      key={option.name}
                      type={group.selectionType === 'single' ? 'radio' : 'checkbox'}
                      name={`reservation-serving-${group.name}`}
                      label={option.name}
                      price={option.priceDelta}
                      note={option.priceDeltaNote}
                      checked={(selection.serving[group.name] ?? []).includes(option.name)}
                      onChange={(event) =>
                        toggleOption(group, 'serving', option.name, event.target.checked, false)
                      }
                    />
                  ))}
              </OptionGroup>
            ))}

            {(activeItem.addonGroups ?? []).map((group) => (
              <OptionGroup
                key={group.name}
                title={group.name}
                required={group.isRequired}
                hint={
                  group.selectionType === 'single'
                    ? 'Choose one.'
                    : `Choose up to ${group.maxSelections}.`
                }
              >
                {(group.options ?? [])
                  .filter((option) => option.isAvailable !== false)
                  .map((option) => (
                    <OptionRow
                      key={option.name}
                      type={group.selectionType === 'single' ? 'radio' : 'checkbox'}
                      name={`reservation-addon-${group.name}`}
                      label={option.name}
                      price={option.price}
                      checked={(selection.addons[group.name] ?? []).includes(option.name)}
                      onChange={(event) =>
                        toggleOption(group, 'addons', option.name, event.target.checked, false)
                      }
                    />
                  ))}
              </OptionGroup>
            ))}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-cocoa-900/10 pt-5">
              <QuantityStepper
                value={selection.quantity}
                onChange={(quantity) => setSelection((current) => ({ ...current, quantity }))}
                label={activeItem.name}
              />
              <div className="text-right">
                <p className="text-xs text-cocoa-500">Estimated item total</p>
                <Price
                  amount={estimateReservationSelection(activeItem, selection) * selection.quantity}
                  className="font-display text-2xl"
                />
              </div>
            </div>

            {formError ? (
              <p role="alert" className="mt-4 rounded-lg bg-danger/5 p-3 text-sm text-danger">
                {formError}
              </p>
            ) : null}
          </div>
        )}
      </Modal>
    </section>
  );
}

function FieldlessSearch({ value, onChange }) {
  return (
    <label className="block">
      <span className="sr-only">Search the menu</span>
      <Input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search dishes, drinks or categories"
      />
    </label>
  );
}

export default ReservationMenuPicker;
