import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeContext";
import { FONTS } from "../theme/fonts";
import { useAuth } from "../auth/AuthContext";
import PasswordInput from "../components/PasswordInput";

type Theme = ReturnType<typeof useTheme>["theme"];

// Two-step flow in a single screen: collect email, then code + new password.
type Step = "email" | "reset";

export default function ForgotScreen() {
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const router = useRouter();
  const { forgotPassword, resetPassword } = useAuth();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const sendCode = async () => {
    if (!email.trim() || submitting) return;
    try {
      setSubmitting(true);
      await forgotPassword(email.trim());
      setStep("reset");
    } catch {
      Alert.alert("Error", "Couldn't send the reset code. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const resend = async () => {
    try {
      await forgotPassword(email.trim());
      Alert.alert("Code sent", "Check your email.");
    } catch {
      Alert.alert("Error", "Could not resend code.");
    }
  };

  const finish = async () => {
    if (code.length !== 6 || password.length < 6 || submitting) return;
    try {
      setSubmitting(true);
      await resetPassword(email.trim(), code, password);
      // Auth gate will redirect us into the app since reset issues a token.
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Reset failed.";
      Alert.alert("Couldn't reset", msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={s.root}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity
            onPress={() => (step === "reset" ? setStep("email") : router.back())}
            style={s.backBtn}
          >
            <Ionicons name="chevron-back" size={20} color={theme.ink} />
          </TouchableOpacity>

          {step === "email" ? (
            <>
              <Text style={s.title}>Forgot password?</Text>
              <Text style={s.subtitle}>
                Enter your account email. We'll send you a 6-digit code to set a new password.
              </Text>

              <Field label="Email" theme={theme}>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor={theme.inkFaint}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  autoFocus
                  style={s.input}
                />
              </Field>

              <TouchableOpacity
                onPress={sendCode}
                disabled={!email.trim() || submitting}
                activeOpacity={0.85}
                style={[s.submit, { opacity: email.trim() && !submitting ? 1 : 0.5 }]}
              >
                <Text style={{ color: theme.accentInk, fontFamily: FONTS.sansBold, fontSize: 15.5 }}>
                  {submitting ? "Sending…" : "Send reset code"}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={s.title}>Set a new password</Text>
              <Text style={s.subtitle}>
                We sent a 6-digit code to{"\n"}
                <Text style={{ color: theme.ink, fontFamily: FONTS.sansBold }}>{email}</Text>
              </Text>

              <Field label="Verification code" theme={theme}>
                <TextInput
                  value={code}
                  onChangeText={(v) => setCode(v.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  placeholderTextColor={theme.inkFaint}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                  style={s.codeInput}
                />
              </Field>

              <Field label="New password" theme={theme}>
                <PasswordInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="At least 6 characters"
                  textContentType="newPassword"
                />
              </Field>

              <TouchableOpacity
                onPress={finish}
                disabled={code.length !== 6 || password.length < 6 || submitting}
                activeOpacity={0.85}
                style={[
                  s.submit,
                  { opacity: code.length === 6 && password.length >= 6 && !submitting ? 1 : 0.5 },
                ]}
              >
                <Text style={{ color: theme.accentInk, fontFamily: FONTS.sansBold, fontSize: 15.5 }}>
                  {submitting ? "Resetting…" : "Reset password"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={resend} style={s.resend}>
                <Text style={{ color: theme.inkSoft, fontFamily: FONTS.sansMedium, fontSize: 14 }}>
                  Didn't get the code?{" "}
                  <Text style={{ color: theme.accent, fontFamily: FONTS.sansBold }}>Resend</Text>
                </Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, children, theme }: { label: string; children: React.ReactNode; theme: Theme }) {
  return (
    <View style={{ marginBottom: 14 }}>
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
    scroll: { padding: 24, paddingTop: 40 },
    backBtn: {
      width: 42, height: 42, borderRadius: 14, borderWidth: 1, borderColor: t.line,
      backgroundColor: t.surface, alignItems: "center", justifyContent: "center", marginBottom: 24,
    },
    title: { fontSize: 28, fontFamily: FONTS.serifSemi, color: t.ink, letterSpacing: -0.4 },
    subtitle: { fontSize: 14, lineHeight: 22, color: t.inkSoft, fontFamily: FONTS.sansMedium, marginTop: 8, marginBottom: 22 },
    input: {
      width: "100%", paddingHorizontal: 16, paddingVertical: 14,
      borderRadius: 14, borderWidth: 1.5, borderColor: t.line,
      backgroundColor: t.surfaceAlt, color: t.ink, fontSize: 15, fontFamily: FONTS.sansMedium,
    },
    codeInput: {
      width: "100%", paddingHorizontal: 16, paddingVertical: 18,
      borderRadius: 14, borderWidth: 1.5, borderColor: t.line,
      backgroundColor: t.surfaceAlt, color: t.ink,
      fontSize: 28, letterSpacing: 12,
      textAlign: "center", fontFamily: FONTS.sansBold,
    },
    submit: {
      marginTop: 10, paddingVertical: 15, borderRadius: 16, alignItems: "center",
      backgroundColor: t.accent,
      shadowColor: t.accent, shadowOpacity: 0.4, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 6,
    },
    resend: { alignItems: "center", marginTop: 18, paddingVertical: 6 },
  });
