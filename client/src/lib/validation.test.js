import { describe, expect, it } from 'vitest';
import { addDaysToDateString, getKigaliDateBounds, isValidDateString } from './calendarDate.js';
import {
  cateringFormSchema,
  checkoutFormSchema,
  contactFormSchema,
  invitationAcceptFormSchema,
  loginFormSchema,
  passwordFormSchema,
  profileFormSchema,
  registerFormSchema,
  reservationFormSchema,
} from './validation.js';

function kigaliDate(offsetDays = 0) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Kigali' }).format(
    new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000),
  );
}

const reservation = {
  name: 'Aline Test',
  email: 'aline@example.com',
  phone: '+250788000000',
  date: kigaliDate(3),
  time: '19:30',
  partySize: 4,
  occasion: 'Birthday',
  specialRequests: 'Window table',
};

describe('reservationFormSchema', () => {
  it('accepts a valid future request', () => {
    expect(reservationFormSchema.safeParse(reservation).success).toBe(true);
  });

  it('accepts a reservation with no occasion', () => {
    const result = reservationFormSchema.safeParse({ ...reservation, occasion: '' });
    expect(result.success).toBe(true);
    expect(result.data.occasion).toBe('');
  });

  it('rejects past dates, bad times and oversized parties', () => {
    expect(reservationFormSchema.safeParse({ ...reservation, date: kigaliDate(-1) }).success).toBe(
      false,
    );
    expect(reservationFormSchema.safeParse({ ...reservation, time: '25:00' }).success).toBe(false);
    expect(reservationFormSchema.safeParse({ ...reservation, partySize: 21 }).success).toBe(false);
  });

  it('rejects missing, impossible and out-of-range dates', () => {
    expect(reservationFormSchema.safeParse({ ...reservation, date: '' }).success).toBe(false);
    expect(reservationFormSchema.safeParse({ ...reservation, date: '2026-02-31' }).success).toBe(
      false,
    );
    expect(reservationFormSchema.safeParse({ ...reservation, date: kigaliDate(91) }).success).toBe(
      false,
    );
  });
});

describe('calendarDate helpers', () => {
  it('keeps Kigali date bounds and date strings consistent', () => {
    const { min, max } = getKigaliDateBounds();
    expect(isValidDateString(min)).toBe(true);
    expect(addDaysToDateString(min, 90)).toBe(max);
    expect(isValidDateString('2026-02-30')).toBe(false);
  });
});

describe('auth and contact schemas', () => {
  it('rejects invalid login and contact details', () => {
    expect(loginFormSchema.safeParse({ email: 'not-an-email', password: 'x' }).success).toBe(false);
    expect(
      contactFormSchema.safeParse({
        name: 'A',
        email: 'bad',
        phone: '',
        message: 'short',
      }).success,
    ).toBe(false);
  });

  it('requires matching, strong passwords on registration', () => {
    const valid = {
      name: 'Grace Test',
      email: 'grace@example.com',
      phone: '',
      password: 'CorrectHorseBattery1',
      confirmPassword: 'CorrectHorseBattery1',
    };

    expect(registerFormSchema.safeParse(valid).success).toBe(true);
    expect(
      registerFormSchema.safeParse({ ...valid, confirmPassword: 'DifferentPassword1' }).success,
    ).toBe(false);
    expect(
      registerFormSchema.safeParse({ ...valid, password: 'short', confirmPassword: 'short' })
        .success,
    ).toBe(false);
  });
});

describe('cateringFormSchema', () => {
  const catering = {
    name: 'Aline Test',
    email: 'aline@example.com',
    phone: '+250788000000',
    eventType: 'corporate',
    eventDate: kigaliDate(7),
    guestCount: 40,
    location: 'Kigali',
    message: 'We need lunch for a team workshop.',
  };

  it('accepts guest catering enquiries with or without a date', () => {
    expect(cateringFormSchema.safeParse(catering).success).toBe(true);
    expect(cateringFormSchema.safeParse({ ...catering, eventDate: '' }).success).toBe(true);
  });

  it('rejects invalid event types, dates and unsupported guest counts', () => {
    expect(cateringFormSchema.safeParse({ ...catering, eventType: 'unknown' }).success).toBe(false);
    expect(cateringFormSchema.safeParse({ ...catering, eventDate: '2026-02-31' }).success).toBe(
      false,
    );
    expect(cateringFormSchema.safeParse({ ...catering, guestCount: 1001 }).success).toBe(false);
  });
});

describe('invitationAcceptFormSchema', () => {
  it('requires a strong, confirmed password', () => {
    const values = { password: 'NewAdminPass123', confirmPassword: 'NewAdminPass123' };
    expect(invitationAcceptFormSchema.safeParse(values).success).toBe(true);
    expect(
      invitationAcceptFormSchema.safeParse({ ...values, confirmPassword: 'DifferentPass123' })
        .success,
    ).toBe(false);
    expect(
      invitationAcceptFormSchema.safeParse({ password: 'weak', confirmPassword: 'weak' }).success,
    ).toBe(false);
  });
});

describe('checkoutFormSchema', () => {
  it('accepts pickup and delivery details with a known fulfilment type', () => {
    const base = {
      name: 'Aline Test',
      email: 'aline@example.com',
      phone: '+250788000000',
      paymentMethod: 'pay_at_restaurant',
      notes: '',
    };

    expect(checkoutFormSchema.safeParse({ ...base, fulfillmentType: 'pickup' }).success).toBe(true);
    expect(
      checkoutFormSchema.safeParse({
        ...base,
        fulfillmentType: 'delivery',
        deliveryLine1: 'KG 11 Ave, Gasabo',
      }).success,
    ).toBe(true);
    expect(
      checkoutFormSchema.safeParse({
        ...base,
        fulfillmentType: 'delivery',
        deliveryLine1: '',
      }).success,
    ).toBe(false);
    expect(checkoutFormSchema.safeParse({ ...base, fulfillmentType: 'drone' }).success).toBe(false);
  });
});

describe('account form schemas', () => {
  it('validates profile and password changes', () => {
    expect(
      profileFormSchema.safeParse({
        name: 'Aline Test',
        email: 'aline@example.com',
        phone: '+250788000000',
      }).success,
    ).toBe(true);
    expect(
      passwordFormSchema.safeParse({
        currentPassword: 'OldPassword123',
        newPassword: 'NewPassword123',
        confirmPassword: 'NewPassword123',
      }).success,
    ).toBe(true);
    expect(
      passwordFormSchema.safeParse({
        currentPassword: 'OldPassword123',
        newPassword: 'weak',
        confirmPassword: 'weak',
      }).success,
    ).toBe(false);
  });
});
