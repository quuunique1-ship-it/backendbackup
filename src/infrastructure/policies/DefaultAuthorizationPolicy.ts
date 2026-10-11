import { UserRole } from "../../domain/entities/User";
import { AuthorizationPolicy } from "../../domain/policies/AuthorizationPolicy";

export class DefaultAuthorizationPolicy implements AuthorizationPolicy {
  canAccess(role: UserRole, allowedRoles: UserRole[]): boolean {
    return allowedRoles.includes(role);
  }
}
