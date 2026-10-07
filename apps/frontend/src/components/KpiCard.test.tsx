import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { KpiCard } from './KpiCard';

describe('KpiCard', () => {
  it('mostra o label e o número no formato brasileiro', () => {
    render(<KpiCard label="Visitas" value={12345} />);

    expect(screen.getByRole('heading', { name: 'Visitas' })).toBeInTheDocument();
    expect(screen.getByText('12.345')).toBeInTheDocument();
  });

  it('mostra casas decimais quando pedido', () => {
    render(<KpiCard label="Visitas por pessoa" value={2.456} fractionDigits={1} />);
    expect(screen.getByText('2,5')).toBeInTheDocument();
  });
});
