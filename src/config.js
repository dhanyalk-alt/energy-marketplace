import axios from "axios";

// The local FastAPI server runs on port 8000. A VITE_API_BASE_URL value still
// takes precedence for deployments or a different local setup.
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
    })
      .catch((error) => {
        // Do not expose the browser-specific "signal is aborted" message.
        if (controller.signal.aborted && !init.signal?.aborted) {
          throw new Error(
            `The request timed out after ${REQUEST_TIMEOUT_MS / 1000} seconds. Please check that the backend is running.`
          );
        }
        throw error;
      })
      .finally(() => window.clearTimeout(timeoutId));
  };

  window.__energyMarketplaceFetchTimeout = true;
}
