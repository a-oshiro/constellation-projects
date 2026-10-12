// Placeholder for the chat button an asset card carries in its corner.
// This app has no per-entity chat yet, so it renders nothing.
import type { EntityRef } from "@portal/lib/chat-store";

export function EntityChatButton(_props: { entity: EntityRef; className?: string }) {
  return null;
}
