const { validateCustomerPasswordStrength } = require('../src/utils/password');

describe('validateCustomerPasswordStrength', () => {
  it('rejects a password shorter than 8 characters', () => {
    expect(validateCustomerPasswordStrength('abc123')).toEqual(expect.any(String));
  });

  it('rejects a password with only letters (no digit)', () => {
    expect(validateCustomerPasswordStrength('abcdefgh')).toEqual(expect.any(String));
  });

  it('rejects a password with only digits (no letter)', () => {
    expect(validateCustomerPasswordStrength('12345678')).toEqual(expect.any(String));
  });

  it('accepts a password with at least 8 characters, a letter and a digit', () => {
    expect(validateCustomerPasswordStrength('abc12345')).toBeNull();
  });
});
