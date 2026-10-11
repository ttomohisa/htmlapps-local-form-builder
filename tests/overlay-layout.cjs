'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const source = fs.readFileSync(path.resolve(process.env.FORM_BUILDER_HTML || path.join(__dirname, '../src/index.template.html')), 'utf8');
const css = source.match(/<style>([\s\S]*?)<\/style>/)[1];
const escape = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function rule(selector, text = css) {
  const body = text.match(new RegExp('^\\s*' + escape(selector) + '\\s*\\{([^}]*)\\}', 'm'))?.[1];
  assert.ok(body, `CSS rule exists: ${selector}`);
  return Object.fromEntries(body.split(';').map(item => item.trim().split(/:\s*/)).filter(item => item.length === 2));
}
function productionFunction(name) {
  const result = [...source.matchAll(/^      function (\w+)\([^\n]*(?:\n[\s\S]*?^      \}|\{[^\n]*\})/gm)].find(match => match[1] === name);
  assert.ok(result, `production ${name} exists`);
  return result[0];
}

// These are source layout contracts, not a simulated browser layout engine.
// Removing a lock, height budget, shrink link, or mobile nav allowance must fail.
test('native modal state locks both document scrolling elements', () => {
  for (const selector of ['html:has(dialog:modal)', 'body:has(dialog:modal)']) {
    const locked = rule(selector);
    assert.equal(locked.overflow, 'hidden');
    assert.equal(locked['overscroll-behavior'], 'none');
  }
});
test('ordinary confirmation has a bounded shell, fixed header, and shrinking scroll body', () => {
  const shell = rule('#appConfirmDialog[open]');
  assert.equal(shell.display, 'flex');
  assert.equal(shell['flex-direction'], 'column');
  assert.equal(shell['max-height'], 'calc(100dvh - 28px - env(safe-area-inset-top) - env(safe-area-inset-bottom))');
  assert.equal(shell.overflow, 'hidden');
  assert.equal(rule('#appConfirmDialog > .app-confirm-header').flex, '0 0 auto');
  const body = rule('#appConfirmDialog > .app-confirm-body');
  assert.equal(body['min-height'], '0');
  assert.equal(body.flex, '1 1 auto');
  assert.equal(body.overflow, 'auto');
  assert.equal(body['overscroll-behavior'], 'contain');
  assert.match(body['padding-bottom'], /env\(safe-area-inset-bottom\)/);
});
test('mobile Quick Add reserves header and bottom navigation space with an internal scroller', () => {
  const mobile = css.slice(css.indexOf('@media (max-width: 600px)'));
  const panel = rule('.quick-add-panel', mobile);
  assert.equal(panel.position, 'fixed');
  assert.equal(panel.bottom, 'calc(78px + env(safe-area-inset-bottom))');
  assert.equal(panel['max-height'], 'calc(100dvh - var(--header-height) - 94px - env(safe-area-inset-top) - env(safe-area-inset-bottom))');
  assert.equal(panel.display, 'flex');
  assert.equal(panel['flex-direction'], 'column');
  assert.equal(panel.overflow, 'hidden');
  assert.equal(rule('.quick-add-head', mobile).flex, '0 0 auto');
  const menu = rule('.quick-add-scroll', mobile);
  assert.equal(menu['min-height'], '0');
  assert.equal(menu.flex, '1 1 auto');
  assert.equal(rule('.quick-add-scroll')['overflow-y'], 'auto');
  assert.equal(rule('.quick-add-scroll')['overscroll-behavior'], 'contain');
  assert.equal(rule('.quick-add-panel[hidden]').display, 'none');
  assert.equal(rule('.quick-add-panel').position, undefined, 'desktop placement remains inline');
});
test('the working Help shrink chain and close control remain intact', () => {
  const shell = rule('#helpDialog[open]');
  assert.equal(shell.display, 'flex');
  assert.equal(shell['flex-direction'], 'column');
  assert.equal(shell['max-height'], 'calc(100dvh - 28px - env(safe-area-inset-top) - env(safe-area-inset-bottom))');
  assert.equal(rule('.dialog-header').flex, '0 0 auto');
  const body = rule('.dialog-body');
  assert.equal(body['min-height'], '0');
  assert.equal(body.flex, '1 1 auto');
  assert.equal(body.overflow, 'auto');
  assert.equal(body['overscroll-behavior'], 'contain');
  assert.match(source, /id="closeHelpButton"[^>]*type="button"/);
});
function boundary() {
  const elements = new Map(), handlers = new Map(), focus = [], frames = [];
  class Element {
    constructor(id) { this.id = id; this.open = false; this.hidden = true; this.isConnected = true; this.attributes = {}; this.classList = { toggle() {} }; }
    addEventListener(event, handler) { handlers.set(this.id + ':' + event, handler); }
    setAttribute(name, value) { this.attributes[name] = value; }
    querySelector() { return element('firstField'); }
    focus() { focus.push(this.id); }
    showModal() { this.open = true; }
    close() { this.open = false; }
    getBoundingClientRect() { return { left: 10, top: 10, right: 100, bottom: 100 }; }
  }
  function element(id) { if (!elements.has(id)) elements.set(id, new Element(id)); return elements.get(id); }
  const document = { activeElement: element('opener'), addEventListener(event, handler) { handlers.set('document:' + event, handler); } };
  return { element, handlers, focus, frames, document, Element,
    fire(id, event, data = {}) { handlers.get(id + ':' + event)?.(data); },
    context: vm.createContext({ $: element, document, HTMLElement: Element, requestAnimationFrame: fn => frames.push(fn), t: key => key }) };
}
test('ordinary confirmation preserves Close, Cancel, Escape, backdrop, OK, and repeated-open results', async () => {
  const b = boundary();
  vm.runInContext(source.slice(source.indexOf('      const AppConfirm ='), source.indexOf('      const AppConfirm =') + source.slice(source.indexOf('      const AppConfirm =')).indexOf('      })();') + 11) + '\n globalThis.ask = AppConfirm.ask;', b.context);
  for (const [id, event, data, expected] of [
    ['#appConfirmClose', 'click', {}, false], ['#appConfirmCancel', 'click', {}, false],
    ['#appConfirmDialog', 'cancel', { preventDefault() { this.prevented = true; } }, false],
    ['#appConfirmDialog', 'click', { clientX: 0, clientY: 0 }, false], ['#appConfirmOk', 'click', {}, true]
  ]) {
    const promise = b.context.ask({ message: 'Synthetic confirmation' });
    b.frames.splice(0).forEach(fn => fn());
    assert.equal(b.element('#appConfirmDialog').open, true);
    b.fire(id, event, data);
    assert.equal(await promise, expected);
    assert.equal(b.element('#appConfirmDialog').open, false);
    assert.equal(b.focus.at(-1), 'opener');
    if (event === 'cancel') assert.equal(data.prevented, true);
  }
  const first = b.context.ask();
  const second = b.context.ask();
  assert.equal(await first, false);
  b.fire('#appConfirmCancel', 'click');
  assert.equal(await second, false);
});
test('Quick Add preserves toggle, first-item focus, Close, Escape and selection wiring', () => {
  const b = boundary(), added = [];
  b.context.addField = type => added.push(type);
  vm.runInContext(productionFunction('setQuickAddOpen') + '\n' + productionFunction('openFieldPalette'), b.context);
  const start = source.indexOf("      $('#addFirstFieldButton').addEventListener('click', openFieldPalette);");
  const end = source.indexOf("      $('#quickAddMenu').addEventListener('dragstart'", start);
  vm.runInContext(source.slice(start, end), b.context);
  vm.runInContext(source.match(/      document\.addEventListener\('keydown', event => \{ if \(event\.key === 'Escape'[^\n]+/)[0], b.context);
  for (const opener of ['#addFirstFieldButton', '#emptyAddButton']) {
    b.fire(opener, 'click'); b.frames.splice(0).forEach(fn => fn());
    assert.equal(b.element('#quickAddPanel').hidden, false);
    assert.equal(b.element('#addFirstFieldButton').attributes['aria-expanded'], 'true');
    assert.equal(b.focus.at(-1), 'firstField');
    b.fire('#closeQuickAddButton', 'click');
    assert.equal(b.element('#quickAddPanel').hidden, true);
    b.fire(opener, 'click'); b.frames.splice(0).forEach(fn => fn());
    b.fire('document', 'keydown', { key: 'Escape' });
    assert.equal(b.element('#quickAddPanel').hidden, true);
  }
  b.fire('#addFirstFieldButton', 'click');
  b.fire('#quickAddMenu', 'click', { target: { closest: () => ({ dataset: { quickAddType: 'textarea' } }) } });
  assert.deepEqual(added, ['textarea']);
  assert.equal(b.element('#quickAddPanel').hidden, true);
  assert.equal(b.element('#addFirstFieldButton').attributes['aria-expanded'], 'false');
});
test('draft recovery keeps its mandatory decision and original shared shell rules', () => {
  const draft = source.match(/<dialog class="app-confirm-dialog" id="draftDialog"[\s\S]*?<\/dialog>/)[0];
  assert.doesNotMatch(draft, /app-confirm-close|method="dialog"/);
  assert.match(draft, /id="draftNewButton"/);
  assert.match(draft, /id="draftContinueButton"/);
  const startup = source.slice(source.indexOf("        const dialog = $('#draftDialog');"), source.indexOf('      function normalizeOptionalInteger'));
  assert.match(startup, /dialog\.addEventListener\('cancel', event => event\.preventDefault\(\)\);/);
  assert.match(startup, /if \(useDraft\) \{[\s\S]*?applyFormState\(draft\.form/);
  assert.equal(rule('.app-confirm-dialog').display, undefined);
  assert.equal(rule('.app-confirm-body').overflow, undefined);
  assert.equal(rule('.app-confirm-header').flex, undefined);
});
