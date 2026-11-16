import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, Coffee, MapPin, UtensilsCrossed } from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import SectionHeading from '../../components/public/SectionHeading.jsx';
import MenuItemCard from '../../components/public/MenuItemCard.jsx';
import usePageMeta from '../../hooks/usePageMeta.js';
import { getMenuItems, getMenuMeta } from '../../services/publicApi.js';
import {
  COFFEE_IMAGE,
  GALLERY_IMAGES,
  HERO_IMAGE,
  RESERVATION_IMAGE,
  STORY_IMAGE,
  categoryImage,
} from '../../lib/imagery.js';

function CategoryTile({ category }) {
  return (
    <Link
      to={`/menu?category=${category.slug}`}
      className="group relative block aspect-[3/4] overflow-hidden rounded-xl bg-cocoa-900"
    >
      <img
        src={categoryImage(category.slug)}
        alt=""
        loading="lazy"
        className="h-full w-full object-cover opacity-80 transition duration-500 group-hover:scale-[1.04] group-hover:opacity-90"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-cocoa-950/85 via-cocoa-950/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-4 text-cream-50">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cream-200/70">
          {category.kind === 'drink' ? 'Drinks' : category.kind === 'dessert' ? 'Sweet' : 'Kitchen'}
        </p>
        <p className="mt-1 font-display text-xl font-semibold leading-tight">{category.name}</p>
      </div>
    </Link>
  );
}

