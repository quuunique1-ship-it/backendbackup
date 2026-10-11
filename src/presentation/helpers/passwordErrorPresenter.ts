import { PasswordRule } from "../../domain/policies/PasswordPolicy";

export function mapPasswordFailuresToMessage(failures: PasswordRule[]): string {
  const hasDefaultPolicyFailures = failures.some((failure) =>
    ["minimumLength", "uppercase", "lowercase", "number", "specialCharacter"].includes(failure)
  );

  if (hasDefaultPolicyFailures) {
    return "Password must be at least 8 characters long and include uppercase, lowercase, a number, and a special character.";
  }

  if (failures.includes("noSpaces")) {
    return "Password cannot contain spaces.";
  }

  return "Password does not meet security requirements.";
}
