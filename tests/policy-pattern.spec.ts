import { describe, it, expect } from "vitest";
import { DefaultAuthorizationPolicy } from "../src/infrastructure/policies/DefaultAuthorizationPolicy.js";
import { DefaultTaskCompletionPolicy } from "../src/infrastructure/policies/DefaultTaskCompletionPolicy.js";
import { DefaultTeamMembershipPolicy } from "../src/infrastructure/policies/DefaultTeamMembershipPolicy.js";
import { User } from "../src/domain/entities/User.js";
import { Task } from "../src/domain/entities/Task.js";

describe("Policy objects", () => {
  it("authorization policy delegates role checks to a reusable policy object", () => {
    const policy = new DefaultAuthorizationPolicy();

    expect(policy.canAccess("admin", ["admin"])).toBe(true);
    expect(policy.canAccess("leader", ["leader", "admin"])).toBe(true);
    expect(policy.canAccess("user", ["leader", "admin"])).toBe(false);
  });

  it("task completion policy centralizes leader/admin approval rules", () => {
    const policy = new DefaultTaskCompletionPolicy();
    const actor = new User("actor", "actor@example.com", "hash", new Date(), "leader", "team-1", null, "Team 1", null, [], "actor");
    const owner = new User("owner", "owner@example.com", "hash", new Date(), "user", "team-1", null, "Team 1", null, [], "owner");
    const task = new Task("task-1", "Do work", "actor", "owner", new Date(), false);

    expect(policy.canComplete(task, actor, owner)).toBeNull();
    expect(policy.canComplete(task, new User("u", "u@example.com", "hash", new Date(), "user", "team-1", null, "Team 1", null, [], "u"), owner)).toBeTruthy();
    expect(policy.canComplete(task, new User("u2", "u2@example.com", "hash", new Date(), "leader", "team-2", null, "Team 2", null, [], "u2"), owner)).toBeTruthy();
  });

  it("leaders cannot kick admins", () => {
    const policy = new DefaultAuthorizationPolicy();
    const leader = new User("leader", "leader@example.com", "hash", new Date(), "leader", "team-1", null, "Team 1", null, [], "leader");
    const admin = new User("admin", "admin@example.com", "hash", new Date(), "admin", "team-1", null, "Team 1", null, [], "admin");
    const teamMembershipPolicy = new DefaultTeamMembershipPolicy();

    expect(teamMembershipPolicy.canKick(leader, admin)?.message).toBe("Leaders cannot kick admins");
    expect(policy.canAccess("leader", ["leader", "admin"])).toBe(true);
  });

  it("no one can kick themselves", () => {
    const teamMembershipPolicy = new DefaultTeamMembershipPolicy();
    const leader = new User("leader", "leader@example.com", "hash", new Date(), "leader", "team-1", null, "Team 1", null, [], "leader");

    expect(teamMembershipPolicy.canKick(leader, leader)?.message).toBe("You cannot kick yourself. Leave the team instead.");
  });
});
