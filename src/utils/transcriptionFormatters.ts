
import { TranscriptionSegment, WebVTTFormat, RSTFormat, JSONFormat } from '@/types/transcription';

export const convertToWebVTT = (text: string): string => {
  const lines = text.split('\n');
  return `WEBVTT

${lines.map((line, index) => {
  const match = line.match(/\[(\d{2}:\d{2})\]/);
  if (match) {
    const timestamp = match[1];
    const text = line.replace(/\[\d{2}:\d{2}\]\s*/, '');
    return `${index + 1}
${timestamp}.000 --> ${index < lines.length - 1 ? lines[index + 1].match(/\[(\d{2}:\d{2})\]/)?.[1] : '03:00'}.000
${text}

`;
  }
  return '';
}).join('')}`;
};

export const convertToRST = (text: string): string => {
  const lines = text.split('\n');
  return lines.map(line => {
    const match = line.match(/\[(\d{2}:\d{2})\]\s*(.*)/);
    if (match) {
      return `.. _${match[1].replace(':', '_')}:

${match[2]}
--------------------

`;
    }
    return '';
  }).join('');
};

export const convertToJSON = (text: string): string => {
  const lines = text.split('\n');
  const segments = lines.map(line => {
    const match = line.match(/\[(\d{2}:\d{2})\]\s*(.*)/);
    if (match) {
      return {
        timestamp: match[1],
        text: match[2]
      };
    }
    return null;
  }).filter(Boolean);

  return JSON.stringify({ segments }, null, 2);
};
