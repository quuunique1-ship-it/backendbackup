import { AppError, ForbiddenError } from "../../domain/errors/AppError";
import { Task } from "../../domain/entities/Task";
import { User } from "../../domain/entities/User";
import { TaskCompletionPolicy } from "../../domain/policies/TaskCompletionPolicy";

export class DefaultTaskCompletionPolicy implements TaskCompletionPolicy {
  canComplete(task: Task, actor: User, owner: User): AppError | null {
    if (actor.role === "user") {
      return new ForbiddenError("A leader or admin must approve task completion");
    }

    if (actor.role === "leader") {
      if (!actor.teamId) {
        return new ForbiddenError("A leader must be assigned to a team first");
      }
      if (owner.teamId !== actor.teamId) {
        return new ForbiddenError("Leaders can only complete tasks assigned to their team");
      }
      return null;
    }

    if (actor.role !== "admin") {
      return new ForbiddenError("Only leader or admin roles can complete tasks");
    }

    return null;
  }
}
