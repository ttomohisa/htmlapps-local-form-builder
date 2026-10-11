const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const { gunzipSync } = require('node:zlib');

const rejected = [
  "使い方や置き換え確認を開いている間、背景はスクロールしません。長い内容は画面内でスクロールし、確認の操作ボタンまで進めます。",
  "While Help or a replacement confirmation is open, the background stays still. Scroll inside long content to reach the confirmation actions.",
  "画面下部の「フォーム構造（開発確認）」で、現在のフォームがシリアライズ可能な構造になっていることを確認できます。",
  "Use Form schema (development check) at the bottom to verify that the current form is stored as serializable data.",
  "画面下部の「フォーム」「項目」「設定」で作業画面を切り替えます。ドラッグ操作を使わなくてもすべての操作ができます。「項目を追加」の一覧は下部ナビゲーションの上でスクロールできます。",
  "Use Form, Fields, and Settings in the bottom bar to switch work areas. Every operation is available without drag-and-drop. The Add field list scrolls above the bottom navigation.",
  "テンプレート、HTML再編集、単一HTML出力、回答履歴、CSV / JSON、印刷まで一つのHTMLで利用できます。読み込む項目の識別子もデータとして扱い、HTMLとして実行しません。HTML再読込時はformVersionを1つ進めます。",
  "Templates, HTML re-editing, standalone export, response history, CSV / JSON, and printing are available in the stable release. Imported field identifiers are treated as data, never HTML. Re-import advances formVersion by one."
];

test('help contains user guidance rather than implementation or layout audit prose', () => {
  const root = path.join(__dirname, '..');
  const files = ['src/index.template.html', 'dist/index.html', 'dist/index.self-extract.html',
    ...fs.readdirSync(root).filter(name => name.endsWith('.html'))];
  for (const file of files) {
    const filename = path.join(root, file);
    if (!fs.existsSync(filename)) continue;
    let html = fs.readFileSync(filename, 'utf8');
    const payload = html.match(/<script id="self-extract-payload"[^>]*>([\s\S]*?)<\/script>/);
    if (payload) html = gunzipSync(Buffer.from(payload[1].replace(/\s/g, ''), 'base64')).toString('utf8');
    for (const copy of rejected) assert.ok(!html.includes(copy), `${file}: remove internal-facing help copy: ${copy}`);
  }
});
