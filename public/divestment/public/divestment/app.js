(() => {
  const el = (id) => document.getElementById(id);
  const venue = el('venue');
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
  const fbUse = el('fb_usecase');
  const fbOutcome = el('fb_outcome');
  const fbNotes = el('fb_notes');
  const fbConsent = el('fb_consent');
  const fbSend = el('fb_send');
  const fbStatus = el('fb_status');

  const state = { data: null };

  async function loadData() {
    if (state.data) return state.data;
    // Try relative path first (works when builder is served at /divestment/)
    const tryPaths = [
      './content/bds_pack.json',
      '/divestment/content/bds_pack.json',
      '/public/divestment/content/bds_pack.json'
    ];
    for (const p of tryPaths) {
      try {
        const resp = await fetch(p, { cache: 'no-store' });
        if (!resp.ok) throw new Error('bad status ' + resp.status);
        state.data = await resp.json();
        return state.data;
      } catch (e) {
        // try next
      }
    }
    console.warn('Falling back to embedded content pack: could not fetch content JSON');
    state.data = window.__BDS_FALLBACK__;
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

  async function sendFeedback() {
    fbStatus.textContent = '';
    if (!fbConsent.checked) {
      fbStatus.textContent = 'Please check consent to send.';
      return;
    }
    const payload = {
      consent: true,
      venue: venue.value,
      target: target.value,
      entityType: invIdentity.value,
      thumb: { mission: thumbMission.value, competition: thumbCompetition.value, regulatory: thumbRegulatory.value },
      objective: objective.value,
      use_case: fbUse.value,
      outcome: fbOutcome.value,
      notes: (fbNotes.value || '').slice(0, 2000),
      content_version: (state.data && state.data.version) ? String(state.data.version) : 'fallback'
    };
    try {
      const resp = await fetch('/api/feedback', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
      if (!resp.ok) throw new Error('bad status ' + resp.status);
      fbStatus.textContent = 'Thanks — feedback received.';
      fbSend.disabled = true;
      setTimeout(() => { fbSend.disabled = false; fbStatus.textContent = ''; }, 4000);
    } catch (e) {
      // Fallback: download JSON locally
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'divestment-feedback.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      fbStatus.textContent = 'Saved feedback file locally (no server available).';
    }
  }

  function deriveApproach(identityGuide, thumb) {
    // Start with base guide for the selected identity, then adjust by thumbprint.
    const res = { ...identityGuide };

    // Mission sets emphasis, but both screen types are in scope
    const productDesc = 'Product-based (absolute) exclusions for categorical harms';
    const conductDesc = 'Conduct/norms-based exclusions for risk mitigation';
    if (thumb.mission === 'purity') {
      res.screen_primary = productDesc;
      res.screen_secondary = conductDesc;
      res.framing = 'Lead with moral clarity while maintaining professional risk controls and transparency.';
    } else {
      res.screen_primary = conductDesc;
      res.screen_secondary = productDesc;
      res.framing = 'Lead with risk management and benchmark alignment while recognizing categorical harms where mission and regulation allow.';
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
    const v = venue.value;
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
    const opening = (data.identity_openers?.[id]?.[v]) || (data.identity_openers?.[id]?.generic) || data.openers.generic;

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

    // Policy alignment (borrowed from Ethical Capital Screening Policy)
    if (data.policy_alignment && data.policy_alignment.principles && data.policy_alignment.principles.length) {
      html += `<h3>Policy Alignment</h3>`;
      html += '<ul>' + data.policy_alignment.principles.map(p => `<li>${sanitize(p)}</li>`).join('') + '</ul>';
      if (data.policy_alignment.policy_link) {
        const pl = data.policy_alignment.policy_link;
        html += `<p class="text-xs text-slate-400">Reference: <a class="text-sky-300 hover:underline" href="${pl.url}" target="_blank" rel="noopener">${sanitize(pl.label)}</a></p>`;
      }
    }

    // Government policy snippet
    if (id === 'government' && data.government_policy_snippet) {
      html += `<h3>Government Policy Snippet (Approved Issuers)</h3>`;
      html += `<pre class="whitespace-pre-wrap leading-relaxed">${sanitize(data.government_policy_snippet)}</pre>`;
    }

    html += `<h4>Recommended Approach</h4>`;
    html += '<ul>';
    if (approach.ask) html += `<li><strong>Ask</strong>: ${sanitize(approach.ask)}</li>`;
    if (approach.implementation) html += `<li><strong>Implementation</strong>: ${sanitize(approach.implementation)}</li>`;
    if (approach.reporting) html += `<li><strong>Reporting</strong>: ${sanitize(approach.reporting)}</li>`;
    if (approach.risk) html += `<li><strong>Risk & Controls</strong>: ${sanitize(approach.risk)}</li>`;
    if (approach.screen_primary || approach.screen_secondary) {
      const parts = [];
      if (approach.screen_primary) parts.push(sanitize(approach.screen_primary));
      if (approach.screen_secondary) parts.push('also ' + sanitize(approach.screen_secondary));
      html += `<li><strong>Screen Types (emphasis first)</strong>: ${parts.join('; ')}</li>`;
    }
    if (approach.framing) html += `<li><strong>Framing</strong>: ${sanitize(approach.framing)}</li>`;
    html += '</ul>';

    // Screening as cumulative knowledge (neutral, non-promotional framing)
    if (data.screening_knowledge && Array.isArray(data.screening_knowledge.points)) {
      html += `<h3>${sanitize(data.screening_knowledge.title || 'Screening as Cumulative Knowledge')}</h3>`;
      html += '<ul>';
      for (const p of data.screening_knowledge.points) {
        html += `<li><strong>${sanitize(p.title)}</strong>: ${sanitize(p.body)}`;
        if (p.citations && p.citations.length) {
          const c = p.citations.map(ci => `<a class=\"text-sky-300 hover:underline\" href=\"${ci.url}\" target=\"_blank\" rel=\"noopener\">${sanitize(ci.label)}</a>`).join(' · ');
          html += `<div class=\"mt-1 text-xs text-slate-400\">Sources: ${c}</div>`;
        }
        html += `</li>`;
      }
      html += '</ul>';
    }

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
    venue.value = 'one_on_one';
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

  fbSend?.addEventListener('click', sendFeedback);

  lookupQuery?.addEventListener('input', updateLookupHref);
  updateLookupHref();

  // Keyboard shortcuts: B build, P print (skip when typing in inputs)
  document.addEventListener('keydown', (e) => {
    if (e.target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
    if (e.key.toLowerCase() === 'b') buildBrief();
    if (e.key.toLowerCase() === 'p') window.print();
  });
})();

// Minimal embedded fallback to avoid fetch/CSP failures
window.__BDS_FALLBACK__ = {
  version: 'fallback-2025-09-25-1',
  openers: { generic: 'We can align investments with basic human rights using professional, benchmark-aware implementation. Large institutions already use narrowly scoped exclusions while maintaining diversification and risk controls.' },
  identity_openers: {
    swf: { generic: 'A sovereign fund can implement conduct-based exclusions via a formal ethics process, public rationales, and factor-neutral optimization with explicit tracking-error budgets.' },
    public_pension: { generic: 'Public plans can use consultant/manager mandates, set a tracking-error guardrail, and phase implementation while keeping beneficiaries’ risk/return in focus.' },
    corporate_pension: { generic: 'Corporate plans can update the IPS, adopt a screened index or constraints with minimal overhead, and maintain de-risking alignment.' },
    endowment: { generic: 'Endowments can align with mission through a committee process, publish rationales, and maintain prudent risk controls.' },
    foundation: { generic: 'Foundations can align programs and portfolios, reduce reputational risk through clear criteria, and use simplified implementation paths.' },
    insurance: { generic: 'Insurance portfolios can adopt narrow conduct screens consistent with ALM and capital/rating constraints, emphasizing best-efforts and risk integrity.' },
    central_bank: { generic: 'Official institutions can clarify mandate limits, apply best‑efforts exclusions, and provide transparent rationales and constraints.' },
    government: { generic: 'Government investors (city/county/state) can apply issuer screens/approved lists for bonds, observe procurement/governance limits, and report with best‑efforts language.' }
  },
  identity_guides: {
    public_pension: {
      ask: 'Consultant memo and manager mandates for conduct-based exclusions; define guardrails.',
      implementation: 'Passive screened index or benchmark‑aware constraints; phased divestment to minimize costs; maintain diversification.',
      reporting: 'Quarterly one‑page dashboard; publish criteria and exclusion list.',
      risk: 'Tracking‑error limit (e.g., ≤30 bps) and factor neutrality by vendor.'
    }
  },
  key_points: [
    { title: 'Professional exclusions maintain benchmark-like performance', body: 'Large public funds implement conduct-based exclusions and continue to deliver returns close to their benchmarks by rebalancing and preserving factor exposures.', citations: [ { label: 'NBIM Responsible Investment', url: 'https://www.nbim.no/en/responsibility/' } ] },
    { title: 'Tracking error and factor neutrality', body: 'Exclusions can be implemented with explicit tracking-error budgets and factor controls so the portfolio stays close to its benchmark while meeting policy goals.', citations: [ { label: 'MSCI ESG Index Construction', url: 'https://www.msci.com/our-solutions/indexes/esg-indexes' } ] },
    { title: 'Fiduciary duty and values alignment', body: 'Modern fiduciary guidance recognizes that material ESG risks and client objectives can be incorporated without abandoning prudent, return-seeking management.', citations: [ { label: 'UN PRI: Fiduciary Duty', url: 'https://www.unpri.org/fiduciary-duty' } ] }
  ],
  counters: [
    { claim: 'Divestment will significantly hurt performance and beneficiaries.', response: 'Naive exclusions can be costly, but professional managers use optimization and tracking-error limits to preserve factor exposures and benchmark-like returns.', citations: [ { label: 'MSCI ESG Index Construction', url: 'https://www.msci.com/our-solutions/indexes/esg-indexes' } ] },
    { claim: 'Exclusions violate fiduciary duty.', response: 'Fiduciary duty requires prudence, loyalty, and attention to material risk and client objectives. Values alignment and risk management can be implemented within a disciplined, return-seeking mandate.', citations: [ { label: 'UN PRI: Fiduciary Duty', url: 'https://www.unpri.org/fiduciary-duty' } ] }
  ],
  screening_knowledge: {
    title: 'Screening as Cumulative Knowledge',
    points: [
      { title: 'Identify business model fragility', body: 'Systematic exclusions focus attention on issuers with hidden tail risks and controversy exposure.', citations: [ { label: 'AFSC Investigate', url: 'https://investigate.afsc.org/' } ] },
      { title: 'Knowledge compounds', body: 'Each exclusion deepens understanding of supply chains, regulatory exposure, and controversy patterns.' },
      { title: 'Integration cadence', body: 'Treat credible database updates as investment intelligence; aim to integrate within 30 days with documented rationale.', citations: [ { label: 'AFSC Investigate', url: 'https://investigate.afsc.org/' } ] }
    ]
  },
  model_resolution: 'RESOLVED: That the {localName} shall adopt a conduct-based investment exclusion policy... ',
  next_steps: [ 'Request current holdings/exposure report from managers.', 'Adopt written conduct criteria and escalation process.' ],
  sources: [
    { label: 'NBIM Responsible Investment', url: 'https://www.nbim.no/en/responsibility/' },
    { label: 'UN PRI: Fiduciary Duty', url: 'https://www.unpri.org/fiduciary-duty' },
    { label: 'MSCI: ESG Indexes & Methodology', url: 'https://www.msci.com/our-solutions/indexes/esg-indexes' }
  ],
  further_reading: [
    { label: 'SSRN: Investor Identity (4324537)', url: 'https://papers.ssrn.com/sol3/papers.cfm?abstract_id=4324537' },
    { label: 'CFA Institute: Seven Kinds of Asset Owner Institutions', url: 'https://blogs.cfainstitute.org/investor/2018/02/20/the-seven-kinds-of-asset-owner-institutions/' },
    { label: 'What I’d Tell Your CIO about Divestment', url: 'https://ethicic.com/content/research/what-id-tell-your-cio-about-divestment' }
  ],
  cio_note: 'Specify a tracking‑error budget, maintain factor neutrality, use screened indexes or constraints, and phase trades to avoid divestment shocks.',
  cio_links: [ { label: 'CIO Letter (Ethical Capital)', url: 'https://ethicic.com/content/research/what-id-tell-your-cio-about-divestment' } ]
};
