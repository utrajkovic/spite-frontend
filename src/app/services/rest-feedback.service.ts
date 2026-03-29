import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';

@Injectable({ providedIn: 'root' })
export class RestFeedbackService {

  private audioCtx: AudioContext | null = null;

  // Pozovi kad odmor počne (kratka vibracija)
  async onRestStart() {
    await this.vibrate([80]);
  }

  // Pozovi svake sekunde kad ostane <= 3s (upozorenje)
  async onRestCountdown() {
    await this.vibrate([40]);
    this.playTick();
  }

  // Pozovi kad odmor završi (dupla vibracija + zvuk)
  async onRestEnd() {
    await this.vibrate([100, 80, 100]);
    this.playBeep();
  }

  private async vibrate(pattern: number[]) {
    try {
      if (Capacitor.isNativePlatform()) {
        const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
        // Native - koristimo Impact za svaki pulse
        for (let i = 0; i < pattern.length; i++) {
          if (i % 2 === 0) {
            await Haptics.impact({ style: ImpactStyle.Medium });
          }
          if (i < pattern.length - 1) {
            await new Promise(r => setTimeout(r, pattern[i]));
          }
        }
      } else if ('vibrate' in navigator) {
        // Web Vibration API
        navigator.vibrate(pattern);
      }
    } catch (e) {
      // Vibracija nije dostupna, ignorišemo
    }
  }

  private getAudioCtx(): AudioContext {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioCtx;
  }

  // Kratki tick zvuk (countdown)
  private playTick() {
    try {
      const ctx = this.getAudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.frequency.value = 880;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {}
  }

  // Beep zvuk kad odmor završi (dva tona)
  private playBeep() {
    try {
      const ctx = this.getAudioCtx();

      const playTone = (freq: number, startAt: number, duration: number, volume = 0.3) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = 'sine';
        gain.gain.setValueAtTime(volume, ctx.currentTime + startAt);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startAt + duration);
        osc.start(ctx.currentTime + startAt);
        osc.stop(ctx.currentTime + startAt + duration);
      };

      playTone(660, 0, 0.15);
      playTone(880, 0.18, 0.25, 0.4);
    } catch (e) {}
  }
}
