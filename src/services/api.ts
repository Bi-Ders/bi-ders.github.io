/**
 * Veri erişim katmanı
 * ------------------------------------------------------------
 * Tüm bileşenler veriyi yalnızca bu dosya üzerinden okur/yazar.
 * Supabase yapılandırılmışsa gerçek veritabanı, değilse
 * src/data/mockData.ts + src/data/mockResources.ts + localStorage
 * kullanılır (Demo Modu).
 */
import { supabase } from '../lib/supabase'
import { matches } from '../lib/utils'
import {
  mockBooks,
  mockCategories,
  mockContactMessages,
  mockContents,
  mockFavorites,
  mockForumReplies,
  mockForumTopics,
  mockProfiles,
  mockQuizResults,
  mockQuizzes,
} from '../data/mockData'
import { mockActivities, mockModuleResources, mockQuizQuestions } from '../data/mockResources'
import type {
  ActivityKind,
  ActivityProvider,
  AdminStats,
  AuthorSummary,
  Book,
  Category,
  ContactInput,
  ContactMessage,
  Content,
  FavoriteItemType,
  FavoriteResolved,
  ForumReply,
  ForumTopic,
  InteractiveActivity,
  ModuleResource,
  Profile,
  Quiz,
  QuizQuestion,
  QuizResult,
  QuizSubmissionDetail,
  QuizSubmissionResult,
  ResourceModuleKey,
  Role,
  SearchResults,
} from '../types'

/** Demo modunda yükleme durumlarını (skeleton) görebilmek için kısa gecikme */
const demoDelay = (ms = 220 + Math.random() * 200) => new Promise((r) => setTimeout(r, ms))

const AUTHOR = 'author:profiles(id, full_name, avatar_url, role)'
const CATEGORY = 'category:categories(*)'

function fail(error: { message: string } | null): never | void {
  if (error) throw new Error(error.message)
}

/** Demo modunda yapılan değişiklikleri tarayıcıda (localStorage) saklar */
const demoStore = {
  get<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(`biders:demo:${key}`)
      return raw ? (JSON.parse(raw) as T) : fallback
    } catch {
      return fallback
    }
  },
  set(key: string, value: unknown) {
    try {
      localStorage.setItem(`biders:demo:${key}`, JSON.stringify(value))
    } catch {
      /* depolama kapalıysa sessizce yok say */
    }
  },
}

// ---------------------------------------------------------------
// Forum Demo Yardımcıları (localStorage kalıcılığı)
// ---------------------------------------------------------------
type TopicPatch = Partial<Pick<ForumTopic, 'is_pinned' | 'is_locked' | 'is_solved' | 'reply_count' | 'last_activity_at' | 'view_count'>>
type LikesMap = Record<string, string[]> // key: "topic:id" | "reply:id" -> userId[]

function getLikesMap(): LikesMap {
  return demoStore.get<LikesMap>('forum_likes', {})
}

function getDemoLikeCount(baseCount: number, key: string): number {
  const map = getLikesMap()
  return baseCount + (map[key]?.length ?? 0)
}

function getMergedDemoTopics(): ForumTopic[] {
  const added = demoStore.get<ForumTopic[]>('forum_topics_added', [])
  const patches = demoStore.get<Record<string, TopicPatch>>('forum_topics_patches', {})
  const deleted = new Set(demoStore.get<string[]>('forum_topics_deleted', []))
  const allReplies = getMergedDemoReplies()

  const combined = [...added, ...mockForumTopics].filter((t) => !deleted.has(t.id))
  return combined.map((t) => {
    const patch = patches[t.id]
    const topicReplies = allReplies.filter((r) => r.topic_id === t.id)
    const latestReply = topicReplies[topicReplies.length - 1]
    const baseLikes = t.like_count ?? 0
    return {
      ...t,
      ...patch,
      reply_count: topicReplies.length,
      last_activity_at: patch?.last_activity_at ?? latestReply?.created_at ?? t.last_activity_at,
      like_count: getDemoLikeCount(baseLikes, `topic:${t.id}`),
    }
  })
}

function getMergedDemoReplies(): ForumReply[] {
  const added = demoStore.get<ForumReply[]>('forum_replies_added', [])
  const acceptedMap = demoStore.get<Record<string, boolean>>('forum_replies_accepted', {})
  const deleted = new Set(demoStore.get<string[]>('forum_replies_deleted', []))

  return [...mockForumReplies, ...added]
    .filter((r) => !deleted.has(r.id))
    .map((r) => ({
      ...r,
      is_accepted: acceptedMap[r.id] !== undefined ? acceptedMap[r.id]! : r.is_accepted,
      like_count: getDemoLikeCount(r.like_count ?? 0, `reply:${r.id}`),
    }))
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
}

