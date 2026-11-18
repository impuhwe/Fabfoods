import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import Select from '../../components/ui/Select.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Chip from '../../components/ui/Chip.jsx';
import MenuItemCard from '../../components/public/MenuItemCard.jsx';
import usePageMeta from '../../hooks/usePageMeta.js';
import { getMenuItems, getMenuMeta } from '../../services/publicApi.js';
import { HERO_IMAGE } from '../../lib/imagery.js';
import { getApiErrorMessage } from '../../lib/api.js';

const PAGE_SIZE = 24;
const SORT_OPTIONS = new Set(['recommended', 'price-asc', 'price-desc', 'name']);

export function MenuPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get('category') ?? '';
  const kind = searchParams.get('kind') ?? '';
  const initialQuery = searchParams.get('q') ?? '';
  const sortParam = searchParams.get('sort');
  const sort = SORT_OPTIONS.has(sortParam) ? sortParam : 'recommended';
  const [searchInput, setSearchInput] = useState(initialQuery);
  const [search, setSearch] = useState(initialQuery);
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [listMeta, setListMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  usePageMeta({
    title: 'Menu',
    description:
      'Browse the FAB FOODS menu: breakfast, starters, soups, salads, sandwiches, pizza, grill, desserts, coffee, juices and shakes.',
    image: HERO_IMAGE,
  });

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setSearchParams(
      (current) => {
        if ((current.get('q') ?? '') === search) return current;
        const params = new URLSearchParams(current);
        if (search) params.set('q', search);
        else params.delete('q');
        return params;
      },
      { replace: true },
    );
  }, [search, setSearchParams]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    setPage(1);

    getMenuItems({
      category: category || undefined,
      kind: kind || undefined,
      search: search || undefined,
      sort,
      limit: PAGE_SIZE,
      page: 1,
    })
      .then(({ items: nextItems, meta }) => {
        if (!active) return;
        setItems(nextItems);
        setListMeta(meta);
      })
      .catch((error) => {
        if (active) {
          setError(getApiErrorMessage(error, 'The menu could not be loaded. Please try again.'));
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [category, kind, search, sort]);

  useEffect(() => {
    let active = true;
    getMenuMeta()
      .then((data) => {
        if (active) setCategories(data.categories);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  function setFilter(nextCategory, nextKind) {
    setSearchParams(
      (current) => {
        const params = new URLSearchParams(current);
        params.delete('category');
        params.delete('kind');
        if (nextCategory) params.set('category', nextCategory);
        if (nextKind) params.set('kind', nextKind);
        return params;
      },
      { replace: true },
    );
  }

  function setSort(nextSort) {
    setSearchParams(
      (current) => {
        const params = new URLSearchParams(current);
        if (nextSort === 'recommended') params.delete('sort');
        else params.set('sort', nextSort);
        return params;
      },
      { replace: true },
    );
  }

  function clearFilters() {
    setSearchInput('');
    setSearch('');
    setSearchParams(new URLSearchParams(), { replace: true });
  }

  async function loadMore() {
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const { items: nextItems, meta } = await getMenuItems({
        category: category || undefined,
        kind: kind || undefined,
        search: search || undefined,
        sort,
        limit: PAGE_SIZE,
        page: nextPage,
      });
      setItems((current) => [...current, ...nextItems]);
      setListMeta(meta);
      setPage(nextPage);
    } catch (error) {
      setError(getApiErrorMessage(error, 'More items could not be loaded. Please try again.'));
    } finally {
      setLoadingMore(false);
    }
  }

  const activeCategory = categories.find((entry) => entry.slug === category);
  const groupedItems = useMemo(() => {
    const groups = new Map();
    for (const item of items) {
      const key = item.category?.slug ?? 'other';
      const name = item.category?.name ?? 'Kitchen';
      if (!groups.has(key)) groups.set(key, { key, name, items: [] });
      groups.get(key).items.push(item);
    }
    return [...groups.values()];
  }, [items]);

  return (
    <>
      <section className="border-b border-cocoa-900/10 bg-cream-50">
        <div className="mx-auto max-w-[1240px] px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
          <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-ember-700">
            The menu
          </p>
          <div className="mt-4 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div className="max-w-2xl">
              <h1 className="font-display text-display-lg font-semibold text-cocoa-950">
                {activeCategory?.name ?? (kind === 'drink' ? 'Drinks' : 'Kitchen & coffee')}
              </h1>
              <p className="mt-3 text-base leading-relaxed text-cocoa-600">
                {activeCategory?.description ||
                  'Browse by category or search the full menu. Items awaiting owner confirmation are visible but cannot be ordered online yet.'}
              </p>
            </div>
            <div className="flex w-full max-w-md items-center gap-2">
              <div className="relative flex-1">
                <Search
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-cocoa-400"
                  aria-hidden="true"
                />
                <Input
                  type="search"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search dishes, drinks, ingredients"
                  aria-label="Search the menu"
                  className="pl-10"
                />
              </div>
              <Select
                value={sort}
                onChange={(event) => setSort(event.target.value)}
                aria-label="Sort menu"
                className="w-auto min-w-[9.5rem]"
              >
                <option value="recommended">Recommended</option>
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
                <option value="name">Name A–Z</option>
              </Select>
            </div>
          </div>
        </div>
      </section>

      <div className="sticky top-[72px] z-20 border-b border-cocoa-900/10 bg-cream-100/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1240px] items-center gap-2 overflow-x-auto px-5 py-3 sm:px-8 lg:px-12">
          <span className="mr-1 hidden items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-cocoa-500 sm:flex">
            <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
            Filter
          </span>
          <Chip pressed={!category && !kind} onClick={() => setFilter('', '')}>
            All
          </Chip>
          <Chip pressed={kind === 'food'} onClick={() => setFilter('', 'food')}>
            Kitchen
          </Chip>
          <Chip pressed={kind === 'drink'} onClick={() => setFilter('', 'drink')}>
            Drinks
          </Chip>
          <span className="mx-1 h-5 w-px shrink-0 bg-cocoa-900/15" aria-hidden="true" />
          {categories.map((entry) => (
            <Chip
              key={entry.id}
              pressed={category === entry.slug}
              onClick={() => setFilter(entry.slug, '')}
              className="shrink-0"
            >
              {entry.name}
            </Chip>
          ))}
          {category || kind || searchInput ? (
            <button
              type="button"
              onClick={clearFilters}
              className="ml-1 inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-cocoa-500 hover:text-cocoa-900"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              Clear
            </button>
          ) : null}
        </div>
      </div>

      <section className="mx-auto max-w-[1240px] px-5 py-10 sm:px-8 lg:px-12 lg:py-14">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-cocoa-500">
            {loading
              ? 'Loading the menu…'
              : `${listMeta?.total ?? 0} ${listMeta?.total === 1 ? 'item' : 'items'}`}
            {search ? ` for “${search}”` : ''}
          </p>
          {listMeta?.total ? (
            <p className="text-xs text-cocoa-500">
              Page {listMeta.page} of {listMeta.totalPages}
            </p>
          ) : null}
        </div>

        {error ? (
          <p className="mt-6 rounded-xl border border-danger/20 bg-danger/5 p-4 text-sm text-danger">
            {error}
          </p>
        ) : null}

        <h2 className="sr-only">Menu results</h2>

        {loading ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-24" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={Search}
            title="Nothing matched that search"
            description="Try a different dish, category or search term."
            action={
              <Button variant="secondary" onClick={clearFilters}>
                Clear filters
              </Button>
            }
            className="mt-6"
          />
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-2 lg:gap-x-12">
            {groupedItems.map((group) => (
              <section key={group.key} id={`menu-category-${group.key}`} className="min-w-0">
                <h2 className="border-b border-cocoa-900/15 pb-2 font-display text-2xl font-semibold text-cocoa-950">
                  {group.name}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                  {group.items.map((item) => (
                    <MenuItemCard key={item.id} item={item} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {listMeta?.hasNextPage ? (
          <div className="mt-10 flex justify-center">
            <Button variant="secondary" onClick={loadMore} loading={loadingMore}>
              Load more
            </Button>
          </div>
        ) : null}

        <div className="mt-12 rounded-xl border border-cocoa-900/10 bg-cream-50 p-5 text-sm text-cocoa-600">
          <p className="font-semibold text-cocoa-900">A note on the menu</p>
          <p className="mt-1">
            Menu names and prices come from the restaurant&apos;s printed menus. Items marked
            “Awaiting confirmation” cannot be added to an online order until the owner confirms
            them. No descriptions, ingredients or allergens have been invented.
          </p>
          <Link to="/contact" className="mt-2 inline-block font-semibold text-ember-700 underline">
            Ask about a dish
          </Link>
        </div>
      </section>
    </>
  );
}

export default MenuPage;
