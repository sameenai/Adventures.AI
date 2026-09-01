// Keyset cursor helpers — encode/decode a compound {sort-value, id} position so
// pagination is stable even when the primary sort field (voteCount, durationDays,
// createdAt) has ties. Prisma's built-in cursor: { id } mechanism requires it to
// look up the cursor row's sort-field value internally, which is unreliable with
// compound orderBy; explicit WHERE conditions are always correct.
export type CursorPayload =
  | { v: number; id: string } // votes sort
  | { c: string; id: string } // newest sort  (createdAt ISO)
  | { d: number; id: string }; // duration sort

export function encodeCursor(payload: CursorPayload): string {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

// The JSON.parse result is cast to CursorPayload without structural validation
// because invalid shapes (e.g. missing keys) are handled downstream when the
// calling code checks for the expected key ("v" | "c" | "d") before use.
export function decodeCursor(cursor: string): CursorPayload | null {
  try {
    return JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as CursorPayload;
  } catch {
    return null;
  }
}
