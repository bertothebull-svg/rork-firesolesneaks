import { Image } from "expo-image";
import { Heart, Trash2, Filter, X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useMemo } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  Dimensions,
} from "react-native";
import { useWardrobe } from "../../contexts/WardrobeContext";
import { COLORS } from "../../constants/styles";
import type { OutfitStyle } from "../../types/wardrobe";

const { width } = Dimensions.get("window");
const ITEM_SIZE = (width - 80) / 3;

export default function OutfitsScreen() {
  const insets = useSafeAreaInsets();
  const { outfits, items, deleteOutfit } = useWardrobe();
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStyles, setSelectedStyles] = useState<OutfitStyle[]>([]);
  const [showAIGenerated, setShowAIGenerated] = useState<boolean | null>(null);

  const filteredOutfits = useMemo(() => {
    let result = outfits;

    if (selectedStyles.length > 0) {
      result = result.filter(outfit => selectedStyles.includes(outfit.style));
    }

    if (showAIGenerated !== null) {
      result = result.filter(outfit => outfit.aiGenerated === showAIGenerated);
    }

    return result;
  }, [outfits, selectedStyles, showAIGenerated]);

  const availableStyles = useMemo(() => {
    const styleSet = new Set<OutfitStyle>();
    outfits.forEach(outfit => styleSet.add(outfit.style));
    return Array.from(styleSet).sort();
  }, [outfits]);

  const activeFiltersCount = selectedStyles.length + (showAIGenerated !== null ? 1 : 0);

  const clearAllFilters = () => {
    setSelectedStyles([]);
    setShowAIGenerated(null);
  };

  const toggleStyle = (style: OutfitStyle) => {
    setSelectedStyles(prev => 
      prev.includes(style) ? prev.filter(s => s !== style) : [...prev, style]
    );
  };

  const handleDelete = (outfitId: string, outfitName: string) => {
    Alert.alert(
      "Delete Outfit",
      `Are you sure you want to delete "${outfitName}"?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => deleteOutfit(outfitId),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Saved Outfits</Text>
          <Text style={styles.subtitle}>{outfits.length} combinations</Text>
        </View>
        {outfits.length > 0 && (
          <TouchableOpacity 
            style={[styles.filterButton, activeFiltersCount > 0 && styles.filterButtonActive]}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Filter size={18} color={activeFiltersCount > 0 ? "#FFF" : COLORS.text} />
            {activeFiltersCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {showFilters && outfits.length > 0 && (
          <View style={styles.filtersContainer}>
            <View style={styles.filtersHeader}>
              <Text style={styles.filtersTitle}>Filters</Text>
              {activeFiltersCount > 0 && (
                <TouchableOpacity onPress={clearAllFilters}>
                  <Text style={styles.clearFiltersText}>Clear All</Text>
                </TouchableOpacity>
              )}
            </View>

            {availableStyles.length > 0 && (
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Style</Text>
                <View style={styles.filterChips}>
                  {availableStyles.map(style => (
                    <TouchableOpacity
                      key={style}
                      style={[
                        styles.filterChip,
                        selectedStyles.includes(style) && styles.filterChipActive
                      ]}
                      onPress={() => toggleStyle(style)}
                    >
                      <Text style={[
                        styles.filterChipText,
                        selectedStyles.includes(style) && styles.filterChipTextActive
                      ]}>
                        {style}
                      </Text>
                      {selectedStyles.includes(style) && (
                        <X size={14} color="#FFF" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Type</Text>
              <View style={styles.filterChips}>
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    showAIGenerated === true && styles.filterChipActive
                  ]}
                  onPress={() => setShowAIGenerated(showAIGenerated === true ? null : true)}
                >
                  <Text style={[
                    styles.filterChipText,
                    showAIGenerated === true && styles.filterChipTextActive
                  ]}>
                    ✨ AI Generated
                  </Text>
                  {showAIGenerated === true && (
                    <X size={14} color="#FFF" />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    showAIGenerated === false && styles.filterChipActive
                  ]}
                  onPress={() => setShowAIGenerated(showAIGenerated === false ? null : false)}
                >
                  <Text style={[
                    styles.filterChipText,
                    showAIGenerated === false && styles.filterChipTextActive
                  ]}>
                    Manual
                  </Text>
                  {showAIGenerated === false && (
                    <X size={14} color="#FFF" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {filteredOutfits.length === 0 && outfits.length > 0 ? (
          <View style={styles.emptyState}>
            <Filter size={64} color={COLORS.border} />
            <Text style={styles.emptyTitle}>No matching outfits</Text>
            <Text style={styles.emptySubtitle}>
              Try adjusting your filters to see more outfits
            </Text>
          </View>
        ) : outfits.length === 0 ? (
          <View style={styles.emptyState}>
            <Heart size={64} color={COLORS.border} />
            <Text style={styles.emptyTitle}>No saved outfits</Text>
            <Text style={styles.emptySubtitle}>
              Use the AI Generator to create and save your perfect outfits
            </Text>
          </View>
        ) : (
          <View style={styles.outfitsList}>
            {filteredOutfits.map((outfit) => {
              const sneaker = items.find(i => i.id === outfit.sneakerId);
              const top = items.find(i => i.id === outfit.topId);
              const bottom = items.find(i => i.id === outfit.bottomId);

              if (!sneaker || !top || !bottom) return null;

              return (
                <View key={outfit.id} style={styles.outfitCard}>
                  <View style={styles.outfitCardHeader}>
                    <View>
                      <Text style={styles.outfitName}>{outfit.name}</Text>
                      <Text style={styles.outfitStyle}>{outfit.style}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDelete(outfit.id, outfit.name)}
                    >
                      <Trash2 size={20} color={COLORS.error} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.outfitItems}>
                    <View style={styles.outfitItem}>
                      <Image 
                        source={{ uri: top.imageUrl }} 
                        style={styles.outfitItemImage}
                        contentFit="cover"
                        placeholder={require("../../assets/images/icon.png")}
                        placeholderContentFit="contain"
                        transition={200}
                      />
                      <Text style={styles.outfitItemLabel}>Top</Text>
                    </View>
                    <View style={styles.outfitItem}>
                      <Image 
                        source={{ uri: bottom.imageUrl }} 
                        style={styles.outfitItemImage}
                        contentFit="cover"
                        placeholder={require("../../assets/images/icon.png")}
                        placeholderContentFit="contain"
                        transition={200}
                      />
                      <Text style={styles.outfitItemLabel}>Bottom</Text>
                    </View>
                    <View style={styles.outfitItem}>
                      <Image 
                        source={{ uri: sneaker.imageUrl }} 
                        style={styles.outfitItemImage}
                        contentFit="cover"
                        placeholder={require("../../assets/images/icon.png")}
                        placeholderContentFit="contain"
                        transition={200}
                      />
                      <Text style={styles.outfitItemLabel}>Sneaker</Text>
                    </View>
                  </View>

                  {outfit.aiGenerated && (
                    <View style={styles.aiBadge}>
                      <Text style={styles.aiBadgeText}>✨ AI Generated</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
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
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: COLORS.text,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 22,
  },
  outfitsList: {
    paddingHorizontal: 20,
    gap: 16,
  },
  outfitCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
  },
  outfitCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  outfitName: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: COLORS.text,
  },
  outfitStyle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textTransform: "capitalize",
    marginTop: 1,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  outfitItems: {
    flexDirection: "row",
    gap: 12,
  },
  outfitItem: {
    flex: 1,
    alignItems: "center",
  },
  outfitItemImage: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    marginBottom: 4,
  },
  outfitItemLabel: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  aiBadge: {
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  aiBadgeText: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: COLORS.text,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    position: "relative" as const,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterBadge: {
    position: "absolute" as const,
    top: -4,
    right: -4,
    backgroundColor: COLORS.secondary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: "#FFF",
  },
  filtersContainer: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    padding: 12,
  },
  filtersHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  filtersTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: COLORS.text,
  },
  clearFiltersText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: COLORS.primary,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterSectionTitle: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: COLORS.textSecondary,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  filterChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: COLORS.text,
    textTransform: "capitalize" as const,
  },
  filterChipTextActive: {
    color: "#FFF",
  },
});
