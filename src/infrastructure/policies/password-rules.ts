import { PasswordValidationRule } from "../../domain/policies/PasswordPolicy";

export class MinimumLengthRule implements PasswordValidationRule {
  readonly code = "minimumLength" as const;

  constructor(private readonly minLength: number) {}

  validate(password: string): boolean {
    return password.length >= this.minLength;
  }
}

export class UppercaseRule implements PasswordValidationRule {
  readonly code = "uppercase" as const;

  validate(password: string): boolean {
    return /[A-Z]/.test(password);
  }
}

export class LowercaseRule implements PasswordValidationRule {
  readonly code = "lowercase" as const;

  validate(password: string): boolean {
    return /[a-z]/.test(password);
  }
}

export class NumberRule implements PasswordValidationRule {
  readonly code = "number" as const;

  validate(password: string): boolean {
    return /\d/.test(password);
  }
}

export class SpecialCharacterRule implements PasswordValidationRule {
  readonly code = "specialCharacter" as const;

  validate(password: string): boolean {
    return /[^A-Za-z0-9]/.test(password);
  }
}

export class NoSpacesRule implements PasswordValidationRule {
  readonly code = "noSpaces" as const;

  validate(password: string): boolean {
    return !password.includes(" ");
  }
}
