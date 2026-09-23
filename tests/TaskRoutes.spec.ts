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
});