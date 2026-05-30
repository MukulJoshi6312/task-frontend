import { useEffect, useRef, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useTheme } from "../../theme/ThemeContext";
import { FONTS } from "../../theme/fonts";
import { useAuth } from "../../auth/AuthContext";
import { describeDevice } from "../../lib/device";

type Theme = ReturnType<typeof useTheme>["theme"];

const formatLogin = (iso?: string | null) => {
  if (!iso) return "Never";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Never";
  return d.toLocaleString(undefined, {
    weekday: "short", day: "numeric", month: "short",
    hour: "numeric", minute: "2-digit",
  });
};

export default function SettingsScreen() {
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const router = useRouter();
  const { user, isPremium, mockDowngrade } = useAuth();
  const currentDevice = describeDevice();
  const appVersion = Constants.expoConfig?.version ?? "1.0.0";

  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
        <Text style={s.title}>Settings</Text>

        {/* Subscription */}
        <Section label="Subscription" theme={theme}>
          <View style={s.planRow}>
            <View style={[s.planBadge, { backgroundColor: isPremium ? theme.accentSoft : theme.surfaceAlt }]}>
              <Ionicons
                name={isPremium ? "star" : "star-outline"}
                size={18}
                color={isPremium ? theme.accent : theme.inkSoft}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.planLabel}>Current plan</Text>
              <Text style={s.planValue}>{isPremium ? "Premium" : "Free"}</Text>
            </View>
            {isPremium ? (
              <TouchableOpacity onPress={() => void mockDowngrade()} style={s.manageBtn}>
                <Text style={{ color: theme.inkSoft, fontFamily: FONTS.sansSemi, fontSize: 13 }}>Cancel</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => router.push("/paywall")} style={s.upgradeBtn}>
                <Text style={{ color: theme.accentInk, fontFamily: FONTS.sansBold, fontSize: 13 }}>Upgrade</Text>
              </TouchableOpacity>
            )}
          </View>
        </Section>

        {/* Appearance */}
        <Section label="Appearance" theme={theme}>
          <ThemeCard />
        </Section>

        {/* Personalize */}
        <Section label="Personalize" theme={theme}>
          <TouchableOpacity onPress={() => router.push("/categories")} activeOpacity={0.7} style={s.navRow}>
            <View style={s.navIcon}>
              <Ionicons name="pricetags-outline" size={18} color={theme.inkSoft} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.navLabel}>Categories</Text>
              <Text style={s.navValue}>Add, edit, or remove task categories</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.inkFaint} />
          </TouchableOpacity>
        </Section>

        {/* Account */}
        <Section label="Account" theme={theme}>
          <InfoRow
            theme={theme}
            icon="time-outline"
            label="Last login"
            value={formatLogin(user?.lastLoginAt)}
          />
          <InfoRow
            theme={theme}
            icon="phone-portrait-outline"
            label="Last login device"
            value={user?.lastLoginDevice || "Unknown"}
          />
          <InfoRow
            theme={theme}
            icon="hardware-chip-outline"
            label="This device"
            value={currentDevice}
            last
          />
        </Section>

        {/* About */}
        <Section label="About" theme={theme}>
          <InfoRow theme={theme} icon="information-circle-outline" label="Version" value={appVersion} last />
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ label, children, theme }: { label: string; children: React.ReactNode; theme: Theme }) {
  return (
    <View style={{ marginBottom: 22 }}>
      <Text
        style={{
          fontSize: 12, fontFamily: FONTS.sansBold,
          color: theme.inkFaint, letterSpacing: 1, textTransform: "uppercase",
          marginBottom: 10, paddingLeft: 4,
        }}
      >
        {label}
      </Text>
      <View
        style={{
          backgroundColor: theme.surface,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: theme.line,
          overflow: "hidden",
        }}
      >
        {children}
      </View>
    </View>
  );
}

function InfoRow({
  theme, icon, label, value, last,
}: {
  theme: Theme;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: "row", alignItems: "center", gap: 12,
        paddingHorizontal: 16, paddingVertical: 14,
        borderBottomWidth: last ? 0 : 1, borderBottomColor: theme.line,
      }}
    >
      <View
        style={{
          width: 36, height: 36, borderRadius: 11,
          backgroundColor: theme.surfaceAlt,
          alignItems: "center", justifyContent: "center",
        }}
      >
        <Ionicons name={icon} size={18} color={theme.inkSoft} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.inkSoft, fontSize: 12, fontFamily: FONTS.sansSemi, letterSpacing: 0.2 }}>
          {label}
        </Text>
        <Text style={{ color: theme.ink, fontSize: 14.5, fontFamily: FONTS.sansSemi, marginTop: 2 }}>
          {value}
        </Text>
      </View>
    </View>
  );
}

// Inset on every side of the knob — equal at outer, inner, top, bottom.
const KNOB_INSET = 4;

