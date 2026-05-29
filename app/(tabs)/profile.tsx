import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useTheme } from "../../theme/ThemeContext";
import { FONTS } from "../../theme/fonts";
import { useAuth } from "../../auth/AuthContext";
import ChangePasswordSheet from "../../components/ChangePasswordSheet";
import Avatar from "../../components/Avatar";

type Theme = ReturnType<typeof useTheme>["theme"];

export default function ProfileScreen() {
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const { user, updateProfile, signOut, uploadAvatar, removeAvatar } = useAuth();

  const [name, setName] = useState(user?.name ?? "");
  const [saving, setSaving] = useState(false);
  const [pwSheetOpen, setPwSheetOpen] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);

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

          <TouchableOpacity onPress={() => setPwSheetOpen(true)} style={s.changePwBtn}>
            <Ionicons name="lock-closed-outline" size={18} color={theme.ink} />
            <Text style={{ color: theme.ink, fontFamily: FONTS.sansBold, fontSize: 14.5 }}>Change password</Text>
            <Ionicons name="chevron-forward" size={18} color={theme.inkFaint} style={{ marginLeft: "auto" }} />
          </TouchableOpacity>

          <TouchableOpacity onPress={confirmSignOut} style={s.logoutBtn}>
            <Ionicons name="log-out-outline" size={18} color={theme.danger} />
            <Text style={{ color: theme.danger, fontFamily: FONTS.sansBold, fontSize: 14.5 }}>Log out</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <ChangePasswordSheet visible={pwSheetOpen} onClose={() => setPwSheetOpen(false)} />
    </SafeAreaView>
  );
}

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
    changePwBtn: {
      flexDirection: "row", alignItems: "center", gap: 12,
      marginTop: 18, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 16,
      borderWidth: 1, borderColor: t.line, backgroundColor: t.surface,
    },
    logoutBtn: {
      flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
      marginTop: 12, paddingVertical: 14, borderRadius: 16,
      borderWidth: 1, borderColor: t.line, backgroundColor: t.surfaceAlt,
    },
  });
