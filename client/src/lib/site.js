export const SITE = {
  name: 'FAB FOODS',
  slogan: 'Feed your brain',
  city: 'Kigali, Rwanda',
  description:
    'FAB FOODS is a restaurant and coffee house in Kigali, serving breakfast, generous plates, pizza, grill favourites, coffee, juices and shakes.',
};

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export const CONTACT_DETAILS = {
  phone: '+250 788 756 286',
  phoneHref: 'tel:+250788756286',
  email: 'info@fablab.rw',
  emailHref: 'mailto:info@fablab.rw',
  address: '44 KG 548 St, Kacyiru, Kigali, Rwanda',
  directionsUrl:
    'https://www.google.com/maps/search/?api=1&query=FabLab%20Rwanda%2C%2044%20KG%20548%20St%2C%20Kigali',
  hours: [
    { label: 'Monday – Friday', value: '08:00–21:30' },
    { label: 'Saturday', value: '09:00–21:30' },
    { label: 'Sunday', value: 'Closed' },
  ],
};

function phoneHref(phone) {
  return `tel:${phone.replace(/[^+\d]/g, '')}`;
}

function mapUrl(address) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

export function formatApprovedHours(hours) {
  if (!Array.isArray(hours) || hours.length === 0) return [];
  return hours
    .slice()
    .sort((a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day))
    .map((hour) => ({
      label: DAY_LABELS[hour.day],
      value: hour.isClosed ? 'Closed' : `${hour.open}–${hour.close}`,
    }));
}

export function resolveContactDetails(settings) {
  const contact = settings?.contact;
  const address = contact?.address || CONTACT_DETAILS.address;
  const hours = settings?.hours?.length
    ? formatApprovedHours(settings.hours)
    : CONTACT_DETAILS.hours;

  return {
    phone: contact?.phone || CONTACT_DETAILS.phone,
    phoneHref: contact?.phone ? phoneHref(contact.phone) : CONTACT_DETAILS.phoneHref,
    email: contact?.email || CONTACT_DETAILS.email,
    emailHref: contact?.email ? `mailto:${contact.email}` : CONTACT_DETAILS.emailHref,
    address,
    directionsUrl: contact?.address ? mapUrl(address) : CONTACT_DETAILS.directionsUrl,
    hours,
    hoursSummary: hours.map((entry) => `${entry.label} ${entry.value}`).join(' · '),
  };
}

export const NAV_LINKS = [
  { to: '/menu', label: 'Menu' },
  { to: '/about', label: 'About' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/reservations', label: 'Reservations' },
  { to: '/catering', label: 'Catering' },
  { to: '/contact', label: 'Contact' },
];

export const OCCASIONS = ['Birthday', 'Anniversary', 'Business meal', 'Family gathering', 'Other'];
