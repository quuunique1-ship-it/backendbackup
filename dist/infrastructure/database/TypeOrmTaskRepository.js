"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypeOrmTaskRepository = void 0;
const typeorm_1 = require("typeorm");
const Task_1 = require("../../domain/entities/Task");
const TaskModel_1 = require("./TaskModel");
class TypeOrmTaskRepository {
    ormRepository;
    constructor(ormRepository) {
        this.ormRepository = ormRepository;
    }
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
        return Task_1.Task.fromPersistence(savedModel.id, savedModel.title, savedModel.completed, savedModel.createdAt, savedModel.ownerId, savedModel.createdByUserId, savedModel.completedByUserId);
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
        return models.map((m) => Task_1.Task.fromPersistence(m.id, m.title, m.completed, m.createdAt, m.ownerId, m.createdByUserId, m.completedByUserId));
    }
    async findById(id) {
        const model = await this.ormRepository.findOneBy({ id });
        if (!model)
            return null;
        return Task_1.Task.fromPersistence(model.id, model.title, model.completed, model.createdAt, model.ownerId, model.createdByUserId, model.completedByUserId);
    }
    async update(task) {
        await this.ormRepository.update(task.id, {
            title: task.title,
            completed: task.completed,
            completedByUserId: task.completedByUserId,
        });
        return task;
    }
    async delete(id, expectedOwnerId) {
        if (expectedOwnerId === undefined) {
            const result = await this.ormRepository.delete(id);
            return (result.affected ?? 0) > 0;
        }
        const result = expectedOwnerId === null
            ? await this.ormRepository.delete({ id, ownerId: (0, typeorm_1.IsNull)() })
            : await this.ormRepository.delete({ id, ownerId: expectedOwnerId });
        return (result.affected ?? 0) > 0;
    }
}
exports.TypeOrmTaskRepository = TypeOrmTaskRepository;
