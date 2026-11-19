import { describe, expect, it } from 'vitest';
import { CONTACT_DETAILS, resolveContactDetails } from './site.js';

describe('resolveContactDetails', () => {
  it('uses the supplied reference details when public settings are unavailable', () => {
    expect(resolveContactDetails(null)).toMatchObject({
      phone: CONTACT_DETAILS.phone,
      phoneHref: CONTACT_DETAILS.phoneHref,
      email: CONTACT_DETAILS.email,
      emailHref: CONTACT_DETAILS.emailHref,
      address: CONTACT_DETAILS.address,
      directionsUrl: CONTACT_DETAILS.directionsUrl,
      hours: CONTACT_DETAILS.hours,
    });
  });

  it('prefers approved public settings when the API provides them', () => {
    const details = resolveContactDetails({
      contact: {
        phone: '+250 700 000 000',
        email: 'approved@example.com',
        address: 'Approved Street, Kigali',
      },
      hours: [
        { day: 0, isClosed: true, open: null, close: null },
        { day: 1, isClosed: false, open: '08:00', close: '20:30' },
      ],
    });

    expect(details).toMatchObject({
      phone: '+250 700 000 000',
      phoneHref: 'tel:+250700000000',
      email: 'approved@example.com',
      emailHref: 'mailto:approved@example.com',
      address: 'Approved Street, Kigali',
    });
    expect(details.directionsUrl).toContain('Approved%20Street%2C%20Kigali');
    expect(details.hours).toEqual([
      { label: 'Monday', value: '08:00–20:30' },
      { label: 'Sunday', value: 'Closed' },
    ]);
  });
});
