# Changelog

## [Unreleased]

### Fixed
- Use shared choice mutations for inline add/reorder/delete, generate unused names after deletion, and clamp checkbox-group selection bounds to the remaining choices.
- Preserve valid defaults and sample answers across choice edits; validate committed names and clear stale field errors/export status.
- Escape imported field identifiers in Builder and Preview HTML attributes so crafted schema IDs remain inert, including after draft resume. Preserve identifiers and response keys through standalone export.

### Verified
- Added an Edge browser regression covering malicious identifiers across all fourteen field types, preview validation, draft resume, and generated-form export.

## [1.0.0] - 2026-09-22

### Changed
- Promoted Local Form Builder from the release candidate to the first stable release after the end-to-end Builder / generated-form regression pass.
- Removed the duplicated large page title below the header; the compact overview now keeps only the purpose text and the Fully local processing badge.
- Rewrote the English and Japanese READMEs to match the Browser Kitty / PDF Organizer release format, including live demo, quick start, usage, privacy, limitations, build layout, and GitHub Pages guidance.
- Refreshed release screenshots for the final v1.0.0 UI.

### Verified
- Preserved all fourteen core fields, inline editing, drag-to-insert, templates, Builder autosave/resume, safe HTML re-import, standalone export, local response history, CSV/JSON backup, printing, and Normal / Continuous workflows.
- Preserved the supplied favicon / brand icon, runtime `connect-src 'none'`, no third-party runtime dependency, and readable / self-extract single-HTML outputs.

## [0.9.0] - 2026-09-22

### Changed

- Entered release-candidate phase: feature scope is frozen while Builder, generated-form, mobile, bilingual, offline, export, backup/restore, printing, CSP, and self-extract flows are regression-tested for v1.0.0.
- Corrected the empty-canvas guidance behavior: “No fields yet” / 「まだ項目がありません」 is visible whenever the editable form has zero fields and disappears as soon as a field is added. If all fields are later removed, the guidance returns.
- Kept v0.8.2/v0.8.3 inline field editing, drag-to-insert, templates, draft autosave, HTML re-import, and generated-form workflows unchanged.

### Release candidate checks

- Verify all 14 field types, validation parity, templates, autosave/resume, safe HTML re-import, formVersion increment, response history, CSV/JSON, Normal/Continuous entry, search, printing, Japanese/English UI, 390px layout, CSP, runtime-network blocking, standalone generation, and self-extract restoration.

## [0.8.3] - 2026-09-22

### Changed

- Show the “No fields yet” / 「まだ項目がありません」 onboarding only for the untouched initial empty canvas.
- Once a field has been added, removing every field leaves a clean canvas instead of repeating the beginner guidance.
- Kept the v0.8.2 drag-to-insert, inline field editing, templates, autosave, HTML re-import, and generated-form workflows unchanged.


## [0.8.2] - 2026-09-22

### Changed

- Restyled inline Advanced settings with the same rounded controls, focus treatment, spacing, and surfaces used by the rest of the Builder instead of browser-default input styling.
- Made drag handles visually neutral when a field is selected; field selection no longer makes the handle look like an active control.
- Changed field reordering to start from the explicit drag handle rather than making the whole field card draggable.
- Added drag-to-insert from both the top Add field picker and the left field palette, with before/after insertion indicators and an empty-form drop target. Clicking still appends a field as a fallback.
- Preserved all v0.8.1 inline editing, templates, autosave, HTML re-import, standalone export, and generated-form workflows.


## [0.8.1] - 2026-09-22

### Changed

- Aligned the header content edges with the main 1480px workspace while retaining the current template header controls and spacing behavior.
- Rebuilt selected-field editing as an inline question card: question text and field type at the top, choices directly below, advanced settings collapsed in place, and duplicate/delete/required controls in the card footer.
- Replaced the ambiguous Add field jump behavior with an explicit quick-add picker in the form panel; the left field palette remains available for browsing.
- Kept all v0.8.0 templates, draft autosave, HTML re-import, standalone export, local response workflows, and mobile navigation intact.

## [0.8.0] - 2026-09-22

