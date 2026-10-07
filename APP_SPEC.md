# APP_SPEC.md

## 1. Product identity

- **Name:** Local Form Builder
- **Japanese name:** ローカルフォーム作成
- **Slug:** `local-form-builder`
- **Current version:** `1.0.1`
- **One-sentence purpose:** Build a local-first form in the browser, configure validation, preview the real controls, and export the form itself as a portable standalone HTML file.
- **Primary users:** People creating event sheets, inspection forms, surveys, checklists, and interview sheets for use on PCs, phones, or tablets without a cloud form service.
- **Release artifacts:** `dist/index.html` and `dist/index.self-extract.html`

## 2. Product direction

The product generates a self-contained form HTML that includes the form UI, validation, local response history, CSV export, JSON backup/restore, printing, and response deletion. It is intentionally not a Google Forms / Typeform replacement and will not provide accounts, cloud response collection, server synchronization, or shared dashboards.

The core product idea is:

> Build a form, then carry the HTML file itself to the device where it will be used.

v1.0.0 is the first stable release. The Builder and generated-form workflows are treated as one product: inline field editing, drag-to-insert, templates, capability-tested draft autosave, explicit startup resume/new choices, safe HTML re-import, standalone export, local response history, CSV/JSON, Normal/Continuous entry, search, and printing.

## 3. Stable v1.0.0 scope

v1.0.0 keeps the six Builder templates, local Builder draft autosave, startup resume/new handling, generated-HTML re-import, and mobile/accessibility behavior. The empty-canvas guidance is visible whenever the editable form contains zero fields, disappears immediately after a field is added, and returns if all fields are later removed. Field editing occurs inline on the selected form card, with choices adjacent to the question, polished advanced controls, and an explicit quick-add picker that supports both click-to-append and drag-to-insert. Re-import reads only the inert `local-form-schema` JSON block, preserves `formId`, and advances `formVersion` by one. Generated-form workflows remain unchanged in the stable release.

A user can:

1. Set the form title and description.
2. Add all v1.0 core field types.
3. Select a field and edit its content, helper text, placeholder, required state, initial value, and applicable validation rules.
4. Add, rename, reorder, and delete choices for radio, select, and checkbox-group fields.
5. Duplicate, reorder, and delete fields with Undo for deletion.
6. Switch the form canvas between **Edit** and **Preview**.
7. In Preview, enter sample values into real controls and run validation without saving a response.
8. Preview the form at desktop or mobile width on desktop screens.
9. Set a generated filename separately from the `.html` extension.
10. Export the current form as one standalone HTML file.
11. Open that generated HTML directly with `file://` and use all configured fields, default values, helper text, and validation without the Builder.
12. Switch Japanese / English Builder UI without changing user-authored form text. The generated form uses the Builder UI language active at export time.
13. Use the Builder at smartphone width through mobile page tabs rather than a long three-column layout.
14. In the generated form, export saved responses as CSV.
15. Save a complete JSON backup containing the current form schema and all saved responses.
16. Restore JSON backups by adding non-duplicate responses or replacing the current response history.
17. Choose **Normal** entry for a save-completion screen with Next response / Response history actions.
18. Choose **Continuous** entry for reception-style use: after a new response is saved, show a short completion state and automatically reset to the form.
19. Search saved response history locally.
20. Print a blank copy of the form or print an individual saved response.
21. Expand/collapse Input / Choice / Layout field groups while the bounded Fields panel scrolls internally.
22. Start from Blank, Event reception, Site inspection, Survey, Checklist, or Interview sheet templates.
23. Auto-save Builder schema/output filename locally when Builder storage passes a read/write probe.
24. Choose Continue editing or Start new when a meaningful previous Builder draft exists.
25. Re-import HTML previously exported by Local Form Builder without executing imported HTML.
26. Preserve the re-imported `formId` and advance `formVersion` by one.

The application maintains an explicit serializable form schema in memory. Generated forms persist responses when storage capability testing succeeds. Builder draft autosave and generated-form response persistence are separate local-storage workflows and are both part of the v1.0.0 stable behavior.

## 4. Field types

Input fields:

- `text` — single-line text
- `textarea` — multi-line text
- `email` — email address
- `tel` — phone number
- `number` — numeric input
- `date` — date input
- `time` — time input
- `radio` — choose one from visible options
- `select` — choose one from a dropdown
- `checkbox` — single boolean confirmation
- `checkboxGroup` — choose multiple options

Display fields:

- `heading`
- `paragraph`
- `divider`

## 5. Field properties

### Common input properties

Where applicable, an input field supports:

- `label`
- `helper`
- `required`
- `defaultValue`

### Placeholder

The following types support `placeholder`:

- `text`
- `textarea`
- `email`
- `tel`
- `number`

### Choice fields

The following types support `options`:

- `radio`
- `select`
- `checkboxGroup`

The Builder provides visible per-option editing. A choice can be added, renamed, moved up/down, or deleted. At least one choice must remain.

Default values:

- `radio` / `select`: empty string or one option value.
- `checkboxGroup`: array of selected option values.
- `checkbox`: boolean.
- text-like/date/time/number fields: string representation suitable for the HTML control.

Renaming or deleting a choice must not leave a selected default pointing to a removed value. Inline and inspector actions share the same choice mutations. Added choices use an unused localized name, including after deletion. Names commit on change/blur; a blank or duplicate name is restored to the previous value with a localized notice. A valid trimmed rename carries its default and sample answer to the new value. Adding/reordering retains valid selections; deletion removes only deleted selections and clamps non-null selection-count bounds. Choice edits clear the affected preview error and obsolete export status without changing sibling answers.

### Display fields

- `heading` and `paragraph` use `label` as visible content.
- `divider` has no editable visible label.

## 6. Validation model

Validation data is part of the serializable field schema and must behave the same in Builder Preview and exported HTML.

### Required

All input fields support `required`.

- text-like, number, date, time, select, and radio fields require a non-empty value.
- `checkbox` requires the checkbox to be checked.
- `checkboxGroup` requires at least one selection unless a stricter `minSelections` is configured.

### Text length

`text`, `textarea`, `email`, and `tel` support `minLength` / `maxLength` as non-negative integers or `null`.

### Email format

`email` validates browser-compatible email syntax when a non-empty value is entered.

### Number range and step

`number` supports `min`, `max`, and positive `step`, each nullable.

### Date range

`date` supports `minDate` / `maxDate`; an empty string means no bound.

### Checkbox-group selection count

`checkboxGroup` supports nullable non-negative `minSelections` / `maxSelections`, clamped to the available option count.

### Validation editor behavior

- Validation settings appear only when relevant to the selected field type.
- Numeric validation settings do not clamp on every keystroke. They normalize on committed `change`/blur.
- Empty numeric validation controls mean “no limit”.
- Raw regex/custom-script validation is not exposed in v0.8.0.

## 7. Form schema

State remains explicit and serializable. Visible labels are never internal identifiers. Duplicating a field copies its current settings but always allocates a new field ID.

The schema remains versioned with:

```json
{
  "schemaVersion": 1,
  "formId": "stable-form-id",
  "title": "現場点検票",
  "description": "設備の状態を確認します。",
  "inputMode": "normal",
  "fields": []
}
```

## 8. Builder desktop UX

Desktop uses three related areas:

- **Fields:** grouped field type palette.
- **Form:** current form canvas, Edit / Preview switch, and ordering controls in Edit mode.
- **Settings:** form properties, generated HTML output, and selected field inspector.

The form canvas remains the visual center.

In **Edit** mode:

- field cards are selectable;
- field toolbars and desktop drag ordering are available;
- preview-like controls inside cards are non-interactive and must not swallow field selection.

In **Preview** mode:

- field editing toolbars disappear;
- actual input controls are interactive;
- the form is not saved as a response;
- validation can be executed with **Check input**;
- desktop screens provide Desktop / Mobile preview-width controls.

## 9. Smartphone UX

At narrow widths, use the template's canonical mobile page-tab pattern with three pages:

- Form
- Fields
- Settings

Only the active page is shown on smartphones. Desktop still shows all areas together.

Adding a field from Fields returns the user to Form. Tapping an edit-mode field preview opens Settings. All editing remains possible without drag-and-drop.

The exported HTML must itself be mobile-first: one column, no horizontal page overflow, large tap targets, long-label wrapping, and actions reachable without a fixed UI covering content.

## 10. Interactive Preview

Preview is a validation sandbox, not response storage.

- Initial Preview values come from each field's `defaultValue`.
- Values entered in Preview are kept only in page memory.
- Optional radio fields expose **Clear selection** in Preview and generated forms. It records an explicit empty answer, clears only that field's error, refreshes the error summary, and returns focus to its first radio control. It preserves sibling answers/errors and the authored schema/defaults. Required radios and other field types do not expose this action.
- **Reset input** restores Preview to current default values, including after clearing a radio selection.
- Schema edits invalidate affected Preview values so stale choice/default data is not carried forward.
- Switching languages must not translate user-authored form text. Visible Preview errors switch language without revalidating: preserve the last checked error set and parameters, even if answers have since changed. Do not expose errors on untouched or reset forms. Preserve sample answers, authored schema, draft status, and the customized output filename.
- Switching Edit / Preview must not mutate the schema.

## 11. Validation error UI

Validation errors are shown next to the affected field, not only in a page-level summary.

When **Check input** is pressed in Builder Preview or the exported form:

1. Validate all input fields in schema order.
2. Show localized per-field errors.
3. Show a summary with the number of invalid fields.
4. Scroll the first invalid field into view.
5. Move keyboard focus to the first invalid input control.

Error state uses text plus visual styling; color alone is insufficient. Controls expose `aria-invalid` and helper/error associations through `aria-describedby` where applicable.

A valid check must not imply that a response was saved.

## 12. Field workflow

The Builder stores `inputMode` in the form schema. Supported values are:

- `normal` — after saving a new response, show an explicit completion screen with the saved time, total local response count, **Next response**, and **Response history** actions.
- `continuous` — intended for reception / survey use. After saving a new response, show a brief thank-you state, then reset the form and return focus to the next input automatically. Response history remains reachable through the management action.

Editing an existing response never auto-advances: the user sees the completion state and chooses the next action explicitly.

Response history includes a local search box. Search covers visible field labels/values and response dates; it never sends a query externally.

Printing supports:

- a blank copy of the current form;
- one saved response from the response detail dialog.

Print-only CSS removes navigation/management controls while retaining the form and, for saved-response printing, a response timestamp line.

## 13. Generated HTML export

### Output action

The Settings area exposes a real export section in v0.8.0.

- The filename base is editable.
- `.html` is displayed separately and appended automatically.
- A safe default is derived from the current form title.
- After the user edits the filename manually, later title edits must not silently overwrite that custom filename.
- Invalid Windows filename characters and reserved device names are normalized before export.
- Export remains disabled until the form has at least one field.

### Output contents

The generated file is one complete HTML document containing:

- responsive form UI;
- all current form fields;
- configured default values;
- validation rules and localized validation messages;
- helper text and required indicators;
- Reset input and Check input actions;
- the serializable form schema;
- generator/version/language metadata;
- CSS and JavaScript required to run the form.

It must not require the Builder, another file, a CDN, an API, a runtime package download, or a server.

### Generated schema package

The generated HTML embeds an inert JSON block with id `local-form-schema` using this envelope:

```json
{
  "format": "browser-kitty-local-form",
  "formatVersion": 1,
  "generator": {
    "name": "Local Form Builder",
    "version": "0.8.0",
    "generatedAt": "..."
  },
  "language": "ja",
  "form": {}
}
```

User-authored `<` characters must be escaped in the embedded JSON so strings such as `</script>` cannot terminate the inert script element.

v0.8.0 uses this metadata for safe Builder re-import. The Builder parses the inert JSON block only; it does not execute scripts or markup from the imported HTML. A successful re-import preserves `formId` and sets the editable schema to the previous `formVersion + 1`.

### Generated runtime security

Generated HTML uses a restrictive CSP including:

```text
connect-src 'none'
```

It contains no runtime external resource URLs, analytics, telemetry, fetch/XHR, WebSocket, or form submission target.

### Local response storage — current

Generated forms perform a real storage capability test at startup and choose the first working mode in this order:

1. IndexedDB
2. localStorage
3. In-memory fallback

The test writes, reads, verifies, and deletes a probe value. API presence alone is not considered proof that storage works.

When persistent storage is unavailable, the form remains usable but displays a visible warning that response history may be lost when the page closes.

Saved responses include `responseId`, `formId`, `formVersion`, `schemaVersion`, `createdAt`, `updatedAt`, and field-ID keyed `values`.

Generated forms provide response history, response detail, edit, duplicate-as-new, individual delete, and delete-all. Destructive deletion uses an explicit in-page confirmation dialog.

### CSV export — current

Generated forms export response history as CSV for spreadsheet analysis.

- Encoding is UTF-8 with BOM.
- Line endings are CRLF.
- The first columns are `response_id`, `created_at`, and `updated_at`, followed by input-field labels in schema order.
- Duplicate visible labels are made unique with suffixes such as ` (2)`.
- CSV quoting covers commas, quotes, and embedded line breaks.
- Cells whose leading content could be interpreted as a spreadsheet formula (`=`, `+`, `-`, `@`, including leading whitespace before them) are prefixed so they remain text when opened in common spreadsheet software.
- Checkbox values export as `true` / `false`; checkbox-group values use a readable ` | ` separator inside the correctly quoted CSV cell.

### JSON backup / restore — current

Generated forms can create a complete local backup with this envelope:

```json
{
  "format": "browser-kitty-local-form-responses",
  "formatVersion": 1,
  "exportedAt": "...",
  "generator": {},
  "form": {},
  "responses": []
}
```

The backup includes the full current form schema plus every saved response. Restore validates the backup before modifying local data.

Restore rules:

- The backup format and format version must be supported.
- `form.formId` must match the generated form currently open.
- `form.schemaVersion` and every restored response `schemaVersion` must match the supported schema version.
- Response IDs must be non-empty and unique inside the backup.
- Response timestamps and values must have the expected basic structure.
- Invalid response records are excluded and reported.
- **Add** keeps current responses and skips imported response IDs already present locally.
- **Replace** removes the current response history and writes only valid responses from the backup. The restore dialog explicitly presents this as a destructive choice before it runs.
- An invalid non-empty backup with zero valid response records cannot be used to replace current data. An intentionally empty valid backup may replace the history with zero responses.
- Restore reports added/restored, skipped, and invalid counts.

CSV and JSON files are created or read only through explicit user actions. They are never uploaded or synchronized automatically.

## 14. Reordering, duplication, deletion, and Undo

Edit-mode field cards expose:

- Drag handle (desktop convenience)
- Move up
- Move down
- Duplicate
- Delete

The selected-field inspector also exposes Duplicate and Delete.

Deleting a field is reversible and happens immediately using `AppToast.show()` with Undo. Restore the field to its previous index and restore selection when appropriate.

No native `window.confirm()` is used for reversible field deletion.

## 15. Data and privacy

- Builder Preview values remain in page memory. Builder schema/output filename are auto-saved locally when the Builder storage probe succeeds.
- Generated-form responses are stored only on the current device when IndexedDB or localStorage passes the capability test.
- If neither persistent mechanism works, responses fall back to page memory with a visible warning.
- Language preference may use local storage in the Builder.
- No user form content or generated-form input is sent over the network.
- No analytics, telemetry, remote fonts, CDN assets, or APIs.
- Builder and generated form runtime CSP keep `connect-src 'none'`.
- No third-party runtime dependency is required.

The generated form may state that input and exported backup data are processed locally and are not sent to an external server. File downloads and restore reads occur only after explicit user actions.

## 16. Non-goals for v1.0.0
- Conditional logic
- Calculated fields
- Photo, signature, barcode, QR, GPS, or file uploads
- Regex/custom-script validation
- Cloud synchronization
- Accounts or shared dashboards

## 17. Accessibility

- All controls have visible labels or accessible names.
- Keyboard focus is visible.
- Buttons are not distinguished by color alone.
- Form canvas field cards are keyboard selectable in Edit mode.
- Move up / Move down controls provide a non-drag ordering method.
- Choice rows also have non-drag move controls.
- Preview and generated-form validation focus the first invalid control.
- Validation errors use `aria-invalid` / `aria-describedby` where applicable.
- `aria-live` announces Builder editing/export status where useful.
- Generated form validation summary uses `role="alert"`.
- Motion respects `prefers-reduced-motion`.
- Help and confirmation dialogs remain fully scrollable/reachable on narrow displays.

## 18. Browser target

Current stable Chrome and Edge are primary targets. Firefox, Safari, Chrome Android, and Safari iOS are supported where practical.

Direct `file://` opening is required for:

- `dist/index.html`
- `dist/index.self-extract.html` after expansion
- exported generated form HTML

## 19. Output filename contract

The template's canonical `outputFilename` behavior marker is now a real user-visible filename-base input.

- It never includes the `.html` extension in the editable value.
- Export appends exactly one `.html` extension.
- The default follows the form title until the user customizes the filename.
- Export normalizes the filename again before download.

## 20. Acceptance criteria for v1.0.0

- `app.config.json` reports v1.0.0.
- All fourteen core field types remain available.
- Existing choice editing, default values, duplication, ordering, delete + Undo, bilingual UI, validation, Preview, and mobile page tabs still work.
- A visible filename input and **Export HTML** action are present.
- Export is disabled for an empty form and enabled once at least one field exists.
- The generated filename appends `.html` and is safe for common desktop filesystems.
- A generated HTML file contains no external runtime dependency and has `connect-src 'none'`.
- Generated HTML contains the form schema envelope with format/generator/language metadata.
- User strings containing HTML or `</script>` cannot break out of the schema block or become executable markup.
- Imported field IDs are untrusted data: escape them in Builder and Preview HTML attributes, including helper/error/label IDs and choice names. Draft resume and generated export preserve the original IDs and response keys without interpreting them as markup.
- All fourteen field types render in generated HTML.
- Initial/default values render correctly in generated HTML.
- Required, text length, email, number min/max/step, date min/max, and checkbox-group selection-count validation work in generated HTML.
- Invalid generated-form controls show localized errors and the first invalid control receives focus.
- A valid generated-form save creates or updates a local response record. Only one save may be in flight: capture its answers/edit identity, disable input/reset/history actions while saving, and ignore overlapping interactions. Storage failure keeps answers/edit identity, shows a localized retryable error, and releases controls. A committed write still completes if history refresh fails, avoiding a misleading save-failure retry. Intentional later saves, including Continuous entry, remain available.
- Storage capability is tested with a real write/read/delete round trip.
- IndexedDB is preferred, then localStorage, then memory-only fallback with a visible warning.
- Response history, detail, edit, duplicate, individual delete, and delete-all work without external communication.
- Response history CSV export uses UTF-8 BOM, CRLF, correct CSV quoting, unique duplicate-label headers, and spreadsheet-formula injection protection.
- JSON backup contains the current form schema and every saved response using `browser-kitty-local-form-responses` format version 1.
- Restore rejects another form ID, unsupported schema/backup versions, and malformed top-level backup data before changing current responses.
- Add restore skips existing response IDs and reports added / skipped / invalid counts.
- Replace restore is explicitly presented as destructive and replaces current history only with validated imported responses.
- Invalid response entries in an otherwise valid backup are excluded and counted instead of being silently accepted.
- Reset input restores generated-form default values.
- 390px generated-form layout has no horizontal page overflow.
- Generated form works when opened directly with `file://`.
- Builder runtime CSP retains `connect-src 'none'`.
- No runtime external resource, API, analytics, telemetry, or third-party dependency is introduced.
- Readable and self-extract Builder artifacts are generated and the self-extract payload restores byte-for-byte.
- Selected-field drag handles remain visually neutral and do not use the selected-field border/background treatment.
- Advanced settings controls use the Builder input styling rather than browser-default input/textarea chrome.
- Dragging a type from Add field or the left palette shows a clear before/after insertion marker and inserts at that position.
- Dragging into an empty form exposes a visible drop target.
- Existing-field drag reordering starts from the explicit drag handle; clicking a field still selects it for editing.
- README, Japanese README, help copy, changelog, and notices match v1.0.0 behavior.
- Empty-canvas guidance is visible exactly when the editable form contains zero fields and is hidden as soon as at least one field exists.

- Builder schema includes `inputMode` (`normal` or `continuous`) and generated HTML follows it.
- Normal mode shows a completion screen with response timestamp, response count, Next response, and Response history actions.
- Continuous mode confirms a save, resets input, and automatically returns to the next entry without exposing history as the primary action.
- Response history supports local text/date/value search without changing stored responses.
- Generated HTML can print a blank form and a saved response without printing management controls.
- The field palette groups Inputs / Choices / Layout are collapsible and the palette uses a bounded internal scroll area.
- Builder header matches the current htmlapps-template header structure and uses the canonical uploaded icon for both favicon and brand icon.
- Six built-in templates are available and applying one to a non-blank form requires explicit replacement confirmation.
- Builder draft autosave runs only after a real localStorage write/read/delete probe succeeds; unavailable storage is shown explicitly.
- A meaningful saved Builder draft triggers an explicit Continue editing / Start new startup choice.
- Generated HTML re-import reads only `script#local-form-schema[type="application/json"]` from the selected file and never executes imported HTML.
- Re-import rejects unsupported format/version/schema data, preserves `formId`, and advances `formVersion` by one.
- Smartphone layout remains free of horizontal page overflow with long form titles and provides at least 44px action targets for Working data actions.
- Release assets include `assets/screenshot.png` and `assets/screenshot-en.png`, captured from the current v1.0.0 UI without transient dialogs, errors, or toasts.

## 21. Post-v1.0 candidates

Future work should be driven by real usage rather than delaying the stable release. Candidate areas include:

- Conditional logic
- Calculated fields
- Photo / camera input
- Signature input
- QR / barcode scanning
- GPS fields
- Response-included standalone HTML export
- Optional passphrase encryption for local response data


## v1.0.1 header contract

- The language button shows its target as `EN` in Japanese and `JA` in English, with matching localized title and accessible name: `英語に切り替え` / `Switch to Japanese`.
- Header version is `v` plus the canonical `app.config.json` version; Help controls retain localized titles and accessible names.
- Language changes preserve authored content and existing output state. Privacy remains `完全ローカル処理` / `Fully local processing`.
