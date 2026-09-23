"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryUserRepository = void 0;
class InMemoryUserRepository {
    users = [];
    async create(user) {
        this.users.push(user);
        return user;
    }
    async findByEmail(email) {
        return this.users.find((user) => user.email === email) ?? null;
    }
    async findByUsername(username) {
        return this.users.find((user) => user.username === username) ?? null;
    }
    async findById(id) {
        return this.users.find((user) => user.id === id) ?? null;
    }
    async findAll() {
        return [...this.users];
    }
    async updateRoleAndTeam(id, role, teamId, teamName = null) {
        const user = await this.findById(id);
        if (!user)
            throw new Error("User not found");
        user.role = role;
        user.teamId = teamId;
        user.teamName = teamName;
        return user;
    }
    async updateTeamInvite(id, teamId, pendingTeamId) {
        const user = await this.findById(id);
        if (!user)
            throw new Error("User not found");
        user.teamId = teamId;
        user.pendingTeamId = pendingTeamId;
        return user;
    }
    async updateJoinRequest(id, joinRequestTeamId) {
        const user = await this.findById(id);
        if (!user)
            throw new Error("User not found");
        user.joinRequestTeamId = joinRequestTeamId;
        return user;
    }
    async acceptTeamInvite(id) {
        const user = await this.findById(id);
        if (!user || !user.pendingTeamId)
            throw new Error("No pending team invitation");
        user.teamId = user.pendingTeamId;
        user.pendingTeamId = null;
        user.joinRequestTeamId = null;
        return user;
    }
    async acceptJoinRequest(id, teamId, teamName) {
        const user = await this.findById(id);
        if (!user)
            throw new Error("User not found");
        user.teamId = teamId;
        user.teamName = teamName;
        user.joinRequestTeamId = null;
        user.pendingTeamId = null;
        return user;
    }
    async leaveTeam(id) {
        const user = await this.findById(id);
        if (!user)
            throw new Error("User not found");
        user.teamId = null;
        user.teamName = null;
        return user;
    }
    async addNotification(id, message) {
        const user = await this.findById(id);
        if (!user)
            throw new Error("User not found");
        user.notifications.push(message);
        return user;
    }
    async consumeNotifications(id) {
        const user = await this.findById(id);
        if (!user)
            throw new Error("User not found");
        const notifications = [...user.notifications];
        user.notifications = [];
        return notifications;
    }
    async deleteUser(id) {
        this.users = this.users.filter((user) => user.id !== id);
    }
    async deleteTeam(teamId) {
        this.users.forEach((user) => {
            if (user.teamId === teamId) {
                user.teamId = null;
                user.teamName = null;
                user.pendingTeamId = null;
                user.joinRequestTeamId = null;
            }
        });
    }
}
exports.InMemoryUserRepository = InMemoryUserRepository;