// ---------------------------------------------------------------
// Kategoriler
// ---------------------------------------------------------------
export async function getCategories(): Promise<Category[]> {
  if (!supabase) {
    await demoDelay(120)
    return mockCategories
  }
  const { data, error } = await supabase.from('categories').select('*').order('sort_order')
  fail(error)
  return (data ?? []) as Category[]
}

// ---------------------------------------------------------------
// İçerikler
// ---------------------------------------------------------------
type ListOptions = { limit?: number; query?: string; categorySlug?: string }

export async function getContents({ limit, query, categorySlug }: ListOptions = {}): Promise<Content[]> {
  if (!supabase) {
    await demoDelay()
    let list = [...mockContents].sort((a, b) => (b.published_at ?? '').localeCompare(a.published_at ?? ''))
    if (categorySlug) list = list.filter((c) => c.category?.slug === categorySlug)
    if (query) list = list.filter((c) => matches([c.title, c.summary, c.category?.name, ...c.tags], query))
    return limit ? list.slice(0, limit) : list
  }
  let q = supabase
    .from('contents')
    .select(`*, ${AUTHOR}, ${categorySlug ? 'category:categories!inner(*)' : CATEGORY}`)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
  if (categorySlug) q = q.eq('category.slug', categorySlug)
  if (query) q = q.textSearch('search_vector', query, { type: 'websearch', config: 'turkish' })
  if (limit) q = q.limit(limit)
  const { data, error } = await q
  fail(error)
  return (data ?? []) as unknown as Content[]
}

export async function getContentBySlug(slug: string): Promise<Content | null> {
  if (!supabase) {
    await demoDelay()
    return mockContents.find((c) => c.slug === slug) ?? null
  }
  const { data, error } = await supabase
    .from('contents')
    .select(`*, ${AUTHOR}, ${CATEGORY}`)
    .eq('slug', slug)
    .maybeSingle()
  fail(error)
  if (data) void supabase.rpc('increment_view', { p_table: 'contents', p_id: data.id })
  return data as unknown as Content | null
}

// ---------------------------------------------------------------
// 5 Doküman Modülü (Sunular, Ders Notları, Yazılılar, Sınavlar, Evraklar)
// ---------------------------------------------------------------
export type ResourceFilterOptions = {
  grade?: string
  categorySlug?: string
  unit?: string
  query?: string
}

export async function getModuleResources(
  module: ResourceModuleKey,
  { grade, categorySlug, unit, query }: ResourceFilterOptions = {},
): Promise<{ items: ModuleResource[]; grades: string[]; units: string[] }> {
  await demoDelay(180)
  const downloadOffsets = demoStore.get<Record<string, number>>('resource_downloads', {})

  const base = mockModuleResources
    .filter((r) => r.module === module)
    .map((r) => ({
      ...r,
      download_count: r.download_count + (downloadOffsets[r.id] ?? 0),
    }))
    .sort((a, b) => b.published_at.localeCompare(a.published_at))

  const grades = Array.from(new Set(base.map((r) => r.grade)))
  const unitSource = base.filter(
    (r) => (!grade || r.grade === grade) && (!categorySlug || r.category?.slug === categorySlug),
  )
  const units = Array.from(new Set(unitSource.map((r) => r.unit)))

  let filtered = base
  if (grade) filtered = filtered.filter((r) => r.grade === grade)
  if (categorySlug) filtered = filtered.filter((r) => r.category?.slug === categorySlug)
  if (unit) filtered = filtered.filter((r) => r.unit === unit)
  if (query) {
    filtered = filtered.filter((r) =>
      matches([r.title, r.summary, r.unit, r.grade, r.category?.name, r.format, ...r.tags], query),
    )
  }

  return { items: filtered, grades, units }
}

export function recordResourceDownload(resourceId: string): number {
  const offsets = demoStore.get<Record<string, number>>('resource_downloads', {})
  offsets[resourceId] = (offsets[resourceId] ?? 0) + 1
  demoStore.set('resource_downloads', offsets)
  const base = mockModuleResources.find((r) => r.id === resourceId)?.download_count ?? 0
  return base + offsets[resourceId]!
}

// ---------------------------------------------------------------
// Oyun & Etkinlikler (/etkinlikler) — Testlerden tamamen ayrı
// ---------------------------------------------------------------
export type ActivityFilterOptions = {
  kind?: ActivityKind
  grade?: string
  categorySlug?: string
  query?: string
}

