import * as Device from "expo-device";
import { Platform } from "react-native";

// Returns a friendly short string like "iPhone 14 · iOS 17.5" or
// "Pixel 7 · Android 14". Used as the value sent to the backend on login.
export function describeDevice(): string {
  const model = Device.modelName?.trim() || (Platform.OS === "ios" ? "iPhone" : "Android device");
  const osName = Device.osName || (Platform.OS === "ios" ? "iOS" : "Android");
  const osVersion = Device.osVersion || "";
  const os = osVersion ? `${osName} ${osVersion}` : osName;
  return `${model} · ${os}`;
}
