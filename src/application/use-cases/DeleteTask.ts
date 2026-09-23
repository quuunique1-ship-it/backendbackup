import { TaskRepositoryInterface } from "../../domain/repositories/TaskRepositoryInterface";
import { User } from "../../domain/entities/User";
import { AppError } from "../../domain/errors/AppError";
import { TaskDeletionPolicy } from "../../domain/policies/TaskDeletionPolicy";

export class DeleteTask {
  constructor(
    private taskRepository: TaskRepositoryInterface,
    private taskDeletionPolicy: TaskDeletionPolicy
  ) {}

  async execute(id: string, actor: User): Promise<void> {
    const task = await this.taskRepository.findById(id);
    if (!task) {
      throw new Error("Task not found");
    }

    const denial = this.taskDeletionPolicy.canDelete(task, actor);
    if (denial) {
      throw denial;
    }

    await this.taskRepository.delete(id);
  }
}