import { UserRepoInterface } from "../../domain/repositories/UserRepoInterface";
import { TeamMembershipPolicy } from "../../domain/policies/TeamMembershipPolicy";
import { NotFoundError, ValidationError } from "../../domain/errors/AppError";
import { Logger, silentLogger } from "../ports/Logger.js";

export interface KickUserFromTeamInput {
  actorId: string;
  targetId: string;
}

export class KickUserFromTeam {
  constructor(
    private readonly userRepository: UserRepoInterface,
    private readonly teamMembershipPolicy: TeamMembershipPolicy,
    private readonly logger: Logger = silentLogger
  ) {}

  async execute({ actorId, targetId }: KickUserFromTeamInput): Promise<{ id: string; teamId: string | null }> {
    const actor = await this.userRepository.findById(actorId);
    if (!actor) {
      throw new NotFoundError("Actor not found");
    }

    const target = await this.userRepository.findById(targetId);
    if (!target) {
      throw new NotFoundError("Target user not found");
    }

    const denial = this.teamMembershipPolicy.canKick(actor, target);
    if (denial) {
      throw denial;
    }

    if (!target.teamId) {
      throw new ValidationError("User is not in a team");
    }

    const oldTeamName = target.teamName;
    const teamId = target.teamId;
    const updated = await this.userRepository.leaveTeam(target.id);
    await this.userRepository.addNotification(target.id, `leave|You were removed from ${oldTeamName || "the team"}.`);
    this.logger.info({ userId: actorId, targetUserId: updated.id, teamId }, "User removed from team successfully");

    return {
      id: updated.id,
      teamId: updated.teamId,
    };
  }
}
