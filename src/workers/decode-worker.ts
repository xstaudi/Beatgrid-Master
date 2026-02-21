import type { DecodeRequest, DecodeResponse, AudioCodec, DecodePhase, PcmData } from '@/types/audio'
import { isNativeCodec } from '@/types/audio'
import { getDecoder, getFfmpegDecoder, releaseAllDecoders } from '@/wasm/loader'
import type { DecoderModule } from '@/wasm/loader'
import { stereoToMono, downsample } from '@/lib/audio/pcm-utils'

const TARGET_SAMPLE_RATE = 22050

function post(msg: DecodeResponse, transfer?: Transferable[]) {
  postMessage(msg, { transfer })
}

function postProgress(trackId: string, phase: DecodePhase, percent: number) {
  post({ type: 'progress', trackId, phase, percent })
}

async function decode(trackId: string, audioData: ArrayBuffer, codec: AudioCodec) {
  try {
    // Phase 1: Load decoder
    postProgress(trackId, 'loading', 5)

    let decoder: DecoderModule
    if (isNativeCodec(codec)) {
      decoder = await getDecoder(codec)
    } else {
      decoder = await getFfmpegDecoder(new Uint8Array(audioData))
    }

    // Phase 2: Decode
    postProgress(trackId, 'decoding', 20)
    const result = await Promise.resolve(decoder.decode(new Uint8Array(audioData)))
    postProgress(trackId, 'decoding', 70)

    // Free FFmpeg decoder immediately (not cached)
    if (!isNativeCodec(codec)) {
      decoder.free()
    }

    // Phase 3: Post-processing (mono + downsample)
    postProgress(trackId, 'processing', 75)
    const mono = stereoToMono(result.channelData)

    postProgress(trackId, 'processing', 85)
    const resampled = downsample(mono, result.sampleRate, TARGET_SAMPLE_RATE)

    const pcm: PcmData = {
      samples: resampled,
      sampleRate: TARGET_SAMPLE_RATE,
      duration: resampled.length / TARGET_SAMPLE_RATE,
      originalSampleRate: result.sampleRate,
      originalChannels: result.channelData.length,
    }

    postProgress(trackId, 'processing', 100)

    // Transfer ArrayBuffer (zero-copy). After transfer, pcm.samples.buffer
    // is detached in this Worker context (length 0). The main thread owns it.
    post(
      { type: 'complete', trackId, pcm },
      [pcm.samples.buffer],
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    const fallbackAvailable = isNativeCodec(codec)
    post({ type: 'error', trackId, message, fallbackAvailable })
  }
}

// Worker message handler
self.onmessage = (event: MessageEvent<DecodeRequest>) => {
  const msg = event.data
  switch (msg.type) {
    case 'decode':
      decode(msg.trackId, msg.audioData, msg.codec)
      break
    case 'ping':
      post({ type: 'ready' })
      break
    case 'terminate':
      releaseAllDecoders()
      self.close()
      break
  }
}

// Signal ready
post({ type: 'ready' })
