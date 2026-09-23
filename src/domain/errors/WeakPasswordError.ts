import { PasswordRule } from "../policies/PasswordPolicy";

export class WeakPasswordError extends Error {
  constructor(public readonly failures: PasswordRule[] = []) {
    super("Password does not meet security requirements");
    this.name = "WeakPasswordError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
