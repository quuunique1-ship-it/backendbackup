export type UserRole = "admin" | "leader" | "user";

export class User {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly passwordHash: string,
    public readonly createdAt: Date = new Date(),
    public role: UserRole = "user",
    public teamId: string | null = null,
    public pendingTeamId: string | null = null,
    public teamName: string | null = null,
    public joinRequestTeamId: string | null = null,
    public notifications: string[] = [],
    public username: string | null = null
  ) {}
}