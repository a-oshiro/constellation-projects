# Snippets Drawer: Export Package

Everything needed to port the **account disclosure snippet** feature (the Snippet Card, the Snippet Drawer, and the Disclosures flow that builds them) into another React + TypeScript + MUI app with Claude Code.

## What's inside

| Path | What it is |
|---|---|
| `SNIPPETS.md` | **Start here.** What a snippet is and exactly how the card and drawer behave. |
| `CLAUDE_PROMPT.md` | A ready-to-paste prompt for Claude Code in your repo. |
| `screenshots/` | Reference screenshots of the reference app, at 1440×900 scaled down. |
| `source/` | The reference implementation. Each file sits at its original path. |

### `source/`: file map

**Core: the drawer and the card**

| File | Role |
|---|---|
| `src/components/ui/enrollment/DisclosureSnippetDialog.tsx` | **The Snippet Drawer**: the "Create Text Snippet" panel. |
| `src/components/ui/enrollment/DisclosureSnippetEditor.tsx` | The contentEditable editor, with variable chips, the picker, formatting and undo. |
| `src/components/ui/enrollment/DisclosureSourcePane.tsx` | The comparison view's color-highlighted source text. |
| `src/components/ui/enrollment/SnippetVersionHistory.tsx` | The History tab. |
| `src/components/ui/enrollment/DisclosuresTab.tsx` | **The Snippet Card**, the footer actions, and all snippet state changes. It is the reference parent. |
| `src/components/ui/enrollment/UpdateSnippetDialog.tsx` | The diff dialog shown before "Update Snippet" is applied. |
| `src/components/ui/enrollment/RemoveSnippetDialog.tsx` | The confirmation shown before a snippet is removed. |

**Utilities and data**

| File | Role |
|---|---|
| `src/utils/disclosureSnippetColors.ts` | The palette, value-to-variable color mapping and highlight segments. |
| `src/utils/disclosureSnippetFormatting.ts` | Preview rendering: markdown-lite to HTML, with sample values substituted. |
| `src/utils/disclosureSnippetAI.ts` | The OpenAI templatizer, template consolidation and replacement merging. |
| `src/utils/disclosureSnippetMock.ts` | The offline mock templatizer and the fixed boilerplate. |
| `src/utils/disclosureDiff.ts` | The word diff used by the Update dialog and the raw diff view. |
| `src/utils/diffEditorMarkup.ts` | Paints the green "added" highlight in the editor. |
| `src/data/disclosureVariables.ts` | The variable catalog: key, label, category and sample value. |
| `src/data/enrollmentSettings.ts` | The types (`AccountDisclosureSnippet`, `DisclosureSnippetMeta`, `DisclosureSnippetVersion`, `DisclosureBlock`…) and default test data. |

**Disclosures page pieces (needed if you port the whole build flow)**

| File | Role |
|---|---|
| `src/components/ui/enrollment/DisclosureRawInput.tsx` | The raw disclosure input. |
| `src/components/ui/enrollment/DisclosureDiffView.tsx` | The diff view of the raw text. |
| `src/components/ui/enrollment/DisclosureWarningsDialog.tsx` | The dialog behind the Warnings (n) tag. |
| `src/components/ui/enrollment/TemplateLoadingSkeleton.tsx` | The loading placeholder while a template generates. |
| `src/components/ui/enrollment/ClientDisclosuresView.tsx` | The client role's submission view. |
| `src/components/ui/enrollment/DisclosureUi.tsx` | `MaskedIcon` and `HeaderTag`. |
| `src/components/ui/enrollment/disclosureStyles.ts` | Shared styles and tag tones. |
| `src/components/ui/Expandable.tsx` + `src/index.expandable.css` | The animated accordion body. The CSS is an excerpt of `index.css`. |

**App plumbing (swap for your own)**

| File | Role |
|---|---|
| `src/context/SnackbarContext.tsx` + `src/components/ui/Snackbar.tsx` | Toasts. |
| `src/context/TestWidgetContext.tsx` | Prototype only. `widgetWidth` should be `0`. |
| `src/context/notifications.ts`, `NotificationsContext.tsx` | Activity notifications. Only the client-submission flow uses them. |
| `src/context/userRole.ts`, `UserRoleContext.tsx` | The internal/client role switch. |

**Server**

| File | Role |
|---|---|
| `api/fetch-urls.ts` | The server-side OpenAI Responses API proxy. It reads `OPENAI_API_KEY` and supports cancellation. |
| `vercel.json` | Turns on `supportsCancellation` for that function. |
| `vite.config.api-middleware.ts` | An excerpt of the dev-server middleware that serves `api/*.ts` locally. |

**Assets**

| File | Role |
|---|---|
| `src/assets/icons/disclosures/*.svg` | Icons for the card and footer: page-text-link, pencil, circle-x, refresh and chevron. |

### Not included (provide your platform's equivalents)
- `src/data/mockData.ts`: only `CURRENT_USER.name` is used, for `createdBy`.
- `src/data/accounts.ts`: only `NotificationsContext` uses it, to seed notifications.
- The pages that mount `DisclosuresTab`:
  - `EnrollmentSettingsTabContent.tsx`, on the account Settings page, which passes `accountId`.
  - `EnrollmentSettingsPanel.tsx`, at project level, which passes no `accountId`.

## Dependencies
- `react` 19
- `@mui/material` and `@mui/icons-material` v9. v5 to v7 should work with small changes to `slotProps` and `renderValue`.
- `@emotion/react` and `@emotion/styled`
- The Roboto font
- No other runtime libraries. The editor, diff and markdown rendering are hand-written.

## Environment
- `OPENAI_API_KEY`, server-side only. **Never** expose it as `VITE_*`.
- `VITE_DISCLOSURE_AI_MODE=mock` skips OpenAI and uses the local templatizer, which is useful for UI work.

## How to use with Claude Code
1. Unzip this folder somewhere inside or next to your repo, for example `./_imports/snippets-drawer-export/`.
2. Open Claude Code in your repo.
3. Paste the contents of `CLAUDE_PROMPT.md`, adjusting the path if needed.
4. Claude will read `SNIPPETS.md` and the source, map them onto your codebase's conventions, and implement the feature.
