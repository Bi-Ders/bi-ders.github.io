/**
 * Bi Ders! — Demo Modu verileri (Ortaokul Müfredatı)
 * ------------------------------------------------------------
 * Supabase yapılandırılmadığında (VITE_SUPABASE_URL / ANON_KEY boş)
 * uygulamanın tüm verileri bu dosyadan okunur. Yapı, supabase/schema.sql
 * içindeki tablolarla birebir uyumludur.
 */
import type {
  AuthorSummary,
  Book,
  Category,
  ContactMessage,
  Content,
  Favorite,
  ForumReply,
  ForumTopic,
  Profile,
  Quiz,
  QuizResult,
  Role,
} from '../types'

const DAY = 86_400_000
const ago = (days: number, hours = 0) => new Date(Date.now() - days * DAY - hours * 3_600_000).toISOString()

// ---------------------------------------------------------------
// Profiller
// ---------------------------------------------------------------
export const demoProfiles: Record<'student' | 'admin', Profile> = {
  student: {
    id: '00000000-0000-4000-8000-000000000001',
    full_name: 'Elif Yılmaz',
    username: 'elif.yilmaz',
    avatar_url: null,
    bio: 'LGS hazırlanıyorum. En sevdiğim ders matematik, en çok çalıştığım fen bilimleri.',
    school: 'Bolu Atatürk Ortaokulu',
    grade: '8. Sınıf / LGS',
    role: 'student',
    created_at: ago(120),
    email: 'demo.ogrenci@biders.org',
  },
  admin: {
    id: '00000000-0000-4000-8000-000000000002',
    full_name: 'Murat Demir',
    username: 'murat.hoca',
    avatar_url: null,
    bio: 'Matematik öğretmeni. 15 yıldır ortaokul ve LGS öğrencileriyle çalışıyorum.',
    school: 'Bi Ders! Eğitim Ekibi',
    grade: null,
    role: 'admin',
    created_at: ago(400),
    email: 'demo.ogretmen@biders.org',
  },
}

export const mockProfiles: Profile[] = [
  demoProfiles.student,
  demoProfiles.admin,
  {
    id: '00000000-0000-4000-8000-000000000003',
    full_name: 'Ayşe Kaya',
    username: 'ayse.kaya',
    avatar_url: null,
    bio: 'Fen Bilimleri öğretmeni.',
    school: 'Ankara Cumhuriyet Ortaokulu',
    grade: null,
    role: 'teacher',
    created_at: ago(300),
  },
  {
    id: '00000000-0000-4000-8000-000000000004',
    full_name: 'Can Öztürk',
    username: 'can.ozturk',
    avatar_url: null,
    bio: null,
    school: 'İzmir Karşıyaka Ortaokulu',
    grade: '7. Sınıf',
    role: 'student',
    created_at: ago(45),
  },
  {
    id: '00000000-0000-4000-8000-000000000005',
    full_name: 'Zeynep Arslan',
    username: 'zeynep.a',
    avatar_url: null,
    bio: 'Kitap okumayı ve Türkçe dersini çok seviyorum.',
    school: 'Bursa Nilüfer Ortaokulu',
    grade: '6. Sınıf',
    role: 'student',
    created_at: ago(20),
  },
  {
    id: '00000000-0000-4000-8000-000000000006',
    full_name: 'Emre Şahin',
    username: 'emre.sahin',
    avatar_url: null,
    bio: 'Sosyal Bilgiler ve Din Kültürü içerik editörü.',
    school: 'Bi Ders! Eğitim Ekibi',
    grade: null,
    role: 'teacher',
    created_at: ago(250),
  },
]

const author = (i: number): AuthorSummary => {
  const p = mockProfiles[i]!
  return { id: p.id, full_name: p.full_name, avatar_url: p.avatar_url, role: p.role }
}

// ---------------------------------------------------------------
// Kategoriler (Ortaokul Müfredatı — 6 Temel Ders)
// ---------------------------------------------------------------
export const mockCategories: Category[] = [
  {
    id: 'c-tr',
    slug: 'turkce',
    name: 'Türkçe',
    description: 'Okuma anlama, dil bilgisi, paragraf ve yazma becerileri',
    icon: 'languages',
    color: '#9A3B8C',
    sort_order: 1,
  },
  {
    id: 'c-mat',
    slug: 'matematik',
    name: 'Matematik',
    description: 'Sayılar, işlemler, cebir, geometri ve veri analizi',
    icon: 'sigma',
    color: '#2F55D4',
    sort_order: 2,
  },
  {
    id: 'c-fen',
    slug: 'fen-bilimleri',
    name: 'Fen Bilimleri',
    description: 'Canlılar, madde, kuvvet, enerji ve Dünya ile evren',
    icon: 'flask-conical',
    color: '#0E7C66',
    sort_order: 3,
  },
  {
    id: 'c-sos',
    slug: 'sosyal-bilgiler',
    name: 'Sosyal Bilgiler',
    description: 'Tarih, coğrafya, kültür, vatandaşlık ve inkılap tarihi',
    icon: 'globe',
    color: '#B4441C',
    sort_order: 4,
  },
  {
    id: 'c-ing',
    slug: 'ingilizce',
    name: 'İngilizce',
    description: 'Kelime bilgisi, dil bilgisi, diyalog ve okuma becerileri',
    icon: 'book-a',
    color: '#1F6E8C',
    sort_order: 5,
  },
  {
    id: 'c-din',
    slug: 'din-kulturu',
    name: 'Din Kültürü',
    description: 'İnanç, ibadet, ahlak ve değerler eğitimi',
    icon: 'moon-star',
    color: '#7A4E12',
    sort_order: 6,
  },
]

