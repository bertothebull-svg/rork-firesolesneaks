const BASE_URL = process.env["EXPO_PUBLIC_TOOLKIT_URL"] ?? "http://localhost:3005";

type TextPart = { type: "text"; text: string };
type ImagePart = { type: "image"; image: string };
type UserMessage = { role: "user"; content: string | (TextPart | ImagePart)[] };
type AssistantMessage = { role: "assistant"; content: string | TextPart[] };

export async function safeGenerateText(
  params: string | { messages: (UserMessage | AssistantMessage)[] },
): Promise<string> {
  const GENERATE_TEXT_URL = new URL("/llm/text", BASE_URL).toString();
  const messages =
    typeof params === "string"
      ? [{ role: "user" as const, content: params }]
      : params.messages;

  console.log("[safeGenerateText] Calling:", GENERATE_TEXT_URL);
  console.log("[safeGenerateText] Messages count:", messages.length);

  const response = await fetch(GENERATE_TEXT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ messages }),
  });

  console.log("[safeGenerateText] Response status:", response.status);

  if (!response.ok) {
    const errorText = await response.text().catch(() => "unknown error");
    console.error("[safeGenerateText] API error:", response.status, errorText.substring(0, 300));

    if (response.status === 429) {
      throw new Error("AI rate limit reached. Please wait a moment and try again.");
    }
    if (response.status >= 500) {
      throw new Error("AI service is temporarily unavailable. Please try again in a moment.");
    }
    throw new Error(`AI request failed (${response.status}). Please try again.`);
  }

  let data: any;
  try {
    const rawText = await response.text();
    console.log("[safeGenerateText] Raw response length:", rawText.length);
    console.log("[safeGenerateText] Raw response preview:", rawText.substring(0, 200));
    data = JSON.parse(rawText);
  } catch (parseErr) {
    console.error("[safeGenerateText] Failed to parse response JSON:", parseErr);
    throw new Error("AI returned an invalid response. Please try again.");
  }

  const completion = data?.completion ?? data?.text ?? data?.result ?? data?.content;

  if (!completion || typeof completion !== "string" || completion.trim().length === 0) {
    console.error("[safeGenerateText] No completion in response. Keys:", Object.keys(data || {}));
    console.error("[safeGenerateText] Full response:", JSON.stringify(data).substring(0, 500));
    throw new Error("AI returned an empty response. Please try again.");
  }

  console.log("[safeGenerateText] Success, completion length:", completion.length);
  return completion;
}
