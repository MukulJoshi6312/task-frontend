import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "../theme/ThemeContext";
import { FONTS } from "../theme/fonts";
import { useAuth } from "../auth/AuthContext";
import PasswordInput from "../components/PasswordInput";

type Theme = ReturnType<typeof useTheme>["theme"];

type Mode = "login" | "signup";

export default function AuthScreen() {
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const router = useRouter();
  const { signIn, signUp } = useAuth();

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit =
    email.trim().length > 3 && password.length >= 6 && (mode === "login" || name.trim().length > 0);

  const submit = async () => {
    if (!canSubmit) return;
    try {
      setSubmitting(true);
      if (mode === "login") {
        await signIn(email.trim(), password);
      } else {
        const { email: sentTo } = await signUp(email.trim(), password, name.trim());
        router.push({ pathname: "/verify", params: { email: sentTo } });
      }
    } catch (e: unknown) {
      const err = e as { response?: { status?: number; data?: { message?: string; code?: string; email?: string } } };
      // Unverified email — bounce to verify screen.
      if (err?.response?.status === 403 && err?.response?.data?.code === "EMAIL_NOT_VERIFIED") {
        const targetEmail = err.response.data.email || email.trim();
        router.push({ pathname: "/verify", params: { email: targetEmail } });
        return;
      }
      const msg = err?.response?.data?.message ??
        (mode === "login" ? "Could not log in." : "Could not sign up.");
      Alert.alert(mode === "login" ? "Login failed" : "Signup failed", msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={s.root}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <View style={s.logo}>
            <Text style={s.logoText}>T</Text>
          </View>

          <Text style={s.brand}>Taskly</Text>
          <Text style={s.tagline}>
            {mode === "login" ? "Welcome back." : "A calmer way to get things done."}
          </Text>

          {mode === "signup" && (
            <Field label="Name" theme={theme}>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="What should we call you?"
                placeholderTextColor={theme.inkFaint}
                autoCapitalize="words"
                style={s.input}
              />
            </Field>
          )}

          <Field label="Email" theme={theme}>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={theme.inkFaint}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              style={s.input}
            />
          </Field>

          <Field label="Password" theme={theme}>
            <PasswordInput
              value={password}
              onChangeText={setPassword}
              placeholder="At least 6 characters"
              textContentType={mode === "signup" ? "newPassword" : "password"}
            />
            {mode === "login" && (
              <TouchableOpacity
                onPress={() => router.push("/forgot")}
                style={{ alignSelf: "flex-end", marginTop: 8, paddingVertical: 4 }}
              >
                <Text style={{ color: theme.accent, fontFamily: FONTS.sansSemi, fontSize: 13 }}>
                  Forgot password?
                </Text>
              </TouchableOpacity>
            )}
          </Field>

          <TouchableOpacity
            onPress={submit}
            disabled={!canSubmit || submitting}
            activeOpacity={0.85}
            style={[s.submit, { opacity: canSubmit && !submitting ? 1 : 0.5 }]}
          >
            <Text style={{ color: theme.accentInk, fontFamily: FONTS.sansBold, fontSize: 15.5 }}>
              {submitting
                ? (mode === "login" ? "Logging in…" : "Creating account…")
                : (mode === "login" ? "Log in" : "Sign up")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setMode(mode === "login" ? "signup" : "login")} style={s.switchBtn}>
            <Text style={{ color: theme.inkSoft, fontFamily: FONTS.sansMedium, fontSize: 14 }}>
              {mode === "login" ? "New here? " : "Already have an account? "}
              <Text style={{ color: theme.accent, fontFamily: FONTS.sansBold }}>
                {mode === "login" ? "Create an account" : "Log in"}
              </Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, children, theme }: { label: string; children: React.ReactNode; theme: Theme }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ fontSize: 12, fontFamily: FONTS.sansBold, color: theme.inkFaint, marginBottom: 6, letterSpacing: 0.5, textTransform: "uppercase" }}>
        {label}
      </Text>
      {children}
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: t.bg },
    scroll: { padding: 24, paddingTop: 60, paddingBottom: 60, alignItems: "stretch" },
    logo: {
      alignSelf: "center",
      width: 84, height: 84, borderRadius: 22, backgroundColor: t.accent,
      alignItems: "center", justifyContent: "center", marginBottom: 16,
      shadowColor: t.accent, shadowOpacity: 0.4, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 6,
    },
    logoText: { color: t.accentInk, fontSize: 44, fontFamily: FONTS.serifBold },
    brand: { textAlign: "center", fontSize: 30, fontFamily: FONTS.serifSemi, color: t.ink, letterSpacing: -0.4 },
    tagline: { textAlign: "center", marginTop: 6, marginBottom: 28, color: t.inkSoft, fontFamily: FONTS.sansMedium, fontSize: 14 },
    input: {
      width: "100%", paddingHorizontal: 16, paddingVertical: 14,
      borderRadius: 14, borderWidth: 1.5, borderColor: t.line,
      backgroundColor: t.surfaceAlt, color: t.ink, fontSize: 15, fontFamily: FONTS.sansMedium,
    },
    submit: {
      marginTop: 10, paddingVertical: 15, borderRadius: 16, alignItems: "center",
      backgroundColor: t.accent,
      shadowColor: t.accent, shadowOpacity: 0.4, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 6,
    },
    switchBtn: { alignItems: "center", marginTop: 22, paddingVertical: 6 },
  });
