import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import type { FeedbackEntry, FeedbackType, FeedbackSummary } from "../types/feedback";

const FEEDBACK_STORAGE_KEY = "feedback_entries";

export const [FeedbackProvider, useFeedback] = createContextHook(() => {
  const queryClient = useQueryClient();

  const feedbackQuery = useQuery({
    queryKey: ["feedback"],
    queryFn: async (): Promise<FeedbackEntry[]> => {
      try {
        const stored = await AsyncStorage.getItem(FEEDBACK_STORAGE_KEY);
        if (!stored || stored.trim().length === 0) {
          console.log("[FeedbackContext] No stored feedback");
          return [];
        }

        const entries = JSON.parse(stored);
        if (!Array.isArray(entries)) {
          console.error("[FeedbackContext] Stored feedback is not an array");
          await AsyncStorage.removeItem(FEEDBACK_STORAGE_KEY);
          return [];
        }

        return entries;
      } catch (error) {
        console.error("[FeedbackContext] Error loading feedback:", error);
        await AsyncStorage.removeItem(FEEDBACK_STORAGE_KEY);
        return [];
      }
    },
  });

  const addFeedbackMutation = useMutation({
    mutationFn: async (entry: FeedbackEntry) => {
      const entries = feedbackQuery.data || [];
      const updated = [...entries, entry];
      await AsyncStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["feedback"], data);
    },
  });

  const { mutate: addFeedbackMutate } = addFeedbackMutation;

  const addFeedback = useCallback(
    (entry: FeedbackEntry) => addFeedbackMutate(entry),
    [addFeedbackMutate]
  );

  const feedbackSummary = useMemo((): FeedbackSummary => {
    const entries = feedbackQuery.data || [];
    
    if (entries.length === 0) {
      return {
        totalRatings: 0,
        averageRating: 0,
        lowRatingsCount: 0,
        recentLowRatings: [],
        improvementPrompts: [],
      };
    }

    const totalRatings = entries.length;
    const averageRating = entries.reduce((sum, e) => sum + e.rating, 0) / totalRatings;
    const lowRatings = entries.filter(e => e.rating < 5);
    const lowRatingsCount = lowRatings.length;
    
    const recentLowRatings = lowRatings
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

    const improvementPrompts: string[] = [];

    const outfitGenLowRatings = recentLowRatings.filter(r => r.type === "outfit_generation");
    if (outfitGenLowRatings.length > 0) {
      const styleIssues = outfitGenLowRatings
        .filter(r => r.context?.style)
        .map(r => r.context?.style);
      
      if (styleIssues.length > 0) {
        const uniqueStyles = [...new Set(styleIssues)];
        improvementPrompts.push(
          `Previous outfit generations for ${uniqueStyles.join(", ")} style received low ratings. Pay extra attention to color coordination, brand consistency, and style appropriateness for these styles.`
        );
      }

      const hasColorIssues = outfitGenLowRatings.some(r => 
        r.context?.userComment?.toLowerCase().includes("color") ||
        r.context?.userComment?.toLowerCase().includes("match")
      );
      
      if (hasColorIssues) {
        improvementPrompts.push(
          "User feedback indicates color matching issues. Double-check that colors complement each other and avoid clashing combinations."
        );
      }

      const hasBrandIssues = outfitGenLowRatings.some(r => 
        r.context?.userComment?.toLowerCase().includes("brand") ||
        r.context?.userComment?.toLowerCase().includes("nike") ||
        r.context?.userComment?.toLowerCase().includes("adidas")
      );
      
      if (hasBrandIssues) {
        improvementPrompts.push(
          "User feedback indicates brand mixing issues. STRICTLY avoid mixing Nike and Adidas items. If any item is Nike, all branded items must be Nike or non-branded."
        );
      }
    }

    const itemIdLowRatings = recentLowRatings.filter(r => r.type === "item_identification");
    if (itemIdLowRatings.length > 0) {
      const categoryIssues = itemIdLowRatings
        .filter(r => r.context?.itemCategory)
        .map(r => r.context?.itemCategory);
      
      if (categoryIssues.length > 0) {
        const uniqueCategories = [...new Set(categoryIssues)];
        improvementPrompts.push(
          `Item identification for ${uniqueCategories.join(", ")} received low ratings. Be more careful and accurate when identifying these item types.`
        );
      }
    }

    return {
      totalRatings,
      averageRating,
      lowRatingsCount,
      recentLowRatings,
      improvementPrompts,
    };
  }, [feedbackQuery.data]);

  const getFeedbackByType = useCallback(
    (type: FeedbackType) => {
      return (feedbackQuery.data || []).filter(entry => entry.type === type);
    },
    [feedbackQuery.data]
  );

  const getImprovementContext = useCallback(
    (type: FeedbackType): string => {
      const summary = feedbackSummary;
      
      if (summary.improvementPrompts.length === 0) {
        return "";
      }

      const relevantPrompts = summary.improvementPrompts.filter(prompt => {
        if (type === "outfit_generation") {
          return prompt.includes("outfit") || prompt.includes("color") || prompt.includes("brand");
        }
        if (type === "item_identification") {
          return prompt.includes("identification") || prompt.includes("identifying");
        }
        return false;
      });

      if (relevantPrompts.length === 0) {
        return "";
      }

      return `\n\n--- IMPORTANT FEEDBACK-BASED IMPROVEMENTS ---\nBased on user feedback (${summary.lowRatingsCount} ratings below 5 stars out of ${summary.totalRatings} total), pay attention to:\n${relevantPrompts.map(p => `- ${p}`).join("\n")}\n--- END FEEDBACK CONTEXT ---\n`;
    },
    [feedbackSummary]
  );

  return useMemo(
    () => ({
      entries: feedbackQuery.data || [],
      isLoading: feedbackQuery.isLoading,
      addFeedback,
      feedbackSummary,
      getFeedbackByType,
      getImprovementContext,
      isAddingFeedback: addFeedbackMutation.isPending,
    }),
    [
      feedbackQuery.data,
      feedbackQuery.isLoading,
      addFeedback,
      feedbackSummary,
      getFeedbackByType,
      getImprovementContext,
      addFeedbackMutation.isPending,
    ]
  );
});
