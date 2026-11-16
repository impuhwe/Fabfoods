import { describe, expect, it } from 'vitest';
import {
  checkoutFormSchema,
  contactFormSchema,
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

  it('rejects past dates, bad times and oversized parties', () => {
    expect(reservationFormSchema.safeParse({ ...reservation, date: kigaliDate(-1) }).success).toBe(
      false,
    );
    expect(reservationFormSchema.safeParse({ ...reservation, time: '25:00' }).success).toBe(false);
    expect(reservationFormSchema.safeParse({ ...reservation, partySize: 21 }).success).toBe(false);
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
        deliveryLine1: 'KG 11 Ave',
        deliveryDistrict: 'Gasabo',
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
