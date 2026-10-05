'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const source = fs.readFileSync(path.resolve(process.env.FORM_BUILDER_HTML || path.join(__dirname, '../src/index.template.html')), 'utf8');
const runtime = JSON.parse(source.match(/const GENERATED_FORM_RUNTIME = ("(?:[^"\\]|\\.)*");/)[1]);
const plain = value => JSON.parse(JSON.stringify(value));
const fieldId = 'choice" data-untrusted="<&\'';
function fields(required = false) {
  return [{ id: fieldId, type: 'radio', label: 'Synthetic choice', helper: 'Choose or clear', required, options: ['One', 'Two'], defaultValue: 'Two' }, { id: 'notes', type: 'text', label: 'Notes', required: true, defaultValue: '' }];
}
function dom() {
  const elements = new Map(), focus = [], handlers = {};
  function element(key) {
    if (!elements.has(key)) elements.set(key, { disabled: false, hidden: false, textContent: '', innerHTML: '', dataset: {}, className: '',
      classList: { toggle() {} }, setAttribute(k, v) { this[k] = v; }, removeAttribute(k) { delete this[k]; },
      addEventListener(name, fn) { (handlers[key + ':' + name] ||= []).push(fn); },
      querySelector(selector) { return element(key + ' ' + selector); },
      focus() { focus.push(key); }, scrollIntoView() {}, close() {}, showModal() {} });
    return elements.get(key);
  }
  return { element, elements, focus, handlers };
}
function builder(language = 'en', required = false) {
  const d = dom();
  const state = { canvasMode: 'preview', previewWidth: 'desktop', form: { title: 'Synthetic', description: '', formId: 'synthetic', schemaVersion: 1, formVersion: 1, fields: fields(required) }, previewValues: { notes: 'Keep' }, previewErrors: { [fieldId]: 'Old choice error', notes: 'Old notes error' } };
  const context = vm.createContext({ state, language, $: d.element, CSS: { escape: String }, document: { querySelector: d.element }, requestAnimationFrame: fn => fn(), announce() {}, renderSchema() {}, AppToast: { show() {} } });
  vm.runInContext(source.slice(source.indexOf('      const translations ='), source.indexOf('      const $ =')), context);
  const wanted = ['t','fieldById','previewValueFor','renderRuntimeField','renderRuntimeCanvas','renderCanvas','normalizedOptions','supportsTextLength','escapeHtml','formatMessage','resetPreviewValues','clearPreviewRadio'];
  for (const match of source.matchAll(/^      function (\w+)\([^\n]*(?:\n[\s\S]*?^      \}|\{[^\n]*\})/gm)) if (wanted.includes(match[1])) vm.runInContext(match[0], context);
  // Evaluate the actual delegated click wiring rather than calling a test-only helper.
  const click = source.match(/      \$\('#fieldList'\)\.addEventListener\('click', event => \{\n        const clearButton = [\s\S]*?^      \}\);/m);
  if (click) vm.runInContext(click[0], context);
  function clear(id = fieldId) {
    const button = { dataset: { clearPreviewRadio: id } };
    for (const h of d.handlers['#fieldList:click'] || []) h({ target: { closest: selector => selector === '[data-clear-preview-radio]' ? button : null } });
  }
  return { ...d, state, context, clear, html: f => context.renderRuntimeField(f || state.form.fields[0]) };
}
function generated(language = 'en', { required = false, edit = false, mode = 'normal', id = fieldId } = {}) {
  const d = dom(), pending = [], writes = [], completions = [], timers = [];
  const schema = { formId: 'synthetic', schemaVersion: 1, formVersion: 1, title: 'Synthetic', inputMode: mode, fields: fields(required) };
  schema.fields[0].id = id;
  d.element('local-form-schema').textContent = JSON.stringify({ language, form: schema });
  const controls = ['checkButton','resetButton','historyButton','radio','clear','notes','already-disabled'].map(d.element);
  controls.at(-1).disabled = true;
  const document = { documentElement: {}, getElementById: d.element, querySelector: d.element, querySelectorAll: () => controls, addEventListener: (name, fn) => (d.handlers['document:' + name] ||= []).push(fn) };
  let uid = 0;
  const context = vm.createContext({ document, window: { addEventListener() {}, scrollTo() {} }, CSS: { escape: String }, crypto: { randomUUID: () => 'new-' + (++uid) }, requestAnimationFrame: fn => fn(), matchMedia: () => ({ matches: true }), setTimeout: fn => { timers.push(fn); return timers.length; }, clearTimeout() {}, console });
  const end = runtime.indexOf('init().catch(');
  vm.runInContext(runtime.slice(0, end) + `
  var productionPutResponse=putResponse;
  window.api={saveCurrent,reset,capture,loadResponse,showView,printBlank,fieldHtml,valueFor,validate,allValues,showCompletion,
    getState:()=>({values,errors,editingId,editingCreatedAt,responses,saving:typeof saving==='undefined'?false:saving}),
    setState:(v)=>{values=v.values||values;errors=v.errors||errors;if('editingId' in v)editingId=v.editingId;if('editingCreatedAt' in v)editingCreatedAt=v.editingCreatedAt;},
    useIndexedDb:(open)=>{openDb=open;storageMode='indexeddb';putResponse=productionPutResponse;},
    setStorage:(put,refresh)=>{putResponse=put;refreshHistory=refresh;},
    wire:()=>{createGeneratedUi=()=>{};initStorage=async()=>{};setStorageStatus=()=>{};return init();}};
})();`, context);
  const api = context.window.api;
  api.setState({ values: { [fieldId]: 'One', notes: 'Keep' }, errors: { [fieldId]: 'Old choice error', notes: 'Old notes error' }, editingId: edit ? 'existing-1' : null, editingCreatedAt: edit ? '2026-01-01T00:00:00.000Z' : null });
  let refreshFails = false;
  api.setStorage(r => new Promise((resolve, reject) => pending.push({ record: plain(r), resolve: () => { writes.push(plain(r)); resolve(); }, reject })), async () => { if (refreshFails) throw Error('history unavailable'); });
  function clear(id = fieldId) {
    const button = { dataset: { clearRadio: id } };
    for (const h of d.handlers['fields:click'] || []) h({ target: { closest: selector => selector === '[data-clear-radio]' ? button : null } });
  }
  return { ...d, api, schema, context, controls, pending, writes, completions, timers, clear, failRefresh: () => { refreshFails = true; } };
}
for (const lang of ['en','ja']) {
  test(`${lang}: Preview clears only optional radio, retaining schema/siblings and resetting focus/summary`, () => {
    const h = builder(lang), schema = plain(h.state.form);
    assert.match(h.html(), /data-clear-preview-radio=/);
    assert.match(h.html(), new RegExp(lang === 'en' ? 'Clear selection' : '選択を解除'));
    assert.match(h.html(), /type="button"/);
    assert.ok(!h.html().includes('data-untrusted="'));
    h.clear(); h.clear();
    assert.equal(h.state.previewValues[fieldId], '');
    assert.equal(h.context.previewValueFor(h.state.form.fields[0]), '');
    assert.equal(h.state.previewValues.notes, 'Keep');
    assert.deepEqual(plain(h.state.previewErrors), { notes: 'Old notes error' });
    assert.deepEqual(plain(h.state.form), schema);
    assert.ok(h.focus.at(-1).includes(fieldId));
    assert.match(h.elements.get('#previewValidationSummary').textContent, /1/);
    assert.doesNotMatch(h.html(), / checked/);
    h.context.resetPreviewValues();
    assert.equal(h.context.previewValueFor(h.state.form.fields[0]), 'Two');
  });
  test(`${lang}: generated clear is wired, explicit, local and leaves authored defaults intact`, async () => {
    const h = generated(lang); await h.api.wire(); const schema = plain(h.schema);
    assert.match(h.api.fieldHtml(h.schema.fields[0]), /data-clear-radio=/);
    h.clear(); h.clear();
    const s = h.api.getState();
    assert.equal(s.values[fieldId], ''); assert.equal(s.values.notes, 'Keep');
    assert.deepEqual(plain(s.errors), { notes: 'Old notes error' });
    assert.deepEqual(plain(h.schema), schema); assert.ok(h.focus.at(-1).includes(fieldId));
    assert.match(h.elements.get('validationSummary').textContent, /1/);
    assert.equal(h.api.allValues()[fieldId], '');
    h.api.reset(); assert.equal(h.api.valueFor(h.schema.fields[0]), 'Two');
  });
}
test('required and non-radio fields have no clear control and ignore forged clear clicks', async () => {
  const b = builder('en', true); assert.doesNotMatch(b.html(), /data-clear-preview-radio/); b.clear(); assert.equal(b.state.previewValues[fieldId], undefined);
  const g = generated('en', { required: true }); await g.api.wire(); assert.doesNotMatch(g.api.fieldHtml(g.schema.fields[0]), /data-clear-radio/); g.clear(); assert.equal(g.api.getState().values[fieldId], 'One');
  for (const type of ['select','checkboxGroup','checkbox','text']) {
    const f = { ...b.state.form.fields[0], type, required: false }; assert.doesNotMatch(b.html(f), /data-clear-preview-radio/); assert.doesNotMatch(g.api.fieldHtml(f), /data-clear-radio/);
  }
});
for (const edit of [false,true]) test(`single-flight ${edit ? 'edit' : 'new'} save locks interactions and retains captured context`, async () => {
  const h = generated('en', { edit }); await h.api.wire();
  const first = h.api.saveCurrent(), repeat = h.api.saveCurrent();
  assert.equal(h.pending.length, 1); assert.ok(h.controls.every(c => c.disabled));
  assert.equal(h.api.getState().saving, true);
  h.api.reset(); h.api.loadResponse({ responseId: 'other', values: { notes: 'Changed' } }, true);
  h.api.capture({ target: { closest: () => ({ dataset: { fieldId: 'notes' }, value: 'Changed' }) } }); h.clear(); h.api.showView('history'); h.api.printBlank();
  assert.equal(h.api.getState().values.notes, 'Keep');
  assert.equal(h.api.getState().values[fieldId], 'One');
  h.pending[0].resolve(); await Promise.all([first, repeat]);
  assert.equal(h.writes.length, 1); assert.equal(h.writes[0].responseId, edit ? 'existing-1' : 'new-1');
  if (edit) assert.equal(h.writes[0].createdAt, '2026-01-01T00:00:00.000Z');
  assert.equal(h.api.getState().saving, false); assert.ok(h.controls.slice(0,-1).every(c => !c.disabled)); assert.equal(h.controls.at(-1).disabled, true);
  assert.equal(h.elements.get('completionTitle').textContent, edit ? 'Response updated' : 'Response saved');
});
test('failed save preserves answers/edit identity, reports failure, unlocks and allows deliberate retry', async () => {
  const h = generated('ja', { edit: true }); const initial = plain(h.api.getState());
  const first = h.api.saveCurrent(); assert.equal(h.pending.length, 1); h.pending[0].reject(Error('storage full')); await first;
  const state = h.api.getState(); assert.deepEqual(plain(state.values), initial.values); assert.equal(state.editingId, initial.editingId); assert.equal(state.editingCreatedAt, initial.editingCreatedAt);
  assert.equal(state.saving, false); assert.equal(h.elements.get('validationSummary').hidden, false); assert.match(h.elements.get('validationSummary').textContent, /保存できません/);
  const retry = h.api.saveCurrent(); assert.equal(h.pending.length, 2); h.pending[1].resolve(); await retry; assert.equal(h.writes.length, 1); assert.equal(h.writes[0].responseId, 'existing-1');
});
test('invalid saves never enter storage and a later valid submission succeeds', async () => {
  const h = generated(); h.api.setState({ values: { notes: '' } }); await h.api.saveCurrent(); assert.equal(h.pending.length,0); assert.equal(h.api.getState().saving,false);
  h.api.setState({ values: { notes: 'Valid' } }); const p = h.api.saveCurrent(); h.pending[0].resolve(); await p; assert.equal(h.writes.length,1);
});
test('successful write with failed history refresh still completes without offering a duplicate retry', async () => {
  const h = generated(); h.failRefresh(); const p = h.api.saveCurrent(); h.pending[0].resolve(); await p;
  assert.equal(h.writes.length,1); assert.equal(h.api.getState().saving,false); assert.equal(h.elements.get('completionTitle').textContent,'Response saved'); assert.equal(h.api.getState().editingId,null);
});
test('intentional sequential Continuous submissions still create separate records', async () => {
  const h = generated('en', { mode: 'continuous' });
  for (let i=0;i<2;i++) { h.api.setState({ values: { notes: 'Visitor '+i, [fieldId]: '' } }); const p=h.api.saveCurrent(); h.pending[i].resolve(); await p; h.timers.shift()(); }
  assert.equal(h.writes.length,2); assert.notEqual(h.writes[0].responseId,h.writes[1].responseId); assert.equal(h.writes[0].values[fieldId],''); assert.equal(h.writes[1].values.notes,'Visitor 1');
});

test('pending save blocks delegated click/input/change events, then releases the event boundary', async () => {
  const h = generated(); await h.api.wire(); const save = h.api.saveCurrent();
  for (const name of ['click','input','change']) {
    let prevented = 0, stopped = 0;
    for (const handler of h.handlers['document:' + name] || []) handler({ preventDefault() { prevented++; }, stopImmediatePropagation() { stopped++; } });
    assert.equal(prevented,1); assert.equal(stopped,1);
  }
  h.pending[0].resolve(); await save;
  let blocked = false;
  for (const handler of h.handlers['document:click']) handler({ preventDefault() { blocked=true; }, stopImmediatePropagation() {} });
  assert.equal(blocked,false);
});
test('clearing the only error hides its summary; Edit mode and unrelated fields are untouched', async () => {
  const b = builder(); b.state.previewErrors = { [fieldId]: 'Old' }; b.clear(); assert.equal(b.elements.get('#previewValidationSummary').hidden,true);
  b.state.canvasMode = 'edit'; b.state.previewValues[fieldId] = 'One'; b.clear(); assert.equal(b.state.previewValues[fieldId],'One'); b.clear('notes'); assert.equal(b.state.previewValues.notes,'Keep');
  const g = generated(); await g.api.wire(); g.api.setState({ errors: { [fieldId]: 'Old' } }); g.clear(); assert.equal(g.elements.get('validationSummary').hidden,true); g.clear('notes'); assert.equal(g.api.getState().values.notes,'Keep');
});
test('actual IndexedDB save boundary receives only one response from concurrent Save actions', async () => {
  const h = generated(), requests = [], closed = [], transactions = [];
  h.api.useIndexedDb(async () => ({ transaction() { const tx = { objectStore() { return { put(record) { const req = { record: plain(record) }; requests.push(req); return req; } }; } }; transactions.push(tx); return tx; }, close() { closed.push(true); } }));
  const a = h.api.saveCurrent(), b = h.api.saveCurrent(); await new Promise(setImmediate);
  assert.equal(requests.length,1); requests[0].onsuccess(); await new Promise(setImmediate);
  assert.equal(h.api.getState().saving,true); assert.equal(closed.length,0);
  assert.equal(typeof transactions[0].oncomplete,'function'); transactions[0].oncomplete(); await Promise.all([a,b]);
  assert.equal(closed.length,1); assert.equal(requests[0].record.values.notes,'Keep'); assert.equal(h.api.getState().saving,false);
});
test('actual IndexedDB request failure releases the connection and retains a retryable response', async () => {
  const h = generated('en', { edit: true }), requests = []; let closes = 0;
  h.api.useIndexedDb(async () => ({ transaction() { return { objectStore() { return { put() { const req = {}; requests.push(req); return req; } }; } }; }, close() { closes++; } }));
  const p = h.api.saveCurrent(); await new Promise(setImmediate); requests[0].error = Error('write failed'); requests[0].onerror(); await p;
  assert.equal(closes,1); assert.equal(h.api.getState().values.notes,'Keep'); assert.equal(h.api.getState().editingId,'existing-1'); assert.equal(h.api.getState().saving,false);
});
test('request success followed by transaction abort keeps answers/edit context available for retry', async () => {
  const h = generated('en', { edit: true }), requests = [], transactions = []; let closed=0;
  h.api.useIndexedDb(async () => ({ transaction() { const tx={objectStore() { return { put() { const req={}; requests.push(req); return req; } }; }}; transactions.push(tx); return tx; }, close() { closed++; } }));
  const p=h.api.saveCurrent(); await new Promise(setImmediate); requests[0].onsuccess(); await new Promise(setImmediate);
  assert.equal(h.api.getState().saving,true); assert.equal(typeof transactions[0].onabort,'function');
  transactions[0].error=Error('commit aborted'); transactions[0].onabort(); await p;
  assert.equal(h.api.getState().values.notes,'Keep'); assert.equal(h.api.getState().editingId,'existing-1'); assert.equal(h.api.getState().saving,false); assert.equal(closed,1);
  assert.match(h.elements.get('validationSummary').textContent,/could not be saved/);
});
test('accepted prototype-like IDs clear to own empty keys and preserve the exact response key', async () => {
  for (const id of ['__proto__','constructor','toString']) {
    const b=builder(); b.state.form.fields[0].id=id; b.state.previewErrors={};
    assert.doesNotMatch(b.html(),/has-error/); b.clear(id);
    assert.ok(Object.hasOwn(b.state.previewValues,id)); assert.equal(b.context.previewValueFor(b.state.form.fields[0]),''); assert.doesNotMatch(b.html(),/has-error| checked/);
    const g=generated('en',{id}); await g.api.wire(); g.api.setState({values:{notes:'Keep'},errors:{}}); g.clear(id);
    assert.ok(Object.hasOwn(g.api.getState().values,id)); assert.equal(g.api.valueFor(g.schema.fields[0]),''); assert.doesNotMatch(g.api.fieldHtml(g.schema.fields[0]),/has-error| checked/);
    assert.ok(Object.hasOwn(g.api.allValues(),id)); assert.equal(g.api.allValues()[id],'');
    const save=g.api.saveCurrent(); assert.equal(g.pending[0].record.values[id],''); assert.ok(Object.hasOwn(g.pending[0].record.values,id)); g.pending[0].resolve(); await save;
  }
});
test('generated print CSS excludes interactive clear buttons from blank and saved forms', () => {
  const css=JSON.parse(source.match(/const GENERATED_FORM_CSS = ("(?:[^"\\]|\\.)*");/)[1]);
  const print=css.slice(css.indexOf('@media print'));
  assert.match(print, /\.clear-selection[^{}]*\{display:none!important\}/);
});
