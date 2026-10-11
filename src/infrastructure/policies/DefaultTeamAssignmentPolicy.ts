import { AppError, ForbiddenError, ValidationError } from "../../domain/errors/AppError";
import { User } from "../../domain/entities/User";
import { TeamAssignmentPolicy } from "../../domain/policies/TeamAssignmentPolicy";

export class DefaultTeamAssignmentPolicy implements TeamAssignmentPolicy {
  canAssignTeam(actor: User, target: User, teamId: string | null): AppError | null {
    if (actor.role === "leader" && target.role !== "user") {
      return new ForbiddenError("Leaders can manage user accounts only");
    }

    if (actor.role === "leader" && !actor.teamId) {
      return new ForbiddenError("A leader must be assigned to a team first");
    }

    if (!teamId) {
      return new ValidationError("A team ID is required to send an invitation");
    }

    if (target.teamId && target.teamId !== teamId) {
      return new ValidationError("User must leave their current team before joining another");
    }

    return null;
  }
}
