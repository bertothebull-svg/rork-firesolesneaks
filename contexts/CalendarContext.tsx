import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import type { CalendarOutfit } from "../types/wardrobe";

const CALENDAR_STORAGE_KEY = "calendar_outfits";

export const [CalendarProvider, useCalendar] = createContextHook(() => {
  const queryClient = useQueryClient();

  const calendarQuery = useQuery({
    queryKey: ["calendar"],
    queryFn: async (): Promise<CalendarOutfit[]> => {
      try {
        const stored = await AsyncStorage.getItem(CALENDAR_STORAGE_KEY);
        if (!stored || stored.trim().length === 0) {
          console.log('[CalendarContext] No stored calendar data');
          return [];
        }
        
        const outfits = JSON.parse(stored);
        
        if (!Array.isArray(outfits)) {
          console.error('[CalendarContext] Stored data is not an array');
          await AsyncStorage.removeItem(CALENDAR_STORAGE_KEY);
          return [];
        }
        
        return outfits;
      } catch (error) {
        console.error('[CalendarContext] Error loading calendar:', error);
        await AsyncStorage.removeItem(CALENDAR_STORAGE_KEY);
        return [];
      }
    },
  });

  const saveOutfitForDateMutation = useMutation({
    mutationFn: async (outfit: CalendarOutfit) => {
      const outfits = calendarQuery.data || [];
      const existingIndex = outfits.findIndex(o => o.date === outfit.date);
      
      let updated: CalendarOutfit[];
      if (existingIndex >= 0) {
        updated = [...outfits];
        updated[existingIndex] = outfit;
      } else {
        updated = [...outfits, outfit];
      }
      
      await AsyncStorage.setItem(CALENDAR_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["calendar"], data);
    },
  });

  const deleteOutfitForDateMutation = useMutation({
    mutationFn: async (date: string) => {
      const outfits = calendarQuery.data || [];
      const updated = outfits.filter(o => o.date !== date);
      await AsyncStorage.setItem(CALENDAR_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["calendar"], data);
    },
  });

  const getOutfitForDate = useCallback(
    (date: string) => {
      return (calendarQuery.data || []).find(o => o.date === date);
    },
    [calendarQuery.data]
  );

  const getOutfitsForMonth = useCallback(
    (year: number, month: number) => {
      return (calendarQuery.data || []).filter(outfit => {
        const outfitDate = new Date(outfit.date);
        return outfitDate.getFullYear() === year && outfitDate.getMonth() === month;
      });
    },
    [calendarQuery.data]
  );

  const { mutate: saveOutfitForDateMutate } = saveOutfitForDateMutation;
  const { mutate: deleteOutfitForDateMutate } = deleteOutfitForDateMutation;

  const saveOutfitForDate = useCallback(
    (outfit: CalendarOutfit) => saveOutfitForDateMutate(outfit),
    [saveOutfitForDateMutate]
  );

  const deleteOutfitForDate = useCallback(
    (date: string) => deleteOutfitForDateMutate(date),
    [deleteOutfitForDateMutate]
  );

  return useMemo(
    () => ({
      calendarOutfits: calendarQuery.data || [],
      isLoading: calendarQuery.isLoading,
      saveOutfitForDate,
      deleteOutfitForDate,
      getOutfitForDate,
      getOutfitsForMonth,
      isSaving: saveOutfitForDateMutation.isPending,
    }),
    [
      calendarQuery.data,
      calendarQuery.isLoading,
      saveOutfitForDate,
      deleteOutfitForDate,
      getOutfitForDate,
      getOutfitsForMonth,
      saveOutfitForDateMutation.isPending,
    ]
  );
});
