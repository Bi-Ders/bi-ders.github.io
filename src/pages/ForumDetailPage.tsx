import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Bookmark, BookmarkCheck, CheckCircle2, Lock, MessageSquare } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useAsync, usePageMeta } from '../hooks'
import { getForumTopic, isFavorite, toggleFavorite } from '../services/api'
import { formatDate, timeAgo } from '../lib/utils'
import { Avatar, Badge, CategoryTag, RoleBadge } from '../components/ui/Display'
import { Button, ButtonLink } from '../components/ui/Button'
import { EmptyState, ErrorState, Skeleton } from '../components/ui/Feedback'

export function ForumDetailPage() {
  const { id = '' } = useParams()
  const { user, openAuth } = useAuth()
  const { data, error, loading, reload } = useAsync(() => getForumTopic(id), [id])
  const [fav, setFav] = useState(false)
  const [favBusy, setFavBusy] = useState(false)

  usePageMeta(data?.topic.title ?? 'Forum Konusu')

  useEffect(() => {
    if (!user || !data) return setFav(false)
    isFavorite(user.id, 'forum_topic', data.topic.id)
      .then(setFav)
      .catch(() => undefined)
  }, [user, data])

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

  return (
    <div className="container-page max-w-3xl py-10 sm:py-14">
      <Link to="/forum" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> Foruma dön
      </Link>

      <article className="card mt-6 p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
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
          <Button
            variant={fav ? 'sun' : 'secondary'}
            size="sm"
            loading={favBusy}
            onClick={handleFavorite}
            icon={fav ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
          >
            {fav ? 'Kaydedildi' : 'Kaydet'}
          </Button>
        </div>

        <h1 className="mt-4 text-2xl leading-snug font-extrabold sm:text-3xl">{topic.title}</h1>

        <div className="mt-4 flex items-center gap-3 text-sm text-muted">
          <Avatar name={topic.author?.full_name} src={topic.author?.avatar_url} size="sm" />
          <span className="font-semibold text-ink">{topic.author?.full_name ?? 'Üye'}</span>
          {topic.author?.role && <RoleBadge role={topic.author.role} />}
          <span>· {formatDate(topic.created_at)}</span>
        </div>

        <p className="mt-6 whitespace-pre-line text-[16px] leading-relaxed text-ink-soft">{topic.body}</p>
      </article>

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
            {replies.map((r) => (
              <div
                key={r.id}
                className={`card p-5 ${r.is_accepted ? 'border-success bg-success-soft/30' : ''}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
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
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
