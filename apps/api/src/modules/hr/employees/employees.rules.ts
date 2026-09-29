export const PHP_DEFAULT_EMPLOYEE_PASSWORD = '12345678';

export function phpEmployeeStatus(
  resignationDate: string | null | undefined,
  postedStatus: string | null | undefined,
): 'ACTIVE' | 'INACTIVE' {
  if (resignationDate && resignationDate.trim().length > 0) {
    return 'INACTIVE';
  }

  if (
    !postedStatus ||
    postedStatus === 'active' ||
    postedStatus === 'ACTIVE'
  ) {
    return 'ACTIVE';
  }

  return 'INACTIVE';
}

export function phpSalesTargetCleared(hasSalesTarget: boolean | undefined): boolean {
  return hasSalesTarget === false;
}

export function phpPasswordToStore(
  isCreate: boolean,
  postedPassword: string | null | undefined,
): string | null {
  const trimmed = postedPassword?.trim() ?? '';

  if (!isCreate && trimmed.length === 0) {
    return null;
  }

  return trimmed.length > 0 ? trimmed : PHP_DEFAULT_EMPLOYEE_PASSWORD;
}

export function phpDuplicateEmailMessage(email: string): string {
  return `The email '${email}' is already in use by another employee.`;
}
