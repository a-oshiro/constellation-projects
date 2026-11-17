# Snippets: the Snippet Card and Snippet Drawer

This is the behavior spec for the account **disclosure snippet**: what a snippet is, how the **Snippet Card** on the Disclosures page behaves, and how the **Snippet Drawer** (the full-height "Create Text Snippet" panel) behaves.

The reference implementation is in `source/`. Screenshots are in `screenshots/`. If this document and the code disagree, follow the code and flag the difference.

---

## 1. What a snippet is

A **snippet** is one reusable block of legal disclosure text for an account (a dealership). Automated offers use it to print the fine print under each ad.

- The snippet is a **template**. Values that change from one offer to the next (price, APR, term, model, VIN, dates, dealer name, and so on) are `{camelCaseVariable}` placeholders. At render time each placeholder is filled with that offer's value.
- **Each account has one snippet.** It combines every disclosure type the account has turned on: Lease, APR, Finance and Cash.
- The snippet text is **markdown-lite**: `**bold**`, `*italic*`, `<u>underline</u>`, `~~strikethrough~~`, and `\n` for line breaks. Placeholders use `{key}`.
- The known variables come from `src/data/disclosureVariables.ts`. Each one has `key`, `label`, `category` and `sampleValue`. The sample value is what Preview mode shows.

### Where a snippet comes from

