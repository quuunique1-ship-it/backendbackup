import { Task } from "../entities/Task";

export interface PaginationOptions {
  limit: number;
  offset: number;
  ownerIds?: string[];
}
export interface TaskRepositoryInterface {
  save(task: Task): Promise<Task>;
  update(task: Task): Promise<Task>;
  findById(id: string): Promise<Task | null>;
  findAll(options?: { limit?: number; offset?: number; ownerIds?: string[] }): Promise<Task[]>;
  delete(id: string): Promise<void>;
}