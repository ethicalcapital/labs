(() => {
  const el = (id) => document.getElementById(id);
  const audience = el('audience');
  const target = el('target');
  const invIdentity = el('invIdentity');
  const thumbMission = el('thumb_mission');
  const thumbCompetition = el('thumb_competition');
  const thumbRegulatory = el('thumb_regulatory');
  const localName = el('localName');
  const objective = el('objective');
  const brief = el('brief');
  const buildBtn = el('buildBtn');
  const resetBtn = el('resetBtn');
  const copyAll = el('copyAll');
  const printBtn = el('printBtn');
  const sourcesList = el('sources');
  const lookupQuery = el('lookupQuery');
  const lookupBtn = el('lookupBtn');

  const state = { data: null };

  async function loadData() {
    if (state.data) return state.data;
    const resp = await fetch('./content/bds_pack.json');
    state.data = await resp.json();
    return state.data;
  }

  function sanitize(text) {
    const div = document.createElement('div');
    div.textContent = text ?? '';
    return div.innerHTML;
  }

  function renderSources(sources, furtherReading) {
    sourcesList.innerHTML = '';
    const items = [];
    (sources || []).forEach((s) => items.push(s));
    (furtherReading || []).forEach((s) => items.push(s));
    for (const s of items) {
      const li = document.createElement('li');
      li.innerHTML = `${sanitize(s.label)} — <a class="text-sky-300 hover:underline" href="${s.url}" target="_blank" rel="noopener noreferrer">${s.url}</a>`;
      sourcesList.appendChild(li);
    }
  }

  function pick(arr, n) {
    if (!Array.isArray(arr) || arr.length === 0) return [];
    if (n >= arr.length) return arr.slice();
    return arr.slice(0, n); // deterministic, predictable selection
  }

  function toText(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.innerText;
  }

  function updateLookupHref() {
    const q = (lookupQuery.value || '').trim();
    const url = new URL('https://investigate.afsc.org/search');
    if (q) url.searchParams.set('search', q);
    lookupBtn.href = url.toString();
  }

  function deriveApproach(identityGuide, thumb) {
    // Start with base guide for the selected identity, then adjust by thumbprint.
    const res = { ...identityGuide };

    // Mission drives screen type and framing
    if (thumb.mission === 'purity') {
      res.screen = 'Product-based (absolute) exclusions for moral clarity';
      res.framing = 'Values-aligned policy that may accept a predictable tilt.';
    } else {
      res.screen = 'Conduct/norms-based exclusions for risk mitigation';
      res.framing = 'Risk-pragmatic policy preserving diversification and factor neutrality.';
    }

    // Competition pressure implies transparency/innovation emphasis
    if (thumb.competition === 'high') {
      res.reporting = (res.reporting || '') + '\n• Enhanced transparency and stakeholder reporting cadence';
    }

    // Regulatory constraints narrow scope and emphasize best-efforts
    if (thumb.regulatory === 'high') {
      res.implementation = (res.implementation || '') + '\n• Narrow scope with best‑efforts language due to statutory limits';
    }

    return res;
  }

  async function buildBrief() {
    const data = await loadData();
    const a = audience.value;
    const tg = target.value;
    const id = invIdentity.value;
    const ln = (localName.value || '').trim();
    const obj = objective.value;
    const thumb = {
      mission: thumbMission.value,
      competition: thumbCompetition.value,
      regulatory: thumbRegulatory.value,
    };

    // Opening: audience + identity aware
    const opening = (data.identity_openers?.[id]?.[a]) || (data.identity_openers?.[id]?.generic) || data.openers.generic;

    // Key points (fixed count)
    const points = pick(data.key_points, 6);

    // Counters (fixed count)
    const counters = pick(data.counters, 4);

    // Identity guide
    const baseGuide = data.identity_guides?.[id] || {};
    const approach = deriveApproach({
      ask: baseGuide.ask || '',
      implementation: baseGuide.implementation || '',
      reporting: baseGuide.reporting || '',
      risk: baseGuide.risk || '',
      callout: baseGuide.callout || '',
    }, thumb);

    // CIO callout if target suggests
    const showCIO = (tg === 'cio' || tg === 'consultant');

    // Model resolution
    const showResolution = obj === 'resolution_support';
    const resolution = showResolution ? (data.model_resolution || '') : '';
    const resolutionText = resolution.replaceAll('{localName}', ln || '[Jurisdiction]').trim();

    // Next steps
    const steps = data.next_steps || [];

    // Render brief
    let html = '';
    html += `<h3 class="mt-0">Opening</h3>`;
    html += `<p>${sanitize(opening)}</p>`;

    html += `<h3>Key Points</h3>`;
    html += '<ol>';
    for (const p of points) {
      html += `<li><strong>${sanitize(p.title)}</strong><br>${sanitize(p.body)}`;
      if (p.citations && p.citations.length) {
        const c = p.citations.map(ci => `<a class="text-sky-300 hover:underline" href="${ci.url}" target="_blank" rel="noopener">${sanitize(ci.label)}</a>`).join(' · ');
        html += `<div class="mt-1 text-xs text-slate-400">Sources: ${c}</div>`;
      }
      html += `</li>`;
    }
    html += '</ol>';

    html += `<h3>Counterarguments & Responses</h3>`;
    for (const c of counters) {
      html += `<p><span class="text-slate-400">Claim:</span> <em>${sanitize(c.claim)}</em><br><span class="text-slate-400">Response:</span> ${sanitize(c.response)}`;
      if (c.citations && c.citations.length) {
        const cs = c.citations.map(ci => `<a class="text-sky-300 hover:underline" href="${ci.url}" target="_blank" rel="noopener">${sanitize(ci.label)}</a>`).join(' · ');
        html += `<div class="mt-1 text-xs text-slate-400">Sources: ${cs}</div>`;
      }
      html += `</p>`;
    }

    html += `<h3>Investor Identity Guide</h3>`;
    html += `<p class="text-slate-300">Identity should shape the response. A two‑person plan executes differently than NBIM.</p>`;
    html += '<ul>';
    html += `<li><strong>Inputs</strong>: Capital, People, Processes, Information — scaled to the selected identity.</li>`;
    html += `<li><strong>Enablers</strong>: Governance (decision rights, criteria), Culture (transparency, discipline), Technology (optimization, reporting).</li>`;
    html += `<li><strong>Thumbprint</strong>: Mission/Ethics (${thumb.mission === 'purity' ? 'Values‑driven (Purity)' : 'Risk‑pragmatism (Conduct)'}), Competition (${thumb.competition}), Regulatory (${thumb.regulatory}).</li>`;
    html += '</ul>';

    html += `<h4>Recommended Approach</h4>`;
    html += '<ul>';
    if (approach.ask) html += `<li><strong>Ask</strong>: ${sanitize(approach.ask)}</li>`;
    if (approach.implementation) html += `<li><strong>Implementation</strong>: ${sanitize(approach.implementation)}</li>`;
    if (approach.reporting) html += `<li><strong>Reporting</strong>: ${sanitize(approach.reporting)}</li>`;
    if (approach.risk) html += `<li><strong>Risk & Controls</strong>: ${sanitize(approach.risk)}</li>`;
    if (approach.screen) html += `<li><strong>Screen Type</strong>: ${sanitize(approach.screen)}</li>`;
    if (approach.framing) html += `<li><strong>Framing</strong>: ${sanitize(approach.framing)}</li>`;
    html += '</ul>';

    if (showCIO && data.cio_note) {
      html += `<h4>For CIOs / Consultants</h4>`;
      html += `<p>${sanitize(data.cio_note)}</p>`;
      if (data.cio_links && data.cio_links.length) {
        const l = data.cio_links.map(ci => `<a class="text-sky-300 hover:underline" href="${ci.url}" target="_blank" rel="noopener">${sanitize(ci.label)}</a>`).join(' · ');
        html += `<div class="mt-1 text-xs text-slate-400">Read: ${l}</div>`;
      }
    }

    if (showResolution) {
      html += `<h3>Model Resolution</h3>`;
      html += `<pre class="whitespace-pre-wrap leading-relaxed">${sanitize(resolutionText)}</pre>`;
    }

    if (steps.length) {
      html += `<h3>Next Steps</h3>`;
      html += '<ul>' + steps.map(s => `<li>${sanitize(s)}</li>`).join('') + '</ul>';
    }

    brief.innerHTML = html;

    // Sources and Further Reading
    renderSources(data.sources || [], data.further_reading || []);
  }

  buildBtn.addEventListener('click', buildBrief);
  resetBtn.addEventListener('click', () => {
    audience.value = 'town_meeting';
    target.value = 'cio';
    invIdentity.value = 'public_pension';
    thumbMission.value = 'pragmatism';
    thumbCompetition.value = 'low';
    thumbRegulatory.value = 'medium';
    localName.value = '';
    objective.value = 'resolution_support';
    brief.innerHTML = '<p class="text-slate-400">Fill the setup at left, then click Build Brief.</p>';
    sourcesList.innerHTML = '';
    updateLookupHref();
  });

  copyAll.addEventListener('click', () => {
    const txt = toText(brief.innerHTML);
    navigator.clipboard.writeText(txt).then(() => {
      copyAll.textContent = 'Copied!';
      setTimeout(() => (copyAll.textContent = 'Copy All'), 1200);
    });
  });

  printBtn.addEventListener('click', () => window.print());

  lookupQuery?.addEventListener('input', updateLookupHref);
  updateLookupHref();

  // Keyboard shortcuts: B build, P print (skip when typing in inputs)
  document.addEventListener('keydown', (e) => {
    if (e.target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
    if (e.key.toLowerCase() === 'b') buildBrief();
    if (e.key.toLowerCase() === 'p') window.print();
  });
})();

