'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const source = fs.readFileSync(path.resolve(process.env.FORM_BUILDER_HTML || path.join(__dirname, '../src/index.template.html')), 'utf8');

// Exercise the production event handlers and choice functions, with only DOM/render
// boundaries stubbed. Browser interaction/export checks are documented separately.
function createHarness(language = 'en', type = 'checkboxGroup') {
  const functions = [...source.matchAll(/^      function (\w+)\([^\n]*(?:\n[\s\S]*?^      \}|\{[^\n]*\})/gm)];
  const names = ['t', 'fieldById', 'selectedField', 'supportsOptions', 'supportsDefault', 'supportsTextLength', 'supportsSelectionRange', 'normalizedOptions', 'normalizeChoiceDefault', 'normalizeValidationPair', 'resetFieldPreviewState', 'formatMessage', 'validateFieldValue', 'previewValueFor', 'escapeHtml', 'escapeGeneratedTitle', 'safeEmbeddedJson', 'generatedFormPackage', 'buildGeneratedFormHtml', 'addChoice', 'moveChoice', 'deleteChoice', 'reconcileChoiceState', 'renameChoice', 'focusChoice', 'finishChoiceEdit', 'inlineDefaultHtml', 'refreshInlineChoiceDefaults'];
  const elements = new Map(), handlers = {}, focus = [];
  function element(selector) {
    if (!elements.has(selector)) elements.set(selector, { textContent: '', innerHTML: '', focus: () => focus.push(selector), getAttribute: () => '', querySelector: child => element(selector + ' ' + child), addEventListener: (name, fn) => { handlers[selector + ':' + name] = fn; } });
    return elements.get(selector);
  }
  const prefix = language === 'ja' ? '選択肢' : 'Option';
  const field = { id: 'choices', type, label: 'Synthetic choices', required: true, options: [`${prefix} 1`, `${prefix} 2`], defaultValue: type === 'checkboxGroup' ? [] : '' };
  if (type === 'checkboxGroup') Object.assign(field, { minSelections: 2, maxSelections: 2 });
  const sibling = { id: 'notes', type: 'text', label: 'Synthetic notes', defaultValue: '' };
  const state = { form: { schemaVersion: 1, formVersion: 1, formId: 'choice-editing-test', title: 'Choice editing', fields: [field, sibling] }, selectedId: 'choices', canvasMode: 'edit', previewValues: { notes: 'Keep this answer' }, previewErrors: { notes: 'Keep this error' } };
  const context = vm.createContext({ state, language, APP_CONFIG: { name: 'Local Form Builder', version: '1.0.0' }, $: element, CSS: { escape: value => value }, document: { querySelector: element }, requestAnimationFrame: fn => fn(), renderCanvas() {}, renderInspector() {}, renderDefaultControl() {}, renderSchema() { element('#schemaPreview').textContent = JSON.stringify(state.form); }, announce() {}, AppToast: { show() {} } });
  const translationStart = source.indexOf('      const translations =');
  const translationEnd = source.indexOf('      const $ =', translationStart);
  vm.runInContext(source.slice(translationStart, translationEnd), context);
  for (const match of functions) if (names.includes(match[1])) vm.runInContext(match[0], context);
  const start = source.indexOf("      $('#fieldList').addEventListener('click',");
  const end = source.indexOf("      $('#fieldList').addEventListener('keydown',", start);
  vm.runInContext(source.slice(start, end), context);
  const defaultControls = field.options.map(option => ({ value: option, checked: false, nextElementSibling: { textContent: option } }));
  const defaultSelect = { options: [{ value: '', textContent: '' }, ...field.options.map(option => ({ value: option, textContent: option }))], value: '' };
  function event(index, action, value) {
    const row = { dataset: { inlineChoiceIndex: String(index) } };
    const card = { dataset: { fieldId: field.id }, querySelector: selector => selector === '[data-inline-control="default-single"]' ? (type === 'checkboxGroup' ? null : defaultSelect) : element('inline-default'), querySelectorAll: selector => selector === '[data-inline-control="default-multi"]' && type === 'checkboxGroup' ? defaultControls : [] };
    const target = { dataset: {}, value, type: 'text', matches: selector => selector === '[data-inline-choice-text]', closest(selector) { if (selector === '[data-field-id]') return card; if (selector === '[data-inline-choice-index]') return row; if (selector === '[data-inline-action]') return action ? { dataset: { inlineAction: action } } : null; return null; } };
    return { target };
  }
  function click(action, index = -1) { handlers['#fieldList:click'](event(index, action)); }
  function rename(index, value) { const e = event(index, null, value); handlers['#fieldList:input'](e); handlers['#fieldList:change'](e); return e.target.value; }
  function exported() { return JSON.parse(context.buildGeneratedFormHtml().match(/<script id="local-form-schema" type="application\/json">([\s\S]*?)<\/script>/)[1]); }
  return { field, state, context, click, rename, event, handlers, exported, elements, focus, defaultControls, defaultSelect };
}
const plain = value => JSON.parse(JSON.stringify(value));

