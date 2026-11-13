/**
 * Read-only session activity observer bridging native DSH services (`sessions`,
 * `uiSession`, `uiConversation`, `jobs`, `sidebarRight`) into the Workbench inspector
 * without duplicating session or message state ownership.
 */

import type { Context } from '@deepseek-ai/cordis'
import type { ISessions, SessionBinding, SessionListState } from '@deepseek-ai/dsh-api-session-controller/client'
import { createSnapshotStore, type ObservableSnapshot } from '@deepseek-ai/dsh-client-store'
import type { UiConversation } from '@deepseek-ai/dsh-client-ui-conversation/client'
import type { UiSession } from '@deepseek-ai/dsh-client-ui-session/client'
import type { SessionId } from '@deepseek-ai/dsh-session/types'

/** Activity filter categories surfaced in the Global Inspector. */
export type ActivityCategory = 'all' | 'tool' | 'subagent' | 'job'

/** Normalized tool or subagent execution row derived from Conversation trajectory events. */
export interface ActivityFeedItem {
  /** Tool invocation identifier (`callId`). */
  readonly id: string
  /** Filter bucket. */
  readonly category: 'tool' | 'subagent'
  /** Tool or delegation name. */
  readonly title: string
  /** Brief context hint (e.g. file basename or short command preview). */
  readonly subtitle?: string
  /** Current execution status. */
  readonly status: 'running' | 'completed' | 'error'
  /** Ordering sequence number (higher means newer). */
  readonly seq: number
}

/** Normalized background job row sourced from `ctx.jobs`. */
export interface WorkbenchJobItem {
  /** Internal job identifier (surfaced only inside collapsed Technical Details). */
  readonly id: string
  /** Human-readable command or job label. */
  readonly label: string
  /** Live job status. */
  readonly status: 'running' | 'stopping' | 'completed' | 'killed' | 'failed'
  /** Concise live progress note or terminal summary. */
  readonly detail?: string
  /** Unix epoch ms when started. */
  readonly startedAt: number
  /** Unix epoch ms when settled. */
  readonly finishedAt?: number
}

/** Child subagent entry sourced from the session's `subagentCatalog` projection. */
export interface WorkbenchSubagentItem {
  /** Child session identifier. */
  readonly id: string
  /** Human-readable label or child title. */
  readonly label: string
  /** Delegation lifecycle mode (`continuable` / `one-shot` / etc.). */
  readonly mode: string
  /** Whether the child session currently reports running activity. */
  readonly status: 'running' | 'idle'
  /** Unix epoch ms when spawned. */
  readonly createdAt: number
}

/** Todo item normalized from the session's `todos` projection. */
export interface WorkbenchTodoItem {
  /** Task item text. */
  readonly content: string
  /** Task item status. */
  readonly status: 'pending' | 'in_progress' | 'completed'
}

/** Turn deliverables and git change announcement summary. */
export interface WorkbenchDeliverablesSummary {
  /** Unique produced/edited file count across loaded turns. */
  readonly producedCount: number
  /** Up to three latest file basenames for quick scanning. */
  readonly latestFiles: readonly string[]
  /** Latest `workspace/changes` event sequence for opening read-only diff review. */
  readonly changesSeq?: number
  /** Turn number corresponding to `changesSeq`. */
  readonly changesTurn?: number
}

/** Plan mode state and latest submitted plan resource coordinate. */
export interface WorkbenchPlanSummary {
  /** Whether plan mode is currently active in the session. */
  readonly active: boolean
  /** Whether a `/plan` mode toggle is pending settlement. */
  readonly pending: boolean
  /** Originating tool invocation id for the latest `exit_plan_mode` plan, if loaded. */
  readonly latestCallId?: string
  /** Extracted Markdown heading from the latest plan invocation, if available. */
  readonly latestTitle?: string
}