const cat = (slug: string) => mockCategories.find((c) => c.slug === slug)!

// ---------------------------------------------------------------
// İçerikler (ders notları / konu anlatımları)
// ---------------------------------------------------------------
type ContentSeed = Omit<Content, 'author' | 'category' | 'category_id' | 'author_id' | 'file_url' | 'video_url' | 'cover_url' | 'status' | 'created_at'> & {
  cat: string
  a: number
}

const contentSeeds: ContentSeed[] = [
  {
    id: 'ct-1',
    cat: 'matematik',
    a: 1,
    title: 'Çarpanlar, Katlar ve EBOB–EKOK: Adım Adım Problem Çözümü',
    slug: 'carpanlar-katlar-ve-ebob-ekok',
    summary: 'Asal çarpanlara ayırma, aralarında asal sayılar ve LGS tarzı EBOB–EKOK problemlerini çözme stratejileri.',
    body: `## Asal çarpanlara ayırma\nBir doğal sayıyı asal çarpanlarının çarpımı şeklinde yazmak, o sayının tüm pozitif bölenlerini ve ortak katlarını görmeyi kolaylaştırır.\n\n## EBOB ve EKOK ne zaman kullanılır?\n- Bütünden parçaya gidiliyorsa (eşit uzunlukta kesme, eşit hacimli şişelere bölme) **EBOB** kullanılır.\n- Parçadan bütüne gidiliyorsa (nöbet günleri, aynı anda çalan ziller, karolarla kare oluşturma) **EKOK** kullanılır.\n\n## Temel özellikler\n- İki sayının çarpımı, EBOB ve EKOK değerlerinin çarpımına eşittir.\n- Aralarında asal iki sayının EBOB'u 1, EKOK'u ise sayıların çarpımıdır.\n\n## LGS ipucu\nSoru kökünde "en az kaç parça" veya "en büyük aralık" ifadelerini gördüğünüzde önce hangi büyüklüğün sabit tutulduğunu belirleyin.`,
    type: 'lesson',
    grade: '8. Sınıf / LGS',
    tags: ['ebob', 'ekok', 'lgs', 'matematik'],
    view_count: 4821,
    published_at: ago(2),
  },
  {
    id: 'ct-2',
    cat: 'fen-bilimleri',
    a: 2,
    title: 'Mevsimlerin Oluşumu ve İklim–Hava Olayları Farkı',
    slug: 'mevsimlerin-olusumu-ve-iklim-hava-olaylari',
    summary: 'Dünya\'nın eksen eğikliği, 21 Haziran–21 Aralık dönenceleri ve rüzgâr oluşumunu günlük örneklerle kavrayın.',
    body: `## Mevsimler neden oluşur?\nMevsimlerin oluşmasının iki temel sebebi vardır: **Dünya'nın dönme ekseninin 23° 27' eğik olması** ve **Güneş etrafındaki dolanma hareketi**.\n\n## Önemli tarihler\n- **21 Haziran:** Kuzey Yarım Küre'de yaz başlangıcı, en uzun gündüz.\n- **21 Aralık:** Kuzey Yarım Küre'de kış başlangıcı, en uzun gece.\n- **21 Mart ve 23 Eylül:** Ekinoks tarihleri; gece ve gündüz süreleri eşittir.\n\n## İklim ve hava olayları\nİklim geniş bölgelerde uzun yıllar (en az 30–35 yıl) gözlemlenen ortalama durumdur; hava olayları ise dar alanlarda kısa sürede değişen atmosfer olaylarıdır.`,
    type: 'lesson',
    grade: '8. Sınıf / LGS',
    tags: ['mevsimler', 'iklim', 'fen bilimleri', 'lgs'],
    view_count: 3190,
    published_at: ago(4),
  },
  {
    id: 'ct-3',
    cat: 'turkce',
    a: 1,
    title: 'Paragrafta Ana Düşünce ve Fiilimsiler Nasıl Ayırt Edilir?',
    slug: 'paragrafta-ana-dusunce-ve-fiilimsiler',
    summary: 'Ortaokul Türkçe ve LGS paragraf sorularında ana düşünce bulma adımları ile fiilimsilerin pratik özeti.',
    body: `## Adım adım paragraf yöntemi\n1. Önce soru kökünü okuyun.\n2. Paragrafın ilk ve son cümlesine odaklanın.\n3. Yazarın tekrar ettiği kavramı bulun.\n4. Seçeneklerde paragrafı **bütünüyle** kapsayan yargıyı seçin.\n\n## Fiilimsiler (Eylemsiler)\n- **İsim-fiil:** -ma, -ış, -mak ekleriyle oluşur.\n- **Sıfat-fiil:** -an, -ası, -mez, -ar, -dik, -ecek, -miş ekleriyle oluşur.\n- **Zarf-fiil:** -ken, -alı, -madıkça, -ıp, -arak gibi eklerle cümleye zaman veya durum anlamı katar.`,
    type: 'lesson',
    grade: '8. Sınıf / LGS',
    tags: ['paragraf', 'fiilimsiler', 'lgs', 'türkçe'],
    view_count: 5630,
    published_at: ago(6),
  },
  {
    id: 'ct-4',
    cat: 'sosyal-bilgiler',
    a: 5,
    title: 'Millî Mücadele Kronolojisi (1919–1923)',
    slug: 'milli-mucadele-kronolojisi',
    summary: 'Samsun\'dan Lozan\'a kadar tüm önemli genelge, kongre, cephe ve antlaşmalar tek bir zaman çizelgesinde.',
    body: `## Hazırlık dönemi\n19 Mayıs 1919'da Samsun'a çıkışla başlayan süreçte Amasya Genelgesi, Erzurum ve Sivas kongreleri millî iradenin örgütlendiği temel aşamalardır.\n\n## Cepheler ve zafer\nDoğu, Güney ve Batı cephelerinde kazanılan başarılar; Sakarya Meydan Muharebesi, Büyük Taarruz ve Lozan Barış Antlaşması ile taçlanmıştır.`,
    type: 'document',
    grade: '8. Sınıf / LGS',
    tags: ['sosyal bilgiler', 'inkılap tarihi', 'kronoloji'],
    view_count: 2944,
    published_at: ago(9),
  },
  {
    id: 'ct-5',
    cat: 'ingilizce',
    a: 2,
    title: 'Friendship & Teen Life: Davet Kabul ve Reddetme Kalıpları',
    slug: 'friendship-ve-teen-life-kaliplari',
    summary: 'Ortaokul İngilizce derslerinde ve LGS diyalog sorularında en sık çıkan teklif, kabul ve mazeret ifadeleri.',
    body: `## Teklif ve davet ifadeleri\n- Would you like to join us?\n- Shall we go to the cinema?\n- How about having a picnic?\n\n## Kabul ve reddetme\n- **Accepting:** Sure, that sounds awesome! / I'd love to.\n- **Refusing:** I'm sorry, I can't. / Thanks for inviting me, but I have another plan.`,
    type: 'article',
    grade: '8. Sınıf / LGS',
    tags: ['friendship', 'ingilizce', 'lgs'],
    view_count: 1870,
    published_at: ago(12),
  },
  {
    id: 'ct-6',
    cat: 'din-kulturu',
    a: 5,
    title: 'Kader, Kaza, İrade ve Tevekkül Kavramları',
    slug: 'kader-kaza-irade-ve-tevekkul',
    summary: 'Evrendeki fiziksel, biyolojik ve toplumsal yasalar ile insan iradesi ve sorumluluk ilişkisi.',
    body: `## Kader ve kaza\n**Kader**, Allah'ın evrendeki her şeyi belli bir ölçü ve düzen içinde planlamasıdır. **Kaza** ise bu planın zamanı geldiğinde gerçekleşmesidir.\n\n## Evrensel yasalar\n- **Fiziksel yasalar:** Madde, enerji ve hareketle ilgilidir (suyun kaldırma kuvveti, yer çekimi).\n- **Biyolojik yasalar:** Canlıların doğması, büyümesi ve üremesiyle ilgilidir.\n- **Toplumsal yasalar:** Toplumun huzuru, adalet ve yardımlaşma ilkeleriyle ilgilidir.\n\n## Tevekkül\nÖnce gerekli tüm çalışmayı ve tedbiri yerine getirmek, ardından sonucu Allah'a bırakmaktır.`,
    type: 'lesson',
    grade: '8. Sınıf / LGS',
    tags: ['kader', 'tevekkül', 'din kültürü', 'lgs'],
    view_count: 2210,
    published_at: ago(15),
  },
]