1. A client or an internal user pastes each **raw disclosure** (for example the dealer's real Lease fine print) into a disclosure type card.
2. When the raw text field **loses focus**, AI templatizes it into a **template**. Generation runs on blur, not on every keystroke. The template keeps every word and swaps only the per-offer values for `{variables}`. The AI also returns:
   - `replacements`: `[{ key, original }]`, recording which variable replaced which exact source substring. These pairs drive the color matching between source and template.
   - `issues`: compliance problems, shown as the **Warnings (n)** tag. Each issue has a severity: `failure`, `warning` or `change`.
3. **Generate Snippet** combines every template whose type has **Apply to automated offers** checked:
   - A sentence repeated across templates is written only once, and shared sentences are grouped at the end.
   - A fixed **boilerplate** is appended once. It holds rebates 1–6, dealer fees 1–6, `{dynamicVinList}` and `VIN: {VIN}`.
   - See `consolidateDisclosureTemplates()` in `src/utils/disclosureSnippetAI.ts`.
4. The combined result is saved as the account snippet together with its metadata and **version 1**.

### Data model (`src/data/enrollmentSettings.ts`)

```ts
AccountDisclosureSnippet {
  meta: DisclosureSnippetMeta;        // id, name, tags, folder, brands, expirationDate (yyyy-mm-dd | null),
                                      // websiteDescription, websiteNotes, createdAt, updatedAt, createdBy,
                                      // sourceText, replacements
  text: string;                       // the current snippet text
  disclosures: DisclosureBlock[];     // the disclosures as they were at the last generate/update ("Discard Changes" restores these)
  versions: DisclosureSnippetVersion[]; // oldest first; the last one is the current version
}
```

Snippet defaults when it is generated:

| Field | Default |
|---|---|
| Name | `Disclosure Template_<AccountName>_<Mon><YY>`, for example `Disclosure Template_BMW of Manhattan_Nov26` |
| Folder | The account name |
| Brands | `[account brand]` |
| Expiration date | December 31 of the current year |
| Tags, website description, website notes | Empty |

**Versions are append-only.** A new version is recorded on Generate, Update, Save and Restore. History is never rewritten: restoring an old version copies it forward as a new current version.

---

## 2. The Snippet Card (Disclosures page, "Automated Offers Snippet" section)

The card sits at the top of the Disclosures page in a section titled **Automated Offers Snippet**. It has two states.

### 2a. No snippet attached (`screenshots/01-no-snippet-yet.jpg`)
- A gray `page-text-link` icon, then two lines of text:
  - **"No snippet attached to this account yet."** in medium weight.
  - "Select an existing snippet or generate a new one from the disclosure templates." in secondary text.
- The sticky page footer shows:
  - The message "Template created for **Lease** and **Cash** disclosures. Generate snippet to apply." If no templates are included, it shows "Add disclosures to generate snippet." instead.
  - **Select Existing Snippet** (outlined). It is a placeholder with no action yet.
  - **Generate Snippet** (contained, sparkle icon). It is disabled while any template is still generating or when no type is included.
- Clicking **Generate Snippet** does the following:
  - Creates the snippet and version 1.
  - Collapses every disclosure card.
  - **Opens the Snippet Drawer straight away.**
  - When that drawer closes, it shows the snackbar **"Snippet generated."**

### 2b. Snippet attached (`screenshots/05-snippet-card-attached.jpg`)
- A single-row card: 1px `#473bab` border, `rgba(99,86,225,0.08)` fill, 8px radius, 12px padding.
- Left to right:
  - The `page-text-link` icon.
  - **`<Account name> Snippet:`** in bold, followed by the snippet name. The name is truncated with an ellipsis.
  - Two icon buttons:
    - **Pencil (Edit snippet)** opens the Snippet Drawer. No snackbar is shown when it closes.
    - **Circle-X (Remove snippet)** opens the **Remove this snippet** confirmation.
- **Remove confirmation** (`RemoveSnippetDialog`):
  - Body text: *"Removing "<name>" detaches it from this account. Your disclosure text is kept, so you can generate a new snippet from it later."*
  - Buttons: Cancel, and a red **Remove**.
  - Confirming sets `disclosureSnippet = null`. All disclosures are kept.
- An **info banner** appears above the card when a client has submitted disclosure edits that the snippet does not include yet:
  - Text: *"Client has updated the **Lease** disclosure. **Update snippet** to apply changes to offers."*
  - The "Update snippet" link opens the Update dialog.

### 2c. Card-related state on the disclosure type cards
Each disclosure type card (Lease, APR, Finance, Cash) shows a **status tag** that compares it to the saved snippet:
- **Edited** (blue): changed since the last generate or update. A change to the raw text, the template text, or the Apply checkbox counts.
- **Applied in snippet** (green): included in the saved snippet.
- **Not applied in snippet** (orange): has text but is not included.

### 2d. Sticky footer once a snippet exists
- **Nothing edited:**
  - Message: "Edit disclosure templates to update the snippet."
  - **Discard Changes** and **Update Snippet** are both visible but disabled.
- **Something edited:**
  - Message: "Changes made to **Lease** disclosure. Update snippet to apply. If you exit, all changes will be lost."
  - **Discard Changes** restores `snippet.disclosures`.
  - **Update Snippet** opens the Update dialog. It is disabled while a template is generating or when no type is included.
- **Update dialog** (`UpdateSnippetDialog`):
  - Left: the current snippet, read-only. Wording the update removes is shown in red with strikethrough.
  - Right: the rebuilt snippet, editable. Wording the update adds is painted green.
  - Nothing changes until **Update Snippet** is confirmed. Confirming:
    - Records a new version.
    - Marks client-submitted disclosures as `applied`.
    - Collapses the cards.
    - Shows the snackbar **"Snippet updated."**

---

## 3. The Snippet Drawer ("Create Text Snippet")

Component: `DisclosureSnippetDialog.tsx`. It is a **portal to `document.body`**.

### Shell and layout
- **Backdrop:** a fixed `rgba(0,0,0,0.4)` scrim at z-index 100000. Clicking it closes the drawer.
- **Panel:** fixed at 16px from each viewport edge, at z-index 100001. White background, 16px radius, large elevation shadow.
  - The left offset also adds `widgetWidth` from `TestWidgetContext`. That offset only exists for this prototype's test widget; set it to `0` or remove it on your platform.
- **Escape** closes the drawer.
- **MUI popper z-index:** every MUI Popper inside the drawer (Tooltip, Autocomplete dropdown, the variable picker Popover) must be raised to z-index **100002**. Without that, they render behind the panel. In the code this is `POPPER_SLOT_PROPS`.
- **Header:**
  - The title **"Create Text Snippet"**.
  - On the right, the included disclosure labels in gray, for example "Lease, Cash".
  - A round close button.
- **Body:** two regions.
  - **Left, the editor area:** `#f0f2f4` background, 24px padding. It holds a white card with three parts:
    - A toolbar.
    - A scrolling content area. Only this part scrolls.
    - A footer note: "M↓ Styling with Markdown is supported."
  - **Right, the side panel (393px):**
    - A 73px vertical tab rail with four tabs: **Metadata**, **History**, **Rules** and **Build w/ AI**. The active tab has a 3px purple left border and a purple icon and label.
    - The tab content next to the rail.
- **Footer:** a single **Save** button aligned right.

### Editor toolbar (left to right)
1. **Write / Preview** text tabs. The active tab is purple with a 2px underline.
   - **Preview** renders the snippet as HTML. Each `{var}` is replaced by its `sampleValue`; unknown keys render as `[key]`. The markdown-lite formatting is rendered.
2. A divider.
3. **Undo**, **Bold**, **Italic**, **Underline** and **Strikethrough** icon buttons. Each has a tooltip.
   - Formatting wraps the live DOM selection in `<strong>`, `<em>`, `<u>` or `<s>`. Applying the same format again unwraps it.
   - The raw `**` and `~~` markers are never shown to the user.
4. **Add Variable**: an outlined pill button. It opens the variable picker anchored to the button.
5. A spacer.
6. **AI insight**: an icon with a "coming soon" tooltip and no action yet.
7. **Compare**: a column-view icon. It toggles the **comparison (split) view** and shows an active state while on.
8. **Create With AI (Cmd + /)**: an outlined pill button. It is a placeholder with no action yet.

### The snippet editor (`DisclosureSnippetEditor.tsx`)
The editor is a `contentEditable` div that parses the snippet string into DOM and serializes it back.

- **Variables are atomic chips:**
  - Each chip is a non-editable span showing `{key}`, 24px tall, with an × icon.
  - **Clicking a chip** opens the variable picker in *replace* mode.
  - **Clicking its ×** removes the chip.
    - On the Disclosures page template panes, `resolveOriginal` is passed. Removing a chip there puts the original raw value back as text.
    - The drawer does not pass `resolveOriginal`, so removing a chip there simply deletes it.
- **Typing `{`** opens the picker at the caret instead of inserting a brace. This is handled on `beforeinput`, so it also works with IME and on-screen keyboards.
- **Variable picker:**
  - A Popover with a "Search variables" field.
  - Results are grouped by category with an uppercase category header.
  - Search matches the variable's label or key.
- **Transform into variable** (only when `resolveOriginal` is given):
  - Selecting a plain-text run shows a floating menu. Picking a variable from it turns the selection into that chip.
  - A leading `$` and any surrounding whitespace stay as literal text.
  - The new mapping is reported through `onReplacementAdded`.
- **Enter** inserts a literal `\n`.
- **Paste** inserts plain text only, so the browser never adds its own `<div>` or `<br>` markup.
- **Undo** uses the editor's own history stack.
- **`readOnly` mode:** used when viewing an old version. Chips lose their × and cannot be clicked.
- **Imperative handle:** `applyFormat`, `openAddVariablePicker`, `undo`, `loadValue`, `focus`, `applyChipColors`.

### Comparison (split) view (`screenshots/03-drawer-comparison-view.jpg`)
- Only available in Write mode.
- **Left column:** one section per included disclosure type, titled "Lease Disclosure", "Cash Disclosure" and so on. Each section shows that type's **raw source text** (`DisclosureSourcePane`). Every substring that became a variable is highlighted with a colored box.
- **Right column:** the **Outcome Snippet** editor. Its chips are tinted to match their sources: fill = the color at 10% alpha, border = the color.
- **Colors:**
  - Colors come from the 9-color categorical palette (`CATEGORICAL_COLORS` in `disclosureSnippetColors.ts`).
  - They are assigned to variables in order of first appearance, so the same variable always gets the same color.
  - A variable gets a color only if it was mapped back to a source substring **and** is still present in the text. A variable added by hand stays the default gray (`#f0f2f4`).
- If no per-type sources exist, the left column falls back to a single "Source Disclaimer" section built from `meta.sourceText`.
- Turning the view off returns every chip to gray.

### Side panel: Metadata tab (`screenshots/02-drawer-write-metadata.jpg`)
- **Fields:**
  - \* Name: text, with a copy-to-clipboard button.
  - Folder: text, with a folder icon.
  - Brand: multi-select Autocomplete with chips.
  - Tags: free-solo multi Autocomplete with chips.
  - Expiration Date: a plain text field that is always `mm/dd/yyyy` and is stored as `yyyy-mm-dd`. It deliberately does not use `<input type="date">`, because that field's display format follows the user's locale.
- **Website Integration Data:** a collapsible accordion with Description and Notes, both multiline.
- **Read-only info rows:**
  - Snippet ID, with a copy button.
  - File Type: "Text Snippet".
  - File Size: computed live from the text as B, KB or MB.
  - Date Uploaded.
  - Last Updated.
  - Created By.

### Side panel: History tab (`screenshots/04-drawer-version-history.jpg`, `SnippetVersionHistory.tsx`)
- Title: **"Version History"**.
- **Search field and save button:**
  - A pill-shaped search field. It matches name, author and the day or time labels.
  - A round purple **+** button. It saves unsaved edits as a new version, the same as Save, and is disabled when there is nothing to save.
- **The list:**
  - Versions are listed newest first and grouped by day: **Today**, **Yesterday**, or "January 5" (the year is added when it isn't the current year).
  - Each day group collapses.
- **Each row shows:**
  - A tiny page thumbnail.
  - A time label: "Just now" (under 1 minute), "12:43 PM" (today), or "Jan 13th, 12:43 PM" (earlier).
  - Badges: **Current** (filled purple) on the newest version, **Viewing** (gray) on the version being shown.
  - The version name.
  - The author's initials avatar and name.
- **Clicking a past version** shows it read-only in the editor.
  - A blue info banner appears: *"You are currently viewing a previous version. Go to the latest version, or restore this one to edit it."*
  - The banner has two buttons: **Restore This Version** (text) and **Go To Latest Version** (contained).
  - The comparison view also switches to that version's sources and colors.
- **Restore:**
  - Appends a copy of the version as the new current version.
  - Brings back the disclosures that version was built from, on the page as well.
  - Remounts the editor with the restored text.
  - Shows the snackbar **"Version restored."**

### Side panel: Rules and Build w/ AI tabs
Both are placeholders that show "Coming soon."

### Save behavior
- **Save is enabled only when the drawer is dirty and you are not viewing an old version.** Any text, format or metadata change makes the drawer dirty.
- **Tooltips on the disabled Save button:**
  - While viewing an old version: "Restore this version to edit it."
  - When there are no changes: "Snippet created. No new changes to save."
- **Saving:**
  - Calls `onSave(text, meta)` with `updatedAt` set to now.
  - The parent records a new version built from the same disclosures.
  - The drawer stays open and is no longer dirty.
- **Closing (×, backdrop or Escape)** does **not** prompt about unsaved changes. Unsaved edits are dropped.

---

## 4. Integration contract

The drawer is fully controlled by its parent:

```tsx
<DisclosureSnippetDialog
  disclosureLabel="Lease, Cash"            // header subtitle
  initialText={snippet.text}
  initialSnippet={snippet.meta}
  disclosures={snippet.disclosures}        // sources for the comparison view
  versions={snippet.versions}              // History tab (oldest → newest)
  onClose={() => …}
  onSave={(text, meta) => …}               // append a version, persist
  onRestoreVersion={(versionId) => …}      // append a copy as current, restore disclosures
/>
```

`DisclosuresTab.tsx` is the reference parent. It owns all snippet state changes: generate, update, save, restore, discard and remove. It persists through a single `onChange(patch: Partial<EnrollmentSettings>)`.

### AI templatization
- `generateDisclosureSnippet(raw, signal)` in `disclosureSnippetAI.ts` sends one OpenAI Responses API call:
  - Model: `gpt-4o-mini`.
  - Temperature 0.
  - Structured JSON schema output: `{ snippet, replacements, issues }`.
- The call goes through a **server-side proxy** (`api/fetch-urls.ts`, which reads `OPENAI_API_KEY`). The key must never reach the client bundle.
- **Mock mode:** set `VITE_DISCLOSURE_AI_MODE=mock` to use a local templatizer (`disclosureSnippetMock.ts`) instead of calling OpenAI.
- **Cancellation:** generations can be cancelled with an `AbortController`. The stop button is shown while a template is generating, and leaving the page aborts everything still in flight.

### Things that are prototype-only (replace with your platform's equivalents)
- `useTestWidget().widgetWidth`: a left offset for the prototype's test widget. Use `0`.
- `CURRENT_USER` from `data/mockData`: the signed-in user's display name. It is used for `createdBy`.
- `useNotifications` and `useUserRole`: in-memory activity notifications and the internal/client role switch. They only matter for the client-submission flow.
- `useSnackbar`: toast messages. Map it to your toast system.
- `enrollmentSettingsStore.ts` and the sample Lease and Cash disclosures in `buildDefaultEnrollmentSettings()`: an in-memory store and test data. Replace them with your API.
- **Select Existing Snippet**, **AI insight**, **Create With AI**, **Rules** and **Build w/ AI**: UI only, with no behavior yet.
