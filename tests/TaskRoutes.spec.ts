import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { createApp } from "../src/app";
import { config } from "../src/infrastructure/config/env.js";
import { InMemoryTaskRepository } from "../src/infrastructure/repositories/InMemoryTaskRepository";

describe("Task HTTP Endpoints (Supertest)", () => {
  let app: ReturnType<typeof createApp>;
  let repository: InMemoryTaskRepository;
  let token: string;

  beforeEach(() => {
    repository = new InMemoryTaskRepository();
    app = createApp(repository);
    token = jwt.sign({ userId: "test-user-123" }, config.JWT_SECRET);
  });

  it("POST /tasks - should create a task and return 201 Created", async () => {
    const res = await request(app)
      .post("/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Test API with Supertest" });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.title).toBe("Test API with Supertest");
    expect(res.body.completed).toBe(false);
  });

  it("GET /health - returns ok when the database responds", async () => {
    const healthyApp = createApp(repository, undefined, async () => undefined);

    const res = await request(healthyApp).get("/health");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("GET /health - returns service unavailable when the database ping fails", async () => {
    const unavailableApp = createApp(repository, undefined, async () => {
      throw new Error("Database is unreachable");
    });

    const res = await request(unavailableApp).get("/health");

    expect(res.status).toBe(503);
    expect(res.body).toEqual({ status: "unavailable" });
  });

  it("POST /tasks - should fail validation (400) if title is missing", async () => {
    const res = await request(app)
      .post("/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({}); // Invalid body according to Zod DTO

    expect(res.status).toBe(400);
  });

  it("GET /tasks/:id - should handle AppError via global errorHandler and return 404", async () => {
    const res = await request(app)
      .get("/tasks/non-existent-id")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it("DELETE /tasks/:id - should reject deletion when the current stored state no longer matches the actor", async () => {
    const taskRepository = new InMemoryTaskRepository();
    const actor = { id: "owner-1", role: "user" } as any;
    const task = {
      id: "task-1",
      title: "Owned by owner-1",
      completed: false,
      createdAt: new Date(),
      ownerId: "owner-1",
      createdByUserId: "owner-1",
      completedByUserId: null,
    } as any;

    await taskRepository.save(task);
    taskRepository.tasks[0].ownerId = "owner-2";

    const { DeleteTask } = await import("../src/application/use-cases/DeleteTask");
    const { DefaultTaskDeletionPolicy } = await import("../src/infrastructure/policies/DefaultTaskDeletionPolicy");
    const deleteTaskUseCase = new DeleteTask(taskRepository, new DefaultTaskDeletionPolicy());

    await expect(deleteTaskUseCase.execute("task-1", actor)).rejects.toMatchObject({
      name: "ForbiddenError",
      message: "You can only delete your own tasks",
    });
  });
});