export async function getInteractiveActivities({
  kind,
  grade,
  categorySlug,
  query,
}: ActivityFilterOptions = {}): Promise<{ items: InteractiveActivity[]; grades: string[] }> {
  await demoDelay(180)
  const custom = demoStore.get<InteractiveActivity[]>('custom_activities', [])
  const playOffsets = demoStore.get<Record<string, number>>('activity_plays', {})

  const all = [...custom, ...mockActivities]
    .map((a) => ({
      ...a,
      play_count: a.play_count + (playOffsets[a.id] ?? 0),
    }))
    .sort((a, b) => b.created_at.localeCompare(a.created_at))

  const grades = Array.from(new Set(all.map((a) => a.grade)))

  let filtered = all
  if (kind) filtered = filtered.filter((a) => a.kind === kind)
  if (grade) filtered = filtered.filter((a) => a.grade === grade)
  if (categorySlug) filtered = filtered.filter((a) => a.category?.slug === categorySlug)
  if (query) {
    filtered = filtered.filter((a) =>
      matches([a.title, a.description, a.unit, a.grade, a.provider, a.category?.name, ...a.tags], query),
    )
  }

  return { items: filtered, grades }
}

export function recordActivityPlay(activityId: string): number {
  const offsets = demoStore.get<Record<string, number>>('activity_plays', {})
  offsets[activityId] = (offsets[activityId] ?? 0) + 1
  demoStore.set('activity_plays', offsets)
  const custom = demoStore.get<InteractiveActivity[]>('custom_activities', [])
  const item = [...custom, ...mockActivities].find((a) => a.id === activityId)
  return (item?.play_count ?? 0) + offsets[activityId]!
}

export type CustomActivityInput = {
  title: string
  description: string
  kind: ActivityKind
  provider: ActivityProvider
  grade: string
  category_id: string | null
  unit: string
  embed_url: string
}

export async function createCustomActivity(
  input: CustomActivityInput,
  author: AuthorSummary | null,
): Promise<InteractiveActivity> {
  await demoDelay(200)
  const category = input.category_id ? mockCategories.find((c) => c.id === input.category_id) ?? null : null
  const created: InteractiveActivity = {
    id: `act-custom-${crypto.randomUUID()}`,
    title: input.title.trim(),
    description: input.description.trim() || 'Harici güvenli iframe embed etkinliği.',
    kind: input.kind,
    provider: input.provider,
    grade: input.grade.trim() || 'Genel',
    category_id: category?.id ?? null,
    category,
    unit: input.unit.trim() || 'Genel',
    duration_minutes: 5,
    play_count: 1,
    gradient:
      input.kind === 'game'
        ? 'from-fuchsia-600 via-purple-600 to-indigo-600'
        : 'from-cyan-600 via-blue-600 to-indigo-600',
    embed_url: input.embed_url,
    tags: [input.provider, input.kind === 'game' ? 'oyun' : 'etkinlik'],
    author,
    created_at: new Date().toISOString(),
  }
  const existing = demoStore.get<InteractiveActivity[]>('custom_activities', [])
  demoStore.set('custom_activities', [created, ...existing])
  return created
}

// ---------------------------------------------------------------
// Forum
// ---------------------------------------------------------------
export async function getForumTopics({ limit, query, categorySlug }: ListOptions = {}): Promise<ForumTopic[]> {
  if (!supabase) {
    await demoDelay()
    let list = getMergedDemoTopics().sort(
      (a, b) => Number(b.is_pinned) - Number(a.is_pinned) || b.last_activity_at.localeCompare(a.last_activity_at),
    )
    if (categorySlug) list = list.filter((t) => t.category?.slug === categorySlug)
    if (query) list = list.filter((t) => matches([t.title, t.body, ...t.tags], query))
    return limit ? list.slice(0, limit) : list
  }
  let q = supabase
    .from('forum_topics')
    .select(`*, ${AUTHOR}, ${categorySlug ? 'category:categories!inner(*)' : CATEGORY}`)
    .order('is_pinned', { ascending: false })
    .order('last_activity_at', { ascending: false })
  if (categorySlug) q = q.eq('category.slug', categorySlug)
  if (query) q = q.ilike('title', `%${query}%`)
  if (limit) q = q.limit(limit)
  const { data, error } = await q
  fail(error)
  const likesMap = getLikesMap()
  return ((data ?? []) as unknown as ForumTopic[]).map((t) => ({
    ...t,
    like_count: likesMap[`topic:${t.id}`]?.length ?? 0,
  }))
}

