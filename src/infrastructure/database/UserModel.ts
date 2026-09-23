import "reflect-metadata";
import { Entity, PrimaryColumn, Column, CreateDateColumn } from "typeorm";
import { UserRole } from "../../domain/entities/User";

@Entity("users")
export class UserModel {
  @PrimaryColumn("uuid")
  id!: string;

  @Column({ type: "varchar", unique: true })
  email!: string;

  @Column({ type: "varchar", unique: true, nullable: true })
  username!: string | null;

  @Column({ type: "varchar" })
  passwordHash!: string;

  @Column({ type: "varchar", default: "user" })
  role!: UserRole;

  @Column({ type: "varchar", nullable: true })
  teamId!: string | null;

  @Column({ type: "varchar", nullable: true })
  pendingTeamId!: string | null;

  @Column({ type: "varchar", nullable: true })
  teamName!: string | null;

  @Column({ type: "varchar", nullable: true })
  joinRequestTeamId!: string | null;

  @Column({ type: "text", default: "[]" })
  notifications!: string;

  @CreateDateColumn({ type: "datetime" })
  createdAt!: Date;
}