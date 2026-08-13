export const PASSWORD_MIN_LENGTH = 8;

export const PASSWORD_MAX_LENGTH = 128;

export const PASSWORD_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,128}$/;

export const PASSWORD_POLICY_MESSAGE =
  'Password must be 8-128 characters and contain at least one uppercase letter, one lowercase letter, one number, and one special character.';