/** Complete read-only activity snapshot consumed by `WorkTaskInspector`. */
export interface WorkbenchActivitySnapshot {
  /** Active `mainView`-retained session id, when present. */
  readonly sessionId?: SessionId
  /** Active pending human interaction kind (`approval`, `question`, `plan-review`, etc.). */
  readonly pendingInteractionKind?: string
  /** Whether the active session completed a turn with an unread indicator. */
  readonly completionUnread: boolean
  /** Plan mode & latest plan preview summary, when present. */
  readonly plan?: WorkbenchPlanSummary
  /** Todo checklist items projected onto the session. */
  readonly todos: readonly WorkbenchTodoItem[]
  /** Deliverables and workspace change summary across loaded turns, when non-empty. */
  readonly deliverables?: WorkbenchDeliverablesSummary
  /** Spawned subagents under the active session. */
  readonly subagents: readonly WorkbenchSubagentItem[]
  /** Background jobs observed for the active session. */
  readonly jobs: readonly WorkbenchJobItem[]
  /** Recent tool and delegation timeline items, ordered newest-first (max 12). */
  readonly activities: readonly ActivityFeedItem[]
}

/** Empty activity baseline before any session or service binds. */
export const EMPTY_ACTIVITY_SNAPSHOT: WorkbenchActivitySnapshot = Object.freeze({
  completionUnread: false,
  todos: [],
  subagents: [],
  jobs: [],
  activities: [],
})

/** Structural contract for optional `ctx.jobs` consumption without cross-plugin runtime coupling. */
interface OptionalJobRecord {
  readonly id: string
  readonly label?: string
  readonly command?: string
  readonly status: WorkbenchJobItem['status']
  readonly progress?: string
  readonly detail?: string
  readonly startedAt: number
  readonly finishedAt?: number
}

interface OptionalJobsService {
  readonly state: ObservableSnapshot<{
    readonly rows: Readonly<Record<string, readonly OptionalJobRecord[]>>
  }>
  watchRows(sessionId: SessionId): () => void
}

interface TrajectoryTurnDataShape {
  readonly produced?: readonly { readonly path: string; readonly argumentPath?: string }[]
  readonly changes?: { readonly seq: number }
}

interface ToolArgsReader {
  text(key: string): string | undefined
  textPrefix(key: string, maxLength: number): string | undefined
}

interface TrajectoryToolResultShape {
  readonly kind: 'tool-result'
  readonly seq: number
  readonly callId: string
  readonly name: string
  readonly args: ToolArgsReader
  readonly call?: { readonly name?: string; readonly argsRaw?: string } | null
  readonly error?: { readonly reason?: string; readonly code?: string } | null
  readonly isError: boolean
}

interface TrajectoryAssistantToolCallBlock {
  readonly kind: 'tool-call'
  readonly callId: string
  readonly name: string
  readonly argsRaw?: string
}

interface TrajectoryAssistantShape {
  readonly kind: 'assistant'
  readonly blocks: readonly (TrajectoryAssistantToolCallBlock | { readonly kind: string })[]
}

type TrajectoryEventNodeShape =
  | TrajectoryToolResultShape
  | TrajectoryAssistantShape
  | { readonly kind: string }

type TrajectoryRunningCallShape = {
  readonly callId: string
  readonly name: string
  readonly args: ToolArgsReader
} & (
  | { readonly phase: 'start'; readonly argsRaw: string }
  | { readonly phase: 'preparing' }
)

interface TrajectoryTurnShape {
  readonly turn: number
  readonly data: {
    get(key: string): unknown
  }
}

interface TrajectorySnapshotShape {
  readonly eventNodes: readonly TrajectoryEventNodeShape[]
  readonly eventLocations: ReadonlyMap<number, {
    readonly kind: string
    readonly turn?: TrajectoryTurnShape
  }>
  readonly runningCalls: readonly TrajectoryRunningCallShape[]
}

interface SubagentCatalogItemShape {
  readonly id: SessionId
  readonly createdAt: number
  readonly mode: string
  readonly label?: string
}

interface PlanProjectionShape {
  readonly active?: boolean
  readonly pending?: boolean
}

