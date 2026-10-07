import { describe, expect, it } from 'vitest';
import { Phone } from './phone.js';

describe('Phone', () => {
  it.each(['41999998888', '+55 (41) 99999-8888', '5541999998888', '(41) 99999 8888'])(
    'normaliza %s pra +5541999998888',
    (value) => {
      expect(Phone.create(value).e164).toBe('+5541999998888');
    },
  );

  it.each(['4133334444', '999998888', '(41) 89999-8888', '(01) 99999-8888', '+1 415 555 0100'])(
    'recusa %s',
    (value) => {
      expect(() => Phone.create(value)).toThrow('celular inválido');
    },
  );
});
