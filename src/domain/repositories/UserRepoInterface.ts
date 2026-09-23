import { User, UserRole } from "../entities/User";

export interface UserRepoInterface {
  create(user: User): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  updateRoleAndTeam(id: string, role: UserRole, teamId: string | null, teamName?: string | null): Promise<User>;
  updateTeamInvite(id: string, teamId: string | null, pendingTeamId: string | null): Promise<User>;
  updateJoinRequest(id: string, joinRequestTeamId: string | null): Promise<User>;
  acceptTeamInvite(id: string): Promise<User>;
  acceptJoinRequest(id: string, teamId: string, teamName: string): Promise<User>;
  leaveTeam(id: string): Promise<User>;
  addNotification(id: string, message: string): Promise<User>;
  consumeNotifications(id: string): Promise<string[]>;
  deleteUser(id: string): Promise<void>;
  deleteTeam(teamId: string): Promise<void>;
}