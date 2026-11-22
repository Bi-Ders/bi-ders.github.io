import { useState } from 'react'
import { assetUrl, cn } from '../../lib/utils'
import type { Book } from '../../types'

type BookCoverData = Pick<Book, 'title' | 'author' | 'grade' | 'cover_url' | 'category'>

type BookCoverProps = {
  book: BookCoverData
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const SIZE_CLASSES: Record<NonNullable<BookCoverProps['size']>, string> = {
  xs: 'w-12 aspect-[3/4] rounded-lg',
  sm: 'w-20 aspect-[3/4] rounded-xl',
  md: 'w-24 aspect-[3/4] rounded-xl',
  lg: 'w-32 aspect-[3/4] rounded-2xl',
  xl: 'w-full max-w-[300px] aspect-[3/4] rounded-2xl',
}

/**
 * Kitap kapağı bileşeni.
 * Görsel URL'si (veya yüklenen görsel) varsa gerçek kapağı kitap sırtı derinliğiyle gösterir;
 * boş bırakılmışsa veya yüklenemezse Bi Ders! krem-lacivert-sarı temalı otomatik kapak üretir.
 */
export function BookCover({ book, size = 'md', className }: BookCoverProps) {
  const src = assetUrl(book.cover_url)
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const showImage = Boolean(src && failedSrc !== src)
  const accent = book.category?.color ?? '#2F55D4'
  const compact = size === 'xs' || size === 'sm'

  return (
    <div
      className={cn(
        'relative shrink-0 overflow-hidden border border-ink/12 bg-paper shadow-[0_10px_24px_-14px_rgb(18_32_74/0.45)] select-none',
        SIZE_CLASSES[size],
        className,
      )}
    >
      {showImage && src ? (
        <>
          <img
            src={src}
            alt={book.title}
            loading="lazy"
            onError={() => setFailedSrc(src)}
            className="size-full object-cover"
          />
          {/* İnce kitap sırtı ve parlaklık efekti */}
          <div
            className="pointer-events-none absolute inset-y-0 left-0 w-2.5 bg-gradient-to-r from-ink/25 via-white/15 to-transparent"
            aria-hidden
          />
        </>
      ) : (
        <div
          className="relative flex size-full flex-col justify-between bg-[#faf7f0] p-3 text-[#12204a]"
          aria-hidden
        >
          {/* Sol lacivert + sarı kitap sırtı şeridi */}
          <div className="absolute inset-y-0 left-0 w-[11%] bg-[#12204a]" />
          <div className="absolute inset-y-0 left-[11%] w-[2.5%] bg-sun" />

          {/* Arka plan geometrik süsleme */}
          <svg
            viewBox="0 0 180 240"
            className="pointer-events-none absolute inset-0 size-full opacity-90"
            preserveAspectRatio="none"
          >
            <circle cx="146" cy="48" r="34" fill="#F5B82E" opacity="0.28" />
            <circle cx="152" cy="196" r="46" fill={accent} opacity="0.14" />
            <path d="M36 168 L160 168" stroke="#12204A" strokeWidth="1.2" strokeOpacity="0.15" />
            <rect x="36" y="176" width="38" height="4" rx="2" fill={accent} opacity="0.7" />
          </svg>

          <div className={cn('relative z-10 pl-[16%]', compact ? 'pt-0.5' : 'pt-2')}>
            <span
              className={cn(
                'inline-block truncate rounded font-bold tracking-wider uppercase',
                compact ? 'max-w-full text-[8px] text-[#2f55d4]' : 'bg-[#12204a] px-2 py-0.5 text-[10px] text-[#faf7f0]',
              )}
            >
              {book.category?.name ?? 'Bi Ders!'}
            </span>
            {!compact && book.grade && (
              <span className="mt-1.5 block text-[10px] font-extrabold tracking-wide text-muted uppercase">
                {book.grade}
              </span>
            )}
          </div>

          <div className={cn('relative z-10 pl-[16%]', compact ? 'my-auto' : 'my-auto py-2')}>
            <p
              className={cn(
                'font-display leading-tight font-extrabold text-ink',
                size === 'xs'
                  ? 'line-clamp-2 text-[8px]'
                  : size === 'sm'
                    ? 'line-clamp-3 text-[11px]'
                    : size === 'md'
                      ? 'line-clamp-3 text-xs'
                      : size === 'lg'
                        ? 'line-clamp-4 text-sm'
                        : 'line-clamp-4 text-2xl',
              )}
            >
              {book.title || 'Yeni Kitap'}
            </p>
          </div>

          <div className="relative z-10 border-t border-line pl-[16%] pt-1.5">
            <p
              className={cn(
                'truncate font-semibold text-muted',
                compact ? 'text-[8px]' : size === 'xl' ? 'text-xs' : 'text-[10px]',
              )}
            >
              {book.author || 'Bi Ders! Yayınları'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
