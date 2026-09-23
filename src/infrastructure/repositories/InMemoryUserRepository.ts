import { User, UserRole } from "../../domain/entities/User";
import { UserRepoInterface } from "../../domain/repositories/UserRepoInterface";

export class InMemoryUserRepository implements UserRepoInterface {
  private users: User[] = [];

  async create(user: User): Promise<User> {
    this.users.push(user);
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.users.find((user) => user.email === email) ?? null;
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.users.find((user) => user.username === username) ?? null;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.find((user) => user.id === id) ?? null;
  }

  async findAll(): Promise<User[]> {
    return [...this.users];
  }

  async updateRoleAndTeam(id: string, role: UserRole, teamId: string | null, teamName: string | null = null): Promise<User> {
    const user = await this.findById(id);
    if (!user) throw new Error("User not found");
    user.role = role;
    user.teamId = teamId;
    user.teamName = teamName;
    return user;
  }

  async updateTeamInvite(id: string, teamId: string | null, pendingTeamId: string | null): Promise<User> {
    const user = await this.findById(id);
    if (!user) throw new Error("User not found");
    user.teamId = teamId;
    user.pendingTeamId = pendingTeamId;
    return user;
  }

  async updateJoinRequest(id: string, joinRequestTeamId: string | null): Promise<User> {
    const user = await this.findById(id);
    if (!user) throw new Error("User not found");
    user.joinRequestTeamId = joinRequestTeamId;
    return user;
  }

  async acceptTeamInvite(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user || !user.pendingTeamId) throw new Error("No pending team invitation");
    user.teamId = user.pendingTeamId;
    user.pendingTeamId = null;
    user.joinRequestTeamId = null;
    return user;
  }

  async acceptJoinRequest(id: string, teamId: string, teamName: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) throw new Error("User not found");
    user.teamId = teamId;
    user.teamName = teamName;
    user.joinRequestTeamId = null;
    user.pendingTeamId = null;
    return user;
  }

  async leaveTeam(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) throw new Error("User not found");
    user.teamId = null;
    user.teamName = null;
    return user;
  }

  async addNotification(id: string, message: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) throw new Error("User not found");
    user.notifications.push(message);
    return user;
  }

  async consumeNotifications(id: string): Promise<string[]> {
    const user = await this.findById(id);
    if (!user) throw new Error("User not found");
    const notifications = [...user.notifications];
    user.notifications = [];
    return notifications;
  }

  async deleteUser(id: string): Promise<void> {
    this.users = this.users.filter((user) => user.id !== id);
  }

  async deleteTeam(teamId: string): Promise<void> {
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
