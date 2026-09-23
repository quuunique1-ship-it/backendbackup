import { TaskRepositoryInterface } from "../../domain/repositories/TaskRepositoryInterface";
import { Task } from "../../domain/entities/Task";

export class InMemoryTaskRepository implements TaskRepositoryInterface {
  public tasks: Task[] = [];

  async save(task: Task): Promise<Task> {
    const index = this.tasks.findIndex((t) => t.id === task.id);
    if (index >= 0) {
      this.tasks[index] = task;
    } else {
      this.tasks.push(task);
    }
    return task;
  }

  async update(task: Task): Promise<Task> {
    const index = this.tasks.findIndex((t) => t.id === task.id);
    if (index < 0) {
      throw new Error("Task not found");
    }

    this.tasks[index] = task;
    return task;
  }

  async findById(id: string): Promise<Task | null> {
    const task = this.tasks.find((t) => t.id === id);
    return task || null;
  }

  async findAll(options?: { limit?: number; offset?: number; ownerIds?: string[] }): Promise<Task[]> {
    const offset = options?.offset || 0;
    const limit = options?.limit || this.tasks.length;
    const tasks = options?.ownerIds?.length
      ? this.tasks.filter((task) => task.ownerId && options.ownerIds?.includes(task.ownerId))
      : this.tasks;
    return tasks.slice(offset, offset + limit);
  }

  async delete(id: string): Promise<void> {
    this.tasks = this.tasks.filter((t) => t.id !== id);
  }
}