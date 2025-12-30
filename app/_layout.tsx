import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { WardrobeProvider } from "../contexts/WardrobeContext";
import { WeatherProvider } from "../contexts/WeatherContext";
import { FeedbackProvider } from "../contexts/FeedbackContext";
import { UserProfileProvider, useUserProfile } from "../contexts/UserProfileContext";
import { CalendarProvider } from "../contexts/CalendarContext";
import { trpc, trpcClient } from "@/lib/trpc";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { profile, isLoading } = useUserProfile();
  const router = useRouter();
  const segments = useSegments();
  const [forceReady, setForceReady] = React.useState(false);

  useEffect(() => {
    console.log("[RootLayoutNav] isLoading:", isLoading, "profile:", profile);
  }, [isLoading, profile]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.warn("[RootLayoutNav] Loading timeout - forcing ready state");
        setForceReady(true);
      }
    }, 5000);

    return () => clearTimeout(timeout);
  }, [isLoading]);

  useEffect(() => {
    const hideAndNavigate = async () => {
      if (isLoading && !forceReady) {
        console.log("[RootLayoutNav] Still loading, waiting...");
        return;
      }

      console.log("[RootLayoutNav] Hiding splash and navigating...");
      await SplashScreen.hideAsync();

      const inOnboarding = segments[0] === "onboarding";
      console.log("[RootLayoutNav] inOnboarding:", inOnboarding, "hasCompletedOnboarding:", profile.hasCompletedOnboarding);

      if (!profile.hasCompletedOnboarding && !inOnboarding) {
        console.log("[RootLayoutNav] Navigating to onboarding");
        router.replace("/onboarding");
      } else if (profile.hasCompletedOnboarding && inOnboarding) {
        console.log("[RootLayoutNav] Navigating to tabs");
        router.replace("/(tabs)");
      }
    };

    hideAndNavigate();
  }, [profile, isLoading, forceReady, segments, router]);

  if (isLoading && !forceReady) {
    console.log("[RootLayoutNav] Rendering null (loading)");
    return null;
  }

  console.log("[RootLayoutNav] Rendering Stack");

  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <UserProfileProvider>
          <FeedbackProvider>
            <WeatherProvider>
              <WardrobeProvider>
                <CalendarProvider>
                  <GestureHandlerRootView style={{ flex: 1 }}>
                    <RootLayoutNav />
                  </GestureHandlerRootView>
                </CalendarProvider>
              </WardrobeProvider>
            </WeatherProvider>
          </FeedbackProvider>
        </UserProfileProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
