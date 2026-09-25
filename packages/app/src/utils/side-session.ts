import type { Session } from "@opencode-ai/sdk/v2/client"
import type { ServerConnection } from "@/context/server"

export const SIDE_SESSION_METADATA_KEY = "opencode.side"
export const SIDE_SESSION_OPEN_EVENT = "opencode:side-session-open"
export const SIDE_SESSION_OPEN_MAX_AGE_MS = 60_000

type SideSessionMarker = {
  parentSessionID: string
  requestMessageID: string
  requestedAt: number
}

export type SideSessionOpenDetail = {
  server: ServerConnection.Key
  directory: string
  sessionID: string
  parentSessionID: string
  requestMessageID: string
}

function marker(value: unknown): SideSessionMarker | undefined {
  if (!value || typeof value !== "object") return
  if (!("parentSessionID" in value) || typeof value.parentSessionID !== "string") return
  if (!("requestMessageID" in value) || typeof value.requestMessageID !== "string") return
  if (!("requestedAt" in value) || typeof value.requestedAt !== "number" || !Number.isFinite(value.requestedAt)) return
  return {
    parentSessionID: value.parentSessionID,
    requestMessageID: value.requestMessageID,
    requestedAt: value.requestedAt,
  }
}

export function sideSessionOpenDetail(
  server: ServerConnection.Key,
  session: Session,
  now = Date.now(),
): SideSessionOpenDetail | undefined {
  const value = marker(session.metadata?.[SIDE_SESSION_METADATA_KEY])
  if (!value) return
  if (value.requestedAt > now + 5_000) return
  if (now - value.requestedAt > SIDE_SESSION_OPEN_MAX_AGE_MS) return
  return {
    server,
    directory: session.directory,
    sessionID: session.id,
    parentSessionID: value.parentSessionID,
    requestMessageID: value.requestMessageID,
  }
}

export function notifySideSessionOpen(detail: SideSessionOpenDetail) {
  window.dispatchEvent(new CustomEvent(SIDE_SESSION_OPEN_EVENT, { detail }))
}

export function readSideSessionOpenDetail(event: Event): SideSessionOpenDetail | undefined {
  if (!(event instanceof CustomEvent)) return
  const detail: unknown = event.detail
  if (!detail || typeof detail !== "object") return
  if (!("server" in detail) || typeof detail.server !== "string") return
  if (!("directory" in detail) || typeof detail.directory !== "string") return
  if (!("sessionID" in detail) || typeof detail.sessionID !== "string") return
  if (!("parentSessionID" in detail) || typeof detail.parentSessionID !== "string") return
  if (!("requestMessageID" in detail) || typeof detail.requestMessageID !== "string") return
  return detail as SideSessionOpenDetail
}

export function matchesActiveSideParent(
  detail: SideSessionOpenDetail,
  active: { server: ServerConnection.Key; sessionID: string },
): boolean {
  return detail.server === active.server && detail.parentSessionID === active.sessionID
}