export function HomePage() {
  const [meta, setMeta] = useState(null);
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  usePageMeta({
    title: 'Restaurant & coffee house in Kigali',
    image: HERO_IMAGE,
  });

  useEffect(() => {
    let active = true;

    Promise.all([getMenuMeta(), getMenuItems({ limit: 6, sort: 'recommended' })])
      .then(([menuMeta, menuItems]) => {
        if (!active) return;
        setMeta(menuMeta);
        setFeatured(menuItems.items);
      })
      .catch(() => {
        if (active) setError('The menu could not be loaded just now.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const foodCategories = (meta?.categories ?? []).filter((category) => category.kind !== 'drink');
  const drinkCategories = (meta?.categories ?? []).filter((category) => category.kind === 'drink');
  const categoryHighlights = [...foodCategories.slice(0, 4), ...drinkCategories.slice(0, 2)];

  return (
    <>
      <section className="relative isolate min-h-[74vh] overflow-hidden bg-cocoa-950 text-cream-50">
        <img
          src={HERO_IMAGE}
          alt="Warm restaurant dining room with timber tables and low light"
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-cocoa-950/90 via-cocoa-950/60 to-cocoa-950/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-cocoa-950/70 via-transparent to-cocoa-950/20" />

        <div className="relative mx-auto flex min-h-[74vh] max-w-[1240px] flex-col justify-end px-5 pb-10 pt-24 sm:px-8 lg:px-12 lg:pb-14">
          <div className="max-w-3xl">
            <p className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-cream-200/75">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              Kigali, Rwanda
              <span className="h-1 w-1 rounded-full bg-ember-400" aria-hidden="true" />
              Restaurant & coffee house
            </p>

            <h1 className="mt-6 font-display text-[clamp(3.4rem,9vw,7.5rem)] font-semibold leading-[0.88] tracking-[-0.04em]">
              Feed your
              <span className="block italic text-ember-300">brain.</span>
            </h1>

            <p className="mt-7 max-w-xl text-base leading-relaxed text-cream-100/80 sm:text-lg">
              Breakfast, generous plates, pizza from the oven, grill favourites, proper coffee,
              fresh juices and shakes — served with a little room to think.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link to="/menu">
                  Explore the menu
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="onDark">
                <Link to="/reservations">Request a table</Link>
              </Button>
            </div>
          </div>

          <dl className="mt-12 grid gap-4 border-t border-cream-100/20 pt-5 text-sm sm:grid-cols-3">
            <div className="grid grid-cols-[auto_1fr] items-center gap-x-3">
              <UtensilsCrossed className="row-span-2 h-4 w-4 text-ember-300" aria-hidden="true" />
              <dt className="text-cream-200/60">The kitchen</dt>
              <dd className="font-medium text-cream-50">Breakfast and plates</dd>
            </div>
            <div className="grid grid-cols-[auto_1fr] items-center gap-x-3">
              <Coffee className="row-span-2 h-4 w-4 text-ember-300" aria-hidden="true" />
              <dt className="text-cream-200/60">The coffee bar</dt>
              <dd className="font-medium text-cream-50">Hot, iced and blended</dd>
            </div>
            <div className="grid grid-cols-[auto_1fr] items-center gap-x-3">
              <CalendarDays className="row-span-2 h-4 w-4 text-ember-300" aria-hidden="true" />
              <dt className="text-cream-200/60">Tables</dt>
              <dd className="font-medium text-cream-50">Requested online</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
        <SectionHeading
          eyebrow="Find your table"
          title="A menu with range."
          description="Start with breakfast, move through salads and sandwiches, then settle into pizza, grill and something cold."
          action={
            <Button asChild variant="secondary">
              <Link to="/menu">
                Full menu
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          }
        />

        {loading ? (
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="aspect-[3/4]" />
            ))}
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {categoryHighlights.map((category) => (
              <CategoryTile key={category.id} category={category} />
            ))}
          </div>
        )}
      </section>

      <section className="border-y border-cocoa-900/10 bg-cream-50">
        <div className="mx-auto max-w-[1240px] px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
          <SectionHeading
            eyebrow="From the kitchen"
            title="Worth sitting down for."
            description="A few plates from the current menu. Prices and availability are confirmed by the restaurant."
            action={
              <Button asChild variant="ghost">
                <Link to="/menu">
                  See everything
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            }
          />

          {error ? (
            <p className="mt-8 rounded-xl border border-danger/20 bg-danger/5 p-4 text-sm text-danger">
              {error}
            </p>
          ) : null}

          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {loading
              ? Array.from({ length: 3 }, (_, index) => (
                  <Skeleton key={index} className="h-[430px]" />
                ))
              : featured.slice(0, 3).map((item) => <MenuItemCard key={item.id} item={item} />)}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1240px] gap-0 overflow-hidden rounded-2xl border border-cocoa-900/10 bg-cocoa-950 text-cream-50 lg:grid-cols-2">
        <div className="flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-14 lg:py-20">
          <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-ember-300">
            The FAB FOODS table
          </p>
          <h2 className="mt-4 max-w-lg font-display text-display-lg font-semibold leading-none">
            Familiar food, held to a higher standard.
          </h2>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-cream-100/70">
            FAB FOODS is a restaurant and coffee house in Kigali. The menu moves from breakfast and
            everyday plates to pizza, grill, salads, coffee and cold drinks. Simple things, made
            properly.
          </p>
          <div className="mt-8">
            <Button asChild variant="onDark">
              <Link to="/about">Our story</Link>
            </Button>
          </div>
        </div>
        <div className="min-h-[320px]">
          <img
            src={STORY_IMAGE}
            alt="A restaurant table set for service"
            loading="lazy"
            className="h-full w-full object-cover"
          />
        </div>
      </section>

      <section className="mx-auto grid max-w-[1240px] gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-12 lg:py-24">
        <div className="order-2 overflow-hidden rounded-2xl lg:order-1">
          <img
            src={COFFEE_IMAGE}
            alt="Coffee served in a warm-toned cup"
            loading="lazy"
            className="aspect-[4/5] h-full w-full object-cover"
          />
        </div>
        <div className="order-1 lg:order-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-ember-700">
            Coffee & cold
          </p>
          <h2 className="mt-4 font-display text-display-lg font-semibold text-cocoa-950">
            A proper pause.
          </h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-cocoa-600">
            Hot coffee, iced coffee, tea, fresh juice, mojitos, smoothies and milkshakes. Whether
            you are working through the afternoon or settling in for a long lunch, the drinks list
            has somewhere to land.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/menu?kind=drink">
                Explore drinks
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link to="/menu?category=hot-coffee">Coffee menu</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="relative isolate overflow-hidden bg-cocoa-950 text-cream-50">
        <img
          src={RESERVATION_IMAGE}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-cocoa-950/95 via-cocoa-950/75 to-cocoa-950/30" />
        <div className="relative mx-auto max-w-[1240px] px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-ember-300">
              Reservations
            </p>
            <h2 className="mt-4 font-display text-display-lg font-semibold">
              Make room for a proper meal.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-cream-100/70">
              Send a table request and the restaurant will confirm it with you. Requests are not
              confirmed automatically.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/reservations">
                  Request a table
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild variant="onDark">
                <Link to="/contact">Contact us</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
        <SectionHeading
          eyebrow="In the room"
          title="A look around."
          description="A small preview of the atmosphere we are building. Restaurant photography will replace these temporary editorial images."
          action={
            <Button asChild variant="ghost">
              <Link to="/gallery">
                Open gallery
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          }
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {GALLERY_IMAGES.slice(0, 3).map((image) => (
            <img
              key={image.src}
              src={image.src}
              alt={image.alt}
              loading="lazy"
              className="aspect-[4/3] w-full rounded-xl object-cover"
            />
          ))}
        </div>
        <p className="mt-3 text-xs text-cocoa-500">
          Temporary editorial imagery — FAB FOODS photography is pending.
        </p>
      </section>
    </>
  );
}

export default HomePage;
