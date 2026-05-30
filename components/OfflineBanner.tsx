import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeContext";
import { FONTS } from "../theme/fonts";
import { useOnlineStatus } from "../lib/network";

export default function OfflineBanner() {
  const { theme } = useTheme();
  const online = useOnlineStatus();
  if (online) return null;

  return (
    <View style={[styles.bar, { backgroundColor: theme.danger }]}>
      <Ionicons name="cloud-offline-outline" size={14} color="#fff" />
      <Text style={styles.text}>You're offline — viewing cached tasks</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    paddingVertical: 6, paddingHorizontal: 12,
  },
  text: { color: "#fff", fontFamily: FONTS.sansBold, fontSize: 12 },
});
