import { getAssistantContext } from "./dateParser";

/**
 * Calls the backend Gemini proxy to process AI requests.
 * This keeps the API key secure on the server.
 */
export async function runAssistant(inputText: string, imageFile?: File, context?: any) {
  const assistantContext = getAssistantContext();
  const fullContext = { ...assistantContext, ...context };

  try {
    const formData = new FormData();
    formData.append("prompt", inputText);
    formData.append("context", JSON.stringify(fullContext));
    
    if (imageFile) {
      formData.append("image", imageFile);
    }

    const response = await fetch("/api/gemini", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error("Assistant Request Failed:", error);
    throw error;
  }
}


