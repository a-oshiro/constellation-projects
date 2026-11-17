# Prompt for Claude Code

Copy everything below the line into Claude Code, opened at the root of your repo. Change the path if you unzipped the package somewhere else.

---

I want to implement the **account disclosure Snippets feature**, meaning the **Snippet Card** and the **Snippet Drawer** ("Create Text Snippet"), in this codebase. A reference implementation from a sister app (React 19 + TypeScript + MUI) is in `./_imports/snippets-drawer-export/`.

Please:

1. **Read the spec first:** `./_imports/snippets-drawer-export/SNIPPETS.md`. It is the source of truth for behavior. Then look at the screenshots in `screenshots/` and read `README.md` for the file map.
2. **Read the reference source** in `source/`, starting with:
   - `DisclosureSnippetDialog.tsx`, the drawer
   - `DisclosureSnippetEditor.tsx`
   - `SnippetVersionHistory.tsx`
   - `DisclosureSourcePane.tsx`
   - `DisclosuresTab.tsx`, the card and its state changes
   - `src/utils/disclosureSnippet*.ts`
   - `src/data/enrollmentSettings.ts`, for the types
3. **Explore this codebase** before writing anything. Find:
   - Where account settings or disclosures live, and where the card should go.
   - The existing component library, theme tokens, toast or snackbar system, modal and drawer patterns, and z-index scale.
   - How state is persisted (API, store, React Query and so on), and the current-user source.
   - Whether a server-side route already exists that can proxy OpenAI.
4. **Make a short plan and show it to me before implementing.** The plan should map each reference file to where it will live here, and list what to reuse from this codebase instead of copying. Reuse means our toasts, our current user, our persistence, and our modal and drawer primitives if they fit.
5. **Implement in this order:**
   1. The types and data model.
   2. The utilities: colors, formatting, diff, AI and mock.
   3. The editor.
   4. The drawer, with its version history and comparison view.
   5. The card, the footer actions, and the Update and Remove dialogs.
   6. Wiring into the page.
6. **Rules:**
   - Keep the behavior in `SNIPPETS.md` exactly: the button states, disabled reasons and tooltips, snackbar messages, append-only versions, the restore semantics, color matching, `{` opening the picker, Enter and paste handling, and the mm/dd/yyyy expiration field.
   - Use this codebase's styling conventions and design tokens. Only use the reference's hard-coded hex values where we have no equivalent token.
   - Drop the prototype-only pieces listed at the end of `SNIPPETS.md`. For example, `widgetWidth` is always 0. The client-role notifications are only needed if our app has a client role.
   - Never ship the OpenAI key to the browser. Call it through a server route. Support `VITE_DISCLOSURE_AI_MODE=mock`, or our equivalent, for local work.
   - Every MUI Popper or Popover rendered inside the drawer must sit above the drawer's z-index.
7. **Verify:**
   - Typecheck and lint.
   - Run the app, generate a snippet, and open the drawer.
   - Exercise Write/Preview, formatting, Add Variable, clicking a chip to replace it, the comparison view, the Metadata fields, Save, the History tab (view an old version, then Restore), Update Snippet and Remove snippet.

Ask me before making any design decision that `SNIPPETS.md` doesn't cover.