export async function getForumTopic(id: string): Promise<{ topic: ForumTopic; replies: ForumReply[] } | null> {
  if (!supabase) {
    await demoDelay()
    const topic = getMergedDemoTopics().find((t) => t.id === id)
    if (!topic) return null
    const replies = getMergedDemoReplies().filter((r) => r.topic_id === id)
    return { topic, replies }
  }
  const [{ data: topic, error: e1 }, { data: replies, error: e2 }] = await Promise.all([
    supabase.from('forum_topics').select(`*, ${AUTHOR}, ${CATEGORY}`).eq('id', id).maybeSingle(),
    supabase.from('forum_replies').select(`*, ${AUTHOR}`).eq('topic_id', id).order('created_at'),
  ])
  fail(e1)
  fail(e2)
  if (!topic) return null
  void supabase.rpc('increment_view', { p_table: 'forum_topics', p_id: id })
  const likesMap = getLikesMap()
  return {
    topic: {
      ...(topic as unknown as ForumTopic),
      like_count: likesMap[`topic:${id}`]?.length ?? 0,
    },
    replies: ((replies ?? []) as unknown as ForumReply[]).map((r) => ({
      ...r,
      like_count: likesMap[`reply:${r.id}`]?.length ?? 0,
    })),
  }
}

export type CreateForumTopicInput = {
  title: string
  body: string
  category_id: string | null
  tags: string[]
}

export async function createForumTopic(input: CreateForumTopicInput, author: AuthorSummary): Promise<ForumTopic> {
  const title = input.title.trim()
  const body = input.body.trim()
  if (title.length < 5) throw new Error('Konu başlığı en az 5 karakter olmalıdır.')
  if (body.length < 10) throw new Error('Konu açıklaması en az 10 karakter olmalıdır.')

  if (!supabase) {
    await demoDelay(250)
    const now = new Date().toISOString()
    const category = input.category_id ? mockCategories.find((c) => c.id === input.category_id) ?? null : null
    const topic: ForumTopic = {
      id: `ft-${crypto.randomUUID()}`,
      author_id: author.id,
      category_id: category?.id ?? null,
      title,
      body,
      tags: input.tags,
      is_pinned: false,
      is_locked: false,
      is_solved: false,
      reply_count: 0,
      view_count: 1,
      like_count: 0,
      last_activity_at: now,
      created_at: now,
      author,
      category,
    }
    const existing = demoStore.get<ForumTopic[]>('forum_topics_added', [])
    demoStore.set('forum_topics_added', [topic, ...existing])
    return topic
  }

  const { data, error } = await supabase
    .from('forum_topics')
    .insert({
      author_id: author.id,
      category_id: input.category_id,
      title,
      body,
      tags: input.tags,
    })
    .select(`*, ${AUTHOR}, ${CATEGORY}`)
    .single()
  fail(error)
  return data as unknown as ForumTopic
}

export async function createForumReply(topicId: string, body: string, author: AuthorSummary): Promise<ForumReply> {
  const clean = body.trim()
  if (clean.length < 2) throw new Error('Yorum en az 2 karakter olmalıdır.')

  if (!supabase) {
    await demoDelay(220)
    const now = new Date().toISOString()
    const reply: ForumReply = {
      id: `fr-${crypto.randomUUID()}`,
      topic_id: topicId,
      author_id: author.id,
      body: clean,
      is_accepted: false,
      like_count: 0,
      created_at: now,
      author,
    }
    const added = demoStore.get<ForumReply[]>('forum_replies_added', [])
    demoStore.set('forum_replies_added', [...added, reply])
    const patches = demoStore.get<Record<string, TopicPatch>>('forum_topics_patches', {})
    patches[topicId] = { ...patches[topicId], last_activity_at: now }
    demoStore.set('forum_topics_patches', patches)
    return reply
  }

  const { data, error } = await supabase
    .from('forum_replies')
    .insert({ topic_id: topicId, author_id: author.id, body: clean })
    .select(`*, ${AUTHOR}`)
    .single()
  fail(error)
  return data as unknown as ForumReply
}

export async function updateForumTopic(
  topicId: string,
  patch: Partial<Pick<ForumTopic, 'is_pinned' | 'is_locked' | 'is_solved'>>,
): Promise<void> {
  if (!supabase) {
    await demoDelay(150)
    const patches = demoStore.get<Record<string, TopicPatch>>('forum_topics_patches', {})
    patches[topicId] = { ...patches[topicId], ...patch }
    demoStore.set('forum_topics_patches', patches)
    return
  }
  const { error } = await supabase.from('forum_topics').update(patch).eq('id', topicId)
  fail(error)
}

export async function deleteForumTopic(topicId: string): Promise<void> {
  if (!supabase) {
    await demoDelay(200)
    const deleted = demoStore.get<string[]>('forum_topics_deleted', [])
    if (!deleted.includes(topicId)) {
      demoStore.set('forum_topics_deleted', [...deleted, topicId])
    }
    return
  }
  const { error } = await supabase.from('forum_topics').delete().eq('id', topicId)
  fail(error)
}

