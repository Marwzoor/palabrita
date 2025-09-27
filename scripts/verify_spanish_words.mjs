import { promises as fs } from 'node:fs';
import path from 'node:path';
import { stdin as input, stdout as output } from 'node:process';
import readline from 'node:readline/promises';
import { fileURLToPath } from 'node:url';

import { requestJsonResponse } from './lib/openai_client.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WORD_DATA_PATH = path.resolve(__dirname, '..', 'data', 'spanish_words.json');
const TEMP_DIR = path.resolve(__dirname, '..', '.tmp');
const PROGRESS_PATH = path.resolve(TEMP_DIR, 'verification_progress.json');
const ISSUES_PATH = path.resolve(__dirname, '..', 'data', 'verification_issues.json');

const RATE_LIMIT_DELAY_MS = Number(process.env.OPENAI_REQUEST_DELAY_MS ?? 0);

const VERIFICATION_SCHEMA = {
  name: 'SpanishSwedishVerification',
  schema: {
    type: 'object',
    required: [
      'translation_correct',
      'sentence_correct',
      'translation_feedback',
      'sentence_feedback',
      'severity',
      'suggested_translation',
      'suggested_sentence_sv',
      'notes',
    ],
    properties: {
      translation_correct: { type: 'boolean' },
      sentence_correct: { type: 'boolean' },
      severity: { type: 'string', enum: ['ok', 'minor', 'major'] },
      translation_feedback: { type: 'string' },
      sentence_feedback: { type: 'string' },
      suggested_translation: { type: ['string', 'null'], description: 'Suggested Swedish translation if corrections are needed.' },
      suggested_sentence_sv: { type: ['string', 'null'], description: 'Suggested Swedish sentence aligned with the Spanish sentence.' },
      notes: { type: ['string', 'null'] },
    },
  },
};

const entries = await readEntries();

if (entries.length === 0) {
  console.log('No entries found in spanish_words.json. Nothing to verify.');
  process.exit(0);
}

const rl = readline.createInterface({ input, output });

const startIndex = await readProgress();

console.log(`Verifying ${entries.length - startIndex} entries (starting at index ${startIndex}).`);

const issues = [];

for (let index = startIndex; index < entries.length; index += 1) {
  const entry = entries[index];
  console.log(`Checking "${entry.word}" (#${index + 1}/${entries.length})...`);

  try {
    const analysis = await analyzeEntry(entry);

    let translationFixed = false;

    if (!analysis.translation_correct) {
      console.warn(`  Translation flagged: ${analysis.translation_feedback}`);
      translationFixed = await promptTranslationResolution(entry, analysis);

      if (!translationFixed) {
        issues.push({
          type: 'translation',
          index,
          word: entry.word,
          translation: entry.translation,
          feedback: analysis.translation_feedback,
          suggested_translation: analysis.suggested_translation,
          severity: analysis.severity,
        });
      }
    }

    if (!analysis.sentence_correct) {
      issues.push({
        type: 'sentence',
        index,
        word: entry.word,
        spanish_sentence: entry.sentence_es,
        swedish_sentence: entry.sentence_sv,
        feedback: analysis.sentence_feedback,
        suggested_sentence_sv: analysis.suggested_sentence_sv,
        severity: analysis.severity,
      });
      console.warn(`  Sentence flagged: ${analysis.sentence_feedback}`);
    }

    if ((analysis.translation_correct || translationFixed) && analysis.sentence_correct) {
      console.log('  Entry looks good.');
    }

    if (analysis.notes) {
      console.log(`  Notes: ${analysis.notes}`);
    }
  } catch (error) {
    issues.push({
      type: 'verification-error',
      index,
      word: entry.word,
      message: error.message,
    });
    console.error(`  Error verifying "${entry.word}": ${error.message}`);
  }

  await writeProgress(index + 1);

  if (RATE_LIMIT_DELAY_MS > 0) {
    await delay(RATE_LIMIT_DELAY_MS);
  }
}

await rl.close();

