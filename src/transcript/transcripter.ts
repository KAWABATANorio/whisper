import { ReadStream } from 'node:fs';

export interface ITranscriptClient {
  onMessage: (message: string) => void;
}

export abstract class Transcripter {
  public constructor(protected client: ITranscriptClient) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public init(_filenameBaseIfNeed: string): Promise<void> {
    return Promise.resolve();
  }

  public abstract transcript(oggStream: ReadStream, filenameBaseIfNeed: string): Promise<void>
}
