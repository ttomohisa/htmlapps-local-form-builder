# Form interaction regressions

Run `node --test tests/form-interactions.cjs tests/choice-editing.cjs` against source, or set `FORM_BUILDER_HTML` to the root/readable/decoded self-extract HTML. The tests execute actual Preview handlers and the full generated runtime with synthetic DOM/storage boundaries. They cover optional radio clearing, bilingual labels, escaped IDs, defaults/reset, sibling state/error summaries/focus, concurrent and failed saves, edit context, retry, and Continuous entry. The IndexedDB adapter tests exercise actual `putResponse` with deferred requests and transaction completion/abort; they do not use real IndexedDB or a browser.

Browser acceptance: in Preview and an exported form, choose then clear an optional radio with a default; verify keyboard focus, other answers, validation, Reset input, and a saved empty response. Repeat in both languages, Normal/Continuous modes, editing an existing response, desktop and narrow layouts. Rapidly press Save twice, try Reset/history during the pending save, and verify one stored response. Test storage failure/retry and direct file opening separately.

# Choice editing regressions

Run the dependency-free production-handler tests:

```sh
node --test tests/choice-editing.cjs
FORM_BUILDER_HTML=dist/index.html node --test tests/choice-editing.cjs
```

These execute the actual inline event handlers, choice helpers, preview validator, and HTML export generator in a Node VM; rendering/DOM boundaries are stubbed. They cover Japanese/English option generation, delete/add sequences, manual rename commit/rejection, min/max clamping, radio/select/checkbox-group defaults and sample answers, sibling state, and exact exported schema. They do not replace browser interaction tests.

Browser acceptance: create a small form normally (no import), set a required checkbox group to min/max 2, delete one option, and verify the remaining answer validates. Delete the first choice then add a choice and verify unique values. Enter a preview answer, return to Edit, rename/add/reorder/delete, and check that surviving selections remain. Try blank/duplicate names, keyboard Tab, and a rename followed immediately by an action button. Repeat in Japanese and English at desktop/narrow widths. Export with an edited filename, inspect the actual downloaded schema, and reload/resume the draft.

# Imported field ID browser regression

Build the app first with `scripts/check-repository.ps1`. The browser test requires Node.js, Playwright, and Microsoft Edge for development only; no runtime dependency is added to the standalone app.

```powershell
$env:PLAYWRIGHT_MODULE = 'path/to/node_modules/playwright'
$env:FORM_BUILDER_DIRECT_FILE = '1'
node --test tests/imported-field-ids.cjs
$env:FORM_BUILDER_HTML = 'dist/index.self-extract.html'
node --test tests/imported-field-ids.cjs
```

Omit `PLAYWRIGHT_MODULE` when Playwright is resolvable normally. `FORM_BUILDER_HTML` defaults to `dist/index.html`; `PLAYWRIGHT_CHANNEL` defaults to `msedge`. Without `FORM_BUILDER_DIRECT_FILE`, the Builder is served on loopback. Exported forms are always opened directly with `file://`.

The synthetic imported schema contains an attribute-breaking field ID in all fourteen field types. The test checks inert import and draft resume, original IDs in edit/preview attributes, preview validation, standalone export, response save, and preservation of the exact response key in JSON backup. It blocks off-origin HTTP requests and fails on page errors. It uses a temporary directory and an isolated browser context.


# Preview language regression

`node --test tests/form-interactions.cjs tests/header-language.cjs` also executes real validation, language, input, optional-clear, and reset handlers. It checks all thirteen validation message types in both language directions, including interpolated number/date limits; retains the last checked result when answers change; leaves untouched/reset forms error-free; and preserves authored schema, sample answers, output filename/customization, draft status, and focus. As above, repeat with `FORM_BUILDER_HTML` for readable, root, and decoded self-extract artifacts. Browser-native email validity is a synthetic boundary in the Node harness.

# Builder overlay layout regressions

Run `node --test tests/overlay-layout.cjs` against source, or set `FORM_BUILDER_HTML` to the readable/root/decoded self-extract HTML. The canonical `scripts/check-repository.ps1` includes this suite. To run all dependency-free source suites, use `node --test tests/header-language.cjs tests/form-interactions.cjs tests/choice-editing.cjs tests/overlay-layout.cjs`.

The eight tests check root/body modal-lock CSS, the ordinary confirmation shrink chain, the mobile Quick Add safe-viewport-top/navigation height budget, recovery of the global-header allocation in a short viewport, unchanged Help layout, actual confirmation cancellation/OK/reopen handlers, actual picker toggle/Close/Escape/selection handlers, and preservation of the mandatory startup draft decision. These are CSS source contracts and Node VM interaction tests with synthetic DOM boundaries; they do not calculate browser geometry or simulate a keyboard.

Native acceptance: repeat Help at 1180 × 757 and 393 × 252, wheel outside it, reach the final Help paragraph internally, and close/reopen. In a synthetic nonblank form, use Settings → New form; reach Cancel/Continue at 393 × 252 without clipping the heading/Close control. Cancel with Close, Cancel, Escape, and backdrop; verify the form is unchanged and page scrolling resumes. Open Add field from both entry buttons at 393 × 252; wheel/Tab/Shift+Tab to all fourteen choices and Close above the bottom navigation, then select an item, Escape, and reopen. Repeat in Japanese/English, desktop/narrow widths, resize/rotation, and a real mobile on-screen keyboard. Continue a known synthetic saved draft and verify title, fields, required state, and filename survive; Escape must not dismiss that mandatory choice. Generated export/save-format and file/response-history routes retain their separate browser acceptance.
