import { PasswordRule } from "../policies/PasswordPolicy";
import { AppError } from "./AppError";

export class WeakPasswordError extends AppError {
  constructor(public readonly failures: PasswordRule[] = []) {
    super("Password does not meet security requirements");
    this.name = "WeakPasswordError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
