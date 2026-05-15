export type EventType = "class" | "ct" | "assignment" | "exam" | "notice" | "event";

export function normalizeEventType(type: string): EventType {
  const t = type.toLowerCase().trim();
  if (["class", "ct", "assignment", "exam", "notice", "event"].includes(t)) {
    return t as EventType;
  }
  return "event";
}
