import { AppError } from "../errors/AppError";
import { User } from "../entities/User";

export interface TeamMembershipPolicy {
  canKick(actor: User, target: User): AppError | null;
}
