import { useState } from "react";
import {
  Modal, View, Text, TextInput, TouchableOpacity, Pressable,
  StyleSheet, KeyboardAvoidingView, Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeContext";
import { FONTS } from "../theme/fonts";
import { CATEGORY_PALETTE } from "../categories/CategoriesContext";
import type { Category } from "../types";

type Props = {
  visible: boolean;
  initial?: Category | null;       // present → edit mode
  onClose: () => void;
  onSubmit: (name: string, color: string) => Promise<void>;
};

export default function CategorySheet({ visible, initial, onClose, onSubmit }: Props) {
  const { theme } = useTheme();
  const s = makeStyles(theme);

  const [name, setName] = useState(initial?.name ?? "");
  const [color, setColor] = useState(initial?.color ?? CATEGORY_PALETTE[0]);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setName(initial?.name ?? "");
    setColor(initial?.color ?? CATEGORY_PALETTE[0]);
  };

  const canSave = name.trim().length > 0 && !saving;

  const submit = async () => {
    if (!canSave) return;
    try {
      setSaving(true);
      await onSubmit(name.trim(), color);
      onClose();
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Could not save category.";
      // Surface duplicate-name etc.
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} onShow={reset}>
      <Pressable style={s.backdrop} onPress={onClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={s.kavWrap}
        pointerEvents="box-none"
      >
        <View style={s.sheet}>
          <View style={s.grabber} />
          <Text style={s.title}>{initial ? "Edit category" : "New category"}</Text>

          <Text style={s.label}>Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Errands"
            placeholderTextColor={theme.inkFaint}
            autoFocus
            style={s.input}
          />

          <Text style={[s.label, { marginTop: 16 }]}>Color</Text>
          <View style={s.swatchRow}>
            {CATEGORY_PALETTE.map((c) => {
              const on = c === color;
              return (
                <TouchableOpacity
                  key={c}
                  onPress={() => setColor(c)}
                  style={[s.swatch, { backgroundColor: c, borderColor: on ? theme.ink : "transparent" }]}
                >
                  {on && <Ionicons name="checkmark" size={16} color="#fff" />}
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={s.actions}>
            <TouchableOpacity onPress={onClose} style={s.cancel}>
              <Text style={{ color: theme.inkSoft, fontFamily: FONTS.sansBold, fontSize: 15 }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={submit} disabled={!canSave} style={[s.submit, { opacity: canSave ? 1 : 0.5 }]}>
              <Text style={{ color: theme.accentInk, fontFamily: FONTS.sansBold, fontSize: 15 }}>
                {saving ? "Saving…" : initial ? "Save" : "Add"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const makeStyles = (t: ReturnType<typeof useTheme>["theme"]) =>
  StyleSheet.create({
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: t.backdrop },
    kavWrap: { flex: 1, justifyContent: "flex-end" },
    sheet: {
      backgroundColor: t.sheet,
      borderTopLeftRadius: 30, borderTopRightRadius: 30,
      paddingHorizontal: 24, paddingTop: 12, paddingBottom: 28,
    },
    grabber: { width: 42, height: 5, borderRadius: 99, backgroundColor: t.line, alignSelf: "center", marginBottom: 18 },
    title: { fontSize: 24, fontFamily: FONTS.serifSemi, color: t.ink, marginBottom: 18, letterSpacing: -0.4 },
    label: { fontSize: 12, fontFamily: FONTS.sansBold, color: t.inkFaint, marginBottom: 8, letterSpacing: 0.5, textTransform: "uppercase" },
    input: {
      paddingHorizontal: 16, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5,
      borderColor: t.line, backgroundColor: t.surfaceAlt, color: t.ink, fontSize: 15, fontFamily: FONTS.sansMedium,
    },
    swatchRow: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
    swatch: {
      width: 40, height: 40, borderRadius: 12, borderWidth: 2,
      alignItems: "center", justifyContent: "center",
    },
    actions: { flexDirection: "row", gap: 10, marginTop: 24 },
    cancel: { paddingHorizontal: 22, paddingVertical: 15, borderRadius: 16, borderWidth: 1, borderColor: t.line },
    submit: { flex: 1, paddingVertical: 15, borderRadius: 16, alignItems: "center", backgroundColor: t.accent },
  });
