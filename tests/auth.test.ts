import { describe, it, expect, beforeAll } from "vitest";
import express from "express";
import bcrypt from "bcryptjs";
import request from "supertest";
import jwt from "jsonwebtoken";
import { vi } from "vitest";
import { createApp } from "../src/app.js";
import { LoginUser } from "../src/application/use-cases/LoginUser.js";
import { User } from "../src/domain/entities/User.js";
import { authMiddleware } from "../src/presentation/middleware/authMiddleware.js";
import { InMemoryTaskRepository } from "../src/infrastructure/repositories/InMemoryTaskRepository.js";
import { InMemoryUserRepository } from "../src/infrastructure/repositories/InMemoryUserRepository.js";
import { config } from "../src/infrastructure/config/env.js";

describe("Auth Integration Tests", () => {
  let app: ReturnType<typeof createApp>;
  let userToken: string;

  const testUser = {
    email: "testuser@example.com",
    password: "Password123!",
  };

  beforeAll(() => {
    app = createApp(new InMemoryTaskRepository(), new InMemoryUserRepository());
  });

  // 1. REGISTER
  it("POST /auth/register - should create a new user", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send(testUser);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body).toHaveProperty("email", testUser.email);
    expect(res.body).not.toHaveProperty("passwordHash");
  });

  it("POST /auth/register - should reject a duplicate email", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send(testUser);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error", "Email already in use");
  });

  it("POST /auth/register - should reject weak passwords", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ email: "weakpass@example.com", password: "short" });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error", "Password must be at least 8 characters long and include uppercase, lowercase, a number, and a special character.");
  });

  it("POST /auth/register - should persist a leader role choice", async () => {
    await request(app)
      .post("/auth/register")
      .send({ email: "leader@example.com", password: "Password123!", role: "leader" });

    const res = await request(app)
      .post("/auth/login")
      .send({ email: "leader@example.com", password: "Password123!" });

    expect(res.status).toBe(200);
    expect(res.body.role).toBe("leader");

    const leaderToken = res.body.token;
    const createdTeam = await request(app)
      .post("/api/leader/team")
      .set("Authorization", `Bearer ${leaderToken}`)
      .send({ teamName: "Night Shift" });
    expect(createdTeam.status).toBe(201);
    expect(createdTeam.body.teamName).toBe("Night Shift");

    const team = await request(app)
      .get("/api/leader/users")
      .set("Authorization", `Bearer ${leaderToken}`);
    expect(team.status).toBe(200);
    expect(team.body).toEqual([]);
  });

  it("admin can manage roles and assign tasks while users cannot complete them", async () => {
    const adminEmail = config.ADMIN_EMAIL;
    const adminPassword = config.ADMIN_PASSWORD;
    const adminLogin = await request(app).post("/auth/login").send({ email: "admin", password: adminPassword });
    const adminToken = adminLogin.body.token;

    expect(adminLogin.status).toBe(200);
    expect(adminLogin.body.role).toBe("admin");
    expect(adminLogin.body.email).toBe(adminEmail);

    const member = await request(app)
      .post("/auth/register")
      .send({ email: "member@example.com", password: "Password123!" });

    const roleUpdate = await request(app)
      .patch(`/api/admin/users/${member.body.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ role: "user", teamId: "team-a" });
    expect(roleUpdate.status).toBe(200);

    const invitee = await request(app)
      .post("/auth/register")
      .send({ email: "invitee@example.com", password: "Password123!" });
    const invite = await request(app)
      .patch(`/api/leader/users/${invitee.body.id}/team`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ teamId: "team-a" });
    expect(invite.status).toBe(200);
    expect(invite.body.pendingTeamId).toBe("team-a");

    const inviteeLogin = await request(app)
      .post("/auth/login")
      .send({ email: "invitee@example.com", password: "Password123!" });
    const pendingInvite = await request(app)
      .get("/api/team/invites")
      .set("Authorization", `Bearer ${inviteeLogin.body.token}`);
    expect(pendingInvite.body.pendingTeamId).toBe("team-a");

    const acceptedInvite = await request(app)
      .post("/api/team/invites/accept")
      .set("Authorization", `Bearer ${inviteeLogin.body.token}`);
    expect(acceptedInvite.body.teamId).toBe("team-a");

    const task = await request(app)
      .post("/tasks")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ title: "Admin assignment", ownerId: "member@example.com" });
    expect(task.status).toBe(201);
    expect(task.body.ownerId).toBe(member.body.id);

    const memberLogin = await request(app)
      .post("/auth/login")
      .send({ email: "member@example.com", password: "Password123!" });
    const completion = await request(app)
      .patch(`/tasks/${task.body.id}/complete`)
      .set("Authorization", `Bearer ${memberLogin.body.token}`);
    expect(completion.status).toBe(403);

    const leave = await request(app)
      .post("/api/team/leave")
      .set("Authorization", `Bearer ${inviteeLogin.body.token}`);
    expect(leave.status).toBe(200);

    const remainingMembers = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`);
    const departedUser = remainingMembers.body.find((user: { id: string }) => user.id === invitee.body.id);
    expect(departedUser.teamId).toBeNull();
  });

  // 2. LOGIN
  it("POST /auth/login - should authenticate the seeded admin with username and password", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "admin", password: config.ADMIN_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.role).toBe("admin");
    expect(res.body.email).toBe("admin@example.com");
  });

  it("PATCH /tasks/:id/complete - should reject invalid roles that are not leader or admin", async () => {
    const adminLogin = await request(app)
      .post("/auth/login")
      .send({ email: "admin", password: config.ADMIN_PASSWORD });

    const createdTask = await request(app)
      .post("/tasks")
      .set("Authorization", `Bearer ${adminLogin.body.token}`)
      .send({ title: "Needs approval" });

    const invalidToken = jwt.sign({ userId: "guest-user", role: "guest" }, config.JWT_SECRET, { expiresIn: "1d" });

    const res = await request(app)
      .patch(`/tasks/${createdTask.body.id}/complete`)
      .set("Authorization", `Bearer ${invalidToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Only leader or admin roles can complete tasks");
  });

  it("LoginUser should delegate token creation to an injected TokenGenerator", async () => {
    const userRepository = new InMemoryUserRepository();
    const passwordHash = await bcrypt.hash("Password123!", 10);
    const user = new User(
      "user-123",
      "delegate@example.com",
      passwordHash,
      new Date(),
      "user",
      null,
      null,
      null,
      null,
      [],
      "delegate"
    );
    await userRepository.create(user);

    const tokenGenerator = { createToken: vi.fn().mockReturnValue("delegate-token") };
    const loginUser = new LoginUser(userRepository, tokenGenerator as never);

    const result = await loginUser.execute({ email: user.email, password: "Password123!" });

    expect(result.token).toBe("delegate-token");
    expect(tokenGenerator.createToken).toHaveBeenCalledWith(user);
  });

  it("authMiddleware should delegate token verification to an injected TokenVerifier", async () => {
    const testApp = express();
    const tokenVerifier = { verify: vi.fn().mockReturnValue({ userId: "u-1", role: "admin", teamId: null }) };

    testApp.use(authMiddleware(tokenVerifier as never));
    testApp.get("/secure", (_req, res) => {
      res.status(200).json({ ok: true });
    });

    const res = await request(testApp)
      .get("/secure")
      .set("Authorization", "Bearer token-from-verifier");

    expect(res.status).toBe(200);
    expect(tokenVerifier.verify).toHaveBeenCalledWith("token-from-verifier");
  });

  it("POST /auth/login - should authenticate user and return JWT", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send(testUser);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");

    userToken = res.body.token;
  });

  // 3. PROTECTED ROUTE (REJECTED)
  it("GET /tasks - should return 401 when Authorization header is missing", async () => {
    const res = await request(app).get("/tasks");

    expect(res.status).toBe(401);
  });

  // 4. PROTECTED ROUTE (AUTHORIZED)
  it("GET /tasks - should return 200 when valid JWT token is provided", async () => {
    const res = await request(app)
      .get("/tasks")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});