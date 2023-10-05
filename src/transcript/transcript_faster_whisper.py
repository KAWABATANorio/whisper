import sys
import time
from faster_whisper import WhisperModel

if __name__ == "__main__":
    model = WhisperModel(
        "large-v2",
        device="cuda",
        compute_type="float16",
    )

    # print("ready.")

    try:
        while True:
            paths = sys.stdin.readline().splitlines()
            for path in paths:
                start = time.perf_counter()
                print(path)
                f = open(path, "rb")
                segments, info = model.transcribe(
                    f,
                    beam_size=5,
                    # word_timestamps=True,
                    language="ja",
                    vad_filter=True,
                    vad_parameters=dict(min_silence_duration_ms=250)
                )
                f.close()

                # print(time.perf_counter() - start)

                message = "[result]"
                for segment in segments:
                    # print("[%.2fs -> %.2fs] %s" % (segment.start, segment.end, segment.text))
                    message += segment.text
                print(message)

    except KeyboardInterrupt:
        print("Interrupted.")
    except Exception as e:
        print(e)