export async function toggleReplyAccepted(topicId: string, replyId: string, nextValue: boolean): Promise<void> {
  if (!supabase) {
    await demoDelay(150)
    const acceptedMap = demoStore.get<Record<string, boolean>>('forum_replies_accepted', {})
    acceptedMap[replyId] = nextValue
    demoStore.set('forum_replies_accepted', acceptedMap)
    const topicReplies = getMergedDemoReplies().filter((r) => r.topic_id === topicId)
    const anyAccepted = topicReplies.some((r) => (r.id === replyId ? nextValue : r.is_accepted))
    const patches = demoStore.get<Record<string, TopicPatch>>('forum_topics_patches', {})
    patches[topicId] = { ...patches[topicId], is_solved: anyAccepted }
    demoStore.set('forum_topics_patches', patches)
    return
  }
  const { error } = await supabase.from('forum_replies').update({ is_accepted: nextValue }).eq('id', replyId)
  fail(error)
}

export async function deleteForumReply(replyId: string): Promise<void> {
  if (!supabase) {
    await demoDelay(150)
    const deleted = demoStore.get<string[]>('forum_replies_deleted', [])
    if (!deleted.includes(replyId)) {
      demoStore.set('forum_replies_deleted', [...deleted, replyId])
    }
    return
  }
  const { error } = await supabase.from('forum_replies').delete().eq('id', replyId)
  fail(error)
}

export function isForumItemLiked(userId: string | null | undefined, targetType: 'topic' | 'reply', targetId: string): boolean {
  if (!userId) return false
  const map = getLikesMap()
  return (map[`${targetType}:${targetId}`] ?? []).includes(userId)
}

export async function toggleForumLike(
  userId: string,
  targetType: 'topic' | 'reply',
  targetId: string,
  baseCount = 0,
): Promise<{ liked: boolean; count: number }> {
  await demoDelay(100)
  const key = `${targetType}:${targetId}`
  const map = getLikesMap()
  const current = map[key] ?? []
  const exists = current.includes(userId)
  const next = exists ? current.filter((u) => u !== userId) : [...current, userId]
  map[key] = next
  demoStore.set('forum_likes', map)
  return { liked: !exists, count: baseCount + next.length }
}

// ---------------------------------------------------------------
// Testler & Etkileşimli Test Motoru
// ---------------------------------------------------------------
export async function getQuizzes({ limit, query, categorySlug }: ListOptions = {}): Promise<Quiz[]> {
  if (!supabase) {
    await demoDelay()
    let list = mockQuizzes.map((q) => ({
      ...q,
      question_count: mockQuizQuestions[q.id]?.length ?? q.question_count ?? 0,
    }))
    if (categorySlug) list = list.filter((q) => q.category?.slug === categorySlug)
    if (query) list = list.filter((q) => matches([q.title, q.description, q.grade, q.category?.name], query))
    return limit ? list.slice(0, limit) : list
  }
  let q = supabase
    .from('quizzes')
    .select(`*, ${AUTHOR}, ${categorySlug ? 'category:categories!inner(*)' : CATEGORY}, quiz_questions(count)`)
    .eq('is_published', true)
    .order('created_at', { ascending: false })
  if (categorySlug) q = q.eq('category.slug', categorySlug)
  if (query) q = q.ilike('title', `%${query}%`)
  if (limit) q = q.limit(limit)
  const { data, error } = await q
  fail(error)
  return ((data ?? []) as unknown as Array<Quiz & { quiz_questions?: Array<{ count: number }> }>).map((row) => ({
    ...row,
    question_count: row.quiz_questions?.[0]?.count ?? 0,
  }))
}

export async function getQuizWithQuestions(idOrSlug: string): Promise<{ quiz: Quiz; questions: QuizQuestion[] } | null> {
  if (!supabase) {
    await demoDelay(200)
    const quiz = mockQuizzes.find((q) => q.id === idOrSlug || q.slug === idOrSlug)
    if (!quiz) return null
    const questions = mockQuizQuestions[quiz.id] ?? []
    return {
      quiz: { ...quiz, question_count: questions.length },
      questions,
    }
  }

  const byId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug)
  const { data: quiz, error: e1 } = await supabase
    .from('quizzes')
    .select(`*, ${AUTHOR}, ${CATEGORY}`)
    .eq(byId ? 'id' : 'slug', idOrSlug)
    .maybeSingle()
  fail(e1)
  if (!quiz) return null

  const { data: questions, error: e2 } = await supabase
    .from('quiz_questions')
    .select('id, quiz_id, question, image_url, options, sort_order')
    .eq('quiz_id', quiz.id)
    .order('sort_order')
  fail(e2)

  const normalizedQuestions: QuizQuestion[] = ((questions ?? []) as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id),
    quiz_id: String(row.quiz_id),
    question: String(row.question),
    image_url: (row.image_url as string | null) ?? null,
    options: Array.isArray(row.options) ? row.options.map(String) : [],
    sort_order: Number(row.sort_order ?? 0),
  }))

  return {
    quiz: { ...(quiz as unknown as Quiz), question_count: normalizedQuestions.length },
    questions: normalizedQuestions,
  }
}

