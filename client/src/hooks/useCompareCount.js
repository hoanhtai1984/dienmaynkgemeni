import { useEffect, useState } from 'react';
import { getCompareIds, COMPARE_UPDATED_EVENT } from '../utils/compare';

export function useCompareIds() {
  const [ids, setIds] = useState(getCompareIds);

  useEffect(() => {
    const update = () => setIds(getCompareIds());
    window.addEventListener('storage', update);
    window.addEventListener(COMPARE_UPDATED_EVENT, update);
    return () => {
      window.removeEventListener('storage', update);
      window.removeEventListener(COMPARE_UPDATED_EVENT, update);
    };
  }, []);

  return ids;
}
