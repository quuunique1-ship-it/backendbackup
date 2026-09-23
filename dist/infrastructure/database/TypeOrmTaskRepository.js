"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypeOrmTaskRepository = void 0;
const Task_1 = require("../../domain/entities/Task");
const TaskModel_1 = require("./TaskModel");
class TypeOrmTaskRepository {
    ormRepository;
    constructor(ormRepository) {
        this.ormRepository = ormRepository;
    }
    // Updated to return Promise<Task> to fulfill ITaskRepository contract
    async save(task) {
        const model = new TaskModel_1.TaskModel();
        model.id = task.id;
        model.title = task.title;
        model.completed = task.completed;
        model.createdAt = task.createdAt;
        model.ownerId = task.ownerId;
        model.createdByUserId = task.createdByUserId;
        model.completedByUserId = task.completedByUserId;
        const savedModel = await this.ormRepository.save(model);
        return new Task_1.Task(savedModel.id, savedModel.title, savedModel.completed, savedModel.createdAt, savedModel.ownerId, savedModel.createdByUserId, savedModel.completedByUserId);
    }
    async findAll(options) {
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
        return models.map((m) => new Task_1.Task(m.id, m.title, m.completed, m.createdAt, m.ownerId, m.createdByUserId, m.completedByUserId));
    }
    async findById(id) {
        const model = await this.ormRepository.findOneBy({ id });
        if (!model)
            return null;
        return new Task_1.Task(model.id, model.title, model.completed, model.createdAt, model.ownerId, model.createdByUserId, model.completedByUserId);
    }
    async update(task) {
        await this.ormRepository.update(task.id, {
            title: task.title,
            completed: task.completed,
            completedByUserId: task.completedByUserId,
        });
        return task;
    }
    async delete(id) {
        await this.ormRepository.delete(id);
    }
}
exports.TypeOrmTaskRepository = TypeOrmTaskRepository;
