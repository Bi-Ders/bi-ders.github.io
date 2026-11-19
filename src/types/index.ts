export type Role = 'student' | 'teacher' | 'admin'

export type Profile = {
  id: string
  full_name: string | null
  username: string | null
  avatar_url: string | null
  bio: string | null
  school: string | null
  grade: string | null
  role: Role
  created_at: string
  /** Yalnızca istemci tarafında doldurulur (auth.users'tan) */
  email?: string | null
}

export type AuthorSummary = Pick<Profile, 'id' | 'full_name' | 'avatar_url' | 'role'>

export type Category = {
  id: string
  slug: string
  name: string
  description: string | null
  icon: string | null
  color: string | null
  sort_order: number
}

export type ContentType = 'lesson' | 'article' | 'video' | 'document'
export type ContentStatus = 'draft' | 'pending' | 'published' | 'archived'

export type Content = {
  id: string
  author_id: string
  category_id: string | null
  title: string
  slug: string
  summary: string | null
  body: string | null
  type: ContentType
  status: ContentStatus
  grade: string | null
  cover_url: string | null
  file_url: string | null
  video_url: string | null
  tags: string[]
  view_count: number
  published_at: string | null
  created_at: string
  author?: AuthorSummary | null
  category?: Category | null
}

export type ForumTopic = {
  id: string
  author_id: string
  category_id: string | null
  title: string
  body: string
  tags: string[]
  is_pinned: boolean
  is_locked: boolean
  is_solved: boolean
  reply_count: number
  view_count: number
  last_activity_at: string
  created_at: string
  author?: AuthorSummary | null
  category?: Category | null
}

export type ForumReply = {
  id: string
  topic_id: string
  author_id: string
  body: string
  is_accepted: boolean
  created_at: string
  author?: AuthorSummary | null
}

export type Difficulty = 'easy' | 'medium' | 'hard'

export type Quiz = {
  id: string
  author_id: string
  category_id: string | null
  title: string
  slug: string
  description: string | null
  grade: string | null
  difficulty: Difficulty
  time_limit_minutes: number | null
  is_published: boolean
  created_at: string
  question_count?: number
  author?: AuthorSummary | null
  category?: Category | null
}

export type QuizResult = {
  id: string
  quiz_id: string
  user_id: string
  score: number
  total: number
  duration_seconds: number | null
  created_at: string
  quiz?: Pick<Quiz, 'id' | 'title' | 'slug'> | null
}

export type Book = {
  id: string
  added_by: string | null
  category_id: string | null
  title: string
  author: string | null
  publisher: string | null
  isbn: string | null
  description: string | null
  grade: string | null
  cover_url: string | null
  file_url: string | null
  external_url: string | null
  page_count: number | null
  published_year: number | null
  is_published: boolean
  created_at: string
  category?: Category | null
}

export type FavoriteItemType = 'content' | 'book' | 'quiz' | 'forum_topic'

export type Favorite = {
  id: string
  user_id: string
  item_type: FavoriteItemType
  item_id: string
  created_at: string
}

export type FavoriteResolved = Favorite & {
  title: string
  href: string
  subtitle?: string
}

export type MessageStatus = 'new' | 'read' | 'replied' | 'archived'

export type ContactMessage = {
  id: string
  user_id: string | null
  name: string
  email: string
  subject: string | null
  message: string
  status: MessageStatus
  created_at: string
}

export type ContactInput = Pick<ContactMessage, 'name' | 'email' | 'subject' | 'message'>

export type SearchResults = {
  contents: Content[]
  topics: ForumTopic[]
  quizzes: Quiz[]
  books: Book[]
}

export type AdminStats = {
  users: number
  contents: number
  topics: number
  quizzes: number
  books: number
  newMessages: number
}
