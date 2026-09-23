import { User } from "../entities/User";

export interface TokenGenerator {
  createToken(user: User): string;
}
