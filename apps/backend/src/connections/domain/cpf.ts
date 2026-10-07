import { InvalidConnectionError } from './domain.error.js';

export class Cpf {
  private constructor(readonly digits: string) {}

  static create(value: string): Cpf {
    const digits = value.replace(/\D/g, '');
    if (!Cpf.isValid(digits)) {
      throw new InvalidConnectionError('CPF inválido');
    }
    return new Cpf(digits);
  }

  masked(): string {
    return Cpf.mask(this.digits);
  }

  static mask(digits: string): string {
    return `***.${digits.slice(3, 6)}.${digits.slice(6, 9)}-**`;
  }

  private static isValid(digits: string): boolean {
    if (digits.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(digits)) return false;

    const checkDigit = (length: number) => {
      let sum = 0;
      for (let i = 0; i < length; i++) {
        sum += Number(digits[i]) * (length + 1 - i);
      }
      const rest = (sum * 10) % 11;
      return rest === 10 ? 0 : rest;
    };

    return checkDigit(9) === Number(digits[9]) && checkDigit(10) === Number(digits[10]);
  }
}
