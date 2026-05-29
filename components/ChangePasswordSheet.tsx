import { useState } from "react";
import {
  Modal, View, Text, TouchableOpacity, Pressable,
  StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert,
} from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { FONTS } from "../theme/fonts";
import { useAuth } from "../auth/AuthContext";
import PasswordInput from "./PasswordInput";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function ChangePasswordSheet({ visible, onClose }: Props) {
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const { changePassword } = useAuth();

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setCurrent("");
    setNext("");
    setConfirm("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const canSubmit =
    current.length >= 6 &&
    next.length >= 6 &&
    confirm === next &&
    !submitting;

  const submit = async () => {
    if (!canSubmit) return;
    if (next !== confirm) {
      Alert.alert("Mismatch", "New password and confirmation don't match.");
      return;
    }
    try {
      setSubmitting(true);
      await changePassword(current, next);
      Alert.alert("Password updated", "Use your new password next time you log in.");
      handleClose();
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Could not change password.";
      Alert.alert("Update failed", msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={s.backdrop} onPress={handleClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={s.kavWrap}
        pointerEvents="box-none"
      >
        <View style={s.sheet}>
          <View style={s.grabber} />
          <Text style={s.title}>Change password</Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Field label="Current password" theme={theme}>
              <PasswordInput
                value={current}
                onChangeText={setCurrent}
                placeholder="Your current password"
                textContentType="password"
                autoFocus
              />
            </Field>

            <Field label="New password" theme={theme}>
              <PasswordInput
                value={next}
                onChangeText={setNext}
                placeholder="At least 6 characters"
                textContentType="newPassword"
              />
            </Field>

            <Field label="Confirm new password" theme={theme}>
              <PasswordInput
                value={confirm}
                onChangeText={setConfirm}
                placeholder="Type it again"
                textContentType="newPassword"
              />
              {confirm.length > 0 && confirm !== next && (
                <Text style={s.helperError}>Passwords don't match.</Text>
              )}
            </Field>

            <View style={s.row}>
              <TouchableOpacity onPress={handleClose} style={s.cancel}>
                <Text style={{ color: theme.inkSoft, fontFamily: FONTS.sansBold, fontSize: 15 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={submit}
                disabled={!canSubmit}
                activeOpacity={0.85}
                style={[s.submit, { opacity: canSubmit ? 1 : 0.5 }]}
              >
                <Text style={{ color: theme.accentInk, fontFamily: FONTS.sansBold, fontSize: 15 }}>
                  {submitting ? "Saving…" : "Save"}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Field({ label, children, theme }: { label: string; children: React.ReactNode; theme: ReturnType<typeof useTheme>["theme"] }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ fontSize: 12, fontFamily: FONTS.sansBold, color: theme.inkFaint, marginBottom: 8, letterSpacing: 0.5, textTransform: "uppercase" }}>
        {label}
      </Text>
      {children}
    </View>
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
      maxHeight: "92%",
    },
    grabber: {
      width: 42, height: 5, borderRadius: 99,
      backgroundColor: t.line, alignSelf: "center", marginBottom: 18,
    },
    title: { fontSize: 24, fontFamily: FONTS.serifSemi, color: t.ink, marginBottom: 18, letterSpacing: -0.4 },
    helperError: { color: t.danger, fontFamily: FONTS.sansMedium, fontSize: 12, marginTop: 6 },
    row: { flexDirection: "row", gap: 10, marginTop: 8 },
    cancel: {
      paddingHorizontal: 22, paddingVertical: 15, borderRadius: 16,
      borderWidth: 1, borderColor: t.line,
    },
    submit: {
      flex: 1, paddingVertical: 15, borderRadius: 16, alignItems: "center",
      backgroundColor: t.accent,
    },
  });
