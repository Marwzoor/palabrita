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
        description: 'Swedish translation(s) for the lemma. For nouns, ALWAYS include the article (en/ett) before the noun. Use comma-space for closely related meanings (e.g., "till, på"). Use slash-with-spaces for distinct alternatives (e.g., "redan / nu"). Limit to 1-3 most common meanings. NO parenthetical explanations.',
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
          '- For conjugated verb lemmas that encode a specific subject (like "he", "puedo", "quiero"), include the Swedish subject pronoun directly with the verb WITHOUT parentheses (e.g., "jag har", "jag kan", "du är", "han/hon har"). For ambiguous forms that could have multiple subjects, use "han/hon" or other appropriate combinations.',
          '- For infinitive verb lemmas (like "ser", "hacer"), provide the Swedish infinitive form without pronouns (e.g., "vara", "göra", "att vara").',
          '- For noun translations, ALWAYS include the appropriate Swedish article (en/ett) with the noun (e.g., "en hund", "ett hus"). Swedish uses "en" (common gender, ~75% of nouns) and "ett" (neuter gender, ~25% of nouns). There is NO direct mapping from Spanish un/una to Swedish en/ett—each Swedish noun has its own grammatical gender that must be used correctly.',
          '- NEVER include parenthetical grammatical explanations in translations (e.g., avoid "den (bestämd artikel)" - just use "den"). Keep translations clean and concise.',
          '- Use comma-space (", ") to separate closely related meanings (e.g., "till, på, i"). Use slash-with-spaces (" / ") to separate distinct alternative meanings (e.g., "redan / nu").',
          '- Limit translations to the 1-3 most common meanings to avoid overwhelming learners.',
          '- Choose Swedish example sentences that clearly demonstrate the correct article usage (en/ett) for nouns to help learners understand Swedish grammatical gender.',
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
