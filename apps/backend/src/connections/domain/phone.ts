import { InvalidConnectionError } from './domain.error.js';

// celular BR guardado no formato +5541999998888 (chave do visitante)
export class Phone {
  private constructor(readonly e164: string) {}

  static create(value: string): Phone {
    let digits = value.replace(/\D/g, '');
    if (digits.length === 13 && digits.startsWith('55')) digits = digits.slice(2);
    if (!/^[1-9]{2}9\d{8}$/.test(digits)) {
      throw new InvalidConnectionError('celular inválido');
    }
    return new Phone(`+55${digits}`);
  }
}
