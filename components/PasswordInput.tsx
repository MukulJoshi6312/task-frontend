import { useState, forwardRef } from "react";
import { View, TextInput, TouchableOpacity, StyleSheet, type TextInput as TextInputType } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeContext";
import { FONTS } from "../theme/fonts";

type Props = {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  returnKeyType?: "done" | "next" | "go";
  onSubmitEditing?: () => void;
  textContentType?: "newPassword" | "password";
};

// Password input with built-in eye toggle.
// Keep the visibility state local — the parent only cares about the value.
const PasswordInput = forwardRef<TextInputType, Props>(function PasswordInput(
  { value, onChangeText, placeholder, autoFocus, returnKeyType, onSubmitEditing, textContentType },
  ref
) {
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const [visible, setVisible] = useState(false);

  return (
    <View style={s.row}>
      <TextInput
        ref={ref}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.inkFaint}
        secureTextEntry={!visible}
        autoCapitalize="none"
        autoCorrect={false}
        autoFocus={autoFocus}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
        textContentType={textContentType}
        style={s.input}
      />
      <TouchableOpacity
        onPress={() => setVisible((v) => !v)}
        hitSlop={10}
        style={s.eye}
        accessibilityLabel={visible ? "Hide password" : "Show password"}
      >
        <Ionicons
          name={visible ? "eye-off-outline" : "eye-outline"}
          size={20}
          color={theme.inkSoft}
        />
      </TouchableOpacity>
    </View>
  );
});

export default PasswordInput;

const makeStyles = (t: ReturnType<typeof useTheme>["theme"]) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: t.line,
      backgroundColor: t.surfaceAlt,
    },
    input: {
      flex: 1,
      paddingHorizontal: 16,
      paddingVertical: 14,
      color: t.ink,
      fontSize: 15,
      fontFamily: FONTS.sansMedium,
    },
    eye: {
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
  });
