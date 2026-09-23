import { AppError } from "../errors/AppError";
import { Task } from "../entities/Task";
import { User } from "../entities/User";

export interface TaskDeletionPolicy {
  canDelete(task: Task, actor: User): AppError | null;
}
