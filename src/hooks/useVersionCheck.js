// @ts-nocheck
import { useEffect, useRef, useState } from 'react';

const POLL_INTERVAL = 60 * 1000; // check every 60 seconds

export function useVersionCheck() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const initialVersion = useRef(null);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch('/version.json?t=' + Date.now(), { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (initialVersion.current === null) {
          initialVersion.current = data.v;
        } else if (data.v !== initialVersion.current) {
          setUpdateAvailable(true);
        }
      } catch {
        // network error — ignore
      }
    };

    check();
    const id = setInterval(check, POLL_INTERVAL);
    return () => clearInterval(id);
  }, []);

  return updateAvailable;
}
