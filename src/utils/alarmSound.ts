// src/utils/alarmSound.ts
// Reproduce un sonido de alarma profesional sintetizado mediante Web Audio API
// Compatible con todos los navegadores modernos sin depender de archivos de audio externos.

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioContext) {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      audioContext = new AudioCtx();
    }
  }
  if (audioContext && audioContext.state === 'suspended') {
    audioContext.resume().catch(() => {});
  }
  return audioContext;
}

export function playAlarmSound(type: 'alarm' | 'chime' | 'beep' = 'alarm') {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    const playBeep = (freq: number, start: number, duration: number, volume = 0.25) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(volume, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + duration);
    };

    if (type === 'alarm') {
      // Secuencia de alarma insistente: bip-bip ... bip-bip ... bip-bip
      playBeep(880, now, 0.14, 0.3); // A5
      playBeep(1174.66, now + 0.16, 0.2, 0.35); // D6
      playBeep(880, now + 0.45, 0.14, 0.3);
      playBeep(1174.66, now + 0.61, 0.22, 0.35);
      playBeep(1318.51, now + 0.9, 0.28, 0.4); // E6
    } else if (type === 'chime') {
      // Chime suave de notificación
      playBeep(523.25, now, 0.15, 0.2); // C5
      playBeep(659.25, now + 0.12, 0.15, 0.2); // E5
      playBeep(783.99, now + 0.24, 0.3, 0.25); // G5
    } else {
      // Beep simple
      playBeep(880, now, 0.15, 0.25);
    }
  } catch (error) {
    console.warn('No se pudo reproducir el sonido de alarma:', error);
  }
}
