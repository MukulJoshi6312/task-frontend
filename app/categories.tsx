import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeContext";
import { FONTS } from "../theme/fonts";
import { useCategories } from "../categories/CategoriesContext";
import CategorySheet from "../components/CategorySheet";
import type { Category } from "../types";

type Theme = ReturnType<typeof useTheme>["theme"];

export default function CategoriesScreen() {
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const router = useRouter();
  const { categories, addCategory, editCategory, removeCategory } = useCategories();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);

  const openAdd = () => { setEditing(null); setSheetOpen(true); };
  const openEdit = (c: Category) => { setEditing(c); setSheetOpen(true); };

  const confirmRemove = (c: Category) => {
    Alert.alert(
      "Delete category",
      `Delete "${c.name}"? Tasks using it keep the label but lose the color.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => void removeCategory(c._id) },
      ]
    );
  };

  const onSubmit = async (name: string, color: string) => {
    if (editing) await editCategory(editing._id, name, color);
    else await addCategory(name, color);
  };

  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={s.iconBtn}>
          <Ionicons name="chevron-back" size={20} color={theme.ink} />
        </TouchableOpacity>
        <Text style={{ color: theme.inkSoft, fontFamily: FONTS.sansSemi, fontSize: 13 }}>Categories</Text>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
        <Text style={s.title}>Categories</Text>
        <Text style={s.subtitle}>Organize tasks your way. Tap to edit, swipe-free delete with the trash icon.</Text>

        <View style={s.card}>
          {categories.map((c, i) => (
            <View key={c._id} style={[s.row, i < categories.length - 1 && s.rowBorder]}>
              <View style={[s.dot, { backgroundColor: c.color }]} />
              <Text style={s.name}>{c.name}</Text>
              <TouchableOpacity onPress={() => openEdit(c)} hitSlop={8} style={s.rowBtn}>
                <Ionicons name="pencil-outline" size={18} color={theme.inkSoft} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => confirmRemove(c)} hitSlop={8} style={s.rowBtn}>
                <Ionicons name="trash-outline" size={18} color={theme.danger} />
              </TouchableOpacity>
            </View>
          ))}
          {categories.length === 0 && (
            <Text style={s.emptyText}>No categories yet.</Text>
          )}
        </View>

        <TouchableOpacity onPress={openAdd} activeOpacity={0.85} style={s.addBtn}>
          <Ionicons name="add" size={20} color={theme.accentInk} />
          <Text style={{ color: theme.accentInk, fontFamily: FONTS.sansBold, fontSize: 15 }}>Add category</Text>
        </TouchableOpacity>
      </ScrollView>

      <CategorySheet
        visible={sheetOpen}
        initial={editing}
        onClose={() => setSheetOpen(false)}
        onSubmit={onSubmit}
      />
    </SafeAreaView>
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
    title: { fontSize: 30, fontFamily: FONTS.serifSemi, color: t.ink, letterSpacing: -0.5, marginTop: 4 },
    subtitle: { fontSize: 14, color: t.inkSoft, fontFamily: FONTS.sansMedium, marginTop: 6, marginBottom: 22, lineHeight: 20 },
    card: {
      backgroundColor: t.surface, borderRadius: 20, borderWidth: 1, borderColor: t.line, overflow: "hidden",
    },
    row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
    rowBorder: { borderBottomWidth: 1, borderBottomColor: t.line },
    dot: { width: 16, height: 16, borderRadius: 8 },
    name: { flex: 1, fontSize: 15, fontFamily: FONTS.sansSemi, color: t.ink },
    rowBtn: { padding: 4 },
    emptyText: { padding: 16, color: t.inkFaint, fontFamily: FONTS.sansMedium },
    addBtn: {
      flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
      marginTop: 18, paddingVertical: 15, borderRadius: 16, backgroundColor: t.accent,
    },
  });
