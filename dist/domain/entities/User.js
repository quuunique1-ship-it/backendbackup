"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
class User {
    id;
    email;
    passwordHash;
    createdAt;
    role;
    teamId;
    pendingTeamId;
    teamName;
    joinRequestTeamId;
    notifications;
    username;
    constructor(id, email, passwordHash, createdAt = new Date(), role = "user", teamId = null, pendingTeamId = null, teamName = null, joinRequestTeamId = null, notifications = [], username = null) {
        this.id = id;
        this.email = email;
        this.passwordHash = passwordHash;
        this.createdAt = createdAt;
        this.role = role;
        this.teamId = teamId;
        this.pendingTeamId = pendingTeamId;
        this.teamName = teamName;
        this.joinRequestTeamId = joinRequestTeamId;
        this.notifications = notifications;
        this.username = username;
    }
}
exports.User = User;
