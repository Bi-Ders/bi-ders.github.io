import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  Lock,
  LogIn,
  MessageSquare,
  Pin,
  PinOff,
  Send,
  Shield,
  ThumbsUp,
  Trash2,
  Unlock,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useAsync, usePageMeta } from '../hooks'
import {
  createForumReply,
  deleteForumReply,
  deleteForumTopic,
  getForumTopic,
  isFavorite,
  isForumItemLiked,
  subscribeForumReplies,
  toggleFavorite,
  toggleForumLike,
  toggleReplyAccepted,
  updateForumTopic,
} from '../services/api'
import { cn, formatDate, timeAgo } from '../lib/utils'
import { Avatar, Badge, CategoryTag, RoleBadge } from '../components/ui/Display'
import { Button, ButtonLink } from '../components/ui/Button'
import { Alert, EmptyState, ErrorState, Skeleton } from '../components/ui/Feedback'

export function ForumDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { user, profile, isStaff, openAuth } = useAuth()
  const { data, error, loading, reload, setData } = useAsync(() => getForumTopic(id), [id])

  const [fav, setFav] = useState(false)
  const [favBusy, setFavBusy] = useState(false)
  const [likeOverrides, setLikeOverrides] = useState<Record<string, { liked: boolean; count: number }>>({})

  const [replyBody, setReplyBody] = useState('')
  const [replyBusy, setReplyBusy] = useState(false)
  const [replyError, setReplyError] = useState<string | null>(null)

  const [modBusy, setModBusy] = useState<string | null>(null)
  const [modMessage, setModMessage] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const topicId = data?.topic.id ?? null

  usePageMeta(data?.topic.title ?? 'Forum Konusu')

  useEffect(() => {
    if (!topicId) return
    return subscribeForumReplies(topicId, {
      onInsert: (incoming) => {
        setData((prev) => {
          if (!prev || prev.topic.id !== topicId) return prev
          if (prev.replies.some((r) => r.id === incoming.id)) return prev
          const nextReplies = [...prev.replies, incoming].sort((a, b) =>
            a.created_at.localeCompare(b.created_at),
          )
          return {
            topic: {
              ...prev.topic,
              reply_count: Math.max(prev.topic.reply_count + 1, nextReplies.length),
              last_activity_at:
                incoming.created_at > prev.topic.last_activity_at
                  ? incoming.created_at
                  : prev.topic.last_activity_at,
            },
            replies: nextReplies,
          }
        })
      },
      onDelete: (deletedId) => {
        setData((prev) => {
          if (!prev || prev.topic.id !== topicId) return prev
          if (!prev.replies.some((r) => r.id === deletedId)) return prev
          const nextReplies = prev.replies.filter((r) => r.id !== deletedId)
          return {
            topic: {
              ...prev.topic,
              reply_count: Math.max(0, prev.topic.reply_count - 1),
              is_solved: nextReplies.some((r) => r.is_accepted),
            },
            replies: nextReplies,
          }
        })
      },
    })
  }, [topicId, setData])

  useEffect(() => {
    let active = true
    if (!user || !data) {
      Promise.resolve().then(() => active && setFav(false))
      return () => {
        active = false
      }
    }
    isFavorite(user.id, 'forum_topic', data.topic.id)
      .then((res) => active && setFav(res))
      .catch(() => undefined)
    return () => {
      active = false
    }
  }, [user, data])

  const topicLikeState = data
    ? (likeOverrides[`topic:${data.topic.id}`] ?? {
        liked: isForumItemLiked(user?.id, 'topic', data.topic.id),
        count: data.topic.like_count ?? 0,
      })
    : { liked: false, count: 0 }

  const getReplyLikeState = (replyId: string, defaultCount: number) =>
    likeOverrides[`reply:${replyId}`] ?? {
      liked: isForumItemLiked(user?.id, 'reply', replyId),
      count: defaultCount,
    }

  const handleFavorite = async () => {
    if (!user) return openAuth('login')
    if (!data) return
    setFavBusy(true)
    try {
      setFav(await toggleFavorite(user.id, 'forum_topic', data.topic.id))
    } finally {
      setFavBusy(false)
    }
  }

  const handleTopicLike = async () => {
    if (!user) return openAuth('login')
    if (!data) return
    const baseWithoutUser = Math.max(0, topicLikeState.count - (topicLikeState.liked ? 1 : 0))
    const res = await toggleForumLike(user.id, 'topic', data.topic.id, baseWithoutUser)
    setLikeOverrides((prev) => ({ ...prev, [`topic:${data.topic.id}`]: res }))
  }

  const handleReplyLike = async (replyId: string, defaultCount: number) => {
    if (!user) return openAuth('login')
    const current = getReplyLikeState(replyId, defaultCount)
    const baseWithoutUser = Math.max(0, current.count - (current.liked ? 1 : 0))
    const res = await toggleForumLike(user.id, 'reply', replyId, baseWithoutUser)
    setLikeOverrides((prev) => ({ ...prev, [`reply:${replyId}`]: res }))
  }

  const handleReplySubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!user) return openAuth('login')
    if (!data) return
    setReplyError(null)
    if (replyBody.trim().length < 2) {
      setReplyError('Yorum en az 2 karakter olmalıdır.')
      return
    }
    setReplyBusy(true)
    try {
      const created = await createForumReply(data.topic.id, replyBody, {
        id: user.id,
        full_name: profile?.full_name ?? user.email?.split('@')[0] ?? 'Üye',
        avatar_url: profile?.avatar_url ?? null,
        role: profile?.role ?? 'student',
      })
      setReplyBody('')
      setData((prev) => {
        if (!prev) return prev
        if (prev.replies.some((r) => r.id === created.id)) return prev
        return {
          topic: {
            ...prev.topic,
            reply_count: prev.topic.reply_count + 1,
            last_activity_at: created.created_at,
          },
          replies: [...prev.replies, created],
        }
      })
    } catch (err) {
      setReplyError((err as Error).message)
    } finally {
      setReplyBusy(false)
    }
  }

  const handleModToggle = async (field: 'is_pinned' | 'is_locked' | 'is_solved') => {
    if (!data || !isStaff) return
    setModBusy(field)
    setModMessage(null)
    const nextVal = !data.topic[field]
    try {
      await updateForumTopic(data.topic.id, { [field]: nextVal })
      setData((prev) => (prev ? { ...prev, topic: { ...prev.topic, [field]: nextVal } } : prev))
      const labels = {
        is_pinned: nextVal ? 'Konu üste sabitlendi.' : 'Konu sabitlemesi kaldırıldı.',
        is_locked: nextVal ? 'Konu yeni yorumlara kilitlendi.' : 'Konu kilidi açıldı.',
        is_solved: nextVal ? 'Konu "Çözüldü" olarak işaretlendi.' : '"Çözüldü" işareti kaldırıldı.',
      }
      setModMessage(labels[field])
    } catch (err) {
      setModMessage((err as Error).message)
    } finally {
      setModBusy(null)
    }
  }

  const handleDeleteTopic = async () => {
    if (!data || !isStaff) return
    setModBusy('delete')
    try {
      await deleteForumTopic(data.topic.id)
      navigate('/forum', { replace: true })
    } catch (err) {
      setModMessage((err as Error).message)
      setModBusy(null)
    }
  }

  const handleAcceptReply = async (replyId: string, currentAccepted: boolean) => {
    if (!data || !user) return
    const canAccept = isStaff || data.topic.author_id === user.id
    if (!canAccept) return
    const nextVal = !currentAccepted
    await toggleReplyAccepted(data.topic.id, replyId, nextVal)
    setData((prev) => {
      if (!prev) return prev
      const nextReplies = prev.replies.map((r) => (r.id === replyId ? { ...r, is_accepted: nextVal } : r))
      const anyAccepted = nextReplies.some((r) => r.is_accepted)
      return {
        topic: { ...prev.topic, is_solved: anyAccepted },
        replies: nextReplies,
      }
    })
  }

  const handleDeleteReply = async (replyId: string) => {
    if (!data) return
    await deleteForumReply(replyId)
    setData((prev) => {
      if (!prev || !prev.replies.some((r) => r.id === replyId)) return prev
      const nextReplies = prev.replies.filter((r) => r.id !== replyId)
      return {
        topic: {
          ...prev.topic,
          reply_count: Math.max(0, prev.topic.reply_count - 1),
          is_solved: nextReplies.some((r) => r.is_accepted),
        },
        replies: nextReplies,
      }
    })
  }

  if (loading) {
    return (
      <div className="container-page max-w-3xl py-12">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="mt-5 h-9 w-10/12" />
        <Skeleton className="mt-6 h-40 w-full rounded-2xl" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container-page max-w-3xl py-14">
        <ErrorState message={error} onRetry={reload} />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="container-page py-16">
        <EmptyState
          icon={<MessageSquare className="size-6" />}
          title="Konu bulunamadı"
          description="Bu forum konusu silinmiş veya gizlenmiş olabilir."
          action={<ButtonLink to="/forum">Foruma dön</ButtonLink>}
        />
      </div>
    )
  }

  const { topic, replies } = data
  const canReply = !topic.is_locked || isStaff
  const canAcceptSolution = Boolean(user && (isStaff || topic.author_id === user.id))

  return (
    <div className="container-page max-w-3xl py-10 sm:py-14">
      <Link to="/forum" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> Foruma dön
      </Link>

      {/* Öğretmen / Yönetici Moderasyon Çubuğu */}
      {isStaff && (
        <div className="mt-5 rounded-2xl border border-ink/15 bg-paper-deep/80 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 text-xs font-extrabold tracking-wider text-ink uppercase">
              <Shield className="size-4 text-brand" aria-hidden /> Moderasyon Araçları
            </span>

            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={topic.is_pinned ? 'sun' : 'secondary'}
                loading={modBusy === 'is_pinned'}
                onClick={() => void handleModToggle('is_pinned')}
                icon={topic.is_pinned ? <PinOff className="size-3.5" /> : <Pin className="size-3.5" />}
              >
                {topic.is_pinned ? 'Sabitlemeyi Kaldır' : 'Sabitle'}
              </Button>

              <Button
                size="sm"
                variant={topic.is_locked ? 'primary' : 'secondary'}
                loading={modBusy === 'is_locked'}
                onClick={() => void handleModToggle('is_locked')}
                icon={topic.is_locked ? <Unlock className="size-3.5" /> : <Lock className="size-3.5" />}
              >
                {topic.is_locked ? 'Kilidi Aç' : 'Kilitle'}
              </Button>

              <Button
                size="sm"
                variant={topic.is_solved ? 'sun' : 'secondary'}
                loading={modBusy === 'is_solved'}
                onClick={() => void handleModToggle('is_solved')}
                icon={<CheckCircle2 className="size-3.5" />}
              >
                {topic.is_solved ? 'Çözüldü Kaldır' : 'Çözüldü İşaretle'}
              </Button>

              {!confirmDelete ? (
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => setConfirmDelete(true)}
                  icon={<Trash2 className="size-3.5" />}
                >
                  Sil
                </Button>
              ) : (
                <div className="inline-flex items-center gap-1.5 rounded-xl border border-danger/40 bg-danger-soft px-2.5 py-1">
                  <span className="text-xs font-bold text-danger">Emin misin?</span>
                  <Button
                    size="sm"
                    variant="danger"
                    loading={modBusy === 'delete'}
                    onClick={() => void handleDeleteTopic()}
                    className="h-7 px-2.5 text-xs"
                  >
                    Evet, Sil
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setConfirmDelete(false)}
                    className="h-7 px-2 text-xs"
                  >
                    Vazgeç
                  </Button>
                </div>
              )}
            </div>
          </div>

          {modMessage && <p className="mt-2.5 text-xs font-semibold text-brand-dark">{modMessage}</p>}
        </div>
      )}

      {/* Konu Gövdesi */}
      <article className="card mt-5 p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {topic.is_pinned && (
              <Badge tone="sun">
                <Pin className="size-3" aria-hidden /> Sabit
              </Badge>
            )}
            {topic.category && <CategoryTag name={topic.category.name} color={topic.category.color} />}
            {topic.is_solved && (
              <Badge tone="success">
                <CheckCircle2 className="size-3" aria-hidden /> Çözüldü
              </Badge>
            )}
            {topic.is_locked && (
              <Badge tone="neutral">
                <Lock className="size-3" aria-hidden /> Kilitli
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={topicLikeState.liked ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => void handleTopicLike()}
              aria-pressed={topicLikeState.liked}
              icon={<ThumbsUp className={cn('size-4', topicLikeState.liked && 'fill-current')} aria-hidden />}
            >
              <span>{topicLikeState.liked ? 'Beğendin' : 'Beğen'}</span>
              <span className="rounded-md bg-black/10 px-1.5 py-0.5 text-xs">{topicLikeState.count}</span>
            </Button>

            <Button
              variant={fav ? 'sun' : 'secondary'}
              size="sm"
              loading={favBusy}
              onClick={() => void handleFavorite()}
              icon={fav ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
            >
              {fav ? 'Kaydedildi' : 'Kaydet'}
            </Button>
          </div>
        </div>

        <h1 className="mt-4 text-2xl leading-snug font-extrabold sm:text-3xl">{topic.title}</h1>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted">
          <Avatar name={topic.author?.full_name} src={topic.author?.avatar_url} size="sm" />
          <span className="font-semibold text-ink">{topic.author?.full_name ?? 'Üye'}</span>
          {topic.author?.role && <RoleBadge role={topic.author.role} />}
          <span>· {formatDate(topic.created_at)}</span>
        </div>

        <p className="mt-6 whitespace-pre-line text-[16px] leading-relaxed text-ink-soft">{topic.body}</p>

        {topic.tags.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-1.5 border-t border-line pt-4">
            {topic.tags.map((tag) => (
              <Badge key={tag} tone="neutral">
                #{tag}
              </Badge>
            ))}
          </div>
        )}
      </article>

      {/* Cevaplar */}
      <section aria-labelledby="replies-heading" className="mt-8">
        <h2 id="replies-heading" className="text-xl font-bold">
          Cevaplar ({replies.length})
        </h2>

        {!replies.length ? (
          <EmptyState
            className="mt-4"
            icon={<MessageSquare className="size-6" />}
            title="Henüz cevap yazılmadı"
            description={topic.is_locked ? 'Bu konu yeni cevaplara kapalıdır.' : 'İlk cevabı sen yazarak yardımcı olabilirsin.'}
          />
        ) : (
          <div className="mt-4 space-y-4">
            {replies.map((r) => {
              const likeState = getReplyLikeState(r.id, r.like_count ?? 0)
              const canDeleteReply = Boolean(user && (isStaff || r.author_id === user.id))
              return (
                <div
                  key={r.id}
                  className={cn('card p-5', r.is_accepted && 'border-success bg-success-soft/30')}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <Avatar name={r.author?.full_name} src={r.author?.avatar_url} size="sm" />
                      <span className="text-sm font-bold text-ink">{r.author?.full_name ?? 'Üye'}</span>
                      {r.author?.role && <RoleBadge role={r.author.role} />}
                      <span className="text-xs text-muted">· {timeAgo(r.created_at)}</span>
                    </div>

                    {r.is_accepted && (
                      <Badge tone="success">
                        <CheckCircle2 className="size-3.5" aria-hidden /> Kabul Edilen Çözüm
                      </Badge>
                    )}
                  </div>

                  <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-ink-soft">{r.body}</p>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line/70 pt-3">
                    <button
                      type="button"
                      onClick={() => void handleReplyLike(r.id, r.like_count ?? 0)}
                      aria-pressed={likeState.liked}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition',
                        likeState.liked
                          ? 'border-brand bg-brand-soft text-brand-dark'
                          : 'border-line bg-card text-muted hover:border-ink hover:text-ink dark:hover:border-sun/60',
                      )}
                    >
                      <ThumbsUp className={cn('size-3.5', likeState.liked && 'fill-current')} aria-hidden />
                      <span>{likeState.liked ? 'Beğendin' : 'Beğen'}</span>
                      <span>({likeState.count})</span>
                    </button>

                    <div className="flex items-center gap-2">
                      {canAcceptSolution && (
                        <button
                          type="button"
                          onClick={() => void handleAcceptReply(r.id, r.is_accepted)}
                          className={cn(
                            'inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition',
                            r.is_accepted
                              ? 'bg-success-soft text-success hover:brightness-95'
                              : 'text-muted hover:bg-paper-deep hover:text-ink',
                          )}
                        >
                          <CheckCircle2 className="size-3.5" aria-hidden />
                          {r.is_accepted ? 'Çözüm İşaretini Kaldır' : 'Çözüm Olarak İşaretle'}
                        </button>
                      )}
                      {canDeleteReply && (
                        <button
                          type="button"
                          onClick={() => void handleDeleteReply(r.id)}
                          aria-label="Yorumu sil"
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-danger/80 hover:bg-danger-soft hover:text-danger"
                        >
                          <Trash2 className="size-3.5" aria-hidden /> Sil
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Yorum Yazma Formu */}
      <section aria-labelledby="reply-form-heading" className="mt-8">
        <h2 id="reply-form-heading" className="text-lg font-bold">
          Cevap Yaz
        </h2>

        {!canReply ? (
          <Alert tone="warning" className="mt-3 flex items-center gap-2">
            <Lock className="size-4 shrink-0" aria-hidden />
            <span>Bu konu kilitlendiği için yeni yorum eklenemez.</span>
          </Alert>
        ) : !user ? (
          <div className="card mt-3 flex flex-wrap items-center justify-between gap-4 p-5">
            <p className="text-sm text-muted">Bu konuya yorum yazmak ve beğeni göndermek için hesabına giriş yap.</p>
            <Button size="sm" onClick={() => openAuth('login')} icon={<LogIn className="size-4" aria-hidden />}>
              Giriş Yap
            </Button>
          </div>
        ) : (
          <form onSubmit={handleReplySubmit} className="card mt-3 space-y-4 p-5 sm:p-6">
            <div>
              <label htmlFor="reply-body" className="label">
                Çözümünü veya yorumunu paylaş
              </label>
              <textarea
                id="reply-body"
                rows={4}
                required
                minLength={2}
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                placeholder="Adım adım çözümünü veya açıklamanı buraya yaz…"
                className="input resize-y"
              />
            </div>

            {replyError && <Alert tone="error">{replyError}</Alert>}

            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-muted">
                {topic.is_locked && isStaff ? 'Konu kilitli (yetkili olarak yanıt yazabilirsin).' : 'Saygılı ve açıklayıcı bir dil kullanalım.'}
              </span>
              <Button type="submit" loading={replyBusy} icon={<Send className="size-4" aria-hidden />}>
                Yorumu Gönder
              </Button>
            </div>
          </form>
        )}
      </section>
    </div>
  )
}
