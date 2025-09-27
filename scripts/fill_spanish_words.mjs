import { createReadStream } from 'node:fs';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

import { requestJsonResponse } from './lib/openai_client.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WORD_LIST_PATH = path.resolve(__dirname, '..', 'data', 'common_spanish_words_50k.txt');
const OUTPUT_PATH = path.resolve(__dirname, '..', 'data', 'spanish_words.json');

const LIMIT = (() => {
  const limitFlag = process.argv.find(arg => arg.startsWith('--limit='));
  if (!limitFlag) return null;
  const parsed = Number.parseInt(limitFlag.split('=')[1], 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
})();

const GENERATION_SCHEMA = {
  name: 'SpanishSwedishEntry',
  schema: {
    type: 'object',
    required: ['translation', 'sentence_es', 'sentence_sv'],
    properties: {
      translation: {
        type: 'string',
        description: 'Swedish translation(s) for the lemma. Prefer comma-separated alternatives when needed.',
      },
      sentence_es: {
        type: 'string',
        description: 'Natural Spanish sentence that includes the exact lemma with correct accents.',
      },
      sentence_sv: {
        type: 'string',
        description: 'Accurate Swedish translation of the provided Spanish sentence.',
      },
    },
  },
};

const existingEntries = await readExistingEntries();
const existingWordSet = new Set(existingEntries.map(entry => entry.word));

const reader = readline.createInterface({
  input: createReadStream(WORD_LIST_PATH, { encoding: 'utf8' }),
  crlfDelay: Infinity,
});

let addedCount = 0;
for await (const line of reader) {
  const [rawWord] = line.trim().split(/\s+/);
  if (!rawWord) continue;

  const word = rawWord.normalize('NFC');
  if (existingWordSet.has(word)) {
    continue;
  }

  const generated = await generateEntry(word);
  const entry = {
    word,
    translation: cleanOneLine(generated.translation),
    sentence_es: cleanOneLine(generated.sentence_es),
    sentence_sv: cleanOneLine(generated.sentence_sv),
  };

  existingEntries.push(entry);
  existingWordSet.add(word);

  await writeEntries(existingEntries);
  addedCount += 1;
  console.log(`Added entry for "${word}" (${addedCount} new total).`);

  if (LIMIT && addedCount >= LIMIT) {
    break;
  }
}

if (addedCount === 0) {
  console.log('No new words were added.');
} else {
  console.log(`Finished processing. Added ${addedCount} word${addedCount === 1 ? '' : 's'}.`);
}

async function generateEntry(word) {
  const result = await requestJsonResponse({
    messages: [
      {
        role: 'system',
        content: 'You are an expert bilingual lexicographer. Produce accurate Swedish equivalents for Spanish lemmas. Respect accents and diacritics in both languages.',
      },
      {
        role: 'user',
        content: [
          'For the given Spanish lemma, provide a trustworthy Swedish translation and paired example sentences.',
          '',
          'Requirements:',
          '- Pay heightened attention to Spanish accent marks—never replace accented vowels with their unaccented counterparts.',
          '- Return well-formed Spanish and Swedish sentences that are literal translations of each other.',
          '- The Spanish sentence must contain the lemma exactly as provided (including accents).',
          '- Keep responses concise (max ~25 words per sentence).',
          '- Output must be valid UTF-8.',
          '',
          `Spanish lemma: ${word}`,
        ].join('\n'),
      },
    ],
    schema: GENERATION_SCHEMA,
    temperature: 0.1,
    maxOutputTokens: 600,
  });

  return result;
}

async function readExistingEntries() {
  try {
    const raw = await fs.readFile(OUTPUT_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    console.warn('Unexpected JSON structure in spanish_words.json. Starting with an empty array.');
    return [];
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('No existing spanish_words.json found. Starting from scratch.');
      return [];
    }
    throw error;
  }
}

async function writeEntries(entries) {
  const data = JSON.stringify(entries, null, 2);
  await fs.writeFile(OUTPUT_PATH, `${data}\n`, 'utf8');
}

function cleanOneLine(text) {
  return text.replace(/\s+/g, ' ').trim();
}
