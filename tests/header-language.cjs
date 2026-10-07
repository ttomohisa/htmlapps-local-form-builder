'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.resolve(process.env.FORM_BUILDER_HTML || path.join(root, 'src/index.template.html')), 'utf8');
const config = JSON.parse(fs.readFileSync(path.join(root, 'app.config.json'), 'utf8'));
const embeddedConfig = source.match(/const APP_CONFIG = ([\s\S]*?);\r?\n/)[1];
const runtimeConfig = embeddedConfig === '__APP_CONFIG_JSON__' ? config : JSON.parse(embeddedConfig);

// Run the real translation function and click handler. DOM/render boundaries are
// synthetic; browser QA separately verifies rendered fields and exported forms.
function header(language) {
  const elements = new Map(), handlers = new Map();
  for (const [, attrs] of source.matchAll(/<\w+\b([^<>]*)>/g)) {
    const id = attrs.match(/\bid="([^"]+)"/)?.[1];
    if (!id) continue;
    const element = { dataset: {}, attributes: {}, textContent: '', title: '', setAttribute(key, value) { this.attributes[key] = String(value); }, addEventListener(name, fn) { handlers.set(`${id}:${name}`, fn); } };
    for (const [, key, value] of attrs.matchAll(/data-(i18n(?:-title|-aria-label)?)="([^"]+)"/g)) element.dataset[key.replace(/-([a-z])/g, (_, char) => char.toUpperCase())] = value;
    elements.set(id, element);
  }
  const document = { documentElement: {}, querySelectorAll(selector) { const key = selector.slice(6, -1).replace(/-([a-z])/g, (_, char) => char.toUpperCase()); return [...elements.values()].filter(element => element.dataset[key]); } };
  const context = vm.createContext({ language, state: { previewErrors: {} }, APP_CONFIG: runtimeConfig, document, $: selector => elements.get(selector.slice(1)), renderAll() {}, setDraftStatus() {}, draftStatusState: 'saved', storageKeys: { language: 'language' }, writeStorage() {} });
  vm.runInContext(source.slice(source.indexOf('      const translations ='), source.indexOf('      const $ =')), context);
  for (const name of ['t', 'formatMessage', 'refreshPreviewErrorLanguage', 'applyLanguage']) {
    const fn = [...source.matchAll(/^      function (\w+)\([^\n]*(?:\n[\s\S]*?^      \}|\{[^\n]*\})/gm)].find(match => match[1] === name);
    assert.ok(fn, `production ${name} exists`); vm.runInContext(fn[0], context);
  }
  vm.runInContext(source.match(/      \$\('#languageButton'\)\.addEventListener\('click', \(\) => \{[\s\S]*?^      \}\);/m)[0], context);
  for (const id of ['versionBadge', 'buildVersion']) vm.runInContext(source.match(new RegExp("      \\$\\('#" + id + "'\\)\\.textContent = [^\\n]+"))[0], context);
  context.applyLanguage();
  return { get: id => elements.get(id), context, click: () => handlers.get('languageButton:click')() };
}
for (const initial of ['ja', 'en']) test(`${initial}: real language handler exposes compact targets and localized Help names`, () => {
  const h = header(initial);
  for (const language of [initial, initial === 'ja' ? 'en' : 'ja', initial]) {
    const target = language === 'ja' ? '英語に切り替え' : 'Switch to Japanese';
    assert.equal(h.context.document.documentElement.lang, language);
    assert.equal(h.get('languageButton').textContent, language === 'ja' ? 'EN' : 'JA');
    assert.equal(h.get('languageButton').attributes['aria-label'], target);
    assert.equal(h.get('languageButton').title, target);
    for (const [id, label] of [['helpButton', language === 'ja' ? '使い方と注意事項' : 'How to use & notes'], ['closeHelpButton', language === 'ja' ? '閉じる' : 'Close']]) {
      assert.equal(h.get(id).attributes['aria-label'], label); assert.equal(h.get(id).title, label);
    }
    assert.equal(h.get('versionBadge').textContent, `v${config.version}`);
    assert.match(h.get('versionBadge').textContent, /^v\d+\.\d+\.\d+$/);
    assert.equal(h.get('buildVersion').textContent, config.version);
    h.click();
  }
});
