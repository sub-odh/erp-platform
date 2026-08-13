export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export interface PasswordRequirement {
  key: string;
  label: string;
  satisfied: boolean;
}

export function getPasswordRequirements(
  password: string,
): PasswordRequirement[] {
  return [
    {
      key: "length",
      label: "At least 8 characters",
      satisfied: password.length >= PASSWORD_MIN_LENGTH,
    },
    {
      key: "uppercase",
      label: "One uppercase letter",
      satisfied: /[A-Z]/.test(password),
    },
    {
      key: "lowercase",
      label: "One lowercase letter",
      satisfied: /[a-z]/.test(password),
    },
    {
      key: "number",
      label: "One number",
      satisfied: /\d/.test(password),
    },
    {
      key: "special",
      label: "One special character",
      satisfied: /[^A-Za-z0-9]/.test(password),
    },
  ];
}

export function isStrongPassword(password: string): boolean {
  return (
    password.length >= PASSWORD_MIN_LENGTH &&
    password.length <= PASSWORD_MAX_LENGTH &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

export const PASSWORD_POLICY_MESSAGE =
  "Password must be at least 8 characters and include an uppercase letter, lowercase letter, number, and special character.";