export async function submitQuiz(
  quiz: Quiz,
  questions: QuizQuestion[],
  answers: Record<string, number>,
  durationSeconds: number,
  userId?: string | null,
): Promise<QuizSubmissionResult> {
  if (!supabase) {
    await demoDelay(250)
    let score = 0
    const details: QuizSubmissionDetail[] = questions.map((q) => {
      const selected = answers[q.id] !== undefined ? answers[q.id]! : null
      const correct = q.correct_option ?? 0
      const isCorrect = selected !== null && selected === correct
      if (isCorrect) score += 1
      return {
        question_id: q.id,
        selected,
        correct_option: correct,
        is_correct: isCorrect,
        explanation: q.explanation ?? null,
      }
    })

    const resultId = `qr-${crypto.randomUUID()}`
    let saved = false
    if (userId) {
      const record: QuizResult = {
        id: resultId,
        quiz_id: quiz.id,
        user_id: userId,
        score,
        total: questions.length,
        duration_seconds: durationSeconds,
        created_at: new Date().toISOString(),
        quiz: { id: quiz.id, title: quiz.title, slug: quiz.slug },
      }
      const existing = demoStore.get<QuizResult[]>('quiz_results', [])
      demoStore.set('quiz_results', [record, ...existing])
      saved = true
    }

    return {
      result_id: resultId,
      score,
      total: questions.length,
      duration_seconds: durationSeconds,
      details,
      saved,
    }
  }

  if (!userId) {
    throw new Error('Test sonucunu kaydetmek ve puanlamak için giriş yapmalısınız.')
  }

  const { data, error } = await supabase.rpc('submit_quiz', {
    p_quiz_id: quiz.id,
    p_answers: answers,
    p_duration_seconds: durationSeconds,
  })
  fail(error)

  const payload = data as {
    result_id: string
    score: number
    total: number
    details: QuizSubmissionDetail[]
  }
  return {
    result_id: payload.result_id,
    score: payload.score,
    total: payload.total,
    duration_seconds: durationSeconds,
    details: payload.details ?? [],
    saved: true,
  }
}

// ---------------------------------------------------------------
// Kitaplar
// ---------------------------------------------------------------
export async function getBooks({ limit, query, categorySlug }: ListOptions = {}): Promise<Book[]> {
  if (!supabase) {
    await demoDelay()
    let list = [...mockBooks]
    if (categorySlug) list = list.filter((b) => b.category?.slug === categorySlug)
    if (query) list = list.filter((b) => matches([b.title, b.author, b.description, b.category?.name], query))
    return limit ? list.slice(0, limit) : list
  }
  let q = supabase
    .from('books')
    .select(`*, ${categorySlug ? 'category:categories!inner(*)' : CATEGORY}`)
    .eq('is_published', true)
    .order('created_at', { ascending: false })
  if (categorySlug) q = q.eq('category.slug', categorySlug)
  if (query) q = q.or(`title.ilike.%${query}%,author.ilike.%${query}%`)
  if (limit) q = q.limit(limit)
  const { data, error } = await q
  fail(error)
  return (data ?? []) as unknown as Book[]
}

// ---------------------------------------------------------------
// Arama
// ---------------------------------------------------------------
export async function searchAll(query: string): Promise<SearchResults> {
  const q = query.trim().replace(/[%,()]/g, ' ')
  if (!q) return { contents: [], topics: [], quizzes: [], books: [] }
  const [contents, topics, quizzes, books] = await Promise.all([
    getContents({ query: q, limit: 8 }),
    getForumTopics({ query: q, limit: 8 }),
    getQuizzes({ query: q, limit: 6 }),
    getBooks({ query: q, limit: 6 }),
  ])
  return { contents, topics, quizzes, books }
}

// ---------------------------------------------------------------
// İletişim
// ---------------------------------------------------------------
export async function sendContactMessage(input: ContactInput, userId?: string | null): Promise<void> {
  if (!supabase) {
    await demoDelay(500)
    const list = demoStore.get<ContactMessage[]>('messages', [])
    list.unshift({ ...input, id: crypto.randomUUID(), user_id: userId ?? null, status: 'new', created_at: new Date().toISOString() })
    demoStore.set('messages', list)
    return
  }
  // Not: anon kullanıcılar satırı geri okuyamaz; bu yüzden .select() kullanılmaz.
  const { error } = await supabase.from('contact_messages').insert({ ...input, user_id: userId ?? null })
  fail(error)
}

// ---------------------------------------------------------------
// Profil
// ---------------------------------------------------------------
export type ProfilePatch = Partial<Pick<Profile, 'full_name' | 'username' | 'bio' | 'school' | 'grade' | 'avatar_url'>>

