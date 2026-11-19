import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Coffee, CookingPot, MapPin, UtensilsCrossed } from 'lucide-react';

import Button from '../../components/ui/Button.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import SectionHeading from '../../components/public/SectionHeading.jsx';
import MenuItemCard from '../../components/public/MenuItemCard.jsx';
import usePageMeta from '../../hooks/usePageMeta.js';
import { getMenuItems, getMenuMeta } from '../../services/publicApi.js';
import {
  COFFEE_IMAGE,
  FOOD_HERO_IMAGE,
  GALLERY_IMAGES,
  HIGH_PRIORITY_IMAGE_PROPS,
  RESERVATION_IMAGE,
  STORY_IMAGE,
  categoryImage,
} from '../../lib/imagery.js';
import { SITE } from '../../lib/site.js';

const SERVICES = [
  {
    icon: CookingPot,
    title: 'The kitchen',
    description: 'Browse the current menu and order dishes for pickup.',
    to: '/menu',
    cta: 'See the menu',
  },
  {
    icon: Coffee,
    title: 'The coffee bar',
    description: 'Explore coffee, tea, juice and other drinks on the menu.',
    to: '/menu?kind=drink',
    cta: 'Explore drinks',
  },
  {
    icon: UtensilsCrossed,
    title: 'Tables',
    description: 'Request a table and the restaurant will review your request.',
    to: '/reservations',
    cta: 'Request a table',
  },
];

