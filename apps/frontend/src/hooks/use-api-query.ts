import { useCallback, useEffect, useState, type DependencyList } from 'react';
import { ApiRequestError } from '../api/dashboard-api';

export interface ApiQuery<T> {
  data: T | undefined;
  error: string | undefined;
  loading: boolean;
  retry: () => void;
}

// Mantenho o dado anterior enquanto carrega, pra tabela não piscar ao trocar de página.
export function useApiQuery<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  deps: DependencyList,
): ApiQuery<T> {
  const [data, setData] = useState<T>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    // abort evita mostrar resposta velha se o usuário trocar de filtro rápido
    const controller = new AbortController();
    setLoading(true);
    setError(undefined);

    fetcher(controller.signal)
      .then((result) => setData(result))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(
          err instanceof ApiRequestError ? err.message : 'Algo deu errado. Tente novamente.',
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return { data, error, loading, retry };
}
