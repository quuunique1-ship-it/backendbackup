import { Repository } from "typeorm";
import { UserRepoInterface } from "../../domain/repositories/UserRepoInterface";
import { User, UserRole } from "../../domain/entities/User";
import { UserModel } from "./UserModel";

export class TypeOrmUserRepo implements UserRepoInterface {
  constructor(private readonly repo: Repository<UserModel>) {}

  async create(user: User): Promise<User> {
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

  async findByUsername(username: string): Promise<User | null> {
    const model = await this.repo.findOne({ where: { username } });
    if (!model) return null;
    return this.toUser(model);
  }

  async findByEmail(email: string): Promise<User | null> {
    const model = await this.repo.findOne({ where: { email } });
    if (!model) return null;
    return this.toUser(model);
  }

  async findById(id: string): Promise<User | null> {
    const model = await this.repo.findOne({ where: { id } });
    if (!model) return null;
    return this.toUser(model);
  }

  async findAll(): Promise<User[]> {
    const models = await this.repo.find({ order: { createdAt: "ASC" } });
    return models.map((model) => this.toUser(model));
  }

  async updateRoleAndTeam(id: string, role: UserRole, teamId: string | null, teamName: string | null = null): Promise<User> {
    await this.repo.update(id, { role, teamId, teamName });
    const user = await this.findById(id);
    if (!user) throw new Error("User not found");
    return user;
  }

  async updateTeamInvite(id: string, teamId: string | null, pendingTeamId: string | null): Promise<User> {
    await this.repo.update(id, { teamId, pendingTeamId });
    const user = await this.findById(id);
    if (!user) throw new Error("User not found");
    return user;
  }

  async updateJoinRequest(id: string, joinRequestTeamId: string | null): Promise<User> {
    await this.repo.update(id, { joinRequestTeamId });
    const user = await this.findById(id);
    if (!user) throw new Error("User not found");
    return user;
  }

  async acceptTeamInvite(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user || !user.pendingTeamId) throw new Error("No pending team invitation");
    await this.repo.update(id, { teamId: user.pendingTeamId, teamName: user.teamName, pendingTeamId: null, joinRequestTeamId: null });
    const updated = await this.findById(id);
    if (!updated) throw new Error("User not found");
    return updated;
  }

  async acceptJoinRequest(id: string, teamId: string, teamName: string): Promise<User> {
    await this.repo.update(id, { teamId, teamName, joinRequestTeamId: null, pendingTeamId: null });
    const user = await this.findById(id);
    if (!user) throw new Error("User not found");
    return user;
  }

  async leaveTeam(id: string): Promise<User> {
    await this.repo.update(id, { teamId: null, teamName: null });
    const user = await this.findById(id);
    if (!user) throw new Error("User not found");
    return user;
  }

  async addNotification(id: string, message: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) throw new Error("User not found");
    await this.repo.update(id, { notifications: JSON.stringify([...user.notifications, message]) });
    return (await this.findById(id))!;
  }

  async consumeNotifications(id: string): Promise<string[]> {
    const user = await this.findById(id);
    if (!user) throw new Error("User not found");
    await this.repo.update(id, { notifications: "[]" });
    return user.notifications;
  }

  async deleteUser(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async deleteTeam(teamId: string): Promise<void> {
    await this.repo.update({ teamId }, { teamId: null, teamName: null, pendingTeamId: null, joinRequestTeamId: null });
  }

  private toUser(model: UserModel): User {
    let notifications: string[] = [];
    try { notifications = JSON.parse(model.notifications || "[]"); } catch { notifications = []; }
    return new User(model.id, model.email, model.passwordHash, model.createdAt, model.role, model.teamId, model.pendingTeamId, model.teamName, model.joinRequestTeamId, notifications, model.username);
  }
}