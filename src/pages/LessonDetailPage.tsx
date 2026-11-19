import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Bookmark, BookmarkCheck, BookOpen, Calendar, Eye } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useAsync, usePageMeta } from '../hooks'
import { getContentBySlug, isFavorite, toggleFavorite } from '../services/api'
import { contentTypeLabels, formatDate, formatNumber } from '../lib/utils'
import { Avatar, Badge, CategoryTag, RoleBadge } from '../components/ui/Display'
import { Button, ButtonLink } from '../components/ui/Button'
import { EmptyState, ErrorState, Skeleton } from '../components/ui/Feedback'

export function LessonDetailPage() {
  const { slug = '' } = useParams()
  const { user, openAuth } = useAuth()
  const { data: content, error, loading, reload } = useAsync(() => getContentBySlug(slug), [slug])
  const [fav, setFav] = useState(false)
  const [favBusy, setFavBusy] = useState(false)

  usePageMeta(content?.title ?? 'Ders', content?.summary ?? undefined)

  useEffect(() => {
    if (!user || !content) return setFav(false)
    isFavorite(user.id, 'content', content.id)
      .then(setFav)
      .catch(() => undefined)
  }, [user, content])

  const handleFavorite = async () => {
    if (!user) return openAuth('login')
    if (!content) return
    setFavBusy(true)
    try {
      setFav(await toggleFavorite(user.id, 'content', content.id))
    } finally {
      setFavBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="container-page max-w-3xl py-12">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="mt-6 h-10 w-11/12" />
        <Skeleton className="mt-3 h-5 w-2/3" />
        <Skeleton className="mt-8 h-64 w-full rounded-2xl" />
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

  if (!content) {
    return (
      <div className="container-page py-16">
        <EmptyState
          icon={<BookOpen className="size-6" />}
          title="İçerik bulunamadı"
          description="Bu ders notu kaldırılmış veya adresi değişmiş olabilir."
          action={<ButtonLink to="/dersler">Derslere dön</ButtonLink>}
        />
      </div>
    )
  }

  return (
    <article className="container-page max-w-3xl py-10 sm:py-14">
      <Link to="/dersler" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> Tüm dersler
      </Link>

      <header className="mt-6 border-b border-line pb-8">
        <div className="flex flex-wrap items-center gap-2.5">
          {content.category && <CategoryTag name={content.category.name} color={content.category.color} />}
          <Badge tone="neutral">{contentTypeLabels[content.type]}</Badge>
          {content.grade && <Badge tone="brand">{content.grade}</Badge>}
        </div>

        <h1 className="mt-4 text-3xl leading-tight font-extrabold sm:text-4xl">{content.title}</h1>
        {content.summary && <p className="mt-3 text-lg leading-relaxed text-muted">{content.summary}</p>}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Avatar name={content.author?.full_name} src={content.author?.avatar_url} size="md" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-ink">{content.author?.full_name ?? 'Bi Ders!'}</span>
                {content.author?.role && <RoleBadge role={content.author.role} />}
              </div>
              <p className="flex items-center gap-3 text-xs text-muted">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="size-3.5" aria-hidden /> {formatDate(content.published_at ?? content.created_at)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Eye className="size-3.5" aria-hidden /> {formatNumber(content.view_count)} görüntülenme
                </span>
              </p>
            </div>
          </div>

          <Button
            variant={fav ? 'sun' : 'secondary'}
            size="sm"
            loading={favBusy}
            onClick={handleFavorite}
            icon={fav ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
          >
            {fav ? 'Kaydedildi' : 'Favorilere Ekle'}
          </Button>
        </div>
      </header>

      <div className="prose-biders mt-8">
        <SimpleMarkdown text={content.body ?? ''} />
      </div>

      {content.tags.length > 0 && (
        <footer className="mt-10 flex flex-wrap items-center gap-2 border-t border-line pt-6">
          <span className="text-xs font-bold tracking-wider text-muted uppercase">Etiketler:</span>
          {content.tags.map((tag) => (
            <Link key={tag} to={`/ara?q=${encodeURIComponent(tag)}`} className="rounded-lg bg-paper-deep px-2.5 py-1 text-xs font-semibold text-ink-soft hover:bg-sun-soft hover:text-ink">
              #{tag}
            </Link>
          ))}
        </footer>
      )}
    </article>
  )
}

/** Güvenli basit markdown (## başlık, - liste, **kalın**) — tehlikeli HTML enjeksiyonu içermez */
function SimpleMarkdown({ text }: { text: string }) {
  const blocks = text.split(/\n\n+/).filter(Boolean)
  return (
    <>
      {blocks.map((block, i) => {
        if (block.startsWith('## ')) return <h2 key={i}>{block.slice(3)}</h2>
        if (block.startsWith('### ')) return <h3 key={i}>{block.slice(4)}</h3>
        const lines = block.split('\n')
        if (lines.every((l) => /^(-|\d+\.)\s/.test(l))) {
          return (
            <ul key={i}>
              {lines.map((l, j) => (
                <li key={j}>{renderInline(l.replace(/^(-|\d+\.)\s/, ''))}</li>
              ))}
            </ul>
          )
        }
        return <p key={i}>{renderInline(block)}</p>
      })}
    </>
  )
}

function renderInline(line: string) {
  return line.split(/(\*\*[^*]+\*\*)/g).map((part, idx) =>
    part.startsWith('**') && part.endsWith('**') ? <strong key={idx}>{part.slice(2, -2)}</strong> : part,
  )
}
