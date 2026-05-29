import axios from "axios";
import Constants from "expo-constants";
import { tokenStorage } from "../lib/tokenStorage";

const SERVER_PORT = 4000;

// On a real device, `localhost` means the phone itself. We derive the dev
// machine's LAN IP from the same hostUri Metro uses, so the device can reach
// the API at http://<your-mac-ip>:4000/api automatically.
const debuggerHost =
  Constants.expoConfig?.hostUri ??
  (Constants as { expoGoConfig?: { hostUri?: string } }).expoGoConfig?.hostUri;

const devHost = debuggerHost?.split(":")[0] ?? "localhost";

export const BASE_URL = `http://${devHost}:${SERVER_PORT}/api`;

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
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
