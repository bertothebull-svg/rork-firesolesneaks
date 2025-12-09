import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import type { WardrobeItem, SavedOutfit, ItemCategory } from "../types/wardrobe";

const WARDROBE_STORAGE_KEY = "wardrobe_items";
const OUTFITS_STORAGE_KEY = "saved_outfits";

export const [WardrobeProvider, useWardrobe] = createContextHook(() => {
  const queryClient = useQueryClient();

  const wardrobeQuery = useQuery({
    queryKey: ["wardrobe"],
    queryFn: async (): Promise<WardrobeItem[]> => {
      try {
        const stored = await AsyncStorage.getItem(WARDROBE_STORAGE_KEY);
        if (!stored || stored.trim().length === 0) {
          console.log('[WardrobeContext] No stored data or empty string');
          return [];
        }
        
        if (typeof stored !== 'string') {
          console.error('[WardrobeContext] Invalid storage data type:', typeof stored);
          await AsyncStorage.removeItem(WARDROBE_STORAGE_KEY);
          return [];
        }
        
        let items;
        try {
          items = JSON.parse(stored);
        } catch (parseError) {
          console.error('[WardrobeContext] JSON parse error:', parseError);
          console.error('[WardrobeContext] Corrupted data, first 100 chars:', stored.substring(0, 100));
          await AsyncStorage.removeItem(WARDROBE_STORAGE_KEY);
          return [];
        }
        
        if (!Array.isArray(items)) {
          console.error('[WardrobeContext] Stored data is not an array');
          await AsyncStorage.removeItem(WARDROBE_STORAGE_KEY);
          return [];
        }
      const migratedItems = items.map((item: any) => {
        const existingColors = Array.isArray(item.colors) 
          ? item.colors 
          : item.color 
            ? [item.color] 
            : item.colors 
              ? [item.colors]
              : [];
        
        return {
          ...item,
          colors: existingColors,
          mainColors: item.mainColors || (existingColors.length > 0 ? [existingColors[0]] : undefined),
          accentColors: item.accentColors || (existingColors.length > 1 ? existingColors.slice(1) : undefined),
          seasons: item.seasons || undefined,
          dateLastWorn: item.dateLastWorn || undefined,
          timesWorn: item.timesWorn || 0,
        };
      });
      
        if (JSON.stringify(items) !== JSON.stringify(migratedItems)) {
          console.log("[Migration] Migrating", items.length, "items to new format");
          await AsyncStorage.setItem(WARDROBE_STORAGE_KEY, JSON.stringify(migratedItems));
        }
        
        return migratedItems;
      } catch (error) {
        console.error('[WardrobeContext] Error loading wardrobe items:', error);
        await AsyncStorage.removeItem(WARDROBE_STORAGE_KEY);
        return [];
      }
    },
  });

  const outfitsQuery = useQuery({
    queryKey: ["outfits"],
    queryFn: async (): Promise<SavedOutfit[]> => {
      try {
        const stored = await AsyncStorage.getItem(OUTFITS_STORAGE_KEY);
        if (!stored || stored.trim().length === 0) {
          console.log('[WardrobeContext] No stored outfits or empty string');
          return [];
        }
        
        if (typeof stored !== 'string') {
          console.error('[WardrobeContext] Invalid outfits storage data type:', typeof stored);
          await AsyncStorage.removeItem(OUTFITS_STORAGE_KEY);
          return [];
        }
        
        let outfits;
        try {
          outfits = JSON.parse(stored);
        } catch (parseError) {
          console.error('[WardrobeContext] JSON parse error in outfits:', parseError);
          console.error('[WardrobeContext] Corrupted outfits data, first 100 chars:', stored.substring(0, 100));
          await AsyncStorage.removeItem(OUTFITS_STORAGE_KEY);
          return [];
        }
        
        if (!Array.isArray(outfits)) {
          console.error('[WardrobeContext] Stored outfits data is not an array');
          await AsyncStorage.removeItem(OUTFITS_STORAGE_KEY);
          return [];
        }
        
        return outfits;
      } catch (error) {
        console.error('[WardrobeContext] Error loading outfits:', error);
        await AsyncStorage.removeItem(OUTFITS_STORAGE_KEY);
        return [];
      }
    },
  });

  const addItemMutation = useMutation({
    mutationFn: async (item: WardrobeItem) => {
      const items = wardrobeQuery.data || [];
      const updated = [...items, item];
      await AsyncStorage.setItem(WARDROBE_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["wardrobe"], data);
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async (item: WardrobeItem) => {
      const items = wardrobeQuery.data || [];
      const updated = items.map((i) => (i.id === item.id ? item : i));
      await AsyncStorage.setItem(WARDROBE_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["wardrobe"], data);
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const items = wardrobeQuery.data || [];
      const updated = items.filter((i) => i.id !== itemId);
      await AsyncStorage.setItem(WARDROBE_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["wardrobe"], data);
    },
  });

  const deleteAllItemsMutation = useMutation({
    mutationFn: async () => {
      await AsyncStorage.setItem(WARDROBE_STORAGE_KEY, JSON.stringify([]));
      return [];
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["wardrobe"], data);
    },
  });

  const saveOutfitMutation = useMutation({
    mutationFn: async (outfit: SavedOutfit) => {
      const outfits = outfitsQuery.data || [];
      const updated = [...outfits, outfit];
      await AsyncStorage.setItem(OUTFITS_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["outfits"], data);
    },
  });

  const deleteOutfitMutation = useMutation({
    mutationFn: async (outfitId: string) => {
      const outfits = outfitsQuery.data || [];
      const updated = outfits.filter((o) => o.id !== outfitId);
      await AsyncStorage.setItem(OUTFITS_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["outfits"], data);
    },
  });

  const getItemsByCategory = useCallback(
    (category: ItemCategory) => {
      return (wardrobeQuery.data || []).filter((item) => item.category === category);
    },
    [wardrobeQuery.data]
  );

  const sneakers = useMemo(() => getItemsByCategory("sneaker"), [getItemsByCategory]);
  const tops = useMemo(() => getItemsByCategory("top"), [getItemsByCategory]);
  const bottoms = useMemo(() => getItemsByCategory("bottom"), [getItemsByCategory]);
  const hats = useMemo(() => getItemsByCategory("hat"), [getItemsByCategory]);
  const socks = useMemo(() => getItemsByCategory("sock"), [getItemsByCategory]);

  const itemsMap = useMemo(() => {
    const map = new Map<string, WardrobeItem>();
    (wardrobeQuery.data || []).forEach(item => {
      map.set(item.id, item);
    });
    return map;
  }, [wardrobeQuery.data]);

  const getItemById = useCallback(
    (id: string) => itemsMap.get(id),
    [itemsMap]
  );

  const { mutate: addItemMutate } = addItemMutation;
  const { mutate: updateItemMutate } = updateItemMutation;
  const { mutate: deleteItemMutate } = deleteItemMutation;
  const { mutate: deleteAllItemsMutate } = deleteAllItemsMutation;
  const { mutate: saveOutfitMutate } = saveOutfitMutation;
  const { mutate: deleteOutfitMutate } = deleteOutfitMutation;

  const addItem = useCallback(
    (item: WardrobeItem) => addItemMutate(item),
    [addItemMutate]
  );

  const updateItem = useCallback(
    (item: WardrobeItem) => updateItemMutate(item),
    [updateItemMutate]
  );

  const deleteItem = useCallback(
    (itemId: string) => deleteItemMutate(itemId),
    [deleteItemMutate]
  );

  const deleteAllItems = useCallback(
    () => deleteAllItemsMutate(),
    [deleteAllItemsMutate]
  );

  const saveOutfit = useCallback(
    (outfit: SavedOutfit) => saveOutfitMutate(outfit),
    [saveOutfitMutate]
  );

  const deleteOutfit = useCallback(
    (outfitId: string) => deleteOutfitMutate(outfitId),
    [deleteOutfitMutate]
  );

  const markItemsAsWornMutation = useMutation({
    mutationFn: async (itemIds: string[]) => {
      const items = wardrobeQuery.data || [];
      const today = new Date().toISOString();
      const updated = items.map((item) => {
        if (itemIds.includes(item.id)) {
          return {
            ...item,
            dateLastWorn: today,
            timesWorn: (item.timesWorn || 0) + 1,
          };
        }
        return item;
      });
      await AsyncStorage.setItem(WARDROBE_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["wardrobe"], data);
    },
  });

  const { mutate: markItemsAsWornMutate } = markItemsAsWornMutation;

  const markItemsAsWorn = useCallback(
    (itemIds: string[]) => markItemsAsWornMutate(itemIds),
    [markItemsAsWornMutate]
  );

  return useMemo(
    () => ({
      items: wardrobeQuery.data || [],
      outfits: outfitsQuery.data || [],
      isLoading: wardrobeQuery.isLoading || outfitsQuery.isLoading,
      sneakers,
      tops,
      bottoms,
      hats,
      socks,
      addItem,
      updateItem,
      deleteItem,
      deleteAllItems,
      saveOutfit,
      deleteOutfit,
      markItemsAsWorn,
      getItemsByCategory,
      getItemById,
      isAddingItem: addItemMutation.isPending,
      isSavingOutfit: saveOutfitMutation.isPending,
      isMarkingWorn: markItemsAsWornMutation.isPending,
      isDeletingAll: deleteAllItemsMutation.isPending,
    }),
    [
      wardrobeQuery.data,
      wardrobeQuery.isLoading,
      outfitsQuery.data,
      outfitsQuery.isLoading,
      sneakers,
      tops,
      bottoms,
      hats,
      socks,
      addItem,
      updateItem,
      deleteItem,
      deleteAllItems,
      saveOutfit,
      deleteOutfit,
      markItemsAsWorn,
      getItemsByCategory,
      getItemById,
      addItemMutation.isPending,
      saveOutfitMutation.isPending,
      markItemsAsWornMutation.isPending,
      deleteAllItemsMutation.isPending,
    ]
  );
});

export function useWardrobeStats() {
  const { items } = useWardrobe();
  
  return useMemo(() => {
    const totalValue = items.reduce((sum, item) => sum + (item.marketValue || 0), 0);
    const totalSpent = items.reduce((sum, item) => sum + (item.purchasePrice || 0), 0);
    
    return {
      totalItems: items.length,
      totalValue,
      totalSpent,
      profit: totalValue - totalSpent,
    };
  }, [items]);
}
