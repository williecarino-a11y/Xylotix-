(function () {
  'use strict';

  const STYLE_ID = 'miimiid-auth-enhancements';
  const API = '/api/auth';

  const style = `
    .miimiid-auth-page { align-items: stretch !important; padding: clamp(18px, 4vw, 48px) !important; }
    .miimiid-auth-page.miimiid-enhanced { place-items: center; }
    .miimiid-auth-layout { width: min(1180px, 100%); min-height: min(760px, calc(100vh - 64px)); display:grid; grid-template-columns:minmax(0, 1.08fr) minmax(420px, .92fr); border:1px solid rgba(148,163,184,.15); border-radius:32px; overflow:hidden; background:rgba(7,17,31,.82); box-shadow:0 36px 100px rgba(0,0,0,.48); animation:miimiidIn .55s cubic-bezier(.2,.75,.25,1); }
    .miimiid-auth-story { position:relative; display:flex; flex-direction:column; justify-content:space-between; padding:clamp(34px,5vw,68px); overflow:hidden; background:radial-gradient(circle at 25% 25%,rgba(56,189,248,.18),transparent 34%),radial-gradient(circle at 75% 85%,rgba(37,99,235,.18),transparent 35%),linear-gradient(145deg,#08182a,#06101d 68%); border-right:1px solid rgba(148,163,184,.13); }
    .miimiid-auth-story::before { content:""; position:absolute; inset:0; opacity:.18; background-image:linear-gradient(rgba(148,163,184,.15) 1px,transparent 1px),linear-gradient(90deg,rgba(148,163,184,.15) 1px,transparent 1px); background-size:42px 42px; mask-image:linear-gradient(to bottom right,#000,transparent 78%); pointer-events:none; }
    .miimiid-auth-orbit { position:absolute; width:360px; height:360px; right:-110px; top:50%; transform:translateY(-50%); border:1px solid rgba(56,189,248,.14); border-radius:50%; box-shadow:0 0 0 52px rgba(56,189,248,.025),0 0 0 104px rgba(56,189,248,.018); animation:miimiidFloat 8s ease-in-out infinite; }
    .miimiid-auth-orbit::before,.miimiid-auth-orbit::after { content:""; position:absolute; width:9px; height:9px; border-radius:50%; background:#38bdf8; box-shadow:0 0 22px rgba(56,189,248,.9); }
    .miimiid-auth-orbit::before { left:34px; top:74px; }
    .miimiid-auth-orbit::after { right:48px; bottom:76px; width:7px; height:7px; background:#60a5fa; }
    .miimiid-story-content { position:relative; z-index:1; max-width:500px; }
    .miimiid-story-kicker { display:inline-flex; align-items:center; gap:8px; margin-bottom:22px; padding:7px 10px; border:1px solid rgba(56,189,248,.2); border-radius:999px; color:#bae6fd; background:rgba(56,189,248,.07); font-size:.74rem; font-weight:800; letter-spacing:.04em; text-transform:uppercase; }
    .miimiid-story-kicker::before { content:""; width:6px; height:6px; border-radius:50%; background:#38bdf8; box-shadow:0 0 10px #38bdf8; }
    .miimiid-story-title { margin:0; max-width:530px; font-size:clamp(2.45rem,5vw,4.6rem); line-height:.98; letter-spacing:-.06em; font-weight:900; }
    .miimiid-story-title span { color:#38bdf8; }
    .miimiid-story-copy { max-width:470px; margin:22px 0 0; color:#94a3b8; font-size:1rem; line-height:1.75; }
    .miimiid-story-points { position:relative; z-index:1; display:grid; grid-template-columns:repeat(3,1fr); gap:10px; max-width:560px; }
    .miimiid-story-point { padding:14px; border:1px solid rgba(148,163,184,.12); border-radius:15px; background:rgba(255,255,255,.025); }
    .miimiid-story-point strong { display:block; color:#f8fafc; font-size:.8rem; }
    .miimiid-story-point span { display:block; margin-top:4px; color:#64748b; font-size:.7rem; }
    .miimiid-auth-card { width:auto !important; min-height:100%; display:flex; align-items:center; padding:clamp(28px,4vw,54px) !important; border:0 !important; border-radius:0 !important; background:rgba(15,27,45,.76) !important; box-shadow:none !important; backdrop-filter:blur(18px); }
    .miimiid-auth-main,.miimiid-auth-verification { width:100%; }
    .miimiid-auth-brand { justify-content:flex-start !important; margin-bottom:28px !important; }
    .miimiid-auth-brand-name { font-size:1.15rem !important; }
    .miimiid-auth-heading { text-align:left !important; font-size:clamp(1.9rem,3vw,2.45rem) !important; }
    .miimiid-auth-subtitle { margin-left:0 !important; text-align:left !important; max-width:430px !important; }
    .miimiid-auth-tabs { margin-bottom:18px !important; }
    .miimiid-auth-forgot { display:flex; justify-content:flex-end; margin-top:-7px; }
    .miimiid-auth-link { border:0; padding:0; color:#7dd3fc; background:none; cursor:pointer; font:inherit; font-size:.8rem; font-weight:750; }
    .miimiid-auth-link:hover { color:#e0f2fe; text-decoration:underline; text-underline-offset:3px; }
    .miimiid-auth-transition { animation:miimiidStep .28s ease both; }
    .miimiid-password-meter { display:grid; gap:7px; margin-top:3px; }
    .miimiid-password-bars { display:grid; grid-template-columns:repeat(4,1fr); gap:5px; }
    .miimiid-password-bar { height:4px; border-radius:99px; background:#1e293b; transition:background .2s ease,transform .2s ease; }
    .miimiid-password-meter[data-level="1"] .miimiid-password-bar:nth-child(-n+1),.miimiid-password-meter[data-level="2"] .miimiid-password-bar:nth-child(-n+2),.miimiid-password-meter[data-level="3"] .miimiid-password-bar:nth-child(-n+3),.miimiid-password-meter[data-level="4"] .miimiid-password-bar:nth-child(-n+4) { background:#38bdf8; }
    .miimiid-password-label { display:flex; justify-content:space-between; color:#64748b; font-size:.72rem; }
    .miimiid-password-label strong { color:#94a3b8; }
    .miimiid-checks { display:grid; grid-template-columns:1fr 1fr; gap:6px 12px; margin-top:1px; }
    .miimiid-check { color:#64748b; font-size:.7rem; transition:color .18s ease; }
    .miimiid-check.ok { color:#86efac; }
    .miimiid-check::before { content:"○"; display:inline-block; width:17px; }
    .miimiid-check.ok::before { content:"✓"; }
    .miimiid-recovery-note { padding:12px 13px; margin-bottom:2px; border:1px solid rgba(56,189,248,.12); border-radius:12px; color:#94a3b8; background:rgba(56,189,248,.045); font-size:.76rem; line-height:1.55; }
    .miimiid-auth-progress { display:flex; align-items:center; gap:9px; margin-bottom:22px; }
    .miimiid-auth-progress-line { flex:1; height:4px; overflow:hidden; border-radius:99px; background:#172337; }
    .miimiid-auth-progress-line span { display:block; width:100%; height:100%; border-radius:inherit; background:linear-gradient(90deg,#0284c7,#38bdf8); animation:miimiidProgress .7s ease; }
    .miimiid-auth-progress-text { color:#64748b; font-size:.7rem; font-weight:750; white-space:nowrap; }
    .miimiid-auth-verification .miimiid-auth-logo { background:linear-gradient(145deg,#059669,#0284c7) !important; }
    @keyframes miimiidIn { from{opacity:0;transform:translateY(12px) scale(.985)} to{opacity:1;transform:none} }
    @keyframes miimiidStep { from{opacity:0;transform:translateX(7px)} to{opacity:1;transform:none} }
    @keyframes miimiidFloat { 0%,100%{transform:translateY(-50%) rotate(0deg)} 50%{transform:translateY(calc(-50% - 10px)) rotate(3deg)} }
    @keyframes miimiidProgress { from{width:0} to{width:100%} }
    @media (max-width:900px) { .miimiid-auth-layout{grid-template-columns:1fr;min-height:auto;max-width:620px}.miimiid-auth-story{display:none}.miimiid-auth-card{min-height:100%;}.miimiid-auth-page{padding:12px !important;} }
    @media (max-width:520px) { .miimiid-auth-card{padding:25px 18px !important}.miimiid-story-points{grid-template-columns:1fr}.miimiid-checks{grid-template-columns:1fr}.miimiid-auth-layout{border-radius:22px}.miimiid-auth-heading{text-align:left !important}.miimiid-auth-subtitle{text-align:left !important}.miimiid-auth-brand{justify-content:flex-start !important} }
    @media (prefers-reduced-motion:reduce) { .miimiid-auth-layout,.miimiid-auth-transition,.miimiid-auth-orbit{animation:none !important} }
  `;

  function addStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const el = document.createElement('style');
    el.id = STYLE_ID;
    el.textContent = style;
    document.head.appendChild(el);
  }

  function button(label, className, id) {
    return `<button type="button" class="${className}"${id ? ` id="${id}"` : ''}>${label}</button>`;
  }

  async function post(url, body) {
    const res = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json','Accept':'application/json'}, credentials:'include', body:JSON.stringify(body) });
    let data = null;
    try { data = await res.json(); } catch (_) {}
    if (!res.ok) throw new Error(data?.message || data?.error || 'Something went wrong. Please try again.');
    return data;
  }

  function message(text, type='error') {
    const el = document.getElementById('miimiid-auth-message');
    if (!el) return;
    el.textContent = text || '';
    el.className = `miimiid-auth-message ${text ? `show ${type}` : ''}`;
  }

  function busy(btn, state, label) {
    if (!btn) return;
    if (state) { btn.dataset.label = btn.textContent; btn.textContent = label; }
    else btn.textContent = btn.dataset.label || btn.textContent;
    btn.disabled = state;
    btn.setAttribute('aria-busy', String(state));
  }

  function scorePassword(value) {
    let score = 0;
    if (value.length >= 8) score++;
    if (value.length >= 12) score++;
    if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++;
    if (/\d/.test(value) && /[^A-Za-z0-9]/.test(value)) score++;
    return Math.min(score, 4);
  }

  function installPasswordMeter() {
    const field = document.getElementById('miimiid-register-password');
    if (!field || document.getElementById('miimiid-password-meter')) return;
    const meter = document.createElement('div');
    meter.id = 'miimiid-password-meter';
    meter.className = 'miimiid-password-meter';
    meter.dataset.level = '0';
    meter.innerHTML = `<div class="miimiid-password-bars"><span class="miimiid-password-bar"></span><span class="miimiid-password-bar"></span><span class="miimiid-password-bar"></span><span class="miimiid-password-bar"></span></div><div class="miimiid-password-label"><span>Password strength</span><strong id="miimiid-password-strength">Not set</strong></div><div class="miimiid-checks"><span class="miimiid-check" data-rule="length">8+ characters</span><span class="miimiid-check" data-rule="case">Upper + lowercase</span><span class="miimiid-check" data-rule="number">A number</span><span class="miimiid-check" data-rule="symbol">A special character</span></div>`;
    field.closest('.miimiid-auth-field').appendChild(meter);
    field.addEventListener('input', () => {
      const value = field.value;
      const level = scorePassword(value);
      const labels = ['Not set','Needs work','Fair','Strong','Excellent'];
      meter.dataset.level = String(level);
      document.getElementById('miimiid-password-strength').textContent = labels[level];
      meter.querySelector('[data-rule="length"]').classList.toggle('ok', value.length >= 8);
      meter.querySelector('[data-rule="case"]').classList.toggle('ok', /[a-z]/.test(value) && /[A-Z]/.test(value));
      meter.querySelector('[data-rule="number"]').classList.toggle('ok', /\d/.test(value));
      meter.querySelector('[data-rule="symbol"]').classList.toggle('ok', /[^A-Za-z0-9]/.test(value));
    });
  }

  function showView(view) {
    const main = document.getElementById('miimiid-auth-main');
    const verification = document.getElementById('miimiid-auth-verification');
    if (!main || !verification) return;
    main.classList.toggle('hide', view !== 'main');
    verification.classList.toggle('show', view === 'verification');
    if (view === 'main') {
      const extra = document.getElementById('miimiid-enhanced-view');
      if (extra) extra.remove();
    }
  }

  function mountView(title, subtitle, html, onSubmit) {
    const main = document.getElementById('miimiid-auth-main');
    if (!main) return;
    let view = document.getElementById('miimiid-enhanced-view');
    if (!view) { view = document.createElement('div'); view.id = 'miimiid-enhanced-view'; main.appendChild(view); }
    document.querySelectorAll('#miimiid-login-form,#miimiid-register-form,.miimiid-auth-tabs').forEach(el => el.style.display='none');
    document.getElementById('miimiid-auth-heading').textContent = title;
    document.getElementById('miimiid-auth-subtitle').textContent = subtitle;
    document.getElementById('miimiid-auth-message').className = 'miimiid-auth-message';
    view.innerHTML = `<div class="miimiid-auth-transition">${html}</div>`;
    view.style.display='block';
    const form = view.querySelector('form');
    if (form) form.addEventListener('submit', onSubmit);
  }

  function restoreMain(mode='login') {
    const view = document.getElementById('miimiid-enhanced-view');
    if (view) view.remove();
    document.querySelectorAll('#miimiid-login-form,#miimiid-register-form,.miimiid-auth-tabs').forEach(el => el.style.display='');
    const login = mode === 'login';
    document.getElementById('miimiid-login-form').style.display = login ? 'grid' : 'none';
    document.getElementById('miimiid-register-form').style.display = login ? 'none' : 'grid';
    document.getElementById('miimiid-auth-login-tab').classList.toggle('active', login);
    document.getElementById('miimiid-auth-register-tab').classList.toggle('active', !login);
    document.getElementById('miimiid-auth-login-tab').setAttribute('aria-selected',String(login));
    document.getElementById('miimiid-auth-register-tab').setAttribute('aria-selected',String(!login));
    document.getElementById('miimiid-auth-heading').textContent = login ? 'Welcome back' : 'Create your account';
    document.getElementById('miimiid-auth-subtitle').textContent = login ? 'Sign in to continue your learning journey.' : 'Create your Miimiid account and start learning.';
    message('');
    installPasswordMeter();
  }

  function openForgot() {
    mountView('Forgot your password?', 'No stress. Enter your email and we’ll send you a secure password reset link.', `<div class="miimiid-recovery-note">For your security, we won’t reveal whether an email address is registered. Check your inbox and spam folder for reset instructions.</div><form class="miimiid-auth-form" id="miimiid-forgot-form" novalidate><div class="miimiid-auth-field"><label class="miimiid-auth-label" for="miimiid-forgot-email">Email</label><input class="miimiid-auth-input" id="miimiid-forgot-email" type="email" autocomplete="email" placeholder="you@example.com" required></div><button class="miimiid-auth-submit" id="miimiid-forgot-submit" type="submit">Send reset link</button><button class="miimiid-auth-back" id="miimiid-forgot-back" type="button">← Back to sign in</button></form>`, async (event) => {
      event.preventDefault();
      const email = document.getElementById('miimiid-forgot-email').value.trim().toLowerCase();
      const btn = document.getElementById('miimiid-forgot-submit');
      if (!email || !email.includes('@')) { message('Enter a valid email address.'); return; }
      busy(btn,true,'Sending…');
      try { await post(`${API}/forgot-password`,{email}); document.getElementById('miimiid-forgot-form').innerHTML='<div class="miimiid-recovery-note">If an account exists for that email, reset instructions are on the way. You can safely close this page after checking your inbox.</div><button class="miimiid-auth-submit" id="miimiid-forgot-done" type="button">Back to sign in</button>'; document.getElementById('miimiid-forgot-done').addEventListener('click',()=>restoreMain('login')); }
      catch (e) { message(e.message); busy(btn,false); }
    });
    const back = document.getElementById('miimiid-forgot-back');
    back.addEventListener('click',()=>restoreMain('login'));
    document.getElementById('miimiid-forgot-email').focus();
  }

  function openReset(token) {
    mountView('Set a new password', 'Choose a strong password you have not used on this account before.', `<form class="miimiid-auth-form" id="miimiid-reset-form" novalidate><div class="miimiid-auth-field"><label class="miimiid-auth-label" for="miimiid-reset-password">New password</label><div class="miimiid-auth-input-wrap"><input class="miimiid-auth-input" id="miimiid-reset-password" type="password" autocomplete="new-password" minlength="8" placeholder="At least 8 characters" required><button class="miimiid-auth-password-toggle" id="miimiid-reset-toggle" type="button">Show</button></div><div id="miimiid-reset-meter" class="miimiid-password-meter" data-level="0"><div class="miimiid-password-bars"><span class="miimiid-password-bar"></span><span class="miimiid-password-bar"></span><span class="miimiid-password-bar"></span><span class="miimiid-password-bar"></span></div><div class="miimiid-password-label"><span>Password strength</span><strong id="miimiid-reset-strength">Not set</strong></div></div></div><div class="miimiid-auth-field"><label class="miimiid-auth-label" for="miimiid-reset-confirm">Confirm new password</label><div class="miimiid-auth-input-wrap"><input class="miimiid-auth-input" id="miimiid-reset-confirm" type="password" autocomplete="new-password" placeholder="Re-enter your password" required></div></div><button class="miimiid-auth-submit" id="miimiid-reset-submit" type="submit">Update password</button><button class="miimiid-auth-back" id="miimiid-reset-cancel" type="button">Cancel</button></form>`, async (event) => {
      event.preventDefault();
      const password = document.getElementById('miimiid-reset-password').value;
      const confirm = document.getElementById('miimiid-reset-confirm').value;
      const btn = document.getElementById('miimiid-reset-submit');
      if (scorePassword(password) < 2) { message('Choose a stronger password before continuing.'); return; }
      if (password !== confirm) { message('Passwords do not match.'); return; }
      busy(btn,true,'Updating…');
      try { await post(`${API}/reset-password`,{token,password,confirmPassword:confirm}); history.replaceState({},document.title,window.location.pathname); document.getElementById('miimiid-reset-form').innerHTML='<div class="miimiid-recovery-note">Your password has been updated successfully. You can now sign in with your new password.</div><button class="miimiid-auth-submit" id="miimiid-reset-done" type="button">Continue to sign in</button>'; document.getElementById('miimiid-reset-done').addEventListener('click',()=>restoreMain('login')); }
      catch(e){ message(e.message); busy(btn,false); }
    });
    document.getElementById('miimiid-reset-toggle').addEventListener('click',()=>{const input=document.getElementById('miimiid-reset-password'); const show=input.type==='text'; input.type=show?'password':'text'; document.getElementById('miimiid-reset-toggle').textContent=show?'Show':'Hide';});
    document.getElementById('miimiid-reset-password').addEventListener('input',(e)=>{const level=scorePassword(e.target.value);const meter=document.getElementById('miimiid-reset-meter');meter.dataset.level=String(level);document.getElementById('miimiid-reset-strength').textContent=['Not set','Needs work','Fair','Strong','Excellent'][level];});
    document.getElementById('miimiid-reset-cancel').addEventListener('click',()=>{history.replaceState({},document.title,window.location.pathname);restoreMain('login');});
    document.getElementById('miimiid-reset-password').focus();
  }

  function enhance() {
    const page = document.getElementById('miimiid-auth-view');
    const card = page?.querySelector('.miimiid-auth-card');
    if (!page || !card || page.dataset.enhanced === 'true') return false;
    page.dataset.enhanced='true';
    page.classList.add('miimiid-enhanced');
    const layout=document.createElement('div'); layout.className='miimiid-auth-layout';
    const story=document.createElement('aside'); story.className='miimiid-auth-story'; story.innerHTML='<div class="miimiid-auth-orbit" aria-hidden="true"></div><div class="miimiid-story-content"><div class="miimiid-story-kicker">Learn. Build. Grow.</div><h2 class="miimiid-story-title">Your next chapter starts <span>here.</span></h2><p class="miimiid-story-copy">A focused learning space for building useful skills, tracking progress, and turning curiosity into real momentum.</p></div><div class="miimiid-story-points"><div class="miimiid-story-point"><strong>Focused learning</strong><span>Learn at your pace</span></div><div class="miimiid-story-point"><strong>Progress tracking</strong><span>Keep your momentum</span></div><div class="miimiid-story-point"><strong>One secure account</strong><span>Your data stays protected</span></div></div>';
    page.innerHTML=''; page.appendChild(layout); layout.appendChild(story); layout.appendChild(card);
    const loginForm=document.getElementById('miimiid-login-form');
    if(loginForm && !document.getElementById('miimiid-forgot-link')) { const wrap=document.createElement('div');wrap.className='miimiid-auth-forgot';wrap.innerHTML='<button type="button" class="miimiid-auth-link" id="miimiid-forgot-link">Forgot password?</button>';loginForm.insertBefore(wrap,loginForm.querySelector('.miimiid-auth-submit')); }
    document.getElementById('miimiid-forgot-link')?.addEventListener('click',openForgot);
    installPasswordMeter();
    const params=new URLSearchParams(window.location.search); const token=params.get('resetToken'); if(token) openReset(token);
    return true;
  }

  function wait() { if (!enhance()) window.setTimeout(wait,60); }
  addStyles();
  wait();
})();
