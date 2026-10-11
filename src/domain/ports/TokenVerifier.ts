import { UserRole } from "../entities/User";

export interface TokenPayload {
  userId: string;
  role?: UserRole;
  teamId?: string | null;
}

export interface TokenVerifier {
  verify(token: string): TokenPayload;
}
