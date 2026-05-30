import { useState, type ReactNode } from "react";
import {
  Modal, View, Text, TextInput, TouchableOpacity, Pressable,
  StyleSheet, ScrollView, KeyboardAvoidingView, Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useTheme } from "../theme/ThemeContext";
import { PRIORITIES } from "../theme/theme";
import { FONTS } from "../theme/fonts";
import { formatDue } from "../lib/dates";
import { useCategories } from "../categories/CategoriesContext";
import type { Task, Priority, Subtask } from "../types";

type Props = {
  visible: boolean;
  title: string;
  initial?: Task | null;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    note: string;
    tag: string;
    priority: Priority;
    due: string | null;
    subtasks: Subtask[];
  }) => void;
};

export default function TaskSheet({ visible, title, initial, onClose, onSubmit }: Props) {
  const { theme, mode } = useTheme();
  const s = makeStyles(theme);
  const { categories } = useCategories();

  const [name, setName] = useState(initial?.title ?? "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [tag, setTag] = useState(initial?.tag ?? categories[0]?.name ?? "Work");
  const [priority, setPriority] = useState<Priority>(initial?.priority ?? "med");
  const [due, setDue] = useState<Date | null>(initial?.due ? new Date(initial.due) : null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerMode, setPickerMode] = useState<"date" | "time">("date");
  const [subtasks, setSubtasks] = useState<Subtask[]>(initial?.subtasks ?? []);
  const [newSub, setNewSub] = useState("");

  const reset = () => {
    setName(initial?.title ?? "");
    setNote(initial?.note ?? "");
    setTag(initial?.tag ?? categories[0]?.name ?? "Work");
    setPriority(initial?.priority ?? "med");
    setDue(initial?.due ? new Date(initial.due) : null);
    setSubtasks(initial?.subtasks ?? []);
    setNewSub("");
  };

  const onPickerChange = (e: DateTimePickerEvent, picked?: Date) => {
    if (Platform.OS !== "ios") setPickerOpen(false);
    if (e.type === "dismissed" || !picked) return;
    if (pickerMode === "date") {
      const base = due ?? new Date();
      const merged = new Date(picked);
      merged.setHours(base.getHours(), base.getMinutes(), 0, 0);
      setDue(merged);
      if (Platform.OS !== "ios") {
        setPickerMode("time");
        setTimeout(() => setPickerOpen(true), 50);
      }
    } else {
      const base = due ?? new Date();
      const merged = new Date(base);
      merged.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
      setDue(merged);
    }
  };

  const openPicker = (mode: "date" | "time") => {
    setPickerMode(mode);
    setPickerOpen(true);
  };

  const addSub = () => {
    const t = newSub.trim();
    if (!t) return;
    setSubtasks((prev) => [...prev, { t, d: false }]);
    setNewSub("");
  };

  const toggleSub = (idx: number) =>
    setSubtasks((prev) => prev.map((x, i) => (i === idx ? { ...x, d: !x.d } : x)));

  const removeSub = (idx: number) =>
    setSubtasks((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSubmit({
      title: name.trim(),
      note: note.trim(),
      tag,
      priority,
      due: due ? due.toISOString() : null,
      subtasks,
    });
    reset();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      onShow={reset}
    >
      <Pressable style={s.backdrop} onPress={onClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={s.kavWrap}
        pointerEvents="box-none"
      >
        <View style={s.sheet}>
          <View style={s.grabber} />
          <Text style={s.title}>{title}</Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Field label="Task title" theme={theme}>
              <TextInput
                autoFocus
                value={name}
                onChangeText={setName}
                placeholder="What needs doing?"
                placeholderTextColor={theme.inkFaint}
                style={s.input}
              />
            </Field>

            <Field label="Notes" theme={theme}>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="Add details…"
                placeholderTextColor={theme.inkFaint}
                multiline
                numberOfLines={3}
                style={[s.input, s.textarea]}
              />
            </Field>

            <Field label="Category" theme={theme}>
              <View style={s.catWrap}>
                {categories.map((c) => {
                  const on = tag === c.name;
                  return (
                    <TouchableOpacity
                      key={c._id}
                      onPress={() => setTag(c.name)}
                      style={[
                        s.catChip,
                        {
                          borderColor: on ? c.color : theme.line,
                          backgroundColor: on ? c.color + "1A" : "transparent",
                        },
                      ]}
                    >
                      <View style={[s.catDot, { backgroundColor: c.color }]} />
                      <Text style={{ color: on ? c.color : theme.inkSoft, fontFamily: FONTS.sansSemi, fontSize: 13.5 }}>
                        {c.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Field>

            <Field label="Priority" theme={theme}>
              <View style={s.row}>
                {(Object.entries(PRIORITIES) as [Priority, typeof PRIORITIES[Priority]][]).map(
                  ([k, v]) => {
                    const on = priority === k;
                    return (
                      <TouchableOpacity
                        key={k}
                        onPress={() => setPriority(k)}
                        style={[
                          s.optionBtn,
                          {
                            borderColor: on ? v.color : theme.line,
                            backgroundColor: on ? v.color + "1A" : "transparent",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            s.optionText,
                            { color: on ? v.color : theme.inkSoft, fontFamily: FONTS.sansSemi },
                          ]}
                        >
                          {v.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  }
                )}
              </View>
            </Field>

            <Field label="Due" theme={theme}>
              <View style={s.row}>
                <TouchableOpacity
                  onPress={() => openPicker("date")}
                  style={[s.dueChip, { borderColor: due ? theme.accent : theme.line, backgroundColor: due ? theme.accent + "1A" : "transparent" }]}
                >
                  <Ionicons name="calendar-outline" size={16} color={due ? theme.accent : theme.inkSoft} />
                  <Text style={{ color: due ? theme.accent : theme.inkSoft, fontFamily: FONTS.sansSemi, fontSize: 13 }}>
                    {due ? formatDue(due.toISOString()) : "Set due date"}
                  </Text>
                </TouchableOpacity>
                {due && (
                  <TouchableOpacity onPress={() => setDue(null)} style={s.clearDue} hitSlop={8}>
                    <Ionicons name="close" size={18} color={theme.inkFaint} />
                  </TouchableOpacity>
                )}
              </View>
              {Platform.OS === "ios" && due && (
                <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                  <TouchableOpacity onPress={() => openPicker("date")} style={s.subBtn}>
                    <Text style={{ color: theme.inkSoft, fontFamily: FONTS.sansSemi, fontSize: 12 }}>Change date</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => openPicker("time")} style={s.subBtn}>
                    <Text style={{ color: theme.inkSoft, fontFamily: FONTS.sansSemi, fontSize: 12 }}>Change time</Text>
                  </TouchableOpacity>
                </View>
              )}
              {pickerOpen && (
                <View style={Platform.OS === "ios" ? s.iosPickerWrap : undefined}>
                  <DateTimePicker
                    value={due ?? new Date()}
                    mode={pickerMode}
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={onPickerChange}
                    themeVariant={mode}
                    textColor={theme.ink}
                    accentColor={theme.accent}
                    style={Platform.OS === "ios" ? s.iosPicker : undefined}
                  />
                </View>
              )}
            </Field>

            <Field label={`Subtasks${subtasks.length ? ` · ${subtasks.filter((x) => x.d).length}/${subtasks.length}` : ""}`} theme={theme}>
              {subtasks.map((st, i) => (
                <View key={i} style={s.subRow}>
                  <TouchableOpacity
                    onPress={() => toggleSub(i)}
                    hitSlop={8}
                    style={[
                      s.subCheck,
                      {
                        borderColor: st.d ? theme.accent : theme.line,
                        backgroundColor: st.d ? theme.accent : "transparent",
                      },
                    ]}
                  >
                    {st.d && <Ionicons name="checkmark" size={13} color={theme.accentInk} />}
                  </TouchableOpacity>
                  <Text
                    style={[
                      s.subText,
                      { color: theme.ink },
                      st.d && { textDecorationLine: "line-through", opacity: 0.55 },
                    ]}
                  >
                    {st.t}
                  </Text>
                  <TouchableOpacity onPress={() => removeSub(i)} hitSlop={10}>
                    <Ionicons name="close" size={18} color={theme.inkFaint} />
                  </TouchableOpacity>
                </View>
              ))}

              <View style={s.addSubRow}>
                <TextInput
                  value={newSub}
                  onChangeText={setNewSub}
                  onSubmitEditing={addSub}
                  returnKeyType="done"
                  placeholder="Add a subtask"
                  placeholderTextColor={theme.inkFaint}
                  style={s.addSubInput}
                />
                <TouchableOpacity
                  onPress={addSub}
                  disabled={!newSub.trim()}
                  style={[s.addSubBtn, { backgroundColor: theme.accent, opacity: newSub.trim() ? 1 : 0.5 }]}
                >
                  <Ionicons name="add" size={20} color={theme.accentInk} />
                </TouchableOpacity>
              </View>
            </Field>

            <View style={[s.row, { marginTop: 18, marginBottom: 18 }]}>
              <TouchableOpacity onPress={onClose} style={s.cancel}>
                <Text style={{ color: theme.inkSoft, fontFamily: FONTS.sansBold, fontSize: 15 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={!name.trim()}
                style={[s.submit, { opacity: name.trim() ? 1 : 0.5 }]}
              >
                <Text style={{ color: theme.accentInk, fontFamily: FONTS.sansBold, fontSize: 15 }}>
                  {initial ? "Save changes" : "Add task"}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Field({
  label, children, theme,
}: {
  label: string;
  children: ReactNode;
  theme: ReturnType<typeof useTheme>["theme"];
}) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text
        style={{
          fontSize: 12, fontFamily: FONTS.sansBold, color: theme.inkFaint,
          marginBottom: 8, letterSpacing: 0.5, textTransform: "uppercase",
        }}
      >
        {label}
      </Text>
      {children}
    </View>
  );
}

const makeStyles = (t: ReturnType<typeof useTheme>["theme"]) =>
  StyleSheet.create({
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: t.backdrop,
    },
    kavWrap: {
      flex: 1,
      justifyContent: "flex-end",
    },
    sheet: {
      backgroundColor: t.sheet,
      borderTopLeftRadius: 30, borderTopRightRadius: 30,
      paddingHorizontal: 24, paddingTop: 12, paddingBottom: 28,
      maxHeight: "92%",
    },
    grabber: {
      width: 42, height: 5, borderRadius: 99,
      backgroundColor: t.line, alignSelf: "center", marginBottom: 18,
    },
    title: { fontSize: 26, fontFamily: FONTS.serifSemi, color: t.ink, marginBottom: 18, letterSpacing: -0.4 },
    input: {
      width: "100%", paddingHorizontal: 16, paddingVertical: 14,
      borderRadius: 14, borderWidth: 1.5, borderColor: t.line,
      backgroundColor: t.surfaceAlt, color: t.ink, fontSize: 15, fontFamily: FONTS.sansMedium,
    },
    textarea: { height: 88, textAlignVertical: "top" },
    row: { flexDirection: "row", gap: 8 },
    optionBtn: {
      flex: 1, paddingVertical: 11, borderRadius: 13, borderWidth: 1.5,
      alignItems: "center", justifyContent: "center",
    },
    optionText: { fontSize: 13.5 },
    catWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    catChip: {
      flexDirection: "row", alignItems: "center", gap: 7,
      paddingHorizontal: 14, paddingVertical: 10, borderRadius: 13, borderWidth: 1.5,
    },
    catDot: { width: 10, height: 10, borderRadius: 5 },
    dueChip: {
      flex: 1, flexDirection: "row", alignItems: "center", gap: 8,
      paddingHorizontal: 14, paddingVertical: 12,
      borderRadius: 14, borderWidth: 1.5,
    },
    clearDue: {
      width: 44, height: 44, borderRadius: 14,
      borderWidth: 1, borderColor: t.line, backgroundColor: t.surfaceAlt,
      alignItems: "center", justifyContent: "center",
    },
    subBtn: {
      paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
      borderWidth: 1, borderColor: t.line, backgroundColor: t.surfaceAlt,
    },
    iosPickerWrap: {
      marginTop: 10, borderRadius: 14, overflow: "hidden",
      backgroundColor: t.surface, borderWidth: 1, borderColor: t.line,
    },
    iosPicker: { backgroundColor: t.surface },
    cancel: {
      paddingHorizontal: 22, paddingVertical: 15, borderRadius: 16,
      borderWidth: 1, borderColor: t.line,
    },
    submit: {
      flex: 1, paddingVertical: 15, borderRadius: 16, alignItems: "center",
      backgroundColor: t.accent,
    },
    subRow: {
      flexDirection: "row", alignItems: "center", gap: 10,
      paddingHorizontal: 14, paddingVertical: 12, marginBottom: 8,
      borderRadius: 14, borderWidth: 1, borderColor: t.line,
      backgroundColor: t.surfaceAlt,
    },
    subCheck: {
      width: 22, height: 22, borderRadius: 7, borderWidth: 2,
      alignItems: "center", justifyContent: "center",
    },
    subText: { flex: 1, fontSize: 14.5, fontFamily: FONTS.sansMedium },
    addSubRow: {
      flexDirection: "row", alignItems: "center", gap: 8,
      borderRadius: 14, borderWidth: 1.5, borderColor: t.line,
      backgroundColor: t.surfaceAlt, paddingLeft: 14, paddingRight: 6, paddingVertical: 6,
    },
    addSubInput: {
      flex: 1, fontSize: 15, fontFamily: FONTS.sansMedium, color: t.ink,
      paddingVertical: 8,
    },
    addSubBtn: {
      width: 36, height: 36, borderRadius: 10,
      alignItems: "center", justifyContent: "center",
    },
  });
