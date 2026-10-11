import { Task } from "../../domain/entities/Task";
import { Clock } from "../../domain/ports/Clock";
import { IdGenerator } from "../../domain/ports/IdGenerator";
import { TaskRepositoryInterface } from "../../domain/repositories/TaskRepositoryInterface";
import { Logger, silentLogger } from "../ports/Logger.js";

export interface CreateTaskDTO {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
  ownerId: string | null;
  createdByUserId: string | null;
  completedByUserId: string | null;
}

export class CreateTask {
  constructor(
    private taskRepository: TaskRepositoryInterface,
    private idGenerator: IdGenerator,
    private clock: Clock,
    private logger: Logger = silentLogger
  ) {}

  async execute(title: string, ownerId = "system", createdByUserId = "system"): Promise<CreateTaskDTO> {
    const taskId = this.idGenerator.generate();
    const createdAt = this.clock.now();

    const newTask = Task.create(title, taskId, createdAt, ownerId, createdByUserId);

    const savedTask = await this.taskRepository.save(newTask);
    this.logger.info(
      { taskId: savedTask.id, userId: createdByUserId, ownerId: savedTask.ownerId },
      "Task created successfully"
    );
    return {
      id: savedTask.id,
      title: savedTask.title,
      completed: savedTask.completed,
      createdAt: savedTask.createdAt,
      ownerId: savedTask.ownerId,
      createdByUserId: savedTask.createdByUserId,
      completedByUserId: savedTask.completedByUserId,
    };
  }
}