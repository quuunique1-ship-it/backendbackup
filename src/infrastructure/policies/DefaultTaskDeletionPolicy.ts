import { AppError, ForbiddenError } from "../../domain/errors/AppError";
import { Task } from "../../domain/entities/Task";
import { User } from "../../domain/entities/User";
import { TaskDeletionPolicy } from "../../domain/policies/TaskDeletionPolicy";

export class DefaultTaskDeletionPolicy implements TaskDeletionPolicy {
  canDelete(task: Task, actor: User): AppError | null {
    if (actor.role === "admin" || task.ownerId === actor.id) {
      return null;
    }

    return new ForbiddenError("You can only delete your own tasks");
  }
}
