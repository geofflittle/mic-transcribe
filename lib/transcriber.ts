import { Writable } from 'stream'
import { convertAudioToBinaryMessage } from "./transcribe-utils"
import { makeTranscriberWebSocket } from "./transcriber-ws"

interface MakeTranscriberParams {
    region: string
    languageCode: string
    inSampleRate: number
    sampleRate: number
}

export const makeTranscriber = ({ region, languageCode, inSampleRate, sampleRate }: MakeTranscriberParams) => {
    const webSocket = makeTranscriberWebSocket({ region, languageCode, sampleRate })
    return new Writable({
        write: (chunk: any, encoding: BufferEncoding, callback: (error?: Error | null) => void) => {
            const binary = convertAudioToBinaryMessage(chunk, inSampleRate, sampleRate)
            if (webSocket.readyState !== webSocket.OPEN) {
                callback(null)
                return
            }
            webSocket.send(binary)
            callback(null)
        }
    })
}