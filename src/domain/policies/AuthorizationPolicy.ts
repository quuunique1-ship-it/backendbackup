import { UserRole } from "../entities/User";

export interface AuthorizationPolicy {
  canAccess(role: UserRole, allowedRoles: UserRole[]): boolean;
}
