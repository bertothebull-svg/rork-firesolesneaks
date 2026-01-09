import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Shirt, Package, Sparkles, Trash2, Edit, Plus, Trash, Filter, X, Grid3X3, List, Calendar, ChevronDown, ChevronRight } from "lucide-react-native";
import { useState, useMemo } from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Dimensions, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useWardrobe, useWardrobeStats } from "../../contexts/WardrobeContext";
import { COLORS } from "../../constants/styles";
import type { ItemCategory, OutfitStyle, Season } from "../../types/wardrobe";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 56) / 3;

export default function WardrobeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { items, sneakers, tops, bottoms, hats, deleteItem, deleteAllItems } = useWardrobe();
  const stats = useWardrobeStats();
  const [selectedCategory, setSelectedCategory] = useState<"all" | ItemCategory>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedSubtypes, setSelectedSubtypes] = useState<string[]>([]);
  const [selectedSeasons, setSelectedSeasons] = useState<Season[]>([]);
  const [selectedStyles, setSelectedStyles] = useState<OutfitStyle[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [expandedBrands, setExpandedBrands] = useState<Set<string>>(new Set());
  const [expandedSubcategories, setExpandedSubcategories] = useState<Set<string>>(new Set());

  const filteredItems = useMemo(() => {
    let result = selectedCategory === "all" ? items : items.filter(item => item.category === selectedCategory);

    if (selectedBrands.length > 0) {
      result = result.filter(item => 
        item.brand && selectedBrands.includes(item.brand)
      );
    }

    if (selectedSubtypes.length > 0) {
      result = result.filter(item => 
        item.subtype && selectedSubtypes.includes(item.subtype)
      );
    }

    if (selectedSeasons.length > 0) {
      result = result.filter(item => 
        item.seasons && item.seasons.some(season => selectedSeasons.includes(season))
      );
    }

    if (selectedStyles.length > 0) {
      result = result.filter(item => 
        item.outfitStyles && item.outfitStyles.some(style => selectedStyles.includes(style))
      );
    }

    return result;
  }, [items, selectedCategory, selectedBrands, selectedSubtypes, selectedSeasons, selectedStyles]);

  const availableBrands = useMemo(() => {
    const brandSet = new Set<string>();
    const categoryItems = selectedCategory === "all" ? items : items.filter(item => item.category === selectedCategory);
    categoryItems.forEach(item => {
      if (item.brand) brandSet.add(item.brand);
    });
    return Array.from(brandSet).sort();
  }, [items, selectedCategory]);

  const availableSubtypes = useMemo(() => {
    const subtypeSet = new Set<string>();
    const categoryItems = selectedCategory === "all" ? items : items.filter(item => item.category === selectedCategory);
    categoryItems.forEach(item => {
      if (item.subtype) subtypeSet.add(item.subtype);
    });
    return Array.from(subtypeSet).sort();
  }, [items, selectedCategory]);

  const availableSeasons = useMemo(() => {
    const seasonSet = new Set<Season>();
    const categoryItems = selectedCategory === "all" ? items : items.filter(item => item.category === selectedCategory);
    categoryItems.forEach(item => {
      if (item.seasons) item.seasons.forEach(season => seasonSet.add(season));
    });
    return Array.from(seasonSet).sort();
  }, [items, selectedCategory]);

  const availableStyles = useMemo(() => {
    const styleSet = new Set<OutfitStyle>();
    const categoryItems = selectedCategory === "all" ? items : items.filter(item => item.category === selectedCategory);
    categoryItems.forEach(item => {
      if (item.outfitStyles) item.outfitStyles.forEach(style => styleSet.add(style));
    });
    return Array.from(styleSet).sort();
  }, [items, selectedCategory]);

  const activeFiltersCount = selectedBrands.length + selectedSubtypes.length + selectedSeasons.length + selectedStyles.length;

  const clearAllFilters = () => {
    setSelectedBrands([]);
    setSelectedSubtypes([]);
    setSelectedSeasons([]);
    setSelectedStyles([]);
  };

  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev => 
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
  };

  const toggleSubtype = (subtype: string) => {
    setSelectedSubtypes(prev => 
      prev.includes(subtype) ? prev.filter(s => s !== subtype) : [...prev, subtype]
    );
  };

  const toggleSeason = (season: Season) => {
    setSelectedSeasons(prev => 
      prev.includes(season) ? prev.filter(s => s !== season) : [...prev, season]
    );
  };

  const toggleStyle = (style: OutfitStyle) => {
    setSelectedStyles(prev => 
      prev.includes(style) ? prev.filter(s => s !== style) : [...prev, style]
    );
  };

  const toggleBrandExpanded = (brand: string) => {
    setExpandedBrands(prev => {
      const newSet = new Set(prev);
      if (newSet.has(brand)) {
        newSet.delete(brand);
      } else {
        newSet.add(brand);
      }
      return newSet;
    });
  };

  const expandAllBrands = () => {
    const allBrands = groupedByBrand.map(g => g.brand);
    setExpandedBrands(new Set(allBrands));
    const allSubcats: string[] = [];
    groupedByBrand.forEach(g => {
      g.subcategories.forEach(sub => {
        allSubcats.push(`${g.brand}:${sub.name}`);
      });
    });
    setExpandedSubcategories(new Set(allSubcats));
  };

  const collapseAllBrands = () => {
    setExpandedBrands(new Set());
    setExpandedSubcategories(new Set());
  };

  const toggleSubcategoryExpanded = (brand: string, subcategory: string) => {
    const key = `${brand}:${subcategory}`;
    setExpandedSubcategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const groupedByBrand = useMemo(() => {
    const normalizesilhouette = (silhouette: string): string => {
      if (!silhouette) return 'Other Silhouettes';
      
      const knownModels = [
        'Air Max 1', 'Air Max 90', 'Air Max 95', 'Air Max 97', 'Air Max Plus', 'Air Max 270', 'Air Max 720',
        'Air Force 1', 'Air Force One',
        'Air Jordan 1', 'Air Jordan 2', 'Air Jordan 3', 'Air Jordan 4', 'Air Jordan 5', 'Air Jordan 6',
        'Air Jordan 7', 'Air Jordan 8', 'Air Jordan 9', 'Air Jordan 10', 'Air Jordan 11', 'Air Jordan 12',
        'Air Jordan 13', 'Air Jordan 14', 'Jordan 1', 'Jordan 2', 'Jordan 3', 'Jordan 4', 'Jordan 5',
        'Jordan 6', 'Jordan 7', 'Jordan 8', 'Jordan 9', 'Jordan 10', 'Jordan 11', 'Jordan 12', 'Jordan 13',
        'Dunk Low', 'Dunk High', 'Dunk SB',
        'New Balance 550', 'New Balance 990', 'New Balance 992', 'New Balance 993', 'New Balance 2002R',
        'Yeezy 350', 'Yeezy 500', 'Yeezy 700', 'Yeezy 380', 'Yeezy Slide', 'Yeezy Foam Runner',
        'Ultraboost', 'Stan Smith', 'Superstar', 'Forum', 'Gazelle', 'Samba',
        'Chuck Taylor', 'One Star',
        'Old Skool', 'Sk8-Hi', 'Era', 'Authentic',
        'Gel-Lyte III', 'Gel-Lyte V',
        'Classic Leather', 'Club C',
      ];
      
      const normalized = silhouette.trim();
      const lowerNormalized = normalized.toLowerCase();
      
      for (const model of knownModels) {
        if (lowerNormalized.startsWith(model.toLowerCase())) {
          return model;
        }
      }
      
      const words = normalized.split(/\s+/);
      if (words.length >= 2) {
        const firstTwo = words.slice(0, 2).join(' ');
        const hasNumber = /\d/.test(firstTwo);
        if (hasNumber) {
          return firstTwo;
        }
        if (words.length >= 3 && /\d/.test(words[2])) {
          return words.slice(0, 3).join(' ');
        }
        return firstTwo;
      }
      
      return normalized;
    };

    const getSubcategoryForItem = (item: typeof filteredItems[0]): string => {
      if (item.category === 'sneaker') {
        return normalizesilhouette(item.silhouette || '');
      } else if (item.category === 'top') {
        if (item.subtype) {
          const subtypeLabels: { [key: string]: string } = {
            tshirt: 'Short Sleeve',
            polo: 'Polo',
            buttondown: 'Button Down',
            sweatshirt: 'Long Sleeve',
            outerwear: 'Outerwear',
          };
          return subtypeLabels[item.subtype] || item.subtype;
        }
        return 'Other Tops';
      } else if (item.category === 'bottom') {
        if (item.subtype) {
          const subtypeLabels: { [key: string]: string } = {
            jeans: 'Jeans',
            dressslacks: 'Dress Slacks',
            sweatpants: 'Sweatpants',
            shorts: 'Shorts',
            gymshorts: 'Gym Shorts',
          };
          return subtypeLabels[item.subtype] || item.subtype;
        }
        return 'Other Bottoms';
      } else if (item.category === 'hat') {
        // Group hats by team
        return item.team || 'Other Teams';
      }
      return 'Other';
    };

    const groups: { [key: string]: typeof filteredItems } = {};
    
    filteredItems.forEach(item => {
      const brand = item.brand || "No Brand";
      if (!groups[brand]) {
        groups[brand] = [];
      }
      groups[brand].push(item);
    });
    
    const sortedBrands = Object.keys(groups).sort((a, b) => {
      if (a === "No Brand") return 1;
      if (b === "No Brand") return -1;
      return a.localeCompare(b);
    });
    
    const subtypeOrder: { [key: string]: number } = {
      // Tops order
      'Short Sleeve': 1,
      'Polo': 2,
      'Button Down': 3,
      'Long Sleeve': 4,
      'Outerwear': 5,
      // Bottoms order
      'Jeans': 10,
      'Dress Slacks': 11,
      'Sweatpants': 12,
      'Shorts': 13,
      'Gym Shorts': 14,
      // Fallbacks
      'Other Tops': 90,
      'Other Bottoms': 91,
      'Other Silhouettes': 92,
      'Other Teams': 93,
      'Other': 999,
    };
    
    return sortedBrands.map(brand => {
      const brandItems = groups[brand];
      const subcatGroups: { [key: string]: typeof filteredItems } = {};
      
      brandItems.forEach(item => {
        const subcat = getSubcategoryForItem(item);
        if (!subcatGroups[subcat]) {
          subcatGroups[subcat] = [];
        }
        subcatGroups[subcat].push(item);
      });
      
      const sortedSubcats = Object.keys(subcatGroups).sort((a, b) => {
        const aOrder = subtypeOrder[a] || 500;
        const bOrder = subtypeOrder[b] || 500;
        if (aOrder !== bOrder) return aOrder - bOrder;
        return a.localeCompare(b);
      });
      
      return {
        brand,
        items: brandItems,
        subcategories: sortedSubcats.map(subcat => ({
          name: subcat,
          items: subcatGroups[subcat].sort((a, b) => (a.name || '').localeCompare(b.name || '')),
        })),
      };
    });
  }, [filteredItems]);

  const categories = [
    { id: "all" as const, label: "All", count: items.length, icon: Package },
    { id: "sneaker" as const, label: "Sneakers", count: sneakers.length, icon: Package },
    { id: "top" as const, label: "Tops", count: tops.length, icon: Shirt },
    { id: "bottom" as const, label: "Bottoms", count: bottoms.length, icon: Shirt },
    { id: "hat" as const, label: "Hats", count: hats.length, icon: Package },
  ];

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Setting your sole on Fire</Text>
            <Text style={styles.subtitle}>{stats.totalItems} items</Text>
          </View>
          <View style={styles.headerButtons}>
            {items.length > 0 && (
              <TouchableOpacity 
                style={styles.deleteAllButton}
                onPress={() => {
                  Alert.alert(
                    "Delete All Items",
                    `Are you sure you want to delete all ${items.length} item${items.length === 1 ? '' : 's'}? This action cannot be undone.`,
                    [
                      { text: "Cancel", style: "cancel" },
                      { 
                        text: "Delete All", 
                        style: "destructive",
                        onPress: () => deleteAllItems(),
                      },
                    ]
                  );
                }}
              >
                <Trash size={18} color={COLORS.error} />
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={styles.viewModeButton}
              onPress={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            >
              {viewMode === "grid" ? (
                <List size={18} color={COLORS.text} />
              ) : (
                <Grid3X3 size={18} color={COLORS.text} />
              )}
            </TouchableOpacity>
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
            <TouchableOpacity 
              style={styles.aiButton}
              onPress={() => router.push("/generator")}
            >
              <Sparkles size={20} color="#FFF" />
              <Text style={styles.aiButtonText}>AI Outfits</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              ${stats.totalValue.toLocaleString()}
            </Text>
            <Text style={styles.statLabel}>Market Value</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: stats.profit >= 0 ? COLORS.success : COLORS.error }]}>
              ${Math.abs(stats.profit).toLocaleString()}
            </Text>
            <Text style={styles.statLabel}>{stats.profit >= 0 ? "Profit" : "Loss"}</Text>
          </View>
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryScrollContent}
        >
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryButton, isSelected && styles.categoryButtonActive]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Icon size={20} color={isSelected ? "#FFF" : COLORS.text} />
                <Text style={[styles.categoryButtonText, isSelected && styles.categoryButtonTextActive]}>
                  {cat.label}
                </Text>
                <View style={[styles.categoryBadge, isSelected && styles.categoryBadgeActive]}>
                  <Text style={[styles.categoryBadgeText, isSelected && styles.categoryBadgeTextActive]}>
                    {cat.count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {showFilters && (
          <View style={styles.filtersContainer}>
            <View style={styles.filtersHeader}>
              <Text style={styles.filtersTitle}>Filters</Text>
              {activeFiltersCount > 0 && (
                <TouchableOpacity onPress={clearAllFilters}>
                  <Text style={styles.clearFiltersText}>Clear All</Text>
                </TouchableOpacity>
              )}
            </View>

            {availableBrands.length > 0 && (
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Brands</Text>
                <View style={styles.filterChips}>
                  {availableBrands.map(brand => (
                    <TouchableOpacity
                      key={brand}
                      style={[
                        styles.filterChip,
                        selectedBrands.includes(brand) && styles.filterChipActive
                      ]}
                      onPress={() => toggleBrand(brand)}
                    >
                      <Text style={[
                        styles.filterChipText,
                        selectedBrands.includes(brand) && styles.filterChipTextActive
                      ]}>
                        {brand}
                      </Text>
                      {selectedBrands.includes(brand) && (
                        <X size={14} color="#FFF" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {availableSubtypes.length > 0 && (
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Garment Type</Text>
                <View style={styles.filterChips}>
                  {availableSubtypes.map(subtype => (
                    <TouchableOpacity
                      key={subtype}
                      style={[
                        styles.filterChip,
                        selectedSubtypes.includes(subtype) && styles.filterChipActive
                      ]}
                      onPress={() => toggleSubtype(subtype)}
                    >
                      <Text style={[
                        styles.filterChipText,
                        selectedSubtypes.includes(subtype) && styles.filterChipTextActive
                      ]}>
                        {subtype}
                      </Text>
                      {selectedSubtypes.includes(subtype) && (
                        <X size={14} color="#FFF" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {availableSeasons.length > 0 && (
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Seasons</Text>
                <View style={styles.filterChips}>
                  {availableSeasons.map(season => (
                    <TouchableOpacity
                      key={season}
                      style={[
                        styles.filterChip,
                        selectedSeasons.includes(season) && styles.filterChipActive
                      ]}
                      onPress={() => toggleSeason(season)}
                    >
                      <Text style={[
                        styles.filterChipText,
                        selectedSeasons.includes(season) && styles.filterChipTextActive
                      ]}>
                        {season}
                      </Text>
                      {selectedSeasons.includes(season) && (
                        <X size={14} color="#FFF" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {availableStyles.length > 0 && (
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Outfit Styles</Text>
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
          </View>
        )}

        {filteredItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Package size={64} color={COLORS.border} />
            <Text style={styles.emptyTitle}>No items yet</Text>
            <Text style={styles.emptySubtitle}>
              Start building your wardrobe by adding your first item
            </Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => router.push("/add")}
            >
              <Text style={styles.addButtonText}>Add Item</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.sectionsContainer}>
            {viewMode === "grid" ? (
              <>
                {groupedByBrand.length > 1 && (
                  <View style={styles.expandCollapseRow}>
                    <TouchableOpacity onPress={expandAllBrands} style={styles.expandCollapseButton}>
                      <Text style={styles.expandCollapseText}>Expand All</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={collapseAllBrands} style={styles.expandCollapseButton}>
                      <Text style={styles.expandCollapseText}>Collapse All</Text>
                    </TouchableOpacity>
                  </View>
                )}
                {groupedByBrand.map((group) => {
                  const isExpanded = expandedBrands.has(group.brand);
                  const hasSubcategories = group.subcategories.length > 1 || (group.subcategories.length === 1 && group.subcategories[0].name !== 'Other');
                  return (
                    <View key={group.brand} style={styles.brandSection}>
                      <TouchableOpacity 
                        style={styles.brandHeaderRow}
                        onPress={() => toggleBrandExpanded(group.brand)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.brandHeaderLeft}>
                          {isExpanded ? (
                            <ChevronDown size={20} color={COLORS.text} />
                          ) : (
                            <ChevronRight size={20} color={COLORS.text} />
                          )}
                          <Text style={styles.brandHeader}>{group.brand}</Text>
                        </View>
                        <View style={styles.brandItemCount}>
                          <Text style={styles.brandItemCountText}>{group.items.length}</Text>
                        </View>
                      </TouchableOpacity>
                      {isExpanded && (
                        <View style={styles.brandContent}>
                          {hasSubcategories ? (
                            group.subcategories.map((subcat) => {
                              const subcatKey = `${group.brand}:${subcat.name}`;
                              const isSubcatExpanded = expandedSubcategories.has(subcatKey);
                              return (
                                <View key={subcatKey} style={styles.subcategorySection}>
                                  <TouchableOpacity
                                    style={styles.subcategoryHeaderRow}
                                    onPress={() => toggleSubcategoryExpanded(group.brand, subcat.name)}
                                    activeOpacity={0.7}
                                  >
                                    <View style={styles.subcategoryHeaderLeft}>
                                      {isSubcatExpanded ? (
                                        <ChevronDown size={16} color={COLORS.textSecondary} />
                                      ) : (
                                        <ChevronRight size={16} color={COLORS.textSecondary} />
                                      )}
                                      <Text style={styles.subcategoryHeader}>{subcat.name}</Text>
                                    </View>
                                    <View style={styles.subcategoryItemCount}>
                                      <Text style={styles.subcategoryItemCountText}>{subcat.items.length}</Text>
                                    </View>
                                  </TouchableOpacity>
                                  {isSubcatExpanded && (
                                    <View style={styles.grid}>
                                      {subcat.items.map((item) => (
                                        <TouchableOpacity 
                                          key={item.id} 
                                          style={styles.card}
                                          onPress={() => {
                                            router.push({
                                              pathname: "/add" as any,
                                              params: { editId: item.id as string },
                                            });
                                          }}
                                        >
                                          <Image
                                            source={{ uri: item.imageUrl }}
                                            style={styles.cardImage}
                                            contentFit="cover"
                                            placeholder={require("../../assets/images/icon.png")}
                                            placeholderContentFit="contain"
                                            transition={200}
                                            cachePolicy="memory-disk"
                                            onError={(error) => {
                                              console.error("[Card Image Error]", item.id, item.imageUrl, error);
                                            }}
                                            onLoad={() => {
                                              console.log("[Card Image Loaded]", item.id);
                                            }}
                                          />
                                          <View style={styles.cardOverlay}>
                                            <TouchableOpacity 
                                              style={styles.cardActionButton}
                                              onPress={() => {
                                                router.push({
                                                  pathname: "/add" as any,
                                                  params: { editId: item.id as string },
                                                });
                                              }}
                                            >
                                              <Edit size={14} color="#FFF" />
                                            </TouchableOpacity>
                                            <TouchableOpacity 
                                              style={styles.cardActionButton}
                                              onPress={() => {
                                                Alert.alert(
                                                  "Delete Item",
                                                  `Are you sure you want to delete "${item.name}"?`,
                                                  [
                                                    { text: "Cancel", style: "cancel" },
                                                    { 
                                                      text: "Delete", 
                                                      style: "destructive",
                                                      onPress: () => deleteItem(item.id),
                                                    },
                                                  ]
                                                );
                                              }}
                                            >
                                              <Trash2 size={14} color="#FFF" />
                                            </TouchableOpacity>
                                          </View>
                                          <View style={styles.cardContent}>
                                            <Text style={styles.cardTitle} numberOfLines={1}>
                                              {item.name}
                                            </Text>
                                            {item.brand && (
                                              <Text style={styles.cardBrand} numberOfLines={1}>
                                                {item.brand}
                                              </Text>
                                            )}
                                            <View style={styles.cardFooter}>
                                              <Text style={styles.cardPrice}>
                                                {item.marketValue ? `${item.marketValue}` : "-"}
                                              </Text>
                                              <View style={[
                                                styles.categoryChip,
                                                item.category === "sneaker" && { backgroundColor: "#FF6B35" },
                                                item.category === "top" && { backgroundColor: "#4ECDC4" },
                                                item.category === "bottom" && { backgroundColor: "#95E1D3" },
                                                item.category === "hat" && { backgroundColor: "#FFB84D" },
                                              ]}>
                                                <Text style={styles.categoryChipText}>
                                                  {item.category === "sneaker" ? "👟" : item.category === "top" ? "👕" : item.category === "bottom" ? "👖" : "🧢"}
                                                </Text>
                                              </View>
                                            </View>
                                          </View>
                                        </TouchableOpacity>
                                      ))}
                                    </View>
                                  )}
                                </View>
                              );
                            })
                          ) : (
                            <View style={styles.grid}>
                              {group.items.map((item) => (
                                <TouchableOpacity 
                                  key={item.id} 
                                  style={styles.card}
                                  onPress={() => {
                                    router.push({
                                      pathname: "/add" as any,
                                      params: { editId: item.id as string },
                                    });
                                  }}
                                >
                                  <Image
                                    source={{ uri: item.imageUrl }}
                                    style={styles.cardImage}
                                    contentFit="cover"
                                    placeholder={require("../../assets/images/icon.png")}
                                    placeholderContentFit="contain"
                                    transition={200}
                                    cachePolicy="memory-disk"
                                    onError={(error) => {
                                      console.error("[Card Image Error]", item.id, item.imageUrl, error);
                                    }}
                                    onLoad={() => {
                                      console.log("[Card Image Loaded]", item.id);
                                    }}
                                  />
                                  <View style={styles.cardOverlay}>
                                    <TouchableOpacity 
                                      style={styles.cardActionButton}
                                      onPress={() => {
                                        router.push({
                                          pathname: "/add" as any,
                                          params: { editId: item.id as string },
                                        });
                                      }}
                                    >
                                      <Edit size={14} color="#FFF" />
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                      style={styles.cardActionButton}
                                      onPress={() => {
                                        Alert.alert(
                                          "Delete Item",
                                          `Are you sure you want to delete "${item.name}"?`,
                                          [
                                            { text: "Cancel", style: "cancel" },
                                            { 
                                              text: "Delete", 
                                              style: "destructive",
                                              onPress: () => deleteItem(item.id),
                                            },
                                          ]
                                        );
                                      }}
                                    >
                                      <Trash2 size={14} color="#FFF" />
                                    </TouchableOpacity>
                                  </View>
                                  <View style={styles.cardContent}>
                                    <Text style={styles.cardTitle} numberOfLines={1}>
                                      {item.name}
                                    </Text>
                                    {item.brand && (
                                      <Text style={styles.cardBrand} numberOfLines={1}>
                                        {item.brand}
                                      </Text>
                                    )}
                                    <View style={styles.cardFooter}>
                                      <Text style={styles.cardPrice}>
                                        {item.marketValue ? `${item.marketValue}` : "-"}
                                      </Text>
                                      <View style={[
                                        styles.categoryChip,
                                        item.category === "sneaker" && { backgroundColor: "#FF6B35" },
                                        item.category === "top" && { backgroundColor: "#4ECDC4" },
                                        item.category === "bottom" && { backgroundColor: "#95E1D3" },
                                        item.category === "hat" && { backgroundColor: "#FFB84D" },
                                      ]}>
                                        <Text style={styles.categoryChipText}>
                                          {item.category === "sneaker" ? "👟" : item.category === "top" ? "👕" : item.category === "bottom" ? "👖" : "🧢"}
                                        </Text>
                                      </View>
                                    </View>
                                  </View>
                                </TouchableOpacity>
                              ))}
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  );
                })}
              </>
            ) : (
              <View style={styles.listContainer}>
                {filteredItems.map((item) => (
                  <TouchableOpacity 
                    key={item.id} 
                    style={styles.listItem}
                    onPress={() => {
                      router.push({
                        pathname: "/add" as any,
                        params: { editId: item.id as string },
                      });
                    }}
                  >
                    <Image
                      source={{ uri: item.imageUrl }}
                      style={styles.listItemImage}
                      contentFit="cover"
                      placeholder={require("../../assets/images/icon.png")}
                      placeholderContentFit="contain"
                      transition={200}
                      cachePolicy="memory-disk"
                    />
                    <View style={styles.listItemContent}>
                      <View style={styles.listItemHeader}>
                        <Text style={styles.listItemName} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <View style={[
                          styles.listCategoryChip,
                          item.category === "sneaker" && { backgroundColor: "#FF6B35" },
                          item.category === "top" && { backgroundColor: "#4ECDC4" },
                          item.category === "bottom" && { backgroundColor: "#95E1D3" },
                          item.category === "hat" && { backgroundColor: "#FFB84D" },
                        ]}>
                          <Text style={styles.listCategoryText}>
                            {item.category === "sneaker" ? "👟" : item.category === "top" ? "👕" : item.category === "bottom" ? "👖" : "🧢"}
                          </Text>
                        </View>
                      </View>
                      {item.brand && (
                        <Text style={styles.listItemBrand}>{item.brand}</Text>
                      )}
                      <View style={styles.listItemFooter}>
                        <View style={styles.lastWornContainer}>
                          <Calendar size={12} color={COLORS.textSecondary} />
                          <Text style={styles.lastWornText}>
                            {item.dateLastWorn 
                              ? new Date(item.dateLastWorn).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                              : 'Never worn'}
                          </Text>
                        </View>
                        <Text style={styles.listItemPrice}>
                          {item.marketValue ? `${item.marketValue}` : "-"}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.listItemActions}>
                      <TouchableOpacity 
                        style={styles.listActionButton}
                        onPress={() => {
                          router.push({
                            pathname: "/add" as any,
                            params: { editId: item.id as string },
                          });
                        }}
                      >
                        <Edit size={16} color={COLORS.textSecondary} />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.listActionButton}
                        onPress={() => {
                          Alert.alert(
                            "Delete Item",
                            `Are you sure you want to delete "${item.name}"?`,
                            [
                              { text: "Cancel", style: "cancel" },
                              { 
                                text: "Delete", 
                                style: "destructive",
                                onPress: () => deleteItem(item.id),
                              },
                            ]
                          );
                        }}
                      >
                        <Trash2 size={16} color={COLORS.error} />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 24 }]}
        onPress={() => {
          router.push({
            pathname: "/add" as any,
            params: selectedCategory !== "all" ? { category: selectedCategory as string } : {},
          });
        }}
      >
        <Plus size={28} color="#FFF" strokeWidth={2.5} />
      </TouchableOpacity>
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
    paddingTop: 20,
    paddingBottom: 12,
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  deleteAllButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  viewModeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
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
  aiButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  aiButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600" as const,
  },
  statsContainer: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "600" as const,
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  categoryScroll: {
    marginBottom: 16,
  },
  categoryScrollContent: {
    paddingHorizontal: 20,
    gap: 6,
  },
  categoryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    marginRight: 6,
  },
  categoryButtonActive: {
    backgroundColor: COLORS.primary,
  },
  categoryButtonText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: COLORS.text,
  },
  categoryButtonTextActive: {
    color: "#FFF",
  },
  categoryBadge: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: "center",
  },
  categoryBadgeActive: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: COLORS.text,
  },
  categoryBadgeTextActive: {
    color: "#FFF",
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
  addButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
  },
  addButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600" as const,
  },
  sectionsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  brandSection: {
    marginBottom: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    overflow: "hidden" as const,
  },
  brandHeaderRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: COLORS.surface,
  },
  brandHeaderLeft: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 10,
    flex: 1,
  },
  brandHeader: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: COLORS.text,
    letterSpacing: -0.2,
  },
  brandItemCount: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 28,
    alignItems: "center" as const,
  },
  brandItemCountText: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: "#FFF",
  },
  brandContent: {
    paddingBottom: 4,
  },
  subcategorySection: {
    marginLeft: 12,
    marginTop: 4,
    borderLeftWidth: 2,
    borderLeftColor: COLORS.border,
  },
  subcategoryHeaderRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  subcategoryHeaderLeft: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
    flex: 1,
  },
  subcategoryHeader: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: COLORS.textSecondary,
  },
  subcategoryItemCount: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    minWidth: 24,
    alignItems: "center" as const,
  },
  subcategoryItemCountText: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: COLORS.textSecondary,
  },
  expandCollapseRow: {
    flexDirection: "row" as const,
    justifyContent: "flex-end" as const,
    gap: 12,
    marginBottom: 12,
  },
  expandCollapseButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  expandCollapseText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: COLORS.primary,
  },
  grid: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 8,
    padding: 12,
    paddingTop: 0,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  cardImage: {
    width: "100%",
    height: CARD_WIDTH * 1.15,
    backgroundColor: COLORS.surface,
  },
  cardContent: {
    padding: 8,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: COLORS.text,
  },
  cardBrand: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  cardPrice: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: COLORS.text,
  },
  categoryChip: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryChipText: {
    fontSize: 10,
  },
  cardOverlay: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 10,
    flexDirection: "row",
    gap: 6,
  },
  cardActionButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
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
  listContainer: {
    gap: 8,
  },
  listItem: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    gap: 12,
  },
  listItemImage: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: COLORS.background,
  },
  listItemContent: {
    flex: 1,
    gap: 4,
  },
  listItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  listItemName: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: COLORS.text,
    flex: 1,
  },
  listCategoryChip: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  listCategoryText: {
    fontSize: 12,
  },
  listItemBrand: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: "500" as const,
  },
  listItemFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  lastWornContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  lastWornText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  listItemPrice: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: COLORS.text,
  },
  listItemActions: {
    flexDirection: "column",
    gap: 8,
  },
  listActionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },
});
