import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "../theme/ThemeContext";
import { FONTS } from "../theme/fonts";
import { useNotifications } from "../notifications/NotificationsContext";

type Props = { size?: number };

export default function BellIcon({ size = 22 }: Props) {
  const { theme } = useTheme();
  const router = useRouter();
  const { unread } = useNotifications();

  return (
    <TouchableOpacity
      onPress={() => router.push("/notifications")}
      hitSlop={8}
      activeOpacity={0.7}
      style={styles.btn}
    >
      <Ionicons name="notifications-outline" size={size} color={theme.ink} />
      {unread > 0 && (
        <View style={[styles.badge, { backgroundColor: theme.accent }]}>
          <Text style={styles.badgeText}>{unread > 9 ? "9+" : String(unread)}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: { padding: 4 },
  badge: {
    position: "absolute", top: 0, right: 0,
    minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 5,
    alignItems: "center", justifyContent: "center",
  },
  badgeText: { color: "#fff", fontSize: 10, fontFamily: FONTS.sansBold },
});
