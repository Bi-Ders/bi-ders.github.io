/**
 * Veri erişim katmanı
 * ------------------------------------------------------------
 * Tüm bileşenler veriyi yalnızca bu dosya üzerinden okur/yazar.
 * Supabase yapılandırılmışsa gerçek veritabanı, değilse
 * src/data/mockData.ts kullanılır (Demo Modu).
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
import type {
  AdminStats,
  Book,
  Category,
  ContactInput,
  ContactMessage,
  Content,
  FavoriteItemType,
  FavoriteResolved,
  ForumReply,
  ForumTopic,
  Profile,
  Quiz,
  QuizResult,
  Role,
  SearchResults,
} from '../types'

/** Demo modunda yükleme durumlarını (skeleton) görebilmek için kısa gecikme */
const demoDelay = (ms = 350 + Math.random() * 350) => new Promise((r) => setTimeout(r, ms))

const AUTHOR = 'author:profiles(id, full_name, avatar_url, role)'
const CATEGORY = 'category:categories(*)'

function fail(error: { message: string } | null): never | void {
  if (error) throw new Error(error.message)
}

/** Demo modunda yapılan değişiklikleri (profil, favori, rol) tarayıcıda saklar */
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
// Kategoriler
// ---------------------------------------------------------------
export async function getCategories(): Promise<Category[]> {
  if (!supabase) {
    await demoDelay(150)
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
// Forum
// ---------------------------------------------------------------
export async function getForumTopics({ limit, query, categorySlug }: ListOptions = {}): Promise<ForumTopic[]> {
  if (!supabase) {
    await demoDelay()
    let list = [...mockForumTopics].sort(
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
  return (data ?? []) as unknown as ForumTopic[]
}

export async function getForumTopic(id: string): Promise<{ topic: ForumTopic; replies: ForumReply[] } | null> {
  if (!supabase) {
    await demoDelay()
    const topic = mockForumTopics.find((t) => t.id === id)
    if (!topic) return null
    return { topic, replies: mockForumReplies.filter((r) => r.topic_id === id) }
  }
  const [{ data: topic, error: e1 }, { data: replies, error: e2 }] = await Promise.all([
    supabase.from('forum_topics').select(`*, ${AUTHOR}, ${CATEGORY}`).eq('id', id).maybeSingle(),
    supabase.from('forum_replies').select(`*, ${AUTHOR}`).eq('topic_id', id).order('created_at'),
  ])
  fail(e1)
  fail(e2)
  if (!topic) return null
  void supabase.rpc('increment_view', { p_table: 'forum_topics', p_id: id })
  return { topic: topic as unknown as ForumTopic, replies: (replies ?? []) as unknown as ForumReply[] }
}

// ---------------------------------------------------------------
// Testler
// ---------------------------------------------------------------
export async function getQuizzes({ limit, query, categorySlug }: ListOptions = {}): Promise<Quiz[]> {
  if (!supabase) {
    await demoDelay()
    let list = [...mockQuizzes]
    if (categorySlug) list = list.filter((q) => q.category?.slug === categorySlug)
    if (query) list = list.filter((q) => matches([q.title, q.description, q.category?.name], query))
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
    await demoDelay(700)
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
    await demoDelay(500)
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
      return q ? { title: q.title, href: `/testler`, subtitle: q.category?.name } : null
    }
    case 'forum_topic': {
      const t = mockForumTopics.find((x) => x.id === id)
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
  ;((q.data ?? []) as Row[]).forEach((r) => lookup.set(`quiz:${r.id}`, { title: r.title, href: `/testler`, subtitle: 'Test' }))
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
    await demoDelay(200)
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
    return mockQuizResults.filter((r) => r.user_id === userId)
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
      contents: mockContents.length,
      topics: mockForumTopics.length,
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
    await demoDelay(300)
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
