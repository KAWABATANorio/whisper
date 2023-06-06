import { SpeechToText } from './speech-to-text';
import { ITranscriptClient, Transcripter } from './transcripter';
import { Whisper } from './whisper';

export enum TranscriptMethod {
  Whisper = 1,
  SpeechToText = 2,
};

export function transcripterFactory(client: ITranscriptClient, method: TranscriptMethod | undefined = undefined): Transcripter {
  switch (method) {
  case TranscriptMethod.Whisper:
  default:
    return new Whisper(client);
  case TranscriptMethod.SpeechToText:
    return new SpeechToText(client);
  }
}
