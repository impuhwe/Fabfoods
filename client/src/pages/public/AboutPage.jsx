import { Link } from 'react-router-dom';
import { ArrowRight, Coffee, HeartHandshake, UtensilsCrossed } from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import SectionHeading from '../../components/public/SectionHeading.jsx';
import usePageMeta from '../../hooks/usePageMeta.js';
import { COFFEE_IMAGE, HERO_IMAGE, STORY_IMAGE } from '../../lib/imagery.js';

const PILLARS = [
  {
    icon: UtensilsCrossed,
    title: 'A broad, useful menu',
    copy: 'Breakfast, starters, soups, salads, sandwiches, pizza, grill, specials and desserts — food for a quick stop or a long table.',
  },
  {
    icon: Coffee,
    title: 'Coffee and cold drinks',
    copy: 'Hot and iced coffee, tea, fresh juice, mojitos, smoothies and milkshakes sit alongside the kitchen menu.',
  },
  {
    icon: HeartHandshake,
    title: 'Hospitality first',
    copy: 'Clear information, visible prices and a table request that a person reviews — not an automated promise.',
  },
];

export function AboutPage() {
  usePageMeta({
    title: 'About',
    description:
      'FAB FOODS is a restaurant and coffee house in Kigali. Feed your brain — breakfast, generous plates, coffee and cold drinks.',
    image: STORY_IMAGE,
  });

  return (
    <>
      <section className="border-b border-cocoa-900/10 bg-cream-50">
        <div className="mx-auto grid max-w-[1240px] gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-12 lg:py-20">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-ember-700">
              About FAB FOODS
            </p>
            <h1 className="mt-4 font-display text-display-xl font-semibold leading-[0.92] text-cocoa-950">
              Food for a<span className="block italic">thinking day.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-cocoa-600 sm:text-lg">
              FAB FOODS is a restaurant and coffee house in Kigali. The idea is simple: a broad,
              generous menu, a proper cup of coffee and a room that gives you space to settle in.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="order">
                <Link to="/menu">
                  See the menu
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild variant="secondary">
                <Link to="/reservations">Request a table</Link>
              </Button>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl">
            <img
              src={STORY_IMAGE}
              alt="Representative stock photograph of a sandwich"
              className="aspect-[4/5] w-full object-cover"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
        <SectionHeading
          eyebrow="What we do"
          title="One kitchen, many moods."
          description="The menu follows the restaurant's printed food and drink menus, from breakfast through the rest of the day."
        />
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {PILLARS.map((pillar) => (
            <article key={pillar.title} className="border-t border-cocoa-900/15 pt-5">
              <pillar.icon className="h-5 w-5 text-ember-700" aria-hidden="true" />
              <h2 className="mt-4 font-display text-2xl font-semibold text-cocoa-950">
                {pillar.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-cocoa-600">{pillar.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-cocoa-950 text-cream-50">
        <div className="mx-auto grid max-w-[1240px] gap-0 lg:grid-cols-2">
          <div className="min-h-[320px]">
            <img
              src={HERO_IMAGE}
              alt="Representative stock photograph of a breakfast spread"
              loading="lazy"
              className="h-full w-full object-cover opacity-80"
            />
          </div>
          <div className="flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-14 lg:py-20">
            <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-ember-300">
              The table
            </p>
            <h2 className="mt-4 font-display text-display-lg font-semibold leading-none">
              Coffee, meals and time to settle in.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-cream-100/70">
              Browse the menu for breakfast, plates, coffee and cold drinks. When you are ready,
              send a table request and the restaurant will confirm it with you.
            </p>
            <div className="mt-8">
              <Button asChild variant="onDark">
                <Link to="/gallery">Look around</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1240px] gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-12 lg:py-24">
        <div className="overflow-hidden rounded-2xl">
          <img
            src={COFFEE_IMAGE}
            alt="Representative stock photograph of a coffee drink"
            loading="lazy"
            className="aspect-square w-full object-cover"
          />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-ember-700">
            The details
          </p>
            <h2 className="mt-4 font-display text-display-lg font-semibold text-cocoa-950">
              Before you order.
            </h2>
            <div className="mt-5 space-y-4 text-base leading-relaxed text-cocoa-600">
              <p>
                Prices shown on this site come from the restaurant&apos;s menus. Some items are
                awaiting confirmation and cannot be ordered online yet.
              </p>
              <p>
                Descriptions, ingredients and allergens are not published yet. If you need to know
                what is in a dish, ask the restaurant before you order.
              </p>
            <p>
              Table requests are reviewed by a person. A submitted request is not a confirmed
              reservation.
            </p>
          </div>
          <div className="mt-7">
            <Button asChild variant="secondary">
              <Link to="/contact">Ask a question</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

export default AboutPage;