export const mockContents: Content[] = contentSeeds.map(({ cat: c, a, ...rest }) => ({
  ...rest,
  author_id: mockProfiles[a]!.id,
  category_id: cat(c).id,
  status: 'published',
  cover_url: null,
  file_url: null,
  video_url: null,
  created_at: rest.published_at!,
  author: author(a),
  category: cat(c),
}))

// ---------------------------------------------------------------
// Forum
// ---------------------------------------------------------------
export const mockForumTopics: ForumTopic[] = [
  {
    id: 'ft-1',
    author_id: mockProfiles[3]!.id,
    category_id: cat('matematik').id,
    title: 'Üslü ifadelerde tabanlar farklıyken çarpma ve bölme nasıl yapılır?',
    body: 'Deneme sınavlarında üslü ifadeler sorularında takılıyorum. Özellikle 8⁴ · 16³ gibi tabanları farklı sayılar çıkınca nereden başlayacağımı bilemiyorum. Pratik bir yöntem önerebilir misiniz?',
    tags: ['üslü ifadeler', 'lgs'],
    is_pinned: false,
    is_locked: false,
    is_solved: true,
    reply_count: 3,
    view_count: 312,
    like_count: 14,
    last_activity_at: ago(0, 3),
    created_at: ago(1),
    author: author(3),
    category: cat('matematik'),
  },
  {
    id: 'ft-0',
    author_id: mockProfiles[1]!.id,
    category_id: null,
    title: 'Forum kuralları ve soru sorma rehberi — lütfen okuyun',
    body: 'Soru sorarken konu başlığına dersi ve konuyu yazın, çözüm denemenizi paylaşın. Saygılı bir dil kullanın; kişisel bilgilerinizi paylaşmayın.',
    tags: ['duyuru'],
    is_pinned: true,
    is_locked: true,
    is_solved: false,
    reply_count: 0,
    view_count: 1504,
    like_count: 42,
    last_activity_at: ago(30),
    created_at: ago(30),
    author: author(1),
    category: null,
  },
  {
    id: 'ft-2',
    author_id: mockProfiles[4]!.id,
    category_id: cat('turkce').id,
    title: 'Sıfat-fiil ile çekimli fiil arasındaki farkı nasıl kolayca anlarım?',
    body: 'Özellikle "-acak, -mez, -miş" ekleri cümle içinde bazen sıfat-fiil bazen zaman eki oluyor. Ayırt etmek için kısa bir ipucu paylaşabilir misiniz?',
    tags: ['fiilimsiler', 'türkçe'],
    is_pinned: false,
    is_locked: false,
    is_solved: false,
    reply_count: 1,
    view_count: 128,
    like_count: 7,
    last_activity_at: ago(0, 8),
    created_at: ago(2),
    author: author(4),
    category: cat('turkce'),
  },
  {
    id: 'ft-3',
    author_id: mockProfiles[0]!.id,
    category_id: cat('fen-bilimleri').id,
    title: 'Katı ve sıvı basıncı soruları için hangi ders notunu önerirsiniz?',
    body: 'Basınç konusunu temelden tekrar etmek istiyorum. Günlük hayat örnekleri içeren sade bir not veya etkinlik önerisi olan var mı?',
    tags: ['basınç', 'fen bilimleri'],
    is_pinned: false,
    is_locked: false,
    is_solved: false,
    reply_count: 0,
    view_count: 64,
    like_count: 4,
    last_activity_at: ago(3),
    created_at: ago(3),
    author: author(0),
    category: cat('fen-bilimleri'),
  },
  {
    id: 'ft-4',
    author_id: mockProfiles[3]!.id,
    category_id: cat('din-kulturu').id,
    title: 'Fiziksel, biyolojik ve toplumsal yasalar arasındaki farklar nelerdir?',
    body: 'Testlerde verilen örnek cümlenin hangi evrensel yasaya ait olduğunu bazen karıştırıyorum. Örneklerle kısaca özetleyebilir misiniz?',
    tags: ['evrensel yasalar', 'din kültürü'],
    is_pinned: false,
    is_locked: false,
    is_solved: true,
    reply_count: 2,
    view_count: 201,
    like_count: 11,
    last_activity_at: ago(4),
    created_at: ago(5),
    author: author(3),
    category: cat('din-kulturu'),
  },
]

