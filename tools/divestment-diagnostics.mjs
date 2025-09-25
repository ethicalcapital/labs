import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const CONTENT_PATH = path.join(ROOT, 'public', 'divestment', 'content', 'bds_pack.json');
const OUTPUT_DIR = path.join(ROOT, 'diagnostics', 'divestment');

const data = JSON.parse(fs.readFileSync(CONTENT_PATH, 'utf8'));

const VENUES = [
  'one_on_one',
  'small_group',
  'committee_hearing',
  'full_board_meeting',
  'public_testimony',
  'written_memo',
];

const TARGET_INSTITUTIONAL = [
  'cio',
  'consultant',
  'treasurer',
  'trustee',
  'council_member',
];

const VENUE_LABELS = {
  one_on_one: '1:1 conversation',
  small_group: 'Small group meeting',
  committee_hearing: 'Committee hearing',
  full_board_meeting: 'Full board/council meeting',
  public_testimony: 'Public testimony / town hall',
  written_memo: 'Written memo / email',
};

const TARGET_LABELS = {
  family_friends: 'Family / Friends',
  cio: 'CIO / Investment Officer',
  consultant: 'Investment Consultant',
  treasurer: 'Treasurer / Finance Director',
  trustee: 'Board / Trustee',
  council_member: 'Council / Committee Member',
};

const ENTITY_LABELS = {
  individual: 'Individual',
  swf: 'Sovereign Wealth Fund',
  public_pension: 'Public Pension Plan',
  corporate_pension: 'Corporate Pension Plan',
  endowment: 'Endowment',
  foundation: 'Foundation',
  insurance: 'Insurance General Account',
  central_bank: 'Central Bank / Official Institution',
  government: 'Government Investor',
};

const PRESET_CONFIGS = {
  mission_nonprofit: { mission: 'purity', competition: 'low', regulatory: 'medium' },
  public_pension: { mission: 'pragmatism', competition: 'high', regulatory: 'high' },
  university_endowment: { mission: 'purity', competition: 'high', regulatory: 'low' },
};

const PRESET_LABELS = {
  mission_nonprofit: 'Mission-driven nonprofit',
  public_pension: 'Public pension',
  university_endowment: 'University endowment',
  custom: 'Custom',
};

const KNOWLEDGE_LABELS = {
  plain: 'Plain English',
  technical: 'Technical / Nerd',
};

const MISSION_LABELS = {
  purity: 'Values-driven (Purity)',
  pragmatism: 'Risk-pragmatism (Conduct)',
};

const PRESSURE_LABELS = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

function pick(arr, n) {
  if (!Array.isArray(arr) || arr.length === 0) return [];
  return arr.slice(0, Math.min(n, arr.length));
}

function deriveApproach(baseGuide, thumb) {
  const res = { ...baseGuide };
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
  if (thumb.competition === 'high') {
    res.reporting = (res.reporting || '') + '\n• Enhanced transparency and stakeholder reporting cadence';
  }
  if (thumb.regulatory === 'high') {
    res.implementation = (res.implementation || '') + '\n• Narrow scope with best-efforts language due to statutory limits';
  }
  return res;
}

function buildHeadings(knowledgeLevel, data) {
  const guideIntroPlain = 'Use this identity map to match responsibilities before proposing action.';
  const guideIntroTechnical = 'Identity context determines constraints, tracking-error limits, and reporting expectations.';
  if (knowledgeLevel === 'plain') {
    return {
      knowledgeLevel,
      headings: {
        opening: 'Opening',
        key: 'Key Points to Share',
        counters: 'Likely Pushback & Responses',
        guide: 'Investor Identity Map',
        guideIntro: guideIntroPlain,
        approach: 'Implementation Snapshot',
        policy: 'Policy Alignment',
        screening: 'Screening Builds Intelligence',
      },
      guideIntroPlain,
      guideIntroTechnical,
    };
  }
  return {
    knowledgeLevel,
    headings: {
      opening: 'Opening',
      key: 'Key Points',
      counters: 'Counterarguments & Responses',
      guide: 'Investor Identity Guide',
      guideIntro: guideIntroTechnical,
      approach: 'Recommended Approach',
      policy: 'Policy Alignment',
      screening: data.screening_knowledge?.title || 'Screening as Cumulative Knowledge',
    },
    guideIntroPlain,
    guideIntroTechnical,
  };
}

