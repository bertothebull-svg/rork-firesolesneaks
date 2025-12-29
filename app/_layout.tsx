import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { WardrobeProvider } from "../contexts/WardrobeContext";
import { WeatherProvider } from "../contexts/WeatherContext";
import { FeedbackProvider } from "../contexts/FeedbackContext";
import { UserProfileProvider, useUserProfile } from "../contexts/UserProfileContext";
import { trpc, trpcClient } from "@/lib/trpc";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { profile, isLoading } = useUserProfile();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    const inOnboarding = segments[0] === "onboarding";

    if (!profile.hasCompletedOnboarding && !inOnboarding) {
      router.replace("/onboarding");
    } else if (profile.hasCompletedOnboarding && inOnboarding) {
      router.replace("/(tabs)");
    }
  }, [profile, isLoading, segments, router]);

  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <UserProfileProvider>
          <FeedbackProvider>
            <WeatherProvider>
              <WardrobeProvider>
                <GestureHandlerRootView style={{ flex: 1 }}>
                  <RootLayoutNav />
                </GestureHandlerRootView>
              </WardrobeProvider>
            </WeatherProvider>
          </FeedbackProvider>
        </UserProfileProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
