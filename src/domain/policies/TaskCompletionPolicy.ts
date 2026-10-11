import { AppError } from "../errors/AppError";
import { Task } from "../entities/Task";
import { User } from "../entities/User";

export interface TaskCompletionPolicy {
  canComplete(task: Task, actor: User, owner: User): AppError | null;
}
