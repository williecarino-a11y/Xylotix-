/* Miimiid Mart: the rival shopper.
 * One rival races you for an essential. The server decides the item and the times;
 * this file draws the race. Grab the item first and you win. If not, it sells out,
 * then comes back later at a higher price. */
(function () {
  'use strict';
  window.MiimiidMart = window.MiimiidMart || {};

  const RIVAL_NAME = 'Jordan';
  const SPAWN = { x: 900, y: 980 };     // where he walks in from
  const LOOK = { shirt: 0x1fa3a3, pants: 0x3b3f5c, hair: 0xc9a227, skin: 0xf1b27a };
  const LEAVE_SPEED = 150;

  let cur = null;                        // the race of this trip

  // The world file asks this when it works out a price.
  window.MiimiidMart.rivalPrice = function (itemId) {
    return cur && cur.itemId === itemId && cur.restocked && !cur.beaten ? cur.restockPrice : null;
  };

  function injectStyles() {
    if (document.getElementById('mm-rival-styles')) return;
    const st = document.createElement('style');
    st.id = 'mm-rival-styles';
    st.textContent = `
      .mm-rival { display: none; margin: 0 4px 6px; padding: 6px 10px; border-radius: 10px; background: #3b2410; border: 1px solid #ff9f1a; color: #ffd9a0; font-size: 13px; font-weight: 800; text-align: center; }
      .mm-rival.show { display: block; animation: mwPulse .8s ease-in-out infinite; }
    `;
    document.head.appendChild(st);
  }

  function create(ctx) {
    cur = null;
    injectStyles();
    let asked = false;

    const banner = document.createElement('div');
    banner.className = 'mm-rival';
    const listEl = ctx.content.querySelector('[data-mw-list]');
    if (listEl && listEl.parentNode) listEl.parentNode.insertBefore(banner, listEl);

    function findProduct(scene, itemId) {
      return scene.products.find(p => p.item.id === itemId) || null;
    }

    async function start() {
      try {
        const r = await ctx.request(
          `/api/fun-center/shop/session/${encodeURIComponent(ctx.S.sessionId)}/rival/start`,
          { method: 'POST', body: JSON.stringify({}), headers: ctx.NO_OVERLAY }
        );
        if (!r || !r.started) return;
        const now = Date.now();
        cur = {
          itemId: r.itemId, name: r.name, normalPrice: r.normalPrice, restockPrice: r.restockPrice,
          seconds: r.seconds, restockSeconds: r.restockSeconds,
          takesAt: now + r.seconds * 1000,
          restockAt: now + (r.seconds + r.restockSeconds) * 1000,
          beaten: false, soldOut: false, restocked: false,
          phase: 'walk', npc: null, route: null, speed: 100, lastBeep: -1, grabUntil: 0
        };
        ctx.SFX.tone(440, 0.12, 'sawtooth', 0.06);
        ctx.SFX.tone(330, 0.2, 'sawtooth', 0.06, 0.12);
        ctx.assistant.say(`Watch out! ${RIVAL_NAME} is heading for the ${r.name}. Get it first or it will be gone!`);
      } catch (error) {
        console.error('rival start error:', error);
      }
    }

    function maybeStart(scene) {
      if (asked || ctx.S.closed || ctx.S.busy) return;
      if (ctx.S.basket.length < 4 && ctx.S.timeLeft > ctx.closingSeconds * 0.65) return;
      if (ctx.saleActive() || ctx.hikeShowing() || ctx.assistant.pending || scene.friend) return;
      asked = true;
      start();
    }

    function spawnNpc(scene) {
      const p = findProduct(scene, cur.itemId);
      if (!p) { cur.phase = 'gone'; return; }
      const standY = p.sy + 34;
      cur.route = [[SPAWN.x, SPAWN.y], [SPAWN.x, standY], [p.x, standY]];
      let len = 0;
      for (let i = 1; i < cur.route.length; i++) {
        len += Math.hypot(cur.route[i][0] - cur.route[i - 1][0], cur.route[i][1] - cur.route[i - 1][1]);
      }
      cur.speed = Math.min(300, Math.max(70, len / Math.max(3, cur.seconds - 1)));
      const N = scene.makeNpc({ x: SPAWN.x, y: SPAWN.y, shirt: LOOK.shirt, pants: LOOK.pants, hair: LOOK.hair, skin: LOOK.skin });
      const shadow = scene.add.ellipse(SPAWN.x, SPAWN.y - 2, 70, 16, 0x000000, 0.25);
      N.root.setAlpha(0);
      shadow.setAlpha(0);
      scene.tweens.add({ targets: [N.root, shadow], alpha: 1, duration: 300 });
      cur.npc = { N, shadow, x: SPAWN.x, y: SPAWN.y, wp: 1, lp: 0, leave: null, phase: 0, amp: 0, nextBlink: 0, blinkUntil: 0, waveUntil: 0 };
    }

    function doGrab(scene) {
      const p = findProduct(scene, cur.itemId);
      cur.phase = 'grab';
      cur.grabUntil = Date.now() + 700;
      if (!p) return;
      if (cur.beaten || p.taken) {
        cur.beaten = true;
        if (cur.npc) scene.popText(cur.npc.x, cur.npc.y - 170, '😤', '#ffffff');
        return;
      }
      cur.soldOut = true;
      if (p.obj && p.obj.active) p.obj.setVisible(false);
      if (p.label && p.label.active) { p.label.setText('SOLD OUT'); p.label.setColor('#ff6b6b'); }
      scene.popText(p.x, p.sy - 70, 'SOLD OUT', '#ff6b6b');
      scene.cameras.main.shake(180, 0.004);
      ctx.SFX.noise(0.15, 0.1, 900);
      ctx.SFX.tone(196, 0.35, 'sawtooth', 0.06);
      ctx.assistant.say(`${RIVAL_NAME} took the last ${cur.name}! It comes back soon, but for $${cur.restockPrice} instead of $${cur.normalPrice}. Waiting costs money.`);
    }

    function doRestock(scene) {
      const p = findProduct(scene, cur.itemId);
      cur.soldOut = false;
      cur.restocked = true;
      if (!p || p.taken) return;
      if (p.obj && p.obj.active) {
        p.obj.setVisible(true).setAlpha(0);
        scene.tweens.add({ targets: p.obj, alpha: 1, duration: 400 });
      }
      if (p.label && p.label.active) { p.label.setText(ctx.priceText(p.item)); p.label.setColor('#ff6b6b'); }
      ctx.SFX.tone(660, 0.12, 'triangle', 0.1);
      ctx.SFX.tone(880, 0.2, 'triangle', 0.1, 0.1);
      ctx.assistant.say(`${cur.name} is back on the shelf, but now it costs $${cur.restockPrice}.`);
    }

    function updateNpc(scene, delta) {
      const n = cur.npc;
      const dt = delta / 1000;
      let moving = false;
      let look = 0;
      let grabbing = false;

      if (cur.phase === 'walk') {
        const t = cur.route[n.wp];
        const dx = t[0] - n.x;
        const dy = t[1] - n.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 3) {
          const step = Math.min(dist, cur.speed * dt);
          n.x += (dx / dist) * step;
          n.y += (dy / dist) * step;
          moving = true;
          look = Math.sign(dx);
        } else if (n.wp < cur.route.length - 1) {
          n.wp++;
        }
      } else if (cur.phase === 'grab') {
        grabbing = true;
        if (Date.now() > cur.grabUntil) {
          cur.phase = 'leave';
          n.leave = [cur.route[1], cur.route[0]];
          n.lp = 0;
        }
      } else if (cur.phase === 'leave') {
        const t = n.leave[n.lp];
        const dx = t[0] - n.x;
        const dy = t[1] - n.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 3) {
          const step = Math.min(dist, LEAVE_SPEED * dt);
          n.x += (dx / dist) * step;
          n.y += (dy / dist) * step;
          moving = true;
          look = Math.sign(dx);
        } else if (n.lp < n.leave.length - 1) {
          n.lp++;
        } else {
          cur.phase = 'gone';
          cur.npc = null;
          scene.tweens.add({
            targets: [n.N.root, n.shadow], alpha: 0, duration: 400,
            onComplete: () => { n.N.root.destroy(); n.shadow.destroy(); }
          });
          return;
        }
      }

      n.N.root.setPosition(n.x, n.y).setDepth(n.y);
      n.shadow.setPosition(n.x, n.y - 2).setDepth(n.y - 1);
      scene.animNpc(n.N, n, scene.time.now, delta, moving, look, false, false);
      if (grabbing) n.N.armR.rotation = Phaser.Math.DegToRad(-165);   // reaches up to the shelf
    }

    function tick(dt, scene, delta) {
      if (!scene || !scene.makeNpc || !scene.products) return;
      maybeStart(scene);
      if (!cur) return;
      const now = Date.now();

      if (cur.phase === 'walk') {
        if (!cur.npc) spawnNpc(scene);
        const left = Math.max(0, Math.ceil((cur.takesAt - now) / 1000));
        if (!cur.beaten && now < cur.takesAt) {
          banner.classList.add('show');
          banner.textContent = `⚠️ ${RIVAL_NAME} is going for the ${cur.name}! ${left}s`;
          if (left <= 5 && left !== cur.lastBeep) { cur.lastBeep = left; ctx.SFX.tone(880, 0.06, 'square', 0.05); }
        } else {
          banner.classList.remove('show');
        }
        if (now >= cur.takesAt) doGrab(scene);
      } else {
        banner.classList.remove('show');
      }

      if (cur.soldOut) {
        const p = findProduct(scene, cur.itemId);
        if (p && p.label && p.label.active && p.label.text !== 'SOLD OUT') p.label.setText('SOLD OUT');
        if (now >= cur.restockAt) doRestock(scene);
      }
      if (cur.npc) updateNpc(scene, delta);
    }

    function onBought(itemId, res) {
      if (!cur || cur.itemId !== itemId || !res || !res.rivalBeaten) return;
      const name = cur.name;
      cur.beaten = true;
      const scene = ctx.getScene();
      if (cur.soldOut && scene) {          // the buy was already on its way when he grabbed
        const p = findProduct(scene, itemId);
        cur.soldOut = false;
        if (p && p.obj && p.obj.active) p.obj.setVisible(true);
      }
      ctx.SFX.coin();
      if (scene) scene.popText(scene.player.x, scene.player.y - 215, `Beat ${RIVAL_NAME}!`, '#7ee2a8');
      setTimeout(() => ctx.assistant.say(`You got the ${name} before ${RIVAL_NAME}! Buying essentials early beats waiting.`), 900);
    }

    return {
      tick,
      onBought,
      isSoldOut: id => !!cur && cur.itemId === id && cur.soldOut,
      active: () => !!cur && (cur.phase === 'walk' || cur.phase === 'grab')
    };
  }

  window.MiimiidMart.rival = { create };
})();
