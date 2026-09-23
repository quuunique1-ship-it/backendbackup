export class Task {
  constructor(
    public id: string,
    public title: string,
    public completed: boolean = false,
    public createdAt: Date = new Date(),
    public ownerId: string | null = null,
    public createdByUserId: string | null = null,
    public completedByUserId: string | null = null
  ) {}

  markAsCompleted(approvedByUserId: string): void {
    this.completed = true;
    this.completedByUserId = approvedByUserId;
  }
}