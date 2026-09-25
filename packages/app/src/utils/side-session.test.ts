import { describe, expect, test } from "bun:test"
import type { Session } from "@opencode-ai/sdk/v2/client"
import type { ServerConnection } from "@/context/server"
import {
  matchesActiveSideParent,
  readSideSessionOpenDetail,
  SIDE_SESSION_METADATA_KEY,
  SIDE_SESSION_OPEN_EVENT,
  sideSessionOpenDetail,
} from "./side-session"

const server = "local" as ServerConnection.Key
const now = 1_000_000

function session(overrides: Partial<Session> = {}): Session {
  return {
    id: "ses_side",
    slug: "side",
    projectID: "project",
    directory: "/tmp/project",
    parentID: "ses_parent",
    title: "Side: why?",
    version: "test",
    time: { created: now, updated: now },
    metadata: {
      [SIDE_SESSION_METADATA_KEY]: {
        parentSessionID: "ses_parent",
        requestMessageID: "msg_side_request",
        requestedAt: now,
      },
    },
    ...overrides,
  }
}

describe("side session GUI event", () => {
  test("converts fresh, internally consistent side metadata", () => {
    expect(sideSessionOpenDetail(server, session(), now)).toEqual({
      server,
      directory: "/tmp/project",
      sessionID: "ses_side",
      parentSessionID: "ses_parent",
      requestMessageID: "msg_side_request",
    })
  })

  test("rejects stale or missing side metadata", () => {
    expect(sideSessionOpenDetail(server, session(), now + 60_001)).toBeUndefined()
    expect(sideSessionOpenDetail(server, session({ metadata: {} }), now)).toBeUndefined()
  })

  test("uses the side marker when native fork parentID is absent", () => {
    expect(sideSessionOpenDetail(server, session({ parentID: undefined }), now)?.parentSessionID).toBe("ses_parent")
  })

  test("validates DOM event details", () => {
    const detail = sideSessionOpenDetail(server, session(), now)!
    expect(readSideSessionOpenDetail(new CustomEvent(SIDE_SESSION_OPEN_EVENT, { detail }))).toEqual(detail)
    expect(readSideSessionOpenDetail(new Event(SIDE_SESSION_OPEN_EVENT))).toBeUndefined()
  })

  test("targets only the window showing the exact parent session", () => {
    const detail = sideSessionOpenDetail(server, session(), now)!
    expect(matchesActiveSideParent(detail, { server, sessionID: "ses_parent" })).toBe(true)
    expect(matchesActiveSideParent(detail, { server, sessionID: "ses_other" })).toBe(false)
    expect(
      matchesActiveSideParent(detail, {
        server: "other" as ServerConnection.Key,
        sessionID: "ses_parent",
      }),
    ).toBe(false)
  })
})