export function HomePage() {
  const [meta, setMeta] = useState(null);
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  usePageMeta({
    title: 'Restaurant & coffee house in Kigali',
    image: FOOD_HERO_IMAGE,
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
          src={FOOD_HERO_IMAGE}
          alt="A table of shared dishes on a restaurant table"
          {...HIGH_PRIORITY_IMAGE_PROPS}
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-cocoa-950/95 via-cocoa-950/65 to-cocoa-950/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-cocoa-950/70 via-transparent to-cocoa-950/20" />

        <div className="relative mx-auto flex min-h-[74vh] max-w-[1240px] flex-col justify-end px-5 pb-10 pt-24 sm:px-8 lg:px-12 lg:pb-14">
          <div className="max-w-3xl">
            <p className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-cream-200/75">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              {SITE.city}
              <span className="h-1 w-1 rounded-full bg-ember-400" aria-hidden="true" />
              Restaurant & coffee house
            </p>

            <h1 className="mt-6 font-display text-[clamp(3.4rem,9vw,7.5rem)] font-semibold leading-[0.88] tracking-[-0.04em]">
              Feed your
              <span className="block italic text-ember-300">brain.</span>
            </h1>

            <p className="mt-7 max-w-xl font-display text-lg leading-relaxed text-cream-100/80 sm:text-xl">
              A restaurant and coffee house in Kigali. Explore the current menu, reserve a table, or
              place a pickup order.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild variant="order" size="lg">
                <Link to="/menu">
                  Order now
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="onDark">
                <Link to="/reservations">Request a table</Link>
              </Button>
            </div>
            <p className="mt-5 text-xs text-cream-100/55">
              Illustrative editorial food photography, not photographs of FAB FOODS dishes. Menu
              details come from the current site data.
            </p>
          </div>

          <dl className="mt-12 grid gap-4 border-t border-cream-100/20 pt-5 text-sm sm:grid-cols-3">
            {SERVICES.map(({ icon: Icon, title, description }) => (
              <div key={title} className="grid grid-cols-[auto_1fr] items-center gap-x-3">
                <Icon className="row-span-2 h-4 w-4 text-ember-300" aria-hidden="true" />
                <dt className="text-cream-200/60">{title}</dt>
                <dd className="font-medium text-cream-50">{description}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-5 py-16 sm:px-8 lg:px-12 lg:py-20">
        <SectionHeading
          eyebrow="What you can do"
          title="Kitchen, coffee and a table."
          description="Start with the menu, or tell us when you would like to visit."
          action={
            <Button asChild variant="secondary">
              <Link to="/menu">
                Full menu
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          }
        />

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {SERVICES.map(({ icon: Icon, title, description, to, cta }) => (
            <div key={title} className="rounded-2xl border border-cocoa-900/10 bg-cream-50 p-6">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-cream-200 text-cocoa-700">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-5 font-display text-xl font-semibold text-cocoa-950">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-cocoa-600">{description}</p>
              <Link
                to={to}
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-ember-700 hover:text-ember-800"
              >
                {cta}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-cream-200/70 py-16 lg:py-20">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-8 lg:px-12">
          <SectionHeading
            eyebrow="Explore"
            title="A menu with range."
            description="Browse the current categories, from the kitchen to the coffee bar."
            action={
              <Button asChild variant="ghost">
                <Link to="/menu">
                  View all categories
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

          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {loading
              ? Array.from({ length: 6 }, (_, index) => (
                  <Skeleton key={index} className="aspect-[3/4]" />
                ))
              : categoryHighlights.map((category) => (
                  <Link
                    key={category.id}
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
                        {category.kind === 'drink'
                          ? 'Drinks'
                          : category.kind === 'dessert'
                            ? 'Sweet'
                            : 'Kitchen'}
                      </p>
                      <p className="mt-1 font-display text-xl font-semibold leading-tight">
                        {category.name}
                      </p>
                    </div>
                  </Link>
                ))}
          </div>
        </div>
      </section>

      <section className="border-y border-cocoa-900/10 bg-cream-50">
        <div className="mx-auto max-w-[1240px] px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
          <SectionHeading
            eyebrow="From the menu"
            title="A taste of what is available."
            description="Staff-verified dishes from the current menu."
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
            {!loading && !featured.length ? (
              <div className="rounded-2xl border border-cocoa-900/10 bg-cream-50 p-6 text-sm text-cocoa-600 md:col-span-2 lg:col-span-3">
                No verified menu items are published yet. Please check back soon.
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1240px] gap-0 overflow-hidden rounded-2xl border border-cocoa-900/10 bg-cocoa-950 text-cream-50 lg:grid-cols-2">
        <div className="flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-14 lg:py-20">
          <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-ember-300">
            The FAB FOODS table
          </p>
          <h2 className="mt-4 max-w-lg font-display text-display-lg font-semibold leading-none">
            A restaurant and coffee house in Kigali.
          </h2>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-cream-100/70">
            FAB FOODS is a restaurant and coffee house in Kigali, Rwanda. This site publishes the
            current menu and lets you request a table or place a pickup order.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-cream-100/50">
            Opening hours, address, phone and social accounts are not published here until the
            restaurant confirms them.
          </p>
          <div className="mt-8">
            <Button asChild variant="onDark">
              <Link to="/about">Learn more</Link>
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
            Coffee, tea and cold drinks.
          </h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-cocoa-600">
            Browse the drinks listed in the current menu and add what you want to your pickup order.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild variant="order">
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

      <section className="mx-auto max-w-[1240px] px-5 py-16 sm:px-8 lg:px-12 lg:py-20">
        <SectionHeading
          eyebrow="In the room"
          title="A look around."
          description="Illustrative editorial imagery, not photographs of FAB FOODS dishes, while restaurant photography is being prepared."
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
            <h2 className="mt-4 font-display text-display-lg font-semibold">Save a seat.</h2>
            <p className="mt-4 text-base leading-relaxed text-cream-100/70">
              Send a table request and the restaurant will confirm it with you. Requests are not
              confirmed automatically. No payment is taken online.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="order">
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

      <section className="mx-auto max-w-[1240px] px-5 py-16 sm:px-8 lg:px-12 lg:py-20">
        <div className="flex flex-col gap-6 rounded-2xl border border-cocoa-900/10 bg-cream-50 p-7 sm:flex-row sm:items-center sm:justify-between sm:p-9">
          <div className="flex items-start gap-4">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cream-200 text-cocoa-700">
              <MapPin className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-ember-700">
                Find us
              </p>
              <h2 className="mt-2 font-display text-2xl font-semibold text-cocoa-950">
                {SITE.city}
              </h2>
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-cocoa-600">
                The exact address and contact details are being confirmed. Use the contact form for
                enquiries in the meantime.
              </p>
            </div>
          </div>
          <Button asChild variant="order">
            <Link to="/contact">Contact us</Link>
          </Button>
        </div>
      </section>
    </>
  );
}

export default HomePage;
