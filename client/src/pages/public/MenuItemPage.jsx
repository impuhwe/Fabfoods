import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Info, Plus } from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import QuantityStepper from '../../components/public/QuantityStepper.jsx';
import MenuItemCard from '../../components/public/MenuItemCard.jsx';
import usePageMeta from '../../hooks/usePageMeta.js';
import { useCart } from '../../contexts/CartContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { formatRwf } from '../../lib/format.js';
import { menuItemImage } from '../../lib/imagery.js';
import { getMenuItem, getMenuItems } from '../../services/publicApi.js';

function OptionRow({ type, name, checked, onChange, title, note, price }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-cocoa-900/10 bg-white p-3 transition-colors has-[:checked]:border-ember-500 has-[:checked]:bg-ember-500/5">
      <input
        type={type}
        name={name}
        checked={checked}
        onChange={onChange}
        className="mt-0.5 h-4 w-4 accent-ember-600"
      />
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-3">
          <span className="text-sm font-medium text-cocoa-900">{title}</span>
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

export function MenuItemPage() {
  const { slug } = useParams();
  const { addItem } = useCart();
  const { addToast } = useToast();
  const [item, setItem] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [sizeLabel, setSizeLabel] = useState('');
  const [serving, setServing] = useState({});
  const [addons, setAddons] = useState({});
  const [formError, setFormError] = useState('');

  usePageMeta({
    title: item?.name ?? 'Menu item',
    description: item?.description || 'A dish from the FAB FOODS menu in Kigali.',
    image: item ? menuItemImage(item) : undefined,
    type: 'article',
  });

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    setFormError('');
    setQuantity(1);

    getMenuItem(slug)
      .then((data) => {
        if (!active) return;
        setItem(data);
        setSizeLabel(
          data.sizeOptions?.find((option) => option.isDefault && option.isAvailable)?.label ??
            data.sizeOptions?.find((option) => option.isAvailable)?.label ??
            '',
        );

        const nextServing = {};
        for (const group of data.servingOptions ?? []) {
          const defaults = group.options.filter((option) => option.isDefault && option.isAvailable);
          nextServing[group.name] =
            group.isRequired || defaults.length ? defaults.map((option) => option.name) : [];
        }
        setServing(nextServing);

        const nextAddons = {};
        for (const group of data.addonGroups ?? []) {
          const defaults = group.options.filter((option) => option.isDefault && option.isAvailable);
          nextAddons[group.name] = defaults.map((option) => option.name);
        }
        setAddons(nextAddons);

        if (data.category?.slug) {
          getMenuItems({ category: data.category.slug, limit: 4 })
            .then(({ items }) => {
              if (active) setRelated(items.filter((entry) => entry.slug !== data.slug).slice(0, 3));
            })
            .catch(() => undefined);
        }
      })
      .catch(() => {
        if (active) setError('This menu item could not be loaded.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [slug]);

  const price = useMemo(() => {
    if (!item) return 0;
    const size = item.sizeOptions?.find((option) => option.label === sizeLabel);
    let total = size?.price ?? item.price;
    for (const group of item.servingOptions ?? []) {
      for (const optionName of serving[group.name] ?? []) {
        total += group.options.find((option) => option.name === optionName)?.priceDelta ?? 0;
      }
    }
    for (const group of item.addonGroups ?? []) {
      for (const optionName of addons[group.name] ?? []) {
        total += group.options.find((option) => option.name === optionName)?.price ?? 0;
      }
    }
    return total;
  }, [item, sizeLabel, serving, addons]);

  function toggleOption(group, optionName, checked) {
    setFormError('');
    setServing((current) => {
      const selected = current[group.name] ?? [];
      if (group.selectionType === 'single') {
        return { ...current, [group.name]: checked ? [optionName] : [] };
      }
      const next = checked
        ? [...selected, optionName].slice(0, group.maxSelections)
        : selected.filter((name) => name !== optionName);
      return { ...current, [group.name]: next };
    });
  }

  function toggleAddon(group, optionName, checked) {
    setFormError('');
    setAddons((current) => {
      const selected = current[group.name] ?? [];
      if (group.selectionType === 'single') {
        return { ...current, [group.name]: checked ? [optionName] : [] };
      }
      const next = checked
        ? [...selected, optionName].slice(0, group.maxSelections)
        : selected.filter((name) => name !== optionName);
      return { ...current, [group.name]: next };
    });
  }

  function addToOrder() {
    if (!item) return;

    for (const group of item.servingOptions ?? []) {
      if (group.isRequired && !(serving[group.name] ?? []).length) {
        setFormError(`Choose an option for ${group.name}.`);
        return;
      }
    }
    for (const group of item.addonGroups ?? []) {
      if (group.isRequired && !(addons[group.name] ?? []).length) {
        setFormError(`Choose an option for ${group.name}.`);
        return;
      }
    }

    const servingSelections = Object.entries(serving).flatMap(([groupName, options]) =>
      options.map((optionName) => ({ groupName, optionName })),
    );
    const addonSelections = Object.entries(addons).flatMap(([groupName, options]) =>
      options.map((optionName) => ({ groupName, optionName })),
    );
    const selectionSummary = [
      sizeLabel,
      ...servingSelections.map((selection) => selection.optionName),
      ...addonSelections.map((selection) => selection.optionName),
    ].filter(Boolean);

    addItem(
      { ...item, image: menuItemImage(item) },
      {
        quantity,
        sizeLabel: sizeLabel || undefined,
        servingSelections,
        addonSelections,
        unitPrice: price,
        selectionSummary,
      },
    );
    addToast({ title: `${item.name} added`, variant: 'success' });
  }

  if (loading) {
    return (
      <div className="mx-auto grid max-w-[1240px] gap-10 px-5 py-12 sm:px-8 lg:grid-cols-2 lg:px-12">
        <Skeleton className="aspect-square" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-12 w-40" />
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-20">
        <EmptyState
          title="Dish not found"
          description={error || 'This item may have been removed from the menu.'}
          action={
            <Button asChild>
              <Link to="/menu">Back to the menu</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <>
      <section className="mx-auto max-w-[1240px] px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
        <Link
          to="/menu"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-cocoa-600 hover:text-cocoa-950"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to menu
        </Link>

        <div className="mt-6 grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <div>
            <div className="overflow-hidden rounded-2xl bg-cream-200">
              <img
                src={menuItemImage(item)}
                alt={item.name}
                className="aspect-square w-full object-cover"
              />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Badge variant={item.isOrderable ? 'success' : 'neutral'} dot>
                {item.isOrderable ? 'Available' : 'Awaiting owner confirmation'}
              </Badge>
              <span className="text-xs text-cocoa-500">{item.category?.name}</span>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-ember-700">
              {item.category?.name}
            </p>
            <h1 className="mt-3 font-display text-display-lg font-semibold leading-none text-cocoa-950">
              {item.name}
            </h1>
            <p className="mt-4 text-2xl font-semibold tabular-nums text-cocoa-900">
              {formatRwf(price)}
              {item.hasSizeOptions ? (
                <span className="ml-2 text-xs font-medium text-cocoa-500">selected size</span>
              ) : null}
            </p>

            {item.description ? (
              <p className="mt-4 text-base leading-relaxed text-cocoa-600">{item.description}</p>
            ) : null}

            {item.includedItems?.length ? (
              <div className="mt-5 rounded-xl border border-cocoa-900/10 bg-cream-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cocoa-500">
                  Includes
                </p>
                <ul className="mt-2 grid gap-1.5 text-sm text-cocoa-700 sm:grid-cols-2">
                  {item.includedItems.map((included) => (
                    <li key={included} className="flex items-start gap-2">
                      <Check
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success"
                        aria-hidden="true"
                      />
                      {included}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {!item.isOrderable ? (
              <div className="mt-5 flex gap-3 rounded-xl border border-warning/25 bg-warning/5 p-4 text-sm text-cocoa-700">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
                <p>
                  This dish is visible for reference, but online ordering is paused until the owner
                  confirms its name and price.
                </p>
              </div>
            ) : null}

            <div className="mt-6 space-y-6">
              {item.sizeOptions?.length ? (
                <fieldset>
                  <legend className="text-sm font-semibold text-cocoa-900">Choose a size</legend>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {item.sizeOptions
                      .filter((option) => option.isAvailable)
                      .map((option) => (
                        <label
                          key={option.label}
                          className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-cocoa-900/10 bg-white p-3 has-[:checked]:border-ember-500 has-[:checked]:bg-ember-500/5"
                        >
                          <span className="flex items-center gap-2 text-sm font-medium">
                            <input
                              type="radio"
                              name={`size-${item.id}`}
                              checked={sizeLabel === option.label}
                              onChange={() => setSizeLabel(option.label)}
                              className="h-4 w-4 accent-ember-600"
                            />
                            {option.label}
                          </span>
                          <span className="text-sm font-semibold tabular-nums">
                            {formatRwf(option.price)}
                          </span>
                        </label>
                      ))}
                  </div>
                </fieldset>
              ) : null}

              {(item.servingOptions ?? []).map((group) => (
                <fieldset key={group.name}>
                  <legend className="text-sm font-semibold text-cocoa-900">
                    {group.name}
                    {group.isRequired ? <span className="ml-1 text-danger">*</span> : null}
                  </legend>
                  <p className="mt-0.5 text-xs text-cocoa-500">
                    {group.selectionType === 'single'
                      ? 'Choose one'
                      : `Choose up to ${group.maxSelections}`}
                  </p>
                  <div className="mt-2 grid gap-2">
                    {group.options
                      .filter((option) => option.isAvailable)
                      .map((option) => (
                        <OptionRow
                          key={option.name}
                          type={group.selectionType === 'single' ? 'radio' : 'checkbox'}
                          name={`${group.name}-${item.id}`}
                          checked={(serving[group.name] ?? []).includes(option.name)}
                          onChange={(event) =>
                            toggleOption(group, option.name, event.target.checked)
                          }
                          title={option.name}
                          note={option.priceDeltaNote}
                          price={option.priceDelta}
                        />
                      ))}
                  </div>
                </fieldset>
              ))}

              {(item.addonGroups ?? []).map((group) => (
                <fieldset key={group.name}>
                  <legend className="text-sm font-semibold text-cocoa-900">
                    {group.name}
                    {group.isRequired ? <span className="ml-1 text-danger">*</span> : null}
                  </legend>
                  <p className="mt-0.5 text-xs text-cocoa-500">
                    {group.selectionType === 'single'
                      ? 'Choose one'
                      : `Choose up to ${group.maxSelections}`}
                  </p>
                  <div className="mt-2 grid gap-2">
                    {group.options
                      .filter((option) => option.isAvailable)
                      .map((option) => (
                        <OptionRow
                          key={option.name}
                          type={group.selectionType === 'single' ? 'radio' : 'checkbox'}
                          name={`${group.name}-${item.id}`}
                          checked={(addons[group.name] ?? []).includes(option.name)}
                          onChange={(event) =>
                            toggleAddon(group, option.name, event.target.checked)
                          }
                          title={option.name}
                          price={option.price}
                        />
                      ))}
                  </div>
                </fieldset>
              ))}
            </div>

            {formError ? (
              <p role="alert" className="mt-4 text-sm font-medium text-danger">
                {formError}
              </p>
            ) : null}

            <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-cocoa-900/10 pt-5">
              <QuantityStepper value={quantity} onChange={setQuantity} label={item.name} max={20} />
              <Button
                size="lg"
                onClick={addToOrder}
                disabled={!item.isOrderable}
                className="flex-1 sm:flex-none"
              >
                {item.isOrderable ? (
                  <>
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    Add to order — {formatRwf(price * quantity)}
                  </>
                ) : (
                  'Ordering paused'
                )}
              </Button>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-cocoa-500">
              The restaurant confirms final prices and availability at checkout. Ingredients and
              allergens are not published yet — please ask the restaurant directly.
            </p>
          </div>
        </div>
      </section>

      {related.length ? (
        <section className="border-t border-cocoa-900/10 bg-cream-50">
          <div className="mx-auto max-w-[1240px] px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-ember-700">
                  More from {item.category?.name}
                </p>
                <h2 className="mt-2 font-display text-display-md font-semibold text-cocoa-950">
                  Keep looking.
                </h2>
              </div>
              <Link
                to={`/menu?category=${item.category?.slug}`}
                className="text-sm font-semibold text-cocoa-700 underline"
              >
                See all
              </Link>
            </div>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((entry) => (
                <MenuItemCard key={entry.id} item={entry} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}

export default MenuItemPage;
