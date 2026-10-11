import { AppError, ForbiddenError, ValidationError } from "../../domain/errors/AppError";
import { User } from "../../domain/entities/User";
import { TeamMembershipPolicy } from "../../domain/policies/TeamMembershipPolicy";

export class DefaultTeamMembershipPolicy implements TeamMembershipPolicy {
  canKick(actor: User, target: User): AppError | null {
    if (actor.id === target.id) {
      return new ForbiddenError("You cannot kick yourself. Leave the team instead.");
    }

    if (actor.role === "admin") {
      return null;
    }

    if (actor.role === "leader" && target.role === "admin") {
      return new ForbiddenError("Leaders cannot kick admins");
    }

    if (!target.teamId) {
      return new ValidationError("User is not in a team");
    }

    if (actor.role === "leader" && target.teamId !== actor.teamId) {
      return new ForbiddenError("You can only kick users in your own team");
    }

    return null;
  }
}
