// Where the platform's folders actually sit.
//
// The REST API the Portal proxies has no hierarchy to give: /folders and
// /projects/{id}/folders both answer 403 for this key, and an asset carries a
// single flat `folder_name` with no parent. So the route counts the leaves and
// the rail drew one flat row per name.
//
// The real tree is there — the platform's own Portal draws it — but it comes
// from Hasura GraphQL, not REST:
//
//   POST https://hasura-const-prod.prod-app.constech.io/v1/graphql
//   query getFolderIndexChildren($parentId: uuid!) {
//     folderIndexes(where: {_and: [{parentId: {_eq: $parentId}},
//                                  {deletedAt: {_is_null: true}}]},
//                   order_by: {name: asc}) {
//       id name parentId path folderNames itemCount childrenCount
//       shareStatus isAccountFolder ownerClientId ownerClientName …
//     }
//   }
//
// `folderIndexes` is a flat index of every folder where `parentId` is what
// makes the tree; `path` is a materialised path of ids, not names. The web app
// walks it one level at a time as you expand.
//
// Read off prod on 2026-09-28 with the signed-in session: the client root
// "Constellation Incentives and Signals" has 232 children, and every folder
// name our REST route returns is one of them (checked against a sample of the
// route's names: 14 of 14). So the placement is a rule and not a table —
// nothing here to go stale as folders are added, which a captured list would.
//
// The dealerships nest further on the platform (a same-named subfolder, then
// the monthly ones), but REST only ever names the level our assets sit in, so
// that is where this stops.

/** The client this API key belongs to, which is the root every folder it
 *  returns hangs from. It travels with the key: change OFFERS_CLIENT_ID and
 *  this has to change with it. */
export const PORTAL_CLIENT_ROOT = "Constellation Incentives and Signals";

/** A flat folder name, as its path from the client root. */
export function portalFolderPath(name: string): string {
  return name === PORTAL_CLIENT_ROOT ? name : `${PORTAL_CLIENT_ROOT}/${name}`;
}

// ─── The level below ─────────────────────────────────────────────────────────
// A dealership folder is not a leaf on the platform: it holds a folder of its
// own name, and that is where the older campaigns live. Checked against prod on
// 2026-09-28: of the 126 folder names the route returns, 109 exist as
// dealership folders and ALL 109 have a same-named child — no exceptions. Two
// of them hold one more folder besides.
//
// So this is a rule with two footnotes rather than a captured tree of 423 rows,
// and it keeps working as dealerships are added.
//
// REST never names this level — our assets all sit at the dealership — so these
// rows carry no count and open empty. That is honest about the window we read:
// the 200 most recent projects. The main pane draws a card per contained folder
// so a parent still has something to show.

/** The folders that hold one more besides their same-named child. */
const EXTRA_CHILDREN: Record<string, readonly string[]> = {
  "BMW of Buffalo": ["Project"],
  "Toyota Santa Monica": ["Toyota of Santa Monica"],
};

/** What sits inside this folder, by name. Empty for anything that is not one
 *  of the client's dealership folders — the client root itself, say. */
export function portalChildFolders(name: string): string[] {
  if (name === PORTAL_CLIENT_ROOT) return [];
  return [name, ...(EXTRA_CHILDREN[name] ?? [])];
}