export const mockForumReplies: ForumReply[] = [
  {
    id: 'fr-1',
    topic_id: 'ft-1',
    author_id: mockProfiles[1]!.id,
    body: 'Önce tüm sayıları en küçük ortak asal tabana çevirin. Örneğin 8⁴ = (2³)⁴ = 2¹² ve 16³ = (2⁴)³ = 2¹² olur. Tabanlar eşitlenince çarpmada üsleri toplayıp 2²⁴ sonucuna ulaşırsınız.',
    is_accepted: true,
    like_count: 18,
    created_at: ago(0, 20),
    author: author(1),
  },
  {
    id: 'fr-2',
    topic_id: 'ft-1',
    author_id: mockProfiles[0]!.id,
    body: 'Ben de aynı yerde zorlanıyordum, ortak tabana çevirme yöntemiyle 10 soruluk testte 9 doğru yaptım. Teşekkürler!',
    is_accepted: false,
    like_count: 5,
    created_at: ago(0, 10),
    author: author(0),
  },
  {
    id: 'fr-3',
    topic_id: 'ft-1',
    author_id: mockProfiles[3]!.id,
    body: 'Çok teşekkür ederim, şimdi çok daha net oldu.',
    is_accepted: false,
    like_count: 2,
    created_at: ago(0, 3),
    author: author(3),
  },
  {
    id: 'fr-4',
    topic_id: 'ft-2',
    author_id: mockProfiles[2]!.id,
    body: 'Sözcük cümlede bir ismi niteliyorsa ("koşacak çocuk", "okunmuş kitap") sıfat-fiildir; cümleyi yargıya bağlayan yüklem görevindeyse ("Çocuk birazdan koşacak.") çekimli fiildir.',
    is_accepted: false,
    like_count: 9,
    created_at: ago(0, 8),
    author: author(2),
  },
  {
    id: 'fr-5',
    topic_id: 'ft-4',
    author_id: mockProfiles[5]!.id,
    body: 'Cansız madde ve doğa olayları (yer çekimi, suyun kaynaması) fiziksel; canlıların yaşamı (fotosentez, solunum) biyolojik; insan ilişkileri ve adalet-yardımlaşma ilkeleri toplumsal yasalardır.',
    is_accepted: true,
    like_count: 12,
    created_at: ago(4, 6),
    author: author(5),
  },
  {
    id: 'fr-6',
    topic_id: 'ft-4',
    author_id: mockProfiles[3]!.id,
    body: 'Harika, bu üçlü ayrım çok akılda kalıcı oldu.',
    is_accepted: false,
    like_count: 3,
    created_at: ago(4),
    author: author(3),
  },
]

// ---------------------------------------------------------------
// Testler (6 Ortaokul Dersine Göre)
// ---------------------------------------------------------------
export const mockQuizzes: Quiz[] = [
  {
    id: 'qz-1',
    author_id: mockProfiles[1]!.id,
    category_id: cat('matematik').id,
    title: 'Çarpanlar, Katlar ve Üslü İfadeler — Konu Tarama',
    slug: 'carpanlar-katlar-uslu-ifadeler',
    description: 'EBOB–EKOK, aralarında asal sayılar ve üslü ifadelerde işlemler üzerine 6 seçkin LGS sorusu.',
    grade: '8. Sınıf / LGS',
    difficulty: 'medium',
    time_limit_minutes: 12,
    is_published: true,
    created_at: ago(3),
    question_count: 6,
    author: author(1),
    category: cat('matematik'),
  },
  {
    id: 'qz-2',
    author_id: mockProfiles[2]!.id,
    category_id: cat('fen-bilimleri').id,
    title: 'Mevsimler, İklim ve Basınç — Başlangıç',
    slug: 'mevsimler-iklim-ve-basinc',
    description: 'Eksen eğikliği, katı-sıvı basıncı ve DNA–genetik kod kavramlarını ölçen 6 soruluk test.',
    grade: '8. Sınıf / LGS',
    difficulty: 'easy',
    time_limit_minutes: 10,
    is_published: true,
    created_at: ago(6),
    question_count: 6,
    author: author(2),
    category: cat('fen-bilimleri'),
  },
  {
    id: 'qz-3',
    author_id: mockProfiles[1]!.id,
    category_id: cat('turkce').id,
    title: 'Paragraf ve Anlam Bilgisi Deneme #4',
    slug: 'paragraf-deneme-seti-4',
    description: 'LGS formatında ana düşünce, anlatım biçimleri ve düşünceyi geliştirme yolları üzerine 6 soru.',
    grade: '8. Sınıf / LGS',
    difficulty: 'hard',
    time_limit_minutes: 15,
    is_published: true,
    created_at: ago(10),
    question_count: 6,
    author: author(1),
    category: cat('turkce'),
  },
  {
    id: 'qz-4',
    author_id: mockProfiles[5]!.id,
    category_id: cat('sosyal-bilgiler').id,
    title: 'Millî Mücadele: Hazırlık Dönemi ve Cepheler',
    slug: 'milli-mucadele-hazirlik-ve-cepheler',
    description: 'Genelgeler, kongreler, TBMM’nin açılışı ve Kurtuluş Savaşı cepheleri üzerine 5 soru.',
    grade: '8. Sınıf / LGS',
    difficulty: 'medium',
    time_limit_minutes: 10,
    is_published: true,
    created_at: ago(14),
    question_count: 5,
    author: author(5),
    category: cat('sosyal-bilgiler'),
  },
  {
    id: 'qz-5',
    author_id: mockProfiles[2]!.id,
    category_id: cat('ingilizce').id,
    title: 'Friendship & Teen Life — Diyalog ve Kelime Testi',
    slug: 'friendship-teen-life-testi',
    description: 'Ortaokul İngilizce 1. ve 2. ünite davet, kabul, mazeret ve günlük rutin soruları.',
    grade: '8. Sınıf / LGS',
    difficulty: 'easy',
    time_limit_minutes: 10,
    is_published: true,
    created_at: ago(7),
    question_count: 5,
    author: author(2),
    category: cat('ingilizce'),
  },
  {
    id: 'qz-6',
    author_id: mockProfiles[5]!.id,
    category_id: cat('din-kulturu').id,
    title: 'Kader İnancı, Evrensel Yasalar ve Zekât',
    slug: 'kader-inanci-evrensel-yasalar-ve-zekat',
    description: 'Kader-kaza, tevekkül, emek-rızık ve paylaşma ibadetleri üzerine 5 soru.',
    grade: '8. Sınıf / LGS',
    difficulty: 'medium',
    time_limit_minutes: 10,
    is_published: true,
    created_at: ago(4),
    question_count: 5,
    author: author(5),
    category: cat('din-kulturu'),
  },
]

export const mockQuizResults: QuizResult[] = [
  { id: 'qr-1', quiz_id: 'qz-1', user_id: demoProfiles.student.id, score: 5, total: 6, duration_seconds: 412, created_at: ago(1), quiz: { id: 'qz-1', title: 'Çarpanlar, Katlar ve Üslü İfadeler — Konu Tarama', slug: 'carpanlar-katlar-uslu-ifadeler' } },
  { id: 'qr-2', quiz_id: 'qz-3', user_id: demoProfiles.student.id, score: 4, total: 6, duration_seconds: 590, created_at: ago(5), quiz: { id: 'qz-3', title: 'Paragraf ve Anlam Bilgisi Deneme #4', slug: 'paragraf-deneme-seti-4' } },
  { id: 'qr-3', quiz_id: 'qz-2', user_id: demoProfiles.student.id, score: 6, total: 6, duration_seconds: 310, created_at: ago(9), quiz: { id: 'qz-2', title: 'Mevsimler, İklim ve Basınç — Başlangıç', slug: 'mevsimler-iklim-ve-basinc' } },
]

// ---------------------------------------------------------------
// Kitaplar (Mağaza & Açık Kütüphane)
// ---------------------------------------------------------------
export const mockBooks: Book[] = [
  {
    id: 'bk-1',
    slug: 'temel-matematik-konu-anlatimi',
    added_by: demoProfiles.admin.id,
    category_id: cat('matematik').id,
    title: 'Ortaokul Temel Matematik Konu Anlatımı',
    author: 'Murat Demir & Bi Ders! Matematik Ekibi',
    author_title: 'Matematik Öğretmeni · 15 Yıl Deneyim',
    author_bio:
      'Ortaokul ve LGS öğrencileri için sade, sezgisel anlatımlar hazırlayan Bi Ders! matematik kurucu editörü.',
    publisher: 'Bi Ders! Yayınları',
    isbn: '978-605-9124-01-4',
    description:
      '5, 6, 7 ve 8. sınıf matematik konularını temelden LGS seviyesine taşıyan görsel ve çözümlü konu anlatım kitabı. Her bölümde günlük hayattan somut örnekler, öğretmen ipuçları ve kademeli pekiştirme testleri bulunur.',
    grade: '5–8. Sınıf / LGS',
    price: 249,
    cover_url: '/books/temel-matematik.webp',
    file_url: '/books/samples/temel-matematik-ornek.pdf',
    external_url: 'https://www.shopier.com/ShowProductNew/products.php?id=biders-temel-matematik',
    payment_provider: 'shopier',
    page_count: 312,
    published_year: 2026,
    highlights: [
      'Güncel MEB ortaokul kazanımlarıyla %100 uyumlu 14 temel ünite',
      '420 adım adım çözümlü örnek ve beceri temelli yeni nesil sorular',
      'Her ünite sonunda kendini dene alıştırmaları ve QR kodlu ek testler',
      'Basılı kitap + yüksek kaliteli dijital özet föy desteği',
    ],
    sample_pages: [
      {
        pageNumber: 12,
        heading: 'Bölüm 1: Çarpanlar, Katlar ve Asal Sayılar',
        content:
          'Ortaokul matematiğinin temel taşlarından biri doğal sayıların çarpan yapısını doğru analiz edebilmektir.',
        highlights: [
          'Asal sayılar: 1 ve kendisinden başka pozitif böleni olmayan 1’den büyük doğal sayılardır (2, 3, 5, 7, 11...).',
          'En küçük ve tek çift asal sayı 2’dir.',
          'İki sayının ortak bölenlerinin en büyüğüne EBOB, ortak katlarının en küçüğüne EKOK denir.',
        ],
        tip: 'Bütünü eşit parçalara bölme sorularında EBOB, küçük parçaları birleştirme sorularında EKOK kullanın.',
      },
      {
        pageNumber: 48,
        heading: 'Çözümlü Örnek: Üslü İfadelerle İşlemler',
        content:
          'Örnek 14: 2⁸ · 4³ / 8² işleminin sonucunu 2 tabanında üslü ifade olarak bulunuz.',
        highlights: [
          'Tüm ifadeleri 2 tabanına çevirelim: 4³ = (2²)³ = 2⁶ ve 8² = (2³)² = 2⁶.',
          'Pay: 2⁸ · 2⁶ = 2¹⁴; Bölme: 2¹⁴ / 2⁶ = 2⁸ bulunur.',
        ],
      },
      {
        pageNumber: 104,
        heading: 'Ünite Sonu Kendini Dene (Mini Alıştırma)',
        content: 'Her ünitenin sonunda konuyu pekiştiren kademeli alıştırmalar ve çözüm anahtarları yer alır.',
        highlights: [
          'EBOB(24, 36) + EKOK(12, 18) toplamı kaçtır? (Cevap: 48)',
          '√72 sayısının a√b biçimindeki en sade hali nedir? (Cevap: 6√2)',
        ],
      },
    ],
    is_published: true,
    created_at: ago(20),
    category: cat('matematik'),
  },
  {
    id: 'bk-2',
    slug: 'calikusu-aciklamali-ogrenci-baskisi',
    added_by: demoProfiles.admin.id,
    category_id: cat('turkce').id,
    title: 'Çalıkuşu (Açıklamalı Öğrenci Baskısı)',
    author: 'Reşat Nuri Güntekin',
    author_title: 'Türk Edebiyatı Klasik Yazarı · Öğrenci Baskısı',
    author_bio:
      'Cumhuriyet dönemi Türk edebiyatının öncü romancısı. Bu özel öğrenci baskısı Bi Ders! Türkçe öğretmenleri tarafından sözlük ve okuma-anlama notlarıyla zenginleştirilmiştir.',
    publisher: 'Bi Ders! Klasikler',
    isbn: '978-605-9124-02-1',
    description:
      'Feride’nin İstanbul’dan Anadolu’nun köylerine uzanan öğretmenlik serüveni. Ortaokul okuma listeleri ve Türkçe dersi okuma-anlama çalışmaları için sayfa altı kelime açıklamalarıyla hazırlanmış özel baskı.',
    grade: '7–8. Sınıf / Genel',
    price: 129,
    cover_url: '/books/calikusu.webp',
    file_url: '/books/samples/calikusu-ornek.pdf',
    external_url: 'https://iyzi.link/biders-calikusu-ogrenci-baskisi',
    payment_provider: 'iyzico',
    page_count: 456,
    published_year: 2025,
    highlights: [
      'Tam metin + günümüz öğrencileri için sayfa altı sözcük sözlüğü',
      'Bölüm sonlarında ana fikir, karakter ve anlatıcı inceleme soruları',
      'Feride’nin Anadolu yolculuğu haritası ve sınıf içi tartışma etkinlikleri',
    ],
    sample_pages: [
      {
        pageNumber: 7,
        heading: 'Eser Hakkında ve Okuma Rehberi',
        content:
          'İlk kez 1922 yılında yayımlanan Çalıkuşu, Anadolu gerçekliğini ve idealist genç öğretmenin eğitim mücadelesini en içten dille anlatan başyapıtlardan biridir.',
        highlights: [
          'Günümüz okuru için sayfa altı sözcük açıklamaları',
          'Bölüm sonlarında tema, bakış açısı ve karakter tahlilleri',
        ],
        tip: 'Roman büyük ölçüde Feride’nin günlüğü biçiminde (1. kişi ağzından) yazılmıştır.',
      },
      {
        pageNumber: 19,
        heading: 'Birinci Bölüm’den Seçme Metin',
        content:
          'Çocukluğumun en neşeli günleri, büyük bahçedeki ağaçların dallarında geçti. Arkadaşlarım benim bir türlü yerinde duramayan halime bakıp bana "Çalıkuşu" adını taktılar.',
        highlights: [
          'Anlatıcı: Feride (1. tekil kişi — samimi günlük üslubu)',
          'Dil Özellikleri: Sade, akıcı, konuşma diline yakın İstanbul Türkçesi',
        ],
      },
    ],
    is_published: true,
    created_at: ago(40),
    category: cat('turkce'),
  },
  {
    id: 'bk-3',
    slug: 'fen-bilimleri-kavram-ve-formul-defteri',
    added_by: demoProfiles.admin.id,
    category_id: cat('fen-bilimleri').id,
    title: 'Fen Bilimleri Kavram ve Formül Defteri',
    author: 'Ayşe Kaya',
    author_title: 'Fen Bilimleri Öğretmeni · Bi Ders! Eğitim Ekibi',
    author_bio:
      'Görsel fen şemaları ve deney odaklı ders notlarıyla tanınan Fen Bilimleri öğretmeni. 5–8. sınıf müfredatının tüm kritik kavram ve bağıntılarını tek cep kitabında topladı.',
    publisher: 'Bi Ders! Yayınları',
    isbn: '978-605-9124-03-8',
    description:
      'Ortaokul Fen Bilimleri dersinin tüm temel kavramları, basınç ve basit makineler bağıntıları, deney şemaları ve kısa açıklamaları bir arada. Yazılı ve LGS öncesi 15 dakikada hızlı tekrar için cep boy tasarlandı.',
    grade: '5–8. Sınıf / LGS',
    price: 139,
    cover_url: '/books/fizik-formul-defteri.webp',
    file_url: '/books/samples/fizik-formul-defteri-ornek.pdf',
    external_url: 'https://www.shopier.com/ShowProductNew/products.php?id=biders-fen-kavram-defteri',
    payment_provider: 'shopier',
    page_count: 96,
    published_year: 2025,
    highlights: [
      '5, 6, 7 ve 8. sınıf tüm LGS Fen Bilimleri kavramları tek defterde',
      'Basınç, basit makineler, elektrik ve madde dönüşümleri için görsel şemalar',
      'Spiralli cep boy tasarım ve renkli ünite sekmeleri',
    ],
    sample_pages: [
      {
        pageNumber: 6,
        heading: 'Bölüm 1: Katı, Sıvı ve Gaz Basıncı',
        content: 'Basınç birim yüzeye dik etki eden kuvvettir. Katılarda ağırlıkla doğru, temas yüzeyiyle ters orantılıdır.',
        highlights: [
          'Katı Basıncı: P = G / S (Pascal — Pa)',
          'Sıvı Basıncı: Sıvının derinliği ve yoğunluğu arttıkça artar (Pascal Prensibi)',
          'Açık Hava Basıncı: Deniz seviyesinden yükseklere çıkıldıkça azalır.',
        ],
        tip: 'Sıvı basıncı kabın şekline veya içindeki toplam sıvı miktarına bağlı değildir; yalnızca derinlik ve yoğunluğa bağlıdır.',
      },
      {
        pageNumber: 34,
        heading: 'Bölüm 4: Basit Makineler ve Kuvvet Kazancı',
        content: 'Kaldıraçlar, sabit ve hareketli makaralar, eğik düzlem ve çıkrık sistemlerinde kuvvet-yol dengesi.',
        highlights: [
          'Hiçbir basit makine işten veya enerjiden kazanç sağlamaz.',
          'Kuvvetten kazanç varsa aynı oranda yoldan kayıp vardır.',
        ],
      },
    ],
    is_published: true,
    created_at: ago(25),
    category: cat('fen-bilimleri'),
  },
  {
    id: 'bk-5',
    slug: 'fen-bilimleri-soru-bankasi',
    added_by: demoProfiles.admin.id,
    category_id: cat('fen-bilimleri').id,
    title: '8. Sınıf LGS Fen Bilimleri Soru Bankası',
    author: 'Ayşe Kaya & Bi Ders! Fen Zümresi',
    author_title: 'Fen Bilimleri Zümresi · Bi Ders! Eğitim Ekibi',
    author_bio:
      'Deney düzenekli ve grafik yorumlamalı LGS tarzı fen soruları hazırlayan deneyimli öğretmen ekibi.',
    publisher: 'Bi Ders! Yayınları',
    isbn: '978-605-9124-05-2',
    description:
      '7. ve 8. sınıf Fen Bilimleri ünitelerini kavrama, deney yorumlama ve LGS tarzı üç kademede pekiştiren 650 tamamen çözümlü soru. Her ünite başında tek sayfalık hızlı kavram özeti bulunur.',
    grade: '7–8. Sınıf / LGS',
    price: 279,
    cover_url: '/books/kimya-soru-bankasi.webp',
    file_url: '/books/samples/kimya-soru-bankasi-ornek.pdf',
    external_url: 'https://www.shopier.com/ShowProductNew/products.php?id=biders-fen-soru-bankasi',
    payment_provider: 'shopier',
    page_count: 288,
    published_year: 2026,
    highlights: [
      '650 özgün ve tamamı adım adım çözümlü LGS Fen Bilimleri sorusu',
      'Mevsimler, DNA, Basınç, Madde ve Endüstri, Basit Makineler üniteleri',
      'Periyodik sistem, asit-baz ve kimyasal tepkimeler için hata uyarı kutuları',
    ],
    sample_pages: [
      {
        pageNumber: 14,
        heading: 'Ünite 4: Madde ve Endüstri — Periyodik Sistem',
        content: 'Elementlerin metal, ametal ve yarı metal sınıflandırması ile fiziksel/kimyasal değişim soruları.',
        highlights: [
          'Aynı gruptaki elementlerin benzer kimyasal özellik göstermesi (Hidrojen istisnası)',
          'Asit ve bazların pH ölçeğindeki yerleri ve turnusol kâğıdı etkileri',
        ],
        tip: 'Deney sorularında bağımsız değişken (bizim değiştirdiğimiz) ile bağımlı değişkeni (sonuçta değişen) ilk satırda belirleyin.',
      },
    ],
    is_published: true,
    created_at: ago(8),
    category: cat('fen-bilimleri'),
  },
  {
    id: 'bk-6',
    slug: 'lgs-ingilizce-kelime-kartlari',
    added_by: demoProfiles.admin.id,
    category_id: cat('ingilizce').id,
    title: 'Ortaokul & LGS İngilizce Kelime Kartları',
    author: 'Bi Ders! Dil Ekibi',
    author_title: 'Yabancı Dil Zümresi · Ortaokul / LGS Uzmanları',
    author_bio:
      'MEB 5–8. sınıf İngilizce ders kitapları ve LGS çıkmış sorularındaki tüm ünite kelimelerini analiz eden İngilizce öğretmenleri ekibi.',
    publisher: 'Bi Ders! Yayınları',
    isbn: '978-605-9124-06-9',
    description:
      '5, 6, 7 ve 8. sınıf tüm MEB ünitelerinde en sık çıkan 1.000 İngilizce kelime; eş anlamlıları, kalıp ifadeleri ve LGS diyalog örnekleriyle aralıklı tekrar formatında.',
    grade: '5–8. Sınıf / LGS',
    price: 189,
    cover_url: '/books/ydt-kelime-kartlari.webp',
    file_url: '/books/samples/ydt-kelime-kartlari-ornek.pdf',
    external_url: 'https://iyzi.link/biders-lgs-ingilizce-kelime-kartlari',
    payment_provider: 'iyzico',
    page_count: 140,
    published_year: 2026,
    highlights: [
      'MEB 10 üniteye göre sıralı 1.000 temel kelime + eş/zıt anlam tablosu',
      'Her kartta LGS formatında örnek diyalog ve boşluk doldurma alıştırması',
      'Aralıklı tekrar (1-3-7 gün) çalışma planlayıcısı',
    ],
    sample_pages: [
      {
        pageNumber: 8,
        heading: 'Unit 1: Friendship — Temel Kelime Kartları',
        content: 'Eş anlamlıları ve bağlam içi örnek cümleleriyle sınav odaklı temel kelime kartları.',
        highlights: [
          'count on / rely on / trust — güvenmek',
          'back up / support — desteklemek',
          'get on well with — iyi anlaşmak',
        ],
        tip: 'Her gün 15 kart çalışın; 1., 3. ve 7. günlerde yalnızca zorlandığınız kartları tekrar edin.',
      },
    ],
    is_published: true,
    created_at: ago(11),
    category: cat('ingilizce'),
  },
]

// ---------------------------------------------------------------
// Favoriler ve iletişim mesajları
// ---------------------------------------------------------------
export const mockFavorites: Favorite[] = [
  { id: 'fv-1', user_id: demoProfiles.student.id, item_type: 'content', item_id: 'ct-1', created_at: ago(1) },
  { id: 'fv-2', user_id: demoProfiles.student.id, item_type: 'book', item_id: 'bk-3', created_at: ago(3) },
  { id: 'fv-3', user_id: demoProfiles.student.id, item_type: 'forum_topic', item_id: 'ft-1', created_at: ago(4) },
]

export const mockContactMessages: ContactMessage[] = [
  { id: 'cm-1', user_id: null, name: 'Selin Aydın', email: 'selin@example.com', subject: 'İçerik önerisi', message: 'Merhaba, Sosyal Bilgiler bölümüne harita okuma ve kültürümüzle ilgili yeni bir konu anlatımı eklenebilir mi?', status: 'new', created_at: ago(0, 5) },
  { id: 'cm-2', user_id: demoProfiles.student.id, name: 'Elif Yılmaz', email: 'demo.ogrenci@biders.org', subject: 'Hata bildirimi', message: 'Üslü ifadeler testindeki 4. sorunun açıklama metnini kontrol edebilir misiniz?', status: 'read', created_at: ago(2) },
  { id: 'cm-3', user_id: null, name: 'Okan Yurt', email: 'okan@example.com', subject: 'Öğretmen olarak katkı', message: 'Fen Bilimleri öğretmeniyim, ortaokul içerikleri üretmek istiyorum. Nasıl başvurabilirim?', status: 'new', created_at: ago(3) },
]

/** Demo hesap rol eşleşmesi */
export function getDemoProfile(role: Role): Profile {
  return role === 'student' ? demoProfiles.student : demoProfiles.admin
}
