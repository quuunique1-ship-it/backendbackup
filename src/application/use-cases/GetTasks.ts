import { TaskRepositoryInterface } from "../../domain/repositories/TaskRepositoryInterface";
import { User } from "../../domain/entities/User";

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
  constructor(private taskRepository: TaskRepositoryInterface) {}

  async execute(actor: User, options?: GetTasksOptions): Promise<GetTasksDTO[]> {
    const limit = options?.limit ?? 10;
    const offset = options?.offset ?? 0;

    const ownerIds = actor.role === "admin" ? undefined : [actor.id];

    const tasks = await this.taskRepository.findAll({
      limit,
      offset,
      ownerIds,
    });

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