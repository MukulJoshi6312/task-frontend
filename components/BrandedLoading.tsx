import { View, Text, ActivityIndicator, useColorScheme } from "react-native";
import { lightTheme, darkTheme } from "../theme/theme";

// Shown while custom fonts load, after the static splash hides.
// Uses system fonts because our custom fonts aren't loaded yet.
export default function BrandedLoading() {
  const isDark = useColorScheme() === "dark";
  const t = isDark ? darkTheme : lightTheme;

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: t.bg,
      }}
    >
      <View
        style={{
          width: 96,
          height: 96,
          borderRadius: 24,
          backgroundColor: t.accent,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 18,
          shadowColor: t.accent,
          shadowOpacity: 0.45,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 8 },
          elevation: 8,
        }}
      >
        <Text style={{ color: t.accentInk, fontSize: 48, fontWeight: "700" }}>T</Text>
      </View>
      <Text style={{ color: t.ink, fontSize: 26, fontWeight: "700", letterSpacing: -0.5 }}>
        Taskly
      </Text>
      <Text style={{ color: t.inkSoft, fontSize: 13, marginTop: 4 }}>
        getting things ready…
      </Text>
      <ActivityIndicator color={t.accent} style={{ marginTop: 28 }} />
    </View>
  );
}
