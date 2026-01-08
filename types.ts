
export interface TranscriptionResult {
  metadata: {
    duration: string;
    speakerCount: number;
    language: string;
  };
  executiveSummary: string;
  transcript: Array<{
    timestamp: string;
    speaker: string;
    text: string;
  }>;
  qaInsights: {
    decisions: string[];
    actionItems: string[];
    pendingQuestions: string[];
  };
  rawMarkdown: string;
}

export enum TranscriptionMode {
  CLEAN_READ = 'Clean Read',
  VERBATIM = 'Verbatim'
}

export interface ProcessingStatus {
  step: 'idle' | 'recording' | 'uploading' | 'analyzing' | 'completed' | 'error';
  message?: string;
}
