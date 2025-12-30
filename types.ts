export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface AnalysisState {
  isAnalyzing: boolean;
  result: string | null;
  error: string | null;
}

export enum FileType {
  IMAGE = 'image',
  TEXT = 'text'
}

export interface UploadedFile {
  data: string; // Base64 string or raw text
  type: FileType;
  mimeType?: string;
  name?: string;
}