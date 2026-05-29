import { View, Text, Image, StyleSheet, type ViewStyle, type ImageStyle, type StyleProp } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { FONTS } from "../theme/fonts";

type Props = {
  url?: string | null;
  name?: string | null;
  email?: string | null;
  size?: number;
  rounded?: "circle" | "squircle";
  style?: StyleProp<ViewStyle & ImageStyle>;
};

// Derives a single uppercase initial from name → email → "?".
const pickInitial = (name?: string | null, email?: string | null) => {
  const source = (name && name.trim()) || (email && email.split("@")[0]) || "?";
  return source.trim().charAt(0).toUpperCase();
};

export default function Avatar({
  url, name, email, size = 44, rounded = "squircle", style,
}: Props) {
  const { theme } = useTheme();
  const radius = rounded === "circle" ? size / 2 : Math.round(size * 0.28);

  if (url) {
    return (
      <Image
        source={{ uri: url }}
        style={[
          { width: size, height: size, borderRadius: radius, backgroundColor: theme.surfaceAlt },
          style,
        ]}
      />
    );
  }

  // Fallback: initial in a brand-colored tile.
  const initial = pickInitial(name, email);
  return (
    <View
      style={[
        styles.tile,
        {
          width: size, height: size, borderRadius: radius,
          backgroundColor: theme.accent,
          shadowColor: theme.accent,
          shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
          elevation: 4,
        },
        style,
      ]}
    >
      <Text style={{ color: theme.accentInk, fontFamily: FONTS.serifBold, fontSize: Math.round(size * 0.5) }}>
        {initial}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { alignItems: "center", justifyContent: "center" },
});
