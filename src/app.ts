import "reflect-metadata";
import express, { Express, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { exec } from "node:child_process";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { promisify } from "node:util";
import { randomUUID } from "node:crypto";

import { CreateTask } from "./application/use-cases/CreateTask.js";
import { CompleteTask } from "./application/use-cases/CompleteTask.js";
import { DeleteTask } from "./application/use-cases/DeleteTask.js";
import { GetTasks } from "./application/use-cases/GetTasks.js";
import { GetTaskById } from "./application/use-cases/GetTaskById.js";
import { LoginUser } from "./application/use-cases/LoginUser.js";
import { RegisterUser } from "./application/use-cases/RegisterUser.js";
import { KickUserFromTeam } from "./application/use-cases/KickUserFromTeam.js";
import { TaskRepositoryInterface } from "./domain/repositories/TaskRepositoryInterface.js";
import { UserRepoInterface } from "./domain/repositories/UserRepoInterface.js";
import { SystemClock } from "./infrastructure/services/SystemClock.js";
import { UuidIdGenerator } from "./infrastructure/services/UuidIdGenerator.js";
import { JwtTokenGenerator } from "./infrastructure/services/JwtTokenGenerator.js";
import { JwtTokenVerifier } from "./infrastructure/services/JwtTokenVerifier.js";
import { InMemoryUserRepository } from "./infrastructure/repositories/InMemoryUserRepository.js";
import { AuthController } from "./presentation/controllers/AuthController.js";
import { TaskController } from "./presentation/controllers/TaskController.js";
import { CreateTaskSchema, PaginationQuerySchema } from "./presentation/dtos/TaskDTOs.js";
import { authMiddleware, requireRole, AuthenticatedRequest } from "./presentation/middleware/authMiddleware.js";
import { DefaultTaskDeletionPolicy } from "./infrastructure/policies/DefaultTaskDeletionPolicy.js";
import { DefaultTaskAccessPolicy } from "./infrastructure/policies/DefaultTaskAccessPolicy.js";
import { DefaultTaskCompletionPolicy } from "./infrastructure/policies/DefaultTaskCompletionPolicy.js";
import { DefaultTeamAssignmentPolicy } from "./infrastructure/policies/DefaultTeamAssignmentPolicy.js";
import { DefaultTeamMembershipPolicy } from "./infrastructure/policies/DefaultTeamMembershipPolicy.js";
import { DefaultPasswordPolicy } from "./infrastructure/policies/DefaultPasswordPolicy.js";
import { MinimumLengthRule, UppercaseRule, LowercaseRule, NumberRule, SpecialCharacterRule } from "./infrastructure/policies/password-rules.js";
import { errorHandler } from "./presentation/middleware/errorHandler.js";
import { validate } from "./presentation/middleware/validate.js";
import { RegisterSchema, LoginSchema } from "./presentation/schemas/AuthSchemas.js";
import { config } from "./infrastructure/config/env.js";
import { AppConfig } from "./domain/config/AppConfig.js";
import { User } from "./domain/entities/User.js";
import { logger } from "./infrastructure/logging/PinoLogger.js";

const execAsync = promisify(exec);

function getTestFiles(): string[] {
  const testsDir = join(process.cwd(), "tests");

  try {
    return readdirSync(testsDir)
      .filter((file) => /\.(test|spec)\.(ts|js|tsx|jsx)$/.test(file))
      .sort();
  } catch {
    return [];
  }
}

function cleanTestOutput(output: string): string {
  return output
    .replace(/\u001B\[[0-?]*[ -/]*[@-~]/g, "")
    .replace(/\u001B\][^\u0007]*(?:\u0007|\u001B\\)/g, "")
    .replace(/\r/g, "")
    .trim();
}

function renderMainUi(activePage = "login"): string {
  const page = ["register", "login", "tasks", "tests", "profile", "admin", "team"].includes(activePage)
    ? activePage
    : "login";

  const pageContent = {
    register: `
      <div class="grid">
        <section class="card">
          <h2>Create your account</h2>
          <form id="registerForm">
            <label>Email</label>
            <input type="email" name="email" placeholder="user@example.com" required />
            <label>Password</label>
            <input type="password" name="password" placeholder="Password" required />
            <label>Account role</label>
            <select name="role">
              <option value="user">User</option>
              <option value="leader">Leader</option>
            </select>
            <button type="submit">Register</button>
          </form>
          <div id="registerStatus" class="status"></div>
        </section>
      </div>`,
    login: `
      <div class="grid">
        <section class="card">
          <h2>Welcome back</h2>
          <form id="loginForm">
            <label>Email or username</label>
            <input type="text" name="email" placeholder="user@example.com or user" required />
            <label>Password</label>
            <input type="password" name="password" placeholder="Password" required />
            <button type="submit" class="secondary">Login</button>
          </form>
          <div id="loginStatus" class="status"></div>
          <div class="token-box" id="tokenBox">Token: not set</div>
        </section>
      </div>`,
    tasks: `
      <div class="grid">
        <section class="card">
          <h2>Create and view tasks</h2>
          <form id="createTaskForm">
            <label>Task title</label>
            <input type="text" name="title" placeholder="Finish dashboard" required />
            <button type="submit">Create task</button>
          </form>
          <div id="createTaskStatus" class="status"></div>

          <div class="row" style="margin-top: 18px;">
            <button id="listTasksBtn" class="secondary" type="button">Load tasks</button>
          </div>
          <div id="taskOutput" class="task-list">No tasks loaded yet.</div>
        </section>
      </div>`,
    tests: `
      <div class="grid">
        <section class="card">
          <h2>Test runner</h2>
          <button id="runTestsBtn" type="button">Run all tests</button>
          <div id="testStatus" class="status info">Idle</div>
          <pre id="testOutput">No test output yet.</pre>
        </section>
      </div>`,
    profile: `
      <div class="grid">
        <section class="card profile-card">
          <div class="profile-avatar large" id="profileAvatar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="7" r="3.5"></circle><path d="M4.5 20c.7-3.4 3.3-5.5 7.5-5.5s6.8 2.1 7.5 5.5"></path></svg></div>
          <h2>Your profile</h2>
          <p class="profile-label">Signed in as</p>
          <p class="profile-email" id="profileEmail">Checking account...</p>
          <p class="role-pill" id="profileRole"><span class="role-icon" data-role-icon="user"></span> User</p>
          <a class="profile-login-link" id="profileLoginLink" href="/ui/login">Sign in</a>
          <button id="profileLogoutBtn" class="warning" type="button" hidden>Log out</button>
        </section>
      </div>`,
    admin: `
      <div class="grid">
        <section class="card">
          <div class="role-heading"><span class="role-icon" data-role-icon="admin"></span><h2>Admin command center</h2></div>
          <p class="panel-copy">Manage roles, teams, and assignments across the whole workspace.</p>
          <button id="loadUsersBtn" type="button">Load users</button>
          <div id="adminUsers" class="user-list">No users loaded yet.</div>
        </section>
        <section class="card">
          <h2>Assign a task</h2>
          <form id="adminTaskForm">
            <label>Task title</label>
            <input type="text" name="title" placeholder="Review release notes" required />
            <label>User ID or email</label>
            <input type="text" name="ownerId" placeholder="user@example.com or UUID" required />
            <button type="submit">Assign task</button>
          </form>
          <div id="adminTaskStatus" class="status"></div>
        </section>
      </div>`,
    team: `
      <div class="grid">
        <section class="card" id="leaderTeamPanel">
          <div class="role-heading"><span class="role-icon" data-role-icon="leader"></span><h2>Team control</h2></div>
          <p class="panel-copy">Manage the users who belong to your team and approve their task completion.</p>
          <div id="leaderCreateTeam">
            <h3 class="subheading">Create your team</h3>
            <form id="createTeamForm">
              <label>Team name</label>
              <input type="text" name="teamName" placeholder="Night Shift" minlength="2" maxlength="60" required />
              <button type="submit">Create team</button>
            </form>
            <div id="createTeamStatus" class="status"></div>
          </div>
          <button id="loadTeamBtn" type="button">Load team</button>
          <div id="teamUsers" class="user-list">No team members loaded yet.</div>
          <button id="deleteTeamBtn" class="warning" type="button">Delete team</button>
          <h3 class="subheading">Available users</h3>
          <button id="loadCandidatesBtn" class="secondary" type="button">Load available users</button>
          <div id="teamCandidates" class="user-list">No available users loaded yet.</div>
          <h3 class="subheading">Join requests</h3>
          <button id="loadJoinRequestsBtn" class="secondary" type="button">Load join requests</button>
          <div id="teamRequests" class="user-list">No join requests loaded yet.</div>
        </section>
        <section class="card" id="userTeamPanel" hidden>
          <div class="role-heading"><span class="role-icon" data-role-icon="user"></span><h2>Your team</h2></div>
          <p class="panel-copy">Team invitations will appear here for you to accept.</p>
          <div id="userTeamStatus" class="status">Checking for invitations...</div>
          <button id="acceptTeamInviteBtn" type="button" hidden>Accept invitation</button>
          <button id="leaveTeamBtn" class="warning" type="button">Leave current team</button>
          <h3 class="subheading">Find a team</h3>
          <button id="loadTeamsBtn" class="secondary" type="button">Find teams</button>
          <div id="availableTeams" class="user-list">No teams loaded yet.</div>
        </section>
      </div>`,
  }[page];

  return `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Project Dashboard</title>
      <style>
        :root {
          --bg: #07151d;
          --panel: rgba(18, 42, 52, 0.78);
          --panel-soft: #1a3b45;
          --line: rgba(224, 246, 239, 0.14);
          --text: #f1fbf6;
          --muted: #a8c5bd;
          --primary: #4bc6a6;
          --primary-dark: #258b78;
          --success: #22c55e;
          --danger: #ef4444;
          --warning: #f59e0b;
        }
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body {
          margin: 0;
          min-height: 100vh;
          overflow-x: hidden;
          font-family: "Trebuchet MS", "Gill Sans", sans-serif;
          background:
            radial-gradient(circle at 12% 10%, rgba(75, 198, 166, 0.16), transparent 30%),
            radial-gradient(circle at 88% 72%, rgba(248, 174, 86, 0.12), transparent 28%),
            linear-gradient(145deg, #07151d 0%, #0c2730 52%, #142a2e 100%);
          color: var(--text);
        }
        body::before {
          position: fixed;
          inset: 0;
          z-index: -2;
          content: "";
          opacity: 0.22;
          background-image: linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px);
          background-size: 44px 44px;
          mask-image: linear-gradient(to bottom, black, transparent 82%);
        }
        .ambient {
          position: fixed;
          z-index: -1;
          width: 280px;
          height: 280px;
          border-radius: 50%;
          pointer-events: none;
          filter: blur(10px);
          opacity: 0.28;
          animation: float 16s ease-in-out infinite alternate;
        }
        .ambient-one {
          top: 12%;
          left: -90px;
          background: #3eb99f;
        }
        .ambient-two {
          right: -110px;
          bottom: 4%;
          background: #e69a5b;
          animation-delay: -7s;
        }
        .shell {
          max-width: 1080px;
          margin: 0 auto;
          padding: 42px 28px 72px;
        }
        .topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          margin-bottom: 52px;
        }
        .topbar-right {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 14px;
        }
        .brand {
          font-family: Georgia, serif;
          font-size: clamp(1.7rem, 4vw, 2.5rem);
          letter-spacing: 0.02em;
          font-weight: 700;
        }
        nav {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        nav a {
          color: var(--text);
          text-decoration: none;
          background: rgba(255,255,255,0.04);
          border: 1px solid var(--line);
          border-radius: 999px;
          padding: 9px 14px;
          font-size: 0.9rem;
          transition: transform 180ms ease, background 180ms ease, border-color 180ms ease;
        }
        nav a:hover { transform: translateY(-2px); border-color: rgba(75, 198, 166, 0.7); }
        nav a.active {
          background: var(--primary);
          border-color: transparent;
          color: #06211d;
          box-shadow: 0 8px 22px rgba(75, 198, 166, 0.2);
        }
        .user-area { position: relative; }
        .user-bubble {
          display: grid;
          place-items: center;
          width: 42px;
          height: 42px;
          margin: 0;
          padding: 0;
          border: 2px solid rgba(241, 251, 246, 0.7);
          border-radius: 50%;
          background: var(--primary);
          color: #06211d;
          font-size: 0.85rem;
          font-weight: 700;
          box-shadow: 0 8px 20px rgba(75, 198, 166, 0.22);
        }
        .user-bubble svg { width: 23px; height: 23px; }
        .user-bubble:hover { transform: translateY(-2px) scale(1.04); }
        .user-menu {
          position: absolute;
          top: calc(100% + 12px);
          right: 0;
          z-index: 3;
          display: grid;
          min-width: 150px;
          padding: 8px;
          border: 1px solid var(--line);
          border-radius: 14px;
          background: rgba(13, 38, 45, 0.96);
          box-shadow: 0 18px 34px rgba(0,0,0,0.28);
          opacity: 0;
          pointer-events: none;
          transform: translateY(-6px);
          transition: opacity 160ms ease, transform 160ms ease;
        }
        .user-menu.open { opacity: 1; pointer-events: auto; transform: translateY(0); }
        .user-menu a, .user-menu button {
          width: 100%;
          margin: 0;
          padding: 10px 12px;
          border: 0;
          border-radius: 8px;
          background: transparent;
          color: var(--text);
          text-align: left;
          text-decoration: none;
          font-size: 0.9rem;
          box-shadow: none;
        }
        .user-menu a:hover, .user-menu button:hover { transform: none; background: rgba(255,255,255,0.08); }
        .user-menu .menu-logout { color: #ffdba6; }
        .page { display: none; }
        .page.active {
          display: block;
          animation: pageIn 500ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
        }
        .notification-box {
          display: flex;
          align-items: center;
          gap: 14px;
          margin: -26px 0 28px;
          padding: 14px 18px;
          border: 1px solid rgba(74, 222, 128, 0.55);
          border-radius: 12px;
          background: rgba(34, 197, 94, 0.16);
          color: #b9f6ca;
          box-shadow: 0 12px 26px rgba(34, 197, 94, 0.12);
          animation: pageIn 420ms ease both;
        }
        .notification-box.join {
          border-color: rgba(74, 222, 128, 0.55);
          background: rgba(34, 197, 94, 0.16);
          color: #b9f6ca;
        }
        .notification-box.leave {
          border-color: rgba(248, 113, 113, 0.6);
          background: rgba(239, 68, 68, 0.16);
          color: #fecaca;
        }
        .notification-sign {
          flex: 0 0 auto;
          font-size: 2rem;
          font-weight: 700;
          line-height: 1;
        }
        .grid.page.active { display: grid; }
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 0), 1fr));
          gap: 24px;
        }
        .card {
          background: var(--panel);
          backdrop-filter: blur(18px);
          border: 1px solid var(--line);
          border-radius: 22px;
          padding: 32px;
          box-shadow: 0 24px 60px rgba(0,0,0,0.2);
        }
        h2 {
          margin-top: 0;
          margin-bottom: 24px;
          font-family: Georgia, serif;
          font-size: 1.55rem;
          letter-spacing: 0.01em;
        }
        label {
          display: block;
          margin: 18px 0 8px;
          color: var(--muted);
          font-size: 0.9rem;
        }
        input, textarea, select, button {
          width: 100%;
          border-radius: 10px;
          border: 1px solid var(--line);
          padding: 13px 14px;
          font-size: 1rem;
        }
        input, textarea, select {
          background: rgba(255,255,255,0.03);
          color: var(--text);
          margin-bottom: 8px;
          transition: border-color 180ms ease, box-shadow 180ms ease, background 180ms ease;
        }
        select {
          appearance: none;
          -webkit-appearance: none;
          padding-right: 42px;
          background-image: linear-gradient(45deg, transparent 50%, var(--primary) 50%), linear-gradient(135deg, var(--primary) 50%, transparent 50%);
          background-position: calc(100% - 19px) 50%, calc(100% - 13px) 50%;
          background-size: 6px 6px, 6px 6px;
          background-repeat: no-repeat;
        }
        select option {
          background: #102d35;
          color: var(--text);
          padding: 10px;
        }
        input:focus, textarea:focus, select:focus {
          outline: none;
          border-color: var(--primary);
          background: rgba(75, 198, 166, 0.08);
          box-shadow: 0 0 0 4px rgba(75, 198, 166, 0.12);
        }
        button {
          cursor: pointer;
          margin-top: 14px;
          background: linear-gradient(135deg, #63d7b7, var(--primary-dark));
          color: #06211d;
          border: none;
          font-weight: 600;
          box-shadow: 0 10px 20px rgba(37, 139, 120, 0.2);
          transition: transform 180ms ease, box-shadow 180ms ease, filter 180ms ease;
        }
        button:hover { transform: translateY(-3px); filter: brightness(1.06); box-shadow: 0 14px 26px rgba(37, 139, 120, 0.3); }
        button:active { transform: translateY(0); }
        button:disabled { cursor: wait; opacity: 0.58; transform: none; }
        button.secondary {
          background: rgba(75, 198, 166, 0.13);
          color: var(--text);
          border: 1px solid rgba(75, 198, 166, 0.5);
        }
        button.warning {
          background: rgba(245,158,11,0.18);
          color: #ffdba6;
          border: 1px solid rgba(245,158,11,0.5);
        }
        .status {
          min-height: 20px;
          margin-top: 12px;
          font-size: 0.9rem;
          color: var(--muted);
        }
        .status.success { color: var(--success); }
        .status.error { color: var(--danger); }
        .status.info { color: var(--warning); }
        pre {
          white-space: pre-wrap;
          word-break: break-word;
          background: rgba(0,0,0,0.25);
          border: 1px solid var(--line);
          padding: 14px;
          border-radius: 12px;
          min-height: 180px;
          margin-top: 14px;
          color: #dceeff;
        }
        .row {
          display: flex;
          gap: 12px;
          align-items: center;
        }
        .token-box {
          margin-top: 12px;
          font-size: 0.85rem;
          color: var(--muted);
          word-break: break-all;
        }
        .task-list {
          display: grid;
          gap: 10px;
          margin-top: 14px;
        }
        .task-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: rgba(255,255,255,0.04);
          border: 1px solid var(--line);
          border-radius: 12px;
          animation: riseIn 420ms ease both;
        }
        .task-title {
          min-width: 0;
          overflow-wrap: anywhere;
        }
        .task-title.completed {
          color: var(--muted);
          text-decoration: line-through;
        }
        .task-actions {
          display: flex;
          gap: 8px;
          flex-shrink: 0;
        }
        .task-actions button {
          width: auto;
          margin-top: 0;
          padding: 8px 10px;
          font-size: 0.85rem;
        }
        .profile-card { max-width: 560px; }
        .profile-avatar {
          display: grid;
          place-items: center;
          width: 72px;
          height: 72px;
          border: 2px solid rgba(241, 251, 246, 0.7);
          border-radius: 50%;
          background: var(--primary);
          color: #06211d;
          font-size: 1.35rem;
          font-weight: 700;
        }
        .profile-avatar.large { margin-bottom: 24px; }
        .profile-avatar svg { width: 40px; height: 40px; }
        .profile-label { margin: 0 0 6px; color: var(--muted); font-size: 0.9rem; }
        .profile-email { margin: 0; font-size: 1.15rem; overflow-wrap: anywhere; }
        .role-heading { display: flex; align-items: center; gap: 14px; }
        .role-heading h2 { margin-bottom: 0; }
        .role-icon {
          display: inline-grid;
          place-items: center;
          width: 42px;
          height: 42px;
          flex: 0 0 42px;
          border: 1px solid rgba(241, 251, 246, 0.45);
          border-radius: 14px 14px 14px 4px;
          background: rgba(75, 198, 166, 0.16);
          color: var(--primary);
        }
        .role-icon svg { width: 25px; height: 25px; }
        .panel-copy { color: var(--muted); line-height: 1.6; }
        .subheading { margin: 30px 0 10px; font-family: Georgia, serif; font-size: 1.05rem; }
        .user-list { display: grid; gap: 10px; margin-top: 18px; }
        .user-row { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; padding: 12px; border: 1px solid var(--line); border-radius: 12px; background: rgba(255,255,255,0.04); }
        .user-row > div:first-child { min-width: 0; flex: 1 1 150px; }
        .user-row strong, .user-row small { display: block; overflow-wrap: anywhere; }
        .user-row small { color: var(--muted); margin-top: 4px; }
        .user-row select { width: min(100%, 170px); flex: 1 1 130px; margin: 0; }
        .user-row button { width: auto; flex: 0 1 auto; margin-top: 0; }
        .role-pill { display: inline-flex; align-items: center; gap: 6px; color: var(--primary); font-size: 0.82rem; }
        .role-pill .role-icon { width: 22px; height: 22px; flex-basis: 22px; border-radius: 8px 8px 8px 2px; }
        .role-pill .role-icon svg { width: 14px; height: 14px; }
        .profile-login-link {
          display: inline-block;
          margin-top: 22px;
          color: var(--primary);
          font-weight: 700;
          text-decoration: none;
        }
        .profile-login-link[hidden] { display: none; }
        button[hidden] { display: none; }
        @keyframes pageIn {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes riseIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          from { transform: translate3d(0, 18px, 0) scale(0.92); }
          to { transform: translate3d(42px, -24px, 0) scale(1.08); }
        }
        @media (max-width: 700px) {
          .shell { padding: 26px 18px 52px; }
          .topbar { align-items: flex-start; flex-direction: column; margin-bottom: 34px; }
          .topbar-right { width: 100%; justify-content: space-between; }
          nav { gap: 7px; }
          nav a { padding: 8px 11px; font-size: 0.82rem; }
          .card { padding: 24px; }
          .task-item { align-items: flex-start; flex-direction: column; }
          .task-actions { width: 100%; }
          .task-actions button { flex: 1; }
          .user-row select, .user-row button { width: 100%; flex-basis: 100%; }
        }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            scroll-behavior: auto !important;
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      </style>
    </head>
    <body>
      <div class="ambient ambient-one"></div>
      <div class="ambient ambient-two"></div>
      <div class="shell">
        <div class="topbar">
          <div class="brand">Project Dashboard</div>
          <div class="topbar-right">
            <nav>
            <a class="${page === "register" ? "active" : ""}" href="/ui/register">Register</a>
            <a class="${page === "login" ? "active" : ""}" href="/ui/login">Login</a>
            <a class="${page === "tasks" ? "active" : ""}" href="/ui/tasks">Tasks</a>
            <a class="${page === "tests" ? "active" : ""}" data-role-link="admin" href="/ui/tests" hidden>Tests</a>
            <a class="${page === "team" ? "active" : ""}" href="/ui/team">Team</a>
            <a class="${page === "admin" ? "active" : ""}" data-role-link="admin" href="/ui/admin" hidden>Admin</a>
            </nav>
            <div class="user-area">
              <button class="user-bubble" id="userBubble" type="button" aria-label="Open user menu" aria-expanded="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="7" r="3.5"></circle><path d="M4.5 20c.7-3.4 3.3-5.5 7.5-5.5s6.8 2.1 7.5 5.5"></path></svg></button>
              <div class="user-menu" id="userMenu">
                <a href="/ui/profile">Profile</a>
                <button class="menu-logout" id="logoutBtn" type="button" hidden>Log out</button>
              </div>
            </div>
          </div>
        </div>
        <div class="notification-box" id="notificationBox" hidden></div>

        ${pageContent}
      </div>

      <script>
        const currentPage = '${page}';
        const state = { token: localStorage.getItem('taskToken') || '' };
        const signedIn = Boolean(state.token);
        const userEmail = localStorage.getItem('taskEmail') || '';
        const userRole = signedIn ? (localStorage.getItem('taskRole') || 'user') : 'user';
        const notificationBox = document.getElementById('notificationBox');
        const notifications = JSON.parse(localStorage.getItem('taskNotifications') || '[]');
        if (notificationBox && notifications.length) {
          const notification = notifications[0];
          const [type, ...messageParts] = notification.includes('|')
            ? notification.split('|')
            : ['leave', notification];
          notificationBox.className = 'notification-box ' + (type === 'join' ? 'join' : 'leave');
          const sign = document.createElement('span');
          sign.className = 'notification-sign';
          sign.textContent = type === 'join' ? '+' : '-';
          const message = document.createElement('span');
          message.textContent = messageParts.join('|');
          notificationBox.replaceChildren(sign, message);
          notificationBox.hidden = false;
          localStorage.removeItem('taskNotifications');
        }
        const pageAllowed = currentPage === 'tests' || currentPage === 'admin'
          ? signedIn && userRole === 'admin'
          : true;
        if (!pageAllowed) {
          window.location.replace('/ui/tasks');
        }
        const guestIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="7" r="3.5"></circle><path d="M4.5 20c.7-3.4 3.3-5.5 7.5-5.5s6.8 2.1 7.5 5.5"></path></svg>';
        const getInitials = (email) => email
          ? email.split('@')[0].slice(0, 2).toUpperCase()
          : '?';

        const userBubble = document.getElementById('userBubble');
        const userMenu = document.getElementById('userMenu');
        const roleIcons = {
          admin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m12 3 2.1 4.3 4.7.7-3.4 3.3.8 4.7-4.2-2.2-4.2 2.2.8-4.7-3.4-3.3 4.7-.7L12 3Z"></path><path d="M7 19h10"></path></svg>',
          leader: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"></path><path d="M6 20h12"></path></svg>',
          user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="7" r="3.5"></circle><path d="M4.5 20c.7-3.4 3.3-5.5 7.5-5.5s6.8 2.1 7.5 5.5"></path></svg>'
        };
        document.querySelectorAll('[data-role-link]').forEach((link) => {
          const requiredRole = link.dataset.roleLink;
          const visible = signedIn && (requiredRole === 'admin' ? userRole === 'admin' : ['leader', 'admin'].includes(userRole));
          link.hidden = !visible;
        });
        document.querySelectorAll('[data-role-icon]').forEach((icon) => {
          icon.innerHTML = roleIcons[icon.dataset.roleIcon] || roleIcons.user;
        });
        const leaderTeamPanel = document.getElementById('leaderTeamPanel');
        const userTeamPanel = document.getElementById('userTeamPanel');
        if (leaderTeamPanel) leaderTeamPanel.hidden = !['leader', 'admin'].includes(userRole);
        if (userTeamPanel) userTeamPanel.hidden = ['leader', 'admin'].includes(userRole);
        const leaderCreateTeam = document.getElementById('leaderCreateTeam');
        if (leaderCreateTeam && userRole === 'leader' && state.token) {
          fetch('/api/me', { headers: { Authorization: 'Bearer ' + state.token } })
            .then((response) => response.json())
            .then((user) => { leaderCreateTeam.hidden = Boolean(user.teamId && user.teamName); });
        } else if (leaderCreateTeam) {
          leaderCreateTeam.hidden = true;
        }

        document.getElementById('createTeamForm')?.addEventListener('submit', async (event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const response = await fetch('/api/leader/team', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + state.token },
            body: JSON.stringify({ teamName: form.teamName.value })
          });
          const data = await response.json();
          setStatus('createTeamStatus', response.ok ? 'Team created: ' + data.teamName : data.error || 'Unable to create team.', response.ok ? 'success' : 'error');
          if (response.ok) {
            localStorage.setItem('taskTeamId', data.teamId);
            window.setTimeout(() => window.location.reload(), 400);
          }
        });
        const updateUserUi = () => {
          const signedIn = Boolean(state.token);
          if (userBubble) userBubble.innerHTML = signedIn && userEmail ? getInitials(userEmail) : guestIcon;
          const profileEmail = document.getElementById('profileEmail');
          const profileAvatar = document.getElementById('profileAvatar');
          const logoutButton = document.getElementById('logoutBtn');
          const profileLogoutButton = document.getElementById('profileLogoutBtn');
          const profileLoginLink = document.getElementById('profileLoginLink');
          if (profileEmail) profileEmail.textContent = signedIn ? (userEmail || 'Signed-in user') : 'Not signed in';
          if (profileAvatar) profileAvatar.innerHTML = signedIn && userEmail ? getInitials(userEmail) : guestIcon;
          if (logoutButton) logoutButton.hidden = !signedIn;
          if (profileLogoutButton) profileLogoutButton.hidden = !signedIn;
          if (profileLoginLink) profileLoginLink.hidden = signedIn;
          const profileRole = document.getElementById('profileRole');
          if (profileRole) {
            profileRole.innerHTML = '<span class="role-icon">' + (roleIcons[userRole] || roleIcons.user) + '</span> ' + (signedIn ? userRole : 'Guest');
          }
        };
        updateUserUi();

        userBubble?.addEventListener('click', () => {
          const isOpen = userMenu?.classList.toggle('open') || false;
          userBubble.setAttribute('aria-expanded', String(isOpen));
        });

        const logout = () => {
          localStorage.removeItem('taskToken');
          localStorage.removeItem('taskEmail');
          localStorage.removeItem('taskUsername');
          localStorage.removeItem('taskRole');
          localStorage.removeItem('taskTeamId');
          localStorage.removeItem('loggedInAt');
          window.location.href = '/ui/login';
        };

        document.getElementById('logoutBtn')?.addEventListener('click', logout);
        document.getElementById('profileLogoutBtn')?.addEventListener('click', logout);

        const renderUsers = (target, users, canManage) => {
          if (!target) return;
          if (!users.length) {
            target.textContent = 'No users found.';
            return;
          }
          target.innerHTML = users.map((user) => '<div class="user-row"><div><strong>' + escapeHtml(user.email) + '</strong><small>' + escapeHtml(user.id) + '</small></div>' +
            (canManage ? '<select data-user-id="' + escapeHtml(user.id) + '" data-current-role="' + escapeHtml(user.role) + '"><option value="user">User</option><option value="leader">Leader</option><option value="admin">Admin</option></select>' + (user.teamId ? '<button class="warning" data-admin-kick-user="' + escapeHtml(user.id) + '" type="button">Remove from team</button>' : '') + (user.role === 'leader' && user.teamId ? '<button class="warning" data-delete-team="' + escapeHtml(user.teamId) + '" type="button">Delete team</button>' : '') + '<button class="warning" data-delete-user="' + escapeHtml(user.id) + '" type="button">Delete user</button>' : '<span class="role-pill"><span class="role-icon">' + (roleIcons[user.role] || roleIcons.user) + '</span>' + escapeHtml(user.role) + '</span><button class="warning" data-kick-user="' + escapeHtml(user.id) + '" type="button">Kick</button>') + '</div>').join('');
          target.querySelectorAll('select[data-user-id]').forEach((select) => {
            select.value = select.dataset.currentRole;
            select.addEventListener('change', async () => {
              await fetch('/api/admin/users/' + encodeURIComponent(select.dataset.userId), {
                method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + state.token },
                body: JSON.stringify({ role: select.value })
              });
            });
          });
          target.querySelectorAll('[data-kick-user]').forEach((button) => {
            button.addEventListener('click', async () => {
              const response = await fetch('/api/leader/users/' + encodeURIComponent(button.dataset.kickUser) + '/kick', { method: 'PATCH', headers: { Authorization: 'Bearer ' + state.token } });
              if (response.ok) button.closest('.user-row')?.remove();
            });
          });
          target.querySelectorAll('[data-delete-user]').forEach((button) => {
            button.addEventListener('click', async () => {
              const response = await fetch('/api/admin/users/' + encodeURIComponent(button.dataset.deleteUser), { method: 'DELETE', headers: { Authorization: 'Bearer ' + state.token } });
              if (response.ok) button.closest('.user-row')?.remove();
            });
          });
          target.querySelectorAll('[data-admin-kick-user]').forEach((button) => {
            button.addEventListener('click', async () => {
              const response = await fetch('/api/leader/users/' + encodeURIComponent(button.dataset.adminKickUser) + '/kick', { method: 'PATCH', headers: { Authorization: 'Bearer ' + state.token } });
              if (response.ok) button.remove();
            });
          });
          target.querySelectorAll('[data-delete-team]').forEach((button) => {
            button.addEventListener('click', async () => {
              const response = await fetch('/api/teams/' + encodeURIComponent(button.dataset.deleteTeam), { method: 'DELETE', headers: { Authorization: 'Bearer ' + state.token } });
              if (response.ok) button.remove();
            });
          });
        };

        document.getElementById('loadUsersBtn')?.addEventListener('click', async () => {
          const target = document.getElementById('adminUsers');
          const response = await fetch('/api/admin/users', { headers: { Authorization: 'Bearer ' + state.token } });
          const users = await response.json();
          renderUsers(target, response.ok ? users : [], true);
          if (!response.ok) target.textContent = users.error || 'Unable to load users.';
        });

        document.getElementById('loadTeamBtn')?.addEventListener('click', async () => {
          const target = document.getElementById('teamUsers');
          const headers = { Authorization: 'Bearer ' + state.token };
          const [teamResponse, meResponse] = await Promise.all([
            fetch('/api/leader/users', { headers }),
            fetch('/api/me', { headers })
          ]);
          const users = await teamResponse.json();
          const me = await meResponse.json();
          if (teamResponse.ok && !users.length) {
            target.textContent = me.teamId && me.teamName
              ? 'Your team has no members yet.'
              : 'Create a team or join one.';
          } else renderUsers(target, teamResponse.ok ? users : [], false);
          if (!teamResponse.ok) target.textContent = users.error || 'Unable to load team.';
        });

        document.getElementById('leaveTeamBtn')?.addEventListener('click', async () => {
          const response = await fetch('/api/team/leave', { method: 'POST', headers: { Authorization: 'Bearer ' + state.token } });
          const data = await response.json().catch(() => ({}));
          if (response.ok) {
            localStorage.removeItem('taskTeamId');
            const status = document.getElementById('userTeamStatus');
            if (status) status.textContent = 'You left the team successfully.';
            window.setTimeout(() => window.location.reload(), 500);
          } else {
            const status = document.getElementById('userTeamStatus');
            if (status) status.textContent = data.error || 'Unable to leave the team.';
          }
        });

        document.getElementById('deleteTeamBtn')?.addEventListener('click', async () => {
          const meResponse = await fetch('/api/me', { headers: { Authorization: 'Bearer ' + state.token } });
          const me = await meResponse.json();
          if (!me.teamId) return;
          const response = await fetch('/api/teams/' + encodeURIComponent(me.teamId), { method: 'DELETE', headers: { Authorization: 'Bearer ' + state.token } });
          if (response.ok) window.location.reload();
        });

        document.getElementById('loadCandidatesBtn')?.addEventListener('click', async () => {
          const target = document.getElementById('teamCandidates');
          const response = await fetch('/api/leader/candidates', { headers: { Authorization: 'Bearer ' + state.token } });
          const users = await response.json();
          if (!response.ok) {
            target.textContent = users.error || 'Unable to load join requests.';
            return;
          }
          if (!users.length) {
            target.textContent = 'No users are waiting to join.';
            return;
          }
          target.innerHTML = users.map((user) => '<div class="user-row"><div><strong>' + escapeHtml(user.email) + '</strong><small>' + escapeHtml(user.id) + '</small></div><button class="secondary" data-join-user="' + escapeHtml(user.id) + '" type="button">Invite to team</button></div>').join('');
          target.querySelectorAll('[data-join-user]').forEach((button) => {
            button.addEventListener('click', async () => {
              button.disabled = true;
              const response = await fetch('/api/leader/users/' + encodeURIComponent(button.dataset.joinUser) + '/team', {
                method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + state.token }, body: '{}'
              });
              if (response.ok) {
                button.closest('.user-row')?.remove();
              } else {
                const data = await response.json().catch(() => ({}));
                button.disabled = false;
                button.textContent = data.error || 'Invite failed';
              }
            });
          });
        });

        document.getElementById('loadJoinRequestsBtn')?.addEventListener('click', async () => {
          const target = document.getElementById('teamRequests');
          const response = await fetch('/api/leader/requests', { headers: { Authorization: 'Bearer ' + state.token } });
          const users = await response.json();
          if (!response.ok) {
            target.textContent = users.error || 'Unable to load join requests.';
            return;
          }
          target.innerHTML = users.length ? users.map((user) => '<div class="user-row"><div><strong>' + escapeHtml(user.email) + '</strong></div><button class="secondary" data-accept-request="' + escapeHtml(user.id) + '" type="button">Accept</button></div>').join('') : 'No join requests yet.';
          target.querySelectorAll('[data-accept-request]').forEach((button) => {
            button.addEventListener('click', async () => {
              const response = await fetch('/api/leader/requests/' + encodeURIComponent(button.dataset.acceptRequest) + '/accept', { method: 'PATCH', headers: { Authorization: 'Bearer ' + state.token } });
              if (response.ok) button.closest('.user-row')?.remove();
              else button.textContent = 'Accept failed';
            });
          });
        });

        const acceptTeamInviteBtn = document.getElementById('acceptTeamInviteBtn');
        const userTeamStatus = document.getElementById('userTeamStatus');
        let pendingTeamId = '';
        if (userTeamPanel && state.token) {
          fetch('/api/team/invites', { headers: { Authorization: 'Bearer ' + state.token } })
            .then((response) => response.json().then((data) => ({ response, data })))
            .then(({ response, data }) => {
              if (!response.ok) {
                userTeamStatus.textContent = data.error || 'Unable to load invitations.';
                return;
              }
              pendingTeamId = data.pendingTeamId || '';
              userTeamStatus.textContent = pendingTeamId ? 'You have an invitation to join team ' + pendingTeamId + '.' : data.teamId ? 'You are already in team ' + data.teamId + '.' : 'No pending team invitations.';
              acceptTeamInviteBtn.hidden = !pendingTeamId;
            });
        }
        acceptTeamInviteBtn?.addEventListener('click', async () => {
          const response = await fetch('/api/team/invites/accept', { method: 'POST', headers: { Authorization: 'Bearer ' + state.token } });
          const data = await response.json();
          userTeamStatus.textContent = response.ok ? 'You joined team ' + data.teamId + '.' : data.error || 'Unable to accept invitation.';
          acceptTeamInviteBtn.hidden = true;
        });

        document.getElementById('loadTeamsBtn')?.addEventListener('click', async () => {
          const target = document.getElementById('availableTeams');
          const response = await fetch('/api/teams', { headers: { Authorization: 'Bearer ' + state.token } });
          const teams = await response.json();
          if (!response.ok) {
            target.textContent = teams.error || 'Unable to load teams.';
            return;
          }
          target.innerHTML = teams.length ? teams.map((team) => '<div class="user-row"><div><strong>' + escapeHtml(team.teamName) + '</strong><small>' + escapeHtml(team.teamId) + '</small></div><button class="secondary" data-request-team="' + escapeHtml(team.teamId) + '" type="button">Request to join</button></div>').join('') : 'No named teams available yet.';
          target.querySelectorAll('[data-request-team]').forEach((button) => {
            button.addEventListener('click', async () => {
              const response = await fetch('/api/teams/' + encodeURIComponent(button.dataset.requestTeam) + '/requests', { method: 'POST', headers: { Authorization: 'Bearer ' + state.token } });
              const data = await response.json().catch(() => ({}));
              const errorMessage = data.error?.toLowerCase().includes('current team')
                ? 'leave your current team first'
                : (data.error || 'please try again');
              button.textContent = response.ok
                ? 'Request sent'
                : 'Request failed: ' + errorMessage;
              button.disabled = true;
            });
          });
        });

        document.getElementById('adminTaskForm')?.addEventListener('submit', async (event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const response = await fetch('/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + state.token }, body: JSON.stringify({ title: form.title.value, ownerId: form.ownerId.value }) });
          const data = await response.json();
          setStatus('adminTaskStatus', response.ok ? 'Task assigned.' : data.error || 'Assignment failed.', response.ok ? 'success' : 'error');
          if (response.ok) form.reset();
        });

        if (currentPage === 'team' && ['leader', 'admin'].includes(userRole)) {
          document.getElementById('loadTeamBtn')?.click();
          document.getElementById('loadCandidatesBtn')?.click();
          document.getElementById('loadJoinRequestsBtn')?.click();
        }

        const setStatus = (id, message, kind = 'info') => {
          const el = document.getElementById(id);
          if (!el) return;
          el.textContent = message;
          el.className = 'status ' + kind;
        };

        const tokenBox = document.getElementById('tokenBox');
        const updateTokenBox = () => {
          if (!tokenBox) return;
          tokenBox.textContent = state.token ? 'Token: ' + state.token : 'Token: not set';
        };

        const postJson = async (url, body) => {
          const headers = { 'Content-Type': 'application/json' };
          if (state.token && url.startsWith('/tasks')) {
            headers.Authorization = 'Bearer ' + state.token;
          }

          const res = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
          });

          const data = await res.json().catch(() => ({}));
          return { res, data };
        };

        const escapeHtml = (value) => String(value)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;');

        const loadTasks = async () => {
          const taskOutput = document.getElementById('taskOutput');
          if (!taskOutput) return;
          if (!state.token) {
            taskOutput.textContent = 'Login first to fetch your tasks.';
            return;
          }

          taskOutput.textContent = 'Loading tasks...';

          try {
            const res = await fetch('/tasks?limit=10&offset=0', {
              headers: { Authorization: 'Bearer ' + state.token }
            });
            const data = await res.json();

            if (!res.ok) {
              taskOutput.textContent = data.error || 'Failed to load tasks.';
              return;
            }

            if (!data.length) {
              taskOutput.textContent = 'No tasks yet.';
              return;
            }

            taskOutput.innerHTML = data.map((task) => {
              const titleClass = task.completed ? 'task-title completed' : 'task-title';
              const completeButton = task.completed
                ? ''
                : '<button class="secondary" data-complete="' + escapeHtml(task.id) + '">Complete</button>';

              return '<div class="task-item">' +
                '<div class="' + titleClass + '">' + escapeHtml(task.title) + '</div>' +
                '<div class="task-actions">' + completeButton +
                '<button class="warning" data-delete="' + escapeHtml(task.id) + '">Delete</button>' +
                '</div>' +
                '</div>';
            }).join('');
          } catch (error) {
            taskOutput.textContent = 'Failed to load tasks.';
          }
        };

        const taskOutput = document.getElementById('taskOutput');
        taskOutput?.addEventListener('click', async (event) => {
          const button = event.target.closest('button');
          if (!button || !state.token) return;

          const taskId = button.dataset.complete || button.dataset.delete;
          const method = button.dataset.complete ? 'PATCH' : 'DELETE';
          const action = button.dataset.complete ? 'complete' : 'delete';

          button.disabled = true;
          try {
            const res = await fetch('/tasks/' + encodeURIComponent(taskId) +
              (action === 'complete' ? '/complete' : ''), {
                method,
                headers: { Authorization: 'Bearer ' + state.token }
              });

            if (!res.ok) {
              const data = await res.json().catch(() => ({}));
              document.getElementById('taskOutput').textContent = data.error ||
                'Task action failed.';
              return;
            }

            await loadTasks();
          } catch (error) {
            document.getElementById('taskOutput').textContent = 'Task action failed.';
          }
        });

        const registerForm = document.getElementById('registerForm');
        registerForm?.addEventListener('submit', async (event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const body = {
            email: form.email.value,
            password: form.password.value,
            role: form.role.value
          };

          try {
            const { res, data } = await postJson('/auth/register', body);
            if (!res.ok) {
              setStatus('registerStatus', data.error || 'Registration failed.', 'error');
              return;
            }

            setStatus('registerStatus', 'User created: ' + data.email, 'success');
            localStorage.setItem('registeredAt', String(Date.now()));
            form.reset();
            window.setTimeout(() => { window.location.href = '/ui/login'; }, 500);
          } catch (error) {
            setStatus('registerStatus', 'Registration request failed.', 'error');
          }
        });

        const loginForm = document.getElementById('loginForm');
        loginForm?.addEventListener('submit', async (event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const body = {
            email: form.email.value,
            password: form.password.value
          };

          try {
            const { res, data } = await postJson('/auth/login', body);
            if (!res.ok) {
              setStatus('loginStatus', data.error || 'Login failed.', 'error');
              return;
            }

            state.token = data.token || '';
            localStorage.setItem('taskToken', state.token);
            localStorage.setItem('taskEmail', data.email || body.email);
            localStorage.setItem('taskUsername', data.username || body.email.split('@')[0]);
            localStorage.setItem('taskRole', data.role || 'user');
            localStorage.setItem('taskTeamId', data.teamId || '');
            localStorage.setItem('taskNotifications', JSON.stringify(data.notifications || []));
            localStorage.setItem('loggedInAt', String(Date.now()));
            updateTokenBox();
            setStatus('loginStatus', 'Logged in successfully.', 'success');
            form.reset();
            window.setTimeout(() => { window.location.href = '/ui/tasks'; }, 500);
          } catch (error) {
            setStatus('loginStatus', 'Login request failed.', 'error');
          }
        });

        const createTaskForm = document.getElementById('createTaskForm');
        createTaskForm?.addEventListener('submit', async (event) => {
          event.preventDefault();
          const form = event.currentTarget;

          if (!state.token) {
            setStatus('createTaskStatus', 'Login first to create a task.', 'error');
            return;
          }

          try {
            const { res, data } = await postJson('/tasks', { title: form.title.value });
            if (!res.ok) {
              setStatus('createTaskStatus', data.error || 'Task creation failed.', 'error');
              return;
            }

            setStatus('createTaskStatus', 'Task created: ' + data.title, 'success');
            form.reset();
            await loadTasks();
          } catch (error) {
            setStatus('createTaskStatus', 'Task creation request failed.', 'error');
          }
        });

        const listTasksBtn = document.getElementById('listTasksBtn');
        listTasksBtn?.addEventListener('click', async () => {
          await loadTasks();
        });

        const runTestsBtn = document.getElementById('runTestsBtn');
        runTestsBtn?.addEventListener('click', async () => {
          const statusEl = document.getElementById('testStatus');
          const outputEl = document.getElementById('testOutput');

          statusEl.textContent = 'Running tests...';
          statusEl.className = 'status info';
          outputEl.textContent = 'Starting Vitest...';

          try {
            const response = await fetch('/api/tests/run', {
              method: 'POST',
              headers: { Authorization: 'Bearer ' + state.token }
            });
            const data = await response.json();

            if (response.status >= 400 || data.status === 'failed' || data.status === 'timeout') {
              statusEl.textContent = data.status === 'timeout' ? 'Timed out' : 'Failed';
              statusEl.className = 'status error';
              outputEl.textContent = data.output || 'No output returned.';
              return;
            }

            statusEl.textContent = 'Successful';
            statusEl.className = 'status success';
            outputEl.textContent = data.output || 'No output returned.';
          } catch (error) {
            statusEl.textContent = 'Request failed';
            statusEl.className = 'status error';
            outputEl.textContent = 'Unable to reach the test endpoint.';
          }
        });
      </script>
    </body>
  </html>`;
}

async function ensureDefaultAdmin(userRepository: UserRepoInterface): Promise<void> {
  const adminEmail = config.ADMIN_EMAIL;
  const adminPassword = config.ADMIN_PASSWORD;
  const adminUsername = "admin";

  const existingAdmin = await userRepository.findByEmail(adminEmail)
    ?? await userRepository.findByUsername(adminUsername);

  if (existingAdmin) {
    return;
  }

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  const adminUser = new User(
    randomUUID(),
    adminEmail,
    passwordHash,
    new Date(),
    "admin",
    null,
    null,
    null,
    null,
    [],
    adminUsername
  );

  await userRepository.create(adminUser);
}

export function createApp(
  taskRepository: TaskRepositoryInterface,
  userRepository: UserRepoInterface = new InMemoryUserRepository(),
  databasePing: () => Promise<unknown> = async () => {
    throw new Error("Database health check is not configured");
  }
): Express {
  const app = express();
  const seedDefaultAdmin = ensureDefaultAdmin(userRepository);

  app.use(express.json());
  app.get("/health", async (_req, res) => {
    try {
      await databasePing();
      res.status(200).json({ status: "ok" });
    } catch {
      res.status(503).json({ status: "unavailable" });
    }
  });

  app.use(async (_req, _res, next) => {
    try {
      await seedDefaultAdmin;
      next();
    } catch (error) {
      next(error);
    }
  });

  const createTaskUseCase = new CreateTask(taskRepository, new UuidIdGenerator(), new SystemClock(), logger);
  const completeTaskUseCase = new CompleteTask(taskRepository, userRepository, new DefaultTaskCompletionPolicy(), logger);
  const deleteTaskUseCase = new DeleteTask(taskRepository, new DefaultTaskDeletionPolicy(), logger);
  const getTasksUseCase = new GetTasks(taskRepository, logger);
  const getTaskByIdUseCase = new GetTaskById(taskRepository, new DefaultTaskAccessPolicy(), logger);
  const teamAssignmentPolicy = new DefaultTeamAssignmentPolicy();
  const kickUserUseCase = new KickUserFromTeam(userRepository, new DefaultTeamMembershipPolicy(), logger);

  const registerUser = new RegisterUser(
    userRepository,
    config as AppConfig,
    new DefaultPasswordPolicy([
      new MinimumLengthRule(8),
      new UppercaseRule(),
      new LowercaseRule(),
      new NumberRule(),
      new SpecialCharacterRule(),
    ]),
    logger
  );
  const loginUser = new LoginUser(userRepository, new JwtTokenGenerator(config.JWT_SECRET), logger);
  const tokenVerifier = new JwtTokenVerifier(config.JWT_SECRET);

  const taskController = new TaskController(
    createTaskUseCase,
    completeTaskUseCase,
    deleteTaskUseCase,
    getTasksUseCase,
    getTaskByIdUseCase,
    userRepository,
    logger
  );

  const authController = new AuthController(registerUser, loginUser, logger);

  const renderEntryPage = (_req: Request, res: Response) => {
    res.type("html").send(`<!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Project Dashboard</title>
        </head>
        <body>
          <script>
            const token = localStorage.getItem('taskToken');
            const loggedInAt = Number(localStorage.getItem('loggedInAt') || 0);
            const registeredAt = Number(localStorage.getItem('registeredAt') || 0);
            const loggedInRecently = loggedInAt > 0 && Date.now() - loggedInAt < 3600000;
            const registeredRecently = registeredAt > 0 && Date.now() - registeredAt < 3600000;
            window.location.replace(loggedInRecently && token ? '/ui/tasks' : registeredRecently ? '/ui/login' : '/ui/register');
          </script>
        </body>
      </html>`);
  };

  app.get("/", renderEntryPage);
  app.get("/ui", renderEntryPage);

  app.get("/ui/register", (_req, res) => {
    res.type("html").send(renderMainUi("register"));
  });

  app.get("/ui/login", (_req, res) => {
    res.type("html").send(renderMainUi("login"));
  });

  app.get("/ui/tasks", (_req, res) => {
    res.type("html").send(renderMainUi("tasks"));
  });

  app.get("/ui/tests", (_req, res) => {
    res.type("html").send(renderMainUi("tests"));
  });

  app.get("/ui/profile", (_req, res) => {
    res.type("html").send(renderMainUi("profile"));
  });

  app.get("/ui/admin", (_req, res) => {
    res.type("html").send(renderMainUi("admin"));
  });

  app.get("/ui/team", (_req, res) => {
    res.type("html").send(renderMainUi("team"));
  });

  app.post("/auth/register", validate(RegisterSchema), authController.register);
  app.post("/auth/login", validate(LoginSchema), authController.login);

  app.get("/api/me", authMiddleware(tokenVerifier), async (req: AuthenticatedRequest, res, next) => {
    try {
      const user = req.userId ? await userRepository.findById(req.userId) : null;
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.json({ id: user.id, email: user.email, role: user.role, teamId: user.teamId, teamName: user.teamName, pendingTeamId: user.pendingTeamId, joinRequestTeamId: user.joinRequestTeamId });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/admin/users", authMiddleware(tokenVerifier), requireRole("admin"), async (_req, res, next) => {
    try {
      const users = await userRepository.findAll();
      res.json(users.map(({ id, email, role, teamId, createdAt }) => ({ id, email, role, teamId, createdAt })));
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/admin/users/:id", authMiddleware(tokenVerifier), requireRole("admin"), async (req, res, next) => {
    try {
      const role = req.body.role;
      const teamId = req.body.teamId ?? null;
      if (!["admin", "leader", "user"].includes(role)) {
        res.status(400).json({ error: "Role must be admin, leader, or user" });
        return;
      }
      const user = await userRepository.updateRoleAndTeam(req.params.id as string, role, teamId, req.body.teamName ?? null);
      res.json({ id: user.id, email: user.email, role: user.role, teamId: user.teamId, teamName: user.teamName });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/leader/users", authMiddleware(tokenVerifier), requireRole("leader", "admin"), async (req: AuthenticatedRequest, res, next) => {
    try {
      const actor = req.userId ? await userRepository.findById(req.userId) : null;
      const users = await userRepository.findAll();
      const visibleUsers = actor?.role === "admin"
        ? users
        : actor?.teamId
          ? users.filter((user) => user.teamId === actor.teamId && user.role === "user")
          : [];
      res.json(visibleUsers.map(({ id, email, role, teamId, teamName, createdAt }) => ({ id, email, role, teamId, teamName, createdAt })));
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/leader/candidates", authMiddleware(tokenVerifier), requireRole("leader", "admin"), async (_req, res, next) => {
    try {
      const users = await userRepository.findAll();
      res.json(users.filter((user) => user.role === "user" && !user.teamId && !user.pendingTeamId).map(({ id, email, role, teamId }) => ({ id, email, role, teamId })));
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/leader/team", authMiddleware(tokenVerifier), requireRole("leader"), async (req: AuthenticatedRequest, res, next) => {
    try {
      const actor = req.userId ? await userRepository.findById(req.userId) : null;
      const teamName = typeof req.body.teamName === "string" ? req.body.teamName.trim() : "";
      if (!actor) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      if (actor.teamId && actor.teamName) {
        res.status(400).json({ error: "You already have a team" });
        return;
      }
      if (teamName.length < 2 || teamName.length > 60) {
        res.status(400).json({ error: "Team name must be between 2 and 60 characters" });
        return;
      }
      const updated = await userRepository.updateRoleAndTeam(actor.id, "leader", actor.teamId || `team-${randomUUID().slice(0, 8)}`, teamName);
      res.status(201).json({ teamId: updated.teamId, teamName: updated.teamName });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/teams", authMiddleware(tokenVerifier), async (_req, res, next) => {
    try {
      const users = await userRepository.findAll();
      res.json(users.filter((user) => user.role === "leader" && user.teamId).map(({ teamId, teamName }) => ({ teamId, teamName: teamName || "Unnamed team" })));
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/teams/:teamId/requests", authMiddleware(tokenVerifier), async (req: AuthenticatedRequest, res, next) => {
    try {
      const user = req.userId ? await userRepository.findById(req.userId) : null;
      const team = (await userRepository.findAll()).find((candidate) => candidate.role === "leader" && candidate.teamId === req.params.teamId);
      if (!user || user.role !== "user") {
        res.status(403).json({ error: "Only users can request to join a team" });
        return;
      }
      if (!team) {
        res.status(404).json({ error: "Team not found" });
        return;
      }
      if (user.teamId) {
        res.status(400).json({ error: "Leave your current team before requesting another team" });
        return;
      }
      const updated = await userRepository.updateJoinRequest(user.id, team.teamId);
      res.json({ teamId: updated.joinRequestTeamId, teamName: team.teamName });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/leader/requests", authMiddleware(tokenVerifier), requireRole("leader", "admin"), async (req: AuthenticatedRequest, res, next) => {
    try {
      const actor = req.userId ? await userRepository.findById(req.userId) : null;
      const users = await userRepository.findAll();
      const requests = users.filter((user) => user.joinRequestTeamId && user.joinRequestTeamId === actor?.teamId);
      res.json(requests.map(({ id, email, role, joinRequestTeamId }) => ({ id, email, role, teamId: joinRequestTeamId })));
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/leader/requests/:id/accept", authMiddleware(tokenVerifier), requireRole("leader", "admin"), async (req: AuthenticatedRequest, res, next) => {
    try {
      const actor = req.userId ? await userRepository.findById(req.userId) : null;
      const target = await userRepository.findById(req.params.id as string);
      if (!actor?.teamId || actor.role !== "leader" || !target || target.joinRequestTeamId !== actor.teamId) {
        res.status(403).json({ error: "This join request is not for your team" });
        return;
      }
      const updated = await userRepository.acceptJoinRequest(target.id, actor.teamId, actor.teamName || "Team");
      if (target.teamId && target.teamId !== actor.teamId) {
        const previousOwner = (await userRepository.findAll()).find((user) => user.role === "leader" && user.teamId === target.teamId);
        if (previousOwner) await userRepository.addNotification(previousOwner.id, `leave|${target.email} has left the team, goodbye!`);
      }
      await userRepository.addNotification(actor.id, `join|${target.email} joined the team, hooray!`);
      res.json({ id: updated.id, email: updated.email, teamId: updated.teamId, teamName: updated.teamName });
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/leader/users/:id/team", authMiddleware(tokenVerifier), requireRole("leader", "admin"), async (req: AuthenticatedRequest, res, next) => {
    try {
      const actor = req.userId ? await userRepository.findById(req.userId) : null;
      const target = await userRepository.findById(req.params.id as string);
      if (!target) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      const teamId = actor?.role === "admin" ? (req.body.teamId ?? null) : actor?.teamId ?? null;
      const assignmentDenial = actor ? teamAssignmentPolicy.canAssignTeam(actor, target, teamId) : null;
      if (assignmentDenial) {
        const { mapDomainErrorToHttpStatus } = await import("./presentation/middleware/errorHandler.js");
        res.status(mapDomainErrorToHttpStatus(assignmentDenial)).json({ error: assignmentDenial.message });
        return;
      }
      const user = await userRepository.updateTeamInvite(target.id, target.teamId, teamId);
      res.json({ id: user.id, email: user.email, role: user.role, teamId: user.teamId, pendingTeamId: user.pendingTeamId });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/team/invites", authMiddleware(tokenVerifier), async (req: AuthenticatedRequest, res, next) => {
    try {
      const user = req.userId ? await userRepository.findById(req.userId) : null;
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.json({ teamId: user.teamId, pendingTeamId: user.pendingTeamId });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/team/invites/accept", authMiddleware(tokenVerifier), async (req: AuthenticatedRequest, res, next) => {
    try {
      const user = req.userId ? await userRepository.findById(req.userId) : null;
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      if (!user.pendingTeamId) {
        res.status(400).json({ error: "No pending team invitation" });
        return;
      }
      if (user.teamId && user.teamId !== user.pendingTeamId) {
        res.status(400).json({ error: "Leave your current team before accepting another invitation" });
        return;
      }
      const leader = (await userRepository.findAll()).find((candidate) => candidate.role === "leader" && candidate.teamId === user.pendingTeamId);
      const previousTeamId = user.teamId;
      const updated = leader
        ? await userRepository.acceptJoinRequest(user.id, user.pendingTeamId, leader.teamName || "Team")
        : await userRepository.acceptTeamInvite(user.id);
      if (previousTeamId && previousTeamId !== updated.teamId) {
        const previousOwner = (await userRepository.findAll()).find((candidate) => candidate.role === "leader" && candidate.teamId === previousTeamId);
        if (previousOwner) await userRepository.addNotification(previousOwner.id, `leave|${user.email} has left the team, goodbye!`);
      }
      if (leader) await userRepository.addNotification(leader.id, `join|${user.email} joined the team, hooray!`);
      res.json({ teamId: updated.teamId });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/team/leave", authMiddleware(tokenVerifier), async (req: AuthenticatedRequest, res, next) => {
    try {
      const user = req.userId ? await userRepository.findById(req.userId) : null;
      if (!user || !user.teamId) {
        res.status(400).json({ error: "You are not in a team" });
        return;
      }
      const oldTeamId = user.teamId;
      const owner = (await userRepository.findAll()).find((candidate) => candidate.role === "leader" && candidate.teamId === oldTeamId);
      const updated = await userRepository.leaveTeam(user.id);
      if (owner) await userRepository.addNotification(owner.id, `leave|${user.email} has left the team, goodbye!`);
      res.json({ teamId: updated.teamId });
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/leader/users/:id/kick", authMiddleware(tokenVerifier), requireRole("leader", "admin"), async (req: AuthenticatedRequest, res, next) => {
    try {
      const actorId = req.userId;
      const targetId = req.params.id as string;
      if (!actorId) {
        res.status(401).json({ error: "Authentication required" });
        return;
      }

      const result = await kickUserUseCase.execute({ actorId, targetId });
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/teams/:teamId", authMiddleware(tokenVerifier), requireRole("leader", "admin"), async (req: AuthenticatedRequest, res, next) => {
    try {
      const actor = req.userId ? await userRepository.findById(req.userId) : null;
      if (!actor || (actor.role === "leader" && actor.teamId !== req.params.teamId)) {
        res.status(403).json({ error: "You cannot delete this team" });
        return;
      }
      await userRepository.deleteTeam(req.params.teamId as string);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/admin/users/:id", authMiddleware(tokenVerifier), requireRole("admin"), async (req, res, next) => {
    try {
      const target = await userRepository.findById(req.params.id as string);
      if (!target) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      await userRepository.deleteUser(target.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  app.use("/tasks", authMiddleware(tokenVerifier));

  app.post(
    "/tasks",
    validate(CreateTaskSchema),
    (req, res, next) => taskController.create(req, res, next)
  );

  app.get(
    "/tasks",
    validate(PaginationQuerySchema),
    (req, res, next) => taskController.getAll(req, res, next)
  );

  app.get("/tasks/:id", (req, res, next) => taskController.getById(req, res, next));
  app.patch("/tasks/:id/complete", (req, res, next) => taskController.complete(req, res, next));
  app.delete("/tasks/:id", (req, res, next) => taskController.delete(req, res, next));

  app.get("/api/tests", authMiddleware(tokenVerifier), requireRole("admin"), (_req, res) => {
    res.json({ tests: getTestFiles() });
  });

  app.post("/api/tests/run", authMiddleware(tokenVerifier), requireRole("admin"), async (_req, res) => {
    try {
      const { stdout, stderr } = await execAsync("npx vitest run --reporter=default --maxWorkers=1", {
        cwd: process.cwd(),
        env: {
          ...process.env,
          FORCE_COLOR: "0",
          NO_COLOR: "1",
          VITE_CONFIG_NATIVE_IGNORE_WARNING: "true",
        },
        timeout: 45000
      });

      const output = cleanTestOutput([stdout, stderr].filter(Boolean).join("\n"));
      res.json({ status: "success", output });
    } catch (error) {
      const err = error as {
        message?: string;
        stdout?: string;
        stderr?: string;
        timedOut?: boolean;
      };

      const output = cleanTestOutput([err.stdout, err.stderr].filter(Boolean).join("\n"));

      if (err.timedOut) {
        res.status(504).json({
          status: "timeout",
          output: output || "Vitest timed out after 30 seconds.",
          message: "Tests timed out."
        });
        return;
      }

      res.status(500).json({
        status: "failed",
        output: output || err.message || "Test run failed.",
        message: err.message || "Test run failed."
      });
    }
  });

  app.use(errorHandler);

  return app;
}