import { Repository } from "typeorm";
import { Task } from "../../domain/entities/Task";
import { TaskRepositoryInterface, PaginationOptions } from "../../domain/repositories/TaskRepositoryInterface";
import { TaskModel } from "./TaskModel";

export class TypeOrmTaskRepository implements TaskRepositoryInterface {
  constructor(private ormRepository: Repository<TaskModel>) {}

  // Updated to return Promise<Task> to fulfill ITaskRepository contract
  async save(task: Task): Promise<Task> {
    const model = new TaskModel();
    model.id = task.id;
    model.title = task.title;
    model.completed = task.completed;
    model.createdAt = task.createdAt;
    model.ownerId = task.ownerId;
    model.createdByUserId = task.createdByUserId;
    model.completedByUserId = task.completedByUserId;

    const savedModel = await this.ormRepository.save(model);

    return Task.fromPersistence(
      savedModel.id,
      savedModel.title,
      savedModel.completed,
      savedModel.createdAt,
      savedModel.ownerId,
      savedModel.createdByUserId,
      savedModel.completedByUserId
    );
  }

  async findAll(options?: PaginationOptions): Promise<Task[]> {
    const limit = options?.limit ?? 10;
    const offset = options?.offset ?? 0;

    const models = await this.ormRepository.find({
      take: limit,
      skip: offset,
      order: { createdAt: "DESC" },
      where: options?.ownerIds?.length
        ? options.ownerIds.map((ownerId) => ({ ownerId }))
        : undefined,
    });

    return models.map(
      (m) => Task.fromPersistence(m.id, m.title, m.completed, m.createdAt, m.ownerId, m.createdByUserId, m.completedByUserId)
    );
  }

  async findById(id: string): Promise<Task | null> {
    const model = await this.ormRepository.findOneBy({ id });
    if (!model) return null;

    return Task.fromPersistence(model.id, model.title, model.completed, model.createdAt, model.ownerId, model.createdByUserId, model.completedByUserId);
  }

  async update(task: Task): Promise<Task> {
    await this.ormRepository.update(task.id, {
      title: task.title,
      completed: task.completed,
      completedByUserId: task.completedByUserId,
    });
    return task;
  }

  async delete(id: string): Promise<void> {
    await this.ormRepository.delete(id);
  }
}