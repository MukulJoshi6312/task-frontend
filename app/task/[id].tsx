import { useCallback, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/ThemeContext";
import { TAG_COLORS, PRIORITIES } from "../../theme/theme";
import { FONTS } from "../../theme/fonts";
import { fetchTask, updateTask, deleteTask } from "../../api/tasks";
import { formatDue } from "../../lib/dates";
import TaskSheet from "../../components/TaskSheet";
import type { Task, Priority, Subtask } from "../../types";

type Theme = ReturnType<typeof useTheme>["theme"];

export default function TaskDetailScreen() {
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const router = useRouter();
  // useLocalSearchParams reads the dynamic [id] segment.
  // It returns string | string[] | undefined, so we narrow:
  const params = useLocalSearchParams<{ id: string }>();
  const id = typeof params.id === "string" ? params.id : "";

  const [task, setTask] = useState<Task | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      fetchTask(id).then(setTask).catch(() => {});
    }, [id])
  );

  if (!task) {
    return (
      <SafeAreaView style={[s.root, s.center]}>
        <ActivityIndicator color={theme.accent} />
      </SafeAreaView>
    );
  }

  const p = PRIORITIES[task.priority];
  const tagColor = TAG_COLORS[task.tag] || theme.inkSoft;
  const doneCount = task.subtasks.filter((x) => x.d).length;
  const pct = task.subtasks.length
    ? Math.round((doneCount / task.subtasks.length) * 100)
    : task.completed ? 100 : 0;

  const toggleSub = async (idx: number) => {
    const subtasks = task.subtasks.map((x, i) => (i === idx ? { ...x, d: !x.d } : x));
    setTask({ ...task, subtasks });
    try {
      const updated = await updateTask(task._id, { subtasks });
      setTask(updated);
    } catch {
      setTask(task);
    }
  };

  const toggleComplete = async () => {
    const next = { ...task, completed: !task.completed };
    setTask(next);
    try {
      const updated = await updateTask(task._id, { completed: next.completed });
      setTask(updated);
    } catch {
      setTask(task);
    }
  };

  const handleEdit = async (data: {
    title: string; note: string; tag: string; priority: Priority; due: string | null; subtasks: Subtask[];
  }) => {
    setEditOpen(false);
    try {
      const updated = await updateTask(task._id, data);
      setTask(updated);
    } catch {
      Alert.alert("Error", "Could not save changes.");
    }
  };

  const remove = () => {
    Alert.alert("Delete task", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteTask(task._id);
            router.back();
          } catch {
            Alert.alert("Error", "Could not delete task.");
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={s.iconBtn}>
          <Ionicons name="chevron-back" size={20} color={theme.ink} />
        </TouchableOpacity>
        <Text style={{ color: theme.inkSoft, fontFamily: FONTS.sansSemi, fontSize: 13 }}>Task details</Text>
        <TouchableOpacity onPress={() => setEditOpen(true)} style={s.iconBtn}>
          <Ionicons name="pencil-outline" size={16} color={theme.ink} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 140 }}>
        <View style={s.badgesRow}>
          <View style={[s.badge, { backgroundColor: tagColor + "1A" }]}>
            <Text style={{ color: tagColor, fontFamily: FONTS.sansBold, fontSize: 11.5 }}>{task.tag}</Text>
          </View>
          <View style={[s.badge, { backgroundColor: p.color + "1A" }]}>
            <Text style={{ color: p.color, fontFamily: FONTS.sansBold, fontSize: 11.5 }}>{p.label} priority</Text>
          </View>
        </View>

        <Text
          style={[
            s.title,
            { color: theme.ink },
            task.completed && { textDecorationLine: "line-through", opacity: 0.6 },
          ]}
        >
          {task.title}
        </Text>

        {!!task.due && (
          <View style={s.dueRow}>
            <Ionicons name="time-outline" size={16} color={theme.inkSoft} />
            <Text style={{ color: theme.inkSoft, fontFamily: FONTS.sansSemi, fontSize: 13.5 }}>{formatDue(task.due)}</Text>
          </View>
        )}

        <View style={s.progressCard}>
          <View style={s.progressHead}>
            <Text style={{ color: theme.inkSoft, fontFamily: FONTS.sansSemi, fontSize: 13 }}>Progress</Text>
            <Text style={{ color: theme.ink, fontFamily: FONTS.sansSemi, fontSize: 13 }}>{pct}%</Text>
          </View>
          <View style={[s.progressTrack, { backgroundColor: theme.line }]}>
            <View style={[s.progressFill, { width: `${pct}%`, backgroundColor: theme.accent }]} />
          </View>
        </View>

        <SectionTitle theme={theme}>Notes</SectionTitle>
        <Text style={{ color: theme.inkSoft, fontSize: 14.5, lineHeight: 22, fontFamily: FONTS.sansMedium }}>
          {task.note || "No notes added."}
        </Text>

        {task.subtasks.length > 0 && (
          <>
            <SectionTitle theme={theme}>
              Subtasks · {doneCount}/{task.subtasks.length}
            </SectionTitle>
            <View style={{ gap: 8 }}>
              {task.subtasks.map((st, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => toggleSub(i)}
                  activeOpacity={0.85}
                  style={[s.subRow, { backgroundColor: theme.surface, borderColor: theme.line }]}
                >
                  <View
                    style={[
                      s.subCheck,
                      {
                        borderColor: st.d ? theme.accent : theme.line,
                        backgroundColor: st.d ? theme.accent : "transparent",
                      },
                    ]}
                  >
                    {st.d && <Ionicons name="checkmark" size={14} color={theme.accentInk} />}
                  </View>
                  <Text
                    style={[
                      { color: theme.ink, fontSize: 14.5, fontFamily: FONTS.sansMedium, flex: 1 },
                      st.d && { textDecorationLine: "line-through", opacity: 0.55 },
                    ]}
                  >
                    {st.t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <TouchableOpacity onPress={remove} style={s.deleteBtn}>
          <Text style={{ color: theme.danger, fontFamily: FONTS.sansBold, fontSize: 14 }}>Delete task</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={[s.bottomBar, { backgroundColor: theme.bg }]}>
        <TouchableOpacity
          onPress={toggleComplete}
          activeOpacity={0.85}
          style={[
            s.markBtn,
            task.completed
              ? { backgroundColor: theme.surface, borderColor: theme.line, borderWidth: 1 }
              : { backgroundColor: theme.accent, shadowColor: theme.accent },
          ]}
        >
          <Text
            style={{
              color: task.completed ? theme.ink : theme.accentInk,
              fontFamily: FONTS.sansBold, fontSize: 15.5,
            }}
          >
            {task.completed ? "Mark as not done" : "Mark complete ✓"}
          </Text>
        </TouchableOpacity>
      </View>

      <TaskSheet
        visible={editOpen}
        title="Update task"
        initial={task}
        onClose={() => setEditOpen(false)}
        onSubmit={handleEdit}
      />
    </SafeAreaView>
  );
}

function SectionTitle({ children, theme }: { children: React.ReactNode; theme: Theme }) {
  return (
    <Text
      style={{
        marginTop: 26, marginBottom: 12, fontSize: 12, fontFamily: FONTS.sansBold,
        letterSpacing: 1, color: theme.inkFaint, textTransform: "uppercase",
      }}
    >
      {children}
    </Text>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: t.bg },
    center: { alignItems: "center", justifyContent: "center" },
    topBar: {
      paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8,
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    },
    iconBtn: {
      width: 42, height: 42, borderRadius: 14, borderWidth: 1, borderColor: t.line,
      backgroundColor: t.surface, alignItems: "center", justifyContent: "center",
    },
    badgesRow: { flexDirection: "row", gap: 8, marginBottom: 14, marginTop: 12 },
    badge: { paddingHorizontal: 11, paddingVertical: 6, borderRadius: 8 },
    title: { fontSize: 30, fontFamily: FONTS.serifSemi, lineHeight: 36, letterSpacing: -0.5 },
    dueRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 14 },
    progressCard: {
      marginTop: 22, padding: 18, borderRadius: 20,
      backgroundColor: t.surface, borderWidth: 1, borderColor: t.line,
    },
    progressHead: { flexDirection: "row", justifyContent: "space-between" },
    progressTrack: { height: 9, borderRadius: 99, marginTop: 10, overflow: "hidden" },
    progressFill: { height: "100%", borderRadius: 99 },
    subRow: {
      flexDirection: "row", alignItems: "center", gap: 12,
      padding: 14, borderRadius: 16, borderWidth: 1,
    },
    subCheck: {
      width: 24, height: 24, borderRadius: 8, borderWidth: 2,
      alignItems: "center", justifyContent: "center",
    },
    deleteBtn: { marginTop: 32, alignItems: "center", paddingVertical: 12 },
    bottomBar: {
      position: "absolute", left: 0, right: 0, bottom: 0,
      paddingHorizontal: 24, paddingTop: 16, paddingBottom: 30,
    },
    markBtn: {
      paddingVertical: 16, borderRadius: 18, alignItems: "center",
      shadowOpacity: 0.45, shadowRadius: 14, shadowOffset: { width: 0, height: 8 },
      elevation: 8,
    },
  });
