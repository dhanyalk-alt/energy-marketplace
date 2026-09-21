import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
export const REQUEST_TIMEOUT_MS = 25000;

axios.defaults.timeout = REQUEST_TIMEOUT_MS;

if (typeof window !== "undefined" && !window.__energyMarketplaceFetchTimeout) {
  const nativeFetch = window.fetch.bind(window);

  window.fetch = (input, init = {}) => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(
      () => controller.abort(),
      REQUEST_TIMEOUT_MS
    );

    return nativeFetch(input, {
      ...init,
      signal: init.signal || controller.signal,
    }).finally(() => window.clearTimeout(timeoutId));
  };

  window.__energyMarketplaceFetchTimeout = true;
}
