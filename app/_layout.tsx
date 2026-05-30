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
import { NotificationsProvider } from "../notifications/NotificationsContext";
import BrandedLoading from "../components/BrandedLoading";
import OfflineBanner from "../components/OfflineBanner";
import { initNotifications } from "../lib/notifications";
import { onboardingFlag } from "../lib/onboardingFlag";

initNotifications();   // sets up the Android channel + foreground handler

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
              <NotificationsProvider>
                <RootStack />
              </NotificationsProvider>
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

  // First-launch flag — undefined until we've checked AsyncStorage.
  const [onboardedKnown, setOnboardedKnown] = useState<boolean | null>(null);
  useEffect(() => {
    onboardingFlag.hasSeen().then(setOnboardedKnown);
  }, []);

  // Tell React Navigation about the brand background so it shows behind
  // rounded tab bar corners / between screens. Without this the default is
  // white in light AND dark themes — bleeds through anywhere children don't
  // fully cover.
  const navTheme = mode === "dark"
    ? { ...DarkTheme,    colors: { ...DarkTheme.colors,    background: theme.bg, card: theme.surface } }
    : { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: theme.bg, card: theme.surface } };

  // Auth + onboarding gate.
  useEffect(() => {
    if (initialising || onboardedKnown === null) return;

    // First launch ever → show the tour before anything else.
    if (!onboardedKnown && segments[0] !== "onboarding") {
      router.replace("/onboarding");
      return;
    }
    // Note: we used to bounce users *away* from /onboarding if they'd seen
    // it, but that broke the "Show tour again" feature — the local
    // `onboardedKnown` state was stale (only read at mount), so re-visiting
    // the tour after resetting the flag got instantly redirected back home.
    // Visiting /onboarding intentionally is harmless: the tour has Skip and
    // Get-started buttons that route the user out cleanly.

    const publicRoutes = new Set(["login", "verify", "forgot", "onboarding"]);
    const inPublicRoute = publicRoutes.has(segments[0] as string);
    if (!user && !inPublicRoute) router.replace("/login");
    else if (user && inPublicRoute && segments[0] !== "onboarding") router.replace("/");
  }, [user, segments, initialising, onboardedKnown, router]);

  if (initialising || onboardedKnown === null) return <BrandedLoading />;

  return (
    <NavThemeProvider value={navTheme}>
      <StatusBar style={mode === "dark" ? "light" : "dark"} />
      <OfflineBanner />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.bg },
        }}
      >
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="login" />
        <Stack.Screen name="verify" />
        <Stack.Screen name="forgot" />
        <Stack.Screen name="task/[id]" />
        <Stack.Screen name="categories" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="paywall" options={{ presentation: "modal" }} />
      </Stack>
    </NavThemeProvider>
  );
}
