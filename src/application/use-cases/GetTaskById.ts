// src/application/use-cases/GetTaskById.ts
import { TaskRepositoryInterface } from "../../domain/repositories/TaskRepositoryInterface";
import { Task } from "../../domain/entities/Task";
import { NotFoundError } from "../../domain/errors/AppError";
import { User } from "../../domain/entities/User";
import { TaskAccessPolicy } from "../../domain/policies/TaskAccessPolicy";

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
    private taskAccessPolicy: TaskAccessPolicy
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