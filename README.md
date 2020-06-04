# What this is

This is a test / proof-of-concept node application for AWS' [streaming transcription service](https://docs.aws.amazon.com/transcribe/latest/dg/streaming.html).

# Status

Currently the mic-to-trancriber integration has a bug that I don't know how to fix.  I believe it's somewhere in the transformation of the audio data provided by the mic stream to the binary data expected by the transcription service.

# Usage

1. 

```
yarn start speaker
```

This pipes the audio data from a readable microphone stream to a writable speaker stream.  **This works** and proves that the provided microphone stream is working as expected.

Note: Since this writes your microphone to your speakers, you're going to get a feedback loop.  Be prepared to quit this when you run it.

2. 

```
yarn start transcriber
```

This pipes the audio data from a readable microphone stream to a writable transcriber stream, backed by a WebSocket connection to AWS' streaming transcription service.  It's heavily based off of AWS' in-browser, mic-transcriber [example](https://github.com/aws-samples/amazon-transcribe-websocket-static).

**This doesn't work** and I'm not sure why.  It is clear, however, that the issue is somewhere in passing the data from the mic to the transcriber and not with sending or receiving data from the service because the WebSocket client comes up correctly and receives responses from the service when requests are made.

You can see this by running `start` with the `transcriber` command.  You'll see periodic log lines that include the responses from the service.  Since the audio data it's receiving is bad, they have no results like the following

```
Transcript: {
    "Results": []
}
```