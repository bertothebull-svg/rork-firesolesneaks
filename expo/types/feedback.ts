export type FeedbackType = "outfit_generation" | "item_identification";

export interface FeedbackEntry {
  id: string;
  type: FeedbackType;
  rating: 1 | 2 | 3 | 4 | 5;
  timestamp: string;
  context?: {
    style?: string;
    itemCategory?: string;
    aiResponse?: string;
    userComment?: string;
    itemsInvolved?: string[];
  };
}

export interface FeedbackSummary {
  totalRatings: number;
  averageRating: number;
  lowRatingsCount: number;
  recentLowRatings: FeedbackEntry[];
  improvementPrompts: string[];
}
