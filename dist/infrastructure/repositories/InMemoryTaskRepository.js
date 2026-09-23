"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryTaskRepository = void 0;
class InMemoryTaskRepository {
    tasks = [];
    async save(task) {
        const index = this.tasks.findIndex((t) => t.id === task.id);
        if (index >= 0) {
            this.tasks[index] = task;
        }
        else {
            this.tasks.push(task);
        }
        return task;
    }
    async update(task) {
        const index = this.tasks.findIndex((t) => t.id === task.id);
        if (index < 0) {
            throw new Error("Task not found");
        }
        this.tasks[index] = task;
        return task;
    }
    async findById(id) {
        const task = this.tasks.find((t) => t.id === id);
        return task || null;
    }
    async findAll(options) {
        const offset = options?.offset || 0;
        const limit = options?.limit || this.tasks.length;
        const tasks = options?.ownerIds?.length
            ? this.tasks.filter((task) => task.ownerId && options.ownerIds?.includes(task.ownerId))
            : this.tasks;
        return tasks.slice(offset, offset + limit);
    }
    async delete(id) {
        this.tasks = this.tasks.filter((t) => t.id !== id);
    }
}
exports.InMemoryTaskRepository = InMemoryTaskRepository;
