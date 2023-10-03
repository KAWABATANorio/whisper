import { SpeechToText } from './speech-to-text';
import { ITranscriptClient, Transcripter } from './transcripter';
import { Whisper } from './whisper';
import { FasterWhisper } from './faster-whisper';

export enum TranscriptMethod {
  Whisper = 1,
  FasterWhisper = 2,
  SpeechToText = 3,
};

export function transcripterFactory(client: ITranscriptClient, method: TranscriptMethod | string | undefined = undefined): Transcripter {
  if (typeof method == 'string') method = parseInt(method)
  switch (method) {
  case TranscriptMethod.Whisper:
  default:
    return new Whisper(client);
  case TranscriptMethod.FasterWhisper:
    return new FasterWhisper(client);
  case TranscriptMethod.SpeechToText:
    return new SpeechToText(client);
  }
}
