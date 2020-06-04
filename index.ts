import { logger } from "./lib/logger"
import { makeTranscriber } from "./lib/transcriber"
const mic = require('mic-stream')

if (process.argv.length < 3) {
    logger.error({ "message": "missing required writable, choose one of 'speaker' or 'transcriber'" })
    process.exit(1)
}

if (process.argv[2] == 'speaker') {
    const Speaker = require('speaker')
    mic().pipe(new Speaker())
}

if (process.argv[2] == 'transcriber') {
    const fs = require('fs')
    const lines = fs.readFileSync('env-vars').toString().split("\n")
    for (const line of lines) {
        const [k, v] = line.split("=")
        process.env[k] = v
    }
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.SESSION_TOKEN) {
        logger.error({ "message": "missing required env vars" })
        process.exit(1)
    }
    mic().pipe(makeTranscriber({ region: 'us-east-1', languageCode: 'en-US', inSampleRate: 44100, sampleRate: 44100 }))
}
