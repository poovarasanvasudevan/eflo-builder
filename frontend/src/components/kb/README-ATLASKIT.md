# Using Atlaskit Editor

The article create/edit/view pages use a **Confluence-style layout** (breadcrumbs, DRAFT status, title, description placeholder, Publish/Close footer) as in the reference image.

Currently the **body editor** is TipTap (rich text, stored as JSON) so the app builds cleanly with Vite. The Atlaskit editor ([editor-core](https://atlaskit.atlassian.com/packages/editor/editor-core)) is available in this folder for when you want to switch:

- `AtlaskitKBEditor.tsx` – full-page Atlaskit Editor (ADF document)
- `AtlaskitKBRenderer.tsx` – Atlaskit ReactRenderer for read-only ADF

To use Atlaskit instead of TipTap:

1. **Resolve build issues** (Vite + Atlaskit): e.g. add missing deps (`@atlaskit/media-core`, `@atlaskit/link-provider`), fix `lru-fast` / `events` and other CJS/ESM or browser-externalized modules (e.g. via `vite.config` `resolve.alias`, `optimizeDeps`, or `build.rollupOptions.external`).
2. In **KBArticleEdit.tsx**: replace the `KBEditor` block with `AtlaskitKBEditor`, pass `initialContent` (ADF), use `onEditorReady` to capture `editorActions` and call `actions.getValue()` when saving.
3. In **KBArticleView.tsx**: replace the `KBEditor` (read-only) block with `AtlaskitKBRenderer` and pass `document={article.content}` (ADF).

Content is stored as JSON; TipTap and ADF use similar `doc`/`content` structures so migration is straightforward.