export async function fetchProfile(userId: string): Promise<Profile | null> {
  if (!supabase) return null
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  fail(error)
  return data as Profile | null
}

export async function updateProfile(userId: string, patch: ProfilePatch): Promise<Profile | null> {
  if (!supabase) {
    await demoDelay(350)
    const saved = demoStore.get<Record<string, ProfilePatch>>('profiles', {})
    saved[userId] = { ...saved[userId], ...patch }
    demoStore.set('profiles', saved)
    return null
  }
  const { data, error } = await supabase.from('profiles').update(patch).eq('id', userId).select().single()
  if (error?.code === '23505') throw new Error('Bu kullanıcı adı zaten alınmış.')
  fail(error)
  return data as Profile
}

export function getDemoProfilePatch(userId: string): ProfilePatch {
  return demoStore.get<Record<string, ProfilePatch>>('profiles', {})[userId] ?? {}
}

// ---------------------------------------------------------------
// Favoriler
// ---------------------------------------------------------------
function resolveFavoriteDemo(type: FavoriteItemType, id: string): Pick<FavoriteResolved, 'title' | 'href' | 'subtitle'> | null {
  switch (type) {
    case 'content': {
      const c = mockContents.find((x) => x.id === id)
      return c ? { title: c.title, href: `/dersler/${c.slug}`, subtitle: c.category?.name } : null
    }
    case 'book': {
      const b = mockBooks.find((x) => x.id === id)
      return b ? { title: b.title, href: `/kitaplar?ara=${encodeURIComponent(b.title)}`, subtitle: b.author ?? undefined } : null
    }
    case 'quiz': {
      const q = mockQuizzes.find((x) => x.id === id)
      return q ? { title: q.title, href: `/testler/${q.id}`, subtitle: q.category?.name } : null
    }
    case 'forum_topic': {
      const t = getMergedDemoTopics().find((x) => x.id === id)
      return t ? { title: t.title, href: `/forum/${t.id}`, subtitle: 'Forum' } : null
    }
  }
}

export async function getFavorites(userId: string): Promise<FavoriteResolved[]> {
  if (!supabase) {
    await demoDelay()
    const favs = demoStore.get('favorites', mockFavorites.filter((f) => f.user_id === userId))
    return favs.flatMap((f) => {
      const r = resolveFavoriteDemo(f.item_type, f.item_id)
      return r ? [{ ...f, ...r }] : []
    })
  }
  const { data, error } = await supabase
    .from('favorites')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  fail(error)
  const favs = data ?? []
  const idsOf = (t: FavoriteItemType) => favs.filter((f) => f.item_type === t).map((f) => f.item_id as string)
  const [c, b, q, t] = await Promise.all([
    idsOf('content').length ? supabase.from('contents').select('id, title, slug').in('id', idsOf('content')) : { data: [] },
    idsOf('book').length ? supabase.from('books').select('id, title, author').in('id', idsOf('book')) : { data: [] },
    idsOf('quiz').length ? supabase.from('quizzes').select('id, title, slug').in('id', idsOf('quiz')) : { data: [] },
    idsOf('forum_topic').length ? supabase.from('forum_topics').select('id, title').in('id', idsOf('forum_topic')) : { data: [] },
  ])
  type Row = { id: string; title: string; slug?: string; author?: string }
  const lookup = new Map<string, Pick<FavoriteResolved, 'title' | 'href' | 'subtitle'>>()
  ;((c.data ?? []) as Row[]).forEach((r) => lookup.set(`content:${r.id}`, { title: r.title, href: `/dersler/${r.slug}`, subtitle: 'Ders' }))
  ;((b.data ?? []) as Row[]).forEach((r) => lookup.set(`book:${r.id}`, { title: r.title, href: `/kitaplar?ara=${encodeURIComponent(r.title)}`, subtitle: r.author }))
  ;((q.data ?? []) as Row[]).forEach((r) => lookup.set(`quiz:${r.id}`, { title: r.title, href: `/testler/${r.id}`, subtitle: 'Test' }))
  ;((t.data ?? []) as Row[]).forEach((r) => lookup.set(`forum_topic:${r.id}`, { title: r.title, href: `/forum/${r.id}`, subtitle: 'Forum' }))
  return favs.flatMap((f) => {
    const r = lookup.get(`${f.item_type}:${f.item_id}`)
    return r ? [{ ...(f as FavoriteResolved), ...r }] : []
  })
}

export async function isFavorite(userId: string, type: FavoriteItemType, itemId: string): Promise<boolean> {
  if (!supabase) {
    const favs = demoStore.get('favorites', mockFavorites.filter((f) => f.user_id === userId))
    return favs.some((f) => f.item_type === type && f.item_id === itemId)
  }
  const { count, error } = await supabase
    .from('favorites')
    .select('id', { count: 'exact', head: true })
    .match({ user_id: userId, item_type: type, item_id: itemId })
  fail(error)
  return (count ?? 0) > 0
}

