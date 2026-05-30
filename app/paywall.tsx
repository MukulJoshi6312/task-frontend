import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeContext";
import { FONTS } from "../theme/fonts";
import { useAuth } from "../auth/AuthContext";

type Theme = ReturnType<typeof useTheme>["theme"];

// Keep this list HONEST — only list things premium actually unlocks today.
// Reminders are free for everyone; don't promise them as a paid benefit.
const BENEFITS = [
  { icon: "infinite-outline", title: "Unlimited tasks", body: "Past the 15-task free cap, with no ceiling." },
  { icon: "heart-outline", title: "Support development", body: "Help us keep building features and fixing bugs." },
  { icon: "sparkles-outline", title: "First access to new features", body: "Recurring tasks, calendar view, and more — premium first." },
] as const;

export default function PaywallScreen() {
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const router = useRouter();
  const { mockUpgrade } = useAuth();
  const [busy, setBusy] = useState(false);

  const upgrade = async () => {
    if (busy) return;
    try {
      setBusy(true);
      // DEV: mock purchase. Replace with RevenueCat Purchases.purchasePackage(...) in production.
      await mockUpgrade();
      Alert.alert("You're Premium 🎉", "Thanks for upgrading. Enjoy unlimited tasks!");
      router.back();
    } catch {
      Alert.alert("Upgrade failed", "Could not complete the upgrade. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={s.root}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
        <TouchableOpacity onPress={() => router.back()} style={s.closeBtn} hitSlop={8}>
          <Ionicons name="close" size={22} color={theme.ink} />
        </TouchableOpacity>

        <View style={s.crown}>
          <Ionicons name="star" size={30} color={theme.accentInk} />
        </View>

        <Text style={s.title}>Taskly Premium</Text>
        <Text style={s.subtitle}>Unlock everything and get more done.</Text>

        <View style={s.benefits}>
          {BENEFITS.map((b) => (
            <View key={b.title} style={s.benefitRow}>
              <View style={s.benefitIcon}>
                <Ionicons name={b.icon} size={20} color={theme.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.benefitTitle}>{b.title}</Text>
                <Text style={s.benefitBody}>{b.body}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={s.priceCard}>
          <Text style={s.price}>$2.99<Text style={s.priceUnit}> / month</Text></Text>
          <Text style={s.priceNote}>Cancel anytime.</Text>
        </View>

        <TouchableOpacity onPress={upgrade} disabled={busy} activeOpacity={0.85} style={[s.cta, { opacity: busy ? 0.6 : 1 }]}>
          <Text style={s.ctaText}>{busy ? "Processing…" : "Upgrade to Premium"}</Text>
        </TouchableOpacity>

        <Text style={s.legal}>
          (Demo) This uses a mock purchase. Real billing is handled by the App Store / Play Store via RevenueCat.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: t.bg },
    closeBtn: { alignSelf: "flex-end", padding: 4, marginBottom: 4 },
    crown: {
      alignSelf: "center", width: 72, height: 72, borderRadius: 22,
      backgroundColor: t.accent, alignItems: "center", justifyContent: "center",
      marginBottom: 16,
      shadowColor: t.accent, shadowOpacity: 0.4, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 8,
    },
    title: { textAlign: "center", fontSize: 28, fontFamily: FONTS.serifSemi, color: t.ink, letterSpacing: -0.4 },
    subtitle: { textAlign: "center", marginTop: 6, marginBottom: 26, color: t.inkSoft, fontFamily: FONTS.sansMedium, fontSize: 14 },
    benefits: { gap: 14, marginBottom: 26 },
    benefitRow: { flexDirection: "row", gap: 14, alignItems: "center" },
    benefitIcon: {
      width: 40, height: 40, borderRadius: 12, backgroundColor: t.accentSoft,
      alignItems: "center", justifyContent: "center",
    },
    benefitTitle: { fontSize: 15, fontFamily: FONTS.sansBold, color: t.ink },
    benefitBody: { fontSize: 13, fontFamily: FONTS.sansMedium, color: t.inkSoft, marginTop: 1 },
    priceCard: {
      alignItems: "center", padding: 18, borderRadius: 20, marginBottom: 18,
      backgroundColor: t.surface, borderWidth: 1, borderColor: t.line,
    },
    price: { fontSize: 28, fontFamily: FONTS.sansBold, color: t.ink },
    priceUnit: { fontSize: 15, fontFamily: FONTS.sansMedium, color: t.inkSoft },
    priceNote: { fontSize: 12, fontFamily: FONTS.sansMedium, color: t.inkFaint, marginTop: 4 },
    cta: {
      paddingVertical: 16, borderRadius: 18, alignItems: "center", backgroundColor: t.accent,
      shadowColor: t.accent, shadowOpacity: 0.4, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 6,
    },
    ctaText: { color: t.accentInk, fontFamily: FONTS.sansBold, fontSize: 16 },
    legal: { textAlign: "center", fontSize: 11, color: t.inkFaint, fontFamily: FONTS.sansMedium, marginTop: 16, lineHeight: 16 },
  });
