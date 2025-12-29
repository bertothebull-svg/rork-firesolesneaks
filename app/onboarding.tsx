import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronRight, User, MapPin, Eye } from "lucide-react-native";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { COLORS } from "@/constants/styles";
import type { Gender, BodyType, HairColor, EyeColor } from "@/types/user";

const { width } = Dimensions.get("window");

const BODY_TYPES: { id: BodyType; label: string; icon: string }[] = [
  { id: "athletic", label: "Athletic", icon: "💪" },
  { id: "slim", label: "Slim", icon: "🏃" },
  { id: "average", label: "Average", icon: "🧍" },
  { id: "muscular", label: "Muscular", icon: "🏋️" },
  { id: "curvy", label: "Curvy", icon: "👤" },
  { id: "plus-size", label: "Plus Size", icon: "🫂" },
];

const GENDERS: { id: Gender; label: string }[] = [
  { id: "male", label: "Male" },
  { id: "female", label: "Female" },
  { id: "non-binary", label: "Non-Binary" },
  { id: "prefer-not-to-say", label: "Prefer Not to Say" },
];

const HAIR_COLORS: { id: HairColor; label: string; color: string }[] = [
  { id: "black", label: "Black", color: "#000000" },
  { id: "brown", label: "Brown", color: "#4A2511" },
  { id: "blonde", label: "Blonde", color: "#FAE7B5" },
  { id: "red", label: "Red", color: "#8B0000" },
  { id: "gray", label: "Gray", color: "#808080" },
  { id: "white", label: "White", color: "#F5F5F5" },
  { id: "other", label: "Other", color: "#94A3B8" },
];

