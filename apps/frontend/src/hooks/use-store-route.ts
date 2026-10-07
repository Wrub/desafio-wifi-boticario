import { useCallback, useEffect, useState } from 'react';

// "/" é a grade de lojas (todas) e /lojas/<id> é uma loja específica.
const STORE_PATH = /^\/lojas\/([^/]+)\/?$/;

export function storePath(storeId: string): string {
  return `/lojas/${encodeURIComponent(storeId)}`;
}

export function storeIdFromPath(pathname: string): string | undefined {
  const match = STORE_PATH.exec(pathname);
  if (!match) return undefined;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

export function useStoreRoute() {
  const [storeId, setStoreId] = useState(() => storeIdFromPath(window.location.pathname));

  useEffect(() => {
    const onPopState = () => setStoreId(storeIdFromPath(window.location.pathname));
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // null volta pra grade de lojas ("/")
  const navigate = useCallback((nextId: string | null) => {
    const path = nextId ? storePath(nextId) : '/';
    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path + window.location.search);
    }
    setStoreId(nextId ?? undefined);
  }, []);

  return { storeId, navigate };
}