function buildBrief(data, context, thumb, knowledgeLevel) {
  const { headings, guideIntroPlain, guideIntroTechnical } = buildHeadings(knowledgeLevel, data);
  const opening = (data.identity_openers?.[context.entity]?.[context.venue])
    || (data.identity_openers?.[context.entity]?.generic)
    || data.openers.generic;

  const entityPointsList =
    data.key_points_by_entity?.[context.entity] ||
    (context.target === 'family_friends'
      ? data.key_points_by_entity?.individual || []
      : []);
  const combinedPoints = [...entityPointsList, ...(data.key_points || [])];
  const dedupPoints = [];
  const seenPointTitles = new Set();
  for (const point of combinedPoints) {
    if (!point || !point.title) continue;
    if (seenPointTitles.has(point.title)) continue;
    seenPointTitles.add(point.title);
    dedupPoints.push(point);
  }
  const points = pick(dedupPoints, 6);
  const targetGroup = (() => {
    if (
      context.target === "family_friends" ||
      context.entity === "individual"
    ) {
      return "family_friends";
    }
    if (
      context.target === "cio" ||
      context.target === "consultant" ||
      context.target === "treasurer" ||
      context.target === "trustee"
    ) {
      return "fiduciary";
    }
    return "regulated";
  })();
  const desiredClaims = data.counter_sets?.[targetGroup] || [];
  const preferredCounters = desiredClaims
    .map((claim) => data.counters.find((c) => c.claim === claim))
    .filter(Boolean);
  const remainingCounters = data.counters.filter(
    (c) => !desiredClaims.includes(c.claim),
  );
  const combinedCounters = [...preferredCounters, ...remainingCounters];
  const counters = pick(
    combinedCounters,
    Math.min(7, combinedCounters.length),
  );
  const baseGuide = data.identity_guides?.[context.entity] || {};
  const approach = deriveApproach({
    ask: baseGuide.ask || '',
    implementation: baseGuide.implementation || '',
    reporting: baseGuide.reporting || '',
    risk: baseGuide.risk || '',
    callout: baseGuide.callout || '',
  }, thumb);

  const showCIO = context.target === 'cio' || context.target === 'consultant';
  const showResolution =
    context.target !== 'family_friends' &&
    context.entity !== 'individual' &&
    context.objective === 'resolution_support';
  const resolution = showResolution ? (data.model_resolution || '') : '';
  const resolutionText = showResolution
    ? resolution.replaceAll('{localName}', context.localName || '[Jurisdiction]').trim()
    : '';

  const personalAudience =
    context.target === 'family_friends' || context.entity === 'individual';
  let entitySteps = [];
  if (context.entity === 'individual') {
    entitySteps = data.next_steps_by_entity?.individual || [];
  } else if (context.target === 'family_friends') {
    entitySteps =
      data.next_steps_by_entity?.family_friends ||
      data.next_steps_by_entity?.individual ||
      [];
  } else {
    entitySteps = data.next_steps_by_entity?.[context.entity] || [];
  }
  const baseSteps = data.next_steps || [];
  const seenSteps = new Set();
  const steps = [...entitySteps, ...baseSteps].filter((step, idx) => {
    const trimmed = (step || '').trim();
    if (!trimmed) return false;
    const isEntityStep = idx < entitySteps.length;
    if (seenSteps.has(trimmed)) return false;
    if (!isEntityStep && personalAudience) {
      const lower = trimmed.toLowerCase();
      const excludeKeywords = [
        'holdings/exposure report',
        'tracking error',
        'public exclusions list',
        'annual review',
        'manager',
        'adopt written',
        'escalation process',
      ];
      if (excludeKeywords.some((k) => lower.includes(k))) {
        return false;
      }
    }
    seenSteps.add(trimmed);
    return true;
  });
  const policyAlignment = data.policy_alignment || {};
  const policyPrinciples = Array.isArray(policyAlignment.principles) ? policyAlignment.principles : [];
  const policyLink = policyAlignment.policy_link || null;
  const showPolicy = policyPrinciples.length > 0;
  const screeningData = data.screening_knowledge || {};
  const screeningPoints = Array.isArray(screeningData.points) ? screeningData.points : [];
  const screeningTitle = screeningData.title || 'Screening as Cumulative Knowledge';

  let sourceAudience = 'regulated';
  if (context.target === 'family_friends' || context.entity === 'individual') {
    sourceAudience = 'family_friends';
  } else if (
    context.target === 'cio' ||
    context.target === 'consultant' ||
    context.target === 'treasurer' ||
    context.target === 'trustee' ||
    context.entity === 'public_pension' ||
    context.entity === 'corporate_pension' ||
    context.entity === 'endowment' ||
    context.entity === 'foundation' ||
    context.entity === 'insurance' ||
    context.entity === 'central_bank'
  ) {
    sourceAudience = 'fiduciary';
  }
  const sourceSet = data.source_sets?.[sourceAudience] || data.sources || [];

  const governmentSnippet = context.entity === 'government' ? (data.government_policy_snippet || '') : '';
  const showGovernmentSnippet = Boolean(governmentSnippet);
  const entityLabel = ENTITY_LABELS[context.entity] || context.entity;

  const guideBullets = [
    `Inputs: Capital, People, Processes, Information — scaled to ${entityLabel}.`,
    'Enablers: Governance (decision rights, criteria), Culture (transparency, discipline), Technology (optimization, reporting).',
    `Thumbprint: Mission/Ethics ${MISSION_LABELS[thumb.mission] || thumb.mission}, Competition ${PRESSURE_LABELS[thumb.competition] || thumb.competition}, Regulatory ${PRESSURE_LABELS[thumb.regulatory] || thumb.regulatory}.`,
  ];

  return {
    context,
    thumb,
    openings: opening,
    opening,
    points: points.map((p) => ({
      title: p.title,
      body: p.body,
      citations: Array.isArray(p.citations) ? p.citations.map((ci) => ({ label: ci.label, url: ci.url })) : [],
    })),
    counters: counters.map((c) => ({
      claim: c.claim,
      response: c.response,
      citations: Array.isArray(c.citations) ? c.citations.map((ci) => ({ label: ci.label, url: ci.url })) : [],
    })),
    guideBullets,
    guideIntroPlain,
    guideIntroTechnical,
    headings,
    approach: {
      ask: approach.ask || '',
      implementation: approach.implementation || '',
      reporting: approach.reporting || '',
      risk: approach.risk || '',
      screen_primary: approach.screen_primary || '',
      screen_secondary: approach.screen_secondary || '',
      framing: approach.framing || '',
    },
    policyPrinciples,
    policyLink,
    screeningPoints: screeningPoints.map((p) => ({
      title: p.title,
      body: p.body,
      citations: Array.isArray(p.citations) ? p.citations.map((ci) => ({ label: ci.label, url: ci.url })) : [],
    })),
    screeningTitle,
    governmentSnippet,
    showGovernmentSnippet,
    showCIO,
    cioNote: showCIO ? (data.cio_note || '') : '',
    cioLinks: showCIO && Array.isArray(data.cio_links) ? data.cio_links : [],
    showResolution,
    resolutionText,
    steps: steps.slice(),
    knowledgeLevel,
    showPolicy,
    showScreening: screeningPoints.length > 0,
    sources: sourceSet,
    furtherReading: Array.isArray(data.further_reading) ? data.further_reading : [],
    thumbPreset: thumb.preset || 'custom',
  };
}

