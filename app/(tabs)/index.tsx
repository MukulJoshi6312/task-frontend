import { useCallback, useMemo, useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Alert,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/ThemeContext";
import { TAG_COLORS, PRIORITIES } from "../../theme/theme";
import { FONTS } from "../../theme/fonts";
import { fetchTasks, createTask, updateTask } from "../../api/tasks";
import TaskSheet from "../../components/TaskSheet";
import Avatar from "../../components/Avatar";
import {
  formatDue, isToday as dueToday, isUpcoming as dueUpcoming, greetingForNow,
} from "../../lib/dates";
import { useAuth } from "../../auth/AuthContext";
import type { Task, Subtask } from "../../types";

const FILTERS = ["All", "Today", "Upcoming", "Done"] as const;
type Filter = typeof FILTERS[number];

const EMPTY_COPY: Record<Filter, string> = {
  All: "No tasks yet. Tap + to add one.",
  Today: "Nothing due today. Enjoy the breathing room.",
  Upcoming: "Nothing upcoming. Add a task to plan ahead.",
  Done: "No completed tasks yet. Get something checked off.",
};

type Theme = ReturnType<typeof useTheme>["theme"];

const todayString = () => {
  const d = new Date();
  const dayName = d.toLocaleDateString(undefined, { weekday: "long" });
  const day = d.getDate();
  const month = d.toLocaleDateString(undefined, { month: "short" });
  return `${dayName}, ${day} ${month}`;
};

export default function HomeScreen() {
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const router = useRouter();
  const { user } = useAuth();

  const [tasks, setTasks] = useState<Task[]>([]);
  // `initialised` is set true after the very first fetch finishes.
  // It controls the centered spinner that only shows before we have any data.
  const [initialised, setInitialised] = useState(false);
  // `refreshing` is only ever set by an explicit pull-to-refresh — never by
  // the silent refetch that runs when the tab regains focus. Without this
  // split, returning to the tab would show the pull-to-refresh spinner and
  // push the task list down.
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>("All");
  const [sheetOpen, setSheetOpen] = useState(false);

  const greetingName = user?.name?.trim() || user?.email?.split("@")[0] || "there";

  const load = useCallback(async () => {
    try {
      const next = await fetchTasks();
      setTasks(next);
    } catch (e) {
      console.error("[Home] fetchTasks failed:", e);
      Alert.alert("Error", "Could not load tasks. Is the API running?");
    } finally {
      setInitialised(true);
      setRefreshing(false);
    }
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filtered = useMemo(() => {
    return tasks.filter((x) => {
      if (filter === "Done") return x.completed;
      if (filter === "Today") return dueToday(x.due) && !x.completed;
      if (filter === "Upcoming") return dueUpcoming(x.due) && !x.completed;
      return true;
    });
  }, [tasks, filter]);

  const remaining = tasks.filter((x) => !x.completed).length;

  const toggleDone = async (task: Task) => {
    const next = { ...task, completed: !task.completed };
    setTasks((prev) => prev.map((t) => (t._id === task._id ? next : t)));
    try {
      const updated = await updateTask(task._id, { completed: next.completed });
      setTasks((prev) => prev.map((t) => (t._id === task._id ? updated : t)));
    } catch {
      setTasks((prev) => prev.map((t) => (t._id === task._id ? task : t)));
    }
  };

  const handleCreate = async (data: {
    title: string; note: string; tag: string; priority: Task["priority"]; due: string | null; subtasks: Subtask[];
  }) => {
    setSheetOpen(false);
    try {
      const created = await createTask(data);
      setTasks((prev) => [created, ...prev]);
    } catch (e) {
      console.error("[Home] createTask failed:", e);
      Alert.alert("Error", "Could not create task.");
    }
  };

  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      <View style={s.header}>
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Text style={s.dateLine}>{todayString()}</Text>
          <Text style={s.greeting}>{greetingForNow()},{"\n"}{greetingName}</Text>
        </View>
        <Avatar url={user?.avatarUrl} name={user?.name} email={user?.email} size={52} />
      </View>
      <Text style={s.sub}>
        You have <Text style={{ color: theme.accent, fontFamily: FONTS.sansBold }}>{remaining} tasks</Text> left for today.
      </Text>

      <View style={s.filtersRow}>
        {FILTERS.map((f) => {
          const on = filter === f;
          return (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              style={[
                s.filterChip,
                // Match borderWidth between states so the chip's outer size never changes.
                // Selected: border matches its own background (no visible ring, no
                // "transparent border" rendering quirk). Unselected: theme.line ring.
                on
                  ? { backgroundColor: theme.chipActive, borderColor: theme.chipActive }
                  : { backgroundColor: theme.chipBg, borderColor: theme.line },
              ]}
            >
              <Text
                style={{
                  color: on ? theme.chipActiveInk : theme.inkSoft,
                  fontSize: 14,
                  lineHeight: 18,
                  fontFamily: FONTS.sansSemi,
                  includeFontPadding: false,
                }}
              >
                {f}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {!initialised && tasks.length === 0 ? (
        <View style={[s.flex1, s.center]}>
          <ActivityIndicator color={theme.accent} size="large" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(t) => t._id}
          contentContainerStyle={{ padding: 18, paddingBottom: 120 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={{ fontSize: 40, marginBottom: 8, color: theme.inkFaint }}>✦</Text>
              <Text style={{ color: theme.inkFaint, fontFamily: FONTS.sansSemi, fontSize: 14 }}>
                {EMPTY_COPY[filter]}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TaskCard
              task={item}
              theme={theme}
              onToggle={() => toggleDone(item)}
              onOpen={() => router.push({ pathname: "/task/[id]", params: { id: item._id } })}
            />
          )}
        />
      )}

      <TouchableOpacity
        onPress={() => setSheetOpen(true)}
        activeOpacity={0.85}
        style={[s.fab, { backgroundColor: theme.accent, shadowColor: theme.accent }]}
      >
        <Ionicons name="add" size={32} color={theme.accentInk} />
      </TouchableOpacity>

      <TaskSheet
        visible={sheetOpen}
        title="New task"
        onClose={() => setSheetOpen(false)}
        onSubmit={handleCreate}
      />
    </SafeAreaView>
  );
}

function TaskCard({
  task, theme, onToggle, onOpen,
}: {
  task: Task; theme: Theme; onToggle: () => void; onOpen: () => void;
}) {
  const s = makeStyles(theme);
  const p = PRIORITIES[task.priority];
  const tagColor = TAG_COLORS[task.tag] || theme.inkSoft;
  return (
    <TouchableOpacity onPress={onOpen} activeOpacity={0.85} style={[s.card, task.completed && { opacity: 0.62 }]}>
      <TouchableOpacity
        onPress={onToggle}
        hitSlop={10}
        style={[
          s.check,
          { borderColor: task.completed ? p.color : theme.line, backgroundColor: task.completed ? p.color : "transparent" },
        ]}
      >
        {task.completed && <Ionicons name="checkmark" size={14} color="#fff" />}
      </TouchableOpacity>

      <View style={{ flex: 1 }}>
        <Text style={[s.cardTitle, { color: theme.ink }, task.completed && { textDecorationLine: "line-through" }]}>
          {task.title}
        </Text>
        <View style={s.metaRow}>
          <Text style={{ fontSize: 12, fontFamily: FONTS.sansSemi, color: tagColor }}>● {task.tag}</Text>
          {!!task.due && (
            <Text style={{ fontSize: 12, color: theme.inkFaint, fontFamily: FONTS.sansMedium }}>{formatDue(task.due)}</Text>
          )}
        </View>
      </View>

      <View style={[s.pri, { backgroundColor: p.color + "1F" }]}>
        <Text style={{ fontSize: 10.5, fontFamily: FONTS.sansBold, color: p.color, letterSpacing: 0.3 }}>{p.label}</Text>
      </View>
    </TouchableOpacity>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: t.bg },
    flex1: { flex: 1 },
    center: { alignItems: "center", justifyContent: "center" },
    header: {
      paddingHorizontal: 24, paddingTop: 12, paddingBottom: 6,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    dateLine: { fontSize: 13, color: t.inkSoft, fontFamily: FONTS.sansMedium, letterSpacing: 0.2 },
    greeting: { fontSize: 34, fontFamily: FONTS.serifSemi, color: t.ink, marginTop: 6, letterSpacing: -0.5, lineHeight: 40 },
    sub: { paddingHorizontal: 24, marginTop: 14, fontSize: 14, color: t.inkSoft, fontFamily: FONTS.sansMedium },
    filtersRow: {
      flexDirection: "row",
      paddingHorizontal: 24, paddingTop: 14, paddingBottom: 6,
      gap: 8,
    },
    filterChip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 999, borderWidth: 1 },
    empty: { alignItems: "center", paddingTop: 80 },
    card: {
      flexDirection: "row", gap: 14, alignItems: "flex-start",
      padding: 16, marginBottom: 10, borderRadius: 22,
      backgroundColor: t.surface, borderWidth: 1, borderColor: t.line,
    },
    check: {
      width: 24, height: 24, borderRadius: 8, borderWidth: 2,
      alignItems: "center", justifyContent: "center", marginTop: 1,
    },
    cardTitle: { fontSize: 15.5, fontFamily: FONTS.sansSemi, lineHeight: 20 },
    metaRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 8, flexWrap: "wrap" },
    pri: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8 },
    fab: {
      position: "absolute", right: 22, bottom: 16, width: 62, height: 62,
      borderRadius: 22, alignItems: "center", justifyContent: "center",
      shadowOpacity: 0.55, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
      elevation: 10,
    },
  });
