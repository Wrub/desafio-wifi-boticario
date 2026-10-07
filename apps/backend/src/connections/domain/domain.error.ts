export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class InvalidConnectionError extends DomainError {}

export class NotFoundError extends DomainError {}
