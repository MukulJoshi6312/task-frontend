import { useEffect, useState } from "react";
import NetInfo from "@react-native-community/netinfo";

// Subscribe to the device's connectivity. Returns true if we have an
// internet-reachable connection, false otherwise. Uses NetInfo's
// `isInternetReachable` (more reliable than `isConnected`, which only checks
// the radio link).
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      const ok = state.isConnected && state.isInternetReachable !== false;
      setOnline(!!ok);
    });
    // Sync initial state.
    NetInfo.fetch().then((state) => {
      setOnline(!!(state.isConnected && state.isInternetReachable !== false));
    });
    return () => unsub();
  }, []);

  return online;
}