### Added
- Added six built-in form starters: blank, event reception, site inspection, survey, checklist, and interview sheet.
- Added Builder draft auto-save to localStorage after a real storage capability probe, with a visible unavailable state when storage cannot be used.
- Added startup resume flow with explicit **Continue editing** / **Start new** choices when a meaningful prior draft exists.
- Added generated-HTML re-import by reading only the inert `local-form-schema` JSON block without executing imported HTML.
- Re-import preserves `formId` and advances `formVersion` by one for the next exported revision.
- Added **New form** and **Import from HTML** actions in Settings.

### Changed
- Polished smartphone workflow around templates, working-data actions, long form titles, dialogs, and 46px mobile action targets.
- Builder auto-save is kept separate from generated-form response storage; only Builder schema/output filename state is stored by the Builder.
- Updated help, README files, and product specification for the v0.8.0 workflow.

## [0.7.0] - 2026-09-22

### Added
- Added Normal and Continuous entry modes to generated forms.
- Added save-completion workflow, response-history search, blank-form printing, and saved-response printing.
- Made Input / Choice / Layout palette groups collapsible with a bounded scrolling palette.

### Changed
- Aligned the Builder header with the current htmlapps-template header and updated its app-specific subtitle.
- Replaced the canonical favicon / app brand icon with the provided Local Form Builder SVG.

## 0.6.0 - Export / Backup - 2026-09-22

- Added generated-form CSV export with UTF-8 BOM, CRLF line endings, standards-compliant quoting, and unique headers for duplicate field labels.
- Added spreadsheet formula-injection protection for user-entered CSV cells that could otherwise be interpreted as formulas.
- Added complete JSON backup containing backup metadata, the full form schema, and all saved responses.
- Added JSON restore with explicit **Add** and destructive **Replace** modes.
- Add mode skips response IDs already present locally; Replace mode replaces the current history only after backup validation.
- Added backup validation for format/version, form ID, schema version, response IDs, timestamps, and response values structure.
- Added partial-invalid backup handling with explicit invalid-record counts instead of silently accepting malformed records.
- Added restore completion summaries for added/restored, skipped, and invalid counts.
- Kept CSV/JSON operations fully local and user-initiated with no runtime external communication.
- Preserved response history/edit/duplicate/delete behavior, all fourteen fields, validation parity, mobile layout, `connect-src 'none'`, and zero runtime external dependencies.
- Updated APP_SPEC, help, README files, and version metadata for v0.6.0.

### Not yet implemented

Printing, continuous-entry mode, Builder autosave, templates, generated-HTML re-import, and conditional logic remain later milestones.

## 0.5.0 - Local Responses - 2026-09-22

- Added generated-form response persistence with runtime capability testing.
- Added storage fallback order: IndexedDB, localStorage, then in-memory mode.
- Added a real write/read/delete probe before persistent storage is reported as available.
- Added a visible warning when only memory storage is available.
- Added response records with stable response IDs, form/schema versions, created/updated timestamps, and field-ID keyed values.
- Added response history, response detail, edit, duplicate-as-new, individual delete, and delete-all.
- Added explicit in-page confirmation for destructive response deletion.
- Preserved validation parity, all fourteen field types, standalone single-HTML output, `connect-src 'none'`, and zero runtime external dependencies.
- Added `formVersion` to the form schema for later generated-HTML re-edit compatibility.
- Updated APP_SPEC, help, README files, and version metadata for v0.5.0.

### Not yet implemented

CSV / JSON export and restore, printing, continuous-entry mode, Builder autosave, templates, generated-HTML re-import, and conditional logic remain later milestones.

## 0.4.0 - Single HTML Generator - 2026-09-22

