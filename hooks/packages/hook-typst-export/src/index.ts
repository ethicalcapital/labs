// Typst compilation will be handled by external service or Wasm
// import { PDFDocument, StandardFonts, rgb, PDFFont } from "pdf-lib";
// import { marked } from "marked";

interface ExportRequest {
  title: string;
  markdown: string;
  author?: string;
  metadata?: Record<string, string>;
}

const DISCLAIMER =
  "Ethical Capital Labs shares experimental tools for learning. These materials illustrate hypothetical scenarios and institutional framing, but they are not individualized advice, performance guarantees, or recommendations to buy or sell any security. Consult qualified professionals before acting on any outputs.";

const BRAND_PURPLE = rgb(0x58 / 255, 0x1c / 255, 0x87 / 255);
const TEXT_COLOR = rgb(0x25 / 255, 0x2f / 255, 0x3f / 255);
const LIGHT_TEXT = rgb(0x55 / 255, 0x63 / 255, 0x7a / 255);

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "GET") {
      return json(buildHealth(env.SERVICE_NAME ?? "hook-typst-export"));
    }

    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405);
    }

    // Authentication check
    const authResult = validateAuth(request, env);
    if (authResult) {
      return authResult;
    }

    let payload: ExportRequest;
    try {
      payload = (await request.json()) as ExportRequest;
    } catch (error) {
      console.error("labs-export: invalid JSON", error);
      return json({ error: "Invalid JSON body" }, 400);
    }

    const validation = validate(payload);
    if (validation) {
      return validation;
    }

    try {
      const pdfBytes = await buildPdf(payload);
      const body = new Uint8Array(pdfBytes);
      const filename = `${sanitizeFilename(payload.title)}.pdf`;
      return new Response(body as unknown as BodyInit, {
        status: 200,
        headers: {
          "content-type": "application/pdf",
          "content-disposition": `inline; filename="${filename}"`,
          "cache-control": "no-store",
        },
      });
    } catch (error) {
      console.error("labs-export: pdf generation failed", error);
      return json({ error: "Failed to generate PDF" }, 500);
    }
  },
};

async function buildPdf(payload: ExportRequest): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const context: PdfContext = {
    doc: pdfDoc,
    currentPage: pdfDoc.addPage([612, 792]),
    cursorY: 792 - 54,
    regularFont,
    boldFont,
    margin: 54,
  };

  drawHeading(context, payload.title);
  if (payload.author) {
    drawParagraph(context, payload.author, { italic: true, color: LIGHT_TEXT });
    context.cursorY -= 8;
  }

  const blocks = tokenizeMarkdown(payload.markdown);
  for (const block of blocks) {
    if (block.type === "heading") {
      drawHeading(context, block.text, 18);
    } else if (block.type === "list") {
      drawList(context, block.items);
    } else {
      drawParagraph(context, block.text);
    }
  }

  if (payload.metadata && Object.keys(payload.metadata).length) {
    drawHeading(context, "Context", 16);
    for (const [key, value] of Object.entries(payload.metadata)) {
      drawParagraph(context, `${key}: ${value}`);
    }
  }

  context.cursorY -= 12;
  drawHeading(context, "Disclaimer", 16);
  drawParagraph(context, DISCLAIMER, { size: 10, color: LIGHT_TEXT });

  return pdfDoc.save();
}

interface PdfContext {
  doc: PDFDocument;
  currentPage: any;
  cursorY: number;
  regularFont: PDFFont;
  boldFont: PDFFont;
  margin: number;
}

function drawHeading(context: PdfContext, text: string, size = 20) {
  context.cursorY = ensureSpace(context, size + 20);
  const lines = wrapText(text.toUpperCase(), context.boldFont, size, usableWidth(context));
  for (const line of lines) {
    context.currentPage.drawText(line, {
      x: context.margin,
      y: context.cursorY,
      size,
      font: context.boldFont,
      color: BRAND_PURPLE,
    });
    context.cursorY -= size + 4;
  }
  context.cursorY -= 8;
}

