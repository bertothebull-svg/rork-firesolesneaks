export type ItemCategory = "sneaker" | "top" | "bottom" | "hat" | "sock";

export type TopSubtype = "tshirt" | "polo" | "sweatshirt" | "outerwear" | "buttondown";
export type BottomSubtype = "jeans" | "sweatpants" | "shorts" | "gymshorts" | "dressslacks";

export type OutfitStyle = "urban" | "preppy" | "dad" | "stylish" | "casual" | "sporty" | "nineties" | "workappropriate";

export type Season = "spring" | "summer" | "fall" | "winter";

export interface WardrobeItem {
  id: string;
  category: ItemCategory;
  name: string;
  brand?: string;
  silhouette?: string;
  style?: string;
  commonName?: string;
  imageUrl: string;
  colors: string[];
  mainColors?: string[];
  accentColors?: string[];
  size?: string;
  purchasePrice?: number;
  marketValue?: number;
  notes?: string;
  dateAdded: string;
  seasons?: Season[];
  dateLastWorn?: string;
  timesWorn?: number;
  subtype?: TopSubtype | BottomSubtype;
  outfitStyles?: OutfitStyle[];
}

export interface SavedOutfit {
  id: string;
  name: string;
  style: OutfitStyle;
  sneakerId: string;
  topId: string;
  outerLayerId?: string;
  bottomId: string;
  hatId?: string;
  sockId?: string;
  dateCreated: string;
  aiGenerated: boolean;
  dateWorn?: string;
}

export interface CalendarOutfit {
  id: string;
  date: string;
  outfitId: string;
  sneakerId: string;
  topId: string;
  outerLayerId?: string;
  bottomId: string;
  hatId?: string;
  sockId?: string;
  style: OutfitStyle;
  notes?: string;
}
