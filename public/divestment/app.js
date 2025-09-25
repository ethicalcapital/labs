(() => {
  const el = (id) => document.getElementById(id);
  const venue = el("venue");
  const target = el("target");
  const invIdentity = el("invIdentity");
  const knowledge = el("knowledge");
  const thumbMission = el("thumb_mission");
  const thumbCompetition = el("thumb_competition");
  const thumbRegulatory = el("thumb_regulatory");
  const thumbPreset = el("thumb_preset");
  const thumbCustom = el("thumb_custom");
  const localName = el("localName");
  const objective = el("objective");
  const brief = el("brief");
  const buildBtn = el("buildBtn");
  const resetBtn = el("resetBtn");
  const copyTextBtn = el("copyText");
  const downloadBriefBtn = el("downloadBrief");
  const printBtn = el("printBtn");
  const sourcesList = el("sources");
  const fbUse = el("fb_usecase");
  const fbOutcome = el("fb_outcome");
  const fbNotes = el("fb_notes");
  const fbConsent = el("fb_consent");
  const fbSend = el("fb_send");
  const fbStatus = el("fb_status");
  const onePagerFieldset = el("onePagerFieldset");
  const onePagerOptions = el("onePagerOptions");

  const state = { data: null, last: null, onePagerCache: {} };
  let onePagerInitialized = false;

  const missionValue = () =>
    thumbMission.value === "0" ? "purity" : "pragmatism";

  const VENUE_LABELS = {
    one_on_one: "1:1 conversation",
    small_group: "Small group meeting",
    committee_hearing: "Committee hearing",
    full_board_meeting: "Full board/council meeting",
    public_testimony: "Public testimony / town hall",
    written_memo: "Written memo / email",
  };

  const TARGET_LABELS = {
    family_friends: "Family / Friends",
    cio: "CIO / Investment Officer",
    consultant: "Investment Consultant",
    treasurer: "Treasurer / Finance Director",
    trustee: "Board / Trustee",
    council_member: "Council / Committee Member",
  };

  const TARGET_OPTIONS_ALL = [
    { value: "family_friends", label: TARGET_LABELS.family_friends },
    { value: "cio", label: TARGET_LABELS.cio },
    { value: "consultant", label: TARGET_LABELS.consultant },
    { value: "treasurer", label: TARGET_LABELS.treasurer },
    { value: "trustee", label: TARGET_LABELS.trustee },
    { value: "council_member", label: TARGET_LABELS.council_member },
  ];

  const ENTITY_LABELS = {
    swf: "Sovereign Wealth Fund",
    public_pension: "Public Pension Plan",
    corporate_pension: "Corporate Pension Plan",
    endowment: "Endowment",
    foundation: "Foundation",
    insurance: "Insurance General Account",
    central_bank: "Central Bank / Official Institution",
    government: "Government Investor",
    individual: "Individual",
  };

  const KNOWLEDGE_LABELS = {
    plain: "Plain English",
    technical: "Technical / Nerd",
  };

  const MISSION_LABELS = {
    purity: "Values-driven (Purity)",
    pragmatism: "Risk-pragmatism (Conduct)",
  };

  const PRESSURE_LABELS = {
    low: "Low",
    medium: "Medium",
    high: "High",
  };

  const PRESET_CONFIGS = {
    mission_nonprofit: {
      mission: "purity",
      competition: "low",
      regulatory: "medium",
    },
    public_pension: {
      mission: "pragmatism",
      competition: "high",
      regulatory: "high",
    },
    university_endowment: {
      mission: "purity",
      competition: "high",
      regulatory: "low",
    },
  };

  const PRESET_LABELS = {
    mission_nonprofit: "Mission-driven nonprofit",
    public_pension: "Public pension",
    university_endowment: "University endowment",
    custom: "Custom",
  };

  async function loadData() {
    if (state.data) return state.data;
    // Try relative path first (works when builder is served at /divestment/)
    const tryPaths = [
      "./content/bds_pack.json",
      "/divestment/content/bds_pack.json",
      "/public/divestment/content/bds_pack.json",
    ];
    for (const p of tryPaths) {
      try {
        const resp = await fetch(p, { cache: "no-store" });
        if (!resp.ok) throw new Error("bad status " + resp.status);
        state.data = await resp.json();
        return state.data;
      } catch {
        // try next
      }
    }
    console.warn(
      "Falling back to embedded content pack: could not fetch content JSON",
    );
    state.data = window.__BDS_FALLBACK__;
    return state.data;
  }

  function escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function formatInline(text) {
    const escaped = escapeHtml(text);
    return escaped
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/`(.+?)`/g, "<code>$1</code>");
  }

  function markdownToHtml(markdown) {
    const lines = String(markdown ?? "")
      .replace(/\r\n/g, "\n")
      .split("\n");
    let html = "";
    let inList = false;
    let paragraph = "";

    const closeList = () => {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
    };

    const flushParagraph = () => {
      if (paragraph.trim().length) {
        html += `<p>${formatInline(paragraph.trim())}</p>`;
        paragraph = "";
      }
    };

    for (const rawLine of lines) {
      const line = rawLine.trimEnd();
      if (!line.trim()) {
        flushParagraph();
        closeList();
        continue;
      }
      if (/^###\s+/.test(line)) {
        flushParagraph();
        closeList();
        html += `<h4>${formatInline(line.replace(/^###\s+/, ""))}</h4>`;
        continue;
      }
      if (/^##\s+/.test(line)) {
        flushParagraph();
        closeList();
        html += `<h3>${formatInline(line.replace(/^##\s+/, ""))}</h3>`;
        continue;
      }
      if (/^#\s+/.test(line)) {
        flushParagraph();
        closeList();
        html += `<h2>${formatInline(line.replace(/^#\s+/, ""))}</h2>`;
        continue;
      }
      if (/^-\s+/.test(line)) {
        flushParagraph();
        if (!inList) {
          html += "<ul>";
          inList = true;
        }
        html += `<li>${formatInline(line.replace(/^-\s+/, ""))}</li>`;
        continue;
      }
      paragraph = paragraph ? `${paragraph} ${line.trim()}` : line.trim();
    }

    flushParagraph();
    closeList();
    return html;
  }

  function candidateAssetPaths(relativePath) {
    if (!relativePath) return [];
    const clean = String(relativePath).replace(/^\.?\//, "");
    const options = new Set();
    options.add(`./${clean}`);
    options.add(`/divestment/${clean}`);
    options.add(`/public/divestment/${clean}`);
    return Array.from(options);
  }

  async function loadOnePagerContent(page) {
    if (!page || !page.id) return null;
    if (state.onePagerCache[page.id]) return state.onePagerCache[page.id];

    let markdown = page.markdown ? String(page.markdown) : null;
    if (!markdown && page.path) {
      const paths = candidateAssetPaths(page.path);
      for (const assetPath of paths) {
        try {
          const resp = await fetch(assetPath, { cache: "no-store" });
          if (!resp.ok) continue;
          markdown = await resp.text();
          break;
        } catch {
          // try next path
        }
      }
    }

    if (!markdown) {
      const fallbackMessage =
        "Attachment unavailable — unable to load source document.";
      const record = {
        id: page.id,
        title: page.title || page.id,
        description: page.description || "",
        markdown: `# ${page.title || page.id}\n\n${fallbackMessage}`,
        html: `<p>${formatInline(fallbackMessage)}</p>`,
        unavailable: true,
      };
      state.onePagerCache[page.id] = record;
      return record;
    }

    const record = {
      id: page.id,
      title: page.title || page.id,
      description: page.description || "",
      markdown,
      html: markdownToHtml(markdown),
      unavailable: false,
    };
    state.onePagerCache[page.id] = record;
    return record;
  }

  async function ensureOnePagerOptions() {
    if (onePagerInitialized) return;
    if (!onePagerFieldset || !onePagerOptions) {
      onePagerInitialized = true;
      return;
    }
    const data = await loadData();
    const pages = Array.isArray(data.one_pagers) ? data.one_pagers : [];
    if (!pages.length) {
      onePagerFieldset.classList.add("hidden");
      onePagerInitialized = true;
      return;
    }

    onePagerFieldset.classList.remove("hidden");
    onePagerOptions.innerHTML = "";
    for (const page of pages) {
      const label = document.createElement("label");
      label.className = "builder-pill";

      const input = document.createElement("input");
      input.type = "checkbox";
      input.value = page.id;
      input.className = "one-pager-option";

      const text = document.createElement("span");
      text.className = "builder-pill__text";

      const title = document.createElement("span");
      title.className = "builder-pill__title";
      title.textContent = page.title || page.id;
      text.appendChild(title);

      if (page.description) {
        const desc = document.createElement("span");
        desc.className = "builder-pill__description";
        desc.textContent = page.description;
        text.appendChild(desc);
      }

      label.appendChild(input);
      label.appendChild(text);
      onePagerOptions.appendChild(label);
    }

    onePagerInitialized = true;
  }

  function getSelectedOnePagerIds() {
    if (!onePagerOptions) return [];
    return Array.from(
      onePagerOptions.querySelectorAll("input.one-pager-option:checked"),
    ).map((input) => input.value);
  }

  function resetOnePagers() {
    if (!onePagerOptions) return;
    onePagerOptions
      .querySelectorAll("input.one-pager-option")
      .forEach((input) => {
        input.checked = false;
      });
  }

  function sanitize(text) {
    const div = document.createElement("div");
    div.textContent = text ?? "";
    return div.innerHTML;
  }

  function renderSources(sources, furtherReading) {
    sourcesList.innerHTML = "";
    const items = [];
    (sources || []).forEach((s) => items.push(s));
    (furtherReading || []).forEach((s) => items.push(s));
    for (const s of items) {
      const li = document.createElement("li");
      li.innerHTML = `${sanitize(s.label)} — <a class="brief-link" href="${s.url}" target="_blank" rel="noopener noreferrer">${s.url}</a>`;
      sourcesList.appendChild(li);
    }
  }

  function setTargetOptions(allowedValues) {
    const current = target.value;
    target.innerHTML = "";
    allowedValues.forEach((value) => {
      const optionData = TARGET_OPTIONS_ALL.find((opt) => opt.value === value);
      if (!optionData) return;
      const option = document.createElement("option");
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
    if (invIdentity.value === "individual") {
      setTargetOptions(["family_friends"]);
    } else {
      setTargetOptions(
        TARGET_OPTIONS_ALL.filter((opt) => opt.value !== "family_friends").map(
          (opt) => opt.value,
        ),
      );
    }
  }

  function setThumbInputs(config) {
    thumbMission.value = config.mission === "purity" ? "0" : "1";
    thumbCompetition.value = config.competition;
    thumbRegulatory.value = config.regulatory;
  }

  function toggleThumbInputs(disabled) {
    thumbMission.disabled = disabled;
    thumbCompetition.disabled = disabled;
    thumbRegulatory.disabled = disabled;
    thumbCustom.classList.toggle("opacity-60", disabled);
  }

  function applyThumbPreset(preset) {
    if (preset === "custom" || !PRESET_CONFIGS[preset]) {
      thumbCustom.classList.remove("hidden");
      toggleThumbInputs(false);
      return;
    }
    const config = PRESET_CONFIGS[preset];
    thumbCustom.classList.add("hidden");
    toggleThumbInputs(true);
    setThumbInputs(config);
  }

  function ensureCustomPreset() {
    if (thumbPreset.value !== "custom") {
      thumbPreset.value = "custom";
      thumbCustom.classList.remove("hidden");
      toggleThumbInputs(false);
    }
  }

  function pick(arr, n) {
    if (!Array.isArray(arr) || arr.length === 0) return [];
    if (n >= arr.length) return arr.slice();
    return arr.slice(0, n); // deterministic, predictable selection
  }

  async function sendFeedback() {
    fbStatus.textContent = "";
    if (!fbConsent.checked) {
      fbStatus.textContent = "Please check consent to send.";
      return;
    }
    const payload = {
      consent: true,
      venue: venue.value,
      target: target.value,
      entityType: invIdentity.value,
      knowledge: knowledge.value,
      thumb: {
        mission: missionValue(),
        competition: thumbCompetition.value,
        regulatory: thumbRegulatory.value,
        preset: thumbPreset.value,
      },
      thumbPreset: thumbPreset.value,
      objective: objective.value,
      use_case: fbUse.value,
      outcome: fbOutcome.value,
      notes: (fbNotes.value || "").slice(0, 2000),
      content_version:
        state.data && state.data.version
          ? String(state.data.version)
          : "fallback",
    };
    try {
      const resp = await fetch("/api/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) throw new Error("bad status " + resp.status);
      fbStatus.textContent = "Thanks — feedback received.";
      fbSend.disabled = true;
      setTimeout(() => {
        fbSend.disabled = false;
        fbStatus.textContent = "";
      }, 4000);
    } catch {
      // Fallback: download JSON locally
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "divestment-feedback.json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      fbStatus.textContent =
        "Saved feedback file locally (no server available).";
    }
  }

  function deriveApproach(identityGuide, thumb) {
    // Start with base guide for the selected identity, then adjust by thumbprint.
    const res = { ...identityGuide };

    // Mission sets emphasis, but both screen types are in scope
    const productDesc =
      "Product-based (absolute) exclusions for categorical harms";
    const conductDesc = "Conduct/norms-based exclusions for risk mitigation";
    if (thumb.mission === "purity") {
      res.screen_primary = productDesc;
      res.screen_secondary = conductDesc;
      res.framing =
        "Lead with moral clarity while maintaining professional risk controls and transparency.";
    } else {
      res.screen_primary = conductDesc;
      res.screen_secondary = productDesc;
      res.framing =
        "Lead with risk management and benchmark alignment while recognizing categorical harms where mission and regulation allow.";
    }

    // Competition pressure implies transparency/innovation emphasis
    if (thumb.competition === "high") {
      res.reporting =
        (res.reporting || "") +
        "\n• Enhanced transparency and stakeholder reporting cadence";
    }

    // Regulatory constraints narrow scope and emphasize best-efforts
    if (thumb.regulatory === "high") {
      res.implementation =
        (res.implementation || "") +
        "\n• Narrow scope with best‑efforts language due to statutory limits";
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
      localName: (localName.value || "").trim(),
      objective: objective.value,
    };

    const thumb = {
      mission: missionValue(),
      competition: thumbCompetition.value,
      regulatory: thumbRegulatory.value,
      preset: thumbPreset.value,
    };

    const knowledgeLevel = context.knowledge;
    const guideIntroPlain =
      "Use this identity map to match responsibilities before proposing action.";
    const guideIntroTechnical =
      "Identity context determines constraints, tracking-error limits, and reporting expectations.";
    const headings =
      knowledgeLevel === "plain"
        ? {
            opening: "Opening",
            key: "Key Points to Share",
            counters: "Likely Pushback & Responses",
            guide: "Investor Identity Map",
            guideIntro: guideIntroPlain,
            approach: "Implementation Snapshot",
            policy: "Policy Alignment",
            screening: "Screening Builds Intelligence",
          }
        : {
            opening: "Opening",
            key: "Key Points",
            counters: "Counterarguments & Responses",
            guide: "Investor Identity Guide",
            guideIntro: guideIntroTechnical,
            approach: "Recommended Approach",
            policy: "Policy Alignment",
            screening:
              data.screening_knowledge?.title ||
              "Screening as Cumulative Knowledge",
          };

    const opening =
      data.identity_openers?.[context.entity]?.[context.venue] ||
      data.identity_openers?.[context.entity]?.generic ||
      data.openers.generic;

    const entityPointsList =
      data.key_points_by_entity?.[context.entity] ||
      (context.target === "family_friends"
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
    const approach = deriveApproach(
      {
        ask: baseGuide.ask || "",
        implementation: baseGuide.implementation || "",
        reporting: baseGuide.reporting || "",
        risk: baseGuide.risk || "",
        callout: baseGuide.callout || "",
      },
      thumb,
    );

    const showCIO = context.target === "cio" || context.target === "consultant";
    const showResolution =
      context.target !== "family_friends" &&
      context.entity !== "individual" &&
      context.objective === "resolution_support";
    const resolution = showResolution ? data.model_resolution || "" : "";
    const resolutionText = showResolution
      ? resolution
          .replaceAll("{localName}", context.localName || "[Jurisdiction]")
          .trim()
      : "";

    const personalAudience =
      context.target === "family_friends" || context.entity === "individual";
    let entitySteps = [];
    if (context.entity === "individual") {
      entitySteps = data.next_steps_by_entity?.individual || [];
    } else if (context.target === "family_friends") {
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
      const trimmed = (step || "").trim();
      if (!trimmed) return false;
      const isEntityStep = idx < entitySteps.length;
      if (seenSteps.has(trimmed)) return false;
      if (!isEntityStep && personalAudience) {
        const lower = trimmed.toLowerCase();
        const excludeKeywords = [
          "holdings/exposure report",
          "tracking error",
          "public exclusions list",
          "annual review",
          "manager",
          "adopt written",
          "escalation process",
        ];
        if (excludeKeywords.some((k) => lower.includes(k))) {
          return false;
        }
      }
      seenSteps.add(trimmed);
      return true;
    });

    const policyAlignment = data.policy_alignment || {};
    const policyPrinciples = Array.isArray(policyAlignment.principles)
      ? policyAlignment.principles
      : [];
    const policyLink = policyAlignment.policy_link || null;
    const showPolicy =
      knowledgeLevel === "technical" && policyPrinciples.length > 0;

    const screeningData = data.screening_knowledge || {};
    const screeningPoints = Array.isArray(screeningData.points)
      ? screeningData.points
      : [];
    const screeningTitle =
      screeningData.title || "Screening as Cumulative Knowledge";
    const showScreening = screeningPoints.length > 0;

    let sourceAudience = "regulated";
    if (
      context.target === "family_friends" ||
      context.entity === "individual"
    ) {
      sourceAudience = "family_friends";
    } else if (
      context.target === "cio" ||
      context.target === "consultant" ||
      context.target === "treasurer" ||
      context.target === "trustee" ||
      context.entity === "public_pension" ||
      context.entity === "corporate_pension" ||
      context.entity === "endowment" ||
      context.entity === "foundation" ||
      context.entity === "insurance" ||
      context.entity === "central_bank"
    ) {
      sourceAudience = "fiduciary";
    }
    const sourceSet = data.source_sets?.[sourceAudience] || data.sources || [];

    const selectedOnePagerIds = getSelectedOnePagerIds();
    const attachments = [];
    if (selectedOnePagerIds.length) {
      const pageIndex = new Map(
        (Array.isArray(data.one_pagers) ? data.one_pagers : []).map((page) => [
          page.id,
          page,
        ]),
      );
      for (const id of selectedOnePagerIds) {
        const page = pageIndex.get(id);
        if (!page) continue;
        const attachment = await loadOnePagerContent(page);
        if (attachment) attachments.push(attachment);
      }
    }

    const governmentSnippet =
      context.entity === "government"
        ? data.government_policy_snippet || ""
        : "";
    const showGovernmentSnippet = Boolean(governmentSnippet);

    const entityLabel = ENTITY_LABELS[context.entity] || context.entity;
    const guideBullets = [
      `Inputs: Capital, People, Processes, Information — scaled to ${entityLabel}.`,
      "Enablers: Governance (decision rights, criteria), Culture (transparency, discipline), Technology (optimization, reporting).",
      `Thumbprint: Mission/Ethics ${MISSION_LABELS[thumb.mission] || thumb.mission}, Competition ${PRESSURE_LABELS[thumb.competition] || thumb.competition}, Regulatory ${PRESSURE_LABELS[thumb.regulatory] || thumb.regulatory}.`,
    ];

    const formatMultiline = (value) => sanitize(value).replace(/\n/g, "<br>");

    let html = "";
    html += `<h3 class="mt-0">${sanitize(headings.opening)}</h3>`;
    html += `<p>${sanitize(opening)}</p>`;

    if (attachments.length) {
      const attachTitles = attachments
        .map((att) => sanitize(att.title))
        .join(" · ");
      html += `<p class="text-xs text-subtle">Attached one-pagers: ${attachTitles}</p>`;
    }

    html += `<h3>${sanitize(headings.key)}</h3>`;
    html += "<ol>";
    for (const p of points) {
      html += `<li><strong>${sanitize(p.title)}</strong><br>${sanitize(p.body)}`;
      if (p.citations && p.citations.length) {
        const c = p.citations
          .map(
            (ci) =>
              `<a class="brief-link" href="${ci.url}" target="_blank" rel="noopener">${sanitize(ci.label)}</a>`,
          )
          .join(" · ");
        html += `<div class="mt-1 text-xs text-subtle">Sources: ${c}</div>`;
      }
      html += `</li>`;
    }
    html += "</ol>";

    html += `<h3>${sanitize(headings.counters)}</h3>`;
    for (const c of counters) {
      html += `<p><span class="text-subtle">Claim:</span> <em>${sanitize(c.claim)}</em><br><span class="text-subtle">Response:</span> ${sanitize(c.response)}`;
      if (c.citations && c.citations.length) {
        const cs = c.citations
          .map(
            (ci) =>
              `<a class="brief-link" href="${ci.url}" target="_blank" rel="noopener">${sanitize(ci.label)}</a>`,
          )
          .join(" · ");
        html += `<div class="mt-1 text-xs text-subtle">Sources: ${cs}</div>`;
      }
      html += `</p>`;
    }

    html += `<h3>${sanitize(headings.guide)}</h3>`;
    html += `<p class="text-muted">${sanitize(headings.guideIntro)}</p>`;
    html +=
      "<ul>" +
      guideBullets.map((b) => `<li>${sanitize(b)}</li>`).join("") +
      "</ul>";

    if (showPolicy) {
      html += `<h3>${sanitize(headings.policy)}</h3>`;
      html +=
        "<ul>" +
        policyPrinciples.map((p) => `<li>${sanitize(p)}</li>`).join("") +
        "</ul>";
      if (policyLink) {
        html += `<p class="text-xs text-subtle">Reference: <a class="brief-link" href="${policyLink.url}" target="_blank" rel="noopener">${sanitize(policyLink.label || policyLink.url)}</a></p>`;
      }
    }

    if (showGovernmentSnippet) {
      html += `<h3>Government Policy Snippet (Approved Issuers)</h3>`;
      html += `<pre class="whitespace-pre-wrap leading-relaxed">${sanitize(governmentSnippet)}</pre>`;
    }

    html += `<h3>${sanitize(headings.approach)}</h3>`;
    html += "<ul>";
    if (approach.ask)
      html += `<li><strong>Ask</strong>: ${sanitize(approach.ask)}</li>`;
    if (approach.implementation)
      html += `<li><strong>Implementation</strong>: ${formatMultiline(approach.implementation)}</li>`;
    if (approach.reporting)
      html += `<li><strong>Reporting</strong>: ${formatMultiline(approach.reporting)}</li>`;
    if (approach.risk)
      html += `<li><strong>Risk & Controls</strong>: ${formatMultiline(approach.risk)}</li>`;
    const screenParts = [];
    if (approach.screen_primary) {
      screenParts.push(sanitize(approach.screen_primary));
    }
    if (approach.screen_secondary) {
      screenParts.push(`also ${sanitize(approach.screen_secondary)}`);
    }
    if (screenParts.length) {
      html += `<li><strong>Screen Types (emphasis first)</strong>: ${screenParts.join("; ")}.</li>`;
    }
    if (approach.framing)
      html += `<li><strong>Framing</strong>: ${sanitize(approach.framing)}</li>`;
    html += "</ul>";

    if (showScreening) {
      html += `<h3>${sanitize(headings.screening)}</h3>`;
      if (knowledgeLevel === "plain") {
        html +=
          '<p class="text-muted">Screening builds cumulative knowledge about fragile business models, regulatory exposure, and reputational risk. Share the insight, not just the exclusion list.</p>';
      }
      const screeningList =
        knowledgeLevel === "technical"
          ? screeningPoints
          : screeningPoints.slice(0, 2);
      if (screeningList.length) {
        html += "<ul>";
        for (const point of screeningList) {
          html += `<li><strong>${sanitize(point.title)}</strong>: ${sanitize(point.body)}`;
          if (
            knowledgeLevel === "technical" &&
            point.citations &&
            point.citations.length
          ) {
            const c = point.citations
              .map(
                (ci) =>
                  `<a class="brief-link" href="${ci.url}" target="_blank" rel="noopener">${sanitize(ci.label)}</a>`,
              )
              .join(" · ");
            html += `<div class="mt-1 text-xs text-subtle">Sources: ${c}</div>`;
          }
          html += "</li>";
        }
        html += "</ul>";
      }
    }

    if (showCIO && data.cio_note) {
      html += `<h3>For CIOs / Consultants</h3>`;
      html += `<p>${sanitize(data.cio_note)}</p>`;
      if (data.cio_links && data.cio_links.length) {
        const l = data.cio_links
          .map(
            (ci) =>
              `<a class="brief-link" href="${ci.url}" target="_blank" rel="noopener">${sanitize(ci.label)}</a>`,
          )
          .join(" · ");
        html += `<div class="mt-1 text-xs text-subtle">Read: ${l}</div>`;
      }
    }

    if (showResolution) {
      html += `<h3>Model Resolution</h3>`;
      html += `<pre class="whitespace-pre-wrap leading-relaxed">${sanitize(resolutionText)}</pre>`;
    }

    if (steps.length) {
      html += `<h3>Next Steps</h3>`;
      html +=
        "<ul>" + steps.map((s) => `<li>${sanitize(s)}</li>`).join("") + "</ul>";
    }

    if (attachments.length) {
      html += `<h3>Attached One-Pagers</h3>`;
      for (const att of attachments) {
        html += `<details class="one-pager-card" open>`;
        html += `<summary>${sanitize(att.title)}</summary>`;
        if (att.description) {
          html += `<p class="one-pager-card__description">${sanitize(att.description)}</p>`;
        }
        html += `<div class="one-pager-card__body">${att.html}</div>`;
        html += `</details>`;
      }
    }

    brief.innerHTML = html;

    state.last = {
      context,
      thumb,
      opening,
      points: points.map((p) => ({
        title: p.title,
        body: p.body,
        citations: Array.isArray(p.citations)
          ? p.citations.map((ci) => ({ label: ci.label, url: ci.url }))
          : [],
      })),
      counters: counters.map((c) => ({
        claim: c.claim,
        response: c.response,
        citations: Array.isArray(c.citations)
          ? c.citations.map((ci) => ({ label: ci.label, url: ci.url }))
          : [],
      })),
      guideIntro: headings.guideIntro,
      guideIntroPlain,
      guideIntroTechnical,
      guideBullets,
      approach: {
        ask: approach.ask || "",
        implementation: approach.implementation || "",
        reporting: approach.reporting || "",
        risk: approach.risk || "",
        screen_primary: approach.screen_primary || "",
        screen_secondary: approach.screen_secondary || "",
        framing: approach.framing || "",
      },
      policyPrinciples,
      policyLink,
      screeningPoints: screeningPoints.map((p) => ({
        title: p.title,
        body: p.body,
        citations: Array.isArray(p.citations)
          ? p.citations.map((ci) => ({ label: ci.label, url: ci.url }))
          : [],
      })),
      screeningTitle,
      showPolicy,
      showScreening,
      governmentSnippet,
      showGovernmentSnippet,
      showCIO,
      cioNote: showCIO ? data.cio_note || "" : "",
      cioLinks: showCIO && Array.isArray(data.cio_links) ? data.cio_links : [],
      showResolution,
      resolutionText,
      steps: steps.slice(),
      knowledgeLevel,
      headings,
      sources: sourceSet,
      furtherReading: Array.isArray(data.further_reading)
        ? data.further_reading
        : [],
      attachments: attachments.map((att) => ({
        id: att.id,
        title: att.title,
        description: att.description,
        markdown: att.markdown,
        unavailable: att.unavailable,
      })),
    };

    renderSources(sourceSet, data.further_reading || []);
  }

  function buildMarkdown(mode) {
    if (!state.last) return null;
    const result = state.last;
    const context = result.context;
    const knowledgeLabel =
      KNOWLEDGE_LABELS[mode] ||
      (mode === "technical" ? "Technical / Nerd" : "Plain English");
    const lines = [];
    lines.push(`# Dryvestment Brief (${knowledgeLabel})`);
    lines.push("");
    lines.push(`- Venue: ${VENUE_LABELS[context.venue] || context.venue}`);
    lines.push(`- Target: ${TARGET_LABELS[context.target] || context.target}`);
    lines.push(
      `- Entity Type: ${ENTITY_LABELS[context.entity] || context.entity}`,
    );
    lines.push(`- Knowledge Level: ${knowledgeLabel}`);
    lines.push(
      `- Thumbprint: Mission/Ethics ${MISSION_LABELS[result.thumb.mission] || result.thumb.mission}; Competition ${PRESSURE_LABELS[result.thumb.competition] || result.thumb.competition}; Regulatory ${PRESSURE_LABELS[result.thumb.regulatory] || result.thumb.regulatory}`,
    );
    if (result.thumb.preset && result.thumb.preset !== "custom") {
      lines.push(
        `- Profile Preset: ${PRESET_LABELS[result.thumb.preset] || result.thumb.preset}`,
      );
    }
    if (context.localName) {
      lines.push(`- Local Name: ${context.localName}`);
    }
    if (result.attachments && result.attachments.length) {
      lines.push(
        `- Attached One-Pagers: ${result.attachments
          .map((att) => att.title)
          .join(", ")}`,
      );
    }
    lines.push("");

    lines.push("## Opening");
    lines.push("");
    lines.push(result.opening);
    lines.push("");

    lines.push(
      `## ${mode === "technical" ? "Key Points" : "Key Points to Share"}`,
    );
    lines.push("");
    for (const p of result.points) {
      lines.push(`- **${p.title}.** ${p.body}`);
      if (p.citations && p.citations.length) {
        lines.push(
          `  - Sources: ${p.citations.map((ci) => `${ci.label} (${ci.url})`).join("; ")}`,
        );
      }
    }
    lines.push("");

    lines.push(
      `## ${mode === "technical" ? "Counterarguments & Responses" : "Likely Pushback & Responses"}`,
    );
    lines.push("");
    for (const c of result.counters) {
      lines.push(`- **Claim:** ${c.claim}`);
      lines.push(`  - **Response:** ${c.response}`);
      if (c.citations && c.citations.length) {
        lines.push(
          `  - Sources: ${c.citations.map((ci) => `${ci.label} (${ci.url})`).join("; ")}`,
        );
      }
    }
    lines.push("");

    lines.push(
      `## ${mode === "technical" ? "Investor Identity Guide" : "Investor Identity Map"}`,
    );
    lines.push("");
    lines.push(
      mode === "technical"
        ? result.guideIntroTechnical
        : result.guideIntroPlain,
    );
    lines.push("");
    for (const bullet of result.guideBullets) {
      lines.push(`- ${bullet}`);
    }
    lines.push("");

    lines.push(
      `## ${mode === "technical" ? "Recommended Approach" : "Implementation Snapshot"}`,
    );
    lines.push("");
    const approach = result.approach;
    if (approach.ask) lines.push(`- Ask: ${approach.ask}`);
    if (approach.implementation)
      lines.push(
        `- Implementation: ${approach.implementation.replace(/\n/g, "; ")}`,
      );
    if (approach.reporting)
      lines.push(`- Reporting: ${approach.reporting.replace(/\n/g, "; ")}`);
    if (approach.risk)
      lines.push(`- Risk & Controls: ${approach.risk.replace(/\n/g, "; ")}`);
    const screenDesc = [
      approach.screen_primary ? approach.screen_primary : "",
      approach.screen_secondary ? `also ${approach.screen_secondary}` : "",
    ]
      .filter(Boolean)
      .join("; ");
    if (screenDesc)
      lines.push(`- Screen Types (emphasis first): ${screenDesc}`);
    if (approach.framing) lines.push(`- Framing: ${approach.framing}`);
    lines.push("");

    if (mode === "technical" && result.policyPrinciples.length) {
      lines.push("## Policy Alignment");
      lines.push("");
      for (const principle of result.policyPrinciples) {
        lines.push(`- ${principle}`);
      }
      if (result.policyLink) {
        lines.push(
          `- Reference: ${result.policyLink.label || result.policyLink.url} (${result.policyLink.url})`,
        );
      }
      lines.push("");
    }

    if (result.showGovernmentSnippet && result.governmentSnippet) {
      lines.push("## Approved Issuers Template");
      lines.push("");
      lines.push("```");
      lines.push(result.governmentSnippet);
      lines.push("```");
      lines.push("");
    }

    if (result.screeningPoints.length) {
      const heading =
        mode === "technical"
          ? result.screeningTitle
          : "Screening Builds Intelligence";
      lines.push(`## ${heading}`);
      lines.push("");
      if (mode !== "technical") {
        lines.push(
          "Screening compounds knowledge about fragile business models, regulatory exposure, and reputational risk.",
        );
        lines.push("");
      }
      const screeningList =
        mode === "technical"
          ? result.screeningPoints
          : result.screeningPoints.slice(0, 2);
      for (const point of screeningList) {
        lines.push(`- **${point.title}.** ${point.body}`);
        if (mode === "technical" && point.citations && point.citations.length) {
          lines.push(
            `  - Sources: ${point.citations.map((ci) => `${ci.label} (${ci.url})`).join("; ")}`,
          );
        }
      }
      lines.push("");
    }

    if (result.showCIO && mode === "technical" && result.cioNote) {
      lines.push("## Notes for CIO / Consultant");
      lines.push("");
      lines.push(result.cioNote);
      if (result.cioLinks && result.cioLinks.length) {
        lines.push("");
        lines.push(
          `References: ${result.cioLinks.map((ci) => `${ci.label} (${ci.url})`).join("; ")}`,
        );
      }
      lines.push("");
    }

    if (result.showResolution && result.resolutionText) {
      lines.push("## Model Resolution");
      lines.push("");
      lines.push("```");
      lines.push(result.resolutionText);
      lines.push("```");
      lines.push("");
    }

    if (result.steps && result.steps.length) {
      lines.push("## Next Steps");
      lines.push("");
      for (const step of result.steps) {
        lines.push(`- ${step}`);
      }
      lines.push("");
    }

    if (result.attachments && result.attachments.length) {
      lines.push("## Attached One-Pagers");
      lines.push("");
      if (mode === "plain") {
        result.attachments.forEach((att, idx) => {
          const summary = att.description
            ? `Included: ${att.title} — ${att.description}`
            : `Included: ${att.title}`;
          lines.push(`> ${summary}`);
          lines.push("");
          lines.push(att.markdown.trim());
          lines.push("");
          if (idx !== result.attachments.length - 1) {
            lines.push("---");
            lines.push("");
          }
        });
      } else {
        lines.push(
          "Full attachments are included with the plain-language brief.",
        );
        lines.push("");
        result.attachments.forEach((att) => {
          const summary = att.description
            ? `${att.title} — ${att.description}`
            : att.title;
          lines.push(`- ${summary}`);
        });
        lines.push("");
      }
    }

    const combinedSources = [
      ...(result.sources || []),
      ...(result.furtherReading || []),
    ];
    if (combinedSources.length) {
      lines.push("## Sources & Further Reading");
      lines.push("");
      for (const src of combinedSources) {
        lines.push(`- ${src.label} (${src.url})`);
      }
      lines.push("");
    }

    lines.push("---");
    lines.push("");
    lines.push(
      "_Prepared by Ethical Capital Labs. Educational toolkit only — not investment advice._",
    );
    lines.push("");

    return lines.join("\n");
  }

  function downloadCombinedMarkdown() {
    const plain = buildMarkdown("plain");
    const technical = buildMarkdown("technical");
    if (!plain || !technical) return;
    const combined = (plain + "\n\n" + technical).trim();
    const blob = new Blob([combined], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "divestment-brief.md";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  thumbPreset.addEventListener("change", () =>
    applyThumbPreset(thumbPreset.value),
  );
  thumbMission.addEventListener("input", ensureCustomPreset);
  thumbMission.addEventListener("change", ensureCustomPreset);
  thumbCompetition.addEventListener("change", ensureCustomPreset);
  thumbRegulatory.addEventListener("change", ensureCustomPreset);

  invIdentity.addEventListener("change", () => applyEntityConstraints());

  applyEntityConstraints();
  applyThumbPreset(thumbPreset.value);
  ensureOnePagerOptions().catch(() => {});

  buildBtn.addEventListener("click", buildBrief);
  resetBtn.addEventListener("click", () => {
    venue.value = "one_on_one";
    target.value = "family_friends";
    invIdentity.value = "individual";
    knowledge.value = "plain";
    thumbPreset.value = "custom";
    thumbCustom.classList.remove("hidden");
    thumbMission.value = "1";
    thumbCompetition.value = "low";
    thumbRegulatory.value = "medium";
    localName.value = "";
    objective.value = "resolution_support";
    brief.innerHTML =
      '<p class="brief-placeholder">Configure the briefing context above, then select "Build brief."</p>';
    sourcesList.innerHTML = "";
    state.last = null;
    resetOnePagers();
    applyEntityConstraints();
    applyThumbPreset(thumbPreset.value);
  });

  target.addEventListener("change", () => {
    if (target.value === "family_friends") {
      invIdentity.value = "individual";
    } else if (invIdentity.value === "individual") {
      invIdentity.value = "public_pension";
    }
    applyEntityConstraints();
  });

  copyTextBtn.addEventListener("click", () => {
    const markdown = buildMarkdown("plain");
    if (!markdown) return;
    navigator.clipboard.writeText(markdown).then(() => {
      copyTextBtn.textContent = "Copied!";
      setTimeout(() => (copyTextBtn.textContent = "Copy Text"), 1200);
    });
  });

  downloadBriefBtn?.addEventListener("click", downloadCombinedMarkdown);
  printBtn?.addEventListener("click", () => window.print());

  fbSend?.addEventListener("click", sendFeedback);

  // Keyboard shortcut: B build (skip when typing in inputs)
  document.addEventListener("keydown", (e) => {
    if (e.target && ["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName))
      return;
    if (e.key.toLowerCase() === "b") buildBrief();
  });
})();

// Minimal embedded fallback to avoid fetch/CSP failures
window.__BDS_FALLBACK__ = {
  version: "fallback-2025-09-25-1",
  one_pagers: [
    {
      id: "jlens_board",
      title: "Divestment Financial Impact: A Balanced Assessment",
      description:
        "Board-facing summary that rebuts the $33.2B loss claim and reframes fiduciary risk.",
      path: "content/jlens_board.md",
      markdown: `
# Divestment Financial Impact: A Balanced Assessment

## The Question Before Us

Will BDS-related divestment materially harm endowment returns?

## What the Research Shows

### The JLens/ADL Analysis

- **Claim:** $33.2 billion foregone returns over 10 years
- **Method:** Excluded 38 companies from index, measured performance gap
- **Finding:** 1.8% annual underperformance (11.1% vs 12.9% returns)

### Methodological Considerations

The JLens study acknowledges that BDS targeting "changes rapidly" but applies a 2024 exclusion list to the entire 2014-2024 period. This approach, while producing a clear numerical result, may not reflect the experience of investors making decisions in real time with available information.

The study does not disclose its data sources or rebalancing methodology, making independent verification challenging. This limits our ability to assess whether the implementation tested reflects institutional best practices.

### Institutional Experience

**Norway's Sovereign Wealth Fund**

- The world's largest sovereign fund ($1.4 trillion) excludes 180+ companies
- Achieved 13.1% returns in 2024 while maintaining exclusions
- Reports tracking error of only 0.3-0.5% relative to benchmark
- Attributes +0.44% of cumulative returns to exclusion decisions

**University Implementations**

- UC System ($126B): Completed fossil fuel divestment as "financial risk management"
- Oxford: Reduced fossil fuel exposure from 8.5% to 0.6%, maintained growth
- Cambridge, Stanford, Georgetown: Implementing exclusions within risk parameters

### Academic Consensus

A review of peer-reviewed studies spanning 90 years of market data finds:

- Divestment "does not significantly impair financial performance" (Trinks & Scholtens, 2018)
- Professional optimization can reduce tracking error by 80-90% (EDHEC, 2023)
- Impact typically measured in basis points, not percentage points

## Key Insight: The JLens Implementation Would Be Malpractice

The JLens study tests an implementation with tracking error of 1.64%—roughly equal to their claimed underperformance. This suggests they modeled incompetent execution rather than professional management.

**No fiduciary could legally implement divestment this way:**

**What JLens Appears to Have Tested:**

- Remove stocks, make "no other adjustments"
- Tracking error: ~1.64% (equals their claimed loss)
- Potential cash drag: Up to 32% uninvested
- Result: Would trigger beneficiary lawsuits

**What Professional Managers Actually Do:**

- Factor-neutral optimization and rebalancing
- Tracking error: ~0.3-0.5% (Norway's actual result)
- Full investment: All proceeds immediately redeployed
- Result: Minimal performance impact

**The study cannot be replicated** because JLens won't disclose:

- Data sources
- Rebalancing methodology
- What "no other adjustments" means
- How they weighted remaining holdings

Non-replicable results are invalid in both academic and investment contexts.

## Fiduciary Considerations

As fiduciaries, boards should consider:

1. **Risk Management:** Can exclusions be implemented within acceptable tracking error limits?
2. **Professional Implementation:** Will portfolio management employ optimization techniques?
3. **Stakeholder Alignment:** How do exclusions align with institutional mission and stakeholder expectations?
4. **Performance Monitoring:** What governance ensures ongoing assessment of impact?

## Conclusion

The $33.2 billion projection is invalid because:

1. The methodology cannot be replicated or verified
2. The implementation tested would constitute fiduciary malpractice
3. The tracking error (1.64%) essentially equals the claimed underperformance

Real-world evidence from Norway ($1.4T), UC ($126B), and others demonstrates that professionally managed divestment has minimal impact when properly implemented.

**For Fiduciaries:** Any trustee considering the JLens study should demand:

- Complete methodology disclosure enabling replication
- Evidence the approach meets professional standards
- Comparison with actual institutional implementations

Until then, the study should be disregarded as non-credible advocacy rather than research.
      `.trim(),
    },
    {
      id: "jlens_technical",
      title: "Technical Review: JLens/ADL Divestment Impact Study",
      description:
        "Methodology critique for consultants and investment staff demanding replication standards.",
      path: "content/jlens_technical.md",
      markdown: `
# Technical Review: JLens/ADL Divestment Impact Study

## Executive Summary

The JLens study estimates $33.2 billion in foregone returns from BDS-related divestment. While this analysis raises important questions about fiduciary duty, several methodological limitations significantly affect the reliability of its conclusions.

## Key Methodological Concerns

### 1. Temporal Inconsistency

The study acknowledges (p. 8): *"This limitation highlights the need for ongoing monitoring and regular updates to any BDS-related company lists, as the landscape can change rapidly in response to geopolitical events, corporate actions, and evolving activist strategies."*

However, the methodology applies a static 2024 exclusion list retroactively across the entire 2014-2024 period. Several organizations cited as sources for the exclusion list were not operational during the early years of the study period:

- Don't Buy into Occupation Coalition: Formed January 2021
- OHCHR Database: First published February 2020
- Multiple company additions to boycott lists: Post-2020

This would not reflect actual investor experience.

### 2. Portfolio Construction Failures

The study states: "38 companies in the BDS Top Targets List were excluded in the VettaFi Excl. BDS Top Targets index and no other adjustments were made to the index."

This appears to indicate one or more malpractice-level errors:

- **Cash drag:** Proceeds from excluded securities (32.3% of market cap) potentially not reinvested
- **No rebalancing:** Failing to redistribute weights after removing major index constituents
- **Sector concentration:** No adjustment for removing entire sector exposures (technology, defense)
- **No optimization:** Tracking error of 1.64% annually—essentially equal to claimed underperformance
- **Static implementation:** No quarterly rebalancing despite acknowledged "rapid changes"

The study provides no transparency on:

- What "no other adjustments" means in practice
- The specific data provider for security returns
- Whether dividends were proportionally reinvested

**This lack of transparency invalidates the study's claims.** Non-replicable results have no standing in finance or academia.

### 3. Implementation Would Constitute Fiduciary Malpractice

The approach tested would expose any fiduciary to legal liability:

- **Tracking error of 1.64% annually** is itself nearly the entire claimed underperformance
- **No professional manager** would implement divestment without optimization
- **Any trustee** approving this approach would face beneficiary lawsuits
- **Any consultant** recommending this implementation would lose their license

Professional portfolio management requires:

- Factor-neutral optimization to minimize tracking error (<0.5% target)
- Sector rebalancing to maintain diversification
- Quarterly reallocation as exclusion lists evolve
- Documentation of prudent process

The JLens approach violates every principle of competent investment management.

## Empirical Context

### Institutional Evidence

**Norway's Government Pension Fund Global (GPFG)**

- Assets: $1.4 trillion
- Exclusions: 180+ companies
- Tracking error: 0.3-0.5%
- Cumulative impact: +0.44% (positive contribution from exclusions)

**University of California System**

- Assets: $126 billion
- Action: Complete fossil fuel divestment (May 2020)
- Rationale: "Financial risk management decision"
- Outcome: Objectives met without performance degradation

### Academic Literature

Multiple peer-reviewed studies provide context:

- **Trinks & Scholtens (2018):** Analysis of 1927-2016 data finds divestment "does not significantly impair financial performance"
- **Plantinga & Scholtens (2021):** 40-year study finds differences of "a few basis points"
- **EDHEC (2023):** Professional optimization reduces tracking error by 80-90%

## Technical Observations

### Concentration Risk

The excluded companies represent 32.3% of index market capitalization, heavily concentrated in technology sector leaders that drove 2014-2024 performance. This concentration in recently outperforming securities during a specific market regime raises questions about:

- Sample period dependency
- Generalizability to other time periods
- Mean reversion possibilities

### Benchmark Selection

The use of VettaFi US Equity Large-Cap 500 Index rather than S&P 500 introduces:

- Additional tracking variance
- Reduced comparability with institutional benchmarks
- Challenges in independent verification

## Constructive Considerations

1. **Point-in-Time Analysis:** Future research could benefit from using exclusion lists as they existed at each historical point, reflecting actual investor information sets.

2. **Multiple Implementation Scenarios:** Comparing naive exclusion with professionally optimized approaches would provide a range of potential outcomes.

3. **Transparency Enhancement:** Providing full methodological details would enable replication and strengthen confidence in findings.

4. **Risk-Adjusted Metrics:** Including Sharpe ratios, information ratios, and tracking error analysis would contextualize absolute return differences.

## Conclusion

The JLens study's $33.2 billion estimate is invalid due to:

1. **Fundamental non-replicability:** Without disclosing data sources, rebalancing methodology, or calculation details, this claim cannot be verified by any third party. In academic or investment contexts, non-replicable results are considered void.

2. **Implementation that would constitute malpractice:** The approach tested—with tracking error of 1.64% annually (roughly equal to the claimed underperformance)—would expose any fiduciary to legal liability.

The study provides several possible explanations for its extreme results, none defensible:

- Made "no other adjustments" after removing one-third of market cap
- Used no sector rebalancing after removing concentrated positions
- Applied no optimization to minimize tracking error
- Failed to reinvest proceeds from divested securities
- Ignored quarterly rebalancing standards

Any of these approaches would constitute professional negligence.

## Minimum Standards for Credible Analysis

Future analysis of divestment impacts should not be considered without:

- **Point-in-time exclusion lists** reflecting realistic investor experience
- **Full methodological transparency** enabling independent replication
- **Multiple implementation scenarios** from naive to professionally optimized
- **Multi-period analysis** avoiding cherry-picked market regimes

Without these elements, studies should be recognized as advocacy documents rather than research.

---

*This analysis is provided to support evidence-based policy discussion. Ethical Capital welcomes any attempt by JLens to provide the transparency necessary for replication.*
      `.trim(),
    },
  ],
  openers: {
    generic:
      "We can align investments with basic human rights using professional, benchmark-aware implementation. Large institutions already use narrowly scoped exclusions while maintaining diversification and risk controls.",
  },
  identity_openers: {
    individual: {
      one_on_one:
        "For friends or family, emphasize aligning personal savings with shared values and keep the steps concrete and jargon-free.",
      generic:
        "Individuals can align personal or household savings with values using low-cost screened funds while keeping diversification and emergency reserves intact.",
    },
    swf: {
      generic:
        "A sovereign fund can implement conduct-based exclusions via a formal ethics process, public rationales, and factor-neutral optimization with explicit tracking-error budgets.",
    },
    public_pension: {
      generic:
        "Public plans can use consultant/manager mandates, set a tracking-error guardrail, and phase implementation while keeping beneficiaries’ risk/return in focus.",
    },
    corporate_pension: {
      generic:
        "Corporate plans can update the IPS, adopt a screened index or constraints with minimal overhead, and maintain de-risking alignment.",
    },
    endowment: {
      generic:
        "Endowments can align with mission through a committee process, publish rationales, and maintain prudent risk controls.",
    },
    foundation: {
      generic:
        "Foundations can align programs and portfolios, reduce reputational risk through clear criteria, and use simplified implementation paths.",
    },
    insurance: {
      generic:
        "Insurance portfolios can adopt narrow conduct screens consistent with ALM and capital/rating constraints, emphasizing best-efforts and risk integrity.",
    },
    central_bank: {
      generic:
        "Official institutions can clarify mandate limits, apply best‑efforts exclusions, and provide transparent rationales and constraints.",
    },
    government: {
      generic:
        "Government investors (city/county/state) can apply issuer screens/approved lists for bonds, observe procurement/governance limits, and report with best‑efforts language.",
    },
  },
  identity_guides: {
    individual: {
      ask: "Align personal or household savings with stated values and explain the exclusions in plain language.",
      implementation:
        "Use low-cost screened ETFs or managed accounts; document which companies are excluded and why.",
      reporting:
        "Keep a simple holdings list and revisit annually or after major portfolio changes.",
      risk: "Maintain emergency funds, diversification, and low fees while applying exclusions.",
    },
    public_pension: {
      ask: "Consultant memo and manager mandates for conduct-based exclusions; define guardrails.",
      implementation:
        "Passive screened index or benchmark‑aware constraints; phased divestment to minimize costs; maintain diversification.",
      reporting:
        "Quarterly one‑page dashboard; publish criteria and exclusion list.",
      risk: "Tracking‑error limit (e.g., ≤30 bps) and factor neutrality by vendor.",
    },
  },
  key_points: [
    {
      title: "Professional exclusions maintain benchmark-like performance",
      body: "Large public funds implement conduct-based exclusions and continue to deliver returns close to their benchmarks by rebalancing and preserving factor exposures.",
      citations: [
        {
          label: "NBIM Responsible Investment",
          url: "https://www.nbim.no/en/responsibility/",
        },
      ],
    },
    {
      title: "Tracking error and factor neutrality",
      body: "Exclusions can be implemented with explicit tracking-error budgets and factor controls so the portfolio stays close to its benchmark while meeting policy goals.",
      citations: [
        {
          label: "MSCI ESG Index Construction",
          url: "https://www.msci.com/our-solutions/indexes/esg-indexes",
        },
      ],
    },
    {
      title: "Fiduciary duty and values alignment",
      body: "Modern fiduciary guidance recognizes that material ESG risks and client objectives can be incorporated without abandoning prudent, return-seeking management.",
      citations: [
        {
          label: "UN PRI: Fiduciary Duty",
          url: "https://www.unpri.org/fiduciary-duty",
        },
      ],
    },
  ],
  counters: [
    {
      claim:
        "Divestment will significantly hurt performance and beneficiaries.",
      response:
        "Naive exclusions can be costly, but professional managers use optimization and tracking-error limits to preserve factor exposures and benchmark-like returns.",
      citations: [
        {
          label: "MSCI ESG Index Construction",
          url: "https://www.msci.com/our-solutions/indexes/esg-indexes",
        },
      ],
    },
    {
      claim: "Exclusions violate fiduciary duty.",
      response:
        "Fiduciary duty requires prudence, loyalty, and attention to material risk and client objectives. Values alignment and risk management can be implemented within a disciplined, return-seeking mandate.",
      citations: [
        {
          label: "UN PRI: Fiduciary Duty",
          url: "https://www.unpri.org/fiduciary-duty",
        },
      ],
    },
  ],
  screening_knowledge: {
    title: "Screening as Cumulative Knowledge",
    points: [
      {
        title: "Identify business model fragility",
        body: "Systematic exclusions focus attention on issuers with hidden tail risks and controversy exposure.",
        citations: [
          { label: "AFSC Investigate", url: "https://investigate.afsc.org/" },
        ],
      },
      {
        title: "Knowledge compounds",
        body: "Each exclusion deepens understanding of supply chains, regulatory exposure, and controversy patterns.",
      },
      {
        title: "Integration cadence",
        body: "Treat credible database updates as investment intelligence; aim to integrate within 30 days with documented rationale.",
        citations: [
          { label: "AFSC Investigate", url: "https://investigate.afsc.org/" },
        ],
      },
    ],
  },
  model_resolution:
    "RESOLVED: That the {localName} shall adopt a conduct-based investment exclusion policy... ",
  next_steps: [
    "Request current holdings/exposure report from managers.",
    "Adopt written conduct criteria and escalation process.",
  ],
  sources: [
    {
      label: "NBIM Responsible Investment",
      url: "https://www.nbim.no/en/responsibility/",
    },
    {
      label: "UN PRI: Fiduciary Duty",
      url: "https://www.unpri.org/fiduciary-duty",
    },
    {
      label: "MSCI: ESG Indexes & Methodology",
      url: "https://www.msci.com/our-solutions/indexes/esg-indexes",
    },
  ],
  further_reading: [
    {
      label: "SSRN: Investor Identity (4324537)",
      url: "https://papers.ssrn.com/sol3/papers.cfm?abstract_id=4324537",
    },
    {
      label: "CFA Institute: Seven Kinds of Asset Owner Institutions",
      url: "https://blogs.cfainstitute.org/investor/2018/02/20/the-seven-kinds-of-asset-owner-institutions/",
    },
    {
      label: "What I’d Tell Your CIO about Divestment",
      url: "https://ethicic.com/content/research/what-id-tell-your-cio-about-divestment",
    },
  ],
  cio_note:
    "Specify a tracking‑error budget, maintain factor neutrality, use screened indexes or constraints, and phase trades to avoid divestment shocks.",
  cio_links: [
    {
      label: "CIO Letter (Ethical Capital)",
      url: "https://ethicic.com/content/research/what-id-tell-your-cio-about-divestment",
    },
  ],
};
