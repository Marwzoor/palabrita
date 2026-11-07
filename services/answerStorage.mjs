// A single atomic journal write commits an answer. Existing keys remain compatible.
const JOURNAL_KEY = 'palabrita_pending_answer';
const KEYS = ['palabrita_word_progress', 'palabrita_progress', 'palabrita_activity'];

export function recoverAnswer(storage) {
  const raw = storage.getItem(JOURNAL_KEY);
  if (!raw) return;
  const values = JSON.parse(raw);
  if (!KEYS.every(key => typeof values[key] === 'string')) {
    throw new Error('Invalid saved answer');
  }
  for (const key of KEYS) storage.setItem(key, values[key]);
  storage.removeItem(JOURNAL_KEY);
}

export function saveAnswer(storage, values) {
  storage.setItem(JOURNAL_KEY, JSON.stringify(values));
  // Once the journal exists the answer is durable, even if a mirror write fails.
  try { recoverAnswer(storage); } catch (error) {
    console.warn('Answer saved; storage recovery will retry on reload.', error);
  }
}
