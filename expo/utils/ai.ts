import { generateText } from "@rork-ai/toolkit-sdk";
import * as FileSystem from "expo-file-system";
import { Platform } from "react-native";

type TextPart = { type: "text"; text: string };
type ImagePart = { type: "image"; image: string };
type UserMessage = { role: "user"; content: string | (TextPart | ImagePart)[] };
type AssistantMessage = { role: "assistant"; content: string | TextPart[] };

export async function convertImageToBase64(uri: string): Promise<string> {
  console.log("[convertImageToBase64] Input URI type:", uri.startsWith('file://') ? 'file://' : uri.startsWith('data:') ? 'data:' : uri.startsWith('http') ? 'http' : 'other');
  console.log("[convertImageToBase64] URI preview:", uri.substring(0, 80));

  if (uri.startsWith('data:image/')) {
    console.log("[convertImageToBase64] Already base64, returning as-is");
    return uri;
  }

  if (uri.startsWith('http://') || uri.startsWith('https://')) {
    console.log("[convertImageToBase64] HTTP URL, returning as-is");
    return uri;
  }

  if (Platform.OS !== 'web') {
    try {
      console.log("[convertImageToBase64] Using expo-file-system for native base64 conversion");
      const fileUri = uri.startsWith('file://') ? uri : `file://${uri}`;
      
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      console.log("[convertImageToBase64] File exists:", fileInfo.exists);
      if (!fileInfo.exists) {
        console.error("[convertImageToBase64] File does not exist:", fileUri);
        throw new Error("Image file not found");
      }

      const base64 = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      console.log("[convertImageToBase64] Successfully read base64, length:", base64.length);

      const extension = uri.split('.').pop()?.toLowerCase() || 'jpeg';
      const mimeType = extension === 'png' ? 'image/png' : 'image/jpeg';
      const result = `data:${mimeType};base64,${base64}`;
      console.log("[convertImageToBase64] Final base64 URI prefix:", result.substring(0, 40));
      return result;
    } catch (fsError) {
      console.error("[convertImageToBase64] expo-file-system failed:", fsError);
      console.log("[convertImageToBase64] Falling back to fetch/blob method...");
    }
  }

  try {
    console.log("[convertImageToBase64] Using fetch/blob/FileReader method (web fallback)");
    const response = await fetch(uri);
    if (!response.ok) {
      throw new Error(`Fetch failed with status ${response.status}`);
    }
    const blob = await response.blob();
    console.log("[convertImageToBase64] Blob size:", blob.size, "type:", blob.type);
    
    const reader = new FileReader();
    const base64Image = await new Promise<string>((resolve, reject) => {
      reader.onloadend = () => {
        const result = reader.result as string;
        if (result && result.startsWith('data:')) {
          resolve(result);
        } else {
          reject(new Error("FileReader did not return valid base64"));
        }
      };
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(blob);
    });
    console.log("[convertImageToBase64] FileReader success, length:", base64Image.length);
    return base64Image;
  } catch (fetchError) {
    console.error("[convertImageToBase64] Fetch/blob method also failed:", fetchError);
    throw new Error("Failed to convert image to base64. Please try a different photo.");
  }
}

export async function safeGenerateText(
  params: string | { messages: (UserMessage | AssistantMessage)[] },
): Promise<string> {
  console.log("[safeGenerateText] Calling SDK generateText");
  
  const messages =
    typeof params === "string"
      ? [{ role: "user" as const, content: params }]
      : params.messages;

  console.log("[safeGenerateText] Messages count:", messages.length);

  let hasImages = false;
  for (const msg of messages) {
    if (Array.isArray(msg.content)) {
      for (const part of msg.content) {
        if ('type' in part && part.type === 'image') {
          hasImages = true;
          const imgPart = part as ImagePart;
          console.log("[safeGenerateText] Message contains image, prefix:", imgPart.image.substring(0, 40));
        }
      }
    }
  }
  console.log("[safeGenerateText] Contains images:", hasImages);

  try {
    const result = await generateText({ messages });
    console.log("[safeGenerateText] Success, result length:", result?.length || 0);
    console.log("[safeGenerateText] Result preview:", result?.substring(0, 200));
    
    if (!result || typeof result !== 'string' || result.trim().length === 0) {
      throw new Error("AI returned an empty response. Please try again.");
    }
    
    return result;
  } catch (error) {
    console.error("[safeGenerateText] SDK generateText error:", error);
    if (error instanceof Error) {
      if (error.message.includes('rate limit') || error.message.includes('429')) {
        throw new Error("AI rate limit reached. Please wait a moment and try again.");
      }
      throw error;
    }
    throw new Error("AI request failed. Please try again.");
  }
}