export async function toggleFavorite(userId: string, type: FavoriteItemType, itemId: string): Promise<boolean> {
  if (!supabase) {
    await demoDelay(150)
    const favs = demoStore.get('favorites', mockFavorites.filter((f) => f.user_id === userId))
    const exists = favs.some((f) => f.item_type === type && f.item_id === itemId)
    const next = exists
      ? favs.filter((f) => !(f.item_type === type && f.item_id === itemId))
      : [{ id: crypto.randomUUID(), user_id: userId, item_type: type, item_id: itemId, created_at: new Date().toISOString() }, ...favs]
    demoStore.set('favorites', next)
    return !exists
  }
  if (await isFavorite(userId, type, itemId)) {
    const { error } = await supabase.from('favorites').delete().match({ user_id: userId, item_type: type, item_id: itemId })
    fail(error)
    return false
  }
  const { error } = await supabase.from('favorites').insert({ user_id: userId, item_type: type, item_id: itemId })
  fail(error)
  return true
}

// ---------------------------------------------------------------
// Test sonuçları
// ---------------------------------------------------------------
export async function getQuizResults(userId: string): Promise<QuizResult[]> {
  if (!supabase) {
    await demoDelay()
    const saved = demoStore.get<QuizResult[]>('quiz_results', []).filter((r) => r.user_id === userId)
    const seeded = mockQuizResults.filter((r) => r.user_id === userId)
    return [...saved, ...seeded].sort((a, b) => b.created_at.localeCompare(a.created_at))
  }
  const { data, error } = await supabase
    .from('quiz_results')
    .select('id, quiz_id, user_id, score, total, duration_seconds, created_at, quiz:quizzes(id, title, slug)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)
  fail(error)
  return (data ?? []) as unknown as QuizResult[]
}

// ---------------------------------------------------------------
// Yönetim paneli
// ---------------------------------------------------------------
export async function getAdminStats(): Promise<AdminStats> {
  if (!supabase) {
    await demoDelay()
    const msgs = [...demoStore.get<ContactMessage[]>('messages', []), ...mockContactMessages]
    return {
      users: mockProfiles.length,
      contents: mockContents.length + mockModuleResources.length,
      topics: getMergedDemoTopics().length,
      quizzes: mockQuizzes.length,
      books: mockBooks.length,
      newMessages: msgs.filter((m) => m.status === 'new').length,
    }
  }
  const count = async (table: string, filter?: [string, string]) => {
    let q = supabase!.from(table).select('id', { count: 'exact', head: true })
    if (filter) q = q.eq(filter[0], filter[1])
    const { count: c } = await q
    return c ?? 0
  }
  const [users, contents, topics, quizzes, books, newMessages] = await Promise.all([
    count('profiles'),
    count('contents'),
    count('forum_topics'),
    count('quizzes'),
    count('books'),
    count('contact_messages', ['status', 'new']),
  ])
  return { users, contents, topics, quizzes, books, newMessages }
}

export async function getContactMessages(): Promise<ContactMessage[]> {
  if (!supabase) {
    await demoDelay()
    return [...demoStore.get<ContactMessage[]>('messages', []), ...mockContactMessages]
  }
  const { data, error } = await supabase.from('contact_messages').select('*').order('created_at', { ascending: false }).limit(50)
  fail(error)
  return (data ?? []) as ContactMessage[]
}

export async function getAllProfiles(): Promise<Profile[]> {
  if (!supabase) {
    await demoDelay()
    const roles = demoStore.get<Record<string, Role>>('roles', {})
    return mockProfiles.map((p) => ({ ...p, role: roles[p.id] ?? p.role }))
  }
  const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(100)
  fail(error)
  return (data ?? []) as Profile[]
}

export async function setUserRole(userId: string, role: Role): Promise<void> {
  if (!supabase) {
    await demoDelay(250)
    const roles = demoStore.get<Record<string, Role>>('roles', {})
    roles[userId] = role
    demoStore.set('roles', roles)
    return
  }
  const { error } = await supabase.from('profiles').update({ role }).eq('id', userId)
  fail(error)
}

export async function getManagedContents(authorId: string, isAdmin: boolean): Promise<Content[]> {
  if (!supabase) {
    await demoDelay()
    return isAdmin ? mockContents : mockContents.filter((c) => c.author_id === authorId)
  }
  let q = supabase.from('contents').select(`*, ${AUTHOR}, ${CATEGORY}`).order('created_at', { ascending: false }).limit(50)
  if (!isAdmin) q = q.eq('author_id', authorId)
  const { data, error } = await q
  fail(error)
  return (data ?? []) as unknown as Content[]
}
