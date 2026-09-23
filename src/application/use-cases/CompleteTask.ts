import {Task} from "../../domain/entities/Task";
import {TaskRepositoryInterface} from "../../domain/repositories/TaskRepositoryInterface"
import { User } from "../../domain/entities/User";
import { AppError } from "../../domain/errors/AppError";
import { UserRepoInterface } from "../../domain/repositories/UserRepoInterface";

export class CompleteTask {
    constructor(
        private taskRepository: TaskRepositoryInterface,
        private userRepository: UserRepoInterface
    ) {}

    async execute(id: string, actor: User): Promise<Task> {
        const task = await this.taskRepository.findById(id);
        if(!task){
            throw new Error("Task not found");
        }

        if (!task.ownerId) {
            throw new AppError(400, "task has no owner");
        }

        const owner = await this.userRepository.findById(task.ownerId);
        if (!owner) {
            throw new AppError(400, "task has no owner");
        }

        if (actor.role === "user") {
            throw new AppError(403, "A leader or admin must approve task completion");
        }

        if (actor.role === "leader") {
            if (!actor.teamId) {
                throw new AppError(403, "A leader must be assigned to a team first");
            }
            if (owner.teamId !== actor.teamId) {
                throw new AppError(403, "Leaders can only complete tasks assigned to their team");
            }
        } else if (actor.role !== "admin") {
            throw new AppError(403, "Only leader or admin roles can complete tasks");
        }

        task.markAsCompleted(actor.id);
        return await this.taskRepository.update(task);
    }
}