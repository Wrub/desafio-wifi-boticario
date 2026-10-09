import { formatNumber } from './format';

export interface ChartItem {
  key: string | number;
  label: string;
  // rótulo curto embaixo da coluna (ex.: "Jan"); o completo fica no tooltip
  shortLabel?: string;
  value: number;
}

export interface ChartProps {
  items: ChartItem[];
  // item em destaque (o maior); os outros ficam num tom mais claro
  highlightKey?: string | number;
}

export const chartTooltip = (item: ChartItem) =>
  `${item.label}: ${formatNumber(item.value)} acessos`;
