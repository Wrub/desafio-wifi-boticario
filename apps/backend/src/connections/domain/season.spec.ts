import { describe, expect, it } from 'vitest';
import { seasonOfMonth } from './season.js';

describe('seasonOfMonth', () => {
  it.each([
    [12, 'verao'],
    [1, 'verao'],
    [2, 'verao'],
    [3, 'outono'],
    [5, 'outono'],
    [6, 'inverno'],
    [8, 'inverno'],
    [9, 'primavera'],
    [11, 'primavera'],
  ])('mês %i é %s', (month, season) => {
    expect(seasonOfMonth(month)).toBe(season);
  });

  it.each([0, 13, 1.5])('recusa o mês %s', (month) => {
    expect(() => seasonOfMonth(month)).toThrow(RangeError);
  });
});
