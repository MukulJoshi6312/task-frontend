import "react-native-gesture-handler";
import { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Stack, useRouter, useSegments } from "expo-router";
import {
  ThemeProvider as NavThemeProvider,
  DefaultTheme,
  DarkTheme,
} from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import {
  useFonts,
  Fraunces_600SemiBold,
  Fraunces_700Bold,
} from "@expo-google-fonts/fraunces";
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from "@expo-google-fonts/plus-jakarta-sans";
import { ThemeProvider, useTheme } from "../theme/ThemeContext";
import { AuthProvider, useAuth } from "../auth/AuthContext";
import { CategoriesProvider } from "../categories/CategoriesContext";
import BrandedLoading from "../components/BrandedLoading";

SplashScreen.preventAutoHideAsync().catch(() => {});

const MIN_SPLASH_MS = 1400;

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });
  const [minElapsed, setMinElapsed] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setMinElapsed(true), MIN_SPLASH_MS);
    return () => clearTimeout(id);
  }, []);

  const ready = fontsLoaded && minElapsed;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return <BrandedLoading />;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <CategoriesProvider>
              <RootStack />
            </CategoriesProvider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function RootStack() {
  const { mode, theme } = useTheme();
  const { user, initialising } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Tell React Navigation about the brand background so it shows behind
  // rounded tab bar corners / between screens. Without this the default is
  // white in light AND dark themes — bleeds through anywhere children don't
  // fully cover.
  const navTheme = mode === "dark"
    ? { ...DarkTheme,    colors: { ...DarkTheme.colors,    background: theme.bg, card: theme.surface } }
    : { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: theme.bg, card: theme.surface } };

  // Auth gate: bounce users to the right place based on auth state.
  // Logged-out users may access login, verify, and forgot — anything else
  // bounces them to /login. Logged-in users on any of those bounce to /.
  useEffect(() => {
    if (initialising) return;
    const publicRoutes = new Set(["login", "verify", "forgot"]);
    const inPublicRoute = publicRoutes.has(segments[0] as string);
    if (!user && !inPublicRoute) router.replace("/login");
    else if (user && inPublicRoute) router.replace("/");
  }, [user, segments, initialising, router]);

  if (initialising) return <BrandedLoading />;

  return (
    <NavThemeProvider value={navTheme}>
      <StatusBar style={mode === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.bg },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="login" />
        <Stack.Screen name="verify" />
        <Stack.Screen name="forgot" />
        <Stack.Screen name="task/[id]" />
        <Stack.Screen name="categories" />
        <Stack.Screen name="paywall" options={{ presentation: "modal" }} />
      </Stack>
    </NavThemeProvider>
  );
}
