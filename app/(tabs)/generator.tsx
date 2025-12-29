import { Image } from "expo-image";
import { Sparkles, RefreshCw, Heart, CloudRain, Lock, Unlock, X, Shirt, Share2, Mail, MessageSquare } from "lucide-react-native";
import { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  Dimensions,
  Switch,
  Share,
  Linking,
} from "react-native";
import { useMutation } from "@tanstack/react-query";
import { useWardrobe } from "../../contexts/WardrobeContext";
import { useWeather } from "../../contexts/WeatherContext";
import { useFeedback } from "../../contexts/FeedbackContext";
import { useUserProfile } from "../../contexts/UserProfileContext";
import { useCalendar } from "../../contexts/CalendarContext";
import RatingModal from "../../components/RatingModal";
import type { FeedbackEntry } from "../../types/feedback";
import { COLORS, OUTFIT_STYLES } from "../../constants/styles";
import type { OutfitStyle, SavedOutfit, WardrobeItem, CalendarOutfit } from "../../types/wardrobe";
import { generateText } from "@rork-ai/toolkit-sdk";

const { width } = Dimensions.get("window");
const ITEM_SIZE = (width - 64) / 2;

type MinDaysSinceWorn = 7 | 14 | 28 | 56;

export default function GeneratorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { sneakers, tops, bottoms, hats, socks, saveOutfit, isSavingOutfit, markItemsAsWorn, isMarkingWorn, getItemById } = useWardrobe();
  const { saveOutfitForDate } = useCalendar();
  const { weather, recommendedSeason } = useWeather();
  const { addFeedback, getImprovementContext, isAddingFeedback } = useFeedback();
  const { profile } = useUserProfile();
  const [selectedStyle, setSelectedStyle] = useState<OutfitStyle>("streetwear");
  const [includeHat, setIncludeHat] = useState(false);
  const [minDaysSinceWorn, setMinDaysSinceWorn] = useState<MinDaysSinceWorn>(7);
  const [useAirMaxMonth, setUseAirMaxMonth] = useState(false);
  const [useDunktober, setUseDunktober] = useState(false);
  const [generatedOutfitA, setGeneratedOutfitA] = useState<{
    sneakerId: string;
    topId: string;
    outerLayerId?: string;
    bottomId: string;
    hatId?: string;
    sockId?: string;
  } | null>(null);
  const [generatedOutfitB, setGeneratedOutfitB] = useState<{
    sneakerId: string;
    topId: string;
    outerLayerId?: string;
    bottomId: string;
    hatId?: string;
    sockId?: string;
  } | null>(null);
  const [generatedOutfitC, setGeneratedOutfitC] = useState<{
    sneakerId: string;
    topId: string;
    outerLayerId?: string;
    bottomId: string;
    hatId?: string;
    sockId?: string;
  } | null>(null);
  const [generatedOutfitD, setGeneratedOutfitD] = useState<{
    sneakerId: string;
    topId: string;
    outerLayerId?: string;
    bottomId: string;
    hatId?: string;
    sockId?: string;
  } | null>(null);
  const [selectedOutfit, setSelectedOutfit] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const generatedOutfit = selectedOutfit === 'A' ? generatedOutfitA : selectedOutfit === 'B' ? generatedOutfitB : selectedOutfit === 'C' ? generatedOutfitC : generatedOutfitD;
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [lockedItems, setLockedItems] = useState<{
    sneaker?: boolean;
    top?: boolean;
    outerLayer?: boolean;
    bottom?: boolean;
    hat?: boolean;
    sock?: boolean;
  }>({});

  const generateMutation = useMutation({
    mutationFn: async (params: { style: OutfitStyle; forceNew?: boolean; useOutfit?: 'A' | 'B' | 'C' | 'D'; excludeItems?: string[] }) => {
      const { style, forceNew, useOutfit, excludeItems = [] } = params;
      console.log("[Generate] Starting for style:", style);
      console.log("[Generate] Weather:", weather);
      console.log("[Generate] Recommended season:", recommendedSeason);
      console.log("[Generate] Locked items:", lockedItems);
      console.log("[Generate] Force new:", forceNew);
      console.log("[Generate] Use outfit:", useOutfit);
      console.log("[Generate] Exclude items:", excludeItems);

      if (sneakers.length === 0 || tops.length === 0 || bottoms.length === 0 || socks.length === 0) {
        throw new Error("Need at least one sneaker, top, bottom, and sock to generate outfits");
      }

      const filterByLastWorn = (items: WardrobeItem[]) => {
        const now = new Date();
        const minDaysMs = minDaysSinceWorn * 24 * 60 * 60 * 1000;
        
        return items.filter(item => {
          if (!item.dateLastWorn) return true;
          
          const lastWornDate = new Date(item.dateLastWorn);
          const daysSinceWorn = now.getTime() - lastWornDate.getTime();
          
          return daysSinceWorn >= minDaysMs;
        });
      };

      const filteredTops = filterByLastWorn(tops).filter(t => {
        const seasonMatch = !t.seasons || t.seasons.length === 0 || t.seasons.includes(recommendedSeason);
        const styleMatch = !t.outfitStyles || t.outfitStyles.length === 0 || t.outfitStyles.includes(style);
        const notExcluded = !excludeItems.includes(t.id);
        return seasonMatch && styleMatch && notExcluded;
      });
      const filteredBottoms = filterByLastWorn(bottoms).filter(b => {
        const seasonMatch = !b.seasons || b.seasons.length === 0 || b.seasons.includes(recommendedSeason);
        const styleMatch = !b.outfitStyles || b.outfitStyles.length === 0 || b.outfitStyles.includes(style);
        const notExcluded = !excludeItems.includes(b.id);
        return seasonMatch && styleMatch && notExcluded;
      });
      const filteredHats = filterByLastWorn(hats).filter(h => {
        const seasonMatch = !h.seasons || h.seasons.length === 0 || h.seasons.includes(recommendedSeason);
        const styleMatch = !h.outfitStyles || h.outfitStyles.length === 0 || h.outfitStyles.includes(style);
        const notExcluded = !excludeItems.includes(h.id);
        return seasonMatch && styleMatch && notExcluded;
      });
      const filteredSocks = filterByLastWorn(socks).filter(s => {
        const seasonMatch = !s.seasons || s.seasons.length === 0 || s.seasons.includes(recommendedSeason);
        const styleMatch = !s.outfitStyles || s.outfitStyles.length === 0 || s.outfitStyles.includes(style);
        const notExcluded = !excludeItems.includes(s.id);
        return seasonMatch && styleMatch && notExcluded;
      });

      let sneakersAvailable = filterByLastWorn(sneakers).filter(s => {
        const styleMatch = !s.outfitStyles || s.outfitStyles.length === 0 || s.outfitStyles.includes(style);
        const notExcluded = !excludeItems.includes(s.id);
        return styleMatch && notExcluded;
      });

      const currentMonth = new Date().getMonth() + 1;
      
      if (useAirMaxMonth && currentMonth === 3) {
        console.log("[Generate] Applying Air Max Month filter");
        const airMaxSneakers = sneakersAvailable.filter(s => 
          s.name.toLowerCase().includes('air max')
        );
        if (airMaxSneakers.length > 0) {
          sneakersAvailable = airMaxSneakers;
        } else {
          console.log("[Generate] No Air Max sneakers found, using all available sneakers");
        }
      }
      
      if (useDunktober && currentMonth === 10) {
        console.log("[Generate] Applying Dunktober filter");
        const dunkSneakers = sneakersAvailable.filter(s => 
          s.name.toLowerCase().includes('dunk')
        );
        if (dunkSneakers.length > 0) {
          sneakersAvailable = dunkSneakers;
        } else {
          console.log("[Generate] No Dunk sneakers found, using all available sneakers");
        }
      }
      const topsToUse = filteredTops.length > 0 ? filteredTops : tops;
      const bottomsToUse = filteredBottoms.length > 0 ? filteredBottoms : bottoms;
      const hatsToUse = filteredHats.length > 0 ? filteredHats : hats;
      const socksToUse = filteredSocks.length > 0 ? filteredSocks : socks;
      const sneakersToUse = sneakersAvailable.length > 0 ? sneakersAvailable : sneakers;

      let lockedSneaker = null;
      let lockedTop = null;
      let lockedOuterLayer = null;
      let lockedBottom = null;
      let lockedHat = null;
      let lockedSock = null;

      const currentOutfit = useOutfit === 'A' ? generatedOutfitA : useOutfit === 'B' ? generatedOutfitB : useOutfit === 'C' ? generatedOutfitC : useOutfit === 'D' ? generatedOutfitD : generatedOutfit;
      
      if (currentOutfit && !forceNew) {
        if (lockedItems.sneaker) lockedSneaker = getItemById(currentOutfit.sneakerId);
        if (lockedItems.top) lockedTop = getItemById(currentOutfit.topId);
        if (lockedItems.outerLayer && currentOutfit.outerLayerId) lockedOuterLayer = getItemById(currentOutfit.outerLayerId);
        if (lockedItems.bottom) lockedBottom = getItemById(currentOutfit.bottomId);
        if (lockedItems.hat && currentOutfit.hatId) lockedHat = getItemById(currentOutfit.hatId);
        if (lockedItems.sock && currentOutfit.sockId) lockedSock = getItemById(currentOutfit.sockId);
      }

      const sneakersList = sneakersToUse.map((s, i) => {
        const colors = Array.isArray(s.colors) && s.colors.length > 0 ? s.colors.join(", ") : "no color";
        const brand = s.brand ? ` [Brand: ${s.brand}]` : "";
        return `${i}: ${s.name} (${colors})${brand}`;
      }).join("\n");
      const bottomsList = bottomsToUse.map((b, i) => {
        const colors = Array.isArray(b.colors) && b.colors.length > 0 ? b.colors.join(", ") : "no color";
        const subtype = b.subtype ? ` [${b.subtype}]` : "";
        const brand = b.brand ? ` [Brand: ${b.brand}]` : "";
        return `${i}: ${b.name} (${colors})${subtype}${brand}${b.seasons ? ` [${b.seasons.join(", ")}]` : ""}`;
      }).join("\n");
      const hatsList = hatsToUse.map((h, i) => {
        const colors = Array.isArray(h.colors) && h.colors.length > 0 ? h.colors.join(", ") : "no color";
        const brand = h.brand ? ` [Brand: ${h.brand}]` : "";
        return `${i}: ${h.name} (${colors})${brand}${h.seasons ? ` [${h.seasons.join(", ")}]` : ""}`;
      }).join("\n");
      const socksList = socksToUse.map((s, i) => {
        const colors = Array.isArray(s.colors) && s.colors.length > 0 ? s.colors.join(", ") : "no color";
        const brand = s.brand ? ` [Brand: ${s.brand}]` : "";
        return `${i}: ${s.name} (${colors})${brand}${s.seasons ? ` [${s.seasons.join(", ")}]` : ""}`;
      }).join("\n");

      const weatherContext = weather 
        ? `Current weather: ${weather.temperature}°F, ${weather.condition} in ${weather.location}. Recommended season: ${recommendedSeason}.`
        : `Current season: ${recommendedSeason}.`;

      const buildUserProfileContext = () => {
        const parts: string[] = [];
        
        if (profile.gender && profile.gender !== 'prefer-not-to-say') {
          parts.push(`Gender: ${profile.gender}`);
        }
        
        if (profile.bodyType) {
          const bodyTypeGuide: Record<string, string> = {
            athletic: 'athletic build - fitted styles work well, can pull off slim and tailored looks',
            slim: 'slim build - layering adds dimension, avoid overly baggy items',
            average: 'balanced proportions - versatile, most styles work well',
            muscular: 'muscular build - structured fits, avoid tight clothes, embrace comfort',
            curvy: 'curvy figure - embrace silhouettes that highlight shape, balanced proportions',
            'plus-size': 'plus-size - prioritize comfort and confidence, well-fitted pieces over baggy'
          };
          parts.push(`Body Type: ${profile.bodyType} (${bodyTypeGuide[profile.bodyType] || ''})`);;
        }
        
        if (profile.hairColor) {
          const hairColorGuide: Record<string, string> = {
            black: 'black hair - pairs well with bold colors, jewel tones, crisp whites',
            brown: 'brown hair - earth tones, warm colors, versatile with most palettes',
            blonde: 'blonde hair - pastels, navy, earth tones complement well',
            red: 'red hair - greens, blues, earth tones; avoid clashing reds',
            gray: 'gray/silver hair - jewel tones, black, white create striking contrast',
            white: 'white hair - bold colors pop beautifully, classic combinations work',
            other: 'unique hair color - consider complementary color theory'
          };
          parts.push(`Hair Color: ${profile.hairColor} (${hairColorGuide[profile.hairColor] || ''})`);;
        }
        
        if (profile.eyeColor) {
          const eyeColorGuide: Record<string, string> = {
            brown: 'brown eyes - warm tones, golds, greens bring out richness',
            blue: 'blue eyes - oranges, coppers, warm browns create contrast',
            green: 'green eyes - purples, burgundy, warm reds make them pop',
            hazel: 'hazel eyes - greens, golds, purples highlight golden flecks',
            gray: 'gray eyes - jewel tones, charcoal, silver enhance depth',
            amber: 'amber eyes - blues, greens, purples create beautiful contrast'
          };
          parts.push(`Eye Color: ${profile.eyeColor} (${eyeColorGuide[profile.eyeColor] || ''})`);;
        }
        
        if (profile.height && profile.heightUnit) {
          const heightCm = profile.heightUnit === 'ft' ? profile.height * 30.48 : profile.height;
          let heightGuidance = '';
          if (heightCm < 160) {
            heightGuidance = 'shorter stature - avoid overwhelming proportions, fitted items work well';
          } else if (heightCm < 175) {
            heightGuidance = 'average height - versatile proportions, most styles work';
          } else {
            heightGuidance = 'taller stature - can pull off longer layers, oversized styles';
          }
          parts.push(`Height: ${profile.height}${profile.heightUnit} (${heightGuidance})`);;
        }
        
        return parts.length > 0 ? `\n\nUSER PROFILE:\n${parts.join('\n')}` : '';
      };

      const userProfileContext = buildUserProfileContext();

      const feedbackContext = getImprovementContext("outfit_generation");

      const includeHatInPrompt = includeHat && hatsToUse.length > 0;
      
      let lockedContext = "";
      if (lockedSneaker) {
        const colors = Array.isArray(lockedSneaker.colors) && lockedSneaker.colors.length > 0 ? lockedSneaker.colors.join(", ") : "no color";
        lockedContext += `\n\nLOCKED SNEAKER (must use): ${lockedSneaker.name} (${colors})`;
      }
      if (lockedTop) {
        const colors = Array.isArray(lockedTop.colors) && lockedTop.colors.length > 0 ? lockedTop.colors.join(", ") : "no color";
        lockedContext += `\n\nLOCKED BASE LAYER (must use): ${lockedTop.name} (${colors})`;
      }
      if (lockedOuterLayer) {
        const colors = Array.isArray(lockedOuterLayer.colors) && lockedOuterLayer.colors.length > 0 ? lockedOuterLayer.colors.join(", ") : "no color";
        lockedContext += `\n\nLOCKED OUTER LAYER (must use): ${lockedOuterLayer.name} (${colors})`;
      }
      if (lockedBottom) {
        const colors = Array.isArray(lockedBottom.colors) && lockedBottom.colors.length > 0 ? lockedBottom.colors.join(", ") : "no color";
        lockedContext += `\n\nLOCKED BOTTOM (must use): ${lockedBottom.name} (${colors})`;
      }
      if (lockedHat) {
        const colors = Array.isArray(lockedHat.colors) && lockedHat.colors.length > 0 ? lockedHat.colors.join(", ") : "no color";
        lockedContext += `\n\nLOCKED HAT (must use): ${lockedHat.name} (${colors})`;
      }
      if (lockedSock) {
        const colors = Array.isArray(lockedSock.colors) && lockedSock.colors.length > 0 ? lockedSock.colors.join(", ") : "no color";
        lockedContext += `\n\nLOCKED SOCK (must use): ${lockedSock.name} (${colors})`;
      }
      
      const variationHint = useOutfit === 'B' ? "\n\nIMPORTANT: Create a DIFFERENT outfit variation. Try alternative color combinations, different item selections, or complementary pieces that offer variety while maintaining the style." : "";
      
      const getStyleGuidance = (style: OutfitStyle): string => {
        const guides: Record<OutfitStyle, string> = {
          streetwear: "Streetwear: Dominant force characterized by relaxed, casual pieces. Oversized hoodies, graphic tees, joggers or baggy jeans. Premium, often limited-edition sneakers serve as central statement piece. Mix high and low fashion. Bold colors and confident style. Think urban culture - modern edge with comfort.",
          minimalist: "Minimalist Wave / Quiet Luxury: Sleeker approach with clean, simple designs. Neutral color palettes dominate. Tailored pieces like trousers or blazers. Low-profile, refined sneakers (Adidas Samba, classic white leather). Mature and sophisticated look. Think less is more - quality over quantity.",
          gorpcore: "Gorpcore: Driven by outdoor pursuits. Technical, performance-oriented apparel. Cropped windbreakers, cargo pants, trail-running shoes (Salomon, Hoka). Functional, durable fabrics. Stylish, rugged aesthetic for everyday city wear. Think outdoor-meets-urban - practical with style.",
          retro: "Retro Throwback: Resurgence of '70s, '80s, and '90s fashion. Wide-leg or distressed denim, vintage graphic tees. Classic sneaker silhouettes (Nike Air Force 1, New Balance 574). Nostalgic yet current. Think throwback vibes - timeless classics reimagined.",
          sportyflex: "Sporty Flex: Athletic-inspired wear prioritizing movement and comfort. Track pants, cropped tops/jackets, performance sneakers. Easily transitions from active to casual social settings. Coordinated athletic brands. Think athleisure elevated - functional meets fashionable.",
          samebrand: "Same Brand: Create cohesive looks by using only items from the same brand. All Nike, all Adidas, or all from another brand. This creates a unified, sponsored-athlete aesthetic. Perfect for brand enthusiasts who want a coordinated, professional look. Think brand loyalty - head-to-toe coordination."
        };
        return guides[style];
      };
      
      const styleGuidance = getStyleGuidance(style);

      const baseLayerList = topsToUse.filter(t => 
        t.subtype === 'tshirt' || t.subtype === 'polo' || !t.subtype || t.subtype === 'buttondown'
      );
      const outerLayerList = topsToUse.filter(t => 
        t.subtype === 'sweatshirt' || t.subtype === 'outerwear'
      );

      const baseLayerListStr = baseLayerList.map((t, i) => {
        const colors = Array.isArray(t.colors) && t.colors.length > 0 ? t.colors.join(", ") : "no color";
        const subtype = t.subtype ? ` [${t.subtype}]` : "";
        const brand = t.brand ? ` [Brand: ${t.brand}]` : "";
        return `${i}: ${t.name} (${colors})${subtype}${brand}${t.seasons ? ` [${t.seasons.join(", ")}]` : ""}`;
      }).join("\n");

      const outerLayerListStr = outerLayerList.map((t, i) => {
        const colors = Array.isArray(t.colors) && t.colors.length > 0 ? t.colors.join(", ") : "no color";
        const subtype = t.subtype ? ` [${t.subtype}]` : "";
        const brand = t.brand ? ` [Brand: ${t.brand}]` : "";
        return `${i}: ${t.name} (${colors})${subtype}${brand}${t.seasons ? ` [${t.seasons.join(", ")}]` : ""}`;
      }).join("\n");

      const shouldIncludeOuterLayer = recommendedSeason === 'fall' || recommendedSeason === 'winter' || (weather && weather.temperature < 65);

      const prompt = includeHatInPrompt
        ? `You are a fashion stylist. Create a ${style} style outfit by selecting items from these lists.${variationHint}

${weatherContext}${userProfileContext}${lockedContext}

SNEAKERS (always include):
${sneakersList}

BASE LAYER TOPS (select ONE - t-shirts, polos, button-downs):
${baseLayerListStr}

OUTER LAYER TOPS (select ONE ONLY if weather is cool - sweatshirts, outerwear):
${outerLayerListStr}

BOTTOMS (select ONE):
${bottomsList}

HATS (select ONE if requested):
${hatsList}

SOCKS (always include ONE):
${socksList}

Respond with ONLY six numbers separated by commas in this format: sneaker_index,base_layer_index,outer_layer_index_or_-1_if_none,bottom_index,hat_index,sock_index
Example: 0,2,1,1,0,3 (with outer layer)
Example: 0,2,-1,1,0,3 (without outer layer)

Consider:
- Color coordination with ALL items (including locked ones)
- ${styleGuidance}
- Weather appropriateness (${recommendedSeason} season, ${weather?.temperature || 'N/A'}°F)
- Item season tags when available
- Hat should complement the overall outfit
- Socks should coordinate with sneakers and overall outfit colors
- Base layer: Select t-shirt, polo, or button-down as the foundation
- Outer layer: ${shouldIncludeOuterLayer ? 'REQUIRED - Select sweatshirt or outerwear due to cool weather' : 'Optional - Only add if weather/style demands it, otherwise use -1'}
- Layering: When using outer layer, ensure base layer colors work well underneath
- For bottoms: consider the activity level (jeans for casual, gym shorts for athletic, etc.)
- CRITICAL BRAND RULE: ${style === 'samebrand' ? 'SAME BRAND STYLE - ALL items must be from the same brand. If you select a Nike item, ALL other items must be Nike (or unbranded if no Nike option exists). Same for Adidas, New Balance, etc. This is MANDATORY for this style.' : 'Never mix Adidas and Nike items in the same outfit. If any item is Adidas, all other branded items must be Adidas or non-branded. Same applies for Nike.'}
${lockedContext ? "- IMPORTANT: Match new items to coordinate with the locked items above" : ""}

Prioritize items marked with the current season.${feedbackContext}`
        : `You are a fashion stylist. Create a ${style} style outfit by selecting items from these lists.${variationHint}

${weatherContext}${userProfileContext}${lockedContext}

SNEAKERS (always include):
${sneakersList}

BASE LAYER TOPS (select ONE - t-shirts, polos, button-downs):
${baseLayerListStr}

OUTER LAYER TOPS (select ONE ONLY if weather is cool - sweatshirts, outerwear):
${outerLayerListStr}

BOTTOMS (select ONE):
${bottomsList}

SOCKS (always include ONE):
${socksList}

Respond with ONLY five numbers separated by commas in this format: sneaker_index,base_layer_index,outer_layer_index_or_-1_if_none,bottom_index,sock_index
Example: 0,2,1,1,3 (with outer layer)
Example: 0,2,-1,1,3 (without outer layer)

Consider:
- Color coordination with ALL items (including locked ones)
- ${styleGuidance}
- Weather appropriateness (${recommendedSeason} season, ${weather?.temperature || 'N/A'}°F)
- Item season tags when available
- Socks should coordinate with sneakers and overall outfit colors
- Base layer: Select t-shirt, polo, or button-down as the foundation
- Outer layer: ${shouldIncludeOuterLayer ? 'REQUIRED - Select sweatshirt or outerwear due to cool weather' : 'Optional - Only add if weather/style demands it, otherwise use -1'}
- Layering: When using outer layer, ensure base layer colors work well underneath
- For bottoms: consider the activity level (jeans for casual, gym shorts for athletic, etc.)
- CRITICAL BRAND RULE: ${style === 'samebrand' ? 'SAME BRAND STYLE - ALL items must be from the same brand. If you select a Nike item, ALL other items must be Nike (or unbranded if no Nike option exists). Same for Adidas, New Balance, etc. This is MANDATORY for this style.' : 'Never mix Adidas and Nike items in the same outfit. If any item is Adidas, all other branded items must be Adidas or non-branded. Same applies for Nike.'}
${lockedContext ? "- IMPORTANT: Match new items to coordinate with the locked items above" : ""}

Prioritize items marked with the current season.${feedbackContext}`;

      const response = await generateText({
        messages: [{ role: "user", content: prompt }]
      });

      console.log("[Generate] AI response:", response);

      if (includeHatInPrompt) {
        const match = response.match(/(-?\d+),\s*(-?\d+),\s*(-?\d+),\s*(-?\d+),\s*(-?\d+),\s*(-?\d+)/);
        if (!match) {
          throw new Error("Invalid AI response format");
        }

        const sneakerIdx = Math.min(parseInt(match[1]), sneakersToUse.length - 1);
        const baseLayerIdx = Math.min(parseInt(match[2]), baseLayerList.length - 1);
        const outerLayerIdx = parseInt(match[3]);
        const bottomIdx = Math.min(parseInt(match[4]), bottomsToUse.length - 1);
        const hatIdx = Math.min(parseInt(match[5]), hatsToUse.length - 1);
        const sockIdx = Math.min(parseInt(match[6]), socksToUse.length - 1);

        return {
          sneakerId: lockedSneaker ? lockedSneaker.id : sneakersToUse[sneakerIdx].id,
          topId: lockedTop ? lockedTop.id : baseLayerList[baseLayerIdx].id,
          outerLayerId: lockedOuterLayer ? lockedOuterLayer.id : (outerLayerIdx >= 0 && outerLayerList.length > 0 ? outerLayerList[Math.min(outerLayerIdx, outerLayerList.length - 1)].id : undefined),
          bottomId: lockedBottom ? lockedBottom.id : bottomsToUse[bottomIdx].id,
          hatId: lockedHat ? lockedHat.id : hatsToUse[hatIdx].id,
          sockId: lockedSock ? lockedSock.id : socksToUse[sockIdx].id,
        };
      } else {
        const match = response.match(/(-?\d+),\s*(-?\d+),\s*(-?\d+),\s*(-?\d+),\s*(-?\d+)/);
        if (!match) {
          throw new Error("Invalid AI response format");
        }

        const sneakerIdx = Math.min(parseInt(match[1]), sneakersToUse.length - 1);
        const baseLayerIdx = Math.min(parseInt(match[2]), baseLayerList.length - 1);
        const outerLayerIdx = parseInt(match[3]);
        const bottomIdx = Math.min(parseInt(match[4]), bottomsToUse.length - 1);
        const sockIdx = Math.min(parseInt(match[5]), socksToUse.length - 1);

        return {
          sneakerId: lockedSneaker ? lockedSneaker.id : sneakersToUse[sneakerIdx].id,
          topId: lockedTop ? lockedTop.id : baseLayerList[baseLayerIdx].id,
          outerLayerId: lockedOuterLayer ? lockedOuterLayer.id : (outerLayerIdx >= 0 && outerLayerList.length > 0 ? outerLayerList[Math.min(outerLayerIdx, outerLayerList.length - 1)].id : undefined),
          bottomId: lockedBottom ? lockedBottom.id : bottomsToUse[bottomIdx].id,
          sockId: lockedSock ? lockedSock.id : socksToUse[sockIdx].id,
        };
      }
    },
    onError: (error) => {
      console.error("[Generate] Error:", error);
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to generate outfit");
    },
  });

  const handleGenerate = async () => {
    if (sneakers.length === 0 || tops.length === 0 || bottoms.length === 0 || socks.length === 0) {
      Alert.alert(
        "Not Enough Items", 
        "Add at least one sneaker, top, bottom, and sock to generate outfits"
      );
      return;
    }
    
    const generateAllOutfits = async () => {
      const outfitA = await generateMutation.mutateAsync({ 
        style: selectedStyle, 
        forceNew: true, 
        useOutfit: 'A' 
      });
      setGeneratedOutfitA(outfitA);
      
      const excludeItemsForB: string[] = [];
      if (tops.length > 1) excludeItemsForB.push(outfitA.topId);
      if (tops.length > 1 && outfitA.outerLayerId) excludeItemsForB.push(outfitA.outerLayerId);
      if (bottoms.length > 1) excludeItemsForB.push(outfitA.bottomId);
      if (sneakers.length > 1) excludeItemsForB.push(outfitA.sneakerId);
      if (socks.length > 1 && outfitA.sockId) excludeItemsForB.push(outfitA.sockId);
      if (hats.length > 1 && outfitA.hatId) excludeItemsForB.push(outfitA.hatId);
      
      const outfitB = await generateMutation.mutateAsync({ 
        style: selectedStyle, 
        forceNew: true, 
        useOutfit: 'B',
        excludeItems: excludeItemsForB
      });
      setGeneratedOutfitB(outfitB);
      
      const excludeItemsForC: string[] = [...excludeItemsForB];
      if (tops.length > 2) excludeItemsForC.push(outfitB.topId);
      if (tops.length > 2 && outfitB.outerLayerId) excludeItemsForC.push(outfitB.outerLayerId);
      if (bottoms.length > 2) excludeItemsForC.push(outfitB.bottomId);
      if (sneakers.length > 2) excludeItemsForC.push(outfitB.sneakerId);
      if (socks.length > 2 && outfitB.sockId) excludeItemsForC.push(outfitB.sockId);
      if (hats.length > 2 && outfitB.hatId) excludeItemsForC.push(outfitB.hatId);
      
      const outfitC = await generateMutation.mutateAsync({ 
        style: selectedStyle, 
        forceNew: true, 
        useOutfit: 'C',
        excludeItems: excludeItemsForC
      });
      setGeneratedOutfitC(outfitC);
      
      const excludeItemsForD: string[] = [...excludeItemsForC];
      if (tops.length > 3) excludeItemsForD.push(outfitC.topId);
      if (tops.length > 3 && outfitC.outerLayerId) excludeItemsForD.push(outfitC.outerLayerId);
      if (bottoms.length > 3) excludeItemsForD.push(outfitC.bottomId);
      if (sneakers.length > 3) excludeItemsForD.push(outfitC.sneakerId);
      if (socks.length > 3 && outfitC.sockId) excludeItemsForD.push(outfitC.sockId);
      if (hats.length > 3 && outfitC.hatId) excludeItemsForD.push(outfitC.hatId);
      
      const outfitD = await generateMutation.mutateAsync({ 
        style: selectedStyle, 
        forceNew: true, 
        useOutfit: 'D',
        excludeItems: excludeItemsForD
      });
      setGeneratedOutfitD(outfitD);
      
      setSelectedOutfit('A');
      
      setTimeout(() => {
        setShowRatingModal(true);
      }, 500);
    };
    
    generateAllOutfits().catch((error) => {
      console.error("[Generate] Error generating outfits:", error);
    });
  };

  const toggleLock = (category: "sneaker" | "top" | "outerLayer" | "bottom" | "hat" | "sock") => {
    setLockedItems(prev => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const removeItem = (category: "sneaker" | "top" | "outerLayer" | "bottom" | "hat" | "sock") => {
    if (!generatedOutfit) return;
    
    setLockedItems(prev => ({
      ...prev,
      [category]: false,
    }));

    if (category === "outerLayer") {
      if (selectedOutfit === 'A') {
        setGeneratedOutfitA(prev => prev ? { ...prev, outerLayerId: undefined } : null);
      } else if (selectedOutfit === 'B') {
        setGeneratedOutfitB(prev => prev ? { ...prev, outerLayerId: undefined } : null);
      } else if (selectedOutfit === 'C') {
        setGeneratedOutfitC(prev => prev ? { ...prev, outerLayerId: undefined } : null);
      } else {
        setGeneratedOutfitD(prev => prev ? { ...prev, outerLayerId: undefined } : null);
      }
    } else if (category === "hat") {
      if (selectedOutfit === 'A') {
        setGeneratedOutfitA(prev => prev ? { ...prev, hatId: undefined } : null);
      } else if (selectedOutfit === 'B') {
        setGeneratedOutfitB(prev => prev ? { ...prev, hatId: undefined } : null);
      } else if (selectedOutfit === 'C') {
        setGeneratedOutfitC(prev => prev ? { ...prev, hatId: undefined } : null);
      } else {
        setGeneratedOutfitD(prev => prev ? { ...prev, hatId: undefined } : null);
      }
      setIncludeHat(false);
    } else if (category === "sock") {
      if (selectedOutfit === 'A') {
        setGeneratedOutfitA(prev => prev ? { ...prev, sockId: undefined } : null);
      } else if (selectedOutfit === 'B') {
        setGeneratedOutfitB(prev => prev ? { ...prev, sockId: undefined } : null);
      } else if (selectedOutfit === 'C') {
        setGeneratedOutfitC(prev => prev ? { ...prev, sockId: undefined } : null);
      } else {
        setGeneratedOutfitD(prev => prev ? { ...prev, sockId: undefined } : null);
      }
    }
  };

  const handleWearOutfit = () => {
    if (!generatedOutfit) return;

    const itemIds = [
      generatedOutfit.sneakerId,
      generatedOutfit.topId,
      generatedOutfit.bottomId,
    ];

    if (generatedOutfit.outerLayerId) {
      itemIds.push(generatedOutfit.outerLayerId);
    }

    if (generatedOutfit.hatId) {
      itemIds.push(generatedOutfit.hatId);
    }

    if (generatedOutfit.sockId) {
      itemIds.push(generatedOutfit.sockId);
    }

    markItemsAsWorn(itemIds);

    const today = new Date().toISOString().split('T')[0];
    const calendarOutfit: CalendarOutfit = {
      id: Date.now().toString(),
      date: today,
      outfitId: Date.now().toString(),
      sneakerId: generatedOutfit.sneakerId,
      topId: generatedOutfit.topId,
      outerLayerId: generatedOutfit.outerLayerId,
      bottomId: generatedOutfit.bottomId,
      hatId: generatedOutfit.hatId,
      sockId: generatedOutfit.sockId,
      style: selectedStyle,
    };
    saveOutfitForDate(calendarOutfit);

    Alert.alert("Updated!", "Outfit saved to calendar and items marked as worn today");
  };

  const handleSave = () => {
    if (!generatedOutfit) return;

    const outfit: SavedOutfit = {
      id: Date.now().toString(),
      name: `${selectedStyle.charAt(0).toUpperCase() + selectedStyle.slice(1)} Look`,
      style: selectedStyle,
      sneakerId: generatedOutfit.sneakerId,
      topId: generatedOutfit.topId,
      outerLayerId: generatedOutfit.outerLayerId,
      bottomId: generatedOutfit.bottomId,
      hatId: generatedOutfit.hatId,
      sockId: generatedOutfit.sockId,
      dateCreated: new Date().toISOString(),
      aiGenerated: true,
    };

    saveOutfit(outfit);
    Alert.alert("Saved!", "Outfit saved to your collection");
  };

  const handleShare = async () => {
    if (!generatedOutfit) return;

    const outfitText = buildOutfitText();

    try {
      await Share.share({
        message: outfitText,
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const handleSendSMS = () => {
    if (!generatedOutfit) return;

    const outfitText = buildOutfitText();
    const smsUrl = `sms:?&body=${encodeURIComponent(outfitText)}`;

    Linking.openURL(smsUrl).catch((error) => {
      console.error("Error opening SMS:", error);
      Alert.alert("Error", "Could not open messaging app");
    });
  };

  const handleSendEmail = () => {
    if (!generatedOutfit) return;

    const outfitText = buildOutfitText();
    const subject = `${selectedStyle.charAt(0).toUpperCase() + selectedStyle.slice(1)} Outfit`;
    const emailUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(outfitText)}`;

    Linking.openURL(emailUrl).catch((error) => {
      console.error("Error opening email:", error);
      Alert.alert("Error", "Could not open email app");
    });
  };

  const buildOutfitText = () => {
    const items: string[] = [];

    items.push(`🎨 ${selectedStyle.charAt(0).toUpperCase() + selectedStyle.slice(1)} Style Outfit\n`);

    if (currentTop) {
      items.push(`👕 Base Layer: ${currentTop.name}`);
      if (currentTop.brand) items.push(`   Brand: ${currentTop.brand}`);
      if (currentTop.colors?.length > 0) items.push(`   Colors: ${currentTop.colors.join(", ")}`);
    }

    if (currentOuterLayer) {
      items.push(`\n🧥 Outer Layer: ${currentOuterLayer.name}`);
      if (currentOuterLayer.brand) items.push(`   Brand: ${currentOuterLayer.brand}`);
      if (currentOuterLayer.colors?.length > 0) items.push(`   Colors: ${currentOuterLayer.colors.join(", ")}`);
    }

    if (currentBottom) {
      items.push(`\n👖 Bottom: ${currentBottom.name}`);
      if (currentBottom.brand) items.push(`   Brand: ${currentBottom.brand}`);
      if (currentBottom.colors?.length > 0) items.push(`   Colors: ${currentBottom.colors.join(", ")}`);
    }

    if (currentSneaker) {
      items.push(`\n👟 Sneakers: ${currentSneaker.name}`);
      if (currentSneaker.brand) items.push(`   Brand: ${currentSneaker.brand}`);
      if (currentSneaker.colors?.length > 0) items.push(`   Colors: ${currentSneaker.colors.join(", ")}`);
    }

    if (currentSock) {
      items.push(`\n🧦 Socks: ${currentSock.name}`);
      if (currentSock.brand) items.push(`   Brand: ${currentSock.brand}`);
      if (currentSock.colors?.length > 0) items.push(`   Colors: ${currentSock.colors.join(", ")}`);
    }

    if (currentHat) {
      items.push(`\n🧢 Hat: ${currentHat.name}`);
      if (currentHat.brand) items.push(`   Brand: ${currentHat.brand}`);
      if (currentHat.colors?.length > 0) items.push(`   Colors: ${currentHat.colors.join(", ")}`);
    }

    if (weather) {
      items.push(`\n\n🌤️ Weather: ${weather.temperature}°F, ${weather.condition}`);
    }

    return items.join("\n");
  };

  const currentSneaker = generatedOutfit ? getItemById(generatedOutfit.sneakerId) : null;
  const currentTop = generatedOutfit ? getItemById(generatedOutfit.topId) : null;
  const currentOuterLayer = generatedOutfit?.outerLayerId ? getItemById(generatedOutfit.outerLayerId) : null;
  const currentBottom = generatedOutfit ? getItemById(generatedOutfit.bottomId) : null;
  const currentHat = generatedOutfit?.hatId ? getItemById(generatedOutfit.hatId) : null;
  const currentSock = generatedOutfit?.sockId ? getItemById(generatedOutfit.sockId) : null;

  const handleRatingSubmit = (rating: 1 | 2 | 3 | 4 | 5, comment?: string) => {
    if (!generatedOutfit) return;

    const feedbackEntry: FeedbackEntry = {
      id: Date.now().toString(),
      type: "outfit_generation",
      rating,
      timestamp: new Date().toISOString(),
      context: {
        style: selectedStyle,
        userComment: comment,
        itemsInvolved: [
          generatedOutfit.sneakerId,
          generatedOutfit.topId,
          generatedOutfit.bottomId,
          generatedOutfit.outerLayerId,
          generatedOutfit.hatId,
          generatedOutfit.sockId,
        ].filter(Boolean) as string[],
      },
    };

    console.log("[Feedback] Submitting outfit rating:", rating, comment || "(no comment)");
    addFeedback(feedbackEntry);
    setShowRatingModal(false);

    if (rating < 5) {
      Alert.alert(
        "Thanks for your feedback!",
        "We'll use this to improve future outfit suggestions."
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <View>
          <Text style={styles.title}>AI Outfit Generator</Text>
          <Text style={styles.subtitle}>Create perfect combinations</Text>
        </View>
        {weather && (
          <View style={styles.weatherBadge}>
            <CloudRain size={16} color={COLORS.text} />
            <Text style={styles.weatherText}>
              {weather.temperature}°F {weather.condition}
            </Text>
            <View style={styles.seasonBadge}>
              <Text style={styles.seasonBadgeText}>
                {recommendedSeason.charAt(0).toUpperCase() + recommendedSeason.slice(1)}
              </Text>
            </View>
          </View>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose Your Style</Text>
          <View style={styles.stylesGrid}>
            {OUTFIT_STYLES.map((style) => (
              <TouchableOpacity
                key={style.id}
                style={[
                  styles.styleCard,
                  selectedStyle === style.id && styles.styleCardActive,
                ]}
                onPress={() => setSelectedStyle(style.id)}
              >
                <Text style={styles.styleEmoji}>{style.emoji}</Text>
                <Text style={[
                  styles.styleLabel,
                  selectedStyle === style.id && styles.styleLabelActive,
                ]}>
                  {style.label}
                </Text>
                <Text style={styles.styleDescription} numberOfLines={2}>{style.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.settingsContainer}>
          {hats.length > 0 && (
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>🧢 Include Hat in Outfit</Text>
              <Switch
                value={includeHat}
                onValueChange={setIncludeHat}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor="#FFF"
              />
            </View>
          )}
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>🏀 Air Max Month (March)</Text>
            <Switch
              value={useAirMaxMonth}
              onValueChange={setUseAirMaxMonth}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor="#FFF"
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>🎃 Dunktober (October)</Text>
            <Switch
              value={useDunktober}
              onValueChange={setUseDunktober}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor="#FFF"
            />
          </View>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>⏰ Min. Days Before Re-use</Text>
            <View style={styles.daysPickerContainer}>
              {[7, 14, 28, 56].map((days) => (
                <TouchableOpacity
                  key={days}
                  style={[
                    styles.daysButton,
                    minDaysSinceWorn === days && styles.daysButtonActive,
                  ]}
                  onPress={() => setMinDaysSinceWorn(days as MinDaysSinceWorn)}
                >
                  <Text
                    style={[
                      styles.daysButtonText,
                      minDaysSinceWorn === days && styles.daysButtonTextActive,
                    ]}
                  >
                    {days === 7 ? '1w' : days === 14 ? '2w' : days === 28 ? '4w' : '8w'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.generateButton, generateMutation.isPending && styles.generateButtonDisabled]}
          onPress={handleGenerate}
          disabled={generateMutation.isPending}
        >
          {generateMutation.isPending ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Sparkles size={24} color="#FFF" />
              <Text style={styles.generateButtonText}>Generate Outfit</Text>
            </>
          )}
        </TouchableOpacity>

        {generatedOutfit && currentSneaker && currentTop && currentBottom && (
          <View style={styles.outfitContainer}>
            <View style={styles.abToggle}>
              <TouchableOpacity 
                style={[styles.abButton, selectedOutfit === 'A' && styles.abButtonActive]}
                onPress={() => setSelectedOutfit('A')}
              >
                <Text style={[styles.abButtonText, selectedOutfit === 'A' && styles.abButtonTextActive]}>A</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.abButton, selectedOutfit === 'B' && styles.abButtonActive]}
                onPress={() => setSelectedOutfit('B')}
              >
                <Text style={[styles.abButtonText, selectedOutfit === 'B' && styles.abButtonTextActive]}>B</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.abButton, selectedOutfit === 'C' && styles.abButtonActive]}
                onPress={() => setSelectedOutfit('C')}
              >
                <Text style={[styles.abButtonText, selectedOutfit === 'C' && styles.abButtonTextActive]}>C</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.abButton, selectedOutfit === 'D' && styles.abButtonActive]}
                onPress={() => setSelectedOutfit('D')}
              >
                <Text style={[styles.abButtonText, selectedOutfit === 'D' && styles.abButtonTextActive]}>D</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.outfitHeader}>
              <Text style={styles.outfitTitle}>Your Outfit</Text>
              <View style={styles.outfitActions}>
                <TouchableOpacity 
                  style={styles.actionButton} 
                  onPress={async () => {
                    const hasLockedItems = Object.values(lockedItems).some(locked => locked);
                    
                    if (hasLockedItems) {
                      const currentOutfit = selectedOutfit === 'A' ? generatedOutfitA : selectedOutfit === 'B' ? generatedOutfitB : selectedOutfit === 'C' ? generatedOutfitC : generatedOutfitD;
                      const excludeItemsForRegen: string[] = [];
                      
                      if (currentOutfit) {
                        if (!lockedItems.sneaker && currentOutfit.sneakerId) excludeItemsForRegen.push(currentOutfit.sneakerId);
                        if (!lockedItems.top && currentOutfit.topId) excludeItemsForRegen.push(currentOutfit.topId);
                        if (!lockedItems.outerLayer && currentOutfit.outerLayerId) excludeItemsForRegen.push(currentOutfit.outerLayerId);
                        if (!lockedItems.bottom && currentOutfit.bottomId) excludeItemsForRegen.push(currentOutfit.bottomId);
                        if (!lockedItems.sock && currentOutfit.sockId) excludeItemsForRegen.push(currentOutfit.sockId);
                        if (!lockedItems.hat && currentOutfit.hatId) excludeItemsForRegen.push(currentOutfit.hatId);
                      }
                      
                      const regeneratedOutfit = await generateMutation.mutateAsync({ 
                        style: selectedStyle, 
                        forceNew: false, 
                        useOutfit: selectedOutfit,
                        excludeItems: excludeItemsForRegen
                      });
                      
                      if (selectedOutfit === 'A') {
                        setGeneratedOutfitA(regeneratedOutfit);
                      } else if (selectedOutfit === 'B') {
                        setGeneratedOutfitB(regeneratedOutfit);
                      } else if (selectedOutfit === 'C') {
                        setGeneratedOutfitC(regeneratedOutfit);
                      } else {
                        setGeneratedOutfitD(regeneratedOutfit);
                      }
                    } else {
                      handleGenerate();
                    }
                  }}
                  disabled={generateMutation.isPending}
                >
                  {generateMutation.isPending ? (
                    <ActivityIndicator size="small" color={COLORS.text} />
                  ) : (
                    <RefreshCw size={20} color={COLORS.text} />
                  )}
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.saveActionButton]} 
                  onPress={handleSave}
                  disabled={isSavingOutfit}
                >
                  {isSavingOutfit ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Heart size={20} color="#FFF" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.outfitItems}>
              <TouchableOpacity 
                style={styles.outfitItem}
                onPress={() => router.push({ pathname: "/add" as any, params: { editId: currentTop.id as string } })}
                activeOpacity={0.7}
              >
                <View style={styles.outfitItemImageContainer}>
                  <Image 
                    source={{ uri: currentTop.imageUrl }} 
                    style={styles.outfitItemImage}
                    contentFit="cover"
                    placeholder={require("../../assets/images/icon.png")}
                    placeholderContentFit="contain"
                    transition={200}
                  />
                  <View style={styles.itemOverlayButtons}>
                    <TouchableOpacity 
                      style={[styles.overlayButton, lockedItems.top && styles.overlayButtonLocked]}
                      onPress={(e) => {
                        e.stopPropagation();
                        toggleLock("top");
                      }}
                    >
                      {lockedItems.top ? (
                        <Lock size={18} color="#FFF" />
                      ) : (
                        <Unlock size={18} color="#FFF" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.outfitItemLabel}>Base Layer</Text>
                <Text style={styles.outfitItemName} numberOfLines={2}>{currentTop.name}</Text>
              </TouchableOpacity>
              {currentOuterLayer && (
                <TouchableOpacity 
                  style={styles.outfitItem}
                  onPress={() => router.push({ pathname: "/add" as any, params: { editId: currentOuterLayer.id as string } })}
                  activeOpacity={0.7}
                >
                  <View style={styles.outfitItemImageContainer}>
                    <Image 
                      source={{ uri: currentOuterLayer.imageUrl }} 
                      style={styles.outfitItemImage}
                      contentFit="cover"
                      placeholder={require("../../assets/images/icon.png")}
                      placeholderContentFit="contain"
                      transition={200}
                    />
                    <View style={styles.itemOverlayButtons}>
                      <TouchableOpacity 
                        style={[styles.overlayButton, lockedItems.outerLayer && styles.overlayButtonLocked]}
                        onPress={(e) => {
                          e.stopPropagation();
                          toggleLock("outerLayer");
                        }}
                      >
                        {lockedItems.outerLayer ? (
                          <Lock size={18} color="#FFF" />
                        ) : (
                          <Unlock size={18} color="#FFF" />
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.overlayButton, styles.overlayButtonRemove]}
                        onPress={(e) => {
                          e.stopPropagation();
                          removeItem("outerLayer");
                        }}
                      >
                        <X size={18} color="#FFF" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Text style={styles.outfitItemLabel}>Outer Layer</Text>
                  <Text style={styles.outfitItemName} numberOfLines={2}>{currentOuterLayer.name}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={styles.outfitItem}
                onPress={() => router.push({ pathname: "/add" as any, params: { editId: currentBottom.id as string } })}
                activeOpacity={0.7}
              >
                <View style={styles.outfitItemImageContainer}>
                  <Image 
                    source={{ uri: currentBottom.imageUrl }} 
                    style={styles.outfitItemImage}
                    contentFit="cover"
                    placeholder={require("../../assets/images/icon.png")}
                    placeholderContentFit="contain"
                    transition={200}
                  />
                  <View style={styles.itemOverlayButtons}>
                    <TouchableOpacity 
                      style={[styles.overlayButton, lockedItems.bottom && styles.overlayButtonLocked]}
                      onPress={(e) => {
                        e.stopPropagation();
                        toggleLock("bottom");
                      }}
                    >
                      {lockedItems.bottom ? (
                        <Lock size={18} color="#FFF" />
                      ) : (
                        <Unlock size={18} color="#FFF" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.outfitItemLabel}>Bottom</Text>
                <Text style={styles.outfitItemName} numberOfLines={2}>{currentBottom.name}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.outfitItem}
                onPress={() => router.push({ pathname: "/add" as any, params: { editId: currentSneaker.id as string } })}
                activeOpacity={0.7}
              >
                <View style={styles.outfitItemImageContainer}>
                  <Image 
                    source={{ uri: currentSneaker.imageUrl }} 
                    style={styles.outfitItemImage}
                    contentFit="cover"
                    placeholder={require("../../assets/images/icon.png")}
                    placeholderContentFit="contain"
                    transition={200}
                  />
                  <View style={styles.itemOverlayButtons}>
                    <TouchableOpacity 
                      style={[styles.overlayButton, lockedItems.sneaker && styles.overlayButtonLocked]}
                      onPress={(e) => {
                        e.stopPropagation();
                        toggleLock("sneaker");
                      }}
                    >
                      {lockedItems.sneaker ? (
                        <Lock size={18} color="#FFF" />
                      ) : (
                        <Unlock size={18} color="#FFF" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.outfitItemLabel}>Sneaker</Text>
                <Text style={styles.outfitItemName} numberOfLines={2}>{currentSneaker.name}</Text>
              </TouchableOpacity>
              {currentSock && (
                <TouchableOpacity 
                  style={styles.outfitItem}
                  onPress={() => router.push({ pathname: "/add" as any, params: { editId: currentSock.id as string } })}
                  activeOpacity={0.7}
                >
                  <View style={styles.outfitItemImageContainer}>
                    <Image 
                      source={{ uri: currentSock.imageUrl }} 
                      style={styles.outfitItemImage}
                      contentFit="cover"
                      placeholder={require("../../assets/images/icon.png")}
                      placeholderContentFit="contain"
                      transition={200}
                    />
                    <View style={styles.itemOverlayButtons}>
                      <TouchableOpacity 
                        style={[styles.overlayButton, lockedItems.sock && styles.overlayButtonLocked]}
                        onPress={(e) => {
                          e.stopPropagation();
                          toggleLock("sock");
                        }}
                      >
                        {lockedItems.sock ? (
                          <Lock size={18} color="#FFF" />
                        ) : (
                          <Unlock size={18} color="#FFF" />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Text style={styles.outfitItemLabel}>Sock</Text>
                  <Text style={styles.outfitItemName} numberOfLines={2}>{currentSock.name}</Text>
                </TouchableOpacity>
              )}
              {currentHat && (
                <TouchableOpacity 
                  style={styles.outfitItem}
                  onPress={() => router.push({ pathname: "/add" as any, params: { editId: currentHat.id as string } })}
                  activeOpacity={0.7}
                >
                  <View style={styles.outfitItemImageContainer}>
                    <Image 
                      source={{ uri: currentHat.imageUrl }} 
                      style={styles.outfitItemImage}
                      contentFit="cover"
                      placeholder={require("../../assets/images/icon.png")}
                      placeholderContentFit="contain"
                      transition={200}
                    />
                    <View style={styles.itemOverlayButtons}>
                      <TouchableOpacity 
                        style={[styles.overlayButton, lockedItems.hat && styles.overlayButtonLocked]}
                        onPress={(e) => {
                          e.stopPropagation();
                          toggleLock("hat");
                        }}
                      >
                        {lockedItems.hat ? (
                          <Lock size={18} color="#FFF" />
                        ) : (
                          <Unlock size={18} color="#FFF" />
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.overlayButton, styles.overlayButtonRemove]}
                        onPress={(e) => {
                          e.stopPropagation();
                          removeItem("hat");
                        }}
                      >
                        <X size={18} color="#FFF" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Text style={styles.outfitItemLabel}>Hat</Text>
                  <Text style={styles.outfitItemName} numberOfLines={2}>{currentHat.name}</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity 
              style={[styles.wearButton, isMarkingWorn && styles.wearButtonDisabled]}
              onPress={handleWearOutfit}
              disabled={isMarkingWorn}
            >
              {isMarkingWorn ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Shirt size={20} color="#FFF" />
                  <Text style={styles.wearButtonText}>I&apos;m Wearing This Outfit Today</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.shareSection}>
              <Text style={styles.shareSectionTitle}>Share This Outfit</Text>
              <View style={styles.shareButtons}>
                <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                  <Share2 size={20} color={COLORS.primary} />
                  <Text style={styles.shareButtonText}>Share</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.shareButton} onPress={handleSendSMS}>
                  <MessageSquare size={20} color={COLORS.primary} />
                  <Text style={styles.shareButtonText}>Text</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.shareButton} onPress={handleSendEmail}>
                  <Mail size={20} color={COLORS.primary} />
                  <Text style={styles.shareButtonText}>Email</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <RatingModal
        visible={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        onSubmit={handleRatingSubmit}
        title="Rate This Outfit"
        description="How well do you like this outfit combination?"
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
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: COLORS.text,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  stylesGrid: {
    paddingHorizontal: 20,
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 10,
  },
  styleCard: {
    width: (width - 60) / 2,
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "transparent",
    alignItems: "center" as const,
  },
  styleCardActive: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.primary,
  },
  styleEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  styleLabel: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: COLORS.text,
    marginBottom: 4,
    textAlign: "center" as const,
  },
  styleLabelActive: {
    color: COLORS.primary,
  },
  styleDescription: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 15,
    textAlign: "center" as const,
  },
  generateButton: {
    backgroundColor: COLORS.primary,
    marginHorizontal: 20,
    padding: 14,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 24,
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateButtonText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "600" as const,
  },
  outfitContainer: {
    marginHorizontal: 20,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
  },
  outfitHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  outfitTitle: {
    fontSize: 17,
    fontWeight: "600" as const,
    color: COLORS.text,
  },
  outfitActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },
  saveActionButton: {
    backgroundColor: COLORS.secondary,
  },
  outfitItems: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  outfitItem: {
    width: ITEM_SIZE,
    alignItems: "center",
  },
  outfitItemImage: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    marginBottom: 6,
  },
  outfitItemLabel: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 8,
  },
  outfitItemName: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: COLORS.text,
    textAlign: "center",
    marginTop: 4,
    paddingHorizontal: 4,
  },
  outfitItemImageContainer: {
    position: "relative",
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    marginBottom: 8,
  },
  itemOverlayButtons: {
    position: "absolute",
    top: 8,
    right: 8,
    flexDirection: "row",
    gap: 6,
  },
  overlayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  overlayButtonLocked: {
    backgroundColor: COLORS.primary,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  overlayButtonRemove: {
    backgroundColor: COLORS.secondary,
  },
  weatherBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
    alignSelf: "flex-start",
  },
  weatherText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: COLORS.text,
  },
  seasonBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  seasonBadgeText: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: "#FFF",
    textTransform: "uppercase",
  },
  settingsContainer: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  settingRow: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: 12,
  },
  settingLabel: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: COLORS.text,
  },
  daysPickerContainer: {
    flexDirection: "row",
    gap: 8,
    alignSelf: "stretch",
  },
  daysButton: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    borderWidth: 2,
    borderColor: "transparent",
    minWidth: 48,
    alignItems: "center",
  },
  daysButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  daysButtonText: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: COLORS.textSecondary,
  },
  daysButtonTextActive: {
    color: "#FFF",
  },
  abToggle: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  abButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  abButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  abButtonText: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: COLORS.textSecondary,
  },
  abButtonTextActive: {
    color: "#FFF",
  },
  wearButton: {
    backgroundColor: COLORS.secondary,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  wearButtonDisabled: {
    opacity: 0.6,
  },
  wearButtonText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "700" as const,
  },
  shareSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  shareSectionTitle: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: COLORS.text,
    marginBottom: 12,
    textAlign: "center",
  },
  shareButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    gap: 12,
  },
  shareButton: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    gap: 8,
  },
  shareButtonText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: COLORS.text,
  },
});
