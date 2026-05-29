import * as SecureStore from "expo-secure-store";

// SecureStore uses iOS Keychain and Android Keystore.
// More secure than AsyncStorage (which is plaintext) for sensitive data like tokens.
const KEY = "taskly.auth.token";

export const tokenStorage = {
  get: () => SecureStore.getItemAsync(KEY),
  set: (token: string) => SecureStore.setItemAsync(KEY, token),
  clear: () => SecureStore.deleteItemAsync(KEY),
};
