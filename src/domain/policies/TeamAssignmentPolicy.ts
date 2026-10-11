import { AppError } from "../errors/AppError";
import { User } from "../entities/User";

export interface TeamAssignmentPolicy {
  canAssignTeam(actor: User, target: User, teamId: string | null): AppError | null;
}
