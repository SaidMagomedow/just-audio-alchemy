
export interface TranscriptionSegment {
  start: number;
  end: number;
  text: string;
}

export interface WebVTTFormat {
  segments: TranscriptionSegment[];
}

export interface RSTFormat {
  content: string;
}

export interface JSONFormat {
  segments: {
    timestamp: string;
    text: string;
  }[];
}
