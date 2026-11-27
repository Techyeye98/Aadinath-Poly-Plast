/* Soft, soothing opening tune made live in the browser (no audio file to download):
   a warm tanpura-like drone on Sa–Pa with slow temple-bell notes on top. */
const Tune = (() => {
  function start() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    const ctx = new AC();
    const master = ctx.createGain(); master.gain.value = 0;
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 1800;
    // soft room echo
    const dly = ctx.createDelay(); dly.delayTime.value = .32; const fb = ctx.createGain(); fb.gain.value = .32;
    dly.connect(fb); fb.connect(dly);
    lp.connect(master); lp.connect(dly); dly.connect(master); master.connect(ctx.destination);
    const sa = 130.81; // C3
    const nodes = [];

    // drone: Sa, Pa, high Sa, each a pair of slightly detuned voices breathing slowly
    [[sa, .16], [sa * 1.5, .09], [sa * 2, .07], [sa / 2, .1]].forEach(([f, v], k) => {
      [-1.2, 1.2].forEach((cents) => {
        const o = ctx.createOscillator(); o.type = k === 3 ? "sine" : "triangle";
        o.frequency.value = f; o.detune.value = cents * 3;
        const g = ctx.createGain(); g.gain.value = v / 2;
        const lfo = ctx.createOscillator(); lfo.frequency.value = .07 + k * .03;
        const lg = ctx.createGain(); lg.gain.value = v / 4; lfo.connect(lg); lg.connect(g.gain);
        o.connect(g); g.connect(lp); o.start(); lfo.start(); nodes.push(o, lfo);
      });
    });

    // bells: Sa Re Ga Pa Dha (pentatonic), gentle and spaced out
    const scale = [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3, 2].map((r) => sa * 2 * r);
    const bell = (t, f, vol = .14) => {
      [[1, 1], [2.76, .35], [5.4, .12]].forEach(([m, a]) => {
        const o = ctx.createOscillator(); o.type = "sine"; o.frequency.value = f * m;
        const g = ctx.createGain(); g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(vol * a, t + .02); g.gain.exponentialRampToValueAtTime(.0001, t + 3.2 / m + .6);
        o.connect(g); g.connect(lp); o.start(t); o.stop(t + 4);
      });
    };
    const phrase = [0, 2, 3, 4, 3, 2, 5, 3];
    let i = 0, timer = null;
    const schedule = () => {
      const t = ctx.currentTime + .05;
      bell(t, scale[phrase[i % phrase.length]], i % 4 === 0 ? .16 : .1);
      if (i % 4 === 2) bell(t + .9, scale[phrase[(i + 3) % phrase.length]] / 2, .07);
      i++; timer = setTimeout(schedule, 1350);
    };

    let on = true;
    const fadeIn = () => { const t = ctx.currentTime; master.gain.cancelScheduledValues(t); master.gain.setValueAtTime(master.gain.value, t); master.gain.linearRampToValueAtTime(.55, t + 1.8); };
    const begin = () => { if (timer) return; fadeIn(); schedule(); };
    if (ctx.state === "running") begin();
    else ctx.resume().then(() => { if (ctx.state === "running") begin(); }).catch(() => {});

    return {
      started: () => ctx.state === "running" && !!timer,
      resume() { ctx.resume().then(begin); },
      on: () => on,
      toggle() { on = !on; const t = ctx.currentTime; master.gain.cancelScheduledValues(t); master.gain.linearRampToValueAtTime(on ? .55 : 0, t + .4); if (on) this.resume(); },
      stop() {
        const t = ctx.currentTime; master.gain.cancelScheduledValues(t); master.gain.setValueAtTime(master.gain.value, t); master.gain.linearRampToValueAtTime(0, t + 1.2);
        clearTimeout(timer); setTimeout(() => { nodes.forEach((n) => { try { n.stop(); } catch {} }); ctx.close(); }, 1400);
      },
    };
  }
  return { start };
})();