function ThemeCard() {
  const { theme, mode, toggleTheme } = useTheme();
  const isDark = mode === "dark";
  const s = themeCardStyles(theme);

  // Measure the track once it lays out, then compute the knob's pixel-perfect
  // width and end positions. Percentage-based positioning can't give us equal
  // spacing on inner + outer edges (`calc()` doesn't exist in RN).
  const [trackW, setTrackW] = useState(0);
  const halfW = trackW / 2;
  const knobW = Math.max(0, halfW - KNOB_INSET * 2);

  // Animated slider: 0 = light side, 1 = dark side.
  const x = useRef(new Animated.Value(isDark ? 1 : 0)).current;
  useEffect(() => {
    Animated.spring(x, {
      toValue: isDark ? 1 : 0,
      useNativeDriver: false,
      friction: 8,
      tension: 70,
    }).start();
  }, [isDark, x]);

  return (
    <View style={s.wrap}>
      <View style={s.row}>
        <View style={s.iconBox}>
          <Ionicons name="contrast-outline" size={20} color={theme.ink} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.label}>Appearance</Text>
          <Text style={s.value}>{isDark ? "Dark mode" : "Light mode"}</Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={toggleTheme}
        activeOpacity={0.85}
        style={s.toggleTrack}
        onLayout={(e) => setTrackW(e.nativeEvent.layout.width)}
      >
        <Animated.View
          style={[
            s.knob,
            {
              width: knobW,
              left: x.interpolate({
                inputRange: [0, 1],
                outputRange: [KNOB_INSET, halfW + KNOB_INSET],
              }),
              backgroundColor: isDark ? "#2A2620" : theme.accent,
            },
          ]}
        />
        <View style={s.option}>
          <Ionicons name="sunny" size={18} color={isDark ? theme.inkFaint : theme.accentInk} />
          <Text style={[s.optionText, { color: isDark ? theme.inkFaint : theme.accentInk }]}>
            Light
          </Text>
        </View>
        <View style={s.option}>
          <Ionicons name="moon" size={18} color={isDark ? "#FFD27A" : theme.inkFaint} />
          <Text style={[s.optionText, { color: isDark ? "#FFD27A" : theme.inkFaint }]}>
            Dark
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const themeCardStyles = (t: Theme) =>
  StyleSheet.create({
    wrap: { padding: 16 },
    row: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
    iconBox: {
      width: 36, height: 36, borderRadius: 11,
      backgroundColor: t.surfaceAlt,
      alignItems: "center", justifyContent: "center",
    },
    label: { color: t.inkSoft, fontSize: 12, fontFamily: FONTS.sansSemi, letterSpacing: 0.2 },
    value: { color: t.ink, fontSize: 14.5, fontFamily: FONTS.sansSemi, marginTop: 2 },
    toggleTrack: {
      position: "relative",
      flexDirection: "row",
      height: 52,
      borderRadius: 16,
      backgroundColor: t.surfaceAlt,
      borderWidth: 1, borderColor: t.line,
      // No padding — the knob handles insets itself via measured pixel values.
    },
    knob: {
      position: "absolute",
      top: KNOB_INSET, bottom: KNOB_INSET,
      borderRadius: 12,
      shadowColor: "#000",
      shadowOpacity: 0.12,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      elevation: 3,
    },
    option: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      zIndex: 1,
    },
    optionText: {
      fontFamily: FONTS.sansBold,
      fontSize: 14,
    },
  });

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: t.bg },
    title: {
      fontSize: 30, fontFamily: FONTS.serifSemi, color: t.ink,
      letterSpacing: -0.5, marginTop: 4, marginBottom: 22,
    },
    planRow: {
      flexDirection: "row", alignItems: "center", gap: 12,
      paddingHorizontal: 16, paddingVertical: 14,
    },
    planBadge: {
      width: 36, height: 36, borderRadius: 11,
      alignItems: "center", justifyContent: "center",
    },
    planLabel: { color: t.inkSoft, fontSize: 12, fontFamily: FONTS.sansSemi, letterSpacing: 0.2 },
    planValue: { color: t.ink, fontSize: 14.5, fontFamily: FONTS.sansSemi, marginTop: 2 },
    upgradeBtn: {
      paddingHorizontal: 16, paddingVertical: 9, borderRadius: 999,
      backgroundColor: t.accent,
    },
    manageBtn: {
      paddingHorizontal: 16, paddingVertical: 9, borderRadius: 999,
      borderWidth: 1, borderColor: t.line, backgroundColor: t.surfaceAlt,
    },
    navRow: {
      flexDirection: "row", alignItems: "center", gap: 12,
      paddingHorizontal: 16, paddingVertical: 14,
    },
    navIcon: {
      width: 36, height: 36, borderRadius: 11, backgroundColor: t.surfaceAlt,
      alignItems: "center", justifyContent: "center",
    },
    navLabel: { color: t.ink, fontSize: 14.5, fontFamily: FONTS.sansSemi },
    navValue: { color: t.inkSoft, fontSize: 12, fontFamily: FONTS.sansMedium, marginTop: 2 },
  });
