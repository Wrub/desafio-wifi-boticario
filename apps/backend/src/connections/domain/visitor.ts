import { Cpf } from './cpf.js';
import { InvalidConnectionError } from './domain.error.js';

export interface VisitorProps {
  name: string;
  cpf: string;
  email: string;
}

export class Visitor {
  private constructor(
    readonly name: string,
    readonly cpf: Cpf,
    readonly email: string,
  ) {}

  static create(props: VisitorProps): Visitor {
    const name = props.name.trim();
    if (name.length < 2) {
      throw new InvalidConnectionError('nome do visitante é obrigatório');
    }
    const email = props.email.trim().toLowerCase();
    if (!email.includes('@')) {
      throw new InvalidConnectionError('e-mail inválido');
    }
    return new Visitor(name, Cpf.create(props.cpf), email);
  }
}
