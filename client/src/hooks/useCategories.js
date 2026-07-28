import { useEffect, useState } from 'react';
import { getCategories } from '../api/categories';

let cache = null;

export function useCategories() {
  const [categories, setCategories] = useState(cache || []);
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    if (cache) return;
    getCategories()
      .then((data) => {
        cache = data;
        setCategories(data);
      })
      .finally(() => setLoading(false));
  }, []);

  return { categories, loading };
}
