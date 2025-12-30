import { GoogleGenAI, Chat, GenerateContentResponse, Type, Schema } from "@google/genai";
import { UploadedFile, FileType } from "../types";

// Schema for strict JSON structure
const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING, description: "A 2-3 sentence overview of the medical results." },
    sections: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "Title of the section (e.g., 'Full Blood Count')." },
          content: { type: Type.STRING, description: "Content of the section with simple markdown for bolding/lists." },
        },
        required: ["title", "content"],
      },
      description: "Detailed sections analyzing the medical data.",
    },
    questions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "3 suggested follow-up questions for the doctor.",
    },
  },
  required: ["summary", "sections", "questions"],
};

const SYSTEM_INSTRUCTION = `
You are MediClear, a premium medical diagnostic assistant.
Your goal is to analyze medical data (text or images) and return a structured JSON response.

GUIDELINES:
1. **Content Style**:
   - Use plain English.
   - Explain jargon immediately.
   - Be objective and calm.
2. **Safety**:
   - Do NOT diagnose.
   - Flag critical values clearly within the content.
`;

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing");
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeMedicalData = async (file: UploadedFile, userNotes: string): Promise<string> => {
  const ai = getClient();
  
  const promptText = userNotes 
    ? `Patient Notes: "${userNotes}". Analyze the attached medical data.`
    : "Analyze this medical data.";

  const contents: any[] = [];
  
  if (file.type === FileType.IMAGE && file.mimeType) {
    const base64Data = file.data.includes('base64,') 
      ? file.data.split('base64,')[1] 
      : file.data;

    contents.push({
      inlineData: {
        mimeType: file.mimeType,
        data: base64Data
      }
    });
    contents.push({ text: promptText });
  } else {
    contents.push({ text: `${promptText}\n\nMedical Data:\n${file.data}` });
  }

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: { parts: contents },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.2, 
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });
    
    return response.text || "{}";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw new Error("Failed to analyze the medical data.");
  }
};

export const createChatSession = (initialContext: string) => {
  const ai = getClient();
  const chat: Chat = ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: `You are a helpful medical assistant explaining the analysis to a patient. 
      Keep answers short, clear, and reassuring. 
      Use the provided JSON context to answer questions about the specific results.
      Context: ${initialContext}`,
    },
  });
  return chat;
};

export const sendChatMessage = async (chat: Chat, message: string): Promise<string> => {
  try {
    const response: GenerateContentResponse = await chat.sendMessage({ message });
    return response.text || "I didn't understand that.";
  } catch (error) {
    console.error("Chat Error:", error);
    throw new Error("Failed to send message.");
  }
};