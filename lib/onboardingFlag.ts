import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "taskly:onboarded";

export const onboardingFlag = {
  async hasSeen(): Promise<boolean> {
    try { return (await AsyncStorage.getItem(KEY)) === "yes"; }
    catch { return false; }
  },
  async markSeen() {
    try { await AsyncStorage.setItem(KEY, "yes"); }
    catch (e) { console.warn("[onboardingFlag] save failed:", e); }
  },
  async reset() {
    try { await AsyncStorage.removeItem(KEY); }
    catch { /* ignore */ }
  },
};