function drawParagraph(
  context: PdfContext,
  text: string,
  options: { italic?: boolean; color?: ReturnType<typeof rgb>; size?: number } = {},
) {
  const size = options.size ?? 12;
  const font = options.italic ? context.regularFont : context.regularFont;
  const color = options.color ?? TEXT_COLOR;
  const lines = wrapText(text, font, size, usableWidth(context));

  for (const line of lines) {
    context.cursorY = ensureSpace(context, size + 16);
    context.currentPage.drawText(line, {
      x: context.margin,
      y: context.cursorY,
      size,
      font,
      color,
    });
    context.cursorY -= size + 4;
  }
  context.cursorY -= 6;
}

function drawList(context: PdfContext, items: string[]) {
  const size = 12;
  const width = usableWidth(context) - 16;
  for (const item of items) {
    const lines = wrapText(item, context.regularFont, size, width);
    lines.forEach((line, index) => {
      context.cursorY = ensureSpace(context, size + 16);
      const prefix = index === 0 ? "• " : "  ";
      context.currentPage.drawText(prefix + line, {
        x: context.margin + 12,
        y: context.cursorY,
        size,
        font: context.regularFont,
        color: TEXT_COLOR,
      });
      context.cursorY -= size + 4;
    });
    context.cursorY -= 6;
  }
}

function ensureSpace(context: PdfContext, required: number): number {
  if (context.cursorY - required < context.margin) {
    context.currentPage = context.doc.addPage([612, 792]);
    context.cursorY = 792 - context.margin;
  }
  return context.cursorY;
}

function usableWidth(context: PdfContext): number {
  return context.currentPage.getWidth() - context.margin * 2;
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  words.forEach((word) => {
    const tentative = current ? `${current} ${word}` : word;
    const width = font.widthOfTextAtSize(tentative, size);
    if (width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = tentative;
    }
  });

  if (current) {
    lines.push(current);
  }

  return lines.length ? lines : [""];
}

function tokenizeMarkdown(markdown: string) {
  const tokens = marked.lexer(markdown);
  const blocks: Array<
    | { type: "heading"; text: string }
    | { type: "paragraph"; text: string }
    | { type: "list"; items: string[] }
  > = [];

  tokens.forEach((token) => {
    if (token.type === "heading" && token.depth <= 3) {
      blocks.push({ type: "heading", text: token.text });
    } else if (token.type === "paragraph") {
      blocks.push({ type: "paragraph", text: token.text });
    } else if (token.type === "list" && Array.isArray(token.items)) {
      blocks.push({ type: "list", items: token.items.map((item) => item.text) });
    }
  });

  return blocks;
}

function sanitizeFilename(value: string): string {
  return value.replace(/[^a-z0-9\-]+/gi, "-").replace(/^-+|-+$|(?<=-)-+/g, "-") || "export";
}

function validate(payload: ExportRequest): Response | null {
  if (!payload || typeof payload !== "object") {
    return json({ error: "Payload must be an object" }, 400);
  }

  if (!payload.title || typeof payload.title !== "string") {
    return json({ error: "title is required" }, 400);
  }

  if (!payload.markdown || typeof payload.markdown !== "string") {
    return json({ error: "markdown is required" }, 400);
  }

  return null;
}

function buildHealth(service: string) {
  return {
    ok: true,
    service,
    timestamp: new Date().toISOString(),
  };
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function validateAuth(request: Request, env: Env): Response | null {
  // 1. Check for bearer token
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn('Missing or invalid authorization header');
    return json({ error: 'Missing authorization' }, 401);
  }

  const token = authHeader.slice(7).trim();
  if (!env.TYPST_EXPORT_TOKEN || token !== env.TYPST_EXPORT_TOKEN) {
    console.warn('Invalid token provided');
    return json({ error: 'Invalid authorization' }, 403);
  }

  // 2. Check user agent to ensure it's from authorized sources
  const userAgent = request.headers.get('user-agent') || '';
  const requestSource = request.headers.get('x-request-source') || '';

  const allowedSources = env.ALLOWED_SOURCES?.split(',') || [
    'dryvestment-app',
    'labs-pdf-api'
  ];

  const isValidSource = allowedSources.some(source =>
    userAgent.includes(source) || requestSource.includes(source)
  );

  if (!isValidSource) {
    console.warn('Unauthorized source:', { userAgent, requestSource });
    return json({ error: 'Unauthorized source' }, 403);
  }

  return null; // Auth passed
}

declare global {
  interface Env {
    SERVICE_NAME: string;
    TYPST_EXPORT_TOKEN: string;
    ALLOWED_SOURCES?: string;
  }
}
