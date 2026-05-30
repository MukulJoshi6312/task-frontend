import { useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import { useTheme } from "../theme/ThemeContext";
import { FONTS } from "../theme/fonts";
import { useNotifications } from "../notifications/NotificationsContext";
import type { Notification } from "../types";

type Theme = ReturnType<typeof useTheme>["theme"];

// Quick readable timestamp: "now", "5m", "2h", "Yesterday", or "Mon, 12 May"
function timeAgo(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 2 * 86400) return "Yesterday";
  return d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
}

// Pick an icon for a notification type. Open-ended so we can add types later.
function iconFor(type: string): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case "welcome": return "hand-left-outline";
    case "task_completed": return "checkmark-circle-outline";
    case "task_due": return "alarm-outline";
    default: return "notifications-outline";
  }
}

export default function NotificationsScreen() {
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const router = useRouter();
  const { items, unread, loading, reload, markRead, markAllRead, remove, clearAll } = useNotifications();

  // Refetch every time the screen regains focus — keeps the inbox fresh.
  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  const onPress = (n: Notification) => {
    if (!n.read) void markRead(n._id);
    if (n.taskId) router.push({ pathname: "/task/[id]", params: { id: n.taskId } });
  };

  const confirmClearAll = () => {
    if (items.length === 0) return;
    Alert.alert("Clear all", "Remove every notification?", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear", style: "destructive", onPress: () => void clearAll() },
    ]);
  };

  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={s.iconBtn}>
          <Ionicons name="chevron-back" size={20} color={theme.ink} />
        </TouchableOpacity>
        <Text style={{ color: theme.inkSoft, fontFamily: FONTS.sansSemi, fontSize: 13 }}>Notifications</Text>
        <TouchableOpacity onPress={confirmClearAll} style={s.iconBtn} disabled={items.length === 0}>
          <Ionicons name="trash-outline" size={18} color={items.length === 0 ? theme.inkFaint : theme.ink} />
        </TouchableOpacity>
      </View>

      <View style={s.titleRow}>
        <Text style={s.title}>Inbox</Text>
        {unread > 0 && (
          <TouchableOpacity onPress={() => void markAllRead()} style={s.markAllBtn}>
            <Text style={{ color: theme.accent, fontFamily: FONTS.sansBold, fontSize: 13 }}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={items}
        keyExtractor={(n) => n._id}
        contentContainerStyle={{ padding: 18, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} tintColor={theme.accent} />}
        ListEmptyComponent={
          <View style={s.empty}>
            <Ionicons name="notifications-off-outline" size={36} color={theme.inkFaint} />
            <Text style={s.emptyText}>No notifications yet</Text>
          </View>
        }
        renderItem={({ item }) => (
          <ReanimatedSwipeable
            friction={2}
            rightThreshold={40}
            renderRightActions={() => (
              <TouchableOpacity
                onPress={() => void remove(item._id)}
                activeOpacity={0.85}
                style={s.deleteAction}
              >
                <Ionicons name="trash-outline" size={22} color="#fff" />
                <Text style={s.deleteActionText}>Delete</Text>
              </TouchableOpacity>
            )}
          >
            <NotificationRow item={item} theme={theme} onPress={() => onPress(item)} />
          </ReanimatedSwipeable>
        )}
      />
    </SafeAreaView>
  );
}

function NotificationRow({
  item, theme, onPress,
}: { item: Notification; theme: Theme; onPress: () => void }) {
  const s = makeStyles(theme);
  // VISUAL DIFFERENCE: unread rows get accent-tinted background, a colored
  // left bar, and bolder text. Read rows are flat and muted.
  const unread = !item.read;
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[
        s.card,
        unread && { backgroundColor: theme.accentSoft, borderColor: theme.accent + "40" },
      ]}
    >
      {unread && <View style={[s.unreadBar, { backgroundColor: theme.accent }]} />}
      <View style={[s.icon, { backgroundColor: unread ? theme.accent + "22" : theme.surfaceAlt }]}>
        <Ionicons
          name={iconFor(item.type)}
          size={18}
          color={unread ? theme.accent : theme.inkSoft}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[s.cardTitle, { color: theme.ink, fontFamily: unread ? FONTS.sansBold : FONTS.sansSemi }]}>
          {item.title}
        </Text>
        {!!item.body && (
          <Text style={[s.cardBody, { color: theme.inkSoft }]} numberOfLines={2}>
            {item.body}
          </Text>
        )}
        <Text style={[s.cardTime, { color: theme.inkFaint }]}>{timeAgo(item.createdAt)}</Text>
      </View>
      {unread && <View style={[s.dot, { backgroundColor: theme.accent }]} />}
    </TouchableOpacity>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: t.bg },
    topBar: {
      paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8,
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    },
    iconBtn: {
      width: 42, height: 42, borderRadius: 14, borderWidth: 1, borderColor: t.line,
      backgroundColor: t.surface, alignItems: "center", justifyContent: "center",
    },
    titleRow: {
      paddingHorizontal: 24, paddingTop: 4, paddingBottom: 6,
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    },
    title: { fontSize: 30, fontFamily: FONTS.serifSemi, color: t.ink, letterSpacing: -0.5 },
    markAllBtn: { paddingVertical: 6, paddingHorizontal: 4 },
    empty: { alignItems: "center", paddingTop: 80, gap: 10 },
    emptyText: { color: t.inkFaint, fontFamily: FONTS.sansSemi, fontSize: 14 },
    card: {
      position: "relative", overflow: "hidden",
      flexDirection: "row", alignItems: "flex-start", gap: 12,
      padding: 14, paddingLeft: 18, marginBottom: 10, borderRadius: 18,
      backgroundColor: t.surface, borderWidth: 1, borderColor: t.line,
    },
    unreadBar: { position: "absolute", left: 0, top: 0, bottom: 0, width: 4 },
    icon: {
      width: 36, height: 36, borderRadius: 11,
      alignItems: "center", justifyContent: "center",
    },
    cardTitle: { fontSize: 14.5, lineHeight: 19 },
    cardBody: { fontSize: 13, fontFamily: FONTS.sansMedium, marginTop: 3, lineHeight: 18 },
    cardTime: { fontSize: 11, fontFamily: FONTS.sansMedium, marginTop: 6 },
    dot: { width: 8, height: 8, borderRadius: 4, marginTop: 6, marginLeft: 4 },
    deleteAction: {
      width: 88, marginBottom: 10, borderRadius: 18,
      backgroundColor: t.danger,
      alignItems: "center", justifyContent: "center", gap: 4,
    },
    deleteActionText: { color: "#fff", fontFamily: FONTS.sansBold, fontSize: 12 },
  });
