import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import type { UserProfile } from "../types/user";

const USER_PROFILE_STORAGE_KEY = "user_profile";

const defaultProfile: UserProfile = {
  hasCompletedOnboarding: false,
};

export const [UserProfileProvider, useUserProfile] = createContextHook(() => {
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: ["userProfile"],
    queryFn: async (): Promise<UserProfile> => {
      try {
        console.log("[UserProfile] Starting to load profile...");
        const stored = await AsyncStorage.getItem(USER_PROFILE_STORAGE_KEY);
        console.log("[UserProfile] AsyncStorage returned:", stored ? `data (${stored.length} chars)` : "null");
        
        if (!stored || stored.trim().length === 0) {
          console.log("[UserProfile] No stored profile, using default");
          return defaultProfile;
        }

        const profile = JSON.parse(stored);
        console.log("[UserProfile] Loaded profile:", profile);
        return profile;
      } catch (error) {
        console.error("[UserProfile] Error loading profile:", error);
        return defaultProfile;
      }
    },
    retry: 1,
    retryDelay: 500,
    staleTime: 0,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (updates: Partial<UserProfile>) => {
      const currentProfile = profileQuery.data || defaultProfile;
      const updated = { ...currentProfile, ...updates };
      await AsyncStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(updated));
      console.log("[UserProfile] Updated profile:", updated);
      return updated;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["userProfile"], data);
    },
  });

  const { mutate: updateProfileMutate } = updateProfileMutation;

  const updateProfile = useCallback(
    (updates: Partial<UserProfile>) => updateProfileMutate(updates),
    [updateProfileMutate]
  );

  const completeOnboarding = useCallback(
    (profile: Omit<UserProfile, "hasCompletedOnboarding">) => {
      updateProfile({ ...profile, hasCompletedOnboarding: true });
    },
    [updateProfile]
  );

  return useMemo(
    () => ({
      profile: profileQuery.data || defaultProfile,
      isLoading: profileQuery.isLoading,
      isUpdating: updateProfileMutation.isPending,
      updateProfile,
      completeOnboarding,
    }),
    [
      profileQuery.data,
      profileQuery.isLoading,
      updateProfileMutation.isPending,
      updateProfile,
      completeOnboarding,
    ]
  );
});