const EYE_COLORS: { id: EyeColor; label: string; color: string }[] = [
  { id: "brown", label: "Brown", color: "#5C4033" },
  { id: "blue", label: "Blue", color: "#4A90E2" },
  { id: "green", label: "Green", color: "#50C878" },
  { id: "hazel", label: "Hazel", color: "#8E7618" },
  { id: "gray", label: "Gray", color: "#708090" },
  { id: "amber", label: "Amber", color: "#FFBF00" },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { completeOnboarding } = useUserProfile();
  
  const [step, setStep] = useState(0);
  const [gender, setGender] = useState<Gender | undefined>();
  const [height, setHeight] = useState("");
  const [heightUnit, setHeightUnit] = useState<"cm" | "ft">("cm");
  const [weight, setWeight] = useState("");
  const [weightUnit, setWeightUnit] = useState<"kg" | "lbs">("lbs");
  const [bodyType, setBodyType] = useState<BodyType | undefined>();
  const [location, setLocation] = useState("");
  const [hairColor, setHairColor] = useState<HairColor | undefined>();
  const [eyeColor, setEyeColor] = useState<EyeColor | undefined>();

  const totalSteps = 5;
  const progress = ((step + 1) / totalSteps) * 100;

  const handleNext = () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleComplete = () => {
    const profile = {
      gender,
      height: height ? parseFloat(height) : undefined,
      heightUnit,
      weight: weight ? parseFloat(weight) : undefined,
      weightUnit,
      bodyType,
      location: location || undefined,
      hairColor,
      eyeColor,
    };

    completeOnboarding(profile);
    router.replace("/(tabs)");
  };

  const canProceed = () => {
    switch (step) {
      case 0:
        return !!gender;
      case 1:
        return !!height && !!weight;
      case 2:
        return !!bodyType;
      case 3:
        return !!location;
      case 4:
        return !!hairColor && !!eyeColor;
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <View style={styles.stepContainer}>
            <View style={styles.iconCircle}>
              <User size={40} color={COLORS.primary} />
            </View>
            <Text style={styles.stepTitle}>What&apos;s your gender?</Text>
            <Text style={styles.stepSubtitle}>
              This helps us provide better style recommendations
            </Text>

            <View style={styles.optionsGrid}>
              {GENDERS.map((g) => (
                <TouchableOpacity
                  key={g.id}
                  style={[
                    styles.optionCard,
                    gender === g.id && styles.optionCardSelected,
                  ]}
                  onPress={() => setGender(g.id)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      gender === g.id && styles.optionTextSelected,
                    ]}
                  >
                    {g.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 1:
        return (
          <View style={styles.stepContainer}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconEmoji}>📏</Text>
            </View>
            <Text style={styles.stepTitle}>Your measurements</Text>
            <Text style={styles.stepSubtitle}>
              Help us recommend outfits that fit your style
            </Text>

            <View style={styles.measurementContainer}>
              <Text style={styles.measurementLabel}>Height</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.measurementInput}
                  value={height}
                  onChangeText={setHeight}
                  placeholder="170"
                  placeholderTextColor={COLORS.textSecondary}
                  keyboardType="numeric"
                />
                <View style={styles.unitToggle}>
                  <TouchableOpacity
                    style={[
                      styles.unitButton,
                      heightUnit === "cm" && styles.unitButtonActive,
                    ]}
                    onPress={() => setHeightUnit("cm")}
                  >
                    <Text
                      style={[
                        styles.unitText,
                        heightUnit === "cm" && styles.unitTextActive,
                      ]}
                    >
                      cm
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.unitButton,
                      heightUnit === "ft" && styles.unitButtonActive,
                    ]}
                    onPress={() => setHeightUnit("ft")}
                  >
                    <Text
                      style={[
                        styles.unitText,
                        heightUnit === "ft" && styles.unitTextActive,
                      ]}
                    >
                      ft
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.measurementContainer}>
              <Text style={styles.measurementLabel}>Weight</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.measurementInput}
                  value={weight}
                  onChangeText={setWeight}
                  placeholder="150"
                  placeholderTextColor={COLORS.textSecondary}
                  keyboardType="numeric"
                />
                <View style={styles.unitToggle}>
                  <TouchableOpacity
                    style={[
                      styles.unitButton,
                      weightUnit === "kg" && styles.unitButtonActive,
                    ]}
                    onPress={() => setWeightUnit("kg")}
                  >
                    <Text
                      style={[
                        styles.unitText,
                        weightUnit === "kg" && styles.unitTextActive,
                      ]}
                    >
                      kg
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.unitButton,
                      weightUnit === "lbs" && styles.unitButtonActive,
                    ]}
                    onPress={() => setWeightUnit("lbs")}
                  >
                    <Text
                      style={[
                        styles.unitText,
                        weightUnit === "lbs" && styles.unitTextActive,
                      ]}
                    >
                      lbs
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContainer}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconEmoji}>👕</Text>
            </View>
            <Text style={styles.stepTitle}>Body type</Text>
            <Text style={styles.stepSubtitle}>
              Choose the option that best describes you
            </Text>

            <View style={styles.bodyTypeGrid}>
              {BODY_TYPES.map((bt) => (
                <TouchableOpacity
                  key={bt.id}
                  style={[
                    styles.bodyTypeCard,
                    bodyType === bt.id && styles.bodyTypeCardSelected,
                  ]}
                  onPress={() => setBodyType(bt.id)}
                >
                  <Text style={styles.bodyTypeEmoji}>{bt.icon}</Text>
                  <Text
                    style={[
                      styles.bodyTypeText,
                      bodyType === bt.id && styles.bodyTypeTextSelected,
                    ]}
                  >
                    {bt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContainer}>
            <View style={styles.iconCircle}>
              <MapPin size={40} color={COLORS.primary} />
            </View>
            <Text style={styles.stepTitle}>Where are you located?</Text>
            <Text style={styles.stepSubtitle}>
              We&apos;ll suggest outfits based on your local weather
            </Text>

            <TextInput
              style={styles.locationInput}
              value={location}
              onChangeText={setLocation}
              placeholder="City, Country"
              placeholderTextColor={COLORS.textSecondary}
              autoCapitalize="words"
            />
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContainer}>
            <View style={styles.iconCircle}>
              <Eye size={40} color={COLORS.primary} />
            </View>
            <Text style={styles.stepTitle}>Tell us about your features</Text>
            <Text style={styles.stepSubtitle}>
              Hair and eye color help personalize recommendations
            </Text>

            <View style={styles.colorSection}>
              <Text style={styles.colorLabel}>Hair Color</Text>
              <View style={styles.colorGrid}>
                {HAIR_COLORS.map((hc) => (
                  <TouchableOpacity
                    key={hc.id}
                    style={[
                      styles.colorOption,
                      hairColor === hc.id && styles.colorOptionSelected,
                    ]}
                    onPress={() => setHairColor(hc.id)}
                  >
                    <View
                      style={[
                        styles.colorCircle,
                        { backgroundColor: hc.color },
                        hc.id === "white" && styles.colorCircleBorder,
                      ]}
                    />
                    <Text
                      style={[
                        styles.colorText,
                        hairColor === hc.id && styles.colorTextSelected,
                      ]}
                    >
                      {hc.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.colorSection}>
              <Text style={styles.colorLabel}>Eye Color</Text>
              <View style={styles.colorGrid}>
                {EYE_COLORS.map((ec) => (
                  <TouchableOpacity
                    key={ec.id}
                    style={[
                      styles.colorOption,
                      eyeColor === ec.id && styles.colorOptionSelected,
                    ]}
                    onPress={() => setEyeColor(ec.id)}
                  >
                    <View
                      style={[
                        styles.colorCircle,
                        { backgroundColor: ec.color },
                      ]}
                    />
                    <Text
                      style={[
                        styles.colorText,
                        eyeColor === ec.id && styles.colorTextSelected,
                      ]}
                    >
                      {ec.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {step + 1} of {totalSteps}
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderStep()}
      </ScrollView>

      <View style={styles.footer}>
        {step > 0 && (
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.nextButton,
            !canProceed() && styles.nextButtonDisabled,
            step === 0 && styles.nextButtonFull,
          ]}
          onPress={step === totalSteps - 1 ? handleComplete : handleNext}
          disabled={!canProceed()}
        >
          <Text style={styles.nextButtonText}>
            {step === totalSteps - 1 ? "Complete" : "Continue"}
          </Text>
          <ChevronRight size={20} color={COLORS.background} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  progressBarContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: COLORS.surface,
    borderRadius: 2,
    overflow: "hidden" as const,
    marginBottom: 8,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "center" as const,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  stepContainer: {
    flex: 1,
    alignItems: "center" as const,
    paddingTop: 20,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.surface,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  iconEmoji: {
    fontSize: 40,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: COLORS.text,
    textAlign: "center" as const,
    marginBottom: 12,
  },
  stepSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center" as const,
    marginBottom: 32,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  optionsGrid: {
    width: "100%",
    gap: 12,
  },
  optionCard: {
    backgroundColor: COLORS.surface,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  optionCardSelected: {
    backgroundColor: COLORS.glow,
    borderColor: COLORS.primary,
  },
  optionText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: COLORS.text,
    textAlign: "center" as const,
  },
  optionTextSelected: {
    color: COLORS.primary,
  },
  measurementContainer: {
    width: "100%",
    marginBottom: 24,
  },
  measurementLabel: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: COLORS.text,
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
  },
  measurementInput: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    fontSize: 18,
    fontWeight: "600" as const,
    color: COLORS.text,
  },
  unitToggle: {
    flexDirection: "row" as const,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    overflow: "hidden" as const,
  },
  unitButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  unitButtonActive: {
    backgroundColor: COLORS.primary,
  },
  unitText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: COLORS.textSecondary,
  },
  unitTextActive: {
    color: COLORS.background,
  },
  bodyTypeGrid: {
    width: "100%",
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 12,
  },
  bodyTypeCard: {
    width: (width - 64) / 2,
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 12,
    alignItems: "center" as const,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  bodyTypeCardSelected: {
    backgroundColor: COLORS.glow,
    borderColor: COLORS.primary,
  },
  bodyTypeEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  bodyTypeText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: COLORS.text,
    textAlign: "center" as const,
  },
  bodyTypeTextSelected: {
    color: COLORS.primary,
  },
  locationInput: {
    width: "100%",
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 20,
    fontSize: 18,
    fontWeight: "600" as const,
    color: COLORS.text,
    marginTop: 12,
  },
  colorSection: {
    width: "100%",
    marginBottom: 32,
  },
  colorLabel: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: COLORS.text,
    marginBottom: 16,
  },
  colorGrid: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 12,
  },
  colorOption: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: COLORS.surface,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    gap: 10,
  },
  colorOptionSelected: {
    backgroundColor: COLORS.glow,
    borderColor: COLORS.primary,
  },
  colorCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  colorCircleBorder: {
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  colorText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: COLORS.text,
  },
  colorTextSelected: {
    color: COLORS.primary,
  },
  footer: {
    flexDirection: "row" as const,
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  backButton: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: COLORS.text,
  },
  nextButton: {
    flex: 1,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    gap: 8,
  },
  nextButtonFull: {
    flex: 1,
  },
  nextButtonDisabled: {
    backgroundColor: COLORS.surface,
    opacity: 0.5,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: COLORS.background,
  },
});
