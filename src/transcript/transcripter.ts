import { ReadStream } from 'node:fs';

export interface ITranscriptClient {
  onMessage: (message: string) => void;
}

export abstract class Transcripter {
  public constructor(protected client: ITranscriptClient) {}

  public abstract transcript(oggStream: ReadStream, filenameBaseIfNeed: string): Promise<void>
}
