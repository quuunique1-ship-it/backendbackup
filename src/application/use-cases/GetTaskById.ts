// src/application/use-cases/GetTaskById.ts
import { TaskRepositoryInterface } from "../../domain/repositories/TaskRepositoryInterface";
import { Task } from "../../domain/entities/Task";
import { NotFoundError } from "../../domain/errors/AppError";
import { User } from "../../domain/entities/User";
import { TaskAccessPolicy } from "../../domain/policies/TaskAccessPolicy";
import { Logger, silentLogger } from "../ports/Logger.js";

export interface GetTaskByIdDTO {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
  ownerId: string | null;
  createdByUserId: string | null;
  completedByUserId: string | null;
}

export class GetTaskById {
  constructor(
    private taskRepository: TaskRepositoryInterface,
    private taskAccessPolicy: TaskAccessPolicy,
    private logger: Logger = silentLogger
  ) {}

  async execute(id: string, actor: User): Promise<GetTaskByIdDTO> {
    const task = await this.taskRepository.findById(id);

    if (!task) {
      throw new NotFoundError(`Task with ID ${id} not found`);
    }

    const denial = this.taskAccessPolicy.canView(task, actor);
    if (denial) {
      throw denial;
    }

    this.logger.info({ taskId: task.id, userId: actor.id }, "Task retrieved successfully");

    return {
      id: task.id,
      title: task.title,
      completed: task.completed,
      createdAt: task.createdAt,
      ownerId: task.ownerId,
      createdByUserId: task.createdByUserId,
      completedByUserId: task.completedByUserId,
    };
  }
}