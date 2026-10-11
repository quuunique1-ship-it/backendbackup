import {Task} from "../../domain/entities/Task";
import {TaskRepositoryInterface} from "../../domain/repositories/TaskRepositoryInterface"
import { User } from "../../domain/entities/User";
import { AppError, ValidationError } from "../../domain/errors/AppError";
import { UserRepoInterface } from "../../domain/repositories/UserRepoInterface";
import { TaskCompletionPolicy } from "../../domain/policies/TaskCompletionPolicy";
import { Logger, silentLogger } from "../ports/Logger.js";

export class CompleteTask {
    constructor(
        private taskRepository: TaskRepositoryInterface,
        private userRepository: UserRepoInterface,
        private taskCompletionPolicy: TaskCompletionPolicy,
        private logger: Logger = silentLogger
    ) {}

    async execute(id: string, actor: User): Promise<Task> {
        const task = await this.taskRepository.findById(id);
        if(!task){
            throw new Error("Task not found");
        }

        if (!task.ownerId) {
            throw new ValidationError("task has no owner");
        }

        const owner = await this.userRepository.findById(task.ownerId);
        if (!owner) {
            throw new ValidationError("task has no owner");
        }

        const denial = this.taskCompletionPolicy.canComplete(task, actor, owner);
        if (denial) {
            throw denial;
        }

        task.markAsCompleted(actor.id);
        const completedTask = await this.taskRepository.update(task);
        this.logger.info({ taskId: completedTask.id, userId: actor.id }, "Task completed successfully");
        return completedTask;
    }
}