let audioCtx: AudioContext | null = null

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AC) return null
  if (!audioCtx) {
    audioCtx = new AC()
  }
  return audioCtx
}

/** Resume AudioContext after a user gesture (required by browsers). */
export async function unlockAudio(): Promise<void> {
  const ctx = getContext()
  if (!ctx) return
  if (ctx.state === 'suspended') {
    await ctx.resume()
  }
}

/** Short two-tone beep via Web Audio API — no asset file needed. */
export async function playReminderBeep(): Promise<void> {
  const ctx = getContext()
  if (!ctx) return
  if (ctx.state === 'suspended') {
    await ctx.resume()
  }

  const now = ctx.currentTime
  const tones = [
    { freq: 880, start: 0, dur: 0.12 },
    { freq: 1174.66, start: 0.16, dur: 0.18 },
  ]

  for (const tone of tones) {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = tone.freq
    gain.gain.setValueAtTime(0.0001, now + tone.start)
    gain.gain.exponentialRampToValueAtTime(0.22, now + tone.start + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + tone.start + tone.dur)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now + tone.start)
    osc.stop(now + tone.start + tone.dur + 0.02)
  }
}