function buildMarkdown(result, mode) {
  if (!result) return '';
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
  if (result.thumbPreset && result.thumbPreset !== 'custom') {
    lines.push(`- Profile Preset: ${PRESET_LABELS[result.thumbPreset] || result.thumbPreset}`);
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
      lines.push(`  - Sources: ${p.citations.map((ci) => `${ci.label} (${ci.url})`).join('; ')}`);
    }
  }
  lines.push('');

  lines.push(`## ${mode === 'technical' ? 'Counterarguments & Responses' : 'Likely Pushback & Responses'}`);
  lines.push('');
  for (const c of result.counters) {
    lines.push(`- **Claim:** ${c.claim}`);
    lines.push(`  - **Response:** ${c.response}`);
    if (c.citations && c.citations.length) {
      lines.push(`  - Sources: ${c.citations.map((ci) => `${ci.label} (${ci.url})`).join('; ')}`);
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
    approach.screen_secondary ? `also ${approach.screen_secondary}` : '',
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
        lines.push(`  - Sources: ${point.citations.map((ci) => `${ci.label} (${ci.url})`).join('; ')}`);
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
      lines.push(`References: ${result.cioLinks.map((ci) => `${ci.label} (${ci.url})`).join('; ')}`);
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
  lines.push('_Prepared by Invest Vegan LLC DBA Ethical Capital. Educational toolkit only — not investment advice._');
  lines.push('');

  return lines.join('\n');
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function allowedTargets(entity) {
  return entity === 'individual' ? ['family_friends'] : TARGET_INSTITUTIONAL;
}

function presetToThumb(preset) {
  if (!preset || preset === 'custom') {
    return { mission: 'pragmatism', competition: 'medium', regulatory: 'medium', preset: 'custom' };
  }
  const config = PRESET_CONFIGS[preset];
  if (!config) return presetToThumb('custom');
  return { ...config, preset };
}

function enumerateContexts() {
  const entities = Object.keys(ENTITY_LABELS);
  const presets = ['mission_nonprofit', 'public_pension', 'university_endowment', 'custom'];
  const knowledgeLevels = ['plain', 'technical'];

  const results = [];

  entities.forEach((entity) => {
    const targets = allowedTargets(entity);
    targets.forEach((target) => {
      VENUES.forEach((venue) => {
        presets.forEach((preset) => {
          knowledgeLevels.forEach((knowledge) => {
            const context = {
              venue,
              target,
              entity,
              knowledge,
              localName: '',
              objective: 'resolution_support',
            };
            const thumb = presetToThumb(preset);
            const brief = buildBrief(data, context, thumb, knowledge);
            const markdown = buildMarkdown(brief, knowledge);
            results.push({
              preset,
              knowledge,
              context,
              markdown,
            });
          });
        });
      });
    });
  });

  return results;
}

function writeDiagnostics() {
  ensureDir(OUTPUT_DIR);
  const cases = enumerateContexts();
  cases.forEach(({ preset, knowledge, context, markdown }) => {
    const filename = [
      context.entity,
      context.target,
      context.venue,
      preset,
      knowledge,
    ].join('__').replace(/[^a-z0-9_-]+/gi, '-');
    const filePath = path.join(OUTPUT_DIR, `${filename}.md`);
    fs.writeFileSync(filePath, markdown, 'utf8');
  });
  console.log(`Generated ${cases.length} diagnostic briefs in ${OUTPUT_DIR}`);
}

writeDiagnostics();
