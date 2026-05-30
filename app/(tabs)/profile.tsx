import { useCallback, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useTheme } from "../../theme/ThemeContext";
import { FONTS } from "../../theme/fonts";
import { useAuth } from "../../auth/AuthContext";
import { fetchStats } from "../../api/stats";
import Avatar from "../../components/Avatar";
import type { TaskStats } from "../../types";

type Theme = ReturnType<typeof useTheme>["theme"];

export default function ProfileScreen() {
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const { user, updateProfile, signOut, uploadAvatar, removeAvatar } = useAuth();

  const [name, setName] = useState(user?.name ?? "");
  const [saving, setSaving] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [stats, setStats] = useState<TaskStats | null>(null);

  useFocusEffect(useCallback(() => {
    fetchStats().then(setStats).catch(() => {});
  }, []));

  const pickAndUpload = async () => {
    if (photoBusy) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Allow photo library access to choose a profile picture.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    try {
      setPhotoBusy(true);
      await uploadAvatar({
        uri: asset.uri,
        name: asset.fileName ?? "avatar.jpg",
        type: asset.mimeType ?? "image/jpeg",
      });
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Could not upload image.";
      Alert.alert("Upload failed", msg);
    } finally {
      setPhotoBusy(false);
    }
  };

  const confirmRemovePhoto = () => {
    Alert.alert("Remove photo", "Use your initial instead?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            setPhotoBusy(true);
            await removeAvatar();
          } catch {
            Alert.alert("Error", "Could not remove image.");
          } finally {
            setPhotoBusy(false);
          }
        },
      },
    ]);
  };

  const onPressPhoto = () => {
    if (photoBusy) return;
    if (!user?.avatarUrl) {
      pickAndUpload();
      return;
    }
    // User has a photo — give them both options.
    Alert.alert("Profile photo", undefined, [
      { text: "Cancel", style: "cancel" },
      { text: "Change photo", onPress: pickAndUpload },
      { text: "Remove photo", style: "destructive", onPress: confirmRemovePhoto },
    ]);
  };

  const dirty = name.trim() !== (user?.name ?? "");
  const canSave = dirty && name.trim().length > 0 && !saving;

  const save = async () => {
    if (!canSave) return;
    try {
      setSaving(true);
      await updateProfile(name.trim());
      Alert.alert("Saved", "Your profile has been updated.");
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Could not update profile.";
      Alert.alert("Update failed", msg);
    } finally {
      setSaving(false);
    }
  };

  const confirmSignOut = () => {
    Alert.alert("Log out", "You can log back in any time.", [
      { text: "Cancel", style: "cancel" },
      { text: "Log out", style: "destructive", onPress: () => void signOut() },
    ]);
  };

  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }} keyboardShouldPersistTaps="handled">
          <Text style={s.title}>Profile</Text>

          <View style={s.card}>
            <TouchableOpacity onPress={onPressPhoto} activeOpacity={0.85} style={s.avatarTap}>
              <Avatar
                url={user?.avatarUrl}
                name={user?.name}
                email={user?.email}
                size={88}
              />
              <View style={s.cameraBadge}>
                {photoBusy ? (
                  <ActivityIndicator size="small" color={theme.accentInk} />
                ) : (
                  <Ionicons name="camera" size={14} color={theme.accentInk} />
                )}
              </View>
            </TouchableOpacity>
            <Text style={s.name}>{user?.name || "Unnamed"}</Text>
            <Text style={s.email}>{user?.email}</Text>
            <Text style={s.photoHint}>
              {user?.avatarUrl ? "Tap photo to change or remove" : "Tap to add a photo"}
            </Text>
          </View>

          {/* Summary — three quick stats + a streak-ish "this week" tile */}
          <Text style={s.sectionLabel}>Summary</Text>
          <View style={s.statsRow}>
            <StatTile theme={theme} label="Total" value={String(stats?.total ?? 0)} />
            <StatTile theme={theme} label="Done" value={String(stats?.completed ?? 0)} accent />
            <StatTile theme={theme} label="Active" value={String(stats?.active ?? 0)} />
          </View>
          <View style={s.statBar}>
            <View style={{ flex: 1 }}>
              <Text style={s.statBarLabel}>Completion rate</Text>
              <View style={[s.bar, { backgroundColor: theme.line }]}>
                <View style={[s.barFill, { width: `${stats?.completionRate ?? 0}%`, backgroundColor: theme.accent }]} />
              </View>
            </View>
            <Text style={s.statBarValue}>{stats?.completionRate ?? 0}%</Text>
          </View>
          <View style={s.miniRow}>
            <MiniStat theme={theme} icon="today-outline" label="Today done" value={String(stats?.completedToday ?? 0)} />
            <MiniStat theme={theme} icon="calendar-outline" label="This week" value={String(stats?.completedThisWeek ?? 0)} />
            <MiniStat theme={theme} icon="alarm-outline" label="Due today" value={String(stats?.dueToday ?? 0)} />
          </View>

          <Field label="Name" theme={theme}>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={theme.inkFaint}
              autoCapitalize="words"
              style={s.input}
            />
          </Field>

          <Field label="Email" theme={theme}>
            <View style={[s.input, s.readOnlyInput]}>
              <Text style={{ color: theme.inkSoft, fontSize: 15, fontFamily: FONTS.sansMedium }}>
                {user?.email}
              </Text>
              <Ionicons name="lock-closed-outline" size={16} color={theme.inkFaint} />
            </View>
            <Text style={s.helper}>Email can't be changed.</Text>
          </Field>

          <TouchableOpacity
            onPress={save}
            disabled={!canSave}
            activeOpacity={0.85}
            style={[s.saveBtn, { opacity: canSave ? 1 : 0.5 }]}
          >
            <Text style={{ color: theme.accentInk, fontFamily: FONTS.sansBold, fontSize: 15.5 }}>
              {saving ? "Saving…" : "Save changes"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={confirmSignOut} style={s.logoutBtn}>
            <Ionicons name="log-out-outline" size={18} color={theme.danger} />
            <Text style={{ color: theme.danger, fontFamily: FONTS.sansBold, fontSize: 14.5 }}>Log out</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

    </SafeAreaView>
  );
}

