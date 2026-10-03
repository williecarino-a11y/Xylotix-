/*
 * MIIMIID FUN CENTER - LIVING MART (V2)
 * Scene-based Weekly Shop. Replaces startMiimiidShop() from fun-center.js.
 * The server still owns budget, prices and need/want answers.
 *
 * V2 adds: mission intro, products inside the scene, basket strip,
 * budget-aware Miimiid reactions, Alex + Mom events, checkout scene with
 * Pay / Keep shopping, four outcome tiers, shopping report, ambient life
 * (idle hints, bobbing shelf, rolling cart), product pickup arcs, and
 * price choices (premium / regular / store brand).
 */
(function () {
  'use strict';

  // If Miimiid runs backwards when walking, change this to false.
  const SPRITE_FACES_RIGHT = true;
  const COUNTER_X = 78;

  const AISLES = [
    { id: 'fresh', label: 'Fresh Food', icon: '🥬', x: 14, items: ['apple', 'carrot', 'bread', 'pasta'], line: 'Fresh Food. A good place to start!' },
    { id: 'dairy', label: 'Dairy & Drinks', icon: '🥛', x: 31, items: ['milk', 'eggs', 'water'], line: 'Dairy and drinks. Lots of everyday stuff here.' },
    { id: 'snacks', label: 'Snacks', icon: '🍿', x: 48, items: ['chips', 'cookies', 'candy', 'pizza'], line: 'Snacks! Think before you tap.' },
    { id: 'care', label: 'Personal Care', icon: '💊', x: 64, items: ['medicine'], line: 'Personal Care. Health items live here.' },
    { id: 'fun', label: 'Fun Corner', icon: '🎮', x: 78, items: ['movie', 'headphones', 'console', 'sneakers'], line: 'The Fun Corner. Big prices here, watch your wallet!' }
  ];

  // Unexpected events. Each fires once, when the basket reaches `after` items
  // and the item it is about has not been bought yet.
  const EVENTS = [
    {
      id: 'alex', after: 3, itemId: 'movie', icon: '📱', title: 'New message from Alex',
      text: price => `Movie night tonight? Tickets are $${price}. You in?`,
      yes: "I'm in!", no: 'Maybe next time',
      line: 'Another buzz! It is Alex. Do we really need this one?',
      noMood: 'encourage', noLine: 'Good call. Fun can wait until your essentials are covered.'
    },
    {
      id: 'mom', after: 5, itemId: 'medicine', icon: '📱', title: 'New message from Mom',
      text: price => `Can you pick up some medicine for me? It will be $${price}.`,
      yes: "I'll get it", no: 'Not this time',
      line: 'Ooh, my phone just buzzed! It is Mom.',
      noMood: 'concerned', noLine: 'Mom is counting on that medicine. Health always comes first.'
    }
  ];

  let state = null;

  function esc(value) { return miimiidFunCenterEscapeHtml(value); }

  function interiorUrl() {
    return MIIMIID_ASSETS.game && MIIMIID_ASSETS.game.martInterior;
  }

  function hasOptions(item) {
    return Array.isArray(item.options) && item.options.length > 0;
  }

  function lowestPrice(item) {
    return hasOptions(item) ? Math.min(...item.options.map(option => option.price)) : item.price;
  }

  function highestPrice(item) {
    return hasOptions(item) ? Math.max(...item.options.map(option => option.price)) : item.price;
  }

  function priceLabel(item) {
    const low = lowestPrice(item);
    const high = highestPrice(item);
    return low === high ? `$${low}` : `$${low}–$${high}`;
  }

  function spriteImg(mood) {
    const src = MIIMIID_ASSETS.characters.miimiid[MIIMIID_FUN_POSES[mood] || 'happy'];
    return `<img class="mart-miimiid-img" data-mood="${mood}" src="${src}" alt="" style="animation:${miimiidFunMascotAnim(mood)}">`;
  }

  function stageHtml(x, mood, withItems) {
    const bg = interiorUrl();
    const cartSrc = MIIMIID_ASSETS.game && MIIMIID_ASSETS.game.shoppingCart;
    const cartInner = cartSrc
      ? `<img src="${cartSrc}" alt="" onerror="this.outerHTML='🛒'">`
      : '🛒';
    return `
      <div class="mart-stage" ${bg ? `style="background-image:url('${bg}')"` : ''}>
        <div class="mart-bubble" data-mart-bubble></div>
        ${withItems ? '<div class="mart-stage-items" data-mart-shelf></div>' : ''}
        <div class="mart-stage-cart" data-mart-stage-cart style="left:${Math.min(x + 13, 90)}%"><span class="mart-cart-body">${cartInner}</span></div>
        <div class="mart-miimiid" data-mart-miimiid style="left:${x}%">${spriteImg(mood)}</div>
      </div>
    `;
  }

  function setMood(mood) {
    const img = document.querySelector('[data-mart-miimiid] img');
    if (img) miimiidFunSetMascotMood(img, mood);
  }

  function say(mood, text) {
    setMood(mood);
    const bubble = document.querySelector('[data-mart-bubble]');
    if (!bubble) return;
    bubble.textContent = text;
    bubble.classList.remove('pop');
    void bubble.offsetWidth;
    bubble.classList.add('pop');
  }

  function walkTo(x, done) {
    const wrap = document.querySelector('[data-mart-miimiid]');
    const cart = document.querySelector('[data-mart-stage-cart]');
    const s = state;
    if (!wrap || !s) { if (done) done(); return; }

    const forward = SPRITE_FACES_RIGHT ? 1 : -1;
    const dir = x >= s.x ? 1 : -1;
    const dist = Math.abs(x - s.x);
    s.x = x;
    clearTimeout(s.walkTimer);

    if (dist < 1) { if (done) done(); return; }

    // Slow, steady walk: 1.2s for short hops, up to 3.2s across the store.
    const seconds = Math.min(3.2, Math.max(1.2, dist / 14));
    wrap.style.setProperty('--face', forward * dir);
    wrap.style.transitionDuration = `${seconds}s`;
    wrap.classList.add('is-walking');
    setMood('run');
    wrap.style.left = `${x}%`;

    if (cart) {
      cart.style.transitionDuration = `${seconds}s`;
      cart.style.left = `${Math.min(x + 13, 90)}%`;
      cart.classList.add('is-rolling');
    }

    s.walkTimer = setTimeout(() => {
      wrap.classList.remove('is-walking');
      if (cart) cart.classList.remove('is-rolling');
      wrap.style.setProperty('--face', forward);
      setMood('wave');
      if (done) done();
    }, seconds * 1000 + 40);
  }

  // Miimiid walks to the product you tapped (skipped if already close).
  function reachItem(el, done) {
    const stage = document.querySelector('.mart-stage');
    if (!el || !stage || !state) { done(); return; }
    const a = stage.getBoundingClientRect();
    const b = el.getBoundingClientRect();
    const x = ((b.left + b.width / 2 - a.left) / a.width) * 100;
    if (Math.abs(x - state.x) < 8) { done(); return; }
    walkTo(x, done);
  }

  function itemsFor(aisleId) {
    return state.shop.items.filter(item => {
      const aisle = AISLES.find(a => a.items.includes(item.id));
      return aisle ? aisle.id === aisleId : aisleId === AISLES[AISLES.length - 1].id;
    });
  }

  function refresh() {
    const s = state;
    if (!s) return;
    const remaining = s.budget - s.spent;
    const pct = Math.max(0, Math.min(100, Math.round((remaining / s.budget) * 100)));

    const fill = document.querySelector('.mart-bar-fill');
    if (fill) { fill.style.width = `${pct}%`; fill.dataset.level = pct <= 20 ? 'low' : pct <= 50 ? 'mid' : 'high'; }

    const money = document.querySelector('[data-mart-remaining]');
    if (money) money.textContent = `$${remaining}`;

    const count = document.querySelector('[data-mart-count]');
    if (count) count.textContent = String(s.basket.length);

    const checkout = document.querySelector('[data-mart-checkout]');
    if (checkout && !s.checkingOut) {
      checkout.disabled = s.basket.length === 0;
      checkout.textContent = s.basket.length === 0
        ? 'Pick something up first'
        : `Go to checkout (${s.basket.length} ${s.basket.length === 1 ? 'item' : 'items'})`;
    }

    document.querySelectorAll('[data-mart-item]').forEach(btn => {
      const item = s.shop.items.find(candidate => candidate.id === btn.dataset.martItem);
      if (!item) return;
      const inBasket = s.basket.includes(item.id);
      btn.classList.toggle('in-basket', inBasket);
      btn.classList.toggle('is-unaffordable', !inBasket && lowestPrice(item) > remaining);
    });
  }

  function renderShelf() {
    const shelf = document.querySelector('[data-mart-shelf]');
    if (!shelf || !state) return;
    shelf.innerHTML = itemsFor(state.aisle).map(item => `
      <button type="button" class="mart-item" data-mart-item="${esc(item.id)}">
        <span class="mart-item-art">${miimiidFunProductVisual(item, 44)}</span>
        <span class="mart-item-name">${esc(item.name)}</span>
        <span class="mart-item-price">${priceLabel(item)}</span>
      </button>
    `).join('');
    shelf.classList.add('is-ready');
    shelf.querySelectorAll('[data-mart-item]').forEach(btn => {
      btn.addEventListener('click', () => buy(btn.dataset.martItem, btn));
    });
    refresh();
  }

  // Idle hints: if the player does nothing for a while, Miimiid thinks out loud.
  function idleHint(s) {
    const remaining = s.budget - s.spent;
    const options = [];
    if (s.basket.length === 0) options.push('Tip: essentials first. Food, water and medicine come before treats.');
    if (remaining <= 10) options.push(`Careful, only $${remaining} left. Is there anything essential we still need?`);
    options.push('Not sure? Ask yourself: do I need this, or do I just want it?');
    options.push('Try every aisle. Some essentials are hiding in different sections.');
    options.push('Some products come in cheaper versions. Same job, lower price.');
    s.hintIndex = (s.hintIndex || 0) + 1;
    return options[s.hintIndex % options.length];
  }

  function scheduleIdle(delay) {
    const s = state;
    if (!s) return;
    clearTimeout(s.idleTimer);
    s.idleTimer = setTimeout(() => {
      if (state !== s) return;
      const walking = document.querySelector('.mart-miimiid.is-walking');
      if (walking || s.busy || s.checkingOut || s.missionOpen || s.eventOpen) {
        scheduleIdle(8000);
        return;
      }
      say('idle', idleHint(s));
      scheduleIdle(20000);
    }, delay || 8000);
  }

  function selectAisle(id) {
    const s = state;
    if (!s || s.checkingOut || s.missionOpen || s.busy) return;
    if (s.eventOpen) { say('confused', 'Finish the choice on screen first!'); return; }
    const aisle = AISLES.find(a => a.id === id);
    if (!aisle) return;

    s.aisle = id;
    scheduleIdle();
    document.querySelectorAll('[data-mart-aisle]').forEach(b => {
      b.classList.toggle('is-active', b.dataset.martAisle === id);
    });

    const shelf = document.querySelector('[data-mart-shelf]');
    if (shelf) { shelf.classList.remove('is-ready'); shelf.innerHTML = ''; }

    walkTo(aisle.x, () => {
      if (!state || state.aisle !== id) return;
      renderShelf();
      say('wave', aisle.line);
    });
  }

  // The item pops off the shelf, arcs up and over, and drops into the cart.
  function flyToCart(item, fromEl, onLand) {
    const cart = document.querySelector('[data-mart-stage-cart]') || document.querySelector('[data-mart-cart]');
    const from = fromEl
      ? (fromEl.querySelector('.mart-item-art') || fromEl)
      : document.querySelector('.mart-stage');
    if (!cart || !from) { if (onLand) onLand(); return; }

    const a = from.getBoundingClientRect();
    const b = cart.getBoundingClientRect();
    const dx = (b.left + b.width / 2) - (a.left + a.width / 2);
    const dy = (b.top + b.height / 2) - (a.top + a.height / 2);

    const fly = document.createElement('div');
    fly.className = 'mart-fly';
    fly.innerHTML = miimiidFunProductVisual(item, 40);
    fly.style.transition = 'none';
    fly.style.left = `${a.left + a.width / 2 - 20}px`;
    fly.style.top = `${a.top + a.height / 2 - 20}px`;
    document.body.appendChild(fly);

    miimiidFunTone(760, 0.06, 'sine', 0.03);

    let landed = false;
    const land = () => {
      if (landed) return;
      landed = true;
      fly.remove();
      miimiidFunTone(170, 0.12, 'triangle', 0.05);
      if (onLand) onLand();
    };

    if (typeof fly.animate === 'function') {
      const anim = fly.animate([
        { transform: 'translate(0px, 0px) scale(1)', opacity: 1 },
        { transform: `translate(${dx * 0.45}px, ${dy * 0.45 - 70}px) scale(1.2)`, opacity: 1, offset: 0.45 },
        { transform: `translate(${dx}px, ${dy}px) scale(0.5)`, opacity: 0.85 }
      ], { duration: 650, easing: 'ease-in-out', fill: 'forwards' });
      anim.onfinish = land;
      setTimeout(land, 900);
    } else {
      setTimeout(land, 650);
    }
  }

  function bumpCart() {
    const header = document.querySelector('[data-mart-cart]');
    const stageCart = document.querySelector('[data-mart-stage-cart]');
    if (header) { header.classList.remove('bump'); void header.offsetWidth; header.classList.add('bump'); }
    if (stageCart) { stageCart.classList.remove('bump'); void stageCart.offsetWidth; stageCart.classList.add('bump'); }
  }

  function pulseWallet() {
    ['.mart-bar', '[data-mart-remaining]'].forEach(selector => {
      const el = document.querySelector(selector);
      if (!el) return;
      el.classList.remove('pulse');
      void el.offsetWidth;
      el.classList.add('pulse');
    });
  }

  function addBasketChip(item) {
    const strip = document.querySelector('[data-mart-basket]');
    if (!strip) return;
    const chip = document.createElement('span');
    chip.className = 'mart-basket-chip';
    chip.innerHTML = miimiidFunProductVisual(item, 28);
    strip.appendChild(chip);
  }

  function cannotAfford(name, price, remaining, el) {
    miimiidFunPlayWrong();
    if (el) { el.classList.remove('is-shake'); void el.offsetWidth; el.classList.add('is-shake'); }
    say('confused', `${name} costs $${price}, but your wallet only has $${remaining} left.`);
  }

  // Price choices: the player compares versions that do the same job.
  function showOptions(item, el) {
    const s = state;
    const stage = document.querySelector('.mart-stage');
    if (!s || !stage) return;

    s.eventOpen = true;
    miimiidFunPlayTap();
    const remaining = s.budget - s.spent;

    const card = document.createElement('div');
    card.className = 'mart-event mart-options';
    card.innerHTML = `
      <div class="mart-event-title">${esc(item.name)}: same job, pick one</div>
      <div class="mart-options-list">
        ${item.options.map(option => `
          <button type="button" class="mart-option" data-mart-option="${esc(option.id)}" ${option.price > remaining ? 'disabled' : ''}>
            <span class="mart-option-label">${esc(option.label)}</span>
            <span class="mart-option-note">${esc(option.note || '')}</span>
            <strong>$${option.price}</strong>
          </button>
        `).join('')}
      </div>
      <button type="button" class="mart-option-cancel" data-mart-option-cancel>Never mind</button>
    `;
    stage.appendChild(card);

    card.querySelectorAll('[data-mart-option]').forEach(btn => {
      btn.addEventListener('click', () => {
        card.remove();
        s.eventOpen = false;
        buy(item.id, el, btn.dataset.martOption);
      });
    });
    card.querySelector('[data-mart-option-cancel]').addEventListener('click', () => {
      card.remove();
      s.eventOpen = false;
      say('wave', 'No rush. Look around some more.');
    });
  }

  async function buy(itemId, el, optionId) {
    const s = state;
    if (!s || s.busy || s.checkingOut || s.missionOpen) return;
    if (s.eventOpen) { say('confused', 'Finish the choice on screen first!'); return; }

    const item = s.shop.items.find(candidate => candidate.id === itemId);
    if (!item || s.basket.includes(item.id)) return;

    const remaining = s.budget - s.spent;

    if (hasOptions(item) && !optionId) {
      if (lowestPrice(item) > remaining) { cannotAfford(item.name, lowestPrice(item), remaining, el); return; }
      showOptions(item, el);
      return;
    }

    const option = hasOptions(item) ? item.options.find(candidate => candidate.id === optionId) : null;
    if (hasOptions(item) && !option) return;
    const price = option ? option.price : item.price;
    const label = option ? `${item.name} (${option.label})` : item.name;

    if (price > remaining) { cannotAfford(label, price, remaining, el); return; }

    s.busy = true;
    scheduleIdle();
    if (el) {
      el.classList.add('is-picked');
      miimiidFunTone(520, 0.05, 'sine', 0.025);
    }
    await new Promise(resolve => reachItem(el, resolve));
    if (state !== s) return;

    const content = document.getElementById('fun-center-content');

    try {
      const result = await miimiidFunCenterRequest(
        `/api/fun-center/shop/session/${encodeURIComponent(s.sessionId)}/buy`,
        { method: 'POST', body: JSON.stringify({ itemId, optionId: option ? option.id : undefined }) }
      );

      s.spent = result.spent;
      s.basket.push(item.id);
      s.purchases.push({ id: item.id, name: label, price: result.price });
      flyToCart(item, el, () => { bumpCart(); addBasketChip(item); });

      const left = result.remaining;
      const needsLeft = Number.isFinite(result.needsLeft) ? result.needsLeft : null;
      const essentials = needsLeft ? ` ${needsLeft} essential${needsLeft === 1 ? '' : 's'} still to buy.` : '';

      let tail = '';
      if (needsLeft !== 0 && left <= 5) tail = ` Whoa, only $${left} left!${essentials}`;
      else if (needsLeft !== 0 && left <= 10) tail = ` We should slow down. $${left} left.${essentials}`;

      const medicine = s.shop.items.find(candidate => candidate.id === 'medicine');
      const medicineAtRisk = needsLeft !== 0 && !!medicine && s.basket.includes('movie') && !s.basket.includes('medicine') && left < medicine.price;
      if (medicineAtRisk) tail += ` You still need medicine ($${medicine.price}).`;

      const plain = item.name.replace(/\s*\(.*\)/, '').toLowerCase();
      const diff = option ? item.price - option.price : 0;

      if (result.classification === 'need') {
        s.needStreak++;
        miimiidFunPlayCorrect(s.needStreak);
        let mood = s.needStreak >= 3 ? 'celebrate' : 'correct';
        let base = result.explanation;
        if (option && diff > 0) {
          base = `Smart swap! Same ${plain} for $${diff} less.`;
        } else if (option && diff < 0) {
          base = `That ${option.label.toLowerCase()} ${plain} costs $${-diff} more for the same job.`;
          mood = 'surprised';
        }
        let text = base + tail;
        if (needsLeft === 0) {
          mood = 'celebrate';
          text = `${base} That is every essential covered! Head to checkout and keep the rest.`;
        } else if (medicineAtRisk) {
          mood = 'concerned';
        } else if (left <= 5) {
          mood = 'surprised';
        }
        say(mood, text);
        miimiidFunShowFloat(content, `-$${result.price} · Smart pick`);
      } else {
        s.needStreak = 0;
        miimiidFunPlayWrong();
        const wantTail = tail || ` You have $${left} left.`;
        say('concerned', `${result.explanation} Do we really need this?${wantTail}`);
        miimiidFunShowFloat(content, `-$${result.price}`, true);
      }

      refresh();
      pulseWallet();
      setTimeout(maybeEvent, 900);
    } catch (error) {
      console.error('Miimiid mart buy error:', error);
      say('confused', error.message || 'That did not work. Try again.');
    } finally {
      s.busy = false;
      if (el) el.classList.remove('is-picked');
    }
  }

  function maybeEvent() {
    const s = state;
    if (!s || s.checkingOut || s.busy || s.eventOpen || s.missionOpen) return;

    const ev = EVENTS.find(e =>
      !s.eventsDone.includes(e.id) &&
      s.basket.length >= e.after &&
      !s.basket.includes(e.itemId)
    );
    if (!ev) return;

    const item = s.shop.items.find(candidate => candidate.id === ev.itemId);
    const stage = document.querySelector('.mart-stage');
    if (!item || !stage) return;

    s.eventOpen = true;
    s.eventsDone.push(ev.id);
    miimiidFunPlayTap();
    say('surprised', ev.line);

    const card = document.createElement('div');
    card.className = 'mart-event';
    card.innerHTML = `
      <div class="mart-event-title">${ev.icon} ${esc(ev.title)}</div>
      <div class="mart-event-text">${esc(ev.text(item.price))}</div>
       <div class="mart-event-actions">
        <button type="button" class="mart-event-yes" data-mart-event-yes>${esc(ev.yes)}</button>
        <button type="button" class="mart-event-no" data-mart-event-no>${esc(ev.no)}</button>
      </div>
    `;
    stage.appendChild(card);

    card.querySelector('[data-mart-event-yes]').addEventListener('click', () => {
      card.remove();
      s.eventOpen = false;
      buy(ev.itemId, null);
    });
    card.querySelector('[data-mart-event-no]').addEventListener('click', () => {
      card.remove();
      s.eventOpen = false;
      miimiidFunPlayTap();
      say(ev.noMood, ev.noLine);
    });
  }

  function showMission() {
    const s = state;
    const stage = document.querySelector('.mart-stage');
    if (!s || !stage) return;

    s.missionOpen = true;
    const card = document.createElement('div');
    card.className = 'mart-mission';
    card.innerHTML = `
      <div class="mart-mission-tag">🛒 TODAY'S MISSION</div>
      <div class="mart-mission-money">$${s.budget}</div>
      <p class="mart-mission-text">You need food and essentials for the whole week. Cover your needs without wasting your money.</p>
      <button type="button" class="mart-mission-go" data-mart-go>Let's shop!</button>
    `;
    stage.appendChild(card);

    card.querySelector('[data-mart-go]').addEventListener('click', () => {
      miimiidFunPlayTap();
      card.remove();
      s.missionOpen = false;
      selectAisle('fresh');
    });
  }

  // Items land on the counter one by one with a scanner beep.
  // The wallet counts down as each item scans.
  // Resolves true when the player taps Pay, false if they tap Keep shopping.
  function playScan(s) {
    return new Promise(resolve => {
      const stage = document.querySelector('.mart-stage');
      if (!stage) { resolve(false); return; }

      const items = s.purchases.slice();

      const overlay = document.createElement('div');
      overlay.className = 'mart-scan';
      overlay.innerHTML = `
        <div class="mart-scan-head">🧾 CHECKOUT</div>
        <div class="mart-scan-lines" data-mart-scan-lines></div>
        <div class="mart-scan-total"><span>Total</span><strong data-mart-scan-total>$0</strong></div>
        <div class="mart-scan-wallet" data-mart-scan-wallet>Wallet $${s.budget}</div>
        <div class="mart-scan-actions" data-mart-scan-actions>
          <button type="button" class="mart-scan-keep" data-mart-keep>Keep shopping</button>
        </div>
      `;
      stage.appendChild(overlay);

      const lines = overlay.querySelector('[data-mart-scan-lines]');
      const totalEl = overlay.querySelector('[data-mart-scan-total]');
      const walletEl = overlay.querySelector('[data-mart-scan-wallet]');
      const actions = overlay.querySelector('[data-mart-scan-actions]');

      let cancelled = false;
      let total = 0;
      let index = 0;

      overlay.querySelector('[data-mart-keep]').addEventListener('click', () => {
        cancelled = true;
        overlay.remove();
        resolve(false);
      });

      const next = () => {
        if (cancelled) return;

        if (index >= items.length) {
          const left = s.budget - total;
          setMood(left <= 5 ? 'concerned' : 'correct');
          actions.insertAdjacentHTML('beforeend', `<button type="button" class="mart-scan-pay" data-mart-pay>Pay $${total}</button>`);
          actions.querySelector('[data-mart-pay]').addEventListener('click', () => {
            actions.innerHTML = '';
            walletEl.textContent = `Paid! Wallet $${s.budget} → $${left}`;
            miimiidFunBell(1046.5, 0.5, 0.045);
            setTimeout(() => resolve(true), 1100);
          });
          return;
        }

        const item = items[index++];
        total += item.price;

        const line = document.createElement('div');
        line.className = 'mart-scan-line';
        line.innerHTML = `<span>${esc(item.name)}</span><strong>$${item.price}</strong>`;
        lines.appendChild(line);
        totalEl.textContent = `$${total}`;
        walletEl.textContent = `Wallet $${s.budget - total}`;
        miimiidFunTone(1180, 0.07, 'square', 0.025);

        setTimeout(next, 380);
      };

      setTimeout(next, 400);
    });
  }

  async function checkout() {
    const s = state;
    if (!s || s.busy || s.basket.length === 0) return;

    s.busy = true;
    s.checkingOut = true;
    s.eventOpen = false;
    clearTimeout(s.idleTimer);

    const button = document.querySelector('[data-mart-checkout]');
    if (button) { button.disabled = true; button.textContent = 'Heading to the counter…'; }
    const event = document.querySelector('.mart-event');
    if (event) event.remove();

    say('wave', `Let's head to the checkout!`);
    const walk = new Promise(resolve => walkTo(COUNTER_X, resolve));

    try {
      await walk;
      const paid = await playScan(s);
      if (state !== s) return;

      if (!paid) {
        s.busy = false;
        s.checkingOut = false;
        refresh();
        const aisle = AISLES.find(a => a.id === s.aisle);
        walkTo(aisle ? aisle.x : 14, () => {
          if (state === s) say('encourage', 'No problem, take your time. Add or rethink anything you like.');
        });
        scheduleIdle();
        return;
      }

      const result = await miimiidFunCenterRequest(
        `/api/fun-center/shop/session/${encodeURIComponent(s.sessionId)}/checkout`,
        { method: 'POST', body: JSON.stringify({}) }
      );
      if (state !== s) return;

      state = null;
      renderResult(result);
    } catch (error) {
      console.error('Miimiid mart checkout error:', error);
      const scan = document.querySelector('.mart-scan');
      if (scan) scan.remove();
      s.busy = false;
      s.checkingOut = false;
      refresh();
      say('confused', error.message || 'Checkout failed. Try again.');
    }
  }

  function priciest(list) {
    return list.reduce((best, item) => (!best || item.price > best.price ? item : best), null);
  }

  function outcomeTier(result, needs, wants) {
    const missed = Math.max(0, result.totalNeeds - needs.length);
    if (missed === 0 && result.saved > 0) return wants.length === 0 ? 'excellent' : 'good';
    if (missed <= 1 && result.saved > 0) return 'good';
    if (result.saved === 0 && missed > 0) return 'overspent';
    if (missed >= 4) return 'overspent';
    return 'risky';
  }

  function tierInfo(tier, wantsCount, missedCount) {
    if (tier === 'excellent') {
      return { title: 'Excellent budgeting!', mood: 'celebrate', message: 'You covered every essential and kept money in your wallet. That is how it is done!' };
    }
    if (tier === 'good') {
      return {
        title: 'Good budgeting',
        mood: 'encourage',
        message: missedCount === 0 && wantsCount > 0
          ? 'You treated yourself and still protected every essential. Wants are fine when your needs come first.'
          : 'You covered most of your essentials. Next time, let us protect even more of your budget.'
      };
    }
    if (tier === 'risky') {
      return { title: 'Risky budgeting', mood: 'concerned', message: 'Your budget got stretched thin. Next time, cover the essentials before anything else.' };
    }
    return { title: 'Overspent', mood: 'concerned', message: 'We learned something today. Want to try again?' };
  }

  // Plain-language reasons for the result, built from what the player did.
  function whyLines(tier, result, needs, wants, missed) {
    const lines = [];
    lines.push(`You covered ${needs.length} of ${result.totalNeeds} essentials${missed.length ? `, but left behind ${missed.map(item => item.name).join(', ')}` : ''}.`);
    lines.push(wants.length === 0
      ? 'You bought no wants.'
      : `You spent $${result.wantsSpent} on wants (${wants.map(item => item.name).join(', ')}).`);
    lines.push(`You finished with $${result.saved} left in your wallet.`);

    const verdict = {
      excellent: 'That is why this is Excellent: needs first, nothing wasted, money left over.',
      good: 'That is why this is Good: your essentials were protected before anything else.',
      risky: missed.length > 0
        ? 'That is why this is Risky: some important needs were still missing.'
        : 'That is why this is Risky: you covered your needs but spent your last dollars.',
      overspent: result.saved === 0
        ? 'That is why this is Overspent: your wallet ran out while important needs were missing.'
        : 'That is why this is Overspent: too many important needs were missing.'
    };
    lines.push(verdict[tier]);
    return lines;
  }

  function tradeoffHtml(result) {
    const tradeoffs = Array.isArray(result.tradeoffs) ? result.tradeoffs : [];
    const bestSwap = tradeoffs.filter(t => t.saved > 0).sort((a, b) => b.saved - a.saved)[0];
    const bigSplurge = tradeoffs.filter(t => t.extra > 0).sort((a, b) => b.extra - a.extra)[0];
    if (bestSwap) {
      return `<div class="mart-report-line is-good"><span>Biggest tradeoff</span><strong>${esc(bestSwap.label)} ${esc(bestSwap.name.toLowerCase())} · saved $${bestSwap.saved}</strong></div>`;
    }
    if (bigSplurge) {
      return `<div class="mart-report-line is-bad"><span>Biggest tradeoff</span><strong>${esc(bigSplurge.label)} ${esc(bigSplurge.name.toLowerCase())} · $${bigSplurge.extra} extra</strong></div>`;
    }
    return '';
  }

  function renderResult(result) {
    const content = document.getElementById('fun-center-content');
    if (!content) return;

    const needs = Array.isArray(result.needsBought) ? result.needsBought : [];
    const wants = Array.isArray(result.wantsBought) ? result.wantsBought : [];
    const missed = Array.isArray(result.needsMissed) ? result.needsMissed : [];
    const xp = Number.isFinite(result.xp) ? result.xp : 0;
    const coins = Number.isFinite(result.coins) ? result.coins : 0;

    const tier = outcomeTier(result, needs, wants);
    const info = tierInfo(tier, wants.length, missed.length);
    const mood = info.mood;
    const title = info.title;

    const smartest = priciest(needs);
    const mistake = priciest(wants);

    const rows = [
      ...needs.map(item => ({ item, kind: 'need' })),
      ...wants.map(item => ({ item, kind: 'want' }))
    ];
    const totalDelay = 0.3 + rows.length * 0.12;

    content.innerHTML = `
      <div class="mart mart-result">
        ${stageHtml(COUNTER_X, mood, false)}
        <h2 class="mart-result-title is-${tier}">${esc(title)}</h2>

        <div class="mart-receipt">
          <div class="mart-receipt-head">MIIMIID MART</div>
          ${rows.map(({ item, kind }, index) => `
            <div class="mart-line is-${kind}" style="animation-delay:${0.3 + index * 0.12}s">
              <span class="mart-line-mark">${kind === 'need' ? '✓' : '●'}</span>
              <span class="mart-line-name">${esc(item.name)}</span>
              <span class="mart-line-tag">${kind === 'need' ? 'Need' : 'Want'}</span>
              <span class="mart-line-price">$${item.price}</span>
            </div>
          `).join('')}
          <div class="mart-receipt-total" style="animation-delay:${totalDelay}s"><span>Spent</span><strong>$${result.spent}</strong></div>
          <div class="mart-receipt-total" style="animation-delay:${totalDelay + 0.1}s"><span>Left in wallet</span><strong>$${result.saved}</strong></div>
        </div>

        <div class="mart-report">
          <div class="mart-report-title">🛒 YOUR SHOPPING REPORT</div>
          <div class="mart-report-grid">
            <div class="mart-report-stat"><strong>${needs.length} / ${result.totalNeeds}</strong><span>Needs covered</span></div>
            <div class="mart-report-stat"><strong>${wants.length}</strong><span>Wants bought</span></div>
            <div class="mart-report-stat"><strong>$${result.spent}</strong><span>Money spent</span></div>
            <div class="mart-report-stat"><strong>$${result.saved}</strong><span>Money remaining</span></div>
          </div>
          ${smartest ? `<div class="mart-report-line is-good"><span>Smartest decision</span><strong>${esc(smartest.name)} · $${smartest.price}</strong></div>` : ''}
          ${mistake ? `<div class="mart-report-line is-bad"><span>Biggest mistake</span><strong>${esc(mistake.name)} · $${mistake.price}</strong></div>` : ''}
          ${tradeoffHtml(result)}
        </div>

        <div class="mart-why">
          <div class="mart-why-title">WHY THIS RESULT</div>
          ${whyLines(tier, result, needs, wants, missed).map(line => `<p>${esc(line)}</p>`).join('')}
        </div>

        ${missed.length > 0 ? `
          <div class="mart-missed">
            <div class="mart-missed-title">Essentials you left behind</div>
            ${missed.map(item => `
              <div class="mart-missed-row">
                <div class="mart-missed-art">${miimiidFunProductVisual(item, 36)}</div>
                <div class="mart-missed-copy">
                  <strong>${esc(item.name)} · $${item.price}</strong>
                  <span>${esc(item.explanation || '')}</span>
                </div>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <div class="miimiid-fun-result-rewards">
          <span class="miimiid-fun-pill xp">+${xp} XP</span>
          <span class="miimiid-fun-pill coins">+${coins} coins</span>
        </div>

        <button type="button" class="miimiid-fun-hero-play" data-mart-again><span aria-hidden="true">&#9654;</span> Shop again</button>
        <button type="button" class="miimiid-fun-btn-ghost" data-mart-back>Back to Fun Center</button>
      </div>
    `;

    say(mood, info.message);
    miimiidFunPlayComplete();

    content.querySelector('[data-mart-again]').addEventListener('click', () => startMiimiidShop());
    content.querySelector('[data-mart-back]').addEventListener('click', () => renderMiimiidFunCenter());
  }

  function renderShop() {
    const content = document.getElementById('fun-center-content');
    const s = state;
    if (!content || !s) return;

    const cartSrc = MIIMIID_ASSETS.game && MIIMIID_ASSETS.game.shoppingCart;
    const cartIcon = cartSrc
      ? `<img src="${cartSrc}" alt="" onerror="this.outerHTML='🛒'">`
      : '🛒';

    content.innerHTML = `
      <div class="mart">
        <div class="mart-wallet">
          <div class="mart-wallet-main">
            <div class="mart-wallet-row"><span>Wallet</span><strong data-mart-remaining></strong></div>
            <div class="mart-bar"><div class="mart-bar-fill" data-level="high"></div></div>
          </div>
          <div class="mart-cart" data-mart-cart>${cartIcon}<span class="mart-cart-count" data-mart-count>0</span></div>
        </div>

        ${stageHtml(4, 'wave', true)}

        <div class="mart-aisles">
          ${AISLES.map(a => `<button type="button" class="mart-aisle" data-mart-aisle="${a.id}"><span aria-hidden="true">${a.icon}</span> ${esc(a.label)}</button>`).join('')}
        </div>

        <div class="mart-basket" data-mart-basket></div>

        <button type="button" class="mart-checkout" data-mart-checkout disabled>Pick something up first</button>
        <button type="button" class="miimiid-fun-btn-ghost" data-mart-leave>Leave the store</button>
      </div>
    `;

    content.querySelectorAll('[data-mart-aisle]').forEach(btn => {
      btn.addEventListener('click', () => { miimiidFunPlayTap(); selectAisle(btn.dataset.martAisle); });
    });
    content.querySelector('[data-mart-checkout]').addEventListener('click', () => checkout());
    content.querySelector('[data-mart-leave]').addEventListener('click', () => {
      if (state) { clearTimeout(state.walkTimer); clearTimeout(state.idleTimer); }
      state = null;
      renderMiimiidFunCenter();
    });

    refresh();
    say('wave', 'Welcome to Miimiid Mart!');
    showMission();
  }

  async function startMiimiidShop() {
    const content = document.getElementById('fun-center-content');
    if (!content) return;

    content.innerHTML = `<div class="miimiid-fun-loading">Entering the store…</div>`;

    try {
      const shop = await miimiidFunCenterRequest('/api/fun-center/shop');
      const session = await miimiidFunCenterRequest('/api/fun-center/shop/session', {
        method: 'POST',
        body: JSON.stringify({})
      });

      state = {
        shop,
        sessionId: session.sessionId,
        budget: session.budget,
        spent: 0,
        basket: [],
        purchases: [],
        needStreak: 0,
        aisle: null,
        x: 4,
        busy: false,
        checkingOut: false,
        missionOpen: false,
        eventOpen: false,
        eventsDone: [],
        walkTimer: null,
        idleTimer: null,
        hintIndex: 0
      };

      renderShop();
    } catch (error) {
      console.error('Miimiid mart start error:', error);
      content.innerHTML = `
        <div class="miimiid-fun-error">
          <p>${esc(error.message || 'Unable to open the store.')}</p>
          <button type="button" class="miimiid-fun-btn" data-mart-retry>Try again</button>
          <button type="button" class="miimiid-fun-btn" data-mart-back-error>Back to Fun Center</button>
        </div>
      `;
      content.querySelector('[data-mart-retry]').addEventListener('click', () => startMiimiidShop());
      content.querySelector('[data-mart-back-error]').addEventListener('click', () => { state = null; renderMiimiidFunCenter(); });
    }
  }

  // Replaces the older grid-based shop from fun-center.js.
  window.startMiimiidShop = startMiimiidShop;
})();
