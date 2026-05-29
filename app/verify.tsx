import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeContext";
import { FONTS } from "../theme/fonts";
import { useAuth } from "../auth/AuthContext";

type Theme = ReturnType<typeof useTheme>["theme"];

export default function VerifyScreen() {
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const router = useRouter();
  const { verifyEmail, resendVerification } = useAuth();
  const params = useLocalSearchParams<{ email: string }>();
  const email = typeof params.email === "string" ? params.email : "";

  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  const canSubmit = code.length === 6 && !submitting;

  const submit = async () => {
    if (!canSubmit) return;
    try {
      setSubmitting(true);
      await verifyEmail(email, code);
      // Auth gate in _layout.tsx will see user become non-null and redirect to /
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Verification failed.";
      Alert.alert("Couldn't verify", msg);
    } finally {
      setSubmitting(false);
    }
  };

  const resend = async () => {
    if (resending) return;
    try {
      setResending(true);
      await resendVerification(email);
      Alert.alert("Code sent", "Check your email for a new verification code.");
    } catch {
      Alert.alert("Error", "Could not resend code. Try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <SafeAreaView style={s.root}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="chevron-back" size={20} color={theme.ink} />
          </TouchableOpacity>

          <Text style={s.title}>Check your inbox</Text>
          <Text style={s.subtitle}>
            We sent a 6-digit code to{"\n"}
            <Text style={{ color: theme.ink, fontFamily: FONTS.sansBold }}>{email}</Text>
          </Text>

          <Text style={s.label}>Verification code</Text>
          <TextInput
            value={code}
            onChangeText={(v) => setCode(v.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            placeholderTextColor={theme.inkFaint}
            keyboardType="number-pad"
            autoFocus
            maxLength={6}
            style={s.codeInput}
          />

          <TouchableOpacity
            onPress={submit}
            disabled={!canSubmit}
            activeOpacity={0.85}
            style={[s.submit, { opacity: canSubmit ? 1 : 0.5 }]}
          >
            <Text style={{ color: theme.accentInk, fontFamily: FONTS.sansBold, fontSize: 15.5 }}>
              {submitting ? "Verifying…" : "Verify"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={resend} disabled={resending} style={s.resend}>
            <Text style={{ color: theme.inkSoft, fontFamily: FONTS.sansMedium, fontSize: 14 }}>
              Didn't get the code?{" "}
              <Text style={{ color: theme.accent, fontFamily: FONTS.sansBold }}>
                {resending ? "Sending…" : "Resend"}
              </Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: t.bg },
    scroll: { padding: 24, paddingTop: 40 },
    backBtn: {
      width: 42, height: 42, borderRadius: 14, borderWidth: 1, borderColor: t.line,
      backgroundColor: t.surface, alignItems: "center", justifyContent: "center", marginBottom: 24,
    },
    title: { fontSize: 28, fontFamily: FONTS.serifSemi, color: t.ink, letterSpacing: -0.4 },
    subtitle: { fontSize: 14, lineHeight: 22, color: t.inkSoft, fontFamily: FONTS.sansMedium, marginTop: 8, marginBottom: 28 },
    label: { fontSize: 12, fontFamily: FONTS.sansBold, color: t.inkFaint, marginBottom: 8, letterSpacing: 0.5, textTransform: "uppercase" },
    codeInput: {
      width: "100%",
      paddingHorizontal: 16, paddingVertical: 18,
      borderRadius: 14, borderWidth: 1.5, borderColor: t.line,
      backgroundColor: t.surfaceAlt, color: t.ink,
      fontSize: 28, letterSpacing: 12,
      textAlign: "center",
      fontFamily: FONTS.sansBold,
    },
    submit: {
      marginTop: 22, paddingVertical: 15, borderRadius: 16, alignItems: "center",
      backgroundColor: t.accent,
      shadowColor: t.accent, shadowOpacity: 0.4, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 6,
    },
    resend: { alignItems: "center", marginTop: 22, paddingVertical: 6 },
  });
