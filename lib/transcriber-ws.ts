import { logger } from "./logger"
import { getPreSignedUrl } from "./presigned-url"
import { toUtf8, fromUtf8 } from "@aws-sdk/util-utf8-node"
import { EventStreamMarshaller } from "@aws-sdk/eventstream-marshaller"
const WebSocket = require("ws")
const crypto = require("crypto")

const eventStreamMarshaller = new EventStreamMarshaller(toUtf8, fromUtf8)

interface GetPresignedTranscribeUrlParams {
    region: string
    languageCode: string
    sampleRate: number
}

const getPresignedTranscribeUrl = ({ region, languageCode, sampleRate }: GetPresignedTranscribeUrlParams) => {
    return getPreSignedUrl({
        method: 'GET',
        headers: {
            Host: `transcribestreaming.${region}.amazonaws.com:8443`
        },
        path: '/stream-transcription-websocket',
        service: 'transcribe',
        payload: crypto.createHash('sha256').update('', 'utf8').digest('hex'),
        protocol: 'wss',
        expires: 15,
        region,
        queryStr: `language-code=${languageCode}&media-encoding=pcm&sample-rate=${sampleRate}`
    })
}

const handleEventStreamMessage = (messageJson: any) => {
    logger.info(messageJson)
}

interface MakeTranscriberWebSocketParams {
    region: string
    languageCode: string
    sampleRate: number
}

export const makeTranscriberWebSocket = ({ region, languageCode, sampleRate }: MakeTranscriberWebSocketParams) => {
    const presignedTranscribeUrl = getPresignedTranscribeUrl({ region, languageCode, sampleRate })
    const webSocket = new WebSocket(presignedTranscribeUrl)
    webSocket.binaryType = "arraybuffer"
    webSocket.onerror = (ev: Event) => {
        logger.error({ "message": "webSocket error", "error": ev })
    }
    webSocket.onclose = (ev: CloseEvent) => {
        logger.info({ "message": "webSocket close", "closeEvent": ev })
    }
    webSocket.onmessage = (message: MessageEvent) => {
        let messageWrapper = eventStreamMarshaller.unmarshall(new Buffer(message.data))
        let messageBody = JSON.parse(new TextDecoder("utf-8").decode(messageWrapper.body))
        if (messageWrapper.headers[":message-type"].value == "event") {
            handleEventStreamMessage(messageBody)
        } else {
            logger.error(messageBody.Message)
        }
    }
    return webSocket
}