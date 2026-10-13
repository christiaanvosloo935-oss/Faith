import { useEffect, useState } from 'react';

const CHECK_EVERY = 10 * 60 * 1000;

/** True once a newer build than the one running has been published. */
export function useUpdateAvailable() {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    if (!import.meta.env.PROD) return;
    let stop = false;
    const check = async () => {
      try {
        const res = await fetch(`./version.json?t=${Date.now()}`, { cache: 'no-store' });
        const { build } = (await res.json()) as { build?: string };
        if (!stop && build && build !== __BUILD_ID__) setAvailable(true);
      } catch {
        /* offline or not published yet: try again later */
      }
    };
    void check();
    const timer = setInterval(check, CHECK_EVERY);
    const onVisible = () => document.visibilityState === 'visible' && void check();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      stop = true;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return available;
}

/** Load the newest files, bypassing the browser's HTTP cache, then restart. */
export async function applyUpdate() {
  try {
    await fetch('./index.html', { cache: 'reload' });
    await (await navigator.serviceWorker?.getRegistration())?.update();
  } catch {
    /* reload anyway */
  }
  location.reload();
}
