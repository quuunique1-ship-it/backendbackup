import "reflect-metadata";
import { describe, it, expect } from "vitest";
import { DataSource } from "typeorm";
import { TaskModel } from "../src/infrastructure/database/TaskModel";
import { TypeOrmTaskRepository } from "../src/infrastructure/database/TypeOrmTaskRepository";
import { InMemoryTaskRepository } from "../src/infrastructure/repositories/InMemoryTaskRepository";
import { CreateTask } from "../src/application/use-cases/CreateTask";

describe("Performance Benchmark: Isolated vs Database", () => {
  const ITERATIONS = 100;

  it("measures execution time: InMemory vs SQLite Database", async () => {
    // 1. Setup InMemory (Isolated)
    const inMemoryRepo = new InMemoryTaskRepository();
    const isolatedUseCase = new CreateTask(inMemoryRepo);

    // 2. Setup TypeORM with SQLite (Database)
    const testDataSource = new DataSource({
      type: "better-sqlite3",
      database: ":memory:", // Fast in-memory SQLite instance
      synchronize: true,
      entities: [TaskModel],
    });
    await testDataSource.initialize();

    const ormRepo = testDataSource.getRepository(TaskModel);
    const dbRepo = new TypeOrmTaskRepository(ormRepo);
    const databaseUseCase = new CreateTask(dbRepo);

    // --- Benchmark Isolated (InMemory) ---
    const startMemory = performance.now();
    for (let i = 0; i < ITERATIONS; i++) {
      await isolatedUseCase.execute(`Memory Task ${i}`);
    }
    const endMemory = performance.now();
    const memoryDuration = endMemory - startMemory;

    // --- Benchmark Un-isolated (Database) ---
    const startDb = performance.now();
    for (let i = 0; i < ITERATIONS; i++) {
      await databaseUseCase.execute(`DB Task ${i}`);
    }
    const endDb = performance.now();
    const dbDuration = endDb - startDb;

    // Clean up DB connection
    await testDataSource.destroy();

    // Log the results cleanly
    console.log("\n================ BENCHMARK RESULTS ================");
    console.log(`⚡ Isolated (InMemory): ${memoryDuration.toFixed(2)} ms (${ITERATIONS} ops)`);
    console.log(`🐢 Un-isolated (SQLite): ${dbDuration.toFixed(2)} ms (${ITERATIONS} ops)`);
    console.log(`🚀 Isolated logic is ~${(dbDuration / memoryDuration).toFixed(1)}x faster!`);
    console.log("===================================================\n");

    expect(memoryDuration).toBeLessThan(dbDuration);
  });
});