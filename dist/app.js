(() => {
  'use strict';

  const STORAGE_KEY = 'econ-with-k.token-of-trust.case-lab.v1';
  const STAGE_NAMES = ['Prepare', 'RoundRobin', 'Challenge', 'Decision'];
  const DEFAULT_SECONDS = [120, 60, 420, 300];
  const CASE_OPTIONS = ['B2C · Individual consumers', 'B2B · Business customers'];
  const DEFAULT_CRITERIA = ['Customer need and product fit', 'Acquisition cost and lifetime value'];
  const $ = (selector) => document.querySelector(selector);
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const cleanString = (value, limit = 3000) => typeof value === 'string' ? value.slice(0, limit) : '';
  const freshState = () => ({
    version: 1, teamName: '', names: ['', '', '', ''], contributions: ['', '', '', ''],
    options: [...CASE_OPTIONS], criteria: [...DEFAULT_CRITERIA], comparison: ['', '', '', ''], recommendation: '', evidence1: '', evidence2: '',
    tradeoff: '', dataDecision: '', exits: ['', '', '', ''], transfer: '', stage: 0, turn: 0,
    seconds: [...DEFAULT_SECONDS], updatedAt: ''
  });

  let storageWorks = true;
  function loadState() {
    const base = freshState();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return base;
      const saved = JSON.parse(raw);
      if (!saved || saved.version !== 1 || typeof saved !== 'object') return base;
      for (const key of ['teamName', 'recommendation', 'evidence1', 'evidence2', 'tradeoff', 'dataDecision', 'transfer']) base[key] = cleanString(saved[key]);
      for (const key of ['names', 'contributions', 'criteria', 'comparison', 'exits']) {
        if (Array.isArray(saved[key])) base[key] = base[key].map((_, i) => cleanString(saved[key][i]));
      }
      base.stage = Number.isInteger(saved.stage) ? Math.min(3, Math.max(0, saved.stage)) : 0;
      base.turn = Number.isInteger(saved.turn) ? Math.min(3, Math.max(0, saved.turn)) : 0;
      if (Array.isArray(saved.seconds)) base.seconds = DEFAULT_SECONDS.map((max, i) => Number.isFinite(saved.seconds[i]) ? Math.max(0, Math.min(max, saved.seconds[i])) : max);
      base.updatedAt = cleanString(saved.updatedAt, 100);
      return base;
    } catch (_) {
      storageWorks = false;
      return base;
    }
  }

  let state = loadState();
  let timerRunning = false;
  let timerDeadline = 0;
  let lastSavedSeconds = -1;
  let toastTimeout;

  function name(index) { return state.names[index].trim() || `Student ${'ABCD'[index]}`; }
  function option(index) { return state.options[index].trim() || `Alternative ${'AB'[index]}`; }
  function criterion(index) { return state.criteria[index].trim() || `Criterion ${index + 1}`; }
  function saveState(showStatus = true) {
    state.updatedAt = new Date().toISOString();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      storageWorks = true;
    } catch (_) { storageWorks = false; }
    if (showStatus) updateStorageStatus();
  }
  function updateStorageStatus() {
    $('#saveStatus').textContent = storageWorks
      ? 'Saved in this browser on this device. Export or print before clearing it.'
      : 'Browser saving is unavailable. Export or print your record before closing this page.';
  }
  function toast(message) {
    clearTimeout(toastTimeout);
    $('#toast').textContent = message;
    $('#toast').hidden = false;
    toastTimeout = setTimeout(() => { $('#toast').hidden = true; }, 3800);
  }
  function formatTime(seconds) {
    const whole = Math.max(0, Math.ceil(seconds));
    return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
  }

  function timerHTML(label) {
    return `<div class="timer-card${state.seconds[state.stage] <= 0 ? ' expired' : ''}" id="timerCard">
      <div><div class="timer-label" id="timerLabel">${esc(label)}</div><div class="timer-display" id="timerDisplay" role="timer" aria-live="off">${formatTime(state.seconds[state.stage])}</div></div>
      <div class="timer-controls"><button class="button secondary" data-action="timer-toggle" type="button" id="timerToggle">${timerRunning ? 'Pause' : 'Start timer'}</button><button class="button ghost" data-action="timer-reset" type="button">Reset</button></div>
    </div><p class="help" id="timerHelp">The timer guides the pace. Pause for thinking, language preparation or a useful question.</p>`;
  }
  function updateTimerUI() {
    const display = $('#timerDisplay');
    if (!display) return;
    display.textContent = formatTime(state.seconds[state.stage]);
    $('#timerToggle').textContent = timerRunning ? 'Pause' : 'Start timer';
    $('#timerCard').classList.toggle('expired', state.seconds[state.stage] <= 0);
    $('#timerHelp').textContent = state.seconds[state.stage] <= 0
      ? 'Time is up. Finish the thought, then choose when to move on.'
      : 'The timer guides the pace. Pause for thinking, language preparation or a useful question.';
  }
  function pauseTimer() {
    if (timerRunning) state.seconds[state.stage] = Math.max(0, (timerDeadline - Date.now()) / 1000);
    timerRunning = false;
    saveState(false);
    updateTimerUI();
  }
  function toggleTimer() {
    if (timerRunning) { pauseTimer(); return; }
    if (state.seconds[state.stage] <= 0) state.seconds[state.stage] = DEFAULT_SECONDS[state.stage];
    timerDeadline = Date.now() + state.seconds[state.stage] * 1000;
    timerRunning = true;
    lastSavedSeconds = -1;
    updateTimerUI();
  }
  function resetTimer() {
    timerRunning = false;
    state.seconds[state.stage] = DEFAULT_SECONDS[state.stage];
    saveState(false);
    updateTimerUI();
  }
  setInterval(() => {
    if (!timerRunning) return;
    state.seconds[state.stage] = Math.max(0, (timerDeadline - Date.now()) / 1000);
    const whole = Math.ceil(state.seconds[state.stage]);
    if (whole !== lastSavedSeconds) { lastSavedSeconds = whole; saveState(false); }
    if (state.seconds[state.stage] <= 0) { timerRunning = false; toast('Time is up. Finish your thought, then move on when ready.'); }
    updateTimerUI();
  }, 200);

  function textarea(key, value, placeholder, rows = 3, limit = 1800) {
    return `<textarea id="field-${esc(key)}" data-field="${esc(key)}" rows="${rows}" maxlength="${limit}" placeholder="${esc(placeholder)}">${esc(value)}</textarea>`;
  }
  function glossaryHTML() {
    return `<details class="optional-panel"><summary>Need a concept or a sentence starter?</summary><div>
      <dl><dt>Market segment</dt><dd>A group of potential customers with shared characteristics, needs or wants.</dd>
      <dt>Demographic</dt><dd>Measurable population characteristics, such as age, income, education or location.</dd>
      <dt>Psychographic</dt><dd>Interests, values, activities and lifestyles that help explain customer behavior.</dd>
      <dt>Customer acquisition cost (CAC)</dt><dd>The cost of attracting and acquiring a new customer.</dd>
      <dt>Customer lifetime value (LTV)</dt><dd>Estimated total customer spending with a business over the relationship. This is a revenue-based measure, not profit.</dd>
      <dt>Evidence and assumptions</dt><dd>Evidence comes from the reading or a stated source. An assumption is something you believe but still need to test.</dd></dl>
      <p class="help">“I recommend ___ because the case shows ___.”<br>“I heard you say ___. Does that mean ___?”<br>“That evidence suggests ___, but what about ___?”</p>
      <p class="help">Plan in your strongest language if helpful. Use clear, simple English, short notes and the case when explaining your reasoning.</p>
    </div></details>`;
  }

  function connectionHTML(action, skill, ek, concept, lookFor) {
    return `<div style="margin:12px 0 17px"><div class="hero-meta" style="margin-top:0"><span class="tag">${esc(action)} · Skill ${esc(skill)}</span><span class="chip">${esc(ek)}</span></div><details style="margin:9px 0 0"><summary>Connection</summary><p class="help" style="margin-top:8px">${esc(concept)}<br><strong>Look for:</strong> ${esc(lookFor)}</p></details></div>`;
  }

  function caseEvidenceHTML() {
    return `<details class="optional-panel"><summary>Case evidence at a glance</summary><div>
      <p class="help">These are estimates and findings reported in the historical case, not current prices or current performance.</p>
      <div class="matrix-wrap"><table class="decision-matrix"><thead><tr><th scope="col">Case estimate</th><th scope="col">B2C</th><th scope="col">B2B</th></tr></thead><tbody>
        <tr><th scope="row">Customer acquisition cost</th><td>$160 per customer</td><td>$1,200–$3,000 per customer</td></tr>
        <tr><th scope="row">Monthly subscription revenue</th><td>$10–$11</td><td>Up to $500 base subscription, plus fees</td></tr>
        <tr><th scope="row">Reported or estimated acquisition payback</th><td>Nearly 18 months</td><td>2–6 months</td></tr>
        <tr><th scope="row">Relationship value</th><td>Evaluate using the case; no LTV total is supplied here.</td><td>The founders expected repeat business and higher lifetime value.</td></tr>
      </tbody></table></div>
      <p class="help">Monthly fees are revenue, not profit. Use the case’s reported estimates rather than assuming a full profitability calculation. What operating costs, retention or customer churn information would you still want?</p>
      <p><strong>Founding Token of Trust (pp. 1–2):</strong> focus groups checked whether fraud and personal safety were real concerns. In the Craigslist experiment, verified-seller listings sold for approximately 20% more.</p>
      <p><strong>Discuss:</strong> what does each finding establish—and what does it not establish about the best target customer?</p>
      ${connectionHTML('Interpret evidence', '1.B', '2.1.A.2 · 2.1.A.4', 'Customer data helps businesses make decisions, and different collection methods answer different questions.', 'Explain what the focus groups and price-premium experiment support, rather than treating them as proof of every business assumption.')}
      <details><summary>Optional data check: what is the denominator in Figure 2?</summary><p class="help" style="margin-top:8px">The Internet category is 39.8%. What population or set of transactions is that percentage out of? Does the chart tell you the percentage of all online buyers who experienced fraud?</p><details><summary>Check your interpretation</summary><p class="help" style="margin-top:8px">Figure 2 distributes reported fraudulent purchases by purchase channel. It does not say that 39.8% of all online buyers were victims, and the pie alone cannot establish which channel has the highest fraud rate.</p></details></details>
      <p><strong>Managing Big Data:</strong> identity verification involved demographic, location and identification data, with potential access to purchasing and marketplace behavior. The founders declined investors interested in future data sales and encrypted the data.</p>
      <p class="help">Return to the full case for context: Founding Token of Trust (pp. 1–2); B2C Model (p. 2); B2B Model (p. 3); Managing Big Data (pp. 3–4).</p>
    </div></details>`;
  }

  function stageShell(kicker, title, description, body, actions) {
    return `<section class="stage" aria-labelledby="stageTitle"><header class="stage-header"><p class="stage-kicker">${esc(kicker)}</p><h2 id="stageTitle" tabindex="-1">${esc(title)}</h2><p class="stage-description">${esc(description)}</p></header><div class="stage-body">${body}</div><footer class="stage-actions">${actions}</footer></section>`;
  }

  function prepareHTML() {
    const names = state.names.map((value, i) => `<div class="student-card"><label for="student${i}"><span class="name-dot">${'ABCD'[i]}</span>Your first name</label><input id="student${i}" data-student="${i}" value="${esc(value)}" maxlength="40" placeholder="Student ${'ABCD'[i]}" autocomplete="off"></div>`).join('');
    return stageShell('Stage 1 · About 2 minutes', 'Think before you talk.', 'Interpret what the research establishes, then form your own initial evaluation of the founders’ B2B choice.', `
      <div class="field"><label for="teamName">Team name or number</label><input id="teamName" data-field="teamName" value="${esc(state.teamName)}" maxlength="60" placeholder="For example, Team 3" autocomplete="off"></div>
      <div class="grid-4">${names}</div>
      ${timerHTML('Quiet thinking time')}
      <p class="discussion-prompt">In Founding Token of Trust (pp. 1–2), what did the focus groups establish? What did the 20% price premium suggest? Name one thing this evidence does not yet prove about who should pay.</p>
      ${connectionHTML('Interpret evidence', '1.B', '2.1.A.2 · 2.1.A.4', 'Customer data informs decisions; the collection method affects what a finding can support.', 'Distinguish evidence of a problem from evidence of value, and identify a limit to the inference.')}
      <p>Jot a short private note on paper. Then form an initial view: was the B2B choice justified, partly justified or not justified? Be ready to cite a page or case section.</p>
      <div class="notice"><strong>Evaluate the reasoning.</strong> A decision can have strengths and limitations. Distinguish the case’s evidence from assumptions about future customers, costs or relationships.</div>
      ${caseEvidenceHTML()}
      ${glossaryHTML()}
    `, `<p class="help">One shared device is enough. The private thinking note stays with you.</p><button class="button primary" type="button" data-action="next-stage">Begin RoundRobin &rarr;</button>`);
  }

  function roundRobinHTML() {
    const turn = state.turn;
    const speaker = name(turn);
    const listener = name((turn + 1) % 4);
    const checker = name((turn + 2) % 4);
    const recorder = name((turn + 3) % 4);
    const opening = turn === 0
      ? 'Explain whether the B2B choice was justified and the case evidence behind your view.'
      : `First fairly paraphrase ${name(turn - 1)}’s reason. Then support, qualify or challenge the evaluation of B2B using case evidence.`;
    return stageShell('Stage 2 · Four equal turns', 'Every voice needs a reason.', 'Listen for the business reasoning. You will need to explain someone else’s idea.', `
      <div class="turn-card"><p class="turn-counter">Turn ${turn + 1} of 4</p><div class="speaker-name">${esc(speaker)} speaks</div><p>${esc(opening)}</p>
      <div class="listen-prompt"><strong>${esc(listener)}</strong> listens and prepares to paraphrase.<br><strong>${esc(checker)}</strong> checks the case reference.<br><strong>${esc(recorder)}</strong> captures a useful point below.</div></div>
      ${timerHTML('Up to 60 seconds for this voice')}
      <div class="field evidence-note"><label for="turnNote">One useful point and its case reference</label><textarea id="turnNote" data-contribution="${turn}" rows="3" maxlength="900" placeholder="What did this speaker argue about the B2B decision? Name the useful fact and its case section.">${esc(state.contributions[turn])}</textarea><span class="help">Listen first, then capture the point. This is a thinking record, not a transcript. You can also keep notes on paper.</span></div>
      ${turn === 3 ? `<div class="notice">Close the loop: <strong>${esc(name(0))}</strong> briefly paraphrases ${esc(speaker)}’s reason before the team moves on.</div>` : ''}
      <details class="optional-panel"><summary>Optional angle: who was the potential B2C customer?</summary><div><p>Describe one plausible B2C customer profile using a demographic characteristic and a psychographic characteristic. Link the profile to the fraud problem, and label anything you are assuming.</p>${connectionHTML('Apply segmentation', '1.C', '2.1.A.3.i–ii · 2.1.B.1–B.3', 'Demographic and psychographic characteristics can define a segment and make a customer profile specific.', 'Connect the proposed characteristics to a need in the case; avoid stereotypes and separate case evidence from a hypothesis.')}</div></details>
      ${glossaryHTML()}
    `, `<button class="button ghost" type="button" data-action="previous-turn" ${turn === 0 ? 'disabled' : ''}>&larr; Previous voice</button><button class="button primary" type="button" data-action="next-turn">${turn < 3 ? 'Next voice &rarr;' : 'Compare the alternatives &rarr;'}</button>`);
  }

  function challengeHTML() {
    return stageShell('Stage 3 · About 7 minutes', 'Test two linked decisions.', 'Spend about four minutes comparing B2C with B2B, then three minutes considering the data-and-trust decision.', `
      <h3>1. Was B2B the stronger target-customer choice?</h3>
      <p class="help">B2C means selling identity-verification subscriptions to individual consumers. B2B means serving businesses, including smaller businesses that needed affordable verification tools.</p>
      <p>Agree which two factors should decide the comparison, and why. Use or adapt the suggested criteria below. Then compare both models against the same factors.</p>
      ${connectionHTML('Compare against criteria', '3.C', '2.1.B.2 · 2.1.B.4 · 2.1.C.2–C.3', 'Selecting target customers requires comparing customer fit and the financial value of the relationship.', 'Establish relevant criteria, apply them to both models, and explain what the evidence means for the choice.')}
      ${caseEvidenceHTML()}
      <div class="matrix-wrap"><table class="decision-matrix"><thead><tr><th scope="col">Compare using these criteria</th><th scope="col" id="matrixOptionA">${esc(option(0))}</th><th scope="col" id="matrixOptionB">${esc(option(1))}</th></tr></thead><tbody>
      <tr><th scope="row"><label for="criterion0" class="help">Criterion 1 · edit if useful</label><textarea id="criterion0" class="criterion-input" data-criterion="0" maxlength="120" rows="2" aria-label="First comparison criterion">${esc(state.criteria[0])}</textarea></th><td><textarea aria-label="B2C: evidence for the first criterion" data-matrix="0" maxlength="900" placeholder="Useful case evidence, and what it means">${esc(state.comparison[0])}</textarea></td><td><textarea aria-label="B2B: evidence for the first criterion" data-matrix="1" maxlength="900" placeholder="Useful case evidence, and what it means">${esc(state.comparison[1])}</textarea></td></tr>
      <tr><th scope="row"><label for="criterion1" class="help">Criterion 2 · edit if useful</label><textarea id="criterion1" class="criterion-input" data-criterion="1" maxlength="120" rows="2" aria-label="Second comparison criterion">${esc(state.criteria[1])}</textarea></th><td><textarea aria-label="B2C: evidence for the second criterion" data-matrix="2" maxlength="900" placeholder="What does this evidence imply for your criterion?">${esc(state.comparison[2])}</textarea></td><td><textarea aria-label="B2B: evidence for the second criterion" data-matrix="3" maxlength="900" placeholder="What does this evidence imply for your criterion?">${esc(state.comparison[3])}</textarea></td></tr>
      </tbody></table></div>
      ${timerHTML('About 4 minutes on customers + 3 minutes on data and trust')}
      <p class="discussion-prompt">Does the evidence justify choosing B2B despite its higher acquisition cost? What is the strongest counterargument?</p>
      <p>Each person should ask or answer a meaningful evidence question. Use short notes in the table; spend the time talking through what the evidence means.</p>
      <details class="optional-panel"><summary>Need a question that moves the conversation forward?</summary><div><p>“Which part of the case supports that?”<br>“Did the Craigslist experiment establish customer value, the best target market, or both?”<br>“Why might a more expensive customer still be more valuable?”<br>“Which claims rely on expected retention rather than established results?”<br>“What cost or churn information is missing?”</p></div></details>
      <h3>2. Was declining investors interested in future data sales justified?</h3>
      <p>Consider the potential business benefit of funding or data revenue, the privacy risk to consumers, and the effect on customer trust and relationships. What data policy would you advise the founders to maintain or change? Defend your recommendation.</p>
      ${connectionHTML('Justify a data policy', '3.D', '2.1.D.1–D.3 · 2.1.C.3', 'Customer data has business value, but collecting and using it creates privacy, fraud and reputation risks.', 'Use Managing Big Data (pp. 3–4) to weigh the business benefit, consumer risk and effects on trust before defending a policy.')}
      <div class="field"><label for="field-dataDecision">Our evaluation of the data-and-trust decision</label>${textarea('dataDecision', state.dataDecision, 'Recommend which data policy to maintain or change. Explain the business benefit, consumer risk and relationship effect, using Managing Big Data as evidence.', 3)}</div>
      ${glossaryHTML()}
    `, `<button class="button ghost" type="button" data-action="previous-stage">&larr; RoundRobin</button><button class="button primary" type="button" data-action="next-stage">Write your evaluation &rarr;</button>`);
  }

  function decisionHTML() {
    const exits = state.names.map((_, i) => `<div class="field student-card"><label for="exit${i}"><span class="name-dot">${'ABCD'[i]}</span>${esc(name(i))}: my own response</label><textarea id="exit${i}" data-exit="${i}" rows="4" maxlength="1300" placeholder="I think the B2B decision was ___ because ___. A teammate’s idea that changed or clarified my thinking was ___.">${esc(state.exits[i])}</textarea><span class="help">Two short sentences in your own words are enough.</span></div>`).join('');
    return stageShell('Stage 4 · About 5 minutes', 'Evaluate. Then think for yourself.', 'Write a short advisory brief to Edelman and O’Brion: evaluate their customer choice and state whether you advise maintaining or changing it.', `
      ${timerHTML('Team evaluation and individual exits')}
      <div class="field"><label for="field-recommendation">Your team evaluation of the B2B decision</label>${textarea('recommendation', state.recommendation, 'Explain how the founders chose B2B. Would you advise continuing that focus or changing it? State your advice and support it.', 3)}</div>
      <div class="grid-2"><div class="field"><label for="field-evidence1">Case evidence 1 and its reference</label>${textarea('evidence1', state.evidence1, 'A useful fact or finding, where it appears, and what it supports.', 3, 1200)}</div><div class="field"><label for="field-evidence2">Case evidence 2 and its reference</label>${textarea('evidence2', state.evidence2, 'A second useful fact or finding, where it appears, and what it supports.', 3, 1200)}</div></div>
      <div class="field"><label for="field-tradeoff">The strongest counterargument or trade-off</label>${textarea('tradeoff', state.tradeoff, 'What is the strongest challenge to your evaluation? What does it change—or fail to change—in your judgment?', 3)}</div>
      <h3>Four individual exit responses</h3><p class="help">Each person answers independently. Pass the device to each student, or write privately on paper and add the responses before printing. Others should not write the response for you.</p>
      <div class="grid-2">${exits}</div>
      <details class="optional-panel"><summary>Optional transfer: connect this to your own business</summary><div class="field"><label for="field-transfer">What customer data would be useful for your business, and what privacy risk would collecting or using it create?</label>${textarea('transfer', state.transfer, 'Apply Topic 2.1 to your business. This is a transfer question, not a claim about events in the case.', 3)}<p class="help">Consider collecting only useful data, explaining its purpose, seeking appropriate permission and protecting access.</p></div></details>
      <div class="notice">Your record brings the reasoning together. Your teacher may ask any team member to explain a teammate’s point or defend the evaluation.</div>
    `, `<button class="button ghost" type="button" data-action="previous-stage">&larr; Challenge</button><div class="top-actions"><button class="button secondary" type="button" data-action="preview">Preview record</button><button class="button primary" type="button" data-action="print">Print / Save PDF</button></div>`);
  }

  function renderStage(focusHeading = false) {
    const renderers = [prepareHTML, roundRobinHTML, challengeHTML, decisionHTML];
    $('#stageMount').innerHTML = renderers[state.stage]();
    document.querySelectorAll('[data-step]').forEach((button) => {
      const step = Number(button.dataset.step);
      button.classList.toggle('active', step === state.stage);
      button.classList.toggle('done', step < state.stage);
      if (step === state.stage) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
    updateTimerUI();
    if (focusHeading) $('#stageTitle').focus({ preventScroll: true });
  }
  function goToStage(stage) {
    pauseTimer();
    state.stage = Math.max(0, Math.min(3, stage));
    saveState();
    renderStage(true);
    $('#stageMount').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function goToTurn(turn) {
    pauseTimer();
    state.turn = Math.max(0, Math.min(3, turn));
    state.seconds[1] = DEFAULT_SECONDS[1];
    saveState();
    renderStage(true);
  }

  function reportValue(value) { return value.trim() ? `<p>${esc(value)}</p>` : '<div class="blank-lines" aria-label="Space for a written response"></div>'; }
  function buildReportHTML() {
    const date = new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date());
    const team = state.teamName.trim() || 'Team __________________';
    const contributions = state.contributions.map((value, i) => `<tr><th scope="row">${esc(name(i))}</th><td>${value.trim() ? esc(value) : ' '}</td></tr>`).join('');
    const exits = state.exits.map((value, i) => `<section class="report-person"><h3>${esc(name(i))} · individual exit</h3>${reportValue(value)}</section>`).join('');
    const comparison = `<table class="report-table"><thead><tr><th scope="col">Criterion</th><th scope="col">${esc(option(0))}</th><th scope="col">${esc(option(1))}</th></tr></thead><tbody><tr><th scope="row">${esc(criterion(0))}</th><td>${esc(state.comparison[0])}</td><td>${esc(state.comparison[1])}</td></tr><tr><th scope="row">${esc(criterion(1))}</th><td>${esc(state.comparison[2])}</td><td>${esc(state.comparison[3])}</td></tr></tbody></table>`;
    return `<header class="report-header"><p class="eyebrow">Econ with K · AP Business · Topic 2.1</p><h1>Token of Trust · Case evaluation</h1><p class="report-meta"><strong>${esc(team)}</strong> · ${esc(date)}<br>${state.names.map((_, i) => esc(name(i))).join(' · ')}</p></header>
      <section class="report-block"><h2>Our evaluation of the B2B decision</h2>${reportValue(state.recommendation)}</section>
      <div class="report-grid"><section class="report-block"><h3>Case evidence 1 and reference</h3>${reportValue(state.evidence1)}</section><section class="report-block"><h3>Case evidence 2 and reference</h3>${reportValue(state.evidence2)}</section></div>
      <section class="report-block"><h3>Our counterargument or trade-off</h3>${reportValue(state.tradeoff)}</section>
      <section class="report-block"><h2>B2C and B2B comparison</h2>${comparison}</section>
      <section class="report-block"><h2>Our evaluation of the data-and-trust decision</h2>${reportValue(state.dataDecision)}</section>
      <section class="report-block"><h2>Useful ideas heard in the RoundRobin</h2><table class="report-table"><thead><tr><th scope="col" style="width:24%">Speaker</th><th scope="col">Point and case reference</th></tr></thead><tbody>${contributions}</tbody></table></section>
      <section class="report-block"><h2>What each of us thinks</h2><p class="help">My evaluation of B2B and its reason; a teammate’s idea that changed or clarified my thinking.</p><div class="report-grid">${exits}</div></section>
      ${state.transfer.trim() ? `<section class="report-block"><h2>Optional transfer to our own business</h2>${reportValue(state.transfer)}</section>` : ''}
      <p class="help">Use with the assigned case, teacher observation and an individual explanation. The record is not an automatic verification or grade.</p>`;
  }
  function refreshReport() {
    const html = buildReportHTML();
    $('#printReport').innerHTML = html;
    $('#reportPreview').innerHTML = html;
  }
  function printRecord() {
    pauseTimer();
    refreshReport();
    window.print();
  }
  function openDialog(id) {
    const dialog = $(id);
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  }
  function closeDialog(id) {
    const dialog = $(id);
    if (typeof dialog.close === 'function') dialog.close();
    else dialog.removeAttribute('open');
  }
  function exportRecord() {
    pauseTimer();
    saveState();
    const payload = { title: 'Token of Trust Case Lab', exportedAt: new Date().toISOString(), storage: 'Browser-local team record', ...state };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const slug = (state.teamName.trim() || 'team').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'team';
    link.href = url;
    link.download = `token-of-trust-${slug}-record.json`;
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    toast('Team record exported. Keep the file with your class work.');
  }

  document.addEventListener('input', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) return;
    if (target.hasAttribute('data-field')) {
      const field = target.dataset.field;
      if (['teamName', 'recommendation', 'evidence1', 'evidence2', 'tradeoff', 'dataDecision', 'transfer'].includes(field)) state[field] = target.value;
    } else if (target.hasAttribute('data-student')) state.names[Number(target.dataset.student)] = target.value;
    else if (target.hasAttribute('data-contribution')) state.contributions[Number(target.dataset.contribution)] = target.value;
    else if (target.hasAttribute('data-option')) {
      const i = Number(target.dataset.option);
      state.options[i] = target.value;
      const heading = $(i === 0 ? '#matrixOptionA' : '#matrixOptionB');
      if (heading) heading.textContent = option(i);
    } else if (target.hasAttribute('data-criterion')) state.criteria[Number(target.dataset.criterion)] = target.value;
    else if (target.hasAttribute('data-matrix')) state.comparison[Number(target.dataset.matrix)] = target.value;
    else if (target.hasAttribute('data-exit')) state.exits[Number(target.dataset.exit)] = target.value;
    else return;
    saveState();
  });

  document.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button || button.disabled) return;
    if (button.hasAttribute('data-step')) { goToStage(Number(button.dataset.step)); return; }
    switch (button.dataset.action) {
      case 'next-stage': goToStage(state.stage + 1); break;
      case 'previous-stage': goToStage(state.stage - 1); break;
      case 'next-turn': state.turn < 3 ? goToTurn(state.turn + 1) : goToStage(2); break;
      case 'previous-turn': goToTurn(state.turn - 1); break;
      case 'timer-toggle': toggleTimer(); break;
      case 'timer-reset': resetTimer(); break;
      case 'teacher': openDialog('#teacherDialog'); break;
      case 'pick-voice': {
        const picked = Math.floor(Math.random() * 4);
        $('#spotCheck').textContent = `${name(picked)}: explain a teammate’s reasoning and one case fact, then give your own evaluation.`;
        break;
      }
      case 'close-teacher': closeDialog('#teacherDialog'); break;
      case 'preview': pauseTimer(); refreshReport(); openDialog('#reportDialog'); break;
      case 'close-report': closeDialog('#reportDialog'); break;
      case 'print': printRecord(); break;
      case 'export': exportRecord(); break;
      case 'clear':
        if (window.confirm('Clear this team’s saved work on this device and start a new team? Print or export anything you want to keep first.')) {
          pauseTimer(); state = freshState(); saveState(); renderStage(true); toast('Ready for a new team.');
        }
        break;
      default: break;
    }
  });
  for (const id of ['#teacherDialog', '#reportDialog']) {
    $(id).addEventListener('click', (event) => { if (event.target === $(id)) closeDialog(id); });
  }
  window.addEventListener('beforeprint', refreshReport);
  window.addEventListener('pagehide', () => { pauseTimer(); saveState(false); });
  renderStage();
  updateStorageStatus();
})();
