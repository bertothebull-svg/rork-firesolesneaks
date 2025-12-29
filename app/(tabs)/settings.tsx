import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import { Stack } from "expo-router";
import { Download, Upload, Trash2, Info } from "lucide-react-native";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import { File, Paths } from "expo-file-system";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useWardrobe, useWardrobeStats } from "../../contexts/WardrobeContext";
import { COLORS } from "../../constants/styles";

const WARDROBE_STORAGE_KEY = "wardrobe_items";
const OUTFITS_STORAGE_KEY = "saved_outfits";

export default function SettingsScreen() {
  const { items, outfits, deleteAllItems } = useWardrobe();
  const stats = useWardrobeStats();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      console.log("[Export] Starting export...");

      const exportData = {
        version: "1.0",
        exportDate: new Date().toISOString(),
        wardrobe: items,
        outfits: outfits,
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      console.log("[Export] Data prepared, size:", jsonString.length);

      if (Platform.OS === "web") {
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `wardrobe-backup-${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        console.log("[Export] Web export completed");
        Alert.alert("Success", "Wardrobe exported successfully!");
      } else {
        const fileName = `wardrobe-backup-${Date.now()}.json`;
        const file = new File(Paths.cache, fileName);
        
        file.create({ overwrite: true });
        file.write(jsonString);
        
        console.log("[Export] File created at:", file.uri);

        const isAvailable = await Sharing.isAvailableAsync();
        console.log("[Export] Sharing available:", isAvailable);

        if (isAvailable) {
          await Sharing.shareAsync(file.uri, {
            mimeType: "application/json",
            dialogTitle: "Export Wardrobe Backup",
          });
          console.log("[Export] Share dialog completed");
        } else {
          Alert.alert(
            "Export Complete",
            `File saved to: ${fileName}\n\nYou can find it in your app's cache directory.`
          );
        }
      }
    } catch (error) {
      console.error("[Export] Error:", error);
      Alert.alert("Export Error", `Failed to export wardrobe: ${error}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async () => {
    try {
      setIsImporting(true);
      console.log("[Import] Starting import...");

      if (Platform.OS === "web") {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "application/json,.json";
        input.onchange = async (e: any) => {
          const file = e.target.files?.[0];
          if (!file) {
            console.log("[Import] No file selected");
            setIsImporting(false);
            return;
          }

          try {
            const text = await file.text();
            await processImportData(text);
          } catch (error) {
            console.error("[Import] Error processing file:", error);
            Alert.alert("Import Error", `Failed to read file: ${error}`);
            setIsImporting(false);
          }
        };
        input.click();
      } else {
        const result = await DocumentPicker.getDocumentAsync({
          type: "application/json",
          copyToCacheDirectory: true,
        });

        console.log("[Import] Picker result:", result);

        if (result.canceled || !result.assets || result.assets.length === 0) {
          console.log("[Import] User cancelled or no file selected");
          setIsImporting(false);
          return;
        }

        const asset = result.assets[0];
        console.log("[Import] Reading file from:", asset.uri);
        
        let content: string;
        try {
          const file = new File(asset.uri);
          const rawContent = await file.text();
          
          console.log("[Import] Raw content type:", typeof rawContent);
          console.log("[Import] Raw content:", rawContent);
          
          if (typeof rawContent === 'object' && rawContent !== null) {
            content = JSON.stringify(rawContent);
            console.log("[Import] Converted object to string");
          } else if (typeof rawContent === 'string') {
            content = rawContent;
          } else {
            throw new Error(`Unexpected content type: ${typeof rawContent}`);
          }
          
          console.log("[Import] File content length:", content?.length || 0);
          console.log("[Import] File content preview:", content?.substring(0, 100));
        } catch (readError) {
          console.error("[Import] Error reading file:", readError);
          Alert.alert("Import Error", "Failed to read the file. Please try again.");
          setIsImporting(false);
          return;
        }
        
        if (!content || typeof content !== 'string') {
          console.error("[Import] Invalid content type:", typeof content);
          Alert.alert("Import Error", "The file appears to be empty or invalid.");
          setIsImporting(false);
          return;
        }

        await processImportData(content);
      }
    } catch (error) {
      console.error("[Import] Error:", error);
      Alert.alert("Import Error", `Failed to import wardrobe: ${error}`);
      setIsImporting(false);
    }
  };

  const processImportData = async (jsonString: string) => {
    try {
      console.log("[Import] Processing data, type:", typeof jsonString);
      console.log("[Import] Processing data, length:", jsonString?.length || 0);
      console.log("[Import] First 100 chars:", jsonString?.substring(0, 100));
      
      if (!jsonString || typeof jsonString !== 'string') {
        throw new Error("Invalid data format: expected string, got " + typeof jsonString);
      }
      
      const trimmedData = jsonString.trim();
      if (trimmedData.length === 0) {
        throw new Error("File is empty");
      }
      
      if (!trimmedData.startsWith('{') && !trimmedData.startsWith('[')) {
        throw new Error("File does not contain valid JSON data");
      }

      const importData = JSON.parse(trimmedData);
      console.log("[Import] Parsed data:", {
        version: importData.version,
        wardrobeCount: importData.wardrobe?.length,
        outfitsCount: importData.outfits?.length,
      });

      if (!importData.wardrobe || !Array.isArray(importData.wardrobe)) {
        throw new Error("Invalid backup file format");
      }

      Alert.alert(
        "Import Wardrobe",
        `This will import:\n• ${importData.wardrobe.length} items\n• ${importData.outfits?.length || 0} outfits\n\nYour current data will be replaced. Continue?`,
        [
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => {
              console.log("[Import] User cancelled");
              setIsImporting(false);
            },
          },
          {
            text: "Import",
            style: "destructive",
            onPress: async () => {
              try {
                await AsyncStorage.setItem(
                  WARDROBE_STORAGE_KEY,
                  JSON.stringify(importData.wardrobe)
                );
                await AsyncStorage.setItem(
                  OUTFITS_STORAGE_KEY,
                  JSON.stringify(importData.outfits || [])
                );

                console.log("[Import] Data saved to AsyncStorage");

                Alert.alert(
                  "Success",
                  "Wardrobe imported successfully! Please restart the app to see your imported items.",
                  [
                    {
                      text: "OK",
                      onPress: () => {
                        if (Platform.OS !== "web") {
                          console.log("[Import] Reloading app...");
                        }
                      },
                    },
                  ]
                );
              } catch (error) {
                console.error("[Import] Error saving data:", error);
                Alert.alert("Import Error", `Failed to save imported data: ${error}`);
              } finally {
                setIsImporting(false);
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error("[Import] Error processing data:", error);
      Alert.alert("Import Error", `Invalid backup file format: ${error}`);
      setIsImporting(false);
    }
  };

  const handleDeleteAll = () => {
    Alert.alert(
      "Delete All Items",
      "Are you sure you want to delete all wardrobe items and outfits? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete All",
          style: "destructive",
          onPress: () => {
            console.log("[Delete] Deleting all items");
            deleteAllItems();
            Alert.alert("Success", "All items deleted successfully");
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Settings",
          headerStyle: {
            backgroundColor: COLORS.background,
          },
          headerTintColor: COLORS.text,
        }}
      />
      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Info size={20} color={COLORS.text} />
            <Text style={styles.sectionTitle}>Wardrobe Stats</Text>
          </View>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.totalItems}</Text>
              <Text style={styles.statLabel}>Total Items</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{outfits.length}</Text>
              <Text style={styles.statLabel}>Saved Outfits</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                ${stats.totalValue.toLocaleString()}
              </Text>
              <Text style={styles.statLabel}>Total Value</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Backup & Restore</Text>
          <Text style={styles.sectionDescription}>
            Export your wardrobe to back it up or transfer to another device.
            Import to restore from a backup file.
          </Text>

          <TouchableOpacity
            style={[styles.button, styles.exportButton]}
            onPress={handleExport}
            disabled={isExporting || items.length === 0}
            testID="export-button"
          >
            <Download size={20} color={COLORS.background} />
            <Text style={styles.buttonText}>
              {isExporting ? "Exporting..." : "Export Wardrobe"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.importButton]}
            onPress={handleImport}
            disabled={isImporting}
            testID="import-button"
          >
            <Upload size={20} color={COLORS.background} />
            <Text style={styles.buttonText}>
              {isImporting ? "Importing..." : "Import Wardrobe"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danger Zone</Text>
          <Text style={styles.sectionDescription}>
            Permanently delete all wardrobe items and outfits. This action cannot
            be undone.
          </Text>

          <TouchableOpacity
            style={[styles.button, styles.deleteButton]}
            onPress={handleDeleteAll}
            disabled={items.length === 0}
            testID="delete-all-button"
          >
            <Trash2 size={20} color={COLORS.background} />
            <Text style={styles.buttonText}>Delete All Items</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Backup files are saved in JSON format and can be shared across devices.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sectionHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: COLORS.text,
    marginBottom: 6,
  },
  sectionDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: "row" as const,
    justifyContent: "space-around" as const,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
  },
  statItem: {
    alignItems: "center" as const,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "600" as const,
    color: COLORS.primary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  button: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 10,
  },
  exportButton: {
    backgroundColor: COLORS.primary,
  },
  importButton: {
    backgroundColor: "#10b981",
  },
  deleteButton: {
    backgroundColor: "#ef4444",
  },
  buttonText: {
    color: COLORS.background,
    fontSize: 14,
    fontWeight: "600" as const,
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "center" as const,
    lineHeight: 18,
  },
});
