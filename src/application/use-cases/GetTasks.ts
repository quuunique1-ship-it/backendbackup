// src/application/use-cases/GetTasks.ts
import { TaskRepositoryInterface } from "../../domain/repositories/TaskRepositoryInterface";
import { Task } from "../../domain/entities/Task";

export interface GetTasksOptions {
  limit?: number;
  offset?: number;
}

export class GetTasks {
  constructor(private taskRepository: TaskRepositoryInterface) {}

  async execute(options?: GetTasksOptions & { ownerIds?: string[] }): Promise<Task[]> {
    return await this.taskRepository.findAll(options);
  }
}