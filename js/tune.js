/* Opening tune, made live in the app (no audio file). A short 5-second piece sized to the
   opening screen: a warm tanpura drone swells in, temple bells rise Sa–Ga–Pa–Sa, and it settles
   on a soft final chord. Plays straight away where the device allows it; phones that block sound
   until the first touch start it on that first touch. It fades out the moment the screen closes. */
const Tune = (() => {
  function start() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    const ctx = new AC();
    const master = ctx.createGain(); master.gain.value = 0;
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 2400;
    const dly = ctx.createDelay(); dly.delayTime.value = .28; const fb = ctx.createGain(); fb.gain.value = .28;
    dly.connect(fb); fb.connect(dly);
    lp.connect(master); lp.connect(dly); dly.connect(master); master.connect(ctx.destination);
    const SA = 130.81; // C3
    const live = [];
    let played = false, muted = false, ended = false;

    const drone = (t0, dur) => {
      [[SA, .16], [SA * 1.5, .08], [SA * 2, .06], [SA / 2, .1]].forEach(([f, v], k) => {
        [-1.5, 1.5].forEach((c) => {
          const o = ctx.createOscillator(); o.type = k === 3 ? "sine" : "triangle"; o.frequency.value = f; o.detune.value = c * 3;
          const g = ctx.createGain(); g.gain.setValueAtTime(0, t0);
          g.gain.linearRampToValueAtTime(v / 2, t0 + 1.2); g.gain.setValueAtTime(v / 2, t0 + dur - 1.4); g.gain.linearRampToValueAtTime(0, t0 + dur);
          o.connect(g); g.connect(lp); o.start(t0); o.stop(t0 + dur + .1); live.push(o);
        });
      });
    };
    const bell = (t, f, vol, len = 2.6) => {
      [[1, 1], [2.76, .32], [5.4, .1]].forEach(([m, a]) => {
        const o = ctx.createOscillator(); o.type = "sine"; o.frequency.value = f * m;
        const g = ctx.createGain(); g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(vol * a, t + .015); g.gain.exponentialRampToValueAtTime(.0001, t + len / m + .4);
        o.connect(g); g.connect(lp); o.start(t); o.stop(t + len + .5); live.push(o);
      });
    };

    function play() {
      if (played || ended) return; played = true;
      const t = ctx.currentTime + .05, s = SA * 2; // bells one octave up
      master.gain.setValueAtTime(0, t); master.gain.linearRampToValueAtTime(muted ? 0 : .6, t + .4);
      drone(t, 5.4);
      // shimmer, then Sa – Ga – Pa – Sa' rising, then the final chord
      [[0, 4], [.12, 3], [.24, 4.5]].forEach(([d, r]) => bell(t + .1 + d, s * r, .025, 1.2));
      bell(t + .45, s, .15);
      bell(t + 1.25, s * 5 / 4, .12);
      bell(t + 2.05, s * 3 / 2, .13);
      bell(t + 2.85, s * 2, .14, 3);
      [1, 3 / 2, 2].forEach((r) => bell(t + 3.7, s * r / 2, .09, 3.2));
    }

    // try right away; if the device blocks sound, start on the very first touch anywhere
    const kick = () => ctx.resume().then(() => { if (ctx.state === "running") { play(); off(); } }).catch(() => {});
    const evs = ["pointerdown", "touchstart", "keydown"];
    const off = () => evs.forEach((e) => removeEventListener(e, kick, true));
    evs.forEach((e) => addEventListener(e, kick, true));
    kick();

    return {
      started: () => played && ctx.state === "running",
      muted: () => muted,
      resume: kick,
      toggle() { muted = !muted; const t = ctx.currentTime; master.gain.cancelScheduledValues(t); master.gain.setValueAtTime(master.gain.value, t); master.gain.linearRampToValueAtTime(muted ? 0 : .6, t + .25); },
      stop() { // the opening screen is closing: fade out fast and release everything
        ended = true; off();
        const t = ctx.currentTime; master.gain.cancelScheduledValues(t); master.gain.setValueAtTime(master.gain.value, t); master.gain.linearRampToValueAtTime(0, t + .3);
        setTimeout(() => { live.forEach((n) => { try { n.stop(); } catch {} }); ctx.close(); }, 400);
      },
    };
  }
  return { start };
})();
