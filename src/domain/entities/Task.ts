export class Task {
  private readonly _id: string;
  private readonly _title: string;
  private _completed: boolean;
  private readonly _createdAt: Date;
  private readonly _ownerId: string | null;
  private readonly _createdByUserId: string | null;
  private _completedByUserId: string | null;

  private constructor(
    id: string,
    title: string,
    completed: boolean,
    createdAt: Date,
    ownerId: string | null = null,
    createdByUserId: string | null = null,
    completedByUserId: string | null = null
  ) {
    this._id = id;
    this._title = title;
    this._completed = completed;
    this._createdAt = createdAt;
    this._ownerId = ownerId;
    this._createdByUserId = createdByUserId;
    this._completedByUserId = completedByUserId;
  }

  static create(
    title: string,
    id: string,
    createdAt: Date,
    ownerId: string | null = null,
    createdByUserId: string | null = null
  ): Task {
    return new Task(id, title, false, createdAt, ownerId, createdByUserId, null);
  }

  static fromPersistence(
    id: string,
    title: string,
    completed: boolean,
    createdAt: Date,
    ownerId: string | null = null,
    createdByUserId: string | null = null,
    completedByUserId: string | null = null
  ): Task {
    return new Task(id, title, completed, createdAt, ownerId, createdByUserId, completedByUserId);
  }

  get id(): string { return this._id; }
  get title(): string { return this._title; }
  get completed(): boolean { return this._completed; }
  get createdAt(): Date { return this._createdAt; }
  get ownerId(): string | null { return this._ownerId; }
  get createdByUserId(): string | null { return this._createdByUserId; }
  get completedByUserId(): string | null { return this._completedByUserId; }

  toJSON(): Record<string, unknown> {
    return {
      id: this._id,
      title: this._title,
      completed: this._completed,
      createdAt: this._createdAt,
      ownerId: this._ownerId,
      createdByUserId: this._createdByUserId,
      completedByUserId: this._completedByUserId,
    };
  }

  markAsCompleted(approvedByUserId: string): void {
    this._completed = true;
    this._completedByUserId = approvedByUserId;
  }
}