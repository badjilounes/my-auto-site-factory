import Anthropic from '@anthropic-ai/sdk';
import { buildSystemPrompt, buildUserPrompt, detectTemplate } from './templates';
import { buildPreviewHtml } from './preview';
import type {
  ProspectData,
  GenerationOptions,
  GenerationResult,
  ProgressEvent,
} from './types';

const DEFAULT_MODEL = 'claude-sonnet-4-20250514';
const DEFAULT_MAX_TOKENS = 16384;

let anthropicClient: Anthropic | null = null;

function getClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env['ANTHROPIC_API_KEY'];
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }
    anthropicClient = new Anthropic({ apiKey });
  }
  return anthropicClient;
}

/**
 * Generate a complete showcase website (vitrine) for a prospect.
 *
 * Uses Claude to generate a full Next.js 15 + Tailwind project from the
 * prospect's data. The template is auto-detected from cuisineType or
 * can be overridden via options.
 *
 * Returns a Record<filePath, fileContent> ready to be pushed to GitHub,
 * plus a previewHtml for iframe display in the admin dashboard.
 *
 * @example
 * ```ts
 * const result = await generateVitrineSite({
 *   businessName: 'Pizza Napoli',
 *   city: 'Paris',
 *   cuisineType: 'Pizza italienne',
 *   phone: '01 42 33 44 55',
 *   address: '12 rue de Rivoli, 75001 Paris',
 * });
 *
 * // result.files['app/page.tsx'] → full Next.js page component
 * // result.previewHtml → standalone HTML for iframe preview
 * // result.tokensUsed → 12345
 * ```
 */
export async function generateVitrineSite(
  prospect: ProspectData,
  options?: GenerationOptions,
): Promise<GenerationResult> {
  const client = getClient();
  const template = options?.template ?? detectTemplate(prospect);
  const maxTokens = options?.maxTokens ?? DEFAULT_MAX_TOKENS;
  const model = options?.model ?? DEFAULT_MODEL;
  const onProgress = options?.onProgress;

  const systemPrompt = buildSystemPrompt(template);
  const userPrompt = buildUserPrompt(prospect, {
    primaryColor: options?.primaryColor,
    extraInstructions: options?.extraInstructions,
  });

  emitProgress(onProgress, { type: 'start', message: `Génération du site (template: ${template})...` });

  let responseText: string;
  let tokensUsed: number;

  if (onProgress) {
    // ── Streaming mode: report progress as tokens arrive
    const result = await streamGeneration(client, model, maxTokens, systemPrompt, userPrompt, onProgress);
    responseText = result.text;
    tokensUsed = result.tokensUsed;
  } else {
    // ── Batch mode: simpler, single request
    const result = await batchGeneration(client, model, maxTokens, systemPrompt, userPrompt);
    responseText = result.text;
    tokensUsed = result.tokensUsed;
  }

  emitProgress(onProgress, { type: 'parsing', message: 'Parsing du code généré...' });

  // Parse the response into files
  const files = parseGeneratedFiles(responseText);

  // Validate we got the minimum required files
  validateFiles(files);

  // Build preview HTML
  const previewHtml = buildPreviewHtml(files, prospect);

  emitProgress(onProgress, {
    type: 'done',
    tokensUsed,
    filesGenerated: Object.keys(files).length,
    message: `${Object.keys(files).length} fichiers générés (${tokensUsed} tokens)`,
  });

  return { files, previewHtml, tokensUsed, template };
}

// ── Streaming generation ─────────────────────────────────────────────────────

async function streamGeneration(
  client: Anthropic,
  model: string,
  maxTokens: number,
  systemPrompt: string,
  userPrompt: string,
  onProgress: (event: ProgressEvent) => void,
): Promise<{ text: string; tokensUsed: number }> {
  const stream = client.messages.stream({
    model,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  let text = '';
  let lastProgressAt = 0;

  stream.on('text', (chunk) => {
    text += chunk;

    // Throttle progress events to every ~500 chars
    if (text.length - lastProgressAt > 500) {
      lastProgressAt = text.length;
      emitProgress(onProgress, {
        type: 'generating',
        message: `Génération en cours... (${Math.round(text.length / 1000)}k caractères)`,
      });
    }
  });

  const finalMessage = await stream.finalMessage();

  const tokensUsed =
    (finalMessage.usage?.input_tokens ?? 0) + (finalMessage.usage?.output_tokens ?? 0);

  // If the response was truncated (hit max_tokens), attempt a continuation
  if (finalMessage.stop_reason === 'max_tokens') {
    const continuation = await continueGeneration(
      client,
      model,
      maxTokens,
      systemPrompt,
      userPrompt,
      text,
    );
    text += continuation.text;
    return { text, tokensUsed: tokensUsed + continuation.tokensUsed };
  }

  return { text, tokensUsed };
}

// ── Batch generation ─────────────────────────────────────────────────────────

async function batchGeneration(
  client: Anthropic,
  model: string,
  maxTokens: number,
  systemPrompt: string,
  userPrompt: string,
): Promise<{ text: string; tokensUsed: number }> {
  const message = await client.messages.create({
    model,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const textBlock = message.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Pas de réponse textuelle de Claude');
  }

  let text = textBlock.text;
  const tokensUsed =
    (message.usage?.input_tokens ?? 0) + (message.usage?.output_tokens ?? 0);

  // Handle truncation
  if (message.stop_reason === 'max_tokens') {
    const continuation = await continueGeneration(
      client,
      model,
      maxTokens,
      systemPrompt,
      userPrompt,
      text,
    );
    text += continuation.text;
    return { text, tokensUsed: tokensUsed + continuation.tokensUsed };
  }

  return { text, tokensUsed };
}

// ── Continuation for truncated responses ─────────────────────────────────────

async function continueGeneration(
  client: Anthropic,
  model: string,
  maxTokens: number,
  systemPrompt: string,
  userPrompt: string,
  partialResponse: string,
): Promise<{ text: string; tokensUsed: number }> {
  // Ask Claude to continue from where it left off
  const message = await client.messages.create({
    model,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [
      { role: 'user', content: userPrompt },
      { role: 'assistant', content: partialResponse },
      {
        role: 'user',
        content:
          'Ta réponse a été tronquée. Continue EXACTEMENT là où tu t\'es arrêté (ne répète rien, continue le JSON).',
      },
    ],
  });

  const textBlock = message.content.find((b) => b.type === 'text');
  const text = textBlock?.type === 'text' ? textBlock.text : '';
  const tokensUsed =
    (message.usage?.input_tokens ?? 0) + (message.usage?.output_tokens ?? 0);

  return { text, tokensUsed };
}

// ── Response parsing ─────────────────────────────────────────────────────────

/**
 * Parse Claude's response into a file map.
 * Handles various response formats:
 * 1. Clean JSON object { files: { ... } }
 * 2. JSON wrapped in markdown code fences
 * 3. JSON array of { path, content } objects (legacy format)
 */
function parseGeneratedFiles(raw: string): Record<string, string> {
  const text = raw.trim();

  // Strategy 1: Try parsing as-is
  const direct = tryParseJson(text);
  if (direct) return direct;

  // Strategy 2: Extract from markdown code fences
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    const fenced = tryParseJson(fenceMatch[1].trim());
    if (fenced) return fenced;
  }

  // Strategy 3: Find the first { and last } (or [ and ]) and try parsing that
  const jsonStart = text.indexOf('{');
  const jsonEnd = text.lastIndexOf('}');
  if (jsonStart !== -1 && jsonEnd > jsonStart) {
    const extracted = tryParseJson(text.slice(jsonStart, jsonEnd + 1));
    if (extracted) return extracted;
  }

  // Strategy 4: Try array format
  const arrStart = text.indexOf('[');
  const arrEnd = text.lastIndexOf(']');
  if (arrStart !== -1 && arrEnd > arrStart) {
    const extracted = tryParseJson(text.slice(arrStart, arrEnd + 1));
    if (extracted) return extracted;
  }

  // Strategy 5: Fix truncated JSON (missing closing braces)
  const fixedText = fixTruncatedJson(text);
  const fixed = tryParseJson(fixedText);
  if (fixed) return fixed;

  throw new Error(
    `Impossible de parser la réponse de Claude. Début de la réponse: "${text.slice(0, 200)}..."`,
  );
}

function tryParseJson(text: string): Record<string, string> | null {
  try {
    const parsed = JSON.parse(text);

    // Format: { files: { "path": "content", ... } }
    if (parsed && typeof parsed === 'object' && parsed.files && typeof parsed.files === 'object') {
      return parsed.files as Record<string, string>;
    }

    // Format: { "path": "content", ... } (just the files directly)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      // Check if values are strings (file contents)
      const entries = Object.entries(parsed);
      if (entries.length > 0 && entries.every(([, v]) => typeof v === 'string')) {
        return parsed as Record<string, string>;
      }
    }

    // Format: [{ path: "...", content: "..." }, ...]
    if (Array.isArray(parsed)) {
      const files: Record<string, string> = {};
      for (const item of parsed) {
        if (typeof item.path === 'string' && typeof item.content === 'string') {
          files[item.path] = item.content;
        }
      }
      if (Object.keys(files).length > 0) return files;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Attempt to fix truncated JSON by adding missing closing braces/brackets.
 */
function fixTruncatedJson(text: string): string {
  let fixed = text.trim();

  // Remove trailing comma if present
  fixed = fixed.replace(/,\s*$/, '');

  // Count open vs close braces/brackets
  let braces = 0;
  let brackets = 0;
  let inString = false;
  let escape = false;

  for (const char of fixed) {
    if (escape) {
      escape = false;
      continue;
    }
    if (char === '\\') {
      escape = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (char === '{') braces++;
    if (char === '}') braces--;
    if (char === '[') brackets++;
    if (char === ']') brackets--;
  }

  // If we're inside an unclosed string, close it
  if (inString) {
    fixed += '"';
  }

  // Close missing braces/brackets
  while (brackets > 0) {
    fixed += ']';
    brackets--;
  }
  while (braces > 0) {
    fixed += '}';
    braces--;
  }

  return fixed;
}

// ── Validation ───────────────────────────────────────────────────────────────

const REQUIRED_FILES = [
  'package.json',
  'app/layout.tsx',
  'app/page.tsx',
];

function validateFiles(files: Record<string, string>): void {
  const paths = Object.keys(files);

  for (const required of REQUIRED_FILES) {
    if (!paths.some((p) => p === required || p.endsWith(`/${required}`))) {
      throw new Error(`Fichier requis manquant dans la génération: ${required}`);
    }
  }

  // Ensure files have actual content (not empty strings)
  for (const [path, content] of Object.entries(files)) {
    if (!content || content.trim().length < 10) {
      throw new Error(`Fichier généré vide ou trop court: ${path}`);
    }
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function emitProgress(
  onProgress: ((event: ProgressEvent) => void) | undefined,
  event: ProgressEvent,
): void {
  if (onProgress) {
    try {
      onProgress(event);
    } catch {
      // Don't let progress callback errors crash the generation
    }
  }
}
