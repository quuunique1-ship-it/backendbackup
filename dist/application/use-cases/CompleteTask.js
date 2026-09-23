"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompleteTask = void 0;
const AppError_1 = require("../../domain/errors/AppError");
class CompleteTask {
    taskRepository;
    userRepository;
    constructor(taskRepository, userRepository) {
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
    }
    async execute(id, actor) {
        const task = await this.taskRepository.findById(id);
        if (!task) {
            throw new Error("Task not found");
        }
        if (actor.role === "user") {
            throw new AppError_1.AppError(403, "A leader or admin must approve task completion");
        }
        if (actor.role === "leader") {
            if (!actor.teamId) {
                throw new AppError_1.AppError(403, "A leader must be assigned to a team first");
            }
            const owner = task.ownerId ? await this.userRepository.findById(task.ownerId) : null;
            if (!owner || owner.teamId !== actor.teamId) {
                throw new AppError_1.AppError(403, "Leaders can only complete tasks assigned to their team");
            }
        }
        task.markAsCompleted(actor.id);
        return await this.taskRepository.update(task);
    }
}
exports.CompleteTask = CompleteTask;
