import { Request, Response, NextFunction } from "express";
import { CreateTask } from "../../application/use-cases/CreateTask";
import { CompleteTask } from "../../application/use-cases/CompleteTask";
import { DeleteTask } from "../../application/use-cases/DeleteTask";
import { GetTasks } from "../../application/use-cases/GetTasks";
import { GetTaskById } from "../../application/use-cases/GetTaskById";
import { User, UserRole } from "../../domain/entities/User";
import { UserRepoInterface } from "../../domain/repositories/UserRepoInterface";
import { AuthenticatedRequest } from "../middleware/authMiddleware";

export class TaskController {
  constructor(
    private createTaskUseCase: CreateTask,
    private completeTaskUseCase: CompleteTask,
    private deleteTaskUseCase: DeleteTask,
    private getTasksUseCase: GetTasks,
    private getTaskByIdUseCase: GetTaskById,
    private userRepository: UserRepoInterface
  ) {}

  private async getActor(req: AuthenticatedRequest): Promise<User> {
    const user = req.userId ? await this.userRepository.findById(req.userId) : null;
    return user ?? new User(req.userId ?? "unknown", "unknown", "", new Date(), req.userRole ?? "user", req.teamId ?? null);
  }

  async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = await this.getActor(req);
      let ownerId = actor.id;
      if (actor.role === "admin" && req.body.ownerId) {
        const owner = await this.userRepository.findById(req.body.ownerId) ?? await this.userRepository.findByEmail(req.body.ownerId);
        if (!owner) throw new Error("Assigned user not found");
        ownerId = owner.id;
      }
      const task = await this.createTaskUseCase.execute(req.body.title, ownerId, actor.id);
      res.status(201).json(task);
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = req.query.limit === undefined ? 10 : Number(req.query.limit);
      const offset = req.query.offset === undefined ? 0 : Number(req.query.offset);

      const actor = await this.getActor(req);
      const tasks = await this.getTasksUseCase.execute(actor, { limit, offset });
      res.status(200).json(tasks);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;

      // Replaced repository call and NotFound check with GetTaskById use case
      const task = await this.getTaskByIdUseCase.execute(id, await this.getActor(req));
      res.status(200).json(task);
    } catch (error) {
      next(error);
    }
  }

  async complete(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const task = await this.completeTaskUseCase.execute(id, await this.getActor(req));
      res.status(200).json(task);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      await this.deleteTaskUseCase.execute(id, await this.getActor(req));
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}