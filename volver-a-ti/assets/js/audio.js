/*
 * VOLVER A TI · Paisaje sonoro generativo (Web Audio API)
 * Pulso binaural suave + colchón armónico + ruido marrón opcional.
 * Todo se sintetiza en el navegador: no hay archivos de audio.
 */
(function () {
  "use strict";

  class Ambient {
    constructor() {
      this.ctx = null;
      this.nodes = [];
      this.master = null;
    }

    start({ base = 216, beat = 6, pad = true, noise = 0 } = {}) {
      this.stop(true);
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      const ctx = (this.ctx = new AC());
      const now = ctx.currentTime;

      const master = (this.master = ctx.createGain());
      master.gain.setValueAtTime(0, now);
      master.gain.linearRampToValueAtTime(0.32, now + 4);

      // Filtro global cálido
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 1800;
      lp.Q.value = 0.3;
      lp.connect(master);
      master.connect(ctx.destination);

      // Respiración del volumen (LFO muy lento)
      const swell = ctx.createGain();
      swell.gain.value = 0.85;
      swell.connect(lp);
      const lfo = ctx.createOscillator();
      const lfoAmt = ctx.createGain();
      lfo.frequency.value = 1 / 12;
      lfoAmt.gain.value = 0.15;
      lfo.connect(lfoAmt).connect(swell.gain);
      lfo.start();
      this.nodes.push(lfo);

      // Pulso binaural: tono base en el oído izquierdo, base + beat en el derecho
      const tone = (freq, pan, gain, type = "sine") => {
        const o = ctx.createOscillator();
        o.type = type;
        o.frequency.value = freq;
        const g = ctx.createGain();
        g.gain.value = gain;
        let node = o.connect(g);
        if (ctx.createStereoPanner) {
          const p = ctx.createStereoPanner();
          p.pan.value = pan;
          node = node.connect(p);
        }
        node.connect(swell);
        o.start();
        this.nodes.push(o);
        return o;
      };
      tone(base, -1, 0.22);
      tone(base + beat, 1, 0.22);

      // Colchón armónico (quinta y octava) con ligera desafinación para dar calidez
      if (pad) {
        tone(base / 2, -0.3, 0.12, "triangle");
        tone((base * 3) / 4 + 0.4, 0.3, 0.05, "triangle");
        tone(base * 1.5 - 0.3, 0, 0.025, "sine");
      }

      // Ruido marrón (agua / lluvia lejana)
      if (noise > 0) {
        const len = ctx.sampleRate * 4;
        const buf = ctx.createBuffer(2, len, ctx.sampleRate);
        for (let ch = 0; ch < 2; ch++) {
          const d = buf.getChannelData(ch);
          let last = 0;
          for (let i = 0; i < len; i++) {
            const w = Math.random() * 2 - 1;
            last = (last + 0.02 * w) / 1.02;
            d[i] = last * 3.2;
          }
        }
        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.loop = true;
        const ng = ctx.createGain();
        ng.gain.value = noise;
        const nf = ctx.createBiquadFilter();
        nf.type = "lowpass";
        nf.frequency.value = 600;
        src.connect(nf).connect(ng).connect(swell);
        src.start();
        this.nodes.push(src);
      }
    }

    fadeOut(seconds = 3) {
      if (!this.ctx || !this.master) return;
      const t = this.ctx.currentTime;
      this.master.gain.cancelScheduledValues(t);
      this.master.gain.setValueAtTime(this.master.gain.value, t);
      this.master.gain.linearRampToValueAtTime(0, t + seconds);
    }

    stop(immediate = false) {
      if (!this.ctx) return;
      const ctx = this.ctx;
      const nodes = this.nodes;
      if (!immediate) this.fadeOut(1.4);
      this.ctx = null;
      this.nodes = [];
      this.master = null;
      const close = () => {
        nodes.forEach((n) => { try { n.stop(); } catch (e) { /* ya detenido */ } });
        ctx.close();
      };
      if (immediate) close();
      else setTimeout(close, 1600);
    }

    get running() { return !!this.ctx; }
    suspend() { this.ctx && this.ctx.suspend(); }
    resume() { this.ctx && this.ctx.resume(); }
  }

  window.VATAmbient = Ambient;
})();
