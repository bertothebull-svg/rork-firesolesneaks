import { Image } from "expo-image";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Trash2 } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useMemo } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity,
  Dimensions,
  Alert,
} from "react-native";
import { useCalendar } from "../../contexts/CalendarContext";
import { useWardrobe } from "../../contexts/WardrobeContext";
import { COLORS } from "../../constants/styles";

const { width } = Dimensions.get("window");
const ITEM_SIZE = (width - 100) / 4;

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const { calendarOutfits, deleteOutfitForDate } = useCalendar();
  const { getItemById } = useWardrobe();
  
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1).getDay();

  const calendarDays = useMemo(() => {
    const days: (number | null)[] = [];
    
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  }, [daysInMonth, firstDayOfMonth]);

  const outfitsInMonth = useMemo(() => {
    const outfitsMap = new Map<number, typeof calendarOutfits[0]>();
    calendarOutfits.forEach(outfit => {
      const date = new Date(outfit.date);
      if (date.getFullYear() === selectedYear && date.getMonth() === selectedMonth) {
        outfitsMap.set(date.getDate(), outfit);
      }
    });
    return outfitsMap;
  }, [calendarOutfits, selectedMonth, selectedYear]);

  const selectedOutfit = useMemo(() => {
    if (!selectedDate) return null;
    return calendarOutfits.find(o => o.date === selectedDate);
  }, [selectedDate, calendarOutfits]);

  const goToPreviousMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const handleDayPress = (day: number) => {
    const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const outfit = outfitsInMonth.get(day);
    if (outfit) {
      setSelectedDate(dateStr);
    }
  };

  const handleDeleteOutfit = () => {
    if (!selectedDate) return;
    
    Alert.alert(
      "Delete Outfit",
      "Are you sure you want to remove this outfit from the calendar?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteOutfitForDate(selectedDate);
            setSelectedDate(null);
          },
        },
      ]
    );
  };

  const currentSneaker = selectedOutfit ? getItemById(selectedOutfit.sneakerId) : null;
  const currentTop = selectedOutfit ? getItemById(selectedOutfit.topId) : null;
  const currentOuterLayer = selectedOutfit?.outerLayerId ? getItemById(selectedOutfit.outerLayerId) : null;
  const currentBottom = selectedOutfit ? getItemById(selectedOutfit.bottomId) : null;
  const currentHat = selectedOutfit?.hatId ? getItemById(selectedOutfit.hatId) : null;
  const currentSock = selectedOutfit?.sockId ? getItemById(selectedOutfit.sockId) : null;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <View>
          <Text style={styles.title}>Outfit Calendar</Text>
          <Text style={styles.subtitle}>Track your daily looks</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.calendarContainer}>
          <View style={styles.monthSelector}>
            <TouchableOpacity onPress={goToPreviousMonth} style={styles.monthButton}>
              <ChevronLeft size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.monthText}>
              {MONTHS[selectedMonth]} {selectedYear}
            </Text>
            <TouchableOpacity onPress={goToNextMonth} style={styles.monthButton}>
              <ChevronRight size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.weekDaysContainer}>
            {DAYS_SHORT.map(day => (
              <View key={day} style={styles.weekDay}>
                <Text style={styles.weekDayText}>{day}</Text>
              </View>
            ))}
          </View>

          <View style={styles.daysContainer}>
            {calendarDays.map((day, index) => {
              if (day === null) {
                return <View key={`empty-${index}`} style={styles.dayCell} />;
              }

              const hasOutfit = outfitsInMonth.has(day);
              const isToday = day === today.getDate() && 
                              selectedMonth === today.getMonth() && 
                              selectedYear === today.getFullYear();
              const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isSelected = selectedDate === dateStr;

              return (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayCell,
                    isToday && styles.todayCell,
                    hasOutfit && styles.hasOutfitCell,
                    isSelected && styles.selectedCell,
                  ]}
                  onPress={() => handleDayPress(day)}
                  disabled={!hasOutfit}
                >
                  <Text style={[
                    styles.dayText,
                    isToday && styles.todayText,
                    hasOutfit && styles.hasOutfitText,
                    isSelected && styles.selectedText,
                  ]}>
                    {day}
                  </Text>
                  {hasOutfit && <View style={styles.outfitDot} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {selectedOutfit && currentSneaker && currentTop && currentBottom && (
          <View style={styles.outfitDetailContainer}>
            <View style={styles.outfitDetailHeader}>
              <View>
                <Text style={styles.outfitDetailTitle}>Outfit Details</Text>
                <Text style={styles.outfitDetailDate}>
                  {new Date(selectedDate!).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDeleteOutfit}
              >
                <Trash2 size={20} color={COLORS.error} />
              </TouchableOpacity>
            </View>

            <View style={styles.outfitItems}>
              <View style={styles.outfitItem}>
                <Image 
                  source={{ uri: currentTop.imageUrl }} 
                  style={styles.outfitItemImage}
                  contentFit="cover"
                  placeholder={require("../../assets/images/icon.png")}
                  placeholderContentFit="contain"
                  transition={200}
                />
                <Text style={styles.outfitItemLabel}>Top</Text>
                <Text style={styles.outfitItemName} numberOfLines={1}>{currentTop.name}</Text>
              </View>

              {currentOuterLayer && (
                <View style={styles.outfitItem}>
                  <Image 
                    source={{ uri: currentOuterLayer.imageUrl }} 
                    style={styles.outfitItemImage}
                    contentFit="cover"
                    placeholder={require("../../assets/images/icon.png")}
                    placeholderContentFit="contain"
                    transition={200}
                  />
                  <Text style={styles.outfitItemLabel}>Outer</Text>
                  <Text style={styles.outfitItemName} numberOfLines={1}>{currentOuterLayer.name}</Text>
                </View>
              )}

              <View style={styles.outfitItem}>
                <Image 
                  source={{ uri: currentBottom.imageUrl }} 
                  style={styles.outfitItemImage}
                  contentFit="cover"
                  placeholder={require("../../assets/images/icon.png")}
                  placeholderContentFit="contain"
                  transition={200}
                />
                <Text style={styles.outfitItemLabel}>Bottom</Text>
                <Text style={styles.outfitItemName} numberOfLines={1}>{currentBottom.name}</Text>
              </View>

              <View style={styles.outfitItem}>
                <Image 
                  source={{ uri: currentSneaker.imageUrl }} 
                  style={styles.outfitItemImage}
                  contentFit="cover"
                  placeholder={require("../../assets/images/icon.png")}
                  placeholderContentFit="contain"
                  transition={200}
                />
                <Text style={styles.outfitItemLabel}>Sneaker</Text>
                <Text style={styles.outfitItemName} numberOfLines={1}>{currentSneaker.name}</Text>
              </View>

              {currentSock && (
                <View style={styles.outfitItem}>
                  <Image 
                    source={{ uri: currentSock.imageUrl }} 
                    style={styles.outfitItemImage}
                    contentFit="cover"
                    placeholder={require("../../assets/images/icon.png")}
                    placeholderContentFit="contain"
                    transition={200}
                  />
                  <Text style={styles.outfitItemLabel}>Sock</Text>
                  <Text style={styles.outfitItemName} numberOfLines={1}>{currentSock.name}</Text>
                </View>
              )}

              {currentHat && (
                <View style={styles.outfitItem}>
                  <Image 
                    source={{ uri: currentHat.imageUrl }} 
                    style={styles.outfitItemImage}
                    contentFit="cover"
                    placeholder={require("../../assets/images/icon.png")}
                    placeholderContentFit="contain"
                    transition={200}
                  />
                  <Text style={styles.outfitItemLabel}>Hat</Text>
                  <Text style={styles.outfitItemName} numberOfLines={1}>{currentHat.name}</Text>
                </View>
              )}
            </View>

            <View style={styles.styleBadge}>
              <Text style={styles.styleBadgeText}>
                {selectedOutfit.style.charAt(0).toUpperCase() + selectedOutfit.style.slice(1)} Style
              </Text>
            </View>
          </View>
        )}

        {calendarOutfits.length === 0 && (
          <View style={styles.emptyState}>
            <CalendarIcon size={64} color={COLORS.border} />
            <Text style={styles.emptyTitle}>No Outfits Yet</Text>
            <Text style={styles.emptySubtitle}>
              Use &quot;I&apos;m Wearing This Outfit Today&quot; in the generator to save outfits to your calendar
            </Text>
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
  calendarContainer: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  monthSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  monthButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },
  monthText: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: COLORS.text,
  },
  weekDaysContainer: {
    flexDirection: "row",
    marginBottom: 8,
  },
  weekDay: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: COLORS.textSecondary,
  },
  daysContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: `${100 / 7}%` as any,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 4,
    position: "relative" as const,
  },
  todayCell: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
  },
  hasOutfitCell: {
    backgroundColor: COLORS.primary + "20",
    borderRadius: 8,
  },
  selectedCell: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  dayText: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: COLORS.text,
  },
  todayText: {
    fontWeight: "700" as const,
    color: COLORS.primary,
  },
  hasOutfitText: {
    fontWeight: "700" as const,
    color: COLORS.primary,
  },
  selectedText: {
    color: "#FFF",
    fontWeight: "700" as const,
  },
  outfitDot: {
    position: "absolute" as const,
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
  },
  outfitDetailContainer: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  outfitDetailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  outfitDetailTitle: {
    fontSize: 17,
    fontWeight: "600" as const,
    color: COLORS.text,
  },
  outfitDetailDate: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
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
    borderRadius: 10,
    backgroundColor: COLORS.background,
    marginBottom: 4,
  },
  outfitItemLabel: {
    fontSize: 10,
    fontWeight: "600" as const,
    color: COLORS.textSecondary,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
    marginTop: 4,
  },
  outfitItemName: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: COLORS.text,
    textAlign: "center",
    marginTop: 2,
  },
  styleBadge: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: COLORS.primary + "20",
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  styleBadgeText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: COLORS.primary,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
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
});
