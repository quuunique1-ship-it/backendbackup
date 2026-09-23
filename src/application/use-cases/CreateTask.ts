import { Task } from "../../domain/entities/Task";
import { TaskRepositoryInterface } from "../../domain/repositories/TaskRepositoryInterface";

export class CreateTask {
  constructor(private taskRepository: TaskRepositoryInterface) {}

  async execute(title: string, ownerId = "system", createdByUserId = "system"): Promise<Task> {
    const taskId = Date.now().toString();

    const newTask = new Task(taskId, title, false, new Date(), ownerId, createdByUserId);

    const savedTask = await this.taskRepository.save(newTask);

    return savedTask;
  }
}