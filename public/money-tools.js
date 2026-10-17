(function () {
  'use strict';
  if (window.__mmMoneyInstalled) return;
  window.__mmMoneyInstalled = true;

  /* ---------- styles ---------- */
  var style = document.createElement('style');
  style.textContent = `
.mm-money-row {
  width: 100%; box-sizing: border-box; display: flex; align-items: center; gap: 12px;
  margin: 0 0 16px; padding: 14px 18px;
  border: 1px solid #1f2a44; border-radius: 16px; background: #111a2e;
  color: #f1f5f9; font-family: inherit; text-align: left; cursor: pointer;
  transition: background 0.18s ease, transform 0.15s ease;
}
.mm-money-row:active { transform: scale(0.985); background: #16213a; }
.mm-money-text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.mm-money-text strong { font-size: 1rem; font-weight: 700; }
.mm-money-text small { color: #94a3b8; font-size: 0.85rem; }
.mm-money-row svg { flex: 0 0 auto; color: #64748b; }

.mm-res { max-width: 560px; margin: 0 auto; }
.mm-res-hero { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 6px 0 16px; text-align: center; }
.mm-res-hero small { color: #94a3b8; font-size: 0.85rem; font-weight: 600; }
.mm-res-hero strong { color: #f8fafc; font-size: 2.1rem; font-weight: 800; letter-spacing: -0.01em; }
.mm-res-hero strong.is-pos { color: #4ade80; }
.mm-res-hero strong.is-neg { color: #f87171; }
.mm-res-row {
  display: flex; justify-content: space-between; gap: 16px; padding: 14px 4px;
  border-bottom: 1px solid #1c2640; color: #aab6cc; font-size: 0.95rem;
}
.mm-res-row:first-of-type { border-top: 1px solid #1c2640; }
.mm-res-row strong { color: #f1f5f9; font-weight: 700; text-align: right; }
.mm-pbar { height: 6px; border-radius: 6px; background: #1c2640; overflow: hidden; margin-bottom: 14px; }
.mm-pbar i { display: block; height: 100%; width: 0; border-radius: 6px; background: #4da3ff; transition: width 0.3s ease; }
.mm-pbar i.is-over { background: #f87171; }

.mm-exp { display: flex; align-items: center; gap: 10px; padding: 8px 0 8px 4px; border-bottom: 1px solid #1c2640; }
.mm-exp-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #e6e9f0; font-weight: 600; }
.mm-exp-amt { color: #94a3b8; font-weight: 600; }
.mm-exp-del {
  width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;
  border: 0; border-radius: 10px; background: transparent; color: #64748b; cursor: pointer;
}
.mm-exp-del:active { background: #1e293b; }
.mm-chips { display: flex; flex-wrap: wrap; gap: 8px; margin: 16px 0 12px; }
.mm-chip {
  padding: 8px 14px; border: 1px solid #26314d; border-radius: 999px; background: transparent;
  color: #aab6cc; font-family: inherit; font-size: 0.85rem; font-weight: 600; cursor: pointer;
}
.mm-chip:active { background: #16213a; }
.mm-addrow { display: flex; gap: 10px; margin-bottom: 12px; }
.mm-addrow .mm-sf-input { min-width: 0; }
.mm-addrow .is-name { flex: 1.5; }
.mm-addrow .is-amt { flex: 1; }
.mm-status { min-height: 1.3em; margin: 14px 0 0; color: #64748b; font-size: 0.85rem; text-align: center; }
.mm-status.is-error { color: #f87171; }
.mm-note-small { margin: 0; color: #8b95ad; font-size: 0.85rem; line-height: 1.55; }
.mm-empty { padding: 14px 4px; color: #8b95ad; font-size: 0.92rem; }

.mm-goal {
  width: 100%; box-sizing: border-box; display: flex; flex-direction: column; gap: 10px;
  padding: 16px 4px 6px; border: 0; border-bottom: 1px solid #1c2640; background: transparent;
  color: inherit; font-family: inherit; text-align: left; cursor: pointer;
}
.mm-goal:active { background: rgba(148, 163, 184, 0.08); }
.mm-goal-top { display: flex; justify-content: space-between; gap: 12px; color: #f1f5f9; font-weight: 700; }
.mm-goal-top span:last-child { color: #94a3b8; font-weight: 600; font-size: 0.9rem; }
.mm-goal-sub { color: #94a3b8; font-size: 0.85rem; padding-bottom: 12px; }
.mm-sf-btn.is-ghost { background: transparent; border: 1px solid #26314d; color: #e6e9f0; }
`;
  document.head.appendChild(style);

  /* ---------- helpers ---------- */
  var CHEVRON = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>';
  var CLOSE = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
  var CHECK = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#4da3ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>';

  var CURRENCIES = [
    ['\u20A6', 'Nigerian naira'],
    ['$', 'US dollar'],
    ['\u00A3', 'British pound'],
    ['\u20AC', 'Euro'],
    ['GH\u20B5', 'Ghanaian cedi'],
    ['KSh', 'Kenyan shilling'],
    ['R', 'South African rand']
  ];

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function api(url, options) {
    var settings = Object.assign({
      credentials: 'same-origin',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
    }, options || {});
    return fetch(url, settings).then(function (response) {
      return response.json().catch(function () { return {}; }).then(function (data) {
        return { ok: response.ok, status: response.status, data: data };
      });
    });
  }

  function put(path, payload) {
    return api('/api/learn/money/' + path, { method: 'PUT', body: JSON.stringify(payload) });
  }

  function num(value) {
    var s = String(value == null ? '' : value).replace(/[,\s]/g, '');
    return s === '' ? NaN : Number(s);
  }

  function uid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }

  function account() { return window.MiimiidAccount; }
  function toast(text) { var a = account(); if (a && a.toast) a.toast(text); }

  var plan = null;
  var hubValueEl = null;
  var goalsBody = null;

  function defaultCurrency() {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone === 'Africa/Lagos' ? '\u20A6' : '$';
    } catch (e) { return '$'; }
  }
  function cur() { return (plan && plan.currency) || defaultCurrency(); }

  function money(n, minDecimals) {
    var v = Number(n);
    if (!isFinite(v)) v = 0;
    return cur() + v.toLocaleString(undefined, {
      minimumFractionDigits: minDecimals == null ? 0 : minDecimals,
      maximumFractionDigits: 2
    });
  }

  function loadPlan() {
    return api('/api/learn/money').then(function (r) {
      var d = r.ok && r.data && r.data.data;
      if (!d) throw new Error('load failed');
      plan = {
        currency: typeof d.currency === 'string' ? d.currency : '',
        budget: {
          income: Number(d.budget && d.budget.income) || 0,
          items: Array.isArray(d.budget && d.budget.items) ? d.budget.items : []
        },
        goals: Array.isArray(d.goals) ? d.goals : []
      };
      return plan;
    });
  }

  function field(id, label, extra) {
    return '<label class="mm-sf-field"><span class="mm-sf-label">' + esc(label) + '</span>' +
      '<input class="mm-sf-input" id="' + id + '" type="text" inputmode="decimal" autocomplete="off" ' + (extra || '') + '></label>';
  }

  /* =====================================================
     HUB
     ===================================================== */
  function hubRow(id, label, value) {
    return '<button type="button" class="mm-lrow" data-tool="' + id + '">' +
      '<span class="mm-lrow-label">' + esc(label) + '</span>' +
      (value ? '<span class="mm-lrow-value"' + (id === 'currency' ? ' id="mm-hub-cur"' : '') + '>' + esc(value) + '</span>' : '') +
      CHEVRON + '</button>';
  }

  function renderHub(body) {
    body.innerHTML =
      '<div class="mm-res">' +
        '<p class="mm-sf-help" style="margin-bottom:18px">Plan your money and test ideas with your own numbers. These tools are for learning, not financial advice.</p>' +
        '<div class="mm-label">Plan</div>' +
        '<div class="mm-list">' + hubRow('budget', 'Budget planner') + hubRow('goals', 'Savings goals') + '</div>' +
        '<div class="mm-label">Calculators</div>' +
        '<div class="mm-list">' + hubRow('loan', 'Loan calculator') + hubRow('compound', 'Compound interest') + '</div>' +
        '<div class="mm-label">Settings</div>' +
        '<div class="mm-list">' + hubRow('currency', 'Currency', cur()) + '</div>' +
      '</div>';

    hubValueEl = body.querySelector('#mm-hub-cur');

    body.onclick = function (event) {
      var target = event.target.closest ? event.target.closest('[data-tool]') : null;
      if (!target) return;
      var tool = target.getAttribute('data-tool');
      if (tool === 'budget') openBudget();
      else if (tool === 'goals') openGoals();
      else if (tool === 'loan') openLoan();
      else if (tool === 'compound') openCompound();
      else if (tool === 'currency') openCurrency();
    };
  }

  function openHub() {
    var a = account();
    if (!a || !a.openSub) return;
    a.openSub('Money tools', function (body) {
      body.innerHTML = '<div class="mm-res"><p class="mm-sf-help">Loading...</p></div>';
      loadPlan().then(function () { renderHub(body); }).catch(function () {
        body.innerHTML = '<div class="mm-res"><p class="mm-sf-help">Could not load your money tools. Check your connection and try again.</p></div>';
      });
    });
  }

  /* =====================================================
     BUDGET PLANNER
     ===================================================== */
  function openBudget() {
    account().openSub('Budget planner', function (body) {
      var b = plan.budget;
      var timer = null;

      body.innerHTML =
        '<div class="mm-res">' +
          '<div class="mm-res-hero"><small>Left this month</small><strong id="mm-b-left"></strong></div>' +
          '<div class="mm-pbar"><i id="mm-b-bar"></i></div>' +
          '<div class="mm-res-row"><span>Spent</span><strong id="mm-b-spent"></strong></div>' +
          '<div style="margin-top:20px">' + field('mm-b-income', 'Monthly income', 'placeholder="0" value="' + (b.income ? esc(b.income) : '') + '"') + '</div>' +
          '<div class="mm-label">Expenses</div>' +
          '<div id="mm-b-list"></div>' +
          '<div class="mm-chips" id="mm-b-chips">' +
            ['Rent', 'Food', 'Transport', 'Bills', 'Savings'].map(function (n) {
              return '<button type="button" class="mm-chip" data-name="' + n + '">' + n + '</button>';
            }).join('') +
          '</div>' +
          '<div class="mm-addrow">' +
            '<input class="mm-sf-input is-name" id="mm-b-name" type="text" maxlength="40" placeholder="Expense name" autocomplete="off">' +
            '<input class="mm-sf-input is-amt" id="mm-b-amt" type="text" inputmode="decimal" placeholder="Amount" autocomplete="off">' +
          '</div>' +
          '<button type="button" class="mm-sf-btn is-ghost" id="mm-b-add"><span>Add expense</span></button>' +
          '<div class="mm-status" id="mm-b-status"></div>' +
          '<p class="mm-note-small" style="margin-top:14px">A common guideline is about 50% of income for needs, 30% for wants and 20% for savings. Adjust it to fit your life.</p>' +
        '</div>';

      var leftEl = body.querySelector('#mm-b-left');
      var barEl = body.querySelector('#mm-b-bar');
      var spentEl = body.querySelector('#mm-b-spent');
      var listEl = body.querySelector('#mm-b-list');
      var incomeEl = body.querySelector('#mm-b-income');
      var nameEl = body.querySelector('#mm-b-name');
      var amtEl = body.querySelector('#mm-b-amt');
      var statusEl = body.querySelector('#mm-b-status');

      function status(text, error) {
        statusEl.textContent = text || '';
        statusEl.className = 'mm-status' + (error ? ' is-error' : '');
      }

      function queueSave() {
        status('Saving...');
        clearTimeout(timer);
        timer = setTimeout(function () {
          put('budget', { budget: { income: b.income, items: b.items } }).then(function (r) {
            if (r.ok) status('Saved');
            else status((r.data && r.data.message) || 'Could not save. Check your connection.', true);
          }).catch(function () { status('Could not save. Check your connection.', true); });
        }, 700);
      }

      function paint() {
        var spent = b.items.reduce(function (t, i) { return t + (Number(i.amount) || 0); }, 0);
        var left = (Number(b.income) || 0) - spent;

        leftEl.textContent = (left < 0 ? '-' : '') + money(Math.abs(left));
        leftEl.className = b.income > 0 ? (left < 0 ? 'is-neg' : 'is-pos') : '';
        spentEl.textContent = money(spent);
        barEl.style.width = (b.income > 0 ? Math.min(100, (spent / b.income) * 100) : 0) + '%';
        barEl.className = b.income > 0 && spent > b.income ? 'is-over' : '';

        listEl.innerHTML = b.items.length
          ? b.items.map(function (item) {
              return '<div class="mm-exp"><span class="mm-exp-name">' + esc(item.name) + '</span>' +
                '<span class="mm-exp-amt">' + money(item.amount) + '</span>' +
                '<button type="button" class="mm-exp-del" data-del="' + esc(item.id) + '" aria-label="Remove ' + esc(item.name) + '">' + CLOSE + '</button></div>';
            }).join('')
          : '<p class="mm-empty">No expenses yet. Add your first one below.</p>';
      }

      incomeEl.addEventListener('input', function () {
        var v = num(incomeEl.value);
        b.income = isFinite(v) && v >= 0 ? v : 0;
        paint();
        queueSave();
      });

      body.querySelector('#mm-b-chips').addEventListener('click', function (e) {
        var chip = e.target.closest ? e.target.closest('[data-name]') : null;
        if (!chip) return;
        nameEl.value = chip.getAttribute('data-name');
        amtEl.focus();
      });

      body.querySelector('#mm-b-add').addEventListener('click', function () {
        var name = nameEl.value.trim();
        var amount = num(amtEl.value);
        if (!name) { status('Enter an expense name.', true); return; }
        if (!(amount >= 0) || !isFinite(amount)) { status('Enter an amount.', true); return; }
        if (b.items.length >= 40) { status('You can add up to 40 expenses.', true); return; }

        b.items.push({ id: uid(), name: name.slice(0, 40), amount: Math.round(amount * 100) / 100 });
        nameEl.value = '';
        amtEl.value = '';
        paint();
        queueSave();
      });

      listEl.addEventListener('click', function (e) {
        var btn = e.target.closest ? e.target.closest('[data-del]') : null;
        if (!btn) return;
        var id = btn.getAttribute('data-del');
        b.items = b.items.filter(function (i) { return i.id !== id; });
        plan.budget.items = b.items;
        paint();
        queueSave();
      });

      paint();
    });
  }

  /* =====================================================
     SAVINGS GOALS
     ===================================================== */
  function pctOf(goal) {
    return goal.target > 0 ? Math.min(100, Math.round((goal.saved / goal.target) * 100)) : 0;
  }

  function renderGoals(body) {
    var goals = plan.goals;

    body.innerHTML =
      '<div class="mm-res">' +
        (goals.length
          ? '<div style="border-top:1px solid #1c2640">' + goals.map(function (g) {
              var pct = pctOf(g);
              return '<button type="button" class="mm-goal" data-goal="' + esc(g.id) + '">' +
                '<span class="mm-goal-top"><span>' + esc(g.name) + '</span><span>' + pct + '%</span></span>' +
                '<span class="mm-pbar" style="margin:0"><i style="width:' + pct + '%"></i></span>' +
                '<span class="mm-goal-sub">' + money(g.saved) + ' of ' + money(g.target) + '</span></button>';
            }).join('') + '</div>'
          : '<div class="mm-res-hero" style="padding-top:30px"><strong style="font-size:1.3rem">No goals yet</strong>' +
            '<p class="mm-note-small">Set a target, track what you have saved, and see how much to set aside each month.</p></div>') +
        '<button type="button" class="mm-sf-btn" id="mm-g-new" style="margin-top:22px"' + (goals.length >= 10 ? ' disabled' : '') + '><span>Add a goal</span></button>' +
        (goals.length >= 10 ? '<p class="mm-note-small" style="margin-top:10px;text-align:center">You can keep up to 10 goals.</p>' : '') +
      '</div>';

    body.onclick = function (e) {
      var item = e.target.closest ? e.target.closest('[data-goal]') : null;
      if (item) {
        var id = item.getAttribute('data-goal');
        var found = plan.goals.filter(function (g) { return g.id === id; })[0];
        if (found) openGoalForm(found);
        return;
      }
      if (e.target.closest && e.target.closest('#mm-g-new')) openGoalForm(null);
    };
  }

  function refreshGoals() {
    if (goalsBody && document.body.contains(goalsBody)) renderGoals(goalsBody);
  }

  function openGoals() {
    account().openSub('Savings goals', function (body) {
      goalsBody = body;
      renderGoals(body);
    });
  }

  function openGoalForm(goal) {
    var isNew = !goal;
    var g = goal || { id: uid(), name: '', target: 0, saved: 0, deadline: null };

    account().openSub(isNew ? 'New goal' : 'Edit goal', function (body) {
      body.innerHTML =
        '<div class="mm-res">' +
          '<div class="mm-res-hero"><small>Saved so far</small><strong id="mm-g-pct">0%</strong></div>' +
          '<div class="mm-pbar"><i id="mm-g-bar"></i></div>' +
          '<p class="mm-note-small" id="mm-g-need" style="text-align:center;min-height:1.4em"></p>' +
          '<form class="mm-sf" novalidate style="margin-top:20px">' +
            '<label class="mm-sf-field"><span class="mm-sf-label">Goal name</span>' +
              '<input class="mm-sf-input" id="mm-g-name" type="text" maxlength="60" autocomplete="off" placeholder="Emergency fund" value="' + esc(g.name) + '"></label>' +
            field('mm-g-target', 'Target amount', 'placeholder="0" value="' + (g.target ? esc(g.target) : '') + '"') +
            field('mm-g-saved', 'Saved so far', 'placeholder="0" value="' + (g.saved ? esc(g.saved) : '') + '"') +
            (isNew ? '' :
              '<div class="mm-addrow" style="align-items:flex-end"><label class="mm-sf-field" style="flex:1"><span class="mm-sf-label">Add money</span>' +
              '<input class="mm-sf-input" id="mm-g-more" type="text" inputmode="decimal" autocomplete="off" placeholder="Amount"></label>' +
              '<button type="button" class="mm-sf-btn is-ghost" id="mm-g-more-btn" style="width:auto;padding:0 22px"><span>Add</span></button></div>') +
            '<label class="mm-sf-field"><span class="mm-sf-label">Target date (optional)</span>' +
              '<input class="mm-sf-input" id="mm-g-date" type="date" value="' + esc(g.deadline || '') + '"></label>' +
            '<div class="mm-sf-msg" role="alert"></div>' +
            '<button type="submit" class="mm-sf-btn"><span>Save goal</span></button>' +
            (isNew ? '' : '<button type="button" class="mm-sf-btn is-danger" id="mm-g-del"><span>Delete goal</span></button>') +
          '</form>' +
        '</div>';

      var nameEl = body.querySelector('#mm-g-name');
      var targetEl = body.querySelector('#mm-g-target');
      var savedEl = body.querySelector('#mm-g-saved');
      var dateEl = body.querySelector('#mm-g-date');
      var pctEl = body.querySelector('#mm-g-pct');
      var barEl = body.querySelector('#mm-g-bar');
      var needEl = body.querySelector('#mm-g-need');
      var msg = body.querySelector('.mm-sf-msg');
      var form = body.querySelector('form');
      var submit = form.querySelector('button[type="submit"]');

      function summary() {
        var target = num(targetEl.value);
        var saved = num(savedEl.value);
        if (!isFinite(saved)) saved = 0;
        var pct = target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0;
        pctEl.textContent = pct + '%';
        barEl.style.width = pct + '%';

        var text = '';
        if (target > 0 && saved >= target) {
          text = 'Goal reached.';
        } else if (target > 0 && dateEl.value) {
          var end = new Date(dateEl.value + 'T00:00:00').getTime();
          if (end <= Date.now()) {
            text = 'That date has passed. Pick a later date to see a monthly amount.';
          } else {
            var months = Math.max(1, Math.ceil((end - Date.now()) / (30.4375 * 86400000)));
            text = 'To reach it by then, set aside about ' + money((target - saved) / months, 2) + ' a month.';
          }
        } else if (target > 0) {
          text = money(target - saved) + ' to go.';
        }
        needEl.textContent = text;
      }

      [targetEl, savedEl, dateEl].forEach(function (el) { el.addEventListener('input', summary); });
      summary();

      var moreBtn = body.querySelector('#mm-g-more-btn');
      if (moreBtn) {
        moreBtn.addEventListener('click', function () {
          var moreEl = body.querySelector('#mm-g-more');
          var more = num(moreEl.value);
          if (!(more > 0)) return;
          var current = num(savedEl.value);
          if (!isFinite(current)) current = 0;
          savedEl.value = String(Math.round((current + more) * 100) / 100);
          moreEl.value = '';
          summary();
        });
      }

      function commit(list, message) {
        submit.disabled = true;
        put('goals', { goals: list }).then(function (r) {
          if (r.ok) {
            plan.goals = list;
            window.MiimiidDrawer.close();
            refreshGoals();
            toast(message);
          } else {
            submit.disabled = false;
            msg.textContent = (r.data && r.data.message) || 'Unable to save your goal.';
          }
        }).catch(function () {
          submit.disabled = false;
          msg.textContent = 'Could not reach the server. Check your connection.';
        });
      }

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var name = nameEl.value.trim();
        var target = num(targetEl.value);
        var saved = num(savedEl.value);
        if (!isFinite(saved)) saved = 0;

        if (!name) { msg.textContent = 'Give your goal a name.'; return; }
        if (!(target > 0)) { msg.textContent = 'Enter a target amount.'; return; }
        if (saved < 0) { msg.textContent = 'Saved amount cannot be negative.'; return; }
        msg.textContent = '';

        var updated = {
          id: g.id,
          name: name.slice(0, 60),
          target: Math.round(target * 100) / 100,
          saved: Math.round(saved * 100) / 100,
          deadline: dateEl.value || null
        };

        var list = plan.goals.slice();
        var index = -1;
        list.forEach(function (item, i) { if (item.id === g.id) index = i; });
        if (index === -1) list.push(updated); else list[index] = updated;

        commit(list, 'Goal saved');
      });

      var delBtn = body.querySelector('#mm-g-del');
      if (delBtn) {
        var armed = false;
        var delTimer = null;
        delBtn.addEventListener('click', function () {
          if (!armed) {
            armed = true;
            delBtn.querySelector('span').textContent = 'Tap again to delete';
            delTimer = setTimeout(function () {
              armed = false;
              delBtn.querySelector('span').textContent = 'Delete goal';
            }, 3000);
            return;
          }
          clearTimeout(delTimer);
          commit(plan.goals.filter(function (item) { return item.id !== g.id; }), 'Goal deleted');
        });
      }
    });
  }

  /* =====================================================
     LOAN CALCULATOR
     ===================================================== */
  function openLoan() {
    account().openSub('Loan calculator', function (body) {
      body.innerHTML =
        '<div class="mm-res">' +
          '<div class="mm-res-hero"><small>Monthly payment</small><strong id="mm-l-pay">-</strong></div>' +
          '<div class="mm-res-row"><span>Total you will pay</span><strong id="mm-l-total">-</strong></div>' +
          '<div class="mm-res-row"><span>Total interest</span><strong id="mm-l-int">-</strong></div>' +
          '<form class="mm-sf" novalidate style="margin-top:22px">' +
            field('mm-l-amt', 'Loan amount', 'placeholder="0"') +
            field('mm-l-rate', 'Interest rate per year (%)', 'placeholder="0"') +
            '<div class="mm-addrow" style="align-items:flex-end"><label class="mm-sf-field" style="flex:1"><span class="mm-sf-label">Loan length</span>' +
              '<input class="mm-sf-input" id="mm-l-term" type="text" inputmode="decimal" autocomplete="off" placeholder="12"></label>' +
              '<label class="mm-sf-field" style="flex:1"><span class="mm-sf-label">&nbsp;</span>' +
              '<select class="mm-sf-input" id="mm-l-unit"><option value="months">Months</option><option value="years">Years</option></select></label></div>' +
          '</form>' +
          '<p class="mm-note-small" style="margin-top:18px">An estimate for learning. Real loans can include fees, insurance and different interest rules, so check the lender\u2019s terms.</p>' +
        '</div>';

      var amt = body.querySelector('#mm-l-amt');
      var rate = body.querySelector('#mm-l-rate');
      var term = body.querySelector('#mm-l-term');
      var unit = body.querySelector('#mm-l-unit');
      var pay = body.querySelector('#mm-l-pay');
      var total = body.querySelector('#mm-l-total');
      var interest = body.querySelector('#mm-l-int');

      body.querySelector('form').addEventListener('submit', function (e) { e.preventDefault(); });

      function calc() {
        var P = num(amt.value);
        var annual = num(rate.value);
        var n = Math.round(num(term.value) * (unit.value === 'years' ? 12 : 1));

        if (!(P > 0) || !(annual >= 0 && annual <= 100) || !(n >= 1 && n <= 600)) {
          pay.textContent = total.textContent = interest.textContent = '-';
          return;
        }

        var r = annual / 100 / 12;
        var monthly = r === 0 ? P / n : (P * r) / (1 - Math.pow(1 + r, -n));
        var paid = monthly * n;

        pay.textContent = money(monthly, 2);
        total.textContent = money(paid, 2);
        interest.textContent = money(paid - P, 2);
      }

      [amt, rate, term].forEach(function (el) { el.addEventListener('input', calc); });
      unit.addEventListener('change', calc);
    });
  }

  /* =====================================================
     COMPOUND INTEREST CALCULATOR
     ===================================================== */
  function openCompound() {
    account().openSub('Compound interest', function (body) {
      body.innerHTML =
        '<div class="mm-res">' +
          '<div class="mm-res-hero"><small id="mm-c-title">Balance at the end</small><strong id="mm-c-final">-</strong></div>' +
          '<div class="mm-res-row"><span>You put in</span><strong id="mm-c-in">-</strong></div>' +
          '<div class="mm-res-row"><span>Interest earned</span><strong id="mm-c-earned">-</strong></div>' +
          '<form class="mm-sf" novalidate style="margin-top:22px">' +
            field('mm-c-start', 'Starting amount', 'placeholder="0"') +
            field('mm-c-monthly', 'Monthly contribution', 'placeholder="0"') +
            field('mm-c-rate', 'Interest rate per year (%)', 'placeholder="0"') +
            field('mm-c-years', 'Number of years', 'placeholder="10"') +
          '</form>' +
          '<div id="mm-c-years-list"></div>' +
          '<p class="mm-note-small" style="margin-top:18px">An illustration, not a prediction. Real returns vary and are never guaranteed. Interest is added monthly here.</p>' +
        '</div>';

      var startEl = body.querySelector('#mm-c-start');
      var monthlyEl = body.querySelector('#mm-c-monthly');
      var rateEl = body.querySelector('#mm-c-rate');
      var yearsEl = body.querySelector('#mm-c-years');
      var finalEl = body.querySelector('#mm-c-final');
      var titleEl = body.querySelector('#mm-c-title');
      var inEl = body.querySelector('#mm-c-in');
      var earnedEl = body.querySelector('#mm-c-earned');
      var listEl = body.querySelector('#mm-c-years-list');

      body.querySelector('form').addEventListener('submit', function (e) { e.preventDefault(); });

      function calc() {
        var start = num(startEl.value);
        var monthly = num(monthlyEl.value);
        var annual = num(rateEl.value);
        var years = Math.round(num(yearsEl.value));
        if (!isFinite(start)) start = 0;
        if (!isFinite(monthly)) monthly = 0;

        if (start < 0 || monthly < 0 || (start === 0 && monthly === 0) ||
            !(annual >= 0 && annual <= 100) || !(years >= 1 && years <= 60)) {
          finalEl.textContent = inEl.textContent = earnedEl.textContent = '-';
          titleEl.textContent = 'Balance at the end';
          listEl.innerHTML = '';
          return;
        }

        var r = annual / 100 / 12;
        var balance = start;
        var contributed = start;
        var rows = [];

        for (var m = 1; m <= years * 12; m++) {
          balance = balance * (1 + r) + monthly;
          contributed += monthly;
          if (m % 12 === 0) rows.push({ year: m / 12, balance: balance });
        }

        titleEl.textContent = 'Balance after ' + years + (years === 1 ? ' year' : ' years');
        finalEl.textContent = money(balance, 2);
        inEl.textContent = money(contributed, 2);
        earnedEl.textContent = money(balance - contributed, 2);

        listEl.innerHTML =
          '<div class="mm-label" style="margin-top:24px">Year by year</div>' +
          rows.map(function (row) {
            return '<div class="mm-res-row"><span>Year ' + row.year + '</span><strong>' + money(row.balance, 2) + '</strong></div>';
          }).join('');
      }

      [startEl, monthlyEl, rateEl, yearsEl].forEach(function (el) { el.addEventListener('input', calc); });
    });
  }

  /* =====================================================
     CURRENCY
     ===================================================== */
  function openCurrency() {
    account().openSub('Currency', function (body) {
      body.innerHTML =
        '<div class="mm-res"><p class="mm-sf-help" style="margin-bottom:14px">Used for amounts in your budget, goals and calculators.</p>' +
        '<div class="mm-list">' +
        CURRENCIES.map(function (c) {
          return '<button type="button" class="mm-lrow" data-cur="' + c[0] + '">' +
            '<span class="mm-lrow-label">' + esc(c[0]) + '  ' + esc(c[1]) + '</span>' +
            (cur() === c[0] ? CHECK : '') + '</button>';
        }).join('') +
        '</div></div>';

      body.onclick = function (e) {
        var btn = e.target.closest ? e.target.closest('[data-cur]') : null;
        if (!btn) return;
        var symbol = btn.getAttribute('data-cur');
        put('currency', { currency: symbol }).then(function (r) {
          if (r.ok) {
            plan.currency = symbol;
            if (hubValueEl && document.body.contains(hubValueEl)) hubValueEl.textContent = symbol;
            window.MiimiidDrawer.close();
            toast('Currency updated');
          } else {
            toast((r.data && r.data.message) || 'Unable to save your currency.');
          }
        }).catch(function () { toast('Could not reach the server.'); });
      };
    });
  }

  /* =====================================================
     THE ROW ON HOME
     ===================================================== */
  function inject() {
    var content = document.querySelector('#miimiid-dashboard .miimiid-dashboard-content');
    if (!content || content.querySelector('.mm-money-row')) return;

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'mm-money-row';
    btn.innerHTML =
      '<span class="mm-money-text"><strong>Money tools</strong><small>Budget, goals and calculators</small></span>' + CHEVRON;
    btn.addEventListener('click', openHub);

    var grid = content.querySelector('.miimiid-dashboard-stat-grid');
    if (grid) content.insertBefore(btn, grid);
    else content.appendChild(btn);
  }

  var dash = document.getElementById('miimiid-dashboard');
  if (dash) {
    new MutationObserver(inject).observe(dash, { childList: true });
    inject();
  }
})();
