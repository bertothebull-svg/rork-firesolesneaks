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
  const [imageUri, setImageUri] = useState("");
  const [imageError, setImageError] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSeasons, setSelectedSeasons] = useState<Season[]>([]);
  const [showCustomColorInput, setShowCustomColorInput] = useState(false);
  const [showCustomAccentColorInput, setShowCustomAccentColorInput] = useState(false);
  const [subtype, setSubtype] = useState<TopSubtype | BottomSubtype | undefined>(undefined);
  const [isIdentifyingShoe, setIsIdentifyingShoe] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [selectedOutfitStyles, setSelectedOutfitStyles] = useState<OutfitStyle[]>([]);
  const [showAccuracyRating, setShowAccuracyRating] = useState(false);
  const [lastIdentificationData, setLastIdentificationData] = useState<{
    type: 'photo' | 'name';
    input: string;
    output: any;
  } | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);

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

  const clothingSizes = ["XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL"];
  const bottomsSizes = ["28", "30", "32", "34", "36", "38", "XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL"];
  const hatSizes = ["6.5", "6.75", "7", "7.125", "7.25", "7.375", "7.5", "7.625", "7.75", "7.875", "8"];

  useFocusEffect(
    useReactCallback(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });

      if (editingItem) {
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
        setImageUri(editingItem.imageUrl);
        setSelectedSeasons(editingItem.seasons || []);
        setSubtype(editingItem.subtype);
        setSelectedOutfitStyles(editingItem.outfitStyles || []);
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
        setImageUri("");
        setImageError(false);
        setSelectedSeasons([]);
        setSubtype(undefined);
        setSelectedOutfitStyles([]);
      }
    }, [editingItem, params.category])
  );



  const searchRealImageMutation = useMutation({
    mutationFn: async (searchQuery: string) => {
      console.log("[Google Image Search] Starting search for:", searchQuery);
      
      const apiKey = "AIzaSyDp5mxz65t5b83aNYSzs3-93K4D9gxwB-w";
      const cseId = "c486b626b912943df";
      
      const prioritySites = [
        "stockx.com",
        "goat.com",
        "flightclub.com",
        "stadiumgoods.com",
        "sneakernews.com",
        "nike.com",
        "adidas.com",
        "newbalance.com"
      ];
      
      const siteRestriction = prioritySites.map(site => `site:${site}`).join(" OR ");
      const refinedQuery = `${searchQuery} sneaker product image (${siteRestriction})`;
      
      const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cseId}&q=${encodeURIComponent(refinedQuery)}&searchType=image&num=10&imgSize=large&imgType=photo&safe=off`;
      
      console.log("[Google Image Search] Refined query:", refinedQuery);
      console.log("[Google Image Search] Fetching from Google Custom Search API...");
      
      try {
        const response = await fetch(searchUrl);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("[Google Image Search] API Error:", response.status, errorText);
          
          if (response.status === 429) {
            throw new Error("Search rate limit exceeded. Please try again in a few minutes.");
          }
          throw new Error(`Google API error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("[Google Image Search] Received", data.items?.length || 0, "results");
        
        if (!data.items || data.items.length === 0) {
          console.log("[Google Image Search] No results with site restriction, trying broader search");
          
          const searches = [
            `${searchQuery} official product image`,
            `${searchQuery} sneaker stockx`,
            `${searchQuery} sneaker goat`,
            `${searchQuery} product photo`
          ];
          
          for (const query of searches) {
            console.log("[Google Image Search] Trying fallback:", query);
            const fallbackUrl = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cseId}&q=${encodeURIComponent(query)}&searchType=image&num=5&imgSize=large&imgType=photo`;
            const fallbackResponse = await fetch(fallbackUrl);
            
            if (fallbackResponse.ok) {
              const fallbackData = await fallbackResponse.json();
              if (fallbackData.items && fallbackData.items.length > 0) {
                console.log("[Google Image Search] Found", fallbackData.items.length, "results with fallback:", query);
                return fallbackData.items[0].link;
              }
            }
            
            await new Promise(resolve => setTimeout(resolve, 500));
          }
          
          throw new Error("No images found for this sneaker");
        }
        
        for (const item of data.items) {
          const imageUrl = item.link;
          const pageUrl = item.image?.contextLink || "";
          console.log("[Google Image Search] Testing image from:", pageUrl);
          console.log("[Google Image Search] Image URL:", imageUrl?.substring(0, 100));
          
          if (!imageUrl) continue;
          
          try {
            const testResponse = await fetch(imageUrl, { method: 'HEAD', timeout: 5000 } as any);
            if (testResponse.ok) {
              const contentType = testResponse.headers.get('content-type');
              if (contentType && contentType.startsWith('image/')) {
                console.log("[Google Image Search] Found working image from:", pageUrl);
                return imageUrl;
              }
            }
          } catch (e) {
            console.log("[Google Image Search] Image validation failed:", e);
            continue;
          }
        }
        
        if (data.items[0]?.link) {
          console.log("[Google Image Search] Using first result without validation");
          return data.items[0].link;
        }
        
        throw new Error("No accessible images found");
      } catch (error) {
        console.error("[Google Image Search] Error:", error);
        throw error;
      }
    },
  });

  const sneakerSearchMutation = useMutation({
    mutationFn: async (sneakerName: string) => {
      console.log("[Sneaker Search] Starting search for:", sneakerName);
      
      const feedbackContext = getImprovementContext("item_identification");
      console.log("[Sneaker Search] Using feedback context:", feedbackContext);
      
      const searchPrompt = `You are an elite sneaker identification expert with comprehensive knowledge of GOAT, StockX, Poison, SneakerFreaker, and NYKL databases.

${feedbackContext ? feedbackContext + "\n" : ""}SEARCH QUERY: "${sneakerName}"

YOUR MISSION:
1. Find the EXACT shoe model with 100% accuracy
2. Use complete, official product names EXACTLY as they appear on GOAT.com and StockX.com
3. Match the official SKU/Style Code whenever possible (THIS IS CRITICAL FOR IMAGE SEARCH)
4. Include all relevant colorway details with official names
5. Provide accurate market pricing data
6. Create the MOST SPECIFIC search query possible for finding the exact shoe image

CRITICAL: The imageSearchQuery MUST include:
- Full official brand name (Nike, Air Jordan, Adidas, etc.)
- Complete model name with all details
- Official colorway name (not generic colors)
- SKU/Style Code if identifiable
- Year if it helps distinguish between releases

EXPANDED SEARCH STRATEGY:
- Check abbreviations against full official names (e.g., "bred 11" = "Air Jordan 11 Retro 'Bred'")
- Identify regional vs global releases
- Match nicknames to official colorway names
- Cross-reference multiple sources for accuracy
- Include collaboration details if applicable (e.g., Off-White, Travis Scott)

REFERENCE SOURCES PRIORITY:
1. GOAT.com - Primary for authentication and official names
2. StockX.com - Market pricing and SKU verification
3. Poison.com - International releases and rare colorways
4. SneakerFreaker.com - Detailed specifications and history
5. NYKL.com - Additional market data and variants

KEY DETAILS TO IDENTIFY:
- Exact colorway (not just primary colors, but official names like "University Blue" not "blue")
- Style/SKU code (e.g., DV1748-400, 555088-134)
- Year and month of release
- Retail vs resale pricing
- Special editions, PE (Player Exclusive), or collaborations
- Material details (leather type, suede, mesh, etc.)
- Notable features (reflective, glow-in-dark, special laces, etc.)

EXAMPLES:
Input: "bred 11" → Brand: Air Jordan, Model: "Air Jordan 11 Retro 'Bred' 2019", SKU: 378037-061, Image Search: "Air Jordan 11 Bred 378037-061"
Input: "panda dunk" → Brand: Nike, Model: "Dunk Low 'Black White'", SKU: DD1391-100, Nickname: "Panda", Image Search: "Nike Dunk Low Black White DD1391-100"
Input: "travis scott jordan 1" → Brand: Air Jordan x Travis Scott, Model: "Air Jordan 1 Retro High OG 'Mocha'", SKU: CD4487-100, Image Search: "Travis Scott Air Jordan 1 Mocha CD4487-100"

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
  "sources": "which platforms were referenced (GOAT, StockX, etc.)"
}

IMPORTANT: 
- Be HIGHLY specific with colorway names
- ALWAYS include SKU if identifiable
- Use official marketplace terminology
- Distinguish between different years/versions of same colorway
- Provide EXACT search query for finding images
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

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const jsonString = jsonMatch[0].trim();
          console.log("[Sneaker Search] Attempting to parse:", jsonString);
          const data = JSON.parse(jsonString);
          console.log("[Sneaker Search] Parsed JSON:", data);
          return data;
        } catch (e) {
          console.error("[Sneaker Search] JSON parse error:", e);
          console.error("[Sneaker Search] Attempted to parse:", jsonMatch[0]);
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

    if (rating < 5) {
      Alert.alert(
        "Thanks for your feedback!",
        "We'll use this to improve future item identifications."
      );
    }
  };

  const handleSneakerSearch = async () => {
    if (!name.trim()) {
      Alert.alert("Enter Sneaker Name", "Please enter a sneaker name to search");
      return;
    }

    const feedbackContext = getImprovementContext("item_identification");
    console.log("[Sneaker Search] Feedback context:", feedbackContext);

    setIsSearching(true);
    try {
      const result = await sneakerSearchMutation.mutateAsync(name);
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

      let imageFound = false;
      if (result.imageSearchQuery) {
        console.log("[Sneaker Search] Fetching real image with query:", result.imageSearchQuery);
        
        const fallbackQueries = [
          result.imageSearchQuery,
          `${result.brand} ${result.model} ${result.styleCode || ""}`.trim(),
          `${result.brand} ${result.silhouette} ${result.colorway}`.trim(),
          `${result.brand} ${result.style || result.colorway}`.trim(),
        ].filter((q, i, arr) => arr.indexOf(q) === i);
        
        for (const query of fallbackQueries) {
          try {
            console.log("[Sneaker Search] Trying image query:", query);
            const imageUrl = await searchRealImageMutation.mutateAsync(query);
            console.log("[Sneaker Search] Got image URL:", imageUrl);
            setImageUri(imageUrl);
            setImageError(false);
            imageFound = true;
            break;
          } catch (imageError) {
            console.error("[Sneaker Search] Image query failed:", query, imageError);
            continue;
          }
        }
        
        if (!imageFound) {
          console.log("[Sneaker Search] Product image not found online");
        }
      }

      setLastIdentificationData({
        type: 'name',
        input: name,
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
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setImageError(false);
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
    setImageUri(uri);
    setImageError(false);
    setShowCamera(false);
  };

  const identifyShoeFromPhoto = async (retryCount = 0): Promise<boolean> => {
    if (!imageUri) {
      Alert.alert("No Photo", "Please take or select a photo first");
      return false;
    }

    setIsIdentifyingShoe(true);
    try {
      console.log("[Shoe Identification] Starting ENHANCED AI analysis... (Attempt " + (retryCount + 1) + "/3)");
      console.log("[Shoe Identification] Using two-stage identification for maximum accuracy");
      console.log("[Shoe Identification] Image URI type:", typeof imageUri);
      console.log("[Shoe Identification] Image URI length:", imageUri.length);

      let base64Image = imageUri;
      if (imageUri.startsWith('file://') || (!imageUri.startsWith('data:') && !imageUri.startsWith('http'))) {
        console.log("[Shoe Identification] Converting file URI to base64...");
        try {
          const response = await fetch(imageUri);
          const blob = await response.blob();
          const reader = new FileReader();
          base64Image = await new Promise<string>((resolve, reject) => {
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          console.log("[Shoe Identification] Converted to base64, length:", base64Image.length);
        } catch (convError) {
          console.error("[Shoe Identification] Error converting to base64:", convError);
          throw new Error("Failed to process image. Please try again with a different photo.");
        }
      }

      if (!base64Image.startsWith('data:image/')) {
        throw new Error("Invalid image format. Please use a JPEG or PNG image.");
      }

      if (retryCount > 0) {
        const waitTime = Math.min(2000 * Math.pow(2, retryCount - 1), 5000);
        console.log("[Shoe Identification] Waiting " + waitTime + "ms before retry...");
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }

      const feedbackContext = getImprovementContext("item_identification");
      console.log("[Shoe Identification] Feedback context:", feedbackContext);
      
      console.log("[Shoe Identification] Analyzing shoe with AI...");
      
      const prompt = `You are an elite sneaker authenticator with forensic-level expertise. Your task is to analyze this shoe image with EXTREME PRECISION, focusing on every visible detail that distinguishes this EXACT shoe from similar models.

${feedbackContext ? feedbackContext + "\n" : ""}

🎯 CRITICAL MISSION: Identify the EXACT colorway and variant, not just the general model.

⚠️ COMMON MISTAKES TO AVOID:
- Confusing similar colorways (e.g., "University Blue" vs "Powder Blue")
- Missing year-specific details (2015 release vs 2023 retro)
- Overlooking collaboration markers (Off-White, Travis Scott, Fragment)
- Not noticing material differences (leather vs suede vs patent)
- Ignoring small branding differences (Nike Air vs Jumpman)

🔬 FORENSIC ANALYSIS CHECKLIST:

1️⃣ BRAND IDENTIFICATION (Look at tongue, heel, insole, lace tags):
   - What logos are visible? Where exactly?
   - What text appears on tongue tags?
   - Any collaboration branding visible?

2️⃣ SILHOUETTE CONFIRMATION (Be extremely specific):
   - Exact model name (Air Jordan 1 HIGH vs MID vs LOW)
   - OG, Retro, Retro High OG, or other variant?
   - Special edition markers visible?

3️⃣ COLORWAY FORENSICS (THIS IS CRITICAL - BE PRECISE):
   - PANEL-BY-PANEL color analysis:
     * Toe box color and material
     * Side panel color and material  
     * Heel panel color and material
     * Swoosh/logo color and material
     * Collar/ankle area color
     * Sole color (multiple layers if visible)
   - Exact color names ("University Blue" not "light blue")
   - Color blocking pattern unique to this colorway
   - Any gradient, fade, or aged effects?

4️⃣ MATERIAL IDENTIFICATION:
   - Smooth leather, tumbled leather, or patent leather?
   - Suede, nubuck, or synthetic materials?
   - Mesh, canvas, or textured fabrics?
   - Material differences between panels

5️⃣ DISTINGUISHING FEATURES:
   - Stitching color (matches panels or contrasts?)
   - Visible SKU or text anywhere?
   - Special details: reflective, glow-in-dark, translucent
   - Unique lace colors or aglet (lace tip) details
   - Heel tab shape and markings

🎯 CRITICAL DETAILS:
6. Swoosh/Logo: Exact curve, thickness, material, placement on shoe
7. Midsole: Color, texture, visible tech (Air, Boost, Zoom, React)
8. Outsole: Tread pattern, color, herringbone vs other patterns
9. Tongue: Thickness, padding, tag style and text
10. Collar/Ankle: Height, padding, material
11. Toebox: Shape (boxy vs slim), perforations, panel overlays
12. Heel: Tab shape, logo placement, height, stability features
13. Lacing System: Eyelet count, lace type (flat/round), metal vs fabric
14. Special Features: Reflective elements, glow-in-dark, translucent materials, special textures
15. Branding Elements: Heel logos, tongue tags, insole prints, special text

📊 DATABASE CROSS-REFERENCE:
- GOAT.com: Official product names, authentication photos, market prices
- StockX.com: SKU verification, bid/ask prices, verified sales
- Poison.com: International releases, regional exclusives
- SneakerFreaker.com: Historical context, detailed specs, special editions
- NYKL.com: Additional market data, rare variants

🏷️ SKU/STYLE CODE IDENTIFICATION:
- Nike format: 6 digits + dash + 3 digits (e.g., 555088-134)
- Adidas format: Letters + numbers (e.g., GZ0541)
- New Balance format: Model + colorway code (e.g., 550BB)
- Visible on: size tag, box label, insole

💡 MATCHING STRATEGY:
1. Identify base silhouette with 100% certainty
2. Match exact colorway using specific color names from official releases
3. Verify with SKU if visible or deducible
4. Cross-check material types against known releases
5. Confirm special features against marketplace listings
6. Distinguish between OG, Retro, PE, and collaboration versions

⚠️ COMMON PITFALLS TO AVOID:
- Don't confuse Jordan 1 High with Mid (ankle collar height is key)
- Distinguish SB Dunk from regular Dunk (thicker tongue, Zoom Air)
- Specify exact year for popular colorways with multiple releases
- Use official colorway names not generic descriptions ("University Blue" not "light blue")
- Include collaboration details if applicable (Off-White, Travis Scott, etc.)

🎯 ACCURACY REQUIREMENTS:
- If you can see 3+ distinctive features that match a specific colorway → HIGH confidence
- If you can identify model but colorway is uncertain → MEDIUM confidence  
- If multiple colorways are possible → LOW confidence (and list why)

📝 REQUIRED JSON FORMAT:
{
  "brand": "exact official brand (Nike, Air Jordan, Adidas Yeezy, New Balance, etc.)",
  "model": "complete official product name as it appears on GOAT/StockX",
  "silhouette": "precise silhouette with height/type (Air Jordan 1 Retro High OG, Nike Dunk Low, etc.)",
  "colorway": "official colorway name - BE EXTREMELY SPECIFIC (e.g., 'University Blue' not 'blue', 'Bred' not 'black and red')",
  "style": "popular nickname or collaboration name",
  "name": "full combined product name",
  "commonName": "how it's listed on major marketplaces",
  "styleCode": "official SKU/Style Code if visible or deducible from unique features",
  "colors": ["all visible colors using EXACT names like 'University Blue', 'Sail', 'Crimson Tint'"],
  "mainColors": ["2-3 dominant colors with official names"],
  "accentColors": ["secondary/accent colors with official names"],
  "panelByPanelColors": "describe color of each visible panel: toe, side, heel, swoosh, collar, sole",
  "retailPrice": "original retail price USD (number only, best estimate)",
  "marketValue": "current average resale USD (number only, recent market data)",
  "releaseYear": "year of release if identifiable",
  "releaseDate": "specific date if identifiable (MM/DD/YYYY)",
  "materials": "detailed material breakdown by panel (be specific: smooth leather, tumbled leather, suede, etc.)",
  "materialDetails": "specific material types and textures observed on each section",
  "distinguishingFeatures": "CRITICAL: List 5+ unique identifiers that distinguish this EXACT colorway from similar ones",
  "specialFeatures": "reflective, glow, special laces, unique materials, collaboration markers",
  "confidence": "high (identified 5+ unique features), medium (identified model + likely colorway), low (model identified but colorway uncertain)",
  "confidenceReason": "explain WHY you gave this confidence rating and what details you used",
  "alternativePossibilities": "if not HIGH confidence, list other possible colorways and why",
  "searchQuery": "the MOST SPECIFIC search query to verify this shoe: Brand + Model + Colorway + Year + SKU if known",
  "description": "comprehensive technical description focusing on what makes this colorway unique"
}

🎯 CONFIDENCE LEVELS:
- HIGH: Can identify SKU, exact colorway match, all details align with known release
- MEDIUM: Strong silhouette and colorway match, missing SKU confirmation
- LOW: Base model identified but colorway/variant uncertain

RETURN ONLY THE JSON OBJECT. Be as specific and accurate as possible. Use official marketplace terminology.`;

      let aiResponse;
      try {
        aiResponse = await generateText({
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                { type: "image", image: base64Image }
              ]
            }
          ]
        });
      } catch (aiError) {
        console.error("[Shoe Identification] generateText error:", aiError);
        if (aiError instanceof Error) {
          console.error("[Shoe Identification] Error details:", {
            name: aiError.name,
            message: aiError.message,
            stack: aiError.stack?.substring(0, 300)
          });
        }
        throw new Error("AI service is temporarily unavailable. Please try again in a moment or enter details manually.");
      }

      console.log("[Shoe Identification] AI Response type:", typeof aiResponse);
      console.log("[Shoe Identification] AI Response length:", aiResponse?.length || 0);
      console.log("[Shoe Identification] AI Response preview:", aiResponse?.substring(0, 200));

      if (!aiResponse || typeof aiResponse !== 'string') {
        console.error("[Shoe Identification] Invalid AI response type:", typeof aiResponse);
        throw new Error("Invalid response from AI service. Please try again.");
      }

      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error("[Shoe Identification] No JSON found in response. Full response:", aiResponse.substring(0, 500));
        throw new Error("Could not analyze the shoe. Please try again or enter details manually.");
      }

      let result;
      try {
        const jsonString = jsonMatch[0];
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

      setLastIdentificationData({
        type: 'photo',
        input: base64Image.substring(0, 100),
        output: data
      });
      
      const confidenceEmoji = data.confidence === "high" ? "🎯" : data.confidence === "medium" ? "👍" : "🤔";
      let message = `${confidenceEmoji} Identified from Photo!\n\n${data.brand || "?"} ${data.model || "?"}\n\nReview the details below and adjust if needed.`;
      
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

    if (!imageUri) {
      Alert.alert("Required Field", "Please add an image");
      return;
    }

    if (imageError) {
      Alert.alert(
        "Image Error", 
        "The current image failed to load. Please choose a different image or take a new photo."
      );
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
      imageUrl: imageUri,
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
          <Text style={styles.sectionTitle}>Photo</Text>
          {imageUri ? (
            <View style={styles.imagePreview}>
              <Image 
                source={{ uri: imageUri }} 
                style={styles.image} 
                contentFit="cover"
                placeholder={require("../../assets/images/icon.png")}
                placeholderContentFit="contain"
                transition={300}
                cachePolicy="memory-disk"
                onError={(error) => {
                  console.error("[Image Error] Failed to load:", imageUri, error);
                  setImageError(true);
                }}
                onLoad={() => {
                  console.log("[Image Success] Loaded:", imageUri);
                  setImageError(false);
                }}
              />
              {imageError && (
                <View style={styles.imageErrorOverlay}>
                  <AlertCircle size={32} color="#FF6B6B" />
                  <Text style={styles.imageErrorText}>Image failed to load</Text>
                  <Text style={styles.imageErrorSubtext}>Try choosing a different photo</Text>
                </View>
              )}
              <View style={styles.imageOverlayButtons}>
                <TouchableOpacity style={styles.changeImageButton} onPress={pickImage}>
                  <Text style={styles.changeImageText}>Change</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.changeImageButton, styles.removeImageButton]} 
                  onPress={() => {
                    setImageUri("");
                    setImageError(false);
                  }}
                >
                  <Text style={styles.changeImageText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
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
          {category === "sneaker" && imageUri && !imageError && (
            <>
              <View style={styles.photoTipsCard}>
                <Text style={styles.photoTipsTitle}>📸 For Best Results:</Text>
                <Text style={styles.photoTipsText}>• Side profile view showing swoosh/logo</Text>
                <Text style={styles.photoTipsText}>• Clear, well-lit photo</Text>
                <Text style={styles.photoTipsText}>• Show heel area if possible</Text>
                <Text style={styles.photoTipsText}>• Include tongue tag or size label</Text>
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
                    <Text style={styles.identifyButtonText}>✨ Identify Shoe from Photo</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
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
                  onPress={handleSneakerSearch}
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
});
