import axios from "axios";
import Constants from "expo-constants";
import { tokenStorage } from "../lib/tokenStorage";

const SERVER_PORT = 4000;

// The deployed backend on Render. Used by default so installed builds and any
// device (not just one on the dev LAN) can reach the API.
const DEPLOYED_URL = "https://taskly-backend-mn0y.onrender.com/api";

// On a real device in dev, `localhost` means the phone itself. We derive the
// dev machine's LAN IP from the same hostUri Metro uses, so the device can
// reach a locally-running API at http://<your-mac-ip>:4000/api.
const debuggerHost =
  Constants.expoConfig?.hostUri ??
  (Constants as { expoGoConfig?: { hostUri?: string } }).expoGoConfig?.hostUri;

const devHost = debuggerHost?.split(":")[0] ?? "localhost";
const LOCAL_URL = `http://${devHost}:${SERVER_PORT}/api`;

// Precedence: explicit env override → deployed Render URL → local dev server.
// Set EXPO_PUBLIC_API_URL=http://<mac-ip>:4000/api to test against a local server.
export const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? DEPLOYED_URL ?? LOCAL_URL;
// export const BASE_URL = LOCAL_URL;

const client = axios.create({
  baseURL: BASE_URL,
  // Render's free tier cold-starts (~30-60s) after idling, so the first
  // request can be slow. A generous timeout avoids spurious failures.
  timeout: 60000,
  headers: { "Content-Type": "application/json" },
});

// Callback set by AuthContext: invoked when the server says our token is no good.
// Keeping it as a setter (rather than importing AuthContext here) avoids a circular dep.
let onUnauthorized: (() => void) | null = null;
export const setOnUnauthorized = (fn: (() => void) | null) => {
  onUnauthorized = fn;
};

// Attach the JWT to every outgoing request if we have one.
client.interceptors.request.use(async (cfg) => {
  const token = await tokenStorage.get();
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  if (__DEV__) console.log("[API →]", cfg.method?.toUpperCase(), cfg.baseURL + (cfg.url ?? ""));
  return cfg;
});

client.interceptors.response.use(
  (r) => {
    if (__DEV__) console.log("[API ←]", r.status, r.config.url);
    return r;
  },
  async (err) => {
    if (__DEV__) {
      console.warn("[API ✗]", err.message, "→", err.config?.baseURL + (err.config?.url ?? ""));
    }
    // 401 means our token is invalid or expired. Boot the user out so they re-login.
    if (err.response?.status === 401 && onUnauthorized) onUnauthorized();
    return Promise.reject(err);
  }
);

export default client;
