import { AppError } from "../../domain/errors/AppError";
import { Task } from "../../domain/entities/Task";
import { User } from "../../domain/entities/User";
import { TaskAccessPolicy } from "../../domain/policies/TaskAccessPolicy";

export class DefaultTaskAccessPolicy implements TaskAccessPolicy {
  canView(task: Task, actor: User): AppError | null {
    if (actor.role === "admin" || actor.role === "leader" || task.ownerId === actor.id) {
      return null;
    }

    return new AppError(403, "You can only view your own tasks");
  }
}
