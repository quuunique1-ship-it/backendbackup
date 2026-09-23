import { PasswordPolicy, PasswordRule, PasswordValidationResult, PasswordValidationRule } from "../../domain/policies/PasswordPolicy";

export class DefaultPasswordPolicy implements PasswordPolicy {
  constructor(private readonly rules: PasswordValidationRule[] = []) {}

  validate(password: string): PasswordValidationResult {
    const failures: PasswordRule[] = this.rules
      .filter((rule) => !rule.validate(password))
      .map((rule) => rule.code);

    return {
      isValid: failures.length === 0,
      failures,
    };
  }
}
