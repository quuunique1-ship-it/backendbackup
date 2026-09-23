"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypeOrmUserRepo = void 0;
const User_1 = require("../../domain/entities/User");
class TypeOrmUserRepo {
    repo;
    constructor(repo) {
        this.repo = repo;
    }
    async create(user) {
        const model = this.repo.create({
            id: user.id,
            email: user.email,
            username: user.username,
            passwordHash: user.passwordHash,
            createdAt: user.createdAt,
            role: user.role,
            teamId: user.teamId,
            pendingTeamId: user.pendingTeamId,
            teamName: user.teamName,
            joinRequestTeamId: user.joinRequestTeamId,
            notifications: JSON.stringify(user.notifications),
        });
        await this.repo.save(model);
        return this.toUser(model);
    }
    async findByUsername(username) {
        const model = await this.repo.findOne({ where: { username } });
        if (!model)
            return null;
        return this.toUser(model);
    }
    async findByEmail(email) {
        const model = await this.repo.findOne({ where: { email } });
        if (!model)
            return null;
        return this.toUser(model);
    }
    async findById(id) {
        const model = await this.repo.findOne({ where: { id } });
        if (!model)
            return null;
        return this.toUser(model);
    }
    async findAll() {
        const models = await this.repo.find({ order: { createdAt: "ASC" } });
        return models.map((model) => this.toUser(model));
    }
    async updateRoleAndTeam(id, role, teamId, teamName = null) {
        await this.repo.update(id, { role, teamId, teamName });
        const user = await this.findById(id);
        if (!user)
            throw new Error("User not found");
        return user;
    }
    async updateTeamInvite(id, teamId, pendingTeamId) {
        await this.repo.update(id, { teamId, pendingTeamId });
        const user = await this.findById(id);
        if (!user)
            throw new Error("User not found");
        return user;
    }
    async updateJoinRequest(id, joinRequestTeamId) {
        await this.repo.update(id, { joinRequestTeamId });
        const user = await this.findById(id);
        if (!user)
            throw new Error("User not found");
        return user;
    }
    async acceptTeamInvite(id) {
        const user = await this.findById(id);
        if (!user || !user.pendingTeamId)
            throw new Error("No pending team invitation");
        await this.repo.update(id, { teamId: user.pendingTeamId, teamName: user.teamName, pendingTeamId: null, joinRequestTeamId: null });
        const updated = await this.findById(id);
        if (!updated)
            throw new Error("User not found");
        return updated;
    }
    async acceptJoinRequest(id, teamId, teamName) {
        await this.repo.update(id, { teamId, teamName, joinRequestTeamId: null, pendingTeamId: null });
        const user = await this.findById(id);
        if (!user)
            throw new Error("User not found");
        return user;
    }
    async leaveTeam(id) {
        await this.repo.update(id, { teamId: null, teamName: null });
        const user = await this.findById(id);
        if (!user)
            throw new Error("User not found");
        return user;
    }
    async addNotification(id, message) {
        const user = await this.findById(id);
        if (!user)
            throw new Error("User not found");
        await this.repo.update(id, { notifications: JSON.stringify([...user.notifications, message]) });
        return (await this.findById(id));
    }
    async consumeNotifications(id) {
        const user = await this.findById(id);
        if (!user)
            throw new Error("User not found");
        await this.repo.update(id, { notifications: "[]" });
        return user.notifications;
    }
    async deleteUser(id) {
        await this.repo.delete(id);
    }
    async deleteTeam(teamId) {
        await this.repo.update({ teamId }, { teamId: null, teamName: null, pendingTeamId: null, joinRequestTeamId: null });
    }
    toUser(model) {
        let notifications = [];
        try {
            notifications = JSON.parse(model.notifications || "[]");
        }
        catch {
            notifications = [];
        }
        return new User_1.User(model.id, model.email, model.passwordHash, model.createdAt, model.role, model.teamId, model.pendingTeamId, model.teamName, model.joinRequestTeamId, notifications, model.username);
    }
}
exports.TypeOrmUserRepo = TypeOrmUserRepo;
