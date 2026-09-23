export type PasswordRule =
  | "minimumLength"
  | "uppercase"
  | "lowercase"
  | "number"
  | "specialCharacter"
  | "noSpaces";

export interface PasswordValidationRule {
  readonly code: PasswordRule;
  validate(password: string): boolean;
}

export interface PasswordValidationResult {
  isValid: boolean;
  failures: PasswordRule[];
}

export interface PasswordPolicy {
  validate(password: string): PasswordValidationResult;
}