if (issues.length > 0) {
  console.log(`Verification completed with ${issues.length} potential issue(s). Details saved to verification_issues.json.`);
  await fs.writeFile(ISSUES_PATH, `${JSON.stringify(issues, null, 2)}\n`, 'utf8');
} else {
  console.log('Verification completed. No issues detected.');
  try {
    await fs.unlink(ISSUES_PATH);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}

async function analyzeEntry(entry) {
  const result = await requestJsonResponse({
    messages: [
      {
        role: 'system',
        content: 'You are a meticulous bilingual quality editor who validates Spanish to Swedish translations. Focus on semantic accuracy, tone, and correct diacritics.',
      },
      {
        role: 'user',
        content: [
          'Evaluate whether the recorded Swedish translation and example sentences accurately reflect the Spanish source.',
          '',
          'Spanish lemma:',
          entry.word,
          '',
          'Recorded Swedish translation(s):',
          entry.translation,
          '',
          'Spanish sentence:',
          entry.sentence_es,
          '',
          'Swedish sentence:',
          entry.sentence_sv,
          '',
          'Rules:',
          '- Pay close attention to Spanish accents (e.g., "té" vs "te").',
          '- Confirm that the Swedish sentence is a faithful translation of the Spanish sentence.',
          '- If anything is off, explain why and provide a suggested correction.',
          '- Classify severity as "ok" when both checks pass, "minor" when small corrections are needed, and "major" for significant mistakes.',
          '- If everything looks correct, mark both checks as true, use severity "ok", and keep feedback brief.',
        ].join('\n'),
      },
    ],
    schema: VERIFICATION_SCHEMA,
    temperature: 0,
    maxOutputTokens: 800,
  });

  return {
    translation_correct: result.translation_correct,
    sentence_correct: result.sentence_correct,
    severity: result.severity,
    translation_feedback: result.translation_feedback.trim(),
    sentence_feedback: result.sentence_feedback.trim(),
    suggested_translation: result.suggested_translation ?? null,
    suggested_sentence_sv: result.suggested_sentence_sv ?? null,
    notes: result.notes ?? null,
  };
}

async function readEntries() {
  const raw = await fs.readFile(WORD_DATA_PATH, 'utf8');
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error('Expected spanish_words.json to contain an array.');
  }
  return parsed;
}

async function readProgress() {
  try {
    const raw = await fs.readFile(PROGRESS_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    if (typeof parsed?.index === 'number' && parsed.index >= 0) {
      return Math.min(parsed.index, entries.length);
    }
    console.warn('Invalid progress file detected. Restarting verification from the beginning.');
    return 0;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return 0;
    }
    throw error;
  }
}

async function writeProgress(index) {
  const payload = { index, updatedAt: new Date().toISOString() };
  await ensureDirectoryExists(PROGRESS_PATH);
  await fs.writeFile(PROGRESS_PATH, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

async function writeEntries(entriesToPersist) {
  const payload = JSON.stringify(entriesToPersist, null, 2);
  await fs.writeFile(WORD_DATA_PATH, `${payload}\n`, 'utf8');
}

async function ensureDirectoryExists(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function promptTranslationResolution(entry, analysis) {
  console.log(`  Current translation: ${entry.translation}`);
  if (analysis.suggested_translation) {
    console.log(`  Suggested translation: ${analysis.suggested_translation}`);
  }
  console.log(`  Feedback: ${analysis.translation_feedback}`);

  const hasSuggestion = Boolean(analysis.suggested_translation?.trim());
  const promptText = hasSuggestion
    ? '    Apply the suggested translation? (y/N): '
    : '    Provide a corrected translation now? (y/N): ';

  const accept = await promptYesNo(promptText);
  if (!accept) {
    return false;
  }

  let nextTranslation = analysis.suggested_translation?.trim();
  if (!nextTranslation) {
    const manual = (await rl.question('    Enter the corrected Swedish translation: ')).trim();
    if (!manual) {
      console.log('    No translation entered. Skipping automatic fix.');
      return false;
    }
    nextTranslation = manual;
  }

  entry.translation = nextTranslation;
  await writeEntries(entries);
  console.log('    Updated translation saved to spanish_words.json.');
  return true;
}

async function promptYesNo(promptText) {
  const answer = (await rl.question(promptText)).trim().toLowerCase();
  return answer === 'y' || answer === 'yes';
}
