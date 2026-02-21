/**
 * Pure TypeScript Chromaprint Fingerprint Encoder.
 * Encodes raw Int32Array fingerprints to AcoustID-compatible base64 strings.
 *
 * Based on Chromaprint's FingerprintCompressor:
 * https://github.com/nickvdp/chromaprint-encode
 */

const NORMAL_BITS = 3
const MAX_NORMAL_VALUE = (1 << NORMAL_BITS) - 1 // 7

/**
 * Encode a raw Chromaprint fingerprint to AcoustID-compatible base64 string.
 *
 * @param rawFingerprint - Raw fingerprint from generateFingerprint()
 * @param algorithm - Chromaprint algorithm (default: 1)
 * @returns Base64-encoded compressed fingerprint string for AcoustID API
 */
export function encodeFingerprint(rawFingerprint: Int32Array, algorithm = 1): string {
  if (rawFingerprint.length === 0) return ''

  // Step 1: Gray code + XOR delta encode
  const bits: number[][] = Array.from({ length: 16 }, () => [])

  for (let i = 0; i < rawFingerprint.length; i++) {
    let value: number
    if (i === 0) {
      value = grayCode(rawFingerprint[0] >>> 0)
    } else {
      value = grayCode(rawFingerprint[i] >>> 0) ^ grayCode(rawFingerprint[i - 1] >>> 0)
    }
    processSubfingerprint(value, bits)
  }

  // Step 2: Pack bits (separate normal and exception values)
  const packed: { normalBits: number[]; exceptionBits: number[] }[] = []
  for (let i = 0; i < 16; i++) {
    packed.push(packBits(bits[i]))
  }

  // Step 3: Write to bit string (LSB first, matching Chromaprint C implementation)
  const writer = new BitStringWriter()
  writer.write(algorithm, 8)
  writer.write(rawFingerprint.length & 0xffff, 16)

  for (let i = 0; i < 16; i++) {
    writeNormalValues(writer, packed[i].normalBits)
    writeExceptionValues(writer, packed[i].exceptionBits)
  }

  // Step 4: Base64 encode
  return base64Encode(writer.toBytes())
}

function grayCode(n: number): number {
  return (n >>> 1) ^ n
}

/**
 * Extract set bits from a sub-fingerprint value.
 * For each of the 16 bit positions, records the distance from the last set bit.
 */
function processSubfingerprint(x: number, bits: number[][]): void {
  let bit = 1
  let lastBit = 0
  for (let i = 0; i < 16; i++) {
    if (x & bit) {
      bits[i].push(i - lastBit)
      lastBit = i
    }
    bit <<= 1
  }
}

/**
 * Separate values into normal (< MAX_NORMAL_VALUE) and exceptions.
 */
function packBits(values: number[]): { normalBits: number[]; exceptionBits: number[] } {
  const normalBits: number[] = []
  const exceptionBits: number[] = []

  for (const value of values) {
    if (value < MAX_NORMAL_VALUE) {
      normalBits.push(value)
    } else {
      normalBits.push(MAX_NORMAL_VALUE)
      exceptionBits.push(value - MAX_NORMAL_VALUE)
    }
  }

  return { normalBits, exceptionBits }
}

function writeNormalValues(writer: BitStringWriter, values: number[]): void {
  for (const value of values) {
    writer.write(value, NORMAL_BITS)
  }
}

function writeExceptionValues(writer: BitStringWriter, values: number[]): void {
  for (const value of values) {
    writer.write(value, 5)
  }
}

/**
 * Bit string writer (LSB first, matching Chromaprint's BitStringWriter).
 */
class BitStringWriter {
  private value = 0
  private bufferBits = 0
  private result: number[] = []

  write(x: number, bits: number): void {
    this.value |= (x << this.bufferBits)
    this.bufferBits += bits
    while (this.bufferBits >= 8) {
      this.result.push(this.value & 0xff)
      this.value >>>= 8
      this.bufferBits -= 8
    }
  }

  toBytes(): Uint8Array {
    if (this.bufferBits > 0) {
      this.result.push(this.value & 0xff)
    }
    return new Uint8Array(this.result)
  }
}

function base64Encode(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}