for (const language of ['ja', 'en']) {
  test(`${language}: deleting a choice clamps both limits and keeps the form answerable`, () => {
    const h = createHarness(language); h.click('choice-delete', 1);
    assert.equal(h.field.minSelections, 1); assert.equal(h.field.maxSelections, 1);
    assert.equal(h.context.validateFieldValue(h.field, h.field.options.slice()), '');
    assert.deepEqual(h.exported().form, plain(h.state.form));
    assert.equal(h.exported().language, language);
  });
  test(`${language}: repeated delete/add uses unused generated values and retains existing text`, () => {
    const h = createHarness(language); const keep = h.field.options[1];
    for (let i = 0; i < 8; i++) { h.click('choice-delete', 0); h.click('add-choice'); assert.equal(new Set(h.field.options).size, h.field.options.length); }
    assert.ok(h.field.options.every(Boolean));
    const first = createHarness(language); first.click('choice-delete', 0); first.click('add-choice'); assert.equal(first.field.options[0], keep);
  });
  test(`${language}: generated additions skip manually authored number collisions`, () => {
    const h = createHarness(language); const base = language === 'ja' ? '選択肢' : 'Option';
    h.field.options = [`${base} 3`, `${base} 4`]; h.click('add-choice');
    assert.deepEqual(h.field.options, [`${base} 3`, `${base} 4`, `${base} 5`]);
  });
  test(`${language}: blank or duplicate rename restores the original option and selections`, () => {
    const h = createHarness(language); const original = h.field.options.slice();
    h.field.defaultValue = [original[0]]; h.state.previewValues.choices = [original[0]];
    assert.equal(h.rename(0, ` ${original[1]} `), original[0]);
    assert.deepEqual(h.field.options, original);
    assert.equal(h.rename(0, '   '), original[0]);
    assert.deepEqual(plain(h.field.defaultValue), [original[0]]);
    assert.deepEqual(plain(h.state.previewValues.choices), [original[0]]);
  });
  test(`${language}: typing a rename does not publish an unfinished schema`, () => {
    const h = createHarness(language); const original = h.field.options[0];
    h.handlers['#fieldList:input'](h.event(0, null, ''));
    assert.equal(h.field.options[0], original);
    assert.equal(h.exported().form.fields[0].options[0], original);
  });
}
for (const type of ['radio', 'select', 'checkboxGroup']) {
  test(`${type}: add/reorder preserves valid defaults, preview values and sibling state`, () => {
    const h = createHarness('en', type); const selected = type === 'checkboxGroup' ? ['Option 2'] : 'Option 2';
    h.field.defaultValue = plain(selected); h.state.previewValues.choices = plain(selected); h.state.previewErrors.choices = 'Old error'; h.elements.set('#exportStatus', { textContent: 'Old export' });
    h.click('add-choice'); h.click('choice-up', 2); h.click('choice-down', 0);
    assert.deepEqual(plain(h.field.defaultValue), selected); assert.deepEqual(plain(h.state.previewValues.choices), selected);
    assert.equal(h.state.previewValues.notes, 'Keep this answer'); assert.equal(h.state.previewErrors.notes, 'Keep this error');
    assert.equal(h.state.previewErrors.choices, undefined); assert.equal(h.elements.get('#exportStatus').textContent, '');
  });
  test(`${type}: deleting selected option removes only that answer, never substitutes the default`, () => {
    const h = createHarness('en', type); h.field.defaultValue = type === 'checkboxGroup' ? ['Option 1', 'Option 2'] : 'Option 2';
    h.state.previewValues.choices = type === 'checkboxGroup' ? ['Option 1', 'Option 2'] : 'Option 1';
    h.click('choice-delete', 0);
    assert.deepEqual(plain(h.state.previewValues.choices), type === 'checkboxGroup' ? ['Option 2'] : '');
    assert.deepEqual(plain(h.field.defaultValue), type === 'checkboxGroup' ? ['Option 2'] : 'Option 2');
  });
  test(`${type}: successful trimmed rename follows defaults and preview answers into export`, () => {
    const h = createHarness('en', type); h.field.defaultValue = type === 'checkboxGroup' ? ['Option 1'] : 'Option 1'; h.state.previewValues.choices = plain(h.field.defaultValue);
    assert.equal(h.rename(0, '  Renamed choice  '), 'Renamed choice');
    const expected = type === 'checkboxGroup' ? ['Renamed choice'] : 'Renamed choice';
    assert.deepEqual(plain(h.field.defaultValue), expected); assert.deepEqual(plain(h.state.previewValues.choices), expected);
    assert.deepEqual(h.exported().form, plain(h.state.form));
  });
}
test('single-option deletion is a no-op and additions stop at 30 choices', () => {
  const h = createHarness(); h.click('choice-delete', 0); const one = h.field.options.slice(); h.click('choice-delete', 0); assert.deepEqual(h.field.options, one);
  for (let i = 0; i < 35; i++) h.click('add-choice');
  assert.equal(h.field.options.length, 30); assert.equal(new Set(h.field.options).size, 30);
});
test('nullable selection bounds stay unset after deletion', () => { const h = createHarness(); h.field.minSelections = h.field.maxSelections = null; h.click('choice-delete', 0); assert.equal(h.field.minSelections, null); assert.equal(h.field.maxSelections, null); });
test('inline actions mutate their own card even when another field is selected', () => { const h = createHarness(); h.state.selectedId = 'notes'; h.click('choice-delete', 0); assert.equal(h.field.options.length, 1); assert.equal(h.state.form.fields[1].type, 'text'); });

for (const type of ['radio', 'select', 'checkboxGroup']) {
  test(`${type}: committing a rename updates default controls without replacing a pending click target`, () => {
    const h = createHarness('en', type);
    h.field.defaultValue = type === 'checkboxGroup' ? ['Option 1'] : 'Option 1';
    h.elements.set('inline-default', { innerHTML: 'Original live controls' });
    const target = type === 'checkboxGroup' ? h.defaultControls[0] : h.defaultSelect;
    h.rename(0, 'Renamed');
    assert.equal(h.elements.get('inline-default').innerHTML, 'Original live controls');
    if (type === 'checkboxGroup') {
      assert.equal(h.defaultControls[0], target);
      assert.equal(target.value, 'Renamed'); assert.equal(target.nextElementSibling.textContent, 'Renamed'); assert.equal(target.checked, true);
    } else {
      assert.equal(h.defaultSelect, target);
      assert.equal(target.options[1].value, 'Renamed'); assert.equal(target.options[1].textContent, 'Renamed'); assert.equal(target.value, 'Renamed');
    }
  });
}
