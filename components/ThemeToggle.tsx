import { TouchableOpacity, View, Text, Animated } from "react-native";
import { useEffect, useRef } from "react";
import { useTheme } from "../theme/ThemeContext";

export default function ThemeToggle() {
  const { mode, toggleTheme } = useTheme();
  const dark = mode === "dark";
  const x = useRef(new Animated.Value(dark ? 29 : 3)).current;

  useEffect(() => {
    Animated.spring(x, {
      toValue: dark ? 29 : 3,
      useNativeDriver: false,
      friction: 7,
      tension: 60,
    }).start();
  }, [dark, x]);

  return (
    <TouchableOpacity
      onPress={toggleTheme}
      activeOpacity={0.85}
      style={{
        width: 56, height: 30, borderRadius: 999,
        backgroundColor: dark ? "#3A352B" : "#1C1A17",
        justifyContent: "center",
      }}
    >
      <Animated.View
        style={{
          position: "absolute", top: 3, left: x,
          width: 24, height: 24, borderRadius: 12,
          backgroundColor: dark ? "#FFD27A" : "#F4F1EA",
          alignItems: "center", justifyContent: "center",
        }}
      >
        <Text style={{ fontSize: 12 }}>{dark ? "☾" : "☀"}</Text>
      </Animated.View>
      <View />
    </TouchableOpacity>
  );
}
