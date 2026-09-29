import {
  PHP_DEFAULT_EMPLOYEE_PASSWORD,
  phpDuplicateEmailMessage,
  phpEmployeeStatus,
  phpPasswordToStore,
  phpSalesTargetCleared,
} from './employees.rules';

describe('employee PHP save rules', () => {
  it('forces inactive when a resignation date is set', () => {
    expect(phpEmployeeStatus('2026-09-01', 'active')).toBe('INACTIVE');
    expect(phpEmployeeStatus('  ', 'active')).toBe('ACTIVE');
    expect(phpEmployeeStatus(null, undefined)).toBe('ACTIVE');
    expect(phpEmployeeStatus(null, 'inactive')).toBe('INACTIVE');
  });

  it('keeps the old password when an edit posts an empty password', () => {
    expect(phpPasswordToStore(false, '')).toBeNull();
    expect(phpPasswordToStore(false, '   ')).toBeNull();
    expect(phpPasswordToStore(false, 'secret')).toBe('secret');
  });

  it('defaults a new employee password to 12345678', () => {
    expect(phpPasswordToStore(true, '')).toBe(PHP_DEFAULT_EMPLOYEE_PASSWORD);
    expect(phpPasswordToStore(true, undefined)).toBe(
      PHP_DEFAULT_EMPLOYEE_PASSWORD,
    );
  });

  it('clears sales targets only when the checkbox is off', () => {
    expect(phpSalesTargetCleared(false)).toBe(true);
    expect(phpSalesTargetCleared(true)).toBe(false);
    expect(phpSalesTargetCleared(undefined)).toBe(false);
  });

  it('uses the PHP duplicate email sentence', () => {
    expect(phpDuplicateEmailMessage('a@b.com')).toBe(
      "The email 'a@b.com' is already in use by another employee.",
    );
  });
});
