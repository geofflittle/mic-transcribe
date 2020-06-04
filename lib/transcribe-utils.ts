import { downsampleBuffer, pcmEncode } from "./audio-utils"
import { toUtf8, fromUtf8 } from "@aws-sdk/util-utf8-node"
import { EventStreamMarshaller, Message } from "@aws-sdk/eventstream-marshaller"

const eventStreamMarshaller = new EventStreamMarshaller(toUtf8, fromUtf8)

const getAudioEventMessage = (buffer: Buffer): Message => ({
    headers: {
        ':message-type': {
            type: 'string',
            value: 'event'
        },
        ':event-type': {
            type: 'string',
            value: 'AudioEvent'
        }
    },
    body: buffer
})

export const convertAudioToBinaryMessage = (chunk: any, inSampleRate: number, outSampleRate: number) => {
    const downsampledBuffer = downsampleBuffer(chunk, inSampleRate, outSampleRate)
    const pcmEncodedBuffer = pcmEncode(downsampledBuffer)
    const audioEventMessage = getAudioEventMessage(Buffer.from(pcmEncodedBuffer))
    return eventStreamMarshaller.marshall(audioEventMessage)
}