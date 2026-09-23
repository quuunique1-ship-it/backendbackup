"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTaskById = void 0;
const AppError_1 = require("../../domain/errors/AppError");
const AppError_2 = require("../../domain/errors/AppError");
class GetTaskById {
    taskRepository;
    constructor(taskRepository) {
        this.taskRepository = taskRepository;
    }
    async execute(id, actor) {
        const task = await this.taskRepository.findById(id);
        if (!task) {
            throw new AppError_1.NotFoundError(`Task with ID ${id} not found`);
        }
        if (actor.role === "user" && task.ownerId !== actor.id) {
            throw new AppError_2.AppError(403, "You can only view your own tasks");
        }
        return task;
    }
}
exports.GetTaskById = GetTaskById;
