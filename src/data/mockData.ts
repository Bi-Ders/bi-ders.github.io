/**
 * Bi Ders! — Demo Modu verileri
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
    bio: 'TYT-AYT hazırlanıyorum. En sevdiğim ders matematik, en zorlandığım kimya.',
    school: 'Kadıköy Anadolu Lisesi',
    grade: '12. Sınıf',
    role: 'student',
    created_at: ago(120),
    email: 'demo.ogrenci@biders.org',
  },
  admin: {
    id: '00000000-0000-4000-8000-000000000002',
    full_name: 'Murat Demir',
    username: 'murat.hoca',
    avatar_url: null,
    bio: 'Matematik öğretmeni. 15 yıldır lise ve sınav hazırlık öğrencileriyle çalışıyorum.',
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
    bio: 'Fizik öğretmeni.',
    school: 'Ankara Fen Lisesi',
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
    school: 'İzmir Atatürk Lisesi',
    grade: '11. Sınıf',
    role: 'student',
    created_at: ago(45),
  },
  {
    id: '00000000-0000-4000-8000-000000000005',
    full_name: 'Zeynep Arslan',
    username: 'zeynep.a',
    avatar_url: null,
    bio: 'Edebiyat sever.',
    school: 'Bursa Kız Lisesi',
    grade: '10. Sınıf',
    role: 'student',
    created_at: ago(20),
  },
  {
    id: '00000000-0000-4000-8000-000000000006',
    full_name: 'Emre Şahin',
    username: 'emre.sahin',
    avatar_url: null,
    bio: 'Kimya öğretmeni.',
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
// Kategoriler
// ---------------------------------------------------------------
export const mockCategories: Category[] = [
  { id: 'c-mat', slug: 'matematik', name: 'Matematik', description: 'Sayılar, cebir, geometri ve analiz', icon: 'sigma', color: '#2F55D4', sort_order: 1 },
  { id: 'c-fiz', slug: 'fizik', name: 'Fizik', description: 'Hareket, kuvvet, enerji, elektrik ve dalgalar', icon: 'atom', color: '#0E7C66', sort_order: 2 },
  { id: 'c-kim', slug: 'kimya', name: 'Kimya', description: 'Madde, tepkimeler ve periyodik sistem', icon: 'flask-conical', color: '#B4441C', sort_order: 3 },
  { id: 'c-bio', slug: 'biyoloji', name: 'Biyoloji', description: 'Hücre, kalıtım, ekoloji ve insan fizyolojisi', icon: 'leaf', color: '#3F7D20', sort_order: 4 },
  { id: 'c-tr', slug: 'turkce', name: 'Türkçe', description: 'Dil bilgisi, paragraf ve anlam bilgisi', icon: 'languages', color: '#9A3B8C', sort_order: 5 },
  { id: 'c-ede', slug: 'edebiyat', name: 'Edebiyat', description: 'Türk ve dünya edebiyatı, şiir ve nesir', icon: 'feather', color: '#7A4E12', sort_order: 6 },
  { id: 'c-tar', slug: 'tarih', name: 'Tarih', description: 'Türk ve dünya tarihi', icon: 'landmark', color: '#8B2E2E', sort_order: 7 },
  { id: 'c-cog', slug: 'cografya', name: 'Coğrafya', description: 'Fiziki ve beşeri coğrafya', icon: 'globe', color: '#1F6E8C', sort_order: 8 },
  { id: 'c-ing', slug: 'ingilizce', name: 'İngilizce', description: 'Kelime, dil bilgisi ve okuma becerileri', icon: 'book-a', color: '#38464F', sort_order: 9 },
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
    title: 'Türev Nedir? Limit Tanımından Türev Kurallarına',
    slug: 'turev-nedir-limit-tanimindan-turev-kurallarina',
    summary: 'Türevin geometrik anlamı, limit ile tanımı ve sınavlarda en çok kullanılan türev alma kuralları örneklerle.',
    body: `## Türevin geometrik anlamı\nBir fonksiyonun bir noktadaki türevi, o noktadaki **teğet doğrusunun eğimidir**. Grafiği düşündüğünüzde, eğri üzerinde çok küçük bir adım attığınızda yüksekliğin ne kadar değiştiğini ölçeriz.\n\n## Limit ile tanım\nf fonksiyonunun x = a noktasındaki türevi, h sıfıra yaklaşırken [f(a + h) − f(a)] / h ifadesinin limitidir. Bu limit varsa fonksiyon a noktasında türevlenebilirdir.\n\n## Temel kurallar\n- Sabit fonksiyonun türevi 0'dır.\n- xⁿ fonksiyonunun türevi n·xⁿ⁻¹'dir.\n- Toplamın türevi, türevlerin toplamıdır.\n- Çarpım kuralı: (f·g)' = f'·g + f·g'\n\n## Sınav ipucu\nTYT'de türev doğrudan sorulmaz; ancak AYT'de her yıl ortalama 3–4 soru türev ve uygulamalarından gelir. Önce kuralları ezberlemek yerine eğim mantığını oturtun.`,
    type: 'lesson',
    grade: '12. Sınıf / AYT',
    tags: ['türev', 'limit', 'ayt'],
    view_count: 4821,
    published_at: ago(2),
  },
  {
    id: 'ct-2',
    cat: 'fizik',
    a: 2,
    title: 'Newton\'un Hareket Yasaları: Günlük Hayattan Örneklerle',
    slug: 'newtonun-hareket-yasalari',
    summary: 'Eylemsizlik, F = m·a ve etki-tepki prensibini otobüs, roket ve buz pateni örnekleriyle kavrayın.',
    body: `## 1. Yasa: Eylemsizlik\nBir cisme net kuvvet etki etmiyorsa cisim durumunu korur. Otobüs aniden fren yaptığında öne doğru savrulmanızın sebebi budur.\n\n## 2. Yasa: Temel prensip\nNet kuvvet, kütle ile ivmenin çarpımına eşittir: **F = m · a**. Aynı kuvvetle itilen boş bir alışveriş arabası, dolu olandan daha hızlı ivmelenir.\n\n## 3. Yasa: Etki-tepki\nHer etkiye eşit büyüklükte ve zıt yönde bir tepki vardır. Roketler, gazı geriye iterek ileri doğru hareket eder.`,
    type: 'lesson',
    grade: '9. Sınıf / TYT',
    tags: ['dinamik', 'newton', 'tyt'],
    view_count: 3190,
    published_at: ago(4),
  },
  {
    id: 'ct-3',
    cat: 'kimya',
    a: 5,
    title: 'Periyodik Tablo Okuma Rehberi',
    slug: 'periyodik-tablo-okuma-rehberi',
    summary: 'Grup, periyot, atom yarıçapı ve elektronegatiflik değişimini tek bir şemayla akılda tutun.',
    body: `## Periyot ve grup\nYatay satırlara **periyot**, dikey sütunlara **grup** denir. Aynı gruptaki elementlerin kimyasal özellikleri benzerdir.\n\n## Periyodik özellikler\n- Soldan sağa atom yarıçapı küçülür.\n- Yukarıdan aşağı atom yarıçapı büyür.\n- Elektronegatiflik sağ üst köşeye (flor) doğru artar.`,
    type: 'article',
    grade: '9. Sınıf',
    tags: ['periyodik tablo', 'atom'],
    view_count: 2210,
    published_at: ago(6),
  },
  {
    id: 'ct-4',
    cat: 'turkce',
    a: 1,
    title: 'Paragrafta Ana Düşünce Nasıl Bulunur?',
    slug: 'paragrafta-ana-dusunce-nasil-bulunur',
    summary: 'TYT Türkçe\'nin en çok soru gelen konusu için 4 adımlı pratik bir çözüm yöntemi.',
    body: `## Adım adım yöntem\n1. Önce soru kökünü okuyun.\n2. Paragrafın ilk ve son cümlesine odaklanın.\n3. Yazarın tekrar ettiği kavramı bulun.\n4. Seçeneklerde paragrafı **bütünüyle** kapsayanı seçin.\n\n## Sık yapılan hata\nParagrafta geçen ama yalnızca bir bölümü anlatan cümleyi ana düşünce sanmak.`,
    type: 'lesson',
    grade: 'TYT',
    tags: ['paragraf', 'tyt', 'türkçe'],
    view_count: 5630,
    published_at: ago(9),
  },
  {
    id: 'ct-5',
    cat: 'biyoloji',
    a: 2,
    title: 'Hücre Zarından Madde Geçişi',
    slug: 'hucre-zarindan-madde-gecisi',
    summary: 'Difüzyon, osmoz, aktif taşıma, endositoz ve ekzositozun karşılaştırmalı özeti.',
    body: `## Pasif taşıma\nEnerji harcanmaz; madde çok yoğun ortamdan az yoğun ortama geçer. Difüzyon ve osmoz pasif taşımaya örnektir.\n\n## Aktif taşıma\nATP harcanır ve madde az yoğun ortamdan çok yoğun ortama taşınır.`,
    type: 'lesson',
    grade: '9. Sınıf',
    tags: ['hücre', 'osmoz'],
    view_count: 1870,
    published_at: ago(12),
  },
  {
    id: 'ct-6',
    cat: 'tarih',
    a: 1,
    title: 'Kurtuluş Savaşı Kronolojisi (1919–1923)',
    slug: 'kurtulus-savasi-kronolojisi',
    summary: 'Samsun\'dan Lozan\'a kadar tüm önemli kongre, cephe ve antlaşmalar tek bir zaman çizelgesinde.',
    body: `## Hazırlık dönemi\nAmasya Genelgesi, Erzurum ve Sivas kongreleri millî iradenin örgütlendiği aşamadır.\n\n## Cepheler\nDoğu, Güney ve Batı cepheleri; Sakarya Meydan Muharebesi ve Büyük Taarruz ile sonuçlanır.`,
    type: 'document',
    grade: '12. Sınıf / TYT',
    tags: ['inkılap tarihi', 'kronoloji'],
    view_count: 2944,
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
    title: 'Logaritma sorularında taban değiştirme kuralını ne zaman kullanmalıyım?',
    body: 'Deneme sınavlarında logaritma sorularında takılıyorum. Özellikle farklı tabanlı logaritmalar çıkınca nereden başlayacağımı bilemiyorum. Bir yöntem önerebilir misiniz?',
    tags: ['logaritma', 'ayt'],
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
    category_id: cat('edebiyat').id,
    title: 'Servet-i Fünun ile Fecr-i Âti arasındaki temel farklar neler?',
    body: 'İki dönemi sürekli karıştırıyorum. Sanat anlayışı ve temsilciler açısından kısa bir karşılaştırma yapabilecek var mı?',
    tags: ['edebiyat', 'ayt'],
    is_pinned: false,
    is_locked: false,
    is_solved: false,
    reply_count: 1,
    view_count: 128,
    like_count: 7,
    last_activity_at: ago(0, 8),
    created_at: ago(2),
    author: author(4),
    category: cat('edebiyat'),
  },
  {
    id: 'ft-3',
    author_id: mockProfiles[0]!.id,
    category_id: cat('kimya').id,
    title: 'Mol hesaplamalarında hangi kaynağı önerirsiniz?',
    body: 'Mol konusunu temelden tekrar etmek istiyorum. Video veya kitap önerisi olan var mı?',
    tags: ['mol', 'kaynak önerisi'],
    is_pinned: false,
    is_locked: false,
    is_solved: false,
    reply_count: 0,
    view_count: 64,
    like_count: 4,
    last_activity_at: ago(3),
    created_at: ago(3),
    author: author(0),
    category: cat('kimya'),
  },
  {
    id: 'ft-4',
    author_id: mockProfiles[3]!.id,
    category_id: cat('fizik').id,
    title: 'Eğik atış problemlerinde maksimum yükseklik formülü',
    body: 'Hmax formülünü ezberlemek yerine nasıl türetebilirim?',
    tags: ['eğik atış', 'fizik'],
    is_pinned: false,
    is_locked: false,
    is_solved: true,
    reply_count: 2,
    view_count: 201,
    like_count: 11,
    last_activity_at: ago(4),
    created_at: ago(5),
    author: author(3),
    category: cat('fizik'),
  },
]

export const mockForumReplies: ForumReply[] = [
  {
    id: 'fr-1',
    topic_id: 'ft-1',
    author_id: mockProfiles[1]!.id,
    body: 'Önce tüm logaritmaları ortak bir tabana (genelde 10 ya da soruda en çok geçen taban) çevirin. log_a(b) = log(b) / log(a) eşitliği tüm işi görür. Ardından ifadeyi sadeleştirin.',
    is_accepted: true,
    like_count: 18,
    created_at: ago(0, 20),
    author: author(1),
  },
  {
    id: 'fr-2',
    topic_id: 'ft-1',
    author_id: mockProfiles[0]!.id,
    body: 'Ben de aynı sorunu yaşıyordum, hocanın dediği yöntemle 10 soruluk testte 8 net yaptım. Teşekkürler!',
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
    body: 'Servet-i Fünun "sanat için sanat" anlayışını benimser ve Batı edebiyatını örnek alır; Fecr-i Âti ise "Sanat şahsi ve muhteremdir" diyerek bu anlayışı daha da bireysel bir noktaya taşır.',
    is_accepted: false,
    like_count: 9,
    created_at: ago(0, 8),
    author: author(2),
  },
  {
    id: 'fr-5',
    topic_id: 'ft-4',
    author_id: mockProfiles[2]!.id,
    body: 'Düşey hız tepe noktasında sıfır olur. v² = v₀² − 2gh eşitliğinde düşey bileşeni kullanırsanız Hmax = (v₀·sinα)² / 2g sonucunu kendiniz elde edersiniz.',
    is_accepted: true,
    like_count: 12,
    created_at: ago(4, 6),
    author: author(2),
  },
  {
    id: 'fr-6',
    topic_id: 'ft-4',
    author_id: mockProfiles[3]!.id,
    body: 'Harika, türetince akılda kalıcı oluyor.',
    is_accepted: false,
    like_count: 3,
    created_at: ago(4),
    author: author(3),
  },
]

// ---------------------------------------------------------------
// Testler
// ---------------------------------------------------------------
export const mockQuizzes: Quiz[] = [
  {
    id: 'qz-1',
    author_id: mockProfiles[1]!.id,
    category_id: cat('matematik').id,
    title: 'Türev Kuralları — Konu Tarama Testi',
    slug: 'turev-kurallari-konu-tarama',
    description: 'Temel türev alma kuralları, çarpım-bölüm türevi ve teğet eğimi üzerine 6 seçkin soru.',
    grade: '12. Sınıf',
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
    category_id: cat('fizik').id,
    title: 'Kuvvet ve Hareket — Başlangıç',
    slug: 'kuvvet-ve-hareket-baslangic',
    description: 'Newton yasaları, eylemsizlik ve net kuvvet kavramlarını ölçen 6 soruluk test.',
    grade: '9. Sınıf',
    difficulty: 'easy',
    time_limit_minutes: 10,
    is_published: true,
    created_at: ago(6),
    question_count: 6,
    author: author(2),
    category: cat('fizik'),
  },
  {
    id: 'qz-3',
    author_id: mockProfiles[1]!.id,
    category_id: cat('turkce').id,
    title: 'Paragraf ve Anlam Bilgisi Deneme #4',
    slug: 'paragraf-deneme-seti-4',
    description: 'TYT formatında ana düşünce, yardımcı düşünce ve anlatım biçimleri üzerine 6 soru.',
    grade: 'TYT',
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
    category_id: cat('kimya').id,
    title: 'Mol Kavramı ve Hesaplamalar',
    slug: 'mol-kavrami-ve-hesaplamalar',
    description: 'Avogadro sayısı, mol kütlesi ve kütle-mol dönüşümlerini pekiştiren 6 soru.',
    grade: '10. Sınıf',
    difficulty: 'medium',
    time_limit_minutes: 12,
    is_published: true,
    created_at: ago(14),
    question_count: 6,
    author: author(5),
    category: cat('kimya'),
  },
  {
    id: 'qz-5',
    author_id: mockProfiles[2]!.id,
    category_id: cat('biyoloji').id,
    title: 'Hücre Organelleri ve Madde Geçişi',
    slug: 'hucre-organelleri-ve-madde-gecisi',
    description: 'Ökaryot-prokaryot farkları, osmoz, difüzyon ve aktif taşıma sorularıyla hızlı tekrar.',
    grade: '9. Sınıf',
    difficulty: 'easy',
    time_limit_minutes: 10,
    is_published: true,
    created_at: ago(7),
    question_count: 5,
    author: author(2),
    category: cat('biyoloji'),
  },
  {
    id: 'qz-6',
    author_id: mockProfiles[1]!.id,
    category_id: cat('tarih').id,
    title: 'Kurtuluş Savaşı Hazırlık ve Cepheler',
    slug: 'kurtulus-savasi-hazirlik-ve-cepheler',
    description: 'Kongreler, TBMM’nin açılışı ve Batı Cephesi muharebeleri üzerine 5 soru.',
    grade: '12. Sınıf / TYT',
    difficulty: 'medium',
    time_limit_minutes: 10,
    is_published: true,
    created_at: ago(4),
    question_count: 5,
    author: author(1),
    category: cat('tarih'),
  },
]

export const mockQuizResults: QuizResult[] = [
  { id: 'qr-1', quiz_id: 'qz-1', user_id: demoProfiles.student.id, score: 5, total: 6, duration_seconds: 412, created_at: ago(1), quiz: { id: 'qz-1', title: 'Türev Kuralları — Konu Tarama Testi', slug: 'turev-kurallari-konu-tarama' } },
  { id: 'qr-2', quiz_id: 'qz-3', user_id: demoProfiles.student.id, score: 4, total: 6, duration_seconds: 590, created_at: ago(5), quiz: { id: 'qz-3', title: 'Paragraf ve Anlam Bilgisi Deneme #4', slug: 'paragraf-deneme-seti-4' } },
  { id: 'qr-3', quiz_id: 'qz-2', user_id: demoProfiles.student.id, score: 6, total: 6, duration_seconds: 310, created_at: ago(9), quiz: { id: 'qz-2', title: 'Kuvvet ve Hareket — Başlangıç', slug: 'kuvvet-ve-hareket-baslangic' } },
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
    title: 'Temel Matematik Konu Anlatımı',
    author: 'Murat Demir & Bi Ders! Matematik Ekibi',
    author_title: 'Matematik Öğretmeni · 15 Yıl Deneyim',
    author_bio:
      'Lise ve YKS hazırlık öğrencileri için sade, sezgisel anlatımlar hazırlayan Bi Ders! matematik kurucu editörü.',
    publisher: 'Bi Ders! Yayınları',
    isbn: '978-605-9124-01-4',
    description:
      'TYT matematik konularını sıfırdan sınav seviyesine taşıyan sade, görsel ve çözümlü konu anlatım kitabı. Her bölümde günlük hayattan somut örnekler, öğretmen ipuçları ve kademeli pekiştirme testleri bulunur.',
    grade: 'TYT',
    price: 249,
    cover_url: '/books/temel-matematik.webp',
    file_url: '/books/samples/temel-matematik-ornek.pdf',
    external_url: 'https://www.shopier.com/ShowProductNew/products.php?id=biders-temel-matematik',
    payment_provider: 'shopier',
    page_count: 312,
    published_year: 2026,
    highlights: [
      'Güncel ÖSYM ve MEB kazanımlarıyla %100 uyumlu 14 temel ünite',
      '420 adım adım çözümlü örnek ve pratik hızlandırma notları',
      'Her ünite sonunda kendini dene alıştırmaları ve QR kodlu ek testler',
      'Basılı kitap + yüksek kaliteli dijital özet föy desteği',
    ],
    sample_pages: [
      {
        pageNumber: 12,
        heading: 'Bölüm 1: Temel Kavramlar ve Sayı Kümeleri',
        content:
          'TYT Matematik testinin temeli sayı kümelerini doğru tanımak ve aralarındaki kapsama ilişkisini sezgisel olarak kavrayabilmektir.',
        highlights: [
          'Doğal Sayılar (N) = {0, 1, 2, 3, ...} — Sayma sayıları 1’den başlar.',
          'Tam Sayılar (Z) = {..., -2, -1, 0, 1, 2, ...}',
          'Rasyonel Sayılar (Q): a ve b tam sayı, b ≠ 0 olmak üzere a/b biçimindeki sayılar.',
          'Reel Sayılar (R): Rasyonel ve irrasyonel sayıların birleşimi (N ⊂ Z ⊂ Q ⊂ R).',
        ],
        tip: 'Soru kökünde "tam sayı" ifadesi varsa değer verme, "gerçel sayı" ifadesi varsa eşitsizlik kurma yöntemini tercih edin.',
      },
      {
        pageNumber: 48,
        heading: 'Çözümlü Örnek: Tek ve Çift Sayı Analizi',
        content:
          'Örnek 14: a, b ve c birer tam sayı olmak üzere (3a + 1)·b = 2c + 5 eşitliği veriliyor. Buna göre a + b toplamı hakkında ne söylenebilir?',
        highlights: [
          'Sağ taraftaki 2c her tam sayı c için çifttir; 2c + 5 daima TEK sayıdır.',
          'Çarpım tek olduğundan her iki çarpan tek olmalıdır: (3a + 1) tek ve b tek.',
          '3a + 1 tek ise a kesinlikle ÇİFT sayıdır; a + b toplamı her zaman TEK olur.',
        ],
      },
      {
        pageNumber: 104,
        heading: 'Ünite Sonu Kendini Dene (Mini Alıştırma)',
        content: 'Her ünitenin sonunda konuyu pekiştiren kademeli alıştırmalar ve çözüm anahtarları yer alır.',
        highlights: [
          'Ardışık 5 tek doğal sayının toplamı 115 ise en büyüğü kaçtır? (Cevap: 27)',
          'x, y ∈ Z⁺ ve x + y = 18 ise x·y en fazla kaçtır? (Cevap: 81)',
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
    category_id: cat('edebiyat').id,
    title: 'Çalıkuşu',
    author: 'Reşat Nuri Güntekin',
    author_title: 'Türk Edebiyatı Klasik Yazarı · Açıklamalı Baskı',
    author_bio:
      'Cumhuriyet dönemi Türk edebiyatının öncü romancısı. Bu özel öğrenci baskısı Bi Ders! edebiyat öğretmenleri tarafından sözlük ve tahlil notlarıyla zenginleştirilmiştir.',
    publisher: 'Bi Ders! Klasikler',
    isbn: '978-605-9124-02-1',
    description:
      'Feride’nin İstanbul’dan Anadolu’nun köylerine uzanan öğretmenlik serüveni. Lise okuma listeleri ve AYT Edebiyat hazırlığı için sayfa altı kelime açıklamaları ve bölüm sonu tema analizleriyle hazırlanmış özel baskı.',
    grade: 'Genel / AYT',
    price: 129,
    cover_url: '/books/calikusu.webp',
    file_url: '/books/samples/calikusu-ornek.pdf',
    external_url: 'https://iyzi.link/biders-calikusu-ogrenci-baskisi',
    payment_provider: 'iyzico',
    page_count: 456,
    published_year: 2025,
    highlights: [
      'Tam metin + günümüz okuru için sayfa altı Osmanlıca sözcük sözlüğü',
      'Bölüm sonlarında AYT Edebiyat odaklı karakter ve bakış açısı tahlilleri',
      'Feride’nin Anadolu yolculuğu kronoloji haritası ve tartışma soruları',
    ],
    sample_pages: [
      {
        pageNumber: 7,
        heading: 'Eser Hakkında ve Dönem Arka Planı',
        content:
          'İlk kez 1922 yılında yayımlanan Çalıkuşu, Anadolu gerçekliğini ve idealist genç öğretmenin eğitim mücadelesini en içten dille anlatan başyapıtlardan biridir.',
        highlights: [
          'Günümüz okuru için sayfa altı sözcük açıklamaları',
          'Bölüm sonlarında tema, bakış açısı ve karakter tahlilleri',
        ],
        tip: 'Roman büyük ölçüde Feride’nin günlüğü biçiminde (kahraman bakış açısıyla) yazılmıştır.',
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
      {
        pageNumber: 442,
        heading: 'Okuma Sonrası Tartışma & Sınav Soruları',
        content: 'Eserin sonunda hem sınıf içi değerlendirme hem de AYT hazırlığı için açık uçlu inceleme soruları bulunur.',
        highlights: [
          'Feride’nin Anadolu’da öğretmenlik yapma kararının toplumsal arka planı',
          'Hayrullah Bey karakterinin romanın çözüm bölümündeki işlevi',
        ],
      },
    ],
    is_published: true,
    created_at: ago(40),
    category: cat('edebiyat'),
  },
  {
    id: 'bk-3',
    slug: 'fizik-formul-defteri',
    added_by: demoProfiles.admin.id,
    category_id: cat('fizik').id,
    title: 'Fizik Formül Defteri',
    author: 'Ayşe Kaya',
    author_title: 'Fizik Öğretmeni · Ankara Fen Lisesi',
    author_bio:
      'Görsel fizik şemaları ve birim analizi odaklı ders notlarıyla tanınan fizik öğretmeni. 9–12. sınıf müfredatının tüm kritik bağıntılarını tek cep kitabında topladı.',
    publisher: 'Bi Ders! Yayınları',
    isbn: '978-605-9124-03-8',
    description:
      'Lise fiziğinin tüm formülleri, SI birimleri, vektör şemaları ve kısa açıklamaları bir arada. Deneme sınavları öncesi 15 dakikada hızlı tekrar yapabilmek için cep boy tasarlandı.',
    grade: '9–12. Sınıf',
    price: 139,
    cover_url: '/books/fizik-formul-defteri.webp',
    file_url: '/books/samples/fizik-formul-defteri-ornek.pdf',
    external_url: 'https://www.shopier.com/ShowProductNew/products.php?id=biders-fizik-formul-defteri',
    payment_provider: 'shopier',
    page_count: 96,
    published_year: 2025,
    highlights: [
      '9, 10, 11 ve 12. sınıf tüm TYT-AYT fizik formülleri tek defterde',
      'Her formülün yanında SI birim analizi ve sık yapılan hata uyarıları',
      'Spiralli cep boy tasarım ve renkli konu sekmeleri',
    ],
    sample_pages: [
      {
        pageNumber: 6,
        heading: 'Bölüm 1: Hareket, Kuvvet ve Newton Yasaları',
        content: 'Fizikte formülleri ezberlemek yerine birim analizini ve fiziksel anlamını bilmek kalıcı hız sağlar.',
        highlights: [
          'Ortalama Hız: v_ort = Δx / Δt (m/s)',
          'İvme: a = Δv / Δt (m/s²)',
          'Newton’un 2. Yasası: F_net = m · a (1 N = 1 kg·m/s²)',
        ],
        tip: 'Eşitliğin iki tarafındaki SI birimleri her zaman özdeş olmalıdır.',
      },
      {
        pageNumber: 34,
        heading: 'Bölüm 4: Elektrik Devreleri ve Ohm Yasası',
        content: 'Seri ve paralel direnç bağlantılarında akım, gerilim ve elektriksel güç hesaplamaları.',
        highlights: [
          'Ohm Yasası: V = I · R',
          'Elektriksel Güç: P = V · I = I² · R = V² / R (Watt)',
        ],
      },
      {
        pageNumber: 68,
        heading: 'Bölüm 8: Dalgalar ve Optik Hızlı Kart',
        content: 'Dalga hızı, kırılma yasaları ve mercek görüntü özellikleri özet tablosu.',
        highlights: [
          'Dalga Hızı: v = λ · f (Hız ortama, frekans kaynağa bağlıdır)',
          'Snell Yasası: n₁ · sin(θ₁) = n₂ · sin(θ₂)',
        ],
      },
    ],
    is_published: true,
    created_at: ago(25),
    category: cat('fizik'),
  },
  {
    id: 'bk-5',
    slug: 'kimya-soru-bankasi',
    added_by: demoProfiles.admin.id,
    category_id: cat('kimya').id,
    title: 'Kimya Soru Bankası',
    author: 'Emre Şahin',
    author_title: 'Kimya Öğretmeni · Bi Ders! Eğitim Ekibi',
    author_bio:
      'Organik ve genel kimya soru yazarlığı alanında 12 yıllık deneyime sahip kimya öğretmeni. Öğrencilerin en çok hata yaptığı hesaplama adımlarını hedef alan özgün sorular üretir.',
    publisher: 'Bi Ders! Yayınları',
    isbn: '978-605-9124-05-2',
    description:
      '10. ve 11. sınıf kimya konularını kavrama, uygulama ve ÖSYM tarzı üç kademede pekiştiren 800 tamamen çözümlü soru. Her ünite başında tek sayfalık hızlı formül özeti bulunur.',
    grade: '10–11. Sınıf',
    price: 279,
    cover_url: '/books/kimya-soru-bankasi.webp',
    file_url: '/books/samples/kimya-soru-bankasi-ornek.pdf',
    external_url: 'https://www.shopier.com/ShowProductNew/products.php?id=biders-kimya-soru-bankasi',
    payment_provider: 'shopier',
    page_count: 288,
    published_year: 2026,
    highlights: [
      '800 özgün ve tamamı adım adım çözümlü kimya sorusu',
      '48 konu kavrama testi + 6 karma tarama denemesi',
      'Mol, asit-baz, gazlar, çözeltiler ve kimyasal denge için hata uyarı kutuları',
    ],
    sample_pages: [
      {
        pageNumber: 14,
        heading: 'Ünite 1: Mol Kavramı — Kazanım Testi 1',
        content: 'Kavrama, Uygulama ve ÖSYM Tarzı üç kademeli soru dizilimi ile adım adım ustalaşma.',
        highlights: [
          '0,4 mol CH₄ gazının kütlesi ve toplam atom sayısı hesabı',
          'Normal koşullarda 5,6 L CO₂ içindeki oksijen atomu sayısı',
        ],
        tip: 'Eşit kütle sorularında iki gazın mol kütlelerinin ortak katını seçmek kesirli işlemleri ortadan kaldırır.',
      },
      {
        pageNumber: 92,
        heading: 'Ünite 3: Asitler, Bazlar ve Nötralleşme',
        content: 'Tesir değerliği üzerinden tam nötralleşme tepkimelerinin pratik çözümü.',
        highlights: ['H₂SO₄ + 2 NaOH → Na₂SO₄ + 2 H₂O tepkime katsayı analizi'],
      },
      {
        pageNumber: 244,
        heading: 'Çözüm Anahtarı ve Hata Takip Çizelgesi',
        content: 'Her sorunun ayrıntılı yazılı çözümü ve ünite bazlı eksik kazanım takip tablosu.',
      },
    ],
    is_published: true,
    created_at: ago(8),
    category: cat('kimya'),
  },
  {
    id: 'bk-6',
    slug: 'ydt-kelime-kartlari',
    added_by: demoProfiles.admin.id,
    category_id: cat('ingilizce').id,
    title: 'YDT Kelime Kartları',
    author: 'Bi Ders! Dil Ekibi',
    author_title: 'Yabancı Dil Zümresi · YDT / YDS Uzmanları',
    author_bio:
      'Son 10 yılın ÖSYM YDT ve YDS çıkmış sorularını derlem bilimi (corpus) yaklaşımıyla analiz eden İngilizce öğretmenleri ekibi.',
    publisher: 'Bi Ders! Yayınları',
    isbn: '978-605-9124-06-9',
    description:
      'Sınavda en sık çıkan 1.500 akademik İngilizce kelime; eş anlamlıları, edat kullanımları, phrasal verb çiftleri ve bağlam içi örnek cümleleriyle aralıklı tekrar formatında.',
    grade: 'YDT',
    price: 189,
    cover_url: '/books/ydt-kelime-kartlari.webp',
    file_url: '/books/samples/ydt-kelime-kartlari-ornek.pdf',
    external_url: 'https://iyzi.link/biders-ydt-kelime-kartlari',
    payment_provider: 'iyzico',
    page_count: 140,
    published_year: 2026,
    highlights: [
      'Frekans analizli 1.500 akademik kelime + eş/zıt anlam tablosu',
      'Her kartta sınav formatında örnek cümle ve boşluk doldurma alıştırması',
      'Aralıklı tekrar (1-3-7 gün) çalışma planlayıcısı',
    ],
    sample_pages: [
      {
        pageNumber: 8,
        heading: 'Set 1: En Sık Çıkan Akademik Fiiller (Verbs)',
        content: 'Eş anlamlıları ve bağlam içi örnek cümleleriyle sınav odaklı temel fiil kartları.',
        highlights: [
          'alleviate (v) — hafifletmek, azaltmak (Syn: ease, relieve)',
          'deteriorate (v) — kötüleşmek, bozulmak (Syn: worsen, decline)',
          'scrutinize (v) — titizlikle incelemek (Syn: examine, inspect)',
        ],
        tip: 'Her gün 20 kart çalışın; 1., 3. ve 7. günlerde yalnızca zorlandığınız kartları tekrar edin.',
      },
      {
        pageNumber: 64,
        heading: 'Set 6: Phrasal Verbs & Prepositional Phrases',
        content: 'YDT’de en sık karıştırılan phrasal verb çiftlerinin karşılaştırmalı incelemesi.',
        highlights: [
          'put off (ertelemek) vs. put out (söndürmek)',
          'bring about (sebep olmak) · carry out (yürütmek) · account for (açıklamak/oranını oluşturmak)',
        ],
      },
      {
        pageNumber: 122,
        heading: 'Mini Kelime Testi ve Eş Anlam Dizini',
        content: 'Her set sonunda bağlam içi pekiştirme testleri ve alfabetik hızlı tarama dizini.',
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
  { id: 'cm-1', user_id: null, name: 'Selin Aydın', email: 'selin@example.com', subject: 'İçerik önerisi', message: 'Merhaba, Coğrafya bölümüne harita okuma ile ilgili bir konu anlatımı eklenebilir mi?', status: 'new', created_at: ago(0, 5) },
  { id: 'cm-2', user_id: demoProfiles.student.id, name: 'Elif Yılmaz', email: 'demo.ogrenci@biders.org', subject: 'Hata bildirimi', message: 'Türev testindeki 7. sorunun cevap anahtarında hata olabilir, kontrol eder misiniz?', status: 'read', created_at: ago(2) },
  { id: 'cm-3', user_id: null, name: 'Okan Yurt', email: 'okan@example.com', subject: 'Öğretmen olarak katkı', message: 'Biyoloji öğretmeniyim, içerik üretmek istiyorum. Nasıl başvurabilirim?', status: 'new', created_at: ago(3) },
]

/** Demo hesap rol eşleşmesi */
export function getDemoProfile(role: Role): Profile {
  return role === 'student' ? demoProfiles.student : demoProfiles.admin
}