function StatTile({ theme, label, value, accent }: { theme: Theme; label: string; value: string; accent?: boolean }) {
  return (
    <View style={[
      tileStyles(theme).tile,
      accent && { backgroundColor: theme.accentSoft, borderColor: theme.accent + "40" },
    ]}>
      <Text style={[tileStyles(theme).value, accent && { color: theme.accent }]}>{value}</Text>
      <Text style={tileStyles(theme).label}>{label}</Text>
    </View>
  );
}

function MiniStat({ theme, icon, label, value }: { theme: Theme; icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={tileStyles(theme).mini}>
      <View style={tileStyles(theme).miniIcon}>
        <Ionicons name={icon} size={16} color={theme.inkSoft} />
      </View>
      <Text style={tileStyles(theme).miniValue}>{value}</Text>
      <Text style={tileStyles(theme).miniLabel}>{label}</Text>
    </View>
  );
}

const tileStyles = (t: Theme) =>
  StyleSheet.create({
    tile: {
      flex: 1, alignItems: "center", paddingVertical: 14,
      borderRadius: 16, borderWidth: 1, borderColor: t.line, backgroundColor: t.surface,
    },
    value: { color: t.ink, fontSize: 22, fontFamily: FONTS.sansBold },
    label: { color: t.inkSoft, fontSize: 11, fontFamily: FONTS.sansSemi, marginTop: 2, letterSpacing: 0.3, textTransform: "uppercase" },
    mini: {
      flex: 1, alignItems: "center", paddingVertical: 12, gap: 4,
      borderRadius: 14, borderWidth: 1, borderColor: t.line, backgroundColor: t.surface,
    },
    miniIcon: {
      width: 28, height: 28, borderRadius: 9, backgroundColor: t.surfaceAlt,
      alignItems: "center", justifyContent: "center",
    },
    miniValue: { color: t.ink, fontSize: 14, fontFamily: FONTS.sansBold },
    miniLabel: { color: t.inkFaint, fontSize: 10.5, fontFamily: FONTS.sansSemi },
  });

function Field({ label, children, theme }: { label: string; children: React.ReactNode; theme: Theme }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 12, fontFamily: FONTS.sansBold, color: theme.inkFaint, marginBottom: 8, letterSpacing: 0.5, textTransform: "uppercase" }}>
        {label}
      </Text>
      {children}
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: t.bg },
    title: { fontSize: 30, fontFamily: FONTS.serifSemi, color: t.ink, letterSpacing: -0.5, marginTop: 4, marginBottom: 22 },
    card: {
      alignItems: "center",
      padding: 24, borderRadius: 22, marginBottom: 28,
      backgroundColor: t.surface, borderWidth: 1, borderColor: t.line,
    },
    avatarTap: {
      position: "relative",
      marginBottom: 12,
    },
    cameraBadge: {
      position: "absolute",
      right: -2, bottom: -2,
      width: 30, height: 30, borderRadius: 15,
      backgroundColor: t.accent,
      borderWidth: 3, borderColor: t.surface,
      alignItems: "center", justifyContent: "center",
    },
    name: { fontSize: 18, fontFamily: FONTS.sansBold, color: t.ink },
    email: { fontSize: 13, fontFamily: FONTS.sansMedium, color: t.inkSoft, marginTop: 2 },
    photoHint: { fontSize: 11.5, fontFamily: FONTS.sansMedium, color: t.inkFaint, marginTop: 10 },
    sectionLabel: {
      fontSize: 12, fontFamily: FONTS.sansBold, color: t.inkFaint,
      letterSpacing: 1, textTransform: "uppercase", marginBottom: 10, paddingLeft: 4,
    },
    statsRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
    statBar: {
      flexDirection: "row", alignItems: "center", gap: 12,
      padding: 14, borderRadius: 16, borderWidth: 1, borderColor: t.line, backgroundColor: t.surface,
      marginBottom: 12,
    },
    statBarLabel: { fontSize: 12, fontFamily: FONTS.sansSemi, color: t.inkSoft, marginBottom: 6 },
    statBarValue: { fontSize: 16, fontFamily: FONTS.sansBold, color: t.ink, minWidth: 44, textAlign: "right" },
    bar: { height: 8, borderRadius: 99, overflow: "hidden" },
    barFill: { height: "100%", borderRadius: 99 },
    miniRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
    input: {
      width: "100%", paddingHorizontal: 16, paddingVertical: 14,
      borderRadius: 14, borderWidth: 1.5, borderColor: t.line,
      backgroundColor: t.surfaceAlt, color: t.ink, fontSize: 15, fontFamily: FONTS.sansMedium,
    },
    readOnlyInput: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      paddingVertical: 16,
    },
    helper: { fontSize: 12, color: t.inkFaint, marginTop: 6, fontFamily: FONTS.sansMedium },
    saveBtn: {
      marginTop: 12, paddingVertical: 15, borderRadius: 16, alignItems: "center",
      backgroundColor: t.accent,
      shadowColor: t.accent, shadowOpacity: 0.4, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 6,
    },
    logoutBtn: {
      flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
      marginTop: 18, paddingVertical: 14, borderRadius: 16,
      borderWidth: 1, borderColor: t.line, backgroundColor: t.surfaceAlt,
    },
  });
