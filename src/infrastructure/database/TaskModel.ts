import "reflect-metadata";
import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("tasks")
export class TaskModel {
  @PrimaryColumn({ type: "varchar" })
  id!: string;

  @Column({ type: "varchar" })
  title!: string;

  @Column({ type: "boolean" })
  completed!: boolean;

  @Column({ type: "varchar", nullable: true })
  ownerId!: string | null;

  @Column({ type: "varchar", nullable: true })
  createdByUserId!: string | null;

  @Column({ type: "varchar", nullable: true })
  completedByUserId!: string | null;

  @Column({ type: "datetime" })
  createdAt!: Date;
}