- Added the first real generated-form export: the current Builder schema can now be saved as one standalone `.html` file.
- Added a user-editable filename base with the `.html` extension shown separately and safe filename normalization at export time.
- Kept automatic filename updates tied to the form title until the user customizes the filename manually.
- Added a self-contained generated-form runtime covering all fourteen field types, current default values, helper text, responsive layout, Reset input, and Check input.
- Preserved validation parity for required fields, text length, email format, numeric min/max/step, date ranges, and checkbox-group selection counts.
- Added localized per-field errors and first-invalid focus behavior to generated forms.
- Embedded the form schema in a versioned `browser-kitty-local-form` JSON envelope with generator, language, and format metadata for future re-edit support.
- Escaped user-authored `<` characters inside embedded JSON so form text such as `</script>` cannot break out of the inert schema block.
- Added a restrictive generated-form CSP with `connect-src 'none'` and no runtime external dependency.
- Kept generated-form responses intentionally ephemeral in v0.4.0 and made that limitation visible instead of exposing a fake Save action.
- Updated APP_SPEC, help, README files, and version metadata for v0.4.0.

### Not yet implemented

Local response storage/history, CSV / JSON export and restore, printing, Builder autosave, templates, generated-HTML re-import, and conditional logic remain later milestones.

## 0.3.0 - Validation & Preview - 2026-09-22

- Added schema-backed validation rules for required fields, text length, email format, numeric range/step, date range, and checkbox-group selection counts.
- Added Edit / Preview switching in the form canvas so validation can be exercised with real input controls without saving responses.
- Added desktop and mobile preview-width switching on desktop screens.
- Added localized per-field validation errors, an invalid-field count summary, `aria-invalid` / helper-error associations, and automatic scroll/focus to the first invalid field.
- Added Preview reset to restore current initial values.
- Added validation-setting normalization on committed edits rather than clamping numeric fields while typing.
- Preserved all v0.2.0 field types, choice editing, default values, duplication, ordering, delete + Undo, bilingual UI, smartphone page tabs, and `connect-src 'none'`.
- Kept Preview values ephemeral and clearly separated from later response persistence.
- Updated product spec, help, README files, notices, and version metadata for v0.3.0.

### Not yet implemented

Generated form HTML, response storage/history, CSV / JSON export, printing, Builder autosave, templates, and conditional logic remain later milestones.

## 0.2.0 - Complete field editor - 2026-09-22

- Added the remaining v1 core field types: email, phone, date, time, select, checkbox group, and divider.
- Grouped the field palette into Inputs, Choices, and Layout sections.
- Added an explicit choice editor for radio, select, and checkbox-group fields with add, rename, move up/down, and delete controls.
- Added initial-value editing appropriate to text-like fields, dates/times, single checkbox, single-choice fields, and checkbox groups.
- Added field duplication with a newly generated stable field ID.
- Added duplicate controls to both the field card toolbar and the selected-field inspector.
- Updated the form preview to render all fourteen field types and their current initial values.
- Fixed smartphone field selection so disabled preview controls do not swallow taps; tapping the preview now reliably opens the selected field settings.
- Preserved field delete + Undo, desktop drag ordering, mobile page tabs, bilingual UI, `connect-src 'none'`, and zero third-party runtime dependencies.
- Updated product spec, help, README files, notices, and version metadata for v0.2.0.

### Not yet implemented

Generated form HTML, validation execution, response storage/history, CSV / JSON export, printing, Builder autosave, templates, and conditional logic remain later milestones.

## 0.1.0 - Builder foundation - 2026-09-22

- Created Local Form Builder from the supplied Browser Kitty `htmlapps-template` foundation.
- Replaced the starter workspace with a three-area form Builder: field palette, form canvas, and settings inspector.
- Added seven initial field types: text, textarea, number, radio, checkbox, heading, and explanatory paragraph.
- Added form title/description editing and selected-field editing for labels/content, helper text, placeholders, required state, and basic radio options.
- Added explicit Move up / Move down controls plus desktop drag-and-drop ordering.
- Added reversible field deletion using the shared Toast + Undo pattern.
- Added a serializable in-memory form schema with stable form and field IDs.
- Added the canonical smartphone bottom page tabs for Form / Fields / Settings.
- Added bilingual Japanese / English UI without translating user-authored form content.
- Added Local Form Builder favicon / brand icon while preserving the template's canonical single-icon build contract.
- Updated product spec, help, README files, and repository metadata for v0.1.0.
- Kept runtime networking blocked with `connect-src 'none'` and introduced no third-party runtime dependency.
