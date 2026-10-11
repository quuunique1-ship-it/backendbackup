import { TaskRepositoryInterface } from "../../domain/repositories/TaskRepositoryInterface";
import { User } from "../../domain/entities/User";
import { Logger, silentLogger } from "../ports/Logger.js";

export interface GetTasksDTO {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
  ownerId: string | null;
  createdByUserId: string | null;
  completedByUserId: string | null;
}

export interface GetTasksOptions {
  limit?: number;
  offset?: number;
}

export class GetTasks {
  constructor(private taskRepository: TaskRepositoryInterface, private logger: Logger = silentLogger) {}

  async execute(actor: User, options?: GetTasksOptions): Promise<GetTasksDTO[]> {
    const limit = options?.limit ?? 10;
    const offset = options?.offset ?? 0;

    const ownerIds = actor.role === "admin" ? undefined : [actor.id];

    const tasks = await this.taskRepository.findAll({
      limit,
      offset,
      ownerIds,
    });

    this.logger.info({ userId: actor.id, taskCount: tasks.length, limit, offset }, "Tasks retrieved successfully");

    return tasks.map((task) => ({
      id: task.id,
      title: task.title,
      completed: task.completed,
      createdAt: task.createdAt,
      ownerId: task.ownerId,
      createdByUserId: task.createdByUserId,
      completedByUserId: task.completedByUserId,
    }));
  }
}