// src/application/use-cases/GetTaskById.ts
import { TaskRepositoryInterface } from "../../domain/repositories/TaskRepositoryInterface";
import { Task } from "../../domain/entities/Task";
import { NotFoundError } from "../../domain/errors/AppError";
import { User } from "../../domain/entities/User";
import { AppError } from "../../domain/errors/AppError";

export class GetTaskById {
  constructor(private taskRepository: TaskRepositoryInterface) {}

  async execute(id: string, actor: User): Promise<Task> {
    const task = await this.taskRepository.findById(id);

    if (!task) {
      throw new NotFoundError(`Task with ID ${id} not found`);
    }

    if (actor.role === "user" && task.ownerId !== actor.id) {
      throw new AppError(403, "You can only view your own tasks");
    }

    return task;
  }
}