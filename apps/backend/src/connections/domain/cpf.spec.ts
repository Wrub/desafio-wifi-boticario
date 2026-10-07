import { describe, expect, it } from 'vitest';
import { Cpf } from './cpf.js';
import { InvalidConnectionError } from './domain.error.js';

describe('Cpf', () => {
  it('aceita CPF com ou sem pontuação', () => {
    expect(Cpf.create('529.982.247-25').digits).toBe('52998224725');
    expect(Cpf.create('52998224725').digits).toBe('52998224725');
  });

  it('recusa dígito verificador errado', () => {
    expect(() => Cpf.create('529.982.247-26')).toThrow(InvalidConnectionError);
  });

  it('recusa CPF com todos os dígitos iguais', () => {
    expect(() => Cpf.create('111.111.111-11')).toThrow(InvalidConnectionError);
  });

  it('mascara os 3 primeiros e os 2 últimos dígitos', () => {
    expect(Cpf.create('52998224725').masked()).toBe('***.982.247-**');
  });
});
