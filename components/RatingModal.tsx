import { Star, X, MessageCircle } from "lucide-react-native";
import { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { COLORS } from "../constants/styles";

interface RatingModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (rating: 1 | 2 | 3 | 4 | 5, comment?: string) => void;
  title: string;
  description: string;
  isSubmitting?: boolean;
}

export default function RatingModal({
  visible,
  onClose,
  onSubmit,
  title,
  description,
  isSubmitting = false,
}: RatingModalProps) {
  const [selectedRating, setSelectedRating] = useState<1 | 2 | 3 | 4 | 5 | null>(null);
  const [comment, setComment] = useState<string>("");
  const [showCommentInput, setShowCommentInput] = useState<boolean>(false);

  const handleRatingSelect = (rating: 1 | 2 | 3 | 4 | 5) => {
    setSelectedRating(rating);
    if (rating < 5) {
      setShowCommentInput(true);
    } else {
      setShowCommentInput(false);
      setComment("");
    }
  };

  const handleSubmit = () => {
    if (selectedRating === null) return;
    onSubmit(selectedRating, comment || undefined);
    setSelectedRating(null);
    setComment("");
    setShowCommentInput(false);
  };

  const handleClose = () => {
    setSelectedRating(null);
    setComment("");
    setShowCommentInput(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboardView}
        >
          <View style={styles.modalContainer}>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <X size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>

            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
              bounces={true}
              scrollEnabled={true}
            >
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.description}>{description}</Text>

            <View style={styles.starsContainer}>
              {([1, 2, 3, 4, 5] as const).map((rating) => (
                <TouchableOpacity
                  key={rating}
                  style={styles.starButton}
                  onPress={() => handleRatingSelect(rating)}
                  disabled={isSubmitting}
                >
                  <Star
                    size={40}
                    color={selectedRating && rating <= selectedRating ? "#FFD700" : COLORS.border}
                    fill={selectedRating && rating <= selectedRating ? "#FFD700" : "transparent"}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {showCommentInput && (
              <View style={styles.commentContainer}>
                <View style={styles.commentHeader}>
                  <MessageCircle size={20} color={COLORS.primary} />
                  <Text style={styles.commentLabel}>
                    Help us improve! What could be better?
                  </Text>
                </View>
                <TextInput
                  style={styles.commentInput}
                  placeholder="e.g., Colors don't match, wrong brand mixing..."
                  placeholderTextColor={COLORS.textSecondary}
                  value={comment}
                  onChangeText={setComment}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  editable={!isSubmitting}
                />
              </View>
            )}

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.skipButton}
                onPress={handleClose}
                disabled={isSubmitting}
              >
                <Text style={styles.skipButtonText}>Skip</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  selectedRating === null && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={selectedRating === null || isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Submit</Text>
                )}
              </TouchableOpacity>
            </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  keyboardView: {
    width: "100%",
    maxWidth: 400,
    maxHeight: "90%",
    marginHorizontal: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 40,
    flexGrow: 1,
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "800" as const,
    color: COLORS.text,
    marginBottom: 8,
    textAlign: "center",
  },
  description: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginBottom: 24,
    textAlign: "center",
    lineHeight: 22,
  },
  starsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 20,
  },
  starButton: {
    padding: 4,
  },
  commentContainer: {
    marginBottom: 20,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  commentLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: COLORS.text,
    flex: 1,
  },
  commentInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 100,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  skipButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: COLORS.textSecondary,
  },
  submitButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#FFF",
  },
});
