import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { useRouter, useLocalSearchParams, Stack, useFocusEffect } from "expo-router";
import { Camera, Image as ImageIcon, ArrowLeft, AlertCircle, Sparkles } from "lucide-react-native";
import { useState, useCallback as useReactCallback, useRef } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CameraModal from "../../components/CameraModal";
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useMutation } from "@tanstack/react-query";
import { useWardrobe } from "../../contexts/WardrobeContext";
import { useFeedback } from "../../contexts/FeedbackContext";
import RatingModal from "../../components/RatingModal";
import type { FeedbackEntry } from "../../types/feedback";
import { COLORS, OUTFIT_STYLES } from "../../constants/styles";
import type { ItemCategory, WardrobeItem, Season, TopSubtype, BottomSubtype, OutfitStyle } from "../../types/wardrobe";
import { generateText } from "@rork-ai/toolkit-sdk";

export default function AddItemScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ editId?: string; category?: ItemCategory }>();
  const { addItem, updateItem, isAddingItem, items } = useWardrobe();
  const { addFeedback, getImprovementContext, isAddingFeedback } = useFeedback();
  
  const editingItem = params.editId ? items.find(item => item.id === params.editId) : null;
  const [category, setCategory] = useState<ItemCategory>(params.category || "sneaker");
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [silhouette, setSilhouette] = useState("");
  const [style, setStyle] = useState("");
  const [commonName, setCommonName] = useState("");
  const [colors, setColors] = useState<string[]>([]);
  const [mainColors, setMainColors] = useState<string[]>([]);
  const [accentColors, setAccentColors] = useState<string[]>([]);
  const [customColor, setCustomColor] = useState("");
  const [customAccentColor, setCustomAccentColor] = useState("");
  const [size, setSize] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [marketValue, setMarketValue] = useState("");
  const [notes, setNotes] = useState("");
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [imageErrors, setImageErrors] = useState<{ [key: string]: boolean }>({});
  const [modelSearch, setModelSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSeasons, setSelectedSeasons] = useState<Season[]>([]);
  const [showCustomColorInput, setShowCustomColorInput] = useState(false);
  const [showCustomAccentColorInput, setShowCustomAccentColorInput] = useState(false);
  const [subtype, setSubtype] = useState<TopSubtype | BottomSubtype | undefined>(undefined);
  const [isIdentifyingShoe, setIsIdentifyingShoe] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [selectedOutfitStyles, setSelectedOutfitStyles] = useState<OutfitStyle[]>([]);
  const [isPartOfSet, setIsPartOfSet] = useState(false);
  const [setId, setSetId] = useState("");
  const [fit, setFit] = useState("");
  const [showAccuracyRating, setShowAccuracyRating] = useState(false);
  const [lastIdentificationData, setLastIdentificationData] = useState<{
    type: 'photo' | 'name';
    input: string;
    output: any;
  } | null>(null);
  const [imageOptions, setImageOptions] = useState<string[]>([]);
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [alternativeShoes, setAlternativeShoes] = useState<{
    brand: string;
    model: string;
    colorway: string;
    silhouette: string;
    style: string;
    styleCode: string;
    retailPrice: string;
    marketValue: string;
    confidence: string;
    searchQuery: string;
  }[]>([]);
  const [showAlternatives, setShowAlternatives] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);

  const verifyShoeNameFromTitles = async (params: {
    currentName: string;
    currentBrand: string;
    styleCode?: string;
    pageTitles: string[];
    searchQuery: string;
  }) => {
    const { currentName, currentBrand, styleCode, pageTitles, searchQuery } = params;
    
    if (!pageTitles || pageTitles.length === 0) {
      console.log("[Name Verification] No titles to verify against");
      return null;
    }
    
    console.log("[Name Verification] Current AI name:", currentName);
    console.log("[Name Verification] Verifying against Google results...");
    
    const verificationPrompt = `You are a sneaker expert. The AI initially identified this shoe as "${currentName}" from brand "${currentBrand}"${styleCode ? ` with SKU "${styleCode}"` : ''}.

However, we need to verify this is correct by checking against ACTUAL product listings from StockX and GOAT.

Here are the REAL page titles from Google Image Search results for the query "${searchQuery}":

${pageTitles.slice(0, 10).map((title, i) => `${i + 1}. ${title}`).join('\n')}

IMPORTANT INSTRUCTIONS:
1. Look at the ACTUAL product names in these real listings
2. If the AI's name ("${currentName}") MATCHES or is VERY SIMILAR to what's in these listings, return it unchanged
3. If the listings show a DIFFERENT shoe name, return the CORRECT name from the listings
4. The SKU ${styleCode ? `"${styleCode}"` : 'in the search'} should match a specific shoe - find its EXACT name in these results

RETURN FORMAT:
- If the AI name is correct: return exactly "${currentName}"
- If incorrect: return the EXACT corrected shoe name from the Google results
- Include the full official name (e.g., "Air Jordan 1 Retro High OG 'University Blue'")

Return ONLY the shoe name, nothing else. No explanation.`;
    
    try {
      const response = await generateText({ 
        messages: [{ role: "user", content: verificationPrompt }] 
      });
      
      const correctedName = response.trim().replace(/"/g, '');
      
      console.log("[Name Verification] Original AI name:", currentName);
      console.log("[Name Verification] Verified/Corrected name:", correctedName);
      
      if (correctedName && correctedName.length > 0 && correctedName !== currentName) {
        return correctedName;
      }
      
      return null;
    } catch (error) {
      console.error("[Name Verification] Error:", error);
      return null;
    }
  };

  const commonColors = [
    { name: "Black", hex: "#000000" },
    { name: "Charcoal", hex: "#1F1F1F" },
    { name: "Jet Black", hex: "#0A0A0A" },
    { name: "White", hex: "#FFFFFF" },
    { name: "Off-White", hex: "#F5F5F5" },
    { name: "Cream", hex: "#FFFDD0" },
    { name: "Beige", hex: "#E8D5C4" },
    { name: "Red", hex: "#EF4444" },
    { name: "Crimson", hex: "#DC143C" },
    { name: "Burgundy", hex: "#800020" },
    { name: "Maroon", hex: "#800000" },
    { name: "Blue", hex: "#3B82F6" },
    { name: "Sky Blue", hex: "#87CEEB" },
    { name: "Navy", hex: "#1E3A8A" },
    { name: "Royal Blue", hex: "#4169E1" },
    { name: "Teal", hex: "#008080" },
    { name: "Turquoise", hex: "#40E0D0" },
    { name: "Green", hex: "#22C55E" },
    { name: "Forest Green", hex: "#228B22" },
    { name: "Olive", hex: "#808000" },
    { name: "Lime", hex: "#00FF00" },
    { name: "Mint", hex: "#98FF98" },
    { name: "Yellow", hex: "#EAB308" },
    { name: "Gold", hex: "#FFD700" },
    { name: "Mustard", hex: "#FFDB58" },
    { name: "Purple", hex: "#A855F7" },
    { name: "Lavender", hex: "#E6E6FA" },
    { name: "Violet", hex: "#8B00FF" },
    { name: "Pink", hex: "#EC4899" },
    { name: "Hot Pink", hex: "#FF69B4" },
    { name: "Rose", hex: "#FF007F" },
    { name: "Coral", hex: "#FF7F50" },
    { name: "Orange", hex: "#F97316" },
    { name: "Burnt Orange", hex: "#CC5500" },
    { name: "Peach", hex: "#FFE5B4" },
    { name: "Brown", hex: "#92400E" },
    { name: "Tan", hex: "#D2B48C" },
    { name: "Khaki", hex: "#C3B091" },
    { name: "Gray", hex: "#6B7280" },
    { name: "Light Gray", hex: "#D3D3D3" },
    { name: "Dark Gray", hex: "#A9A9A9" },
    { name: "Silver", hex: "#C0C0C0" },
  ];

  const shoeSizes = [
    "7", "7.5", "8", "8.5", "9", "9.5", "10", "10.5", "11", "11.5", "12", "12.5", "13"
  ];

  const clothingSizes = ["S", "M", "L", "XL", "2XL", "3XL", "4XL"];
  const bottomsSizes = ["S", "M", "L", "XL", "2XL", "3XL", "4XL", "30", "32", "34", "36", "38", "40", "42", "44", "46", "48"];
  const hatSizes = ["6 1/2", "6 5/8", "6 3/4", "6 7/8", "7", "7 1/8", "7 1/4", "7 3/8", "7 1/2", "7 5/8", "7 3/4", "7 7/8", "8"];

  useFocusEffect(
    useReactCallback(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });

      if (params.editId && editingItem) {
        setCategory(editingItem.category);
        setName(editingItem.name);
        setBrand(editingItem.brand || "");
        setSilhouette(editingItem.silhouette || "");
        setStyle(editingItem.style || "");
        setCommonName(editingItem.commonName || "");
        setColors(editingItem.colors || []);
        setMainColors(editingItem.mainColors || editingItem.colors || []);
        setAccentColors(editingItem.accentColors || []);
        setSize(editingItem.size || "");
        setPurchasePrice(editingItem.purchasePrice?.toString() || "");
        setMarketValue(editingItem.marketValue?.toString() || "");
        setNotes(editingItem.notes || "");
        setImageUris([editingItem.imageUrl]);
        setSelectedSeasons(editingItem.seasons || []);
        setSubtype(editingItem.subtype);
        setSelectedOutfitStyles(editingItem.outfitStyles || []);
        setIsPartOfSet(editingItem.isPartOfSet || false);
        setSetId(editingItem.setId || "");
        setFit(editingItem.fit || "");
      } else {
        setCategory(params.category || "sneaker");
        setName("");
        setBrand("");
        setSilhouette("");
        setStyle("");
        setCommonName("");
        setColors([]);
        setMainColors([]);
        setAccentColors([]);
        setCustomColor("");
        setCustomAccentColor("");
        setSize("");
        setPurchasePrice("");
        setMarketValue("");
        setNotes("");
        setImageUris([]);
        setImageErrors({});
        setModelSearch("");
        setSelectedSeasons([]);
        setSubtype(undefined);
        setSelectedOutfitStyles([]);
        setIsPartOfSet(false);
        setSetId("");
        setFit("");
        setLastIdentificationData(null);
        setShowAccuracyRating(false);
        setIsIdentifyingShoe(false);
        setIsSearching(false);
        setShowCamera(false);
        setShowCustomColorInput(false);
        setShowCustomAccentColorInput(false);
      }
    }, [params.editId, editingItem, params.category])
  );



  const searchRealImageMutation = useMutation({
    mutationFn: async (params: { searchQuery: string; styleCode?: string; brand?: string; model?: string }) => {
      const { searchQuery, styleCode, brand, model } = params;
      console.log("[Google Image Search] Starting ENHANCED search");
      console.log("[Google Image Search] Query:", searchQuery);
      console.log("[Google Image Search] Style Code:", styleCode);
      console.log("[Google Image Search] Brand:", brand);
      console.log("[Google Image Search] Model:", model);
      
      const apiKey = process.env.EXPO_PUBLIC_GOOGLE_API_KEY;
      const cseId = process.env.EXPO_PUBLIC_GOOGLE_CSE_ID;
      
      if (!apiKey || !cseId) {
        console.error("[Google Image Search] Missing API credentials");
        throw new Error("Google Search API not configured");
      }
      
      console.log("[Google Image Search] Using API Key:", apiKey.substring(0, 10) + "...");
      console.log("[Google Image Search] Using CSE ID:", cseId);
      
      const allImageUrls: string[] = [];
      const pageTitles: string[] = [];
      
      const queries = [];
      
      if (styleCode) {
        queries.push(`${styleCode} ${brand || ""} ${model || ""} product`.trim());
        queries.push(`${styleCode} stockx`);
        queries.push(`${styleCode} goat`);
      }
      
      queries.push(searchQuery);
      queries.push(`${searchQuery} stockx`);
      queries.push(`${searchQuery} goat official product image`);
      
      console.log("[Google Image Search] Will try", queries.length, "different search strategies");
      
      for (const query of queries.slice(0, 3)) {
        try {
          console.log("[Google Image Search] Trying query:", query);
          const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cseId}&q=${encodeURIComponent(query)}&searchType=image&num=10&imgSize=large&imgType=photo&safe=off`;
          
          const response = await fetch(searchUrl);
          
          if (!response.ok) {
            console.error("[Google Image Search] API Error:", response.status);
            if (response.status === 429) {
              throw new Error("Search rate limit exceeded. Please try again in a few minutes.");
            }
            continue;
          }
          
          const data = await response.json();
          console.log("[Google Image Search] Got", data.items?.length || 0, "results for this query");
          
          if (data.items && data.items.length > 0) {
            for (const item of data.items) {
              if (item.link && !allImageUrls.includes(item.link)) {
                allImageUrls.push(item.link);
                const title = item.title || "";
                pageTitles.push(title);
                console.log("[Google Image Search] Page title:", title);
              }
            }
          }
          
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error) {
          console.error("[Google Image Search] Query failed:", query, error);
        }
      }
      
      console.log("[Google Image Search] Total unique images found:", allImageUrls.length);
      console.log("[Google Image Search] Extracted page titles:", pageTitles.slice(0, 5));
      
      if (allImageUrls.length === 0) {
        throw new Error("No images found for this sneaker");
      }
      
      return { images: allImageUrls.slice(0, 12), titles: pageTitles.slice(0, 12) };
    },
  });

  const sneakerSearchMutation = useMutation({
    mutationFn: async (sneakerName: string) => {
      console.log("[Sneaker Search] Starting REAL DATA search for:", sneakerName);
      console.log("[Sneaker Search] NEW FLOW: Google first → Extract from REAL listings");
      
      const feedbackContext = getImprovementContext("item_identification");
      console.log("[Sneaker Search] Using feedback context:", feedbackContext);
      
      const isLikelyStyleCode = /^[A-Z0-9]{2,}[-_]?[A-Z0-9]{2,}[-_]?[A-Z0-9]{0,}$/i.test(sneakerName.trim());
      console.log("[Sneaker Search] Input appears to be a style code:", isLikelyStyleCode);
      
      let googleTitles: string[] = [];
      
      try {
        console.log("[Sneaker Search] STEP 1: Fetching REAL product listings from Google...");
        const imageData = await searchRealImageMutation.mutateAsync({
          searchQuery: sneakerName,
          styleCode: isLikelyStyleCode ? sneakerName : undefined
        });
        googleTitles = imageData.titles || [];
        console.log("[Sneaker Search] Got", googleTitles.length, "REAL product titles from Google");
        console.log("[Sneaker Search] Sample titles:", googleTitles.slice(0, 3));
      } catch (error) {
        console.error("[Sneaker Search] Failed to fetch Google data:", error);
      }
      
      const searchPrompt = `You are a sneaker data extraction expert. Your job is to extract the CORRECT shoe information from REAL product listings.

${feedbackContext ? feedbackContext + "\n" : ""}USER SEARCH: "${sneakerName}"
${isLikelyStyleCode ? "\n🎯 SKU/STYLE CODE MODE\nThe user entered a style code. Find the EXACT shoe for this SKU in the listings below.\n" : ""}${googleTitles.length > 0 ? `\n🔍 REAL PRODUCT LISTINGS FROM GOOGLE:\nHere are ACTUAL product page titles from StockX, GOAT, and other sneaker sites:\n\n${googleTitles.slice(0, 15).map((title, i) => `${i + 1}. ${title}`).join('\n')}\n\n⚠️ CRITICAL: The shoe name you return MUST come from these ACTUAL listings above. DO NOT make up or guess a name.\n` : "\n⚠️ WARNING: No Google data available. You must make your best guess.\n"}

YOUR MISSION:
1. ${googleTitles.length > 0 ? "EXTRACT the shoe name from the REAL listings above - look for patterns, find the most common full name" : "Make your best identification"}
2. The 'model' field is what displays to the user - it MUST be the EXACT official name from ${googleTitles.length > 0 ? "these real listings" : "StockX/GOAT"}
3. ${isLikelyStyleCode ? "This is a SKU - find which shoe in the listings matches this EXACT code" : "Find the shoe that matches the user's search"}
4. Provide 3-5 ALTERNATIVE matches in case the primary identification is wrong
5. Extract SKU codes from the listings if visible
6. ${googleTitles.length > 0 ? "DO NOT make up shoe names - only use names that appear in the listings above" : "Use official product names from sneaker databases"}

DATA EXTRACTION RULES:
${googleTitles.length > 0 ? `- The shoe name is ALREADY in the titles above - find it
- Look for the most complete, detailed product name
- If multiple listings say the same name, that's the correct name
- Extract the SKU if it appears in the titles (format: ABC123-456)
- Extract prices if mentioned in titles` : `- Use official names from GOAT.com and StockX.com
- Include complete colorway names
- Match SKUs to exact shoes`}

CRITICAL FOR 'model' FIELD:
- This is THE shoe name shown to the user
- ${googleTitles.length > 0 ? "Copy it EXACTLY from the listings above" : "Use the complete official product name"}
- Include brand, model, and colorway (e.g., "Air Jordan 1 Retro High OG 'University Blue'")
- ${isLikelyStyleCode ? "For SKU searches, this MUST be the exact shoe for that SKU" : ""}

EXAMPLES OF EXTRACTION FROM REAL TITLES:
Title: "Air Jordan 1 High OG University Blue 555088-134 | StockX"
→ Brand: "Air Jordan", Model: "Air Jordan 1 Retro High OG 'University Blue'", SKU: "555088-134"

Title: "Nike Dunk Low Black White (Panda) - DD1391-100 - GOAT"
→ Brand: "Nike", Model: "Dunk Low 'Black White'", SKU: "DD1391-100", Style: "Panda"

Title: "Buy Travis Scott x Air Jordan 1 Retro High OG 'Mocha' - CD4487-100"
→ Brand: "Air Jordan", Model: "Air Jordan 1 Retro High OG 'Mocha'", SKU: "CD4487-100"

${isLikelyStyleCode ? `SKU SEARCH EXAMPLE:
User entered: "${sneakerName}"
You see in titles: "...${sneakerName}...Nike Dunk Low Retro White Black Panda..."
→ The shoe is Nike Dunk Low Retro White Black (Panda) with SKU ${sneakerName}` : ""}

Provide information in this exact JSON format:
{
  "brand": "official brand name (Nike, Adidas, Air Jordan, New Balance, etc.)",
  "model": "complete official product name as listed on GOAT/StockX",
  "colorway": "official colorway name with specific color descriptors",
  "silhouette": "base model family (e.g. Air Jordan 1 High, Dunk Low, Yeezy 350 V2)",
  "style": "nickname or popular name",
  "styleCode": "official SKU/Style Code (critical for accuracy)",
  "imageSearchQuery": "CRITICAL: The MOST SPECIFIC search query for Google Image Search. MUST include ALL of: Brand + Full Model Name + Official Colorway Name + SKU/Style Code. This must be SO SPECIFIC that it returns ONLY this exact shoe. Example: 'Air Jordan 1 Retro High OG University Blue 555088-134' or 'Nike Dunk Low Black White Panda DD1391-100'. DO NOT use generic terms like 'sneaker' or 'shoe' - use the exact official product listing name.",
  "retailPrice": "original retail price USD (number only)",
  "marketValue": "current average resale price USD (number only)",
  "releaseYear": "year of release",
  "releaseDate": "full release date if known (MM/DD/YYYY)",
  "materials": "primary materials used (leather, suede, mesh, etc.)",
  "specialFeatures": "any unique features (reflective, glow, special box, etc.)",
  "confidence": "high (exact match with SKU), medium (strong match), or low (approximate)",
  "sources": "which platforms were referenced (GOAT, StockX, etc.)",
  "alternatives": [
    {
      "brand": "brand name",
      "model": "alternative model name",
      "colorway": "colorway name",
      "silhouette": "base silhouette",
      "style": "nickname",
      "styleCode": "SKU if known",
      "retailPrice": "price",
      "marketValue": "market value",
      "confidence": "confidence level",
      "searchQuery": "search query for this alternative"
    }
  ]
}

IMPORTANT: 
- Be HIGHLY specific with colorway names
- ALWAYS include SKU if identifiable
- Use official marketplace terminology
- Distinguish between different years/versions of same colorway
- Provide EXACT search query for finding images
- Include 3-5 alternative matches that could potentially match the search query
- Return ONLY valid JSON, no additional text

Return ONLY the JSON object.`;

      let response;
      let attempt = 0;
      const maxAttempts = 3;
      
      while (attempt < maxAttempts) {
        try {
          response = await generateText({ messages: [{ role: "user", content: searchPrompt }] });
          console.log("[Sneaker Search] AI Response (Attempt " + (attempt + 1) + "):", response);
          if (response && response.trim().length > 0) {
            break;
          }
        } catch (err) {
          console.error("[Sneaker Search] Attempt", attempt + 1, "failed:", err);
          if (attempt === maxAttempts - 1) {
            throw err;
          }
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
        attempt++;
      }
      
      if (!response || response.trim().length === 0) {
        throw new Error("No response from AI after " + maxAttempts + " attempts");
      }
      
      const trimmedResp = response.trim();
      if (trimmedResp.toLowerCase().startsWith('rate') || 
          trimmedResp.toLowerCase().includes('rate limit') ||
          trimmedResp.toLowerCase().includes('too many requests')) {
        console.error("[Sneaker Search] Rate limit detected:", trimmedResp.substring(0, 100));
        throw new Error("AI service is busy. Please wait a moment and try again.");
      }

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          let jsonString = jsonMatch[0].trim();
          
          if (jsonString.startsWith('object')) {
            jsonString = jsonString.substring(6).trim();
          }
          
          if (!jsonString.startsWith('{')) {
            const firstBrace = jsonString.indexOf('{');
            if (firstBrace !== -1) {
              jsonString = jsonString.substring(firstBrace);
            }
          }
          
          if (!jsonString.endsWith('}')) {
            const lastBrace = jsonString.lastIndexOf('}');
            if (lastBrace !== -1) {
              jsonString = jsonString.substring(0, lastBrace + 1);
            }
          }
          
          console.log("[Sneaker Search] Attempting to parse:", jsonString.substring(0, 200));
          const data = JSON.parse(jsonString);
          console.log("[Sneaker Search] Parsed JSON:", data);
          return data;
        } catch (e) {
          console.error("[Sneaker Search] JSON parse error:", e);
          console.error("[Sneaker Search] Attempted to parse:", jsonMatch[0].substring(0, 200));
        }
      }
      
      console.log("[Sneaker Search] No valid JSON found, using regex extraction");

      const brandMatch = response.match(/(?:brand|Brand)[":\s]*([^\n,}"]+)/i);
      const modelMatch = response.match(/(?:model|Model)[":\s]*([^\n,}"]+)/i);
      const colorMatch = response.match(/(?:colorway|color|Colorway|Color)[":\s]*([^\n,}"]+)/i);
      const retailMatch = response.match(/(?:retailPrice|retail_price|RetailPrice)[":\s]*(\d+)/i);
      const marketMatch = response.match(/(?:marketValue|market_value|MarketValue)[":\s]*(\d+)/i);

      const silhouetteMatch = response.match(/(?:silhouette|Silhouette)[":\s]*([^\n,}"]+)/i);
      const styleMatch = response.match(/(?:style|Style)[":\s]*([^\n,}"]+)/i);
      const styleCodeMatch = response.match(/(?:styleCode|style_code|StyleCode|sku|SKU)[":\s]*([^\n,}"]+)/i);
      const confidenceMatch = response.match(/(?:confidence|Confidence)[":\s]*([^\n,}"]+)/i);

      const imageSearchMatch = response.match(/(?:imageSearchQuery|image_search_query)[": ]*([^\n,}"]+)/i);

      return {
        brand: brandMatch?.[1]?.trim() || "",
        model: modelMatch?.[1]?.trim() || sneakerName,
        colorway: colorMatch?.[1]?.trim() || "",
        silhouette: silhouetteMatch?.[1]?.trim() || "",
        style: styleMatch?.[1]?.trim() || "",
        styleCode: styleCodeMatch?.[1]?.trim() || "",
        imageSearchQuery: imageSearchMatch?.[1]?.trim() || `${brandMatch?.[1]?.trim() || ""} ${modelMatch?.[1]?.trim() || sneakerName}`.trim(),
        retailPrice: retailMatch?.[1] || "",
        marketValue: marketMatch?.[1] || "",
        confidence: confidenceMatch?.[1]?.trim() || "medium",
      };
    },
  });

  const handleRatingSubmit = (rating: 1 | 2 | 3 | 4 | 5, comment?: string) => {
    if (!lastIdentificationData) return;

    const feedbackEntry: FeedbackEntry = {
      id: Date.now().toString(),
      type: "item_identification",
      rating,
      timestamp: new Date().toISOString(),
      context: {
        itemCategory: category,
        userComment: comment,
        aiResponse: JSON.stringify(lastIdentificationData.output).substring(0, 500),
      },
    };

    console.log("[Feedback] Submitting identification rating:", rating, comment || "(no comment)");
    addFeedback(feedbackEntry);
    setShowAccuracyRating(false);

    if (rating < 3 && alternativeShoes.length > 0) {
      Alert.alert(
        "Not the right shoe?",
        "We found some alternative matches. Would you like to see them?",
        [
          { text: "No, thanks", style: "cancel" },
          { 
            text: "Show Alternatives", 
            onPress: () => setShowAlternatives(true)
          }
        ]
      );
    } else if (rating < 5) {
      Alert.alert(
        "Thanks for your feedback!",
        "We'll use this to improve future item identifications."
      );
    }
  };

  const handleSelectAlternative = async (alt: typeof alternativeShoes[0]) => {
    console.log("[Alternative Selection] User selected:", alt.model);
    
    if (alt.brand) setBrand(alt.brand);
    if (alt.model) setName(alt.model);
    if (alt.silhouette) setSilhouette(alt.silhouette);
    if (alt.style) setStyle(alt.style);
    if (alt.colorway) {
      setColors([alt.colorway]);
      setMainColors([alt.colorway]);
    }
    if (alt.styleCode) {
      const currentNotes = notes ? notes + "\n\n" : "";
      setNotes(currentNotes + `Style Code: ${alt.styleCode}`);
    }
    if (alt.marketValue) setMarketValue(alt.marketValue.toString());
    if (alt.retailPrice) setPurchasePrice(alt.retailPrice.toString());
    
    setShowAlternatives(false);
    
    if (alt.searchQuery) {
      try {
        console.log("[Alternative Selection] Fetching images for:", alt.searchQuery);
        const imageData = await searchRealImageMutation.mutateAsync({
          searchQuery: alt.searchQuery,
          styleCode: alt.styleCode,
          brand: alt.brand,
          model: alt.model
        });
        
        const imageUrls = imageData.images;
        
        if (imageUrls.length > 0) {
          setImageOptions(imageUrls);
          if (imageUris.length === 0) {
            setImageUris([imageUrls[0]]);
          }
          
          if (imageUrls.length > 1) {
            setTimeout(() => setShowImageSelector(true), 500);
          }
        }
      } catch (error) {
        console.error("[Alternative Selection] Image search failed:", error);
      }
    }
    
    Alert.alert(
      "Updated!",
      `Changed to: ${alt.brand} ${alt.model}`,
      [{ text: "OK" }]
    );
  };

  const handleSneakerSearch = async (searchQuery?: string) => {
    const query = searchQuery || name;
    if (!query.trim()) {
      Alert.alert("Enter Sneaker Name", "Please enter a sneaker name or model number to search");
      return;
    }

    const feedbackContext = getImprovementContext("item_identification");
    console.log("[Sneaker Search] Feedback context:", feedbackContext);

    setIsSearching(true);
    try {
      const result = await sneakerSearchMutation.mutateAsync(query);
      console.log("[Sneaker Search] Final result:", result);
      
      if (result.brand) setBrand(result.brand);
      if (result.model && result.model !== name) setName(result.model);
      if (result.silhouette) setSilhouette(result.silhouette);
      if (result.style) setStyle(result.style);
      if (result.colorway) {
        setColors([result.colorway]);
        setMainColors([result.colorway]);
      }
      if (result.styleCode) {
        const currentNotes = notes ? notes + "\n\n" : "";
        setNotes(currentNotes + `Style Code: ${result.styleCode}`);
      }
      if (result.marketValue) setMarketValue(result.marketValue);
      if (result.retailPrice) setPurchasePrice(result.retailPrice);
      
      if (result.alternatives && Array.isArray(result.alternatives) && result.alternatives.length > 0) {
        console.log("[Sneaker Search] Found", result.alternatives.length, "alternative matches");
        setAlternativeShoes(result.alternatives);
      } else {
        setAlternativeShoes([]);
      }

      let imageFound = false;
      if (result.imageSearchQuery) {
        console.log("[Sneaker Search] Fetching multiple image options with enhanced search");
        
        try {
          const imageData = await searchRealImageMutation.mutateAsync({
            searchQuery: result.imageSearchQuery,
            styleCode: result.styleCode,
            brand: result.brand,
            model: result.model
          });
          
          const imageUrls = imageData.images;
          const titles = imageData.titles;
          
          console.log("[Sneaker Search] Got", imageUrls.length, "image options");
          
          if (imageUrls.length > 0) {
            console.log("[Sneaker Search] Verifying shoe name against Google results...");
            
            const correctedName = await verifyShoeNameFromTitles({
              currentName: result.model,
              currentBrand: result.brand,
              styleCode: result.styleCode,
              pageTitles: titles,
              searchQuery: query
            });
            
            if (correctedName && correctedName !== result.model) {
              console.log("[Sneaker Search] CORRECTED NAME:", result.model, "→", correctedName);
              setName(correctedName);
            }
            
            setImageOptions(imageUrls);
            if (imageUris.length === 0) {
              setImageUris([imageUrls[0]]);
            }
            imageFound = true;
            
            if (imageUrls.length > 1) {
              setTimeout(() => {
                setShowImageSelector(true);
              }, 800);
            }
          }
        } catch (imageError) {
          console.error("[Sneaker Search] Image search failed:", imageError);
        }
        
        if (!imageFound) {
          console.log("[Sneaker Search] Product image not found online");
        }
      }

      setLastIdentificationData({
        type: 'name',
        input: query,
        output: result
      });
      
      const successMessage = `✅ Found: ${result.brand || ""} ${result.model || ""}\n\nDetails loaded from sneaker databases.${result.confidence ? `\n\nConfidence: ${result.confidence.toUpperCase()}` : ""}`;
      
      Alert.alert(
        "Search Complete", 
        successMessage + (imageFound ? "\n\nProduct image loaded." : "\n\nCouldn't find product image - please use Camera or Library to add your own photo."),
        [
          {
            text: "OK",
            onPress: () => {
              setTimeout(() => {
                setShowAccuracyRating(true);
              }, 500);
            }
          }
        ]
      );
    } catch (error) {
      console.error("[Sneaker Search] Error:", error);
      Alert.alert("Error", "Failed to fetch sneaker data. Please try again or add details manually.");
    } finally {
      setIsSearching(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images" as const,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 5,
    });

    if (!result.canceled && result.assets.length > 0) {
      const newUris = result.assets.map(asset => asset.uri);
      setImageUris(prev => [...prev, ...newUris].slice(0, 5));
      console.log("[Image Picker] Selected", newUris.length, "images. Total:", Math.min(imageUris.length + newUris.length, 5));
    }
  };

  const takePhoto = () => {
    if (Platform.OS === "web") {
      pickImage();
      return;
    }
    setShowCamera(true);
  };

  const handleCameraCapture = (uri: string) => {
    setImageUris(prev => [...prev, uri].slice(0, 5));
    setShowCamera(false);
    console.log("[Camera] Captured image. Total images:", Math.min(imageUris.length + 1, 5));
  };

  const identifyShoeFromPhoto = async (retryCount = 0): Promise<boolean> => {
    if (imageUris.length === 0) {
      Alert.alert("No Photos", "Please take or select at least one photo first");
      return false;
    }

    setIsIdentifyingShoe(true);
    console.log("[Shoe Identification] ========== STARTING PHOTO ANALYSIS ==========");
    console.log("[Shoe Identification] Image URIs:", imageUris.map(uri => uri.substring(0, 50) + "..."));
    
    try {
      console.log("[Shoe Identification] Starting ENHANCED AI analysis... (Attempt " + (retryCount + 1) + "/3)");
      console.log("[Shoe Identification] Analyzing", imageUris.length, "image(s) for maximum accuracy");

      const base64Images: string[] = [];
      
      for (let i = 0; i < imageUris.length; i++) {
        const imageUri = imageUris[i];
        console.log("[Shoe Identification] Processing image", i + 1, "of", imageUris.length);
        console.log("[Shoe Identification] URI type:", imageUri.startsWith('file://') ? 'file://' : imageUri.startsWith('data:') ? 'data:' : imageUri.startsWith('http') ? 'http' : 'unknown');
        
        let base64Image = imageUri;
        if (imageUri.startsWith('file://') || (!imageUri.startsWith('data:') && !imageUri.startsWith('http'))) {
          console.log("[Shoe Identification] Converting file URI to base64...");
          try {
            const response = await fetch(imageUri);
            console.log("[Shoe Identification] Fetch response ok:", response.ok);
            const blob = await response.blob();
            console.log("[Shoe Identification] Blob size:", blob.size, "type:", blob.type);
            const reader = new FileReader();
            base64Image = await new Promise<string>((resolve, reject) => {
              reader.onloadend = () => resolve(reader.result as string);
              reader.onerror = (e) => {
                console.error("[Shoe Identification] FileReader error:", e);
                reject(e);
              };
              reader.readAsDataURL(blob);
            });
            console.log("[Shoe Identification] Converted to base64, length:", base64Image.length);
            console.log("[Shoe Identification] Base64 prefix:", base64Image.substring(0, 30));
          } catch (convError) {
            console.error("[Shoe Identification] Error converting image", i + 1, ":", convError);
            Alert.alert("Image Error", "Failed to process image " + (i + 1) + ". Try taking a new photo.");
            continue;
          }
        }

        if (!base64Image.startsWith('data:image/')) {
          console.error("[Shoe Identification] Invalid image format for image", i + 1);
          continue;
        }
        
        base64Images.push(base64Image);
      }
      
      if (base64Images.length === 0) {
        console.error("[Shoe Identification] NO IMAGES CONVERTED TO BASE64!");
        Alert.alert(
          "Image Processing Failed",
          "Could not process your photo(s). Please try:\n\n• Taking a new photo with the camera\n• Selecting a different image from library\n• Making sure the image file is not corrupted"
        );
        return false;
      }
      
      console.log("[Shoe Identification] Successfully processed", base64Images.length, "image(s)");

      if (retryCount > 0) {
        const waitTime = Math.min(2000 * Math.pow(2, retryCount - 1), 5000);
        console.log("[Shoe Identification] Waiting " + waitTime + "ms before retry...");
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }

      const feedbackContext = getImprovementContext("item_identification");
      console.log("[Shoe Identification] Feedback context:", feedbackContext);
      
      console.log("[Shoe Identification] Analyzing shoe with AI...");
      
      const prompt = `You are an ELITE sneaker authentication expert. Analyze ${imageUris.length > 1 ? 'these ' + imageUris.length + ' sneaker images' : 'this sneaker image'} with EXTREME PRECISION.

${feedbackContext ? feedbackContext + "\n" : ""}

${imageUris.length > 1 ? 'IMPORTANT: You have MULTIPLE images of the same shoe from different angles. Use ALL images together to get the most accurate identification. Look at all angles, surfaces, and details across all images.\n\n' : ''}YOU MUST PROVIDE:
1. Your PRIMARY identification (most likely match)
2. 3-5 ALTERNATIVE possible matches ranked by likelihood

IMPORTANT: The 'model' field in your response is what gets displayed to the user as the shoe name. Make sure it's the EXACT, COMPLETE, OFFICIAL product name.

CRITICAL INSTRUCTIONS:
You MUST examine EVERY surface of the shoe. Do NOT skip any part. Look at colors, materials, and details on:

1. UPPER SURFACES:
   - Toe box (exact color, material texture)
   - Side panels - BOTH lateral AND medial (describe each separately)
   - Heel counter (color, any branding)
   - Ankle collar (color, padding color)
   - Tongue (color, any logos or text)
   - Quarter panels (color)
   - Any overlays or underlays (colors, layers)

2. SWOOSH/LOGOS/BRANDING:
   - Swoosh color (if Nike/Jordan)
   - Swoosh placement (lateral, medial, both)
   - Other logos (Jumpman, adidas stripes, NB logo)
   - Logo colors and materials

3. MIDSOLE (THIS IS CRITICAL - DON'T IGNORE):
   - Primary midsole color
   - Any accent colors on midsole
   - Midsole material (painted, exposed foam, aged/yellowed)
   - Any Air units, Boost, or tech features visible

4. OUTSOLE (LOOK AT THE BOTTOM):
   - Outsole color (rubber color)
   - Tread pattern color
   - Any gum sole, translucent sole

5. LACES & HARDWARE:
   - Lace color
   - Lace tips/aglets
   - Eyelets (metal/plastic, color)

6. STITCHING & DETAILS:
   - Stitch colors
   - Any contrasting stitching
   - Special details (reflective, glow, special textures)

Now IDENTIFY THE SHOE:
- Cross-reference ALL colors you found with known colorways
- Match the EXACT color combination to official releases
- Use the SKU/style code if visible anywhere (tongue tag, size tag, insole)
- Consider YEAR of release if there are multiple versions

EXAMPLES OF PROPER COLOR ANALYSIS:
- "Chicago" = White leather toe/quarter + Black leather mid panels + Varsity Red overlays + White midsole + Red outsole
- "University Blue" = White leather base + University Blue overlays + Black Nike swoosh + White midsole + Light blue outsole
- "Panda Dunk" = White leather toe/quarter/collar + Black leather overlays + Black swoosh + White midsole + Black outsole

Return ONLY valid JSON:
{
  "brand": "official brand (Nike, Air Jordan, Adidas, New Balance, etc.)",
  "model": "complete official model name",
  "silhouette": "base silhouette (Air Jordan 1 High, Dunk Low, etc.)",
  "colorway": "EXACT official colorway name from GOAT/StockX",
  "extractedColors": "detailed description: toe box [color], panels [color], swoosh [color], midsole [color], outsole [color], etc.",
  "styleCode": "official SKU/Style Code if visible",
  "colors": ["all distinct colors seen on shoe with specific names"],
  "mainColors": ["2-3 most dominant colors"],
  "accentColors": ["secondary/accent colors"],
  "retailPrice": "original retail price number only",
  "marketValue": "current market value number only",
  "confidence": "high (if SKU visible or 100% certain) / medium (strong match) / low (uncertain)",
  "confidenceReason": "explain why this confidence level - mention which specific details led to ID",
  "searchQuery": "Brand + Full Model + Official Colorway + SKU for precise Google search",
  "alternatives": [
    {
      "brand": "brand name",
      "model": "alternative model name",
      "colorway": "colorway name", 
      "silhouette": "base silhouette",
      "style": "nickname or style name",
      "styleCode": "SKU if identifiable",
      "retailPrice": "retail price",
      "marketValue": "market value",
      "confidence": "confidence level for this alternative",
      "searchQuery": "search query for this specific shoe",
      "reason": "why this could be a match based on visual elements"
    }
  ]
}`;

      let aiResponse: string | undefined;
      let aiAttempt = 0;
      const maxAiAttempts = 3;
      
      while (aiAttempt < maxAiAttempts) {
        try {
          console.log("[Shoe Identification] Building AI request with", base64Images.length, "images (attempt", aiAttempt + 1, ")");
          const contentArray: ({ type: "text"; text: string } | { type: "image"; image: string })[] = [
            { type: "text", text: prompt }
          ];
          
          for (const base64Image of base64Images) {
            contentArray.push({ type: "image", image: base64Image });
          }
          
          console.log("[Shoe Identification] Sending request to AI vision model...");
          const startTime = Date.now();
          
          if (aiAttempt > 0) {
            const waitTime = 1500 * (aiAttempt + 1);
            console.log("[Shoe Identification] Waiting", waitTime, "ms before retry...");
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
          
          aiResponse = await generateText({
            messages: [
              {
                role: "user",
                content: contentArray
              }
            ]
          });
          
          console.log("[Shoe Identification] AI response received in", Date.now() - startTime, "ms");
          console.log("[Shoe Identification] Raw response type:", typeof aiResponse);
          console.log("[Shoe Identification] Raw response preview:", String(aiResponse).substring(0, 300));
          
          if (!aiResponse || typeof aiResponse !== 'string') {
            console.error("[Shoe Identification] Empty or invalid response from AI");
            throw new Error("No response from AI service");
          }
          
          const trimmedResponse = aiResponse.trim();
          
          if (trimmedResponse.toLowerCase().startsWith('rate') || 
              trimmedResponse.toLowerCase().includes('rate limit') ||
              trimmedResponse.toLowerCase().includes('too many requests') ||
              trimmedResponse.toLowerCase().includes('resource exhausted')) {
            console.error("[Shoe Identification] Rate limit detected:", trimmedResponse.substring(0, 100));
            if (aiAttempt < maxAiAttempts - 1) {
              aiAttempt++;
              continue;
            }
            throw new Error("AI service is busy. Please wait a moment and try again.");
          }
          
          if (!trimmedResponse.includes('{')) {
            console.error("[Shoe Identification] Response does not contain JSON:", trimmedResponse.substring(0, 200));
            if (aiAttempt < maxAiAttempts - 1) {
              aiAttempt++;
              continue;
            }
            throw new Error("Unexpected response from AI. Please try again.");
          }
          
          break;
          
        } catch (aiError) {
          console.error("[Shoe Identification] generateText error (attempt", aiAttempt + 1, "):", aiError);
          if (aiError instanceof Error) {
            console.error("[Shoe Identification] Error details:", {
              name: aiError.name,
              message: aiError.message,
            });
            
            if (aiError.message.includes('busy') || aiError.message.includes('wait')) {
              if (aiAttempt < maxAiAttempts - 1) {
                aiAttempt++;
                continue;
              }
              throw aiError;
            }
          }
          
          if (aiAttempt < maxAiAttempts - 1) {
            aiAttempt++;
            continue;
          }
          throw new Error("AI service is temporarily unavailable. Please try again in a moment or enter details manually.");
        }
      }

      console.log("[Shoe Identification] AI Response type:", typeof aiResponse);
      console.log("[Shoe Identification] AI Response length:", aiResponse?.length || 0);
      console.log("[Shoe Identification] AI Response preview:", aiResponse?.substring(0, 200));

      if (!aiResponse) {
        throw new Error("No response received from AI. Please try again.");
      }
      
      let jsonString = aiResponse;
      
      const codeBlockMatch = aiResponse.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        jsonString = codeBlockMatch[1].trim();
        console.log("[Shoe Identification] Extracted JSON from code block");
      }
      
      const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error("[Shoe Identification] No JSON found in response. Full response:", aiResponse.substring(0, 500));
        throw new Error("Could not analyze the shoe. Please try again or enter details manually.");
      }

      let result;
      try {
        let jsonString = jsonMatch[0];
        
        if (jsonString.startsWith('object')) {
          jsonString = jsonString.substring(6).trim();
        }
        
        if (!jsonString.startsWith('{')) {
          const firstBrace = jsonString.indexOf('{');
          if (firstBrace !== -1) {
            jsonString = jsonString.substring(firstBrace);
          }
        }
        
        if (!jsonString.endsWith('}')) {
          const lastBrace = jsonString.lastIndexOf('}');
          if (lastBrace !== -1) {
            jsonString = jsonString.substring(0, lastBrace + 1);
          }
        }
        
        console.log("[Shoe Identification] Attempting to parse JSON:", jsonString.substring(0, 300));
        result = JSON.parse(jsonString);
        console.log("[Shoe Identification] Successfully parsed result:", JSON.stringify(result).substring(0, 300));
      } catch (parseError) {
        console.error("[Shoe Identification] JSON parse error:", parseError);
        console.error("[Shoe Identification] Failed to parse:", jsonMatch[0].substring(0, 300));
        throw new Error("Failed to process AI response. Please try again or enter details manually.");
      }

      const data = {
        brand: result.brand || "Unknown",
        silhouette: result.silhouette || result.model || "Unknown",
        style: result.style || result.colorway || "Unknown",
        commonName: result.commonName || result.name || "Unknown",
        model: result.model || result.name || "Unknown",
        colorway: result.colorway || "Unknown",
        styleCode: result.styleCode || result.sku || "",
        colors: Array.isArray(result.colors) ? result.colors : [],
        retailPrice: result.retailPrice?.toString() || "0",
        marketValue: result.marketValue?.toString() || result.price?.toString() || "0",
        confidence: result.confidence || "medium",
        description: result.description || "",
      };
      
      console.log("[Shoe Identification] Processed data:", JSON.stringify(data).substring(0, 300));
      console.log("[Shoe Identification] Confidence:", data.confidence);
      console.log("[Shoe Identification] Confidence Reason:", result.confidenceReason);
      
      if (!data || typeof data !== 'object') {
        console.error("[Shoe Identification] Data is not an object:", typeof data);
        throw new Error("Invalid data format from AI service. Please try again.");
      }
      
      if (!data.brand && !data.model && !data.confidence) {
        console.error("[Shoe Identification] Missing all required fields:", {
          hasBrand: !!data.brand,
          hasModel: !!data.model,
          hasConfidence: !!data.confidence,
          keys: Object.keys(data)
        });
        throw new Error("Could not extract shoe information. Please try with a different photo.");
      }
      
      console.log("[Shoe Identification] Data validated successfully");
      console.log("[Shoe Identification] Search Query for verification:", result.searchQuery);
      
      let hasIdentified = false;

      if (data.brand && data.brand !== "Unknown" && data.brand.toLowerCase() !== "unknown") {
        setBrand(data.brand);
        hasIdentified = true;
      }
      if (data.silhouette && data.silhouette !== "Unknown" && data.silhouette.toLowerCase() !== "unknown") {
        setSilhouette(data.silhouette);
        hasIdentified = true;
      }
      if (data.style && data.style !== "Unknown" && data.style.toLowerCase() !== "unknown") {
        setStyle(data.style);
        hasIdentified = true;
      }
      if (data.commonName && data.commonName !== "Unknown" && data.commonName.toLowerCase() !== "unknown") {
        setCommonName(data.commonName);
        hasIdentified = true;
      }
      if (data.model && data.model !== "Unknown" && data.model.toLowerCase() !== "unknown") {
        setName(data.model);
        hasIdentified = true;
      }
      
      if (data.colors && Array.isArray(data.colors) && data.colors.length > 0) {
        const validColors = data.colors.filter(
          (c: string) => c && c !== "Unknown" && c.toLowerCase() !== "unknown"
        );
        if (validColors.length > 0) {
          setMainColors(validColors.slice(0, 2));
          if (validColors.length > 2) {
            setAccentColors(validColors.slice(2));
          }
          hasIdentified = true;
        }
      } else if (data.colorway && data.colorway !== "Unknown" && data.colorway.toLowerCase() !== "unknown") {
        setMainColors([data.colorway]);
        hasIdentified = true;
      }
      
      if (data.marketValue && data.marketValue !== "0" && data.marketValue !== "Unknown") {
        setMarketValue(data.marketValue.toString());
      }
      if (data.retailPrice && data.retailPrice !== "0" && data.retailPrice !== "Unknown") {
        setPurchasePrice(data.retailPrice.toString());
      }
      if (data.styleCode && data.styleCode.trim() !== "") {
        const currentNotes = notes ? notes + "\n\n" : "";
        setNotes(currentNotes + `Style Code: ${data.styleCode}`);
      }
      
      if (result.distinguishingFeatures) {
        const currentNotes = notes || "";
        const separator = currentNotes ? "\n\n" : "";
        setNotes(currentNotes + separator + `Key Features: ${result.distinguishingFeatures}`);
      }
      
      if (!hasIdentified) {
        if (retryCount < 2) {
          console.log("[Shoe Identification] No data extracted, retrying...");
          setIsIdentifyingShoe(false);
          return await identifyShoeFromPhoto(retryCount + 1);
        }
        
        Alert.alert(
          "Could Not Identify",
          data.description || "Unable to identify the shoe from this image. Please enter details manually or try:\n\n• A clearer photo\n• Better lighting\n• Show brand logos clearly"
        );
        return false;
      }

      if (result.alternatives && Array.isArray(result.alternatives) && result.alternatives.length > 0) {
        console.log("[Shoe Identification] Found", result.alternatives.length, "alternative matches");
        setAlternativeShoes(result.alternatives);
      } else {
        setAlternativeShoes([]);
      }

      setLastIdentificationData({
        type: 'photo',
        input: imageUris.length + " image(s)",
        output: data
      });
      
      const confidenceEmoji = data.confidence === "high" ? "🎯" : data.confidence === "medium" ? "👍" : "🤔";
      const altCount = result.alternatives?.length || 0;
      let message = `${confidenceEmoji} Identified from Photo!\n\n${data.brand || "?"} ${data.model || "?"}\n\nReview the details below and adjust if needed.${altCount > 0 ? `\n\n💡 ${altCount} alternative${altCount > 1 ? 's' : ''} available if this isn't right.` : ''}`;
      
      if (data.confidence) {
        message += `\n\nConfidence: ${data.confidence.toUpperCase()}`;
        if (result.confidenceReason) {
          message += `\n${result.confidenceReason}`;
        }
      }
      
      console.log("[Shoe Identification] Photo identification complete. Keeping user's original photo.");
      
      Alert.alert(
        "Photo Analysis Complete 👟", 
        message,
        [
          {
            text: "OK",
            onPress: () => {
              setTimeout(() => {
                setShowAccuracyRating(true);
              }, 500);
            }
          }
        ]
      );
      return true;
    } catch (error) {
      console.error("[Shoe Identification] Error:", error);
      
      if (retryCount < 2) {
        console.log("[Shoe Identification] Error occurred, retrying...");
        setIsIdentifyingShoe(false);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return await identifyShoeFromPhoto(retryCount + 1);
      }
      
      let errorMessage = "Failed to identify the shoe after 3 attempts. Try with a clearer photo showing:\n\n• Side view of the shoe\n• Visible brand logos\n• Good lighting\n• Close-up view";
      
      if (error instanceof Error) {
        console.error("[Shoe Identification] Error name:", error.name);
        console.error("[Shoe Identification] Error message:", error.message);
        if (error.stack) {
          console.error("[Shoe Identification] Error stack:", error.stack.substring(0, 500));
        }
        
        if (!error.message.includes("attempt")) {
          errorMessage = error.message + "\n\nPlease try again or enter details manually.";
        }
      }
      
      Alert.alert(
        "Identification Failed", 
        errorMessage
      );
      return false;
    } finally {
      setIsIdentifyingShoe(false);
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert("Required Field", "Please enter an item name");
      return;
    }

    if (imageUris.length === 0) {
      Alert.alert("Required Field", "Please add at least one image");
      return;
    }

    const allColors = [...new Set([...mainColors, ...accentColors])];
    
    const item: WardrobeItem = {
      id: editingItem ? editingItem.id : Date.now().toString(),
      category,
      name: name.trim(),
      brand: brand.trim() || undefined,
      silhouette: silhouette.trim() || undefined,
      style: style.trim() || undefined,
      commonName: commonName.trim() || undefined,
      imageUrl: imageUris[0],
      colors: allColors.length > 0 ? allColors : (colors.length > 0 ? colors : []),
      mainColors: mainColors.length > 0 ? mainColors : undefined,
      accentColors: accentColors.length > 0 ? accentColors : undefined,
      size: size.trim() || undefined,
      purchasePrice: purchasePrice ? parseFloat(purchasePrice) : undefined,
      marketValue: marketValue ? parseFloat(marketValue) : undefined,
      notes: notes.trim() || undefined,
      dateAdded: editingItem ? editingItem.dateAdded : new Date().toISOString(),
      seasons: category !== "sneaker" && category !== "sock" && selectedSeasons.length > 0 ? selectedSeasons : undefined,
      subtype: subtype,
      dateLastWorn: editingItem ? editingItem.dateLastWorn : undefined,
      timesWorn: editingItem ? editingItem.timesWorn : 0,
      outfitStyles: selectedOutfitStyles.length > 0 ? selectedOutfitStyles : undefined,
      isPartOfSet: isPartOfSet && setId ? true : undefined,
      setId: isPartOfSet && setId ? setId : undefined,
      fit: fit.trim() || undefined,
    };

    console.log(editingItem ? "[Edit Item] Updating:" : "[Add Item] Saving:", item);
    
    if (editingItem) {
      updateItem(item);
    } else {
      addItem(item);
    }
    
    router.back();
  };

  const categories: { id: ItemCategory; label: string; emoji: string }[] = [
    { id: "sneaker", label: "Sneakers", emoji: "👟" },
    { id: "top", label: "Tops", emoji: "👕" },
    { id: "bottom", label: "Bottoms", emoji: "👖" },
    { id: "hat", label: "Hats", emoji: "🧢" },
    { id: "sock", label: "Socks", emoji: "🧦" },
  ];

  const getSizesForCategory = () => {
    switch (category) {
      case "sneaker":
        return shoeSizes;
      case "top":
        return clothingSizes;
      case "bottom":
        return bottomsSizes;
      case "hat":
        return hatSizes;
      case "sock":
        return [];
      default:
        return [];
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <CameraModal 
        visible={showCamera} 
        onClose={() => setShowCamera(false)} 
        onCapture={handleCameraCapture}
      />
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{editingItem ? "Edit Item" : "Add New Item"}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView ref={scrollViewRef} showsVerticalScrollIndicator={false} style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category</Text>
          <View style={styles.categorySelector}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryCard, category === cat.id && styles.categoryCardActive]}
                onPress={() => {
                  setCategory(cat.id);
                  setSize("");
                }}
              >
                <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                <Text style={[styles.categoryLabel, category === cat.id && styles.categoryLabelActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photos {imageUris.length > 0 && `(${imageUris.length}/5)`}</Text>
          {imageUris.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScrollView} contentContainerStyle={styles.imagesScrollContent}>
              {imageUris.map((uri, index) => (
                <View key={index} style={styles.imagePreviewCard}>
                  <Image 
                    source={{ uri }} 
                    style={styles.multiImage} 
                    contentFit="cover"
                    placeholder={require("../../assets/images/icon.png")}
                    placeholderContentFit="contain"
                    transition={300}
                    cachePolicy="memory-disk"
                    onError={(error) => {
                      console.error("[Image Error] Failed to load:", uri, error);
                      setImageErrors(prev => ({ ...prev, [uri]: true }));
                    }}
                    onLoad={() => {
                      console.log("[Image Success] Loaded:", uri);
                      setImageErrors(prev => ({ ...prev, [uri]: false }));
                    }}
                  />
                  {imageErrors[uri] && (
                    <View style={styles.imageErrorOverlay}>
                      <AlertCircle size={24} color="#FF6B6B" />
                      <Text style={styles.imageErrorSmallText}>Failed</Text>
                    </View>
                  )}
                  <TouchableOpacity 
                    style={styles.removeImageBadge}
                    onPress={() => {
                      setImageUris(prev => prev.filter((_, i) => i !== index));
                      setImageErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors[uri];
                        return newErrors;
                      });
                    }}
                  >
                    <Text style={styles.removeImageBadgeText}>✕</Text>
                  </TouchableOpacity>
                  {index === 0 && (
                    <View style={styles.primaryImageBadge}>
                      <Text style={styles.primaryImageText}>PRIMARY</Text>
                    </View>
                  )}
                </View>
              ))}
              {imageUris.length < 5 && (
                <TouchableOpacity style={styles.addMoreImageCard} onPress={pickImage}>
                  <ImageIcon size={32} color={COLORS.primary} />
                  <Text style={styles.addMoreImageText}>Add More</Text>
                  <Text style={styles.addMoreImageSubtext}>({imageUris.length}/5)</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          ) : (
            <View style={styles.imagePlaceholder}>
              <View style={styles.imageButtonsRow}>
                <TouchableOpacity style={styles.imageButtonCompact} onPress={takePhoto}>
                  <Camera size={24} color={COLORS.primary} />
                  <Text style={styles.imageButtonCompactText}>Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.imageButtonCompact} onPress={pickImage}>
                  <ImageIcon size={24} color={COLORS.primary} />
                  <Text style={styles.imageButtonCompactText}>Library</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          {category === "sneaker" && imageUris.length > 0 && (
            <>
              <View style={styles.photoTipsCard}>
                <Text style={styles.photoTipsTitle}>📸 {imageUris.length > 1 ? 'Multiple Images = Better Accuracy!' : 'For Best Results:'}</Text>
                {imageUris.length > 1 ? (
                  <>
                    <Text style={styles.photoTipsText}>• You uploaded {imageUris.length} images - great!</Text>
                    <Text style={styles.photoTipsText}>• AI will analyze all angles for accuracy</Text>
                    <Text style={styles.photoTipsText}>• More angles = better identification</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.photoTipsText}>• Add multiple angles for best results</Text>
                    <Text style={styles.photoTipsText}>• Side, top, heel, and sole views help</Text>
                    <Text style={styles.photoTipsText}>• Show logos, tags, and color details</Text>
                  </>
                )}
              </View>
              <TouchableOpacity 
                style={styles.identifyButton} 
                onPress={() => identifyShoeFromPhoto()}
                disabled={isIdentifyingShoe}
              >
                {isIdentifyingShoe ? (
                  <>
                    <ActivityIndicator size="small" color="#FFF" />
                    <Text style={styles.identifyButtonText}>Analyzing Shoe Details...</Text>
                  </>
                ) : (
                  <>
                    <Sparkles size={20} color="#FFF" />
                    <Text style={styles.identifyButtonText}>✨ Identify Shoe from {imageUris.length} Photo{imageUris.length > 1 ? 's' : ''}</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          
          {category === "sneaker" && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Exact Model / SKU Search</Text>
              <View style={styles.inputWithButton}>
                <TextInput
                  style={styles.inputFlex}
                  value={modelSearch}
                  onChangeText={setModelSearch}
                  placeholder="e.g., 555088-134 or Air Jordan 1 Chicago"
                  placeholderTextColor={COLORS.textSecondary}
                />
                {modelSearch.trim() && (
                  <TouchableOpacity 
                    style={styles.aiButton} 
                    onPress={() => handleSneakerSearch(modelSearch)}
                    disabled={isSearching}
                  >
                    {isSearching ? (
                      <ActivityIndicator size="small" color={COLORS.primary} />
                    ) : (
                      <Sparkles size={20} color={COLORS.primary} />
                    )}
                  </TouchableOpacity>
                )}
              </View>
              <Text style={styles.helperText}>💡 Enter exact SKU or full model name for precise search. This helps find the exact colorway!</Text>
            </View>
          )}
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name *</Text>
            <View style={styles.inputWithButton}>
              <TextInput
                style={styles.inputFlex}
                value={name}
                onChangeText={setName}
                placeholder={category === "sneaker" ? "Air Jordan 1 Retro High" : category === "top" ? "Vintage Band Tee" : "Slim Fit Jeans"}
                placeholderTextColor={COLORS.textSecondary}
              />
              {category === "sneaker" && name.trim() && (
                <TouchableOpacity 
                  style={styles.aiButton} 
                  onPress={() => handleSneakerSearch()}
                  disabled={isSearching}
                >
                  {isSearching ? (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  ) : (
                    <Sparkles size={20} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              )}
            </View>
            {category === "sneaker" && (
              <Text style={styles.helperText}>💡 Enter the shoe name (e.g. {'"'}Air Jordan 1 Chicago{'"'}) and tap ✨ to auto-fill details from major sneaker databases.</Text>
            )}
          </View>



          {(category === "top" || category === "bottom") && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Type</Text>
              <View style={styles.subtypeGrid}>
                {category === "top" && [
                  { id: "tshirt" as TopSubtype, label: "T-Shirt", emoji: "👕" },
                  { id: "polo" as TopSubtype, label: "Polo", emoji: "👔" },
                  { id: "buttondown" as TopSubtype, label: "Button Down", emoji: "👔" },
                  { id: "sweatshirt" as TopSubtype, label: "Sweatshirt", emoji: "🧥" },
                  { id: "outerwear" as TopSubtype, label: "Outerwear", emoji: "🧥" },
                ].map((sub) => (
                  <TouchableOpacity
                    key={sub.id}
                    style={[styles.subtypeButton, subtype === sub.id && styles.subtypeButtonActive]}
                    onPress={() => setSubtype(sub.id)}
                  >
                    <Text style={styles.subtypeEmoji}>{sub.emoji}</Text>
                    <Text style={[styles.subtypeLabel, subtype === sub.id && styles.subtypeLabelActive]}>
                      {sub.label}
                    </Text>
                  </TouchableOpacity>
                ))}
                {category === "bottom" && [
                  { id: "jeans" as BottomSubtype, label: "Jeans", emoji: "👖" },
                  { id: "sweatpants" as BottomSubtype, label: "Sweatpants", emoji: "👖" },
                  { id: "shorts" as BottomSubtype, label: "Shorts", emoji: "🩳" },
                  { id: "gymshorts" as BottomSubtype, label: "Gym Shorts", emoji: "🩳" },
                  { id: "dressslacks" as BottomSubtype, label: "Dress Slacks", emoji: "👔" },
                ].map((sub) => (
                  <TouchableOpacity
                    key={sub.id}
                    style={[styles.subtypeButton, subtype === sub.id && styles.subtypeButtonActive]}
                    onPress={() => setSubtype(sub.id)}
                  >
                    <Text style={styles.subtypeEmoji}>{sub.emoji}</Text>
                    <Text style={[styles.subtypeLabel, subtype === sub.id && styles.subtypeLabelActive]}>
                      {sub.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Brand</Text>
            <TextInput
              style={styles.input}
              value={brand}
              onChangeText={setBrand}
              placeholder={category === "sneaker" ? "Nike" : category === "top" ? "Uniqlo" : "Levi's"}
              placeholderTextColor={COLORS.textSecondary}
            />
          </View>

          {category === "sneaker" && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Silhouette</Text>
                <TextInput
                  style={styles.input}
                  value={silhouette}
                  onChangeText={setSilhouette}
                  placeholder="Air Jordan 1, Dunk Low, Yeezy 350"
                  placeholderTextColor={COLORS.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Style</Text>
                <TextInput
                  style={styles.input}
                  value={style}
                  onChangeText={setStyle}
                  placeholder="Chicago, Panda, Bred"
                  placeholderTextColor={COLORS.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Common Name</Text>
                <TextInput
                  style={styles.input}
                  value={commonName}
                  onChangeText={setCommonName}
                  placeholder="Air Jordan 1 Chicago"
                  placeholderTextColor={COLORS.textSecondary}
                />
              </View>
            </>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Main Color (Select one or more)</Text>
            <View style={styles.colorGrid}>
              {commonColors.map((c) => {
                const isSelected = mainColors.includes(c.name);
                return (
                  <TouchableOpacity
                    key={c.name}
                    style={[styles.colorButton, isSelected && styles.colorButtonActive]}
                    onPress={() => {
                      setMainColors(prev => 
                        isSelected 
                          ? prev.filter(color => color !== c.name)
                          : [...prev, c.name]
                      );
                      setShowCustomColorInput(false);
                    }}
                  >
                    <View style={[styles.colorSwatch, { backgroundColor: c.hex }, c.name === "White" && styles.colorSwatchWhite]} />
                    <Text style={[styles.colorName, isSelected && styles.colorNameActive]}>
                      {c.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity
                style={[styles.colorButton, showCustomColorInput && styles.colorButtonActive]}
                onPress={() => {
                  setShowCustomColorInput(true);
                }}
              >
                <View style={[styles.colorSwatch, styles.otherColorSwatch]}>
                  <Text style={styles.otherColorText}>?</Text>
                </View>
                <Text style={[styles.colorName, showCustomColorInput && styles.colorNameActive]}>
                  Other
                </Text>
              </TouchableOpacity>
            </View>
            {showCustomColorInput && (
              <View style={{ marginTop: 12 }}>
                <TextInput
                  style={styles.input}
                  value={customColor}
                  onChangeText={setCustomColor}
                  placeholder="Enter custom color"
                  placeholderTextColor={COLORS.textSecondary}
                  autoFocus
                />
                <TouchableOpacity 
                  style={styles.addCustomColorButton}
                  onPress={() => {
                    if (customColor.trim()) {
                      setMainColors(prev => [...prev, customColor.trim()]);
                      setCustomColor("");
                      setShowCustomColorInput(false);
                    }
                  }}
                >
                  <Text style={styles.addCustomColorText}>Add Color</Text>
                </TouchableOpacity>
              </View>
            )}
            {mainColors.length > 0 && (
              <View style={styles.selectedColorsContainer}>
                <Text style={styles.selectedColorsLabel}>Selected: </Text>
                <View style={styles.selectedColorsList}>
                  {mainColors.map((color, index) => (
                    <View key={index} style={styles.selectedColorChip}>
                      <Text style={styles.selectedColorText}>{color}</Text>
                      <TouchableOpacity 
                        onPress={() => setMainColors(prev => prev.filter(c => c !== color))}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Text style={styles.removeColorText}>×</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Accent Colors (Optional)</Text>
            <View style={styles.colorGrid}>
              {commonColors.map((c) => {
                const isSelected = accentColors.includes(c.name);
                return (
                  <TouchableOpacity
                    key={c.name}
                    style={[styles.colorButton, isSelected && styles.colorButtonActive]}
                    onPress={() => {
                      setAccentColors(prev => 
                        isSelected 
                          ? prev.filter(color => color !== c.name)
                          : [...prev, c.name]
                      );
                      setShowCustomAccentColorInput(false);
                    }}
                  >
                    <View style={[styles.colorSwatch, { backgroundColor: c.hex }, c.name === "White" && styles.colorSwatchWhite]} />
                    <Text style={[styles.colorName, isSelected && styles.colorNameActive]}>
                      {c.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity
                style={[styles.colorButton, showCustomAccentColorInput && styles.colorButtonActive]}
                onPress={() => {
                  setShowCustomAccentColorInput(true);
                }}
              >
                <View style={[styles.colorSwatch, styles.otherColorSwatch]}>
                  <Text style={styles.otherColorText}>?</Text>
                </View>
                <Text style={[styles.colorName, showCustomAccentColorInput && styles.colorNameActive]}>
                  Other
                </Text>
              </TouchableOpacity>
            </View>
            {showCustomAccentColorInput && (
              <View style={{ marginTop: 12 }}>
                <TextInput
                  style={styles.input}
                  value={customAccentColor}
                  onChangeText={setCustomAccentColor}
                  placeholder="Enter custom accent color"
                  placeholderTextColor={COLORS.textSecondary}
                  autoFocus
                />
                <TouchableOpacity 
                  style={styles.addCustomColorButton}
                  onPress={() => {
                    if (customAccentColor.trim()) {
                      setAccentColors(prev => [...prev, customAccentColor.trim()]);
                      setCustomAccentColor("");
                      setShowCustomAccentColorInput(false);
                    }
                  }}
                >
                  <Text style={styles.addCustomColorText}>Add Color</Text>
                </TouchableOpacity>
              </View>
            )}
            {accentColors.length > 0 && (
              <View style={styles.selectedColorsContainer}>
                <Text style={styles.selectedColorsLabel}>Selected: </Text>
                <View style={styles.selectedColorsList}>
                  {accentColors.map((color, index) => (
                    <View key={index} style={styles.selectedColorChip}>
                      <Text style={styles.selectedColorText}>{color}</Text>
                      <TouchableOpacity 
                        onPress={() => setAccentColors(prev => prev.filter(c => c !== color))}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Text style={styles.removeColorText}>×</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>

          {category !== "sock" && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Size</Text>
            <View style={styles.sizeGrid}>
              {getSizesForCategory().map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.sizeButton, size === s && styles.sizeButtonActive]}
                  onPress={() => setSize(s)}
                >
                  <Text style={[styles.sizeText, size === s && styles.sizeTextActive]}>
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          )}

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Purchase Price</Text>
              <TextInput
                style={styles.input}
                value={purchasePrice}
                onChangeText={setPurchasePrice}
                placeholder="$0"
                keyboardType="numeric"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Market Value</Text>
              <TextInput
                style={styles.input}
                value={marketValue}
                onChangeText={setMarketValue}
                placeholder="$0"
                keyboardType="numeric"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>
          </View>

          {category !== "sneaker" && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Seasons</Text>
              <View style={styles.seasonSelector}>
                {(["spring", "summer", "fall", "winter"] as Season[]).map((season) => {
                  const isSelected = selectedSeasons.includes(season);
                  const seasonEmojis = {
                    spring: "🌸",
                    summer: "☀️",
                    fall: "🍂",
                    winter: "❄️",
                  };
                  
                  return (
                    <TouchableOpacity
                      key={season}
                      style={[styles.seasonButton, isSelected && styles.seasonButtonActive]}
                      onPress={() => {
                        setSelectedSeasons(prev => 
                          isSelected 
                            ? prev.filter(s => s !== season)
                            : [...prev, season]
                        );
                      }}
                    >
                      <Text style={styles.seasonEmoji}>{seasonEmojis[season]}</Text>
                      <Text style={[styles.seasonText, isSelected && styles.seasonTextActive]}>
                        {season.charAt(0).toUpperCase() + season.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {(category === "top" || category === "bottom") && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Matching Set</Text>
              <Text style={styles.helperText}>Is this part of a matching top + bottom set?</Text>
              <View style={styles.matchingSetContainer}>
                <TouchableOpacity
                  style={[styles.matchingSetButton, !isPartOfSet && styles.matchingSetButtonActive]}
                  onPress={() => {
                    setIsPartOfSet(false);
                    setSetId("");
                  }}
                >
                  <Text style={[styles.matchingSetButtonText, !isPartOfSet && styles.matchingSetButtonTextActive]}>
                    No
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.matchingSetButton, isPartOfSet && styles.matchingSetButtonActive]}
                  onPress={() => setIsPartOfSet(true)}
                >
                  <Text style={[styles.matchingSetButtonText, isPartOfSet && styles.matchingSetButtonTextActive]}>
                    Yes
                  </Text>
                </TouchableOpacity>
              </View>
              {isPartOfSet && (
                <View style={{ marginTop: 12 }}>
                  <Text style={styles.label}>Set Name/ID</Text>
                  <TextInput
                    style={styles.input}
                    value={setId}
                    onChangeText={setSetId}
                    placeholder="e.g., Nike Tech Fleece Gray Set"
                    placeholderTextColor={COLORS.textSecondary}
                  />
                  <Text style={styles.helperText}>
                    💡 Use the same Set Name for the matching {category === "top" ? "bottom" : "top"} so the AI knows they go together
                  </Text>
                </View>
              )}
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Outfit Styles</Text>
            <Text style={styles.helperText}>Select which styles this item works with</Text>
            <View style={styles.outfitStylesGrid}>
              {OUTFIT_STYLES.map((outfitStyle) => {
                const isSelected = selectedOutfitStyles.includes(outfitStyle.id);
                return (
                  <TouchableOpacity
                    key={outfitStyle.id}
                    style={[styles.outfitStyleButton, isSelected && styles.outfitStyleButtonActive]}
                    onPress={() => {
                      setSelectedOutfitStyles(prev => 
                        isSelected 
                          ? prev.filter(s => s !== outfitStyle.id)
                          : [...prev, outfitStyle.id]
                      );
                    }}
                  >
                    <Text style={styles.outfitStyleEmoji}>{outfitStyle.emoji}</Text>
                    <Text style={[styles.outfitStyleText, isSelected && styles.outfitStyleTextActive]}>
                      {outfitStyle.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {(category === "top" || category === "bottom") && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Fit</Text>
              <Text style={styles.helperText}>How does this item fit?</Text>
              <View style={styles.fitButtonsContainer}>
                {["Tight", "Slim", "Regular", "Relaxed", "Oversized"].map((fitOption) => (
                  <TouchableOpacity
                    key={fitOption}
                    style={[styles.fitButton, fit === fitOption && styles.fitButtonActive]}
                    onPress={() => setFit(fitOption)}
                  >
                    <Text style={[styles.fitButtonText, fit === fitOption && styles.fitButtonTextActive]}>
                      {fitOption}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {editingItem && editingItem.dateLastWorn && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Last Worn</Text>
              <View style={styles.lastWornContainer}>
                <Text style={styles.lastWornText}>
                  {new Date(editingItem.dateLastWorn).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </Text>
                {editingItem.timesWorn !== undefined && editingItem.timesWorn > 0 && (
                  <Text style={styles.timesWornText}>
                    Worn {editingItem.timesWorn} time{editingItem.timesWorn !== 1 ? 's' : ''}
                  </Text>
                )}
              </View>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notes (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add any additional notes..."
              placeholderTextColor={COLORS.textSecondary}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>

        <View style={{ height: 20 }} />

        <TouchableOpacity 
          style={[styles.saveButton, isAddingItem && styles.saveButtonDisabled]} 
          onPress={handleSave}
          disabled={isAddingItem}
        >
          {isAddingItem ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.saveButtonText}>{editingItem ? "Update Item" : "Save to Collection"}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
      
      <RatingModal
        visible={showAccuracyRating}
        onClose={() => {
          setShowAccuracyRating(false);
        }}
        onSubmit={handleRatingSubmit}
        title="Rate Identification Accuracy"
        description={`How accurate was this ${lastIdentificationData?.type === 'photo' ? 'image recognition' : 'search result'}?`}
        isSubmitting={isAddingFeedback}
      />

      {category === "sneaker" && alternativeShoes.length > 0 && (
        <TouchableOpacity 
          style={styles.showAlternativesButton}
          onPress={() => setShowAlternatives(true)}
        >
          <Text style={styles.showAlternativesText}>🔄 Not the right shoe? See {alternativeShoes.length} alternative{alternativeShoes.length > 1 ? 's' : ''}</Text>
        </TouchableOpacity>
      )}

      {category === "sneaker" && showAlternatives && alternativeShoes.length > 0 && (
        <View style={styles.alternativesOverlay}>
          <View style={styles.alternativesModal}>
            <View style={styles.alternativesHeader}>
              <Text style={styles.alternativesTitle}>Alternative Matches</Text>
              <TouchableOpacity onPress={() => setShowAlternatives(false)} style={styles.alternativesClose}>
                <Text style={styles.alternativesCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.alternativesSubtitle}>Select the correct shoe from these options</Text>
            <ScrollView style={styles.alternativesScroll}>
              {alternativeShoes.map((alt, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.alternativeItem}
                  onPress={() => handleSelectAlternative(alt)}
                >
                  <View style={styles.alternativeInfo}>
                    <Text style={styles.alternativeBrand}>{alt.brand}</Text>
                    <Text style={styles.alternativeModel}>{alt.model}</Text>
                    {alt.colorway && (
                      <Text style={styles.alternativeColorway}>{alt.colorway}</Text>
                    )}
                    {alt.styleCode && (
                      <Text style={styles.alternativeSku}>SKU: {alt.styleCode}</Text>
                    )}
                    <View style={styles.alternativeDetails}>
                      {alt.marketValue && (
                        <Text style={styles.alternativePrice}>${alt.marketValue}</Text>
                      )}
                      {alt.confidence && (
                        <View style={[
                          styles.alternativeConfidence,
                          alt.confidence === 'high' && styles.confidenceHigh,
                          alt.confidence === 'medium' && styles.confidenceMedium,
                          alt.confidence === 'low' && styles.confidenceLow,
                        ]}>
                          <Text style={styles.alternativeConfidenceText}>
                            {alt.confidence.toUpperCase()}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <Text style={styles.alternativeArrow}>→</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      {showImageSelector && imageOptions.length > 1 && (
        <View style={styles.imageSelectorOverlay}>
          <View style={styles.imageSelectorModal}>
            <View style={styles.imageSelectorHeader}>
              <Text style={styles.imageSelectorTitle}>Choose the Correct Colorway</Text>
              <TouchableOpacity onPress={() => setShowImageSelector(false)} style={styles.imageSelectorClose}>
                <Text style={styles.imageSelectorCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.imageSelectorSubtitle}>Tap the image that matches the exact colorway</Text>
            <ScrollView style={styles.imageSelectorScroll}>
              <View style={styles.imageSelectorGrid}>
                {imageOptions.map((url, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.imageSelectorOption,
                      imageUris[0] === url && styles.imageSelectorOptionSelected
                    ]}
                    onPress={() => {
                      setImageUris([url, ...imageUris.slice(1)]);
                      setImageErrors({});
                      setShowImageSelector(false);
                    }}
                  >
                    <Image
                      source={{ uri: url }}
                      style={styles.imageSelectorImage}
                      contentFit="cover"
                      placeholder={require("../../assets/images/icon.png")}
                      placeholderContentFit="contain"
                    />
                    {imageUris[0] === url && (
                      <View style={styles.imageSelectorCheckmark}>
                        <Text style={styles.imageSelectorCheckmarkText}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 12,
    backgroundColor: COLORS.background,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: COLORS.text,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: COLORS.text,
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  categorySelector: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
  },
  categoryCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  categoryCardActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: COLORS.textSecondary,
  },
  categoryLabelActive: {
    color: "#FFF",
  },
  imagePlaceholder: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 20,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderStyle: "dashed" as const,
  },
  imageButtonsRow: {
    flexDirection: "row",
    gap: 12,
  },
  imageButtonCompact: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    gap: 8,
  },
  imageButtonCompactText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: COLORS.primary,
  },
  imagePreview: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
    backgroundColor: COLORS.surface,
    marginHorizontal: 20,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageOverlayButtons: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: "row",
    gap: 8,
  },
  changeImageButton: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  removeImageButton: {
    backgroundColor: "rgba(220, 38, 38, 0.8)",
  },
  changeImageText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600" as const,
  },
  inputGroup: {
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: COLORS.text,
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: COLORS.text,
  },
  textArea: {
    height: 90,
    paddingTop: 14,
  },
  inputWithButton: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  inputFlex: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: COLORS.text,
  },
  aiButton: {
    width: 48,
    height: 48,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  colorButton: {
    width: "22%",
    aspectRatio: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 6,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surface,
  },
  colorSwatch: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  colorSwatchWhite: {
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  colorName: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  colorNameActive: {
    color: COLORS.primary,
  },
  sizeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  sizeButton: {
    minWidth: 56,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  sizeButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  sizeText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: COLORS.text,
  },
  sizeTextActive: {
    color: "#FFF",
  },
  row: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    marginHorizontal: 20,
    marginTop: 24,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "#FFF",
    fontSize: 17,
    fontWeight: "700" as const,
  },
  helperText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  seasonSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  seasonButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
    borderWidth: 2,
    borderColor: "transparent",
  },
  seasonButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  seasonEmoji: {
    fontSize: 16,
  },
  seasonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: COLORS.text,
  },
  seasonTextActive: {
    color: "#FFF",
  },
  otherColorSwatch: {
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: "dashed" as const,
    alignItems: "center",
    justifyContent: "center",
  },
  otherColorText: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: COLORS.textSecondary,
  },
  imageErrorOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  imageErrorText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600" as const,
    marginTop: 8,
  },
  imageErrorSubtext: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 13,
  },
  addCustomColorButton: {
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  addCustomColorText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "600" as const,
  },
  selectedColorsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    flexWrap: "wrap",
  },
  selectedColorsLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: COLORS.text,
    marginRight: 8,
  },
  selectedColorsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    flex: 1,
  },
  selectedColorChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  selectedColorText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "600" as const,
  },
  removeColorText: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "700" as const,
    lineHeight: 20,
  },
  subtypeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  subtypeButton: {
    width: "48%",
    backgroundColor: COLORS.surface,
    padding: 10,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 2,
    borderColor: "transparent",
  },
  subtypeButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  subtypeEmoji: {
    fontSize: 24,
  },
  subtypeLabel: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: COLORS.text,
  },
  subtypeLabelActive: {
    color: "#FFF",
  },
  identifyButton: {
    backgroundColor: COLORS.primary,
    marginHorizontal: 20,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  identifyButtonText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "600" as const,
  },
  outfitStylesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  outfitStyleButton: {
    width: "48%",
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 2,
    borderColor: "transparent",
  },
  outfitStyleButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  outfitStyleEmoji: {
    fontSize: 20,
  },
  outfitStyleText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: COLORS.text,
    flex: 1,
  },
  outfitStyleTextActive: {
    color: "#FFF",
  },
  lastWornContainer: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    gap: 6,
  },
  lastWornText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: COLORS.text,
  },
  timesWornText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  photoTipsCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 20,
    marginTop: 12,
    padding: 14,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  photoTipsTitle: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: COLORS.text,
    marginBottom: 8,
  },
  photoTipsText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  accuracyRatingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  accuracyRatingCard: {
    backgroundColor: COLORS.background,
    borderRadius: 24,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  accuracyRatingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  accuracyRatingTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: COLORS.text,
    marginBottom: 4,
  },
  accuracyRatingSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  accuracyCloseButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -8,
    marginRight: -8,
  },
  starsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: 16,
  },
  starButton: {
    padding: 4,
  },
  ratingLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  ratingLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "600" as const,
  },
  feedbackMessage: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: "center",
  },
  feedbackMessageText: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: "600" as const,
    textAlign: "center",
  },
  accuracyDoneButton: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  accuracyDoneButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700" as const,
  },
  matchingSetContainer: {
    flexDirection: "row",
    gap: 12,
  },
  matchingSetButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  matchingSetButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  matchingSetButtonText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: COLORS.text,
  },
  matchingSetButtonTextActive: {
    color: "#FFF",
  },
  fitButtonsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  fitButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: "transparent",
  },
  fitButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  fitButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: COLORS.text,
  },
  fitButtonTextActive: {
    color: "#FFF",
  },
  imageSelectorOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  imageSelectorModal: {
    backgroundColor: COLORS.background,
    borderRadius: 20,
    width: "100%",
    maxHeight: "90%",
    overflow: "hidden",
  },
  imageSelectorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  imageSelectorTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: COLORS.text,
  },
  imageSelectorSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  imageSelectorClose: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  imageSelectorCloseText: {
    fontSize: 24,
    color: COLORS.textSecondary,
    fontWeight: "400" as const,
  },
  imageSelectorScroll: {
    maxHeight: 500,
  },
  imageSelectorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 16,
    gap: 12,
  },
  imageSelectorOption: {
    width: "48%",
    aspectRatio: 1,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "transparent",
    position: "relative",
  },
  imageSelectorOptionSelected: {
    borderColor: COLORS.primary,
  },
  imageSelectorImage: {
    width: "100%",
    height: "100%",
  },
  imageSelectorCheckmark: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  imageSelectorCheckmarkText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700" as const,
  },
  showAlternativesButton: {
    position: "absolute",
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: "center",
  },
  showAlternativesText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "600" as const,
  },
  alternativesOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  alternativesModal: {
    backgroundColor: COLORS.background,
    borderRadius: 20,
    width: "100%",
    maxHeight: "85%",
    overflow: "hidden",
  },
  alternativesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  alternativesTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: COLORS.text,
  },
  alternativesSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  alternativesClose: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  alternativesCloseText: {
    fontSize: 24,
    color: COLORS.textSecondary,
    fontWeight: "400" as const,
  },
  alternativesScroll: {
    maxHeight: 450,
  },
  alternativeItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  alternativeInfo: {
    flex: 1,
  },
  alternativeBrand: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: COLORS.primary,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  alternativeModel: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: COLORS.text,
    marginTop: 4,
  },
  alternativeColorway: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  alternativeSku: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
    fontFamily: "monospace",
  },
  alternativeDetails: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 10,
  },
  alternativePrice: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: COLORS.success || "#22C55E",
  },
  alternativeConfidence: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: COLORS.surface,
  },
  confidenceHigh: {
    backgroundColor: "rgba(34, 197, 94, 0.2)",
  },
  confidenceMedium: {
    backgroundColor: "rgba(234, 179, 8, 0.2)",
  },
  confidenceLow: {
    backgroundColor: "rgba(239, 68, 68, 0.2)",
  },
  alternativeConfidenceText: {
    fontSize: 10,
    fontWeight: "700" as const,
    color: COLORS.text,
  },
  alternativeArrow: {
    fontSize: 20,
    color: COLORS.primary,
    marginLeft: 12,
  },
  imagesScrollView: {
    marginHorizontal: 20,
  },
  imagesScrollContent: {
    gap: 12,
    paddingRight: 20,
  },
  imagePreviewCard: {
    width: 200,
    height: 200,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
    backgroundColor: COLORS.surface,
  },
  multiImage: {
    width: "100%",
    height: "100%",
  },
  imageErrorSmallText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600" as const,
    marginTop: 4,
  },
  removeImageBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(220, 38, 38, 0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  removeImageBadgeText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700" as const,
    lineHeight: 18,
  },
  primaryImageBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
  primaryImageText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "700" as const,
    letterSpacing: 0.5,
  },
  addMoreImageCard: {
    width: 200,
    height: 200,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: "dashed" as const,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  addMoreImageText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: COLORS.primary,
  },
  addMoreImageSubtext: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});
