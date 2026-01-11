import { Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import * as SplashScreen from 'expo-splash-screen';
import { SplashAnimation } from "../src/components/SplashAnimation";
import { theme } from "@/src/theme";


// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Hide the native splash screen as soon as our component is ready
    SplashScreen.hideAsync();
  }, []);

  if (showSplash) {
    return <SplashAnimation onFinish={() => setShowSplash(false)} />;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.mono }} edges={["top", "bottom"]}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade', // Native fade animation
        }}
        initialRouteName="welcome"
      >
        <Stack.Screen name="welcome" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </SafeAreaView>
  );
}
