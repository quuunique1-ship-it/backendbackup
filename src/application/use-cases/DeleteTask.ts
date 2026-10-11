import { TaskRepositoryInterface } from "../../domain/repositories/TaskRepositoryInterface";
import { User } from "../../domain/entities/User";
import { AppError, ConflictError, NotFoundError } from "../../domain/errors/AppError";
import { TaskDeletionPolicy } from "../../domain/policies/TaskDeletionPolicy";
import { Logger, silentLogger } from "../ports/Logger.js";

export class DeleteTask {
  constructor(
    private taskRepository: TaskRepositoryInterface,
    private taskDeletionPolicy: TaskDeletionPolicy,
    private logger: Logger = silentLogger
  ) {}

  async execute(id: string, actor: User): Promise<void> {
    const task = await this.taskRepository.findById(id);
    if (!task) {
      throw new NotFoundError(`Task with ID ${id} not found`);
    }

    const denial = this.taskDeletionPolicy.canDelete(task, actor);
    if (denial) {
      throw denial;
    }

    const deleted = await this.taskRepository.delete(id, task.ownerId);
    if (!deleted) {
      throw new ConflictError("Task was changed before deletion completed");
    }
    this.logger.info({ taskId: id, userId: actor.id }, "Task deleted successfully");
  }
}