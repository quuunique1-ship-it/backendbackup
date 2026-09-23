import { TaskRepositoryInterface } from "../../domain/repositories/TaskRepositoryInterface";
import { User } from "../../domain/entities/User";
import { AppError } from "../../domain/errors/AppError";

export class DeleteTask {
  constructor(private taskRepository: TaskRepositoryInterface) {}

  async execute(id: string, actor: User): Promise<void> {
    const task = await this.taskRepository.findById(id);
    if (!task) {
      throw new Error("Task not found");
    }

    if (actor.role !== "admin" && task.ownerId !== actor.id) {
      throw new AppError(403, "You can only delete your own tasks");
    }
    await this.taskRepository.delete(id);
  }
}