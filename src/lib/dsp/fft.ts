/**
 * Radix-2 Cooley-Tukey FFT (in-place, iterative).
 * Input arrays must be power-of-2 length.
 */
export function fft(real: Float64Array, imag: Float64Array): void {
  const n = real.length
  if (n <= 1) return
  if ((n & (n - 1)) !== 0) {
    throw new Error(`FFT input length must be power of 2, got ${n}`)
  }

  // Bit-reversal permutation
  let j = 0
  for (let i = 1; i < n; i++) {
    let bit = n >> 1
    while (j & bit) {
      j ^= bit
      bit >>= 1
    }
    j ^= bit

    if (i < j) {
      let tmp = real[i]; real[i] = real[j]; real[j] = tmp
      tmp = imag[i]; imag[i] = imag[j]; imag[j] = tmp
    }
  }

  // Butterfly stages
  for (let len = 2; len <= n; len <<= 1) {
    const halfLen = len >> 1
    const angle = (-2 * Math.PI) / len
    const wReal = Math.cos(angle)
    const wImag = Math.sin(angle)

    for (let i = 0; i < n; i += len) {
      let curReal = 1
      let curImag = 0

      for (let k = 0; k < halfLen; k++) {
        const evenIdx = i + k
        const oddIdx = i + k + halfLen

        const tReal = curReal * real[oddIdx] - curImag * imag[oddIdx]
        const tImag = curReal * imag[oddIdx] + curImag * real[oddIdx]

        real[oddIdx] = real[evenIdx] - tReal
        imag[oddIdx] = imag[evenIdx] - tImag
        real[evenIdx] += tReal
        imag[evenIdx] += tImag

        const newCurReal = curReal * wReal - curImag * wImag
        curImag = curReal * wImag + curImag * wReal
        curReal = newCurReal
      }
    }
  }
}

/**
 * Compute magnitude spectrum from FFT output (first half only: bins 0..N/2).
 */
export function magnitudeSpectrum(real: Float64Array, imag: Float64Array): Float64Array {
  const halfN = real.length >> 1
  const mag = new Float64Array(halfN + 1)
  for (let i = 0; i <= halfN; i++) {
    mag[i] = Math.sqrt(real[i] * real[i] + imag[i] * imag[i])
  }
  return mag
}
