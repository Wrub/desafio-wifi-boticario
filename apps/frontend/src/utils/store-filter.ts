import type { StoreSummary } from '@wifi/contracts';
import { normalizeText } from './format';

export function filterStores(stores: StoreSummary[], search: string): StoreSummary[] {
  const term = normalizeText(search);
  if (!term) return stores;
  return stores.filter((store) => normalizeText(`${store.name} ${store.city}`).includes(term));
}
