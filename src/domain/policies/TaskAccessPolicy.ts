import { AppError } from "../errors/AppError";
import { Task } from "../entities/Task";
import { User } from "../entities/User";

export interface TaskAccessPolicy {
  canView(task: Task, actor: User): AppError | null;
}