const SUBAGENT_TOOL_NAMES = new Set(['subagent', 'spawn_subagent', 'task', 'delegate'])
const MAX_TIMELINE_ITEMS = 12

function displayNameOfPath(path: string): string {
  const trimmed = path.replace(/[/\\]+$/u, '')
  if (trimmed === '') return path
  const cut = Math.max(trimmed.lastIndexOf('/'), trimmed.lastIndexOf('\\'))
  return trimmed.slice(cut + 1) || path
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isUnknownArray(value: unknown): value is readonly unknown[] {
  return Array.isArray(value)
}

function readRecordField(container: unknown, key: string): unknown {
  if (!isRecord(container)) return undefined
  return container[key]
}

function parsePlanProjection(value: unknown): PlanProjectionShape | undefined {
  if (!isRecord(value)) return undefined
  return {
    ...(typeof value.active === 'boolean' ? { active: value.active } : {}),
    ...(typeof value.pending === 'boolean' ? { pending: value.pending } : {}),
  }
}

function isOptionalJobsService(value: object | undefined): value is OptionalJobsService {
  if (!isRecord(value)) return false
  return isRecord(value.state) && 'getSnapshot' in value.state && typeof value.watchRows === 'function'
}

interface ServiceAccessor {
  get(name: string): object | undefined
}

function asOptionalJobsService(ctx: Context): OptionalJobsService | undefined {
  const candidate = (ctx as ServiceAccessor).get('jobs')
  return isOptionalJobsService(candidate) ? candidate : undefined
}

function summarizeToolArgs(args: ToolArgsReader | undefined, argsRaw?: string): string | undefined {
  if (args !== undefined) {
    const pathVal = args.text('file_path') ?? args.text('path') ?? args.text('target_path')
    if (typeof pathVal === 'string' && pathVal.trim() !== '') {
      return displayNameOfPath(pathVal.trim())
    }
    const cmdVal =
      args.textPrefix('description', 80)
      ?? args.textPrefix('command', 80)
      ?? args.textPrefix('pattern', 80)
      ?? args.textPrefix('query', 80)
    if (typeof cmdVal === 'string' && cmdVal.trim() !== '') {
      const compact = cmdVal.trim().replaceAll(/\s+/gu, ' ')
      return compact.length > 42 ? `${compact.slice(0, 39)}...` : compact
    }
  }
  if (typeof argsRaw !== 'string' || argsRaw.trim() === '') return undefined
  try {
    const parsed: unknown = JSON.parse(argsRaw)
    if (!isRecord(parsed)) return undefined
    const pathCandidate = parsed.file_path ?? parsed.path ?? parsed.target_path
    if (typeof pathCandidate === 'string' && pathCandidate.trim() !== '') {
      return displayNameOfPath(pathCandidate.trim())
    }
    const cmdCandidate = parsed.description ?? parsed.command ?? parsed.pattern ?? parsed.query
    if (typeof cmdCandidate === 'string' && cmdCandidate.trim() !== '') {
      const compact = cmdCandidate.trim().replaceAll(/\s+/gu, ' ')
      return compact.length > 42 ? `${compact.slice(0, 39)}...` : compact
    }
    return undefined
  } catch {
    return undefined
  }
}

function extractPlanTitle(args: ToolArgsReader | undefined, argsRaw?: string): string | undefined {
  const streamed = args?.text('plan')
  if (typeof streamed === 'string') {
    const heading = /^#\s+(\S[^\r\n]*)/u.exec(streamed.trim())?.[1]
    if (heading !== undefined && heading.trim() !== '') return heading.trim()
  }
  if (typeof argsRaw !== 'string' || argsRaw.trim() === '') return undefined
  try {
    const parsed: unknown = JSON.parse(argsRaw)
    if (!isRecord(parsed) || typeof parsed.plan !== 'string') return undefined
    const heading = /^#\s+(\S[^\r\n]*)/u.exec(parsed.plan.trim())?.[1]
    return heading?.trim() || undefined
  } catch {
    return undefined
  }
}

function extractActivitiesAndPlan(
  trajectory: TrajectorySnapshotShape | undefined,
): {
  readonly activities: readonly ActivityFeedItem[]
  readonly latestPlanCallId?: string
  readonly latestPlanTitle?: string
  readonly deliverables?: WorkbenchDeliverablesSummary
} {
  if (trajectory === undefined) {
    return { activities: [] }
  }

  const byCallId = new Map<string, ActivityFeedItem>()
  let latestPlanCallId: string | undefined
  let latestPlanTitle: string | undefined

  for (const node of trajectory.eventNodes) {
    if (node.kind === 'tool-result' && 'callId' in node) {
      const resultNode: TrajectoryToolResultShape = node
      const rawArgs = resultNode.call?.argsRaw
      const category = SUBAGENT_TOOL_NAMES.has(resultNode.name) ? 'subagent' : 'tool'
      const errorReason = resultNode.error?.reason ?? resultNode.error?.code
      const subtitle = errorReason ?? summarizeToolArgs(resultNode.args, rawArgs)
      byCallId.set(resultNode.callId, {
        id: resultNode.callId,
        category,
        title: resultNode.name || resultNode.call?.name || resultNode.callId,
        ...(subtitle === undefined ? {} : { subtitle }),
        status: resultNode.isError ? 'error' : 'completed',
        seq: resultNode.seq,
      })
      if (resultNode.name === 'exit_plan_mode') {
        latestPlanCallId = resultNode.callId
        latestPlanTitle = extractPlanTitle(resultNode.args, rawArgs) ?? latestPlanTitle
      }
      continue
    }

    if (node.kind === 'assistant' && 'blocks' in node) {
      for (const block of node.blocks) {
        if (block.kind !== 'tool-call' || !('callId' in block) || block.name !== 'exit_plan_mode') continue
        latestPlanCallId = block.callId
        latestPlanTitle = extractPlanTitle(undefined, block.argsRaw) ?? latestPlanTitle
      }
    }
  }

  let runningSeqOffset = Number.MAX_SAFE_INTEGER - trajectory.runningCalls.length
  for (const call of trajectory.runningCalls) {
    runningSeqOffset += 1
    const rawArgs = call.phase === 'start' ? call.argsRaw : undefined
    const category = SUBAGENT_TOOL_NAMES.has(call.name) ? 'subagent' : 'tool'
    const subtitle = summarizeToolArgs(call.args, rawArgs)
    byCallId.set(call.callId, {
      id: call.callId,
      category,
      title: call.name,
      ...(subtitle === undefined ? {} : { subtitle }),
      status: 'running',
      seq: runningSeqOffset,
    })
    if (call.name === 'exit_plan_mode') {
      latestPlanCallId = call.callId
      latestPlanTitle = extractPlanTitle(call.args, rawArgs) ?? latestPlanTitle
    }
  }

  const sorted = [...byCallId.values()]
    .sort((left, right) => right.seq - left.seq)
    .slice(0, MAX_TIMELINE_ITEMS)

  const seenTurns = new Map<number, TrajectoryTurnShape>()
  for (const loc of trajectory.eventLocations.values()) {
    if ((loc.kind === 'turn' || loc.kind === 'step') && loc.turn !== undefined) {
      seenTurns.set(loc.turn.turn, loc.turn)
    }
  }

  const orderedTurns = [...seenTurns.values()].sort((a, b) => a.turn - b.turn)
  const producedFiles: string[] = []
  const seenFiles = new Set<string>()
  let changesSeq: number | undefined
  let changesTurn: number | undefined

  for (const turn of orderedTurns) {
    const rawDeliverables = turn.data.get('deliverables')
    if (!isRecord(rawDeliverables)) continue
    const deliverables = rawDeliverables as TrajectoryTurnDataShape
    for (const file of deliverables.produced ?? []) {
      const display = displayNameOfPath(file.path)
      if (!seenFiles.has(file.path)) {
        seenFiles.add(file.path)
        producedFiles.push(display)
      }
    }
    if (deliverables.changes !== undefined) {
      changesSeq = deliverables.changes.seq
      changesTurn = turn.turn
    }
  }

  let deliverablesSummary: WorkbenchDeliverablesSummary | undefined
  if (producedFiles.length > 0 || changesSeq !== undefined) {
    deliverablesSummary = {
      producedCount: producedFiles.length,
      latestFiles: producedFiles.slice(-3).reverse(),
      ...(changesSeq === undefined ? {} : { changesSeq }),
      ...(changesTurn === undefined ? {} : { changesTurn }),
    }
  }

  return {
    activities: sorted,
    ...(latestPlanCallId === undefined ? {} : { latestPlanCallId }),
    ...(latestPlanTitle === undefined ? {} : { latestPlanTitle }),
    ...(deliverablesSummary === undefined ? {} : { deliverables: deliverablesSummary }),
  }
}

function normalizeTodos(raw: unknown): readonly WorkbenchTodoItem[] {
  if (!isUnknownArray(raw)) return []
  const items: WorkbenchTodoItem[] = []
  for (const entry of raw) {
    if (!isRecord(entry) || typeof entry.content !== 'string') continue
    const status = entry.status === 'completed' || entry.status === 'in_progress'
      ? entry.status
      : 'pending'
    items.push({ content: entry.content, status })
  }
  return items
}

function normalizeSubagents(
  listState: SessionListState | undefined,
  sessionId: SessionId,
): readonly WorkbenchSubagentItem[] {
  if (listState === undefined) return []
  const projection = listState.projectionsBySession[sessionId]?.values
  const rawCatalog = readRecordField(projection, 'subagentCatalog')
  if (!isUnknownArray(rawCatalog) || rawCatalog.length === 0) return []
  const entries: WorkbenchSubagentItem[] = []
  for (const rawEntry of rawCatalog) {
    if (!isRecord(rawEntry) || typeof rawEntry.id !== 'string' || typeof rawEntry.mode !== 'string' || typeof rawEntry.createdAt !== 'number') {
      continue
    }
    const entry: SubagentCatalogItemShape = {
      id: rawEntry.id as SessionId,
      createdAt: rawEntry.createdAt,
      mode: rawEntry.mode,
      ...(typeof rawEntry.label === 'string' ? { label: rawEntry.label } : {}),
    }
    const childSummary = listState.byId[entry.id]
    const label = childSummary?.displayTitle.trim() || entry.label?.trim() || entry.id
    entries.push({
      id: entry.id,
      label,
      mode: entry.mode,
      status: childSummary?.running === true ? 'running' : 'idle',
      createdAt: entry.createdAt,
    })
  }
  return entries
}

function normalizeJobs(rows: readonly OptionalJobRecord[] | undefined): readonly WorkbenchJobItem[] {
  if (rows === undefined || rows.length === 0) return []
  return rows
    .map((job): WorkbenchJobItem => {
      const detail = job.progress ?? job.detail
      return {
        id: job.id,
        label: job.label?.trim() || job.command?.trim() || job.id,
        status: job.status,
        ...(detail === undefined || detail === '' ? {} : { detail }),
        startedAt: job.startedAt,
        ...(job.finishedAt === undefined ? {} : { finishedAt: job.finishedAt }),
      }
    })
    .sort((left, right) => {
      const leftLive = left.status === 'running' || left.status === 'stopping'
      const rightLive = right.status === 'running' || right.status === 'stopping'
      if (leftLive !== rightLive) return leftLive ? -1 : 1
      return right.startedAt - left.startedAt
    })
}

/** Input sources assembled into one immutable {@link WorkbenchActivitySnapshot}. */
export interface DeriveActivityInput {
  /** Current global session list snapshot. */
  readonly listState?: SessionListState | undefined
  /** Status entry for the active session, if any. */
  readonly pendingInteractionKind?: string | undefined
  /** Completion unread indicator for the active session. */
  readonly completionUnread?: boolean | undefined
  /** Plan projection from the active retained session binding. */
  readonly planProjection?: PlanProjectionShape | undefined
  /** Todos projection from the active retained session binding. */
  readonly todosProjection?: readonly WorkbenchTodoItem[] | undefined
  /** Trajectory target snapshot from `uiConversation`. */
  readonly trajectory?: TrajectorySnapshotShape | undefined
  /** Job rows for the active session from `ctx.jobs`. */
  readonly jobRows?: readonly OptionalJobRecord[] | undefined
}

/**
 * Pure projection composing native Session, Trajectory, Plan, Todo, Subagent,
 * Deliverables, and Background Job facts into a single immutable inspector snapshot.
 * @param input - Latest native store slices for the active session.
 * @returns Normalized immutable {@link WorkbenchActivitySnapshot} ready for the Inspector UI.
 */
export function deriveActivitySnapshot(input: DeriveActivityInput): WorkbenchActivitySnapshot {
  const { listState } = input
  const activeSession = listState === undefined
    ? undefined
    : Object.values(listState.byId).find(item => (item.retainedBy.mainView ?? 0) > 0)

  if (activeSession === undefined) return EMPTY_ACTIVITY_SNAPSHOT

  const sessionId = activeSession.id
  const { activities, latestPlanCallId, latestPlanTitle, deliverables } = extractActivitiesAndPlan(input.trajectory)
  const listProjectionValues = listState?.projectionsBySession[sessionId]?.values
  const listPlan = parsePlanProjection(readRecordField(listProjectionValues, 'plan'))
  const planSource = input.planProjection ?? listPlan

  const hasPlanInfo = planSource?.active === true || planSource?.pending === true || latestPlanCallId !== undefined
  let plan: WorkbenchPlanSummary | undefined
  if (hasPlanInfo) {
    plan = {
      active: planSource?.active === true,
      pending: planSource?.pending === true,
      ...(latestPlanCallId === undefined ? {} : { latestCallId: latestPlanCallId }),
      ...(latestPlanTitle === undefined ? {} : { latestTitle: latestPlanTitle }),
    }
  }

  const todos = input.todosProjection ?? normalizeTodos(readRecordField(listProjectionValues, 'todos'))
  const subagents = normalizeSubagents(listState, sessionId)
  const jobs = normalizeJobs(input.jobRows)

  return {
    sessionId,
    ...(input.pendingInteractionKind === undefined ? {} : { pendingInteractionKind: input.pendingInteractionKind }),
    completionUnread: input.completionUnread === true,
    ...(plan === undefined ? {} : { plan }),
    todos,
    ...(deliverables === undefined ? {} : { deliverables }),
    subagents,
    jobs,
    activities,
  }
}

/**
 * Format a canonical plan resource URL compatible with `@deepseek-ai/dsh-client-ui-plan`.
 * @param sessionId - Session owning the submitted plan invocation.
 * @param callId - Tool call ID for the `exit_plan_mode` plan item.
 * @returns Resource address for the right sidebar plan viewer.
 */
export function workbenchPlanAddress(sessionId: SessionId, callId: string): string {
  return `dsh-resource://plan/${encodeURIComponent(sessionId)}/${encodeURIComponent(callId)}`
}

/**
 * Format a canonical changes-review resource URL compatible with `@deepseek-ai/dsh-client-ui-deliverables`.
 * @param sessionId - Session owning the workspace changes.
 * @param seq - Sequence number of the `workspace/changes` event.
 * @param turn - Conversation turn number containing those changes.
 * @returns Resource address for the read-only diff review tab.
 */
export function workbenchChangesReviewAddress(sessionId: SessionId, seq: number, turn: number): string {
  return `dsh-resource://changes-review/session/${encodeURIComponent(sessionId)}/${seq}/${turn}`
}

/**
 * Format a canonical subagent chat resource URL compatible with `@deepseek-ai/dsh-client-ui-subagent`.
 * @param parentSessionId - Parent session ID that spawned the subagent.
 * @param childSessionId - Spawned child session ID.
 * @param mode - Subagent lifecycle mode string (`continuable`, etc.).
 * @returns Resource address for opening the subagent transcript tab.
 */
export function workbenchSubagentAddress(parentSessionId: SessionId, childSessionId: string, mode: string): string {
  const query = new URLSearchParams({ parent: parentSessionId, mode })
  return `dsh-resource://subagentchat/session/${encodeURIComponent(childSessionId)}?${query}`
}

/** Discriminated target chosen when switching into the Code Review layout preset. */
export type WorkbenchReviewNavigationTarget =
  | { readonly kind: 'resource'; readonly address: string }
  | { readonly kind: 'tab'; readonly tab: 'files' }

/**
 * Choose whether `Code · Review` opens the native `changes-review` Diff Viewer
 * directly (when turn changes exist) or falls back to Workspace Files.
 * @param activity - Current active session activity snapshot.
 * @returns Resource URL or right-sidebar tab target.
 */
export function resolveReviewNavigation(activity: WorkbenchActivitySnapshot): WorkbenchReviewNavigationTarget {
  const seq = activity.deliverables?.changesSeq
  const turn = activity.deliverables?.changesTurn
  if (activity.sessionId !== undefined && seq !== undefined && turn !== undefined) {
    return { kind: 'resource', address: workbenchChangesReviewAddress(activity.sessionId, seq, turn) }
  }
  return { kind: 'tab', tab: 'files' }
}

/**
 * Subscribe to optional native DSH session/activity services using Cordis lifecycle
 * effects, releasing per-session watches cleanly on session switch or plugin unload.
 * @param ctx Client plugin Cordis context.
 * @returns Observable activity snapshot source for `'shell.rightbar.global'`.
 */
export function installSessionActivityObserver(ctx: Context): {
  readonly source: ObservableSnapshot<WorkbenchActivitySnapshot>
} {
  const store = createSnapshotStore<WorkbenchActivitySnapshot>(EMPTY_ACTIVITY_SNAPSHOT)

  let sessionsSvc: ISessions | undefined
  let uiSessionSvc: UiSession | undefined
  let uiConversationSvc: UiConversation | undefined
  let jobsSvc: OptionalJobsService | undefined

  let watchedSessionId: SessionId | undefined
  let boundBinding: SessionBinding | undefined
  let activeTrajectory: ObservableSnapshot<TrajectorySnapshotShape | undefined> | undefined
  let disposeSessionWatches: () => void = () => {}

  const recompute = (): void => {
    const listState = sessionsSvc?.list.getSnapshot()
    const active = listState === undefined
      ? undefined
      : Object.values(listState.byId).find(item => (item.retainedBy.mainView ?? 0) > 0)
    const activeId = active?.id

    if (activeId !== watchedSessionId) {
      disposeSessionWatches()
      disposeSessionWatches = () => {}
      watchedSessionId = activeId
      boundBinding = undefined
      activeTrajectory = undefined

      if (activeId !== undefined) {
        const cleanups: (() => void)[] = []
        if (jobsSvc !== undefined) {
          cleanups.push(jobsSvc.watchRows(activeId))
        }
        boundBinding = sessionsSvc?.binding(activeId)
        if (boundBinding !== undefined) {
          const planFace = boundBinding.session.projections.faceOf('plan')
          const todosFace = boundBinding.session.projections.faceOf('todos')
          cleanups.push(planFace.subscribe(recompute))
          cleanups.push(todosFace.subscribe(recompute))
        }
        if (uiConversationSvc !== undefined) {
          try {
            const target = uiConversationSvc
              .binding(activeId)
              .target('trajectory' as never) as ObservableSnapshot<TrajectorySnapshotShape | undefined>
            activeTrajectory = target
            cleanups.push(target.subscribe(recompute))
          } catch {
            activeTrajectory = undefined
          }
        }
        disposeSessionWatches = () => {
          for (const cleanup of cleanups) cleanup()
        }
      }
    }

    if (activeId === undefined) {
      store.set(EMPTY_ACTIVITY_SNAPSHOT)
      return
    }

    const statusEntry = uiSessionSvc?.sessionStatus.getSnapshot().get(activeId)
    const rawPlanProj = boundBinding?.session.projections.faceOf('plan').getSnapshot()
    const rawTodosProj = boundBinding?.session.projections.faceOf('todos').getSnapshot()
    const planProj = parsePlanProjection(rawPlanProj)
    const todosProj = rawTodosProj === undefined ? undefined : normalizeTodos(rawTodosProj)
    const jobRows = jobsSvc?.state.getSnapshot().rows[activeId]
    const trajectory = activeTrajectory?.getSnapshot()

    store.set(deriveActivitySnapshot({
      listState,
      ...(statusEntry?.pendingInteraction === undefined ? {} : { pendingInteractionKind: statusEntry.pendingInteraction.kind }),
      completionUnread: statusEntry?.completionUnread === true,
      planProjection: planProj,
      todosProjection: todosProj,
      trajectory,
      jobRows,
    }))
  }

  ctx.inject(['sessions'], (scope) => {
    sessionsSvc = scope.sessions
    const unsubList = scope.sessions.list.subscribe(recompute)
    recompute()
    scope.effect(() => () => {
      unsubList()
      sessionsSvc = undefined
      disposeSessionWatches()
      disposeSessionWatches = () => {}
      watchedSessionId = undefined
      boundBinding = undefined
      activeTrajectory = undefined
      recompute()
    }, 'ui-workbench: sessions activity watch')
  })

  ctx.inject(['uiSession'], (scope) => {
    uiSessionSvc = scope.uiSession
    const unsubStatus = scope.uiSession.sessionStatus.subscribe(recompute)
    recompute()
    scope.effect(() => () => {
      unsubStatus()
      uiSessionSvc = undefined
      recompute()
    }, 'ui-workbench: session status watch')
  })

  ctx.inject(['uiConversation'], (scope) => {
    uiConversationSvc = scope.uiConversation
    // Force re-binding trajectory for current active session.
    const previousId = watchedSessionId
    watchedSessionId = undefined
    if (previousId !== undefined || sessionsSvc !== undefined) recompute()
    scope.effect(() => () => {
      uiConversationSvc = undefined
      const cur = watchedSessionId
      watchedSessionId = undefined
      if (cur !== undefined) recompute()
    }, 'ui-workbench: conversation trajectory watch')
  })

  // Optional background job monitoring (not all lightweight hosts load ui-jobs/api-job-controller).
  const initialJobs = asOptionalJobsService(ctx)
  let unsubJobs: (() => void) | undefined
  const attachJobs = (service: OptionalJobsService): void => {
    if (jobsSvc === service) return
    unsubJobs?.()
    jobsSvc = service
    unsubJobs = service.state.subscribe(recompute)
    const cur = watchedSessionId
    watchedSessionId = undefined
    if (cur !== undefined) recompute()
  }
  if (initialJobs !== undefined) {
    attachJobs(initialJobs)
  }
  ctx.effect(() => {
    const offService = ctx.on('internal/service', (name) => {
      if (name !== 'jobs') return
      const next = asOptionalJobsService(ctx)
      if (next !== undefined) {
        attachJobs(next)
      } else if (jobsSvc !== undefined) {
        unsubJobs?.()
        unsubJobs = undefined
        jobsSvc = undefined
        const cur = watchedSessionId
        watchedSessionId = undefined
        if (cur !== undefined) recompute()
      }
    })
    return () => {
      offService()
      unsubJobs?.()
      unsubJobs = undefined
      jobsSvc = undefined
      disposeSessionWatches()
      disposeSessionWatches = () => {}
    }
  }, 'ui-workbench: optional jobs watch')

  return { source: store }
}
