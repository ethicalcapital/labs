(() => {
  const el = (id) => document.getElementById(id);
  const venue = el('venue');
  const target = el('target');
  const invIdentity = el('invIdentity');
  const knowledge = el('knowledge');
  const thumbMission = el('thumb_mission');
  const thumbCompetition = el('thumb_competition');
  const thumbRegulatory = el('thumb_regulatory');
  const thumbPreset = el('thumb_preset');
  const thumbCustom = el('thumb_custom');
  const localName = el('localName');
  const objective = el('objective');
  const brief = el('brief');
  const buildBtn = el('buildBtn');
  const resetBtn = el('resetBtn');
  const copyTextBtn = el('copyText');
  const downloadBriefBtn = el('downloadBrief');
  const printBtn = el('printBtn');
  const sourcesList = el('sources');
  const fbUse = el('fb_usecase');
  const fbOutcome = el('fb_outcome');
  const fbNotes = el('fb_notes');
  const fbConsent = el('fb_consent');
  const fbSend = el('fb_send');
  const fbStatus = el('fb_status');

  const state = { data: null, last: null };

  const missionValue = () => (thumbMission.value === '0' ? 'purity' : 'pragmatism');

  const VENUE_LABELS = {
    one_on_one: '1:1 conversation',
    small_group: 'Small group meeting',
    committee_hearing: 'Committee hearing',
    full_board_meeting: 'Full board/council meeting',
    public_testimony: 'Public testimony / town hall',
    written_memo: 'Written memo / email'
  };

  const TARGET_LABELS = {
    family_friends: 'Family / Friends',
    cio: 'CIO / Investment Officer',
    consultant: 'Investment Consultant',
    treasurer: 'Treasurer / Finance Director',
    trustee: 'Board / Trustee',
    council_member: 'Council / Committee Member'
  };

  const TARGET_OPTIONS_ALL = [
    { value: 'family_friends', label: TARGET_LABELS.family_friends },
    { value: 'cio', label: TARGET_LABELS.cio },
    { value: 'consultant', label: TARGET_LABELS.consultant },
    { value: 'treasurer', label: TARGET_LABELS.treasurer },
    { value: 'trustee', label: TARGET_LABELS.trustee },
    { value: 'council_member', label: TARGET_LABELS.council_member }
  ];

  const ENTITY_LABELS = {
    swf: 'Sovereign Wealth Fund',
    public_pension: 'Public Pension Plan',
    corporate_pension: 'Corporate Pension Plan',
    endowment: 'Endowment',
    foundation: 'Foundation',
    insurance: 'Insurance General Account',
    central_bank: 'Central Bank / Official Institution',
    government: 'Government Investor',
    individual: 'Individual'
  };

  const KNOWLEDGE_LABELS = {
    plain: 'Plain English',
    technical: 'Technical / Nerd'
  };

  const MISSION_LABELS = {
    purity: 'Values-driven (Purity)',
    pragmatism: 'Risk-pragmatism (Conduct)'
  };

  const PRESSURE_LABELS = {
    low: 'Low',
    medium: 'Medium',
    high: 'High'
  };

  const PRESET_CONFIGS = {
    mission_nonprofit: { mission: 'purity', competition: 'low', regulatory: 'medium' },
    public_pension: { mission: 'pragmatism', competition: 'high', regulatory: 'high' },
    university_endowment: { mission: 'purity', competition: 'high', regulatory: 'low' }
  };

  const PRESET_LABELS = {
    mission_nonprofit: 'Mission-driven nonprofit',
    public_pension: 'Public pension',
    university_endowment: 'University endowment',
    custom: 'Custom'
  };

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

  function setTargetOptions(allowedValues) {
    const current = target.value;
    target.innerHTML = '';
    allowedValues.forEach((value) => {
      const optionData = TARGET_OPTIONS_ALL.find((opt) => opt.value === value);
      if (!optionData) return;
      const option = document.createElement('option');
      option.value = optionData.value;
      option.textContent = optionData.label;
      target.appendChild(option);
    });
    if (!allowedValues.includes(current)) {
      target.value = allowedValues[0];
    } else {
      target.value = current;
    }
    target.disabled = allowedValues.length === 1;
  }

  function applyEntityConstraints() {
    if (invIdentity.value === 'individual') {
      setTargetOptions(['family_friends']);
    } else {
      setTargetOptions(TARGET_OPTIONS_ALL.filter((opt) => opt.value !== 'family_friends').map((opt) => opt.value));
    }
  }

  function setThumbInputs(config) {
    thumbMission.value = config.mission === 'purity' ? '0' : '1';
    thumbCompetition.value = config.competition;
    thumbRegulatory.value = config.regulatory;
  }

  function toggleThumbInputs(disabled) {
    thumbMission.disabled = disabled;
    thumbCompetition.disabled = disabled;
    thumbRegulatory.disabled = disabled;
    thumbCustom.classList.toggle('opacity-60', disabled);
  }

  function applyThumbPreset(preset) {
    if (preset === 'custom' || !PRESET_CONFIGS[preset]) {
      thumbCustom.classList.remove('hidden');
      toggleThumbInputs(false);
      return;
    }
    const config = PRESET_CONFIGS[preset];
    thumbCustom.classList.add('hidden');
    toggleThumbInputs(true);
    setThumbInputs(config);
  }

  function ensureCustomPreset() {
    if (thumbPreset.value !== 'custom') {
      thumbPreset.value = 'custom';
      thumbCustom.classList.remove('hidden');
      toggleThumbInputs(false);
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
      knowledge: knowledge.value,
      thumb: { mission: missionValue(), competition: thumbCompetition.value, regulatory: thumbRegulatory.value, preset: thumbPreset.value },
      thumbPreset: thumbPreset.value,
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
    const context = {
      venue: venue.value,
      target: target.value,
      entity: invIdentity.value,
      knowledge: knowledge.value,
      localName: (localName.value || '').trim(),
      objective: objective.value
    };

    const thumb = {
      mission: missionValue(),
      competition: thumbCompetition.value,
      regulatory: thumbRegulatory.value,
    };

    const knowledgeLevel = context.knowledge;
    const guideIntroPlain = 'Use this identity map to match responsibilities before proposing action.';
    const guideIntroTechnical = 'Identity context determines constraints, tracking-error limits, and reporting expectations.';
    const headings = knowledgeLevel === 'plain'
      ? {
          opening: 'Opening',
          key: 'Key Points to Share',
          counters: 'Likely Pushback & Responses',
          guide: 'Investor Identity Map',
          guideIntro: guideIntroPlain,
          approach: 'Implementation Snapshot',
          policy: 'Policy Alignment',
          screening: 'Screening Builds Intelligence'
        }
      : {
          opening: 'Opening',
          key: 'Key Points',
          counters: 'Counterarguments & Responses',
          guide: 'Investor Identity Guide',
          guideIntro: guideIntroTechnical,
          approach: 'Recommended Approach',
          policy: 'Policy Alignment',
          screening: data.screening_knowledge?.title || 'Screening as Cumulative Knowledge'
        };

    const opening = (data.identity_openers?.[context.entity]?.[context.venue])
      || (data.identity_openers?.[context.entity]?.generic)
      || data.openers.generic;

    const points = pick(data.key_points, 6);
    const counters = pick(data.counters, 4);

    const baseGuide = data.identity_guides?.[context.entity] || {};
    const approach = deriveApproach({
      ask: baseGuide.ask || '',
      implementation: baseGuide.implementation || '',
      reporting: baseGuide.reporting || '',
      risk: baseGuide.risk || '',
      callout: baseGuide.callout || '',
    }, thumb);

    const showCIO = (context.target === 'cio' || context.target === 'consultant');
    const showResolution = context.objective === 'resolution_support';
    const resolution = showResolution ? (data.model_resolution || '') : '';
    const resolutionText = showResolution ? resolution.replaceAll('{localName}', context.localName || '[Jurisdiction]').trim() : '';
    const steps = data.next_steps || [];

    const policyAlignment = data.policy_alignment || {};
    const policyPrinciples = Array.isArray(policyAlignment.principles) ? policyAlignment.principles : [];
    const policyLink = policyAlignment.policy_link || null;
    const showPolicy = knowledgeLevel === 'technical' && policyPrinciples.length > 0;

    const screeningData = data.screening_knowledge || {};
    const screeningPoints = Array.isArray(screeningData.points) ? screeningData.points : [];
    const screeningTitle = screeningData.title || 'Screening as Cumulative Knowledge';
    const showScreening = screeningPoints.length > 0;

    const governmentSnippet = context.entity === 'government' ? (data.government_policy_snippet || '') : '';
    const showGovernmentSnippet = Boolean(governmentSnippet);

    const entityLabel = ENTITY_LABELS[context.entity] || context.entity;
    const guideBullets = [
      `Inputs: Capital, People, Processes, Information — scaled to ${entityLabel}.`,
      'Enablers: Governance (decision rights, criteria), Culture (transparency, discipline), Technology (optimization, reporting).',
      `Thumbprint: Mission/Ethics ${MISSION_LABELS[thumb.mission] || thumb.mission}, Competition ${PRESSURE_LABELS[thumb.competition] || thumb.competition}, Regulatory ${PRESSURE_LABELS[thumb.regulatory] || thumb.regulatory}.`
    ];

    const formatMultiline = (value) => sanitize(value).replace(/\n/g, '<br>');

    let html = '';
    html += `<h3 class="mt-0">${sanitize(headings.opening)}</h3>`;
    html += `<p>${sanitize(opening)}</p>`;

    html += `<h3>${sanitize(headings.key)}</h3>`;
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

    html += `<h3>${sanitize(headings.counters)}</h3>`;
    for (const c of counters) {
      html += `<p><span class="text-slate-400">Claim:</span> <em>${sanitize(c.claim)}</em><br><span class="text-slate-400">Response:</span> ${sanitize(c.response)}`;
      if (c.citations && c.citations.length) {
        const cs = c.citations.map(ci => `<a class="text-sky-300 hover:underline" href="${ci.url}" target="_blank" rel="noopener">${sanitize(ci.label)}</a>`).join(' · ');
        html += `<div class="mt-1 text-xs text-slate-400">Sources: ${cs}</div>`;
      }
      html += `</p>`;
    }

    html += `<h3>${sanitize(headings.guide)}</h3>`;
    html += `<p class="text-slate-300">${sanitize(headings.guideIntro)}</p>`;
    html += '<ul>' + guideBullets.map(b => `<li>${sanitize(b)}</li>`).join('') + '</ul>';

    if (showPolicy) {
      html += `<h3>${sanitize(headings.policy)}</h3>`;
      html += '<ul>' + policyPrinciples.map(p => `<li>${sanitize(p)}</li>`).join('') + '</ul>';
      if (policyLink) {
        html += `<p class="text-xs text-slate-400">Reference: <a class="text-sky-300 hover:underline" href="${policyLink.url}" target="_blank" rel="noopener">${sanitize(policyLink.label || policyLink.url)}</a></p>`;
      }
    }

    if (showGovernmentSnippet) {
      html += `<h3>Government Policy Snippet (Approved Issuers)</h3>`;
      html += `<pre class="whitespace-pre-wrap leading-relaxed">${sanitize(governmentSnippet)}</pre>`;
    }

    html += `<h3>${sanitize(headings.approach)}</h3>`;
    html += '<ul>';
    if (approach.ask) html += `<li><strong>Ask</strong>: ${sanitize(approach.ask)}</li>`;
    if (approach.implementation) html += `<li><strong>Implementation</strong>: ${formatMultiline(approach.implementation)}</li>`;
    if (approach.reporting) html += `<li><strong>Reporting</strong>: ${formatMultiline(approach.reporting)}</li>`;
    if (approach.risk) html += `<li><strong>Risk & Controls</strong>: ${formatMultiline(approach.risk)}</li>`;
    const screenParts = [];
    if (approach.screen_primary) screenParts.push(sanitize(approach.screen_primary));
    if (approach.screen_secondary) screenParts.push('also ' + sanitize(approach.screen_secondary));
    if (screenParts.length) html += `<li><strong>Screen Types (emphasis first)</strong>: ${screenParts.join('; ')}</li>`;
    if (approach.framing) html += `<li><strong>Framing</strong>: ${sanitize(approach.framing)}</li>`;
    html += '</ul>';

    if (showScreening) {
      html += `<h3>${sanitize(headings.screening)}</h3>`;
      if (knowledgeLevel === 'plain') {
        html += '<p class="text-slate-300">Screening builds cumulative knowledge about fragile business models, regulatory exposure, and reputational risk. Share the insight, not just the exclusion list.</p>';
      }
      const screeningList = knowledgeLevel === 'technical' ? screeningPoints : screeningPoints.slice(0, 2);
      if (screeningList.length) {
        html += '<ul>';
        for (const point of screeningList) {
          html += `<li><strong>${sanitize(point.title)}</strong>: ${sanitize(point.body)}`;
          if (knowledgeLevel === 'technical' && point.citations && point.citations.length) {
            const c = point.citations.map(ci => `<a class="text-sky-300 hover:underline" href="${ci.url}" target="_blank" rel="noopener">${sanitize(ci.label)}</a>`).join(' · ');
            html += `<div class="mt-1 text-xs text-slate-400">Sources: ${c}</div>`;
          }
          html += '</li>';
        }
        html += '</ul>';
      }
    }

    if (showCIO && data.cio_note) {
      html += `<h3>For CIOs / Consultants</h3>`;
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

    state.last = {
      context,
      thumb,
      opening,
      points: points.map(p => ({
        title: p.title,
        body: p.body,
        citations: Array.isArray(p.citations) ? p.citations.map(ci => ({ label: ci.label, url: ci.url })) : []
      })),
      counters: counters.map(c => ({
        claim: c.claim,
        response: c.response,
        citations: Array.isArray(c.citations) ? c.citations.map(ci => ({ label: ci.label, url: ci.url })) : []
      })),
      guideIntro: headings.guideIntro,
      guideIntroPlain,
      guideIntroTechnical,
      guideBullets,
      approach: {
        ask: approach.ask || '',
        implementation: approach.implementation || '',
        reporting: approach.reporting || '',
        risk: approach.risk || '',
        screen_primary: approach.screen_primary || '',
        screen_secondary: approach.screen_secondary || '',
        framing: approach.framing || ''
      },
      policyPrinciples,
      policyLink,
      screeningPoints: screeningPoints.map(p => ({
        title: p.title,
        body: p.body,
        citations: Array.isArray(p.citations) ? p.citations.map(ci => ({ label: ci.label, url: ci.url })) : []
      })),
      screeningTitle,
      showPolicy,
      showScreening,
      governmentSnippet,
      showGovernmentSnippet,
      showCIO,
      cioNote: showCIO ? (data.cio_note || '') : '',
      cioLinks: showCIO && Array.isArray(data.cio_links) ? data.cio_links : [],
      showResolution,
      resolutionText,
      steps: steps.slice(),
      knowledgeLevel,
      headings,
      sources: Array.isArray(data.sources) ? data.sources : [],
      furtherReading: Array.isArray(data.further_reading) ? data.further_reading : []
    };

    renderSources(data.sources || [], data.further_reading || []);
  }

  function buildMarkdown(mode) {
    if (!state.last) return null;
    const result = state.last;
    const context = result.context;
    const knowledgeLabel = KNOWLEDGE_LABELS[mode] || (mode === 'technical' ? 'Technical / Nerd' : 'Plain English');
    const lines = [];
    lines.push(`# Divestment Brief (${knowledgeLabel})`);
    lines.push('');
    lines.push(`- Venue: ${VENUE_LABELS[context.venue] || context.venue}`);
    lines.push(`- Target: ${TARGET_LABELS[context.target] || context.target}`);
    lines.push(`- Entity Type: ${ENTITY_LABELS[context.entity] || context.entity}`);
    lines.push(`- Knowledge Level: ${knowledgeLabel}`);
    lines.push(`- Thumbprint: Mission/Ethics ${MISSION_LABELS[result.thumb.mission] || result.thumb.mission}; Competition ${PRESSURE_LABELS[result.thumb.competition] || result.thumb.competition}; Regulatory ${PRESSURE_LABELS[result.thumb.regulatory] || result.thumb.regulatory}`);
    if (result.thumb.preset && result.thumb.preset !== 'custom') {
      lines.push(`- Profile Preset: ${PRESET_LABELS[result.thumb.preset] || result.thumb.preset}`);
    }
    if (context.localName) {
      lines.push(`- Local Name: ${context.localName}`);
    }
    lines.push('');

    lines.push('## Opening');
    lines.push('');
    lines.push(result.opening);
    lines.push('');

    lines.push(`## ${mode === 'technical' ? 'Key Points' : 'Key Points to Share'}`);
    lines.push('');
    for (const p of result.points) {
      lines.push(`- **${p.title}.** ${p.body}`);
      if (p.citations && p.citations.length) {
        lines.push(`  - Sources: ${p.citations.map(ci => `${ci.label} (${ci.url})`).join('; ')}`);
      }
    }
    lines.push('');

    lines.push(`## ${mode === 'technical' ? 'Counterarguments & Responses' : 'Likely Pushback & Responses'}`);
    lines.push('');
    for (const c of result.counters) {
      lines.push(`- **Claim:** ${c.claim}`);
      lines.push(`  - **Response:** ${c.response}`);
      if (c.citations && c.citations.length) {
        lines.push(`  - Sources: ${c.citations.map(ci => `${ci.label} (${ci.url})`).join('; ')}`);
      }
    }
    lines.push('');

    lines.push(`## ${mode === 'technical' ? 'Investor Identity Guide' : 'Investor Identity Map'}`);
    lines.push('');
    lines.push(mode === 'technical' ? result.guideIntroTechnical : result.guideIntroPlain);
    lines.push('');
    for (const bullet of result.guideBullets) {
      lines.push(`- ${bullet}`);
    }
    lines.push('');

    lines.push(`## ${mode === 'technical' ? 'Recommended Approach' : 'Implementation Snapshot'}`);
    lines.push('');
    const approach = result.approach;
    if (approach.ask) lines.push(`- Ask: ${approach.ask}`);
    if (approach.implementation) lines.push(`- Implementation: ${approach.implementation.replace(/\n/g, '; ')}`);
    if (approach.reporting) lines.push(`- Reporting: ${approach.reporting.replace(/\n/g, '; ')}`);
    if (approach.risk) lines.push(`- Risk & Controls: ${approach.risk.replace(/\n/g, '; ')}`);
    const screenDesc = [
      approach.screen_primary ? approach.screen_primary : '',
      approach.screen_secondary ? `also ${approach.screen_secondary}` : ''
    ].filter(Boolean).join('; ');
    if (screenDesc) lines.push(`- Screen Types (emphasis first): ${screenDesc}`);
    if (approach.framing) lines.push(`- Framing: ${approach.framing}`);
    lines.push('');

    if (mode === 'technical' && result.policyPrinciples.length) {
      lines.push('## Policy Alignment');
      lines.push('');
      for (const principle of result.policyPrinciples) {
        lines.push(`- ${principle}`);
      }
      if (result.policyLink) {
        lines.push(`- Reference: ${result.policyLink.label || result.policyLink.url} (${result.policyLink.url})`);
      }
      lines.push('');
    }

    if (result.showGovernmentSnippet && result.governmentSnippet) {
      lines.push('## Approved Issuers Template');
      lines.push('');
      lines.push('```');
      lines.push(result.governmentSnippet);
      lines.push('```');
      lines.push('');
    }

    if (result.screeningPoints.length) {
      const heading = mode === 'technical' ? result.screeningTitle : 'Screening Builds Intelligence';
      lines.push(`## ${heading}`);
      lines.push('');
      if (mode !== 'technical') {
        lines.push('Screening compounds knowledge about fragile business models, regulatory exposure, and reputational risk.');
        lines.push('');
      }
      const screeningList = mode === 'technical' ? result.screeningPoints : result.screeningPoints.slice(0, 2);
      for (const point of screeningList) {
        lines.push(`- **${point.title}.** ${point.body}`);
        if (mode === 'technical' && point.citations && point.citations.length) {
          lines.push(`  - Sources: ${point.citations.map(ci => `${ci.label} (${ci.url})`).join('; ')}`);
        }
      }
      lines.push('');
    }

    if (result.showCIO && mode === 'technical' && result.cioNote) {
      lines.push('## Notes for CIO / Consultant');
      lines.push('');
      lines.push(result.cioNote);
      if (result.cioLinks && result.cioLinks.length) {
        lines.push('');
        lines.push(`References: ${result.cioLinks.map(ci => `${ci.label} (${ci.url})`).join('; ')}`);
      }
      lines.push('');
    }

    if (result.showResolution && result.resolutionText) {
      lines.push('## Model Resolution');
      lines.push('');
      lines.push('```');
      lines.push(result.resolutionText);
      lines.push('```');
      lines.push('');
    }

    if (result.steps && result.steps.length) {
      lines.push('## Next Steps');
      lines.push('');
      for (const step of result.steps) {
        lines.push(`- ${step}`);
      }
      lines.push('');
    }

    const combinedSources = [...(result.sources || []), ...(result.furtherReading || [])];
    if (combinedSources.length) {
      lines.push('## Sources & Further Reading');
      lines.push('');
      for (const src of combinedSources) {
        lines.push(`- ${src.label} (${src.url})`);
      }
      lines.push('');
    }

    lines.push('---');
    lines.push('');
    lines.push('_Prepared by Ethical Capital Labs. Educational toolkit only — not investment advice._');
    lines.push('');

    return lines.join('\n');
  }

  function downloadMarkdown(mode) {
    const markdown = buildMarkdown(mode);
    if (!markdown) return;
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = mode === 'technical' ? 'divestment-brief-technical.md' : 'divestment-brief-plain.md';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function downloadCombinedMarkdown() {
    const plain = buildMarkdown('plain');
    const technical = buildMarkdown('technical');
    if (!plain || !technical) return;
    const combined = [plain, technical].join('

').trim();
    const blob = new Blob([combined], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'divestment-brief.md';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  thumbPreset.addEventListener('change', () => applyThumbPreset(thumbPreset.value));
  thumbMission.addEventListener('input', ensureCustomPreset);
  thumbMission.addEventListener('change', ensureCustomPreset);
  thumbCompetition.addEventListener('change', ensureCustomPreset);
  thumbRegulatory.addEventListener('change', ensureCustomPreset);

  invIdentity.addEventListener('change', () => applyEntityConstraints());

  applyEntityConstraints();
  applyThumbPreset(thumbPreset.value);

  buildBtn.addEventListener('click', buildBrief);
  resetBtn.addEventListener('click', () => {
    venue.value = 'one_on_one';
    target.value = 'family_friends';
    invIdentity.value = 'individual';
    knowledge.value = 'plain';
    thumbPreset.value = 'custom';
    thumbCustom.classList.remove('hidden');
    thumbMission.value = '1';
    thumbCompetition.value = 'low';
    thumbRegulatory.value = 'medium';
    localName.value = '';
    objective.value = 'resolution_support';
    brief.innerHTML = '<p class="text-slate-400">Fill the setup at left, then click Build Brief.</p>';
    sourcesList.innerHTML = '';
    state.last = null;
    applyEntityConstraints();
    applyThumbPreset(thumbPreset.value);
  });

  target.addEventListener('change', () => {
    if (target.value === 'family_friends') {
      invIdentity.value = 'individual';
    } else if (invIdentity.value === 'individual') {
      invIdentity.value = 'public_pension';
    }
    applyEntityConstraints();
  });

  copyTextBtn.addEventListener('click', () => {
    const markdown = buildMarkdown('plain');
    if (!markdown) return;
    navigator.clipboard.writeText(markdown).then(() => {
      copyTextBtn.textContent = 'Copied!';
      setTimeout(() => (copyTextBtn.textContent = 'Copy Text'), 1200);
    });
  });

  downloadBriefBtn?.addEventListener('click', downloadCombinedMarkdown);
  printBtn?.addEventListener('click', () => window.print());

  fbSend?.addEventListener('click', sendFeedback);

  // Keyboard shortcut: B build (skip when typing in inputs)
  document.addEventListener('keydown', (e) => {
    if (e.target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
    if (e.key.toLowerCase() === 'b') buildBrief();
  });
})();

// Minimal embedded fallback to avoid fetch/CSP failures
window.__BDS_FALLBACK__ = {
  version: 'fallback-2025-09-25-1',
  openers: { generic: 'We can align investments with basic human rights using professional, benchmark-aware implementation. Large institutions already use narrowly scoped exclusions while maintaining diversification and risk controls.' },
  identity_openers: {
    individual: {
      one_on_one: 'For friends or family, emphasize aligning personal savings with shared values and keep the steps concrete and jargon-free.',
      generic: 'Individuals can align personal or household savings with values using low-cost screened funds while keeping diversification and emergency reserves intact.'
    },
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
    individual: {
      ask: 'Align personal or household savings with stated values and explain the exclusions in plain language.',
      implementation: 'Use low-cost screened ETFs or managed accounts; document which companies are excluded and why.',
      reporting: 'Keep a simple holdings list and revisit annually or after major portfolio changes.',
      risk: 'Maintain emergency funds, diversification, and low fees while applying exclusions.'
    },
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
