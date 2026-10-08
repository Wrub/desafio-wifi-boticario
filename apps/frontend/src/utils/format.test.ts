import { describe, expect, it } from 'vitest';
import { formatHour, maskCpfInput, maskPhoneInput, SEASON_LABELS, WEEKDAY_LABELS } from './format';

describe('maskPhoneInput', () => {
  it.each([
    ['', ''],
    ['4', '(4'],
    ['41', '(41'],
    ['4199999', '(41) 99999'],
    ['419999988', '(41) 99999-88'],
    ['41999998888', '(41) 99999-8888'],
  ])('formata %s enquanto digita -> %s', (value, expected) => {
    expect(maskPhoneInput(value)).toBe(expected);
  });

  it('aceita colado com pontuação e +55', () => {
    expect(maskPhoneInput('+55 (41) 99999-8888')).toBe('(41) 99999-8888');
  });

  it('ignora dígitos a mais', () => {
    expect(maskPhoneInput('419999988889')).toBe('(41) 99999-8888');
  });
});

describe('maskCpfInput', () => {
  it.each([
    ['529', '529'],
    ['5299', '529.9'],
    ['5299822', '529.982.2'],
    ['52998224725', '529.982.247-25'],
  ])('formata %s enquanto digita -> %s', (value, expected) => {
    expect(maskCpfInput(value)).toBe(expected);
  });

  it('aceita colado com pontuação e ignora dígitos a mais', () => {
    expect(maskCpfInput('529.982.247-2599')).toBe('529.982.247-25');
  });
});

describe('rótulos dos padrões de visita', () => {
  it('começa a semana no domingo, como a API', () => {
    expect(WEEKDAY_LABELS[0]).toBe('Domingo');
    expect(WEEKDAY_LABELS[6]).toBe('Sábado');
  });

  it('formata estação e hora', () => {
    expect(SEASON_LABELS.verao).toBe('Verão');
    expect(formatHour(18)).toBe('18h');
  });
});
