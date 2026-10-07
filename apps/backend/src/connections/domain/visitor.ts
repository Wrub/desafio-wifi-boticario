import { Cpf } from './cpf.js';
import { InvalidConnectionError } from './domain.error.js';
import { Phone } from './phone.js';

export interface VisitorProps {
  name: string;
  phone: string;
  cpf?: string;
  email: string;
}

export class Visitor {
  private constructor(
    readonly name: string,
    readonly phone: Phone,
    readonly cpf: Cpf | null,
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
    // CPF é opcional, mas se vier tem que ser válido
    const cpf = props.cpf?.trim() ? Cpf.create(props.cpf) : null;
    return new Visitor(name, Phone.create(props.phone), cpf, email);
  }
}
