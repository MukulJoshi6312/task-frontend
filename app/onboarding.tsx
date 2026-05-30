import { useRef, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, useWindowDimensions, type NativeSyntheticEvent, type NativeScrollEvent } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeContext";
import { FONTS } from "../theme/fonts";
import { onboardingFlag } from "../lib/onboardingFlag";
import { useAuth } from "../auth/AuthContext";

type Theme = ReturnType<typeof useTheme>["theme"];

const SLIDES = [
  {
    icon: "checkbox-outline" as const,
    title: "Capture every task",
    body: "From quick to-dos to multi-step projects — Taskly keeps it all in one place, organized by your own categories.",
  },
  {
    icon: "alarm-outline" as const,
    title: "Reminders that show up",
    body: "Add a due time and Taskly will nudge you at exactly the right moment. Never miss a thing.",
  },
  {
    icon: "color-palette-outline" as const,
    title: "Make it yours",
    body: "Light or dark. Your own colors and categories. A profile photo. Taskly adapts to how YOU work.",
  },
] as const;

export default function OnboardingScreen() {
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const router = useRouter();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const listRef = useRef<FlatList>(null);
  const [index, setIndex] = useState(0);

  const finish = async () => {
    await onboardingFlag.markSeen();
    // Already logged in (e.g. tapped "Show tour again" from Settings) →
    // straight back to home; otherwise route to login.
    router.replace(user ? "/" : "/login");
  };

  const next = () => {
    if (index < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: index + 1, animated: true });
    } else {
      void finish();
    }
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== index) setIndex(i);
  };

  return (
    <SafeAreaView style={s.root} edges={["top", "bottom"]}>
      <View style={s.topBar}>
        <View style={{ width: 60 }} />
        <View />
        <TouchableOpacity onPress={finish} hitSlop={8}>
          <Text style={s.skip}>Skip</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={listRef}
        data={SLIDES as unknown as typeof SLIDES[number][]}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        renderItem={({ item }) => (
          <View style={[s.slide, { width }]}>
            <View style={s.iconCircle}>
              <Ionicons name={item.icon} size={48} color={theme.accentInk} />
            </View>
            <Text style={s.title}>{item.title}</Text>
            <Text style={s.body}>{item.body}</Text>
          </View>
        )}
      />

      <View style={s.dots}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[
              s.dot,
              i === index
                ? { backgroundColor: theme.accent, width: 22 }
                : { backgroundColor: theme.line },
            ]}
          />
        ))}
      </View>

      <View style={s.bottom}>
        <TouchableOpacity onPress={next} activeOpacity={0.85} style={s.cta}>
          <Text style={s.ctaText}>
            {index === SLIDES.length - 1 ? "Get started" : "Next"}
          </Text>
          {index !== SLIDES.length - 1 && (
            <Ionicons name="arrow-forward" size={18} color={theme.accentInk} />
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: t.bg },
    topBar: {
      paddingHorizontal: 20, paddingTop: 6,
      flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    },
    skip: { color: t.inkSoft, fontFamily: FONTS.sansBold, fontSize: 14 },
    slide: {
      alignItems: "center", justifyContent: "center",
      paddingHorizontal: 32, paddingTop: 20,
    },
    iconCircle: {
      width: 120, height: 120, borderRadius: 36, backgroundColor: t.accent,
      alignItems: "center", justifyContent: "center", marginBottom: 36,
      shadowColor: t.accent, shadowOpacity: 0.45, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 10,
    },
    title: {
      textAlign: "center", color: t.ink, fontFamily: FONTS.serifSemi,
      fontSize: 30, lineHeight: 36, letterSpacing: -0.5, marginBottom: 14,
    },
    body: {
      textAlign: "center", color: t.inkSoft, fontFamily: FONTS.sansMedium,
      fontSize: 15, lineHeight: 22, maxWidth: 320,
    },
    dots: {
      flexDirection: "row", justifyContent: "center", gap: 8, paddingVertical: 20,
    },
    dot: { height: 6, borderRadius: 3, width: 6 },
    bottom: { paddingHorizontal: 24, paddingBottom: 8 },
    cta: {
      flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
      paddingVertical: 16, borderRadius: 18, backgroundColor: t.accent,
      shadowColor: t.accent, shadowOpacity: 0.4, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 6,
    },
    ctaText: { color: t.accentInk, fontFamily: FONTS.sansBold, fontSize: 16 },
  });
