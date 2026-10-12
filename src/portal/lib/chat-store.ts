// Only the type the asset card needs. This app has no per-entity chat yet.
export type EntityRef = {
  /** Kind of thing, used for the icon and the "about" line. */
  type: "project" | "task" | "template" | "asset" | "offer";
  /** Stable id — the conversation for an entity is found by this. */
  id: string;
  /** What to call it in the list: "Multi-Product · Offers". */
  label: string;
  /** Where the entity lives, so a chat row can take you back to it. */
  href?: string;
};
