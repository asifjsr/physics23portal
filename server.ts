import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import multer from "multer";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Configure Multer for in-memory file storage
  const upload = multer({ storage: multer.memoryStorage() });

  // API routes FIRST
  app.use(express.json());

  app.post("/api/gemini", upload.single("image"), async (req, res) => {
    try {
      const activeKey = process.env.GEMINI_API_KEY;
      
      if (!activeKey || activeKey === "MY_GEMINI_API_KEY") {
        return res.status(500).json({ 
          error: "GEMINI_API_KEY is not configured in the server environment. Please add it via the Settings > Secrets panel in the AI Studio UI." 
        });
      }

      const { prompt, context } = req.body;
      const imageFile = req.file;

      const ai = new GoogleGenAI({
        apiKey: activeKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const modelName = imageFile ? "gemini-3-flash-preview" : "gemini-3-flash-preview";
      
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

      const contents: any = [{ role: 'user', parts: [{ text: `Context: ${context}\n\nUser Input: ${prompt}` }] }];

      if (imageFile) {
        contents[0].parts.push({
          inlineData: {
            mimeType: imageFile.mimetype,
            data: imageFile.buffer.toString("base64"),
          },
        });
      }

      const response = await ai.models.generateContent({
        model: modelName,
        contents,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
        },
      });

      const text = response.text;
      if (!text) {
        throw new Error("No response from Gemini");
      }

      try {
        const cleanedText = text.replace(/```json|```/g, "").trim();
        res.json(JSON.parse(cleanedText));
      } catch (parseError) {
        console.error("AI Response Parsing Failed:", text);
        res.json({
          action: "answer_question_only",
          confidence: 0,
          needsConfirmation: false,
          message: text,
          data: {}
        });
      }
    } catch (error: any) {
      console.error("Gemini AI API Error:", error);
      res.status(error.status || 500).json({ error: error.message || "An error occurred during AI processing." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

