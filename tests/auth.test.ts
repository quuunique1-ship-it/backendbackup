import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { InMemoryTaskRepository } from "../src/infrastructure/repositories/InMemoryTaskRepository.js";
import { InMemoryUserRepository } from "../src/infrastructure/repositories/InMemoryUserRepository.js";
import { config } from "../src/infrastructure/config/env.js";

describe("Auth Integration Tests", () => {
  let app: ReturnType<typeof createApp>;
  let userToken: string;

  const testUser = {
    email: "testuser@example.com",
    password: "password123",
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

  it("POST /auth/register - should persist a leader role choice", async () => {
    await request(app)
      .post("/auth/register")
      .send({ email: "leader@example.com", password: "password123", role: "leader" });

    const res = await request(app)
      .post("/auth/login")
      .send({ email: "leader@example.com", password: "password123" });

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
    await request(app).post("/auth/register").send({ email: adminEmail, password: "password123" });
    const adminLogin = await request(app).post("/auth/login").send({ email: adminEmail, password: "password123" });
    const adminToken = adminLogin.body.token;

    const member = await request(app)
      .post("/auth/register")
      .send({ email: "member@example.com", password: "password123" });

    const roleUpdate = await request(app)
      .patch(`/api/admin/users/${member.body.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ role: "user", teamId: "team-a" });
    expect(roleUpdate.status).toBe(200);

    const invitee = await request(app)
      .post("/auth/register")
      .send({ email: "invitee@example.com", password: "password123" });
    const invite = await request(app)
      .patch(`/api/leader/users/${invitee.body.id}/team`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ teamId: "team-a" });
    expect(invite.status).toBe(200);
    expect(invite.body.pendingTeamId).toBe("team-a");

    const inviteeLogin = await request(app)
      .post("/auth/login")
      .send({ email: "invitee@example.com", password: "password123" });
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
      .send({ email: "member@example.com", password: "password123" });
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