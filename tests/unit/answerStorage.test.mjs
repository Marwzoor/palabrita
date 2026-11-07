import { test } from 'node:test';
import assert from 'node:assert/strict';
import { saveAnswer, recoverAnswer } from '../../services/answerStorage.mjs';

const values = { palabrita_word_progress: '{"version":2,"progress":{"tenido":{"repetitionCount":7}}}', palabrita_progress: '{"points":10}', palabrita_activity: '{"2026-11-07":1}' };
function storage(failAt = Infinity) {
  const data = new Map();
  let writes = 0;
  return { data, getItem: key => data.get(key) ?? null,
    setItem(key, value) { if (++writes === failAt) throw Error('interrupted'); data.set(key, value); },
    removeItem: key => data.delete(key) };
}
for (const failAt of [2, 3, 4]) {
  test(`recovery after mirror write ${failAt} is idempotent`, () => {
    const s = storage(failAt);
    saveAnswer(s, values);
    assert.ok(s.getItem('palabrita_pending_answer'));
    recoverAnswer(s);
    recoverAnswer(s);
    for (const [key, value] of Object.entries(values)) assert.equal(s.getItem(key), value);
    assert.equal(s.getItem('palabrita_pending_answer'), null);
  });
}
test('failed journal does not change existing progress', () => {
  const s = storage(1);
  s.data.set('palabrita_progress', '{"points":50}');
  assert.throws(() => saveAnswer(s, values));
  assert.equal(s.getItem('palabrita_progress'), '{"points":50}');
  assert.equal(s.getItem('palabrita_pending_answer'), null);
});
test('normal save mirrors values and clears journal', () => {
  const s = storage();
  saveAnswer(s, values);
  for (const [key, value] of Object.entries(values)) assert.equal(s.getItem(key), value);
  assert.equal(s.getItem('palabrita_pending_answer'), null);
});
