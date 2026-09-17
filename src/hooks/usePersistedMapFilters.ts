import { useCallback, useEffect, useState } from 'react';
import { peekSession, subscribeSession, writeSession } from '@/lib/appSession';

function sameCats(a: string[], b: string[]) {
  return a.length === b.length && a.every((key) => b.includes(key));
}

export function usePersistedMapFilters() {
  const initial = peekSession();
  const [selected, setSelected] = useState<string[]>(initial.cats);
  const [search, setSearch] = useState(initial.q);

  useEffect(() => subscribeSession((session) => {
    setSelected((prev) => (sameCats(prev, session.cats) ? prev : session.cats));
    setSearch((prev) => (prev === session.q ? prev : session.q));
  }), []);

  const setCategories = useCallback((next: string[]) => {
    setSelected((prev) => (sameCats(prev, next) ? prev : next));
    writeSession({ cats: next }, 'replace');
  }, []);

  const setSearchQuery = useCallback((next: string) => {
    setSearch(next);
    writeSession({ q: next }, 'replace');
  }, []);

  return { selected, search, setCategories, setSearch: setSearchQuery };
}
