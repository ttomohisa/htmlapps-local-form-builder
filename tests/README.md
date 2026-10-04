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
