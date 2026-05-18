import { app } from "./firebase";
import { getAssistantContext } from "./dateParser";

// Type-only imports (erased at runtime)
import type { GenerativeModel, AI } from "@firebase/ai";

// Use Gemini Flash models order
const MODELS = [
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-2.5-flash"
];

const PRO_MODEL_NAME = "gemini-2.0-flash"; 

let aiInstance: AI | null = null;
let activeModel: GenerativeModel | null = null;
let proModelInstance: GenerativeModel | null = null;

const SYSTEM_INSTRUCTION = `
You are ClassVerse Academic Assistant for a Physics batch website.
You understand Bangla, Banglish, and English mixed human language.
You must return ONLY valid JSON.
Never return markdown.
Never wrap JSON in code fences.
Never invent missing required fields.
If required information is missing, ask a short follow-up question.
If the user asks to add, save, update, delete, upload, create, or modify anything, set needsConfirmation to true.
Never write directly to Firestore by yourself.
The app will show a preview first, then save only after user confirmation.
Use user's local date and timezone from context.
Correctly understand today, tomorrow, next weekday, ajke, kal, porshu.
If the user says today, use the actual local date from context.

Data formats:
- add_task: { title, description, priority, dueDate }
- add_assessment: { title, courseName, courseCode, type, dueDate, time, marks, description }
- add_routine: { courseName, courseCode, dayName, date, time, room, teacher }
- add_calendar_event: { title, type, courseName, courseCode, date, time, room, description }
- add_notice: { title, message, priority, targetAudience, pinned, expiryDate }
- extract_people_from_text: { people: [{ studentId, name, role, position, discipline, bio, imageUrl }] }
- extract_marks_from_image: { courseName, courseCode, section, ctNumber, totalMarks, rows: [{ studentId, name, mark, confidence }] }
- extract_attendance_from_image: { courseName, courseCode, section, totalMarks, rows: [{ studentId, name, attendance, confidence }] }
`;

/**
 * Lazy loading AI components to prevent blocking app startup
 */
async function getAI() {
  if (!aiInstance) {
    try {
      // Use Firebase AI Logic (Developer API)
      const { getAI, GoogleAIBackend } = await import("@firebase/ai");
      aiInstance = getAI(app, { 
        backend: new GoogleAIBackend() 
      });
      console.log("POWERED BY GEMINI AI: Firebase AI Logic Initialized");
    } catch (error) {
      console.error("Failed to initialize Firebase AI Logic:", error);
      throw error;
    }
  }
  return aiInstance;
}

export async function fileToGenerativePart(file: File): Promise<{ inlineData: { data: string; mimeType: string } }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = (reader.result as string).split(",")[1];
      resolve({
        inlineData: {
          data: base64data,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function runAssistant(inputText: string, imageFile?: File, context?: any) {
  const assistantContext = getAssistantContext();
  const fullContext = { ...assistantContext, ...context };
  
  const prompt = `
  Context: ${JSON.stringify(fullContext)}
  User Input: ${inputText}
  `;

  let retryIndex = 0;
  const maxRetries = MODELS.length;

  while (retryIndex < maxRetries) {
    let currentModelName = imageFile ? PRO_MODEL_NAME : MODELS[retryIndex];
    
    try {
      const ai = await getAI();
      const { getGenerativeModel } = await import("@firebase/ai");
      
      const model = getGenerativeModel(ai, { 
        model: currentModelName,
        systemInstruction: SYSTEM_INSTRUCTION,
        generationConfig: { responseMimeType: "application/json" }
      });

      console.log(`Attempting Gemini request with model: ${currentModelName}`);

      let result;
      if (imageFile) {
        const imagePart = await fileToGenerativePart(imageFile);
        result = await model.generateContent([prompt, imagePart]);
      } else {
        result = await model.generateContent(prompt);
      }

      const response = await result.response;
      const text = response.text();
      
      // If we got here, this model works
      if (!imageFile) {
        console.log("Gemini model success:", currentModelName);
        activeModel = model; 
      }
      
      try {
        const cleanedText = text.replace(/```json|```/g, "").trim();
        return JSON.parse(cleanedText);
      } catch (parseError) {
        console.error("AI Response Parsing Failed:", text);
        return {
          action: "answer_question_only",
          confidence: 0,
          needsConfirmation: false,
          message: text,
          data: {}
        };
      }
    } catch (error: any) {
      console.error(`Gemini AI API Error (Model: ${currentModelName}):`, error);

      const status = error?.status || error?.code;
      const errorMsg = error.message || "";

      // Handle 429 Too Many Requests
      if (status === 429 || errorMsg.includes("429")) {
        // If limit is 0, it means this model is disabled for the project
        // We should try the next model instead of showing a wait message
        if (errorMsg.includes("limit: 0") && !imageFile && retryIndex < maxRetries - 1) {
          console.warn(`Model ${currentModelName} has 0 limit, trying fallback...`);
          retryIndex++;
          continue;
        }

        // Try to extract retry delay if available
        let retryDelay = "about 1 minute";
        const delayMatch = errorMsg.match(/retryDelay":"(\d+s)"/) || errorMsg.match(/retry in (\d+\.?\d*s)/);
        if (delayMatch) {
          retryDelay = delayMatch[1];
        }

        throw new Error(`AI limit reached. Please wait ${retryDelay} and try again.`);
      }

      // If it's a 404 or "not found" error, try next model if not using Pro
      if (!imageFile && (status === 404 || errorMsg.includes("not found"))) {
        console.warn(`Model ${currentModelName} not available, attempting fallback...`);
        retryIndex++;
        if (retryIndex < maxRetries) continue;
      }

      // Specific error mapping for Firebase ML API
      if (status === 403 && (errorMsg.includes("Firebase ML API") || errorMsg.includes("is not enabled"))) {
        throw new Error("Firebase ML API is disabled. Enable Firebase ML API in Google Cloud Console, wait 5 minutes, then try again.");
      }
      
      if (status === 401 || status === 403) {
        throw new Error("AI permission error. Check Firebase AI Logic setup and API access.");
      }

      throw error;
    }
  }

  throw new Error(`AI initialization failed. All attempted models (${MODELS.join(", ")}) are currently unavailable or quota-limited.`);
}
