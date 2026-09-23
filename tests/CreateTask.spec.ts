import { describe, it, expect, beforeEach } from "vitest";
import { CreateTask } from "../src/application/use-cases/CreateTask";
import { InMemoryTaskRepository } from "../src/infrastructure/repositories/InMemoryTaskRepository";
import { SystemClock } from "../src/infrastructure/services/SystemClock";
import { UuidIdGenerator } from "../src/infrastructure/services/UuidIdGenerator";

describe("CreateTask Use Case", () => {
  let repository: InMemoryTaskRepository;
  let useCase: CreateTask;

  beforeEach(() => {
    repository = new InMemoryTaskRepository();
    useCase = new CreateTask(repository, new UuidIdGenerator(), new SystemClock());
  });

  it("should successfully create and save a new task", async () => {
    const task = await useCase.execute("Buy groceries");

    expect(task.id).toBeDefined();
    expect(task.title).toBe("Buy groceries");
    expect(task.completed).toBe(false);

    // Verify it was saved inside our in-memory array
    expect(repository.tasks.length).toBe(1);
    expect(repository.tasks[0].title).toBe("Buy groceries");
  });
});