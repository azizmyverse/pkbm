/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// =============================================================
// Helpers
// =============================================================

const SALT_ROUNDS = 10;

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function weighted(items) {
  // items: [{ value, weight }]
  const total = items.reduce((s, i) => s + i.weight, 0);
  let r = Math.random() * total;
  for (const it of items) {
    if ((r -= it.weight) <= 0) return it.value;
  }
  return items[items.length - 1].value;
}

function generateNISN() {
  // 10 digit NISN starting with realistic year prefix (e.g. 00 / 01)
  let s = '00';
  for (let i = 0; i < 8; i += 1) s += randInt(0, 9).toString();
  return s;
}

async function hash(pwd) {
  return bcrypt.hash(pwd, SALT_ROUNDS);
}

// =============================================================
// Static seed definitions
// =============================================================

const PENGATURAN = [
  { key: 'nama_pkbm', value: 'PKBM MUGI SAE', keterangan: 'Nama lembaga' },
  { key: 'alamat', value: 'Jl. Pendidikan No. 12, Semarang, Jawa Tengah', keterangan: 'Alamat lembaga' },
  { key: 'telepon', value: '024-12345678', keterangan: 'Nomor telepon kontak' },
  { key: 'email', value: 'info@pkbmmugiasae.sch.id', keterangan: 'Email kontak resmi' },
  { key: 'tahun_ajaran', value: '2025/2026', keterangan: 'Tahun ajaran aktif' },
  { key: 'semester_aktif', value: '1', keterangan: 'Semester aktif (1 atau 2)' },
  { key: 'logo_url', value: '/logo.svg', keterangan: 'Path logo lembaga' },
  { key: 'min_kehadiran', value: '75', keterangan: 'Persentase minimum kehadiran (%)' },
  { key: 'bobot_tugas', value: '40', keterangan: 'Bobot nilai tugas (%)' },
  { key: 'bobot_uts', value: '30', keterangan: 'Bobot nilai UTS (%)' },
  { key: 'bobot_uas', value: '30', keterangan: 'Bobot nilai UAS (%)' },
];

const PAKET_DATA = [
  {
    level: 'PAKET_A',
    nama: 'Paket A - Setara SD',
    deskripsi: 'Program pendidikan kesetaraan jenjang SD untuk warga belajar usia dini hingga dewasa.',
  },
  {
    level: 'PAKET_B',
    nama: 'Paket B - Setara SMP',
    deskripsi: 'Program pendidikan kesetaraan jenjang SMP bagi lulusan SD/Paket A.',
  },
  {
    level: 'PAKET_C',
    nama: 'Paket C - Setara SMA',
    deskripsi: 'Program pendidikan kesetaraan jenjang SMA bagi lulusan SMP/Paket B.',
  },
];

const MAPEL_PAKET_A = [
  { nama: 'Matematika', kode: 'MAT-A', icon: '📐' },
  { nama: 'Bahasa Indonesia', kode: 'BIN-A', icon: '📖' },
  { nama: 'IPA', kode: 'IPA-A', icon: '🔬' },
  { nama: 'IPS', kode: 'IPS-A', icon: '🌍' },
  { nama: 'PKn', kode: 'PKN-A', icon: '🏛️' },
  { nama: 'Pendidikan Agama', kode: 'AGM-A', icon: '🕌' },
  { nama: 'Bahasa Inggris', kode: 'BIG-A', icon: '🇬🇧' },
  { nama: 'Seni Budaya', kode: 'SBD-A', icon: '🎨' },
  { nama: 'PJOK', kode: 'PJK-A', icon: '⚽' },
  { nama: 'Keterampilan Hidup', kode: 'KTH-A', icon: '🔧' },
];

const MAPEL_PAKET_B = [
  { nama: 'Matematika', kode: 'MAT-B', icon: '📐' },
  { nama: 'Bahasa Indonesia', kode: 'BIN-B', icon: '📖' },
  { nama: 'IPA', kode: 'IPA-B', icon: '🔬' },
  { nama: 'IPS', kode: 'IPS-B', icon: '🌍' },
  { nama: 'PKn', kode: 'PKN-B', icon: '🏛️' },
  { nama: 'Pendidikan Agama', kode: 'AGM-B', icon: '🕌' },
  { nama: 'Bahasa Inggris', kode: 'BIG-B', icon: '🇬🇧' },
  { nama: 'Seni Budaya', kode: 'SBD-B', icon: '🎨' },
  { nama: 'PJOK', kode: 'PJK-B', icon: '⚽' },
  { nama: 'Prakarya', kode: 'PRK-B', icon: '✂️' },
];

const MAPEL_PAKET_C = [
  { nama: 'Matematika', kode: 'MAT-C', icon: '📐' },
  { nama: 'Fisika', kode: 'FIS-C', icon: '⚡' },
  { nama: 'Kimia', kode: 'KIM-C', icon: '🧪' },
  { nama: 'Biologi', kode: 'BIO-C', icon: '🌿' },
  { nama: 'Bahasa Indonesia', kode: 'BIN-C', icon: '📖' },
  { nama: 'Bahasa Inggris', kode: 'BIG-C', icon: '🇬🇧' },
  { nama: 'Sejarah', kode: 'SEJ-C', icon: '📜' },
  { nama: 'PKn', kode: 'PKN-C', icon: '🏛️' },
  { nama: 'Ekonomi', kode: 'EKO-C', icon: '💰' },
  { nama: 'Pendidikan Agama', kode: 'AGM-C', icon: '🕌' },
  { nama: 'Sosiologi', kode: 'SOS-C', icon: '👥' },
  { nama: 'Geografi', kode: 'GEO-C', icon: '🗺️' },
];

const ADMIN_DATA = {
  name: 'Administrator PKBM',
  email: 'admin@pkbmmugiasae.sch.id',
  password: 'Admin@123',
};

const GURU_DATA = [
  {
    name: 'Budi Santoso',
    email: 'guru1@pkbmmugiasae.sch.id',
    password: 'Guru@123',
    nip: '1234567890',
    spesialisasi: 'Matematika & IPA',
  },
  {
    name: 'Siti Rahayu',
    email: 'guru2@pkbmmugiasae.sch.id',
    password: 'Guru@123',
    nip: '0987654321',
    spesialisasi: 'Bahasa Indonesia & IPS',
  },
  {
    name: 'Ahmad Fauzan',
    email: 'guru3@pkbmmugiasae.sch.id',
    password: 'Guru@123',
    nip: '1122334455',
    spesialisasi: 'Bahasa Inggris & PKn',
  },
];

const SISWA_DATA = [
  // Paket A (4)
  { name: 'Andi Saputra', paketLevel: 'PAKET_A' },
  { name: 'Dewi Lestari', paketLevel: 'PAKET_A' },
  { name: 'Riko Pratama', paketLevel: 'PAKET_A' },
  { name: 'Yuni Astuti', paketLevel: 'PAKET_A' },
  // Paket B (3)
  { name: 'Hendra Wijaya', paketLevel: 'PAKET_B' },
  { name: 'Rina Kusuma', paketLevel: 'PAKET_B' },
  { name: 'Faisal Arifin', paketLevel: 'PAKET_B' },
  // Paket C (3)
  { name: 'Mega Pertiwi', paketLevel: 'PAKET_C' },
  { name: 'Rizky Ramadhan', paketLevel: 'PAKET_C' },
  { name: 'Sari Indah', paketLevel: 'PAKET_C' },
];

const KELAS_DATA = [
  {
    nama: 'Kelas Paket A - 2025/2026',
    kode: 'KLS-A-2526',
    paketLevel: 'PAKET_A',
    guruIndex: 0, // Budi
    tahunAjaran: '2025/2026',
    semester: 1,
    jadwal: [
      { hari: 'Senin', jamMulai: '08:00', jamSelesai: '10:00', mapel: 'Matematika' },
      { hari: 'Rabu', jamMulai: '08:00', jamSelesai: '10:00', mapel: 'IPA' },
      { hari: 'Jumat', jamMulai: '08:00', jamSelesai: '10:00', mapel: 'Bahasa Indonesia' },
    ],
  },
  {
    nama: 'Kelas Paket B - 2025/2026',
    kode: 'KLS-B-2526',
    paketLevel: 'PAKET_B',
    guruIndex: 1, // Siti
    tahunAjaran: '2025/2026',
    semester: 1,
    jadwal: [
      { hari: 'Selasa', jamMulai: '08:00', jamSelesai: '10:00', mapel: 'Bahasa Indonesia' },
      { hari: 'Kamis', jamMulai: '08:00', jamSelesai: '10:00', mapel: 'IPS' },
      { hari: 'Sabtu', jamMulai: '08:00', jamSelesai: '10:00', mapel: 'PKn' },
    ],
  },
  {
    nama: 'Kelas Paket C - 2025/2026',
    kode: 'KLS-C-2526',
    paketLevel: 'PAKET_C',
    guruIndex: 2, // Ahmad
    tahunAjaran: '2025/2026',
    semester: 1,
    jadwal: [
      { hari: 'Senin', jamMulai: '13:00', jamSelesai: '15:00', mapel: 'Bahasa Inggris' },
      { hari: 'Rabu', jamMulai: '13:00', jamSelesai: '15:00', mapel: 'PKn' },
      { hari: 'Jumat', jamMulai: '13:00', jamSelesai: '15:00', mapel: 'Ekonomi' },
    ],
  },
];

const MATERI_PER_KELAS = {
  PAKET_A: [
    { judul: 'Pengenalan Bilangan Bulat', tipe: 'ARTIKEL', isPublished: true, urutan: 1, deskripsi: 'Materi dasar bilangan bulat untuk Paket A.', konten: 'Bilangan bulat terdiri atas bilangan negatif, nol, dan positif...' },
    { judul: 'Video Pembelajaran Perkalian', tipe: 'VIDEO', isPublished: true, urutan: 2, deskripsi: 'Video penjelasan operasi perkalian.', durasiMenit: 12, linkUrl: 'https://example.com/video/perkalian' },
    { judul: 'Modul IPA: Makhluk Hidup', tipe: 'PDF', isPublished: true, urutan: 3, deskripsi: 'Modul PDF tentang ciri-ciri makhluk hidup.', fileUrl: '/uploads/materi/ipa-makhluk-hidup.pdf' },
    { judul: 'Latihan Bahasa Indonesia', tipe: 'QUIZ', isPublished: true, urutan: 4, deskripsi: 'Kuis singkat membaca pemahaman.', linkUrl: 'https://example.com/quiz/bin-a' },
    { judul: 'Pengenalan Lingkungan Sekitar', tipe: 'ARTIKEL', isPublished: false, urutan: 5, deskripsi: 'Draft materi pengenalan lingkungan.', konten: 'Lingkungan sekitar kita mencakup...' },
  ],
  PAKET_B: [
    { judul: 'Persamaan Linear Satu Variabel', tipe: 'ARTIKEL', isPublished: true, urutan: 1, deskripsi: 'Materi PLSV untuk Paket B.', konten: 'Persamaan linear satu variabel berbentuk ax + b = 0...' },
    { judul: 'Video: Fotosintesis', tipe: 'VIDEO', isPublished: true, urutan: 2, deskripsi: 'Video proses fotosintesis pada tumbuhan.', durasiMenit: 10, linkUrl: 'https://example.com/video/fotosintesis' },
    { judul: 'Modul IPS: Peta dan Atlas', tipe: 'PDF', isPublished: true, urutan: 3, deskripsi: 'Modul peta, atlas, dan globe.', fileUrl: '/uploads/materi/ips-peta-atlas.pdf' },
    { judul: 'Quiz Bahasa Indonesia', tipe: 'QUIZ', isPublished: true, urutan: 4, deskripsi: 'Kuis tata bahasa & EYD.', linkUrl: 'https://example.com/quiz/bin-b' },
    { judul: 'Prakarya: Membuat Kerajinan', tipe: 'ARTIKEL', isPublished: false, urutan: 5, deskripsi: 'Draft materi prakarya kerajinan tangan.', konten: 'Kerajinan tangan dapat dibuat dari bahan...' },
  ],
  PAKET_C: [
    { judul: 'Fungsi Komposisi Matematika', tipe: 'ARTIKEL', isPublished: true, urutan: 1, deskripsi: 'Materi fungsi komposisi.', konten: 'Fungsi komposisi (f o g)(x) = f(g(x))...' },
    { judul: 'Video: Hukum Newton', tipe: 'VIDEO', isPublished: true, urutan: 2, deskripsi: 'Video Hukum Newton I, II, III.', durasiMenit: 15, linkUrl: 'https://example.com/video/newton' },
    { judul: 'Modul Ekonomi Mikro', tipe: 'PDF', isPublished: true, urutan: 3, deskripsi: 'Modul ekonomi mikro dasar.', fileUrl: '/uploads/materi/ekonomi-mikro.pdf' },
    { judul: 'Quiz Bahasa Inggris', tipe: 'QUIZ', isPublished: true, urutan: 4, deskripsi: 'Kuis grammar & vocabulary.', linkUrl: 'https://example.com/quiz/big-c' },
    { judul: 'Geografi: Persebaran Penduduk', tipe: 'ARTIKEL', isPublished: false, urutan: 5, deskripsi: 'Draft materi persebaran penduduk Indonesia.', konten: 'Persebaran penduduk di Indonesia tidak merata...' },
  ],
};

const MAPEL_UTAMA_PER_PAKET = {
  PAKET_A: ['Matematika', 'IPA', 'Bahasa Indonesia'],
  PAKET_B: ['Bahasa Indonesia', 'IPS', 'PKn'],
  PAKET_C: ['Bahasa Inggris', 'PKn', 'Ekonomi'],
};

const FORUM_DATA = {
  PAKET_A: [
    {
      judul: 'Cara mengerjakan soal perkalian bertingkat?',
      konten: 'Halo teman-teman, saya bingung dengan soal perkalian bertingkat di latihan halaman 23, ada yang bisa bantu jelaskan?',
      authorSiswaName: 'Andi Saputra',
      replies: [
        { from: 'siswa', name: 'Dewi Lestari', konten: 'Coba kerjakan dari dalam kurung dulu, baru perkaliannya.' },
        { from: 'guru', konten: 'Ingat urutan operasi: kurung, pangkat, kali/bagi, tambah/kurang. Selamat belajar!' },
      ],
    },
    {
      judul: 'Materi IPA minggu depan tentang apa?',
      konten: 'Pak/Bu, materi IPA minggu depan tema apa ya? Biar saya bisa siap-siap.',
      authorSiswaName: 'Dewi Lestari',
      replies: [
        { from: 'guru', konten: 'Minggu depan kita bahas tentang ciri-ciri makhluk hidup, silakan baca modulnya dulu ya.' },
      ],
    },
  ],
  PAKET_B: [
    {
      judul: 'Bingung dengan persamaan linear, ada yang bisa bantu?',
      konten: 'Saya kesulitan menyelesaikan 3x + 5 = 14. Bagaimana langkah-langkahnya?',
      authorSiswaName: 'Hendra Wijaya',
      replies: [
        { from: 'siswa', name: 'Rina Kusuma', konten: 'Pindahkan 5 ke kanan jadi -5, sehingga 3x = 9, lalu x = 3.' },
        { from: 'siswa', name: 'Faisal Arifin', konten: 'Iya benar, intinya isolasi variabelnya dulu.' },
        { from: 'guru', konten: 'Bagus penjelasannya. Pastikan selalu cek dengan substitusi nilai x kembali ke persamaan.' },
      ],
    },
    {
      judul: 'Link referensi belajar Bahasa Indonesia?',
      konten: 'Mohon rekomendasi link atau buku referensi untuk pendalaman Bahasa Indonesia.',
      authorSiswaName: 'Rina Kusuma',
      replies: [
        { from: 'guru', konten: 'Silakan akses Rumah Belajar Kemdikbud dan modul resmi Paket B yang sudah saya unggah di kelas. Itu sudah lengkap untuk pendalaman.', isBestAnswer: true },
      ],
    },
  ],
  PAKET_C: [
    {
      judul: 'Soal fungsi komposisi di buku halaman berapa?',
      konten: 'Pak, saya mau latihan fungsi komposisi. Bisa info halaman berapa di buku paket?',
      authorSiswaName: 'Mega Pertiwi',
      replies: [
        { from: 'siswa', name: 'Rizky Ramadhan', konten: 'Setau saya halaman 45-48.' },
        { from: 'guru', konten: 'Betul, halaman 45-48 dan latihan tambahan di halaman 52.' },
      ],
    },
    {
      judul: 'Request materi Ekonomi tentang inflasi',
      konten: 'Mohon ditambahkan materi tentang inflasi & deflasi, terima kasih.',
      authorSiswaName: 'Rizky Ramadhan',
      replies: [
        { from: 'guru', konten: 'Baik, akan saya unggah modul inflasi minggu depan ya.' },
      ],
    },
  ],
};

// =============================================================
// Main seed
// =============================================================

async function main() {
  console.log('🌱 Memulai seed database PKBM MUGI SAE...');

  // Bersihkan data lama (urutan terbalik dari dependency)
  console.log('🧹 Membersihkan data lama...');
  await prisma.notifikasi.deleteMany();
  await prisma.forumReply.deleteMany();
  await prisma.forum.deleteMany();
  await prisma.pengumuman.deleteMany();
  await prisma.nilai.deleteMany();
  await prisma.presensi.deleteMany();
  await prisma.pengumpulan.deleteMany();
  await prisma.tugas.deleteMany();
  await prisma.materi.deleteMany();
  await prisma.kelasAnggota.deleteMany();
  await prisma.kelas.deleteMany();
  await prisma.siswa.deleteMany();
  await prisma.guru.deleteMany();
  await prisma.mataPelajaran.deleteMany();
  await prisma.paket.deleteMany();
  await prisma.user.deleteMany();
  await prisma.pengaturan.deleteMany();

  // ----- PENGATURAN -----
  await prisma.pengaturan.createMany({ data: PENGATURAN });
  console.log(`✅ Pengaturan berhasil dibuat (${PENGATURAN.length} record)`);

  // ----- PAKET -----
  await prisma.paket.createMany({ data: PAKET_DATA });
  const paketList = await prisma.paket.findMany();
  const paketByLevel = Object.fromEntries(paketList.map((p) => [p.level, p]));
  console.log(`✅ Paket berhasil dibuat (${paketList.length} record)`);

  // ----- MATA PELAJARAN -----
  const mapelData = [
    ...MAPEL_PAKET_A.map((m) => ({
      nama: m.nama,
      kode: m.kode,
      icon: m.icon,
      deskripsi: `Mata pelajaran ${m.nama} untuk Paket A`,
      paketId: paketByLevel.PAKET_A.id,
    })),
    ...MAPEL_PAKET_B.map((m) => ({
      nama: m.nama,
      kode: m.kode,
      icon: m.icon,
      deskripsi: `Mata pelajaran ${m.nama} untuk Paket B`,
      paketId: paketByLevel.PAKET_B.id,
    })),
    ...MAPEL_PAKET_C.map((m) => ({
      nama: m.nama,
      kode: m.kode,
      icon: m.icon,
      deskripsi: `Mata pelajaran ${m.nama} untuk Paket C`,
      paketId: paketByLevel.PAKET_C.id,
    })),
  ];
  await prisma.mataPelajaran.createMany({ data: mapelData });
  const allMapel = await prisma.mataPelajaran.findMany();
  console.log(`✅ Mata pelajaran berhasil dibuat (${allMapel.length} record)`);

  // ----- USERS -----
  const adminPwd = await hash(ADMIN_DATA.password);
  const adminUser = await prisma.user.create({
    data: {
      name: ADMIN_DATA.name,
      email: ADMIN_DATA.email,
      password: adminPwd,
      role: 'ADMIN',
      phone: '081234567890',
      address: 'Jl. Pendidikan No. 12, Semarang',
    },
  });

  const guruUsers = [];
  for (const g of GURU_DATA) {
    const pwd = await hash(g.password);
    const u = await prisma.user.create({
      data: {
        name: g.name,
        email: g.email,
        password: pwd,
        role: 'GURU',
        phone: `0812${randInt(10000000, 99999999)}`,
        address: 'Semarang, Jawa Tengah',
      },
    });
    guruUsers.push({ user: u, meta: g });
  }

  const siswaUsers = [];
  for (let i = 0; i < SISWA_DATA.length; i += 1) {
    const s = SISWA_DATA[i];
    const pwd = await hash('Siswa@123');
    const u = await prisma.user.create({
      data: {
        name: s.name,
        email: `siswa${i + 1}@pkbmmugiasae.sch.id`,
        password: pwd,
        role: 'SISWA',
        phone: `0813${randInt(10000000, 99999999)}`,
        address: 'Semarang, Jawa Tengah',
      },
    });
    siswaUsers.push({ user: u, meta: s });
  }

  console.log(`✅ User berhasil dibuat (1 admin, ${guruUsers.length} guru, ${siswaUsers.length} siswa)`);

  // ----- GURU PROFILES -----
  const guruProfiles = [];
  for (const gu of guruUsers) {
    const guru = await prisma.guru.create({
      data: {
        userId: gu.user.id,
        nip: gu.meta.nip,
        spesialisasi: gu.meta.spesialisasi,
      },
    });
    guruProfiles.push({ ...gu, guru });
  }
  console.log(`✅ Profil Guru berhasil dibuat (${guruProfiles.length} record)`);

  // ----- SISWA PROFILES -----
  const siswaProfiles = [];
  for (const su of siswaUsers) {
    const siswa = await prisma.siswa.create({
      data: {
        userId: su.user.id,
        nisn: generateNISN(),
        paketId: paketByLevel[su.meta.paketLevel].id,
        tahunMasuk: 2025,
        status: 'AKTIF',
      },
    });
    siswaProfiles.push({ ...su, siswa });
  }
  console.log(`✅ Profil Siswa berhasil dibuat (${siswaProfiles.length} record)`);

  // ----- KELAS -----
  const kelasList = [];
  for (const k of KELAS_DATA) {
    const guruProfile = guruProfiles[k.guruIndex];
    const kelas = await prisma.kelas.create({
      data: {
        nama: k.nama,
        kode: k.kode,
        paketId: paketByLevel[k.paketLevel].id,
        guruId: guruProfile.guru.id,
        tahunAjaran: k.tahunAjaran,
        semester: k.semester,
        isAktif: true,
        jadwal: k.jadwal,
      },
    });
    kelasList.push({ ...k, kelas, guruProfile });
  }
  console.log(`✅ Kelas berhasil dibuat (${kelasList.length} record)`);

  // ----- KELAS ANGGOTA -----
  const kelasAnggotaData = [];
  for (const kInfo of kelasList) {
    const anggota = siswaProfiles.filter((s) => s.meta.paketLevel === kInfo.paketLevel);
    for (const sp of anggota) {
      kelasAnggotaData.push({
        kelasId: kInfo.kelas.id,
        siswaId: sp.siswa.id,
        tanggalGabung: daysAgo(45),
      });
    }
  }
  await prisma.kelasAnggota.createMany({ data: kelasAnggotaData });
  console.log(`✅ Kelas Anggota berhasil dibuat (${kelasAnggotaData.length} record)`);

  // ----- MATERI -----
  const materiData = [];
  for (const kInfo of kelasList) {
    const items = MATERI_PER_KELAS[kInfo.paketLevel];
    for (const m of items) {
      materiData.push({
        judul: m.judul,
        deskripsi: m.deskripsi || null,
        konten: m.konten || null,
        tipe: m.tipe,
        fileUrl: m.fileUrl || null,
        linkUrl: m.linkUrl || null,
        thumbnail: null,
        kelasId: kInfo.kelas.id,
        guruId: kInfo.guruProfile.guru.id,
        urutan: m.urutan,
        isPublished: m.isPublished,
        durasiMenit: m.durasiMenit || null,
      });
    }
  }
  await prisma.materi.createMany({ data: materiData });
  console.log(`✅ Materi berhasil dibuat (${materiData.length} record)`);

  // ----- TUGAS -----
  // Sengaja tidak pakai createMany agar gampang ambil id untuk pengumpulan & nilai
  const tugasInfo = []; // { kelasInfo, mapelUtama: [string], tugas1, tugas2, tugas3 }
  for (const kInfo of kelasList) {
    const mapels = MAPEL_UTAMA_PER_PAKET[kInfo.paketLevel];
    const mapelForTugas = mapels[0]; // ambil mapel pertama untuk judul

    const t1 = await prisma.tugas.create({
      data: {
        judul: `Tugas Latihan ${mapelForTugas}`,
        deskripsi: `Latihan dasar ${mapelForTugas} untuk ${kInfo.nama}.`,
        kelasId: kInfo.kelas.id,
        guruId: kInfo.guruProfile.guru.id,
        deadline: daysAgo(14),
        nilaiMaksimum: 100,
        isAktif: false,
      },
    });
    const t2 = await prisma.tugas.create({
      data: {
        judul: `Tugas Tengah Semester ${mapelForTugas}`,
        deskripsi: `Tugas pertengahan semester ${mapelForTugas}.`,
        kelasId: kInfo.kelas.id,
        guruId: kInfo.guruProfile.guru.id,
        deadline: daysFromNow(7),
        nilaiMaksimum: 100,
        isAktif: true,
      },
    });
    const t3 = await prisma.tugas.create({
      data: {
        judul: `Tugas Proyek Akhir ${mapelForTugas}`,
        deskripsi: `Proyek akhir semester ${mapelForTugas}.`,
        kelasId: kInfo.kelas.id,
        guruId: kInfo.guruProfile.guru.id,
        deadline: daysFromNow(21),
        nilaiMaksimum: 100,
        isAktif: true,
      },
    });

    tugasInfo.push({ kInfo, mapels, mapelForTugas, t1, t2, t3 });
  }
  console.log(`✅ Tugas berhasil dibuat (${tugasInfo.length * 3} record)`);

  // ----- PENGUMPULAN -----
  const pengumpulanData = [];
  // Untuk setiap kelas: simpan rata-rata nilai T1 per siswa untuk dipakai di Nilai
  const nilaiTugasPerSiswa = new Map(); // key: siswaId -> avg

  for (const ti of tugasInfo) {
    const anggota = siswaProfiles.filter((s) => s.meta.paketLevel === ti.kInfo.paketLevel);

    // T1: semua mengumpulkan & dinilai
    for (const sp of anggota) {
      const nilai = randInt(70, 95);
      pengumpulanData.push({
        tugasId: ti.t1.id,
        siswaId: sp.siswa.id,
        fileUrl: `/uploads/tugas/${sp.siswa.id}-t1.pdf`,
        linkUrl: null,
        catatan: 'Tugas dikumpulkan tepat waktu.',
        nilaiAkhir: nilai,
        feedback: 'Bagus! Pertahankan ya.',
        submittedAt: daysAgo(15),
        gradedAt: daysAgo(13),
      });
      nilaiTugasPerSiswa.set(sp.siswa.id, nilai);
    }

    // T2: 50% mengumpulkan, belum dinilai
    const submitterCount = Math.ceil(anggota.length / 2);
    for (let i = 0; i < submitterCount; i += 1) {
      const sp = anggota[i];
      pengumpulanData.push({
        tugasId: ti.t2.id,
        siswaId: sp.siswa.id,
        fileUrl: `/uploads/tugas/${sp.siswa.id}-t2.pdf`,
        linkUrl: null,
        catatan: 'Pengumpulan tugas tengah semester.',
        nilaiAkhir: null,
        feedback: null,
        submittedAt: daysAgo(1),
        gradedAt: null,
      });
    }

    // T3: belum ada pengumpulan
  }
  await prisma.pengumpulan.createMany({ data: pengumpulanData });
  console.log(`✅ Pengumpulan berhasil dibuat (${pengumpulanData.length} record)`);

  // ----- PRESENSI -----
  const presensiData = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let offset = 14; offset >= 1; offset -= 1) {
    const tgl = new Date(today);
    tgl.setDate(tgl.getDate() - offset);
    if (tgl.getDay() === 0) continue; // skip Minggu

    for (const kInfo of kelasList) {
      const anggota = siswaProfiles.filter((s) => s.meta.paketLevel === kInfo.paketLevel);
      for (const sp of anggota) {
        const status = weighted([
          { value: 'HADIR', weight: 80 },
          { value: 'IZIN', weight: 10 },
          { value: 'SAKIT', weight: 5 },
          { value: 'ALPHA', weight: 5 },
        ]);
        let keterangan = null;
        if (status === 'IZIN') keterangan = 'Izin keperluan keluarga';
        if (status === 'SAKIT') keterangan = 'Surat keterangan dokter';

        presensiData.push({
          kelasId: kInfo.kelas.id,
          siswaId: sp.siswa.id,
          tanggal: new Date(tgl),
          status,
          keterangan,
          isLocked: offset > 7,
        });
      }
    }
  }
  await prisma.presensi.createMany({ data: presensiData });
  console.log(`✅ Presensi berhasil dibuat (${presensiData.length} record)`);

  // ----- NILAI -----
  const nilaiData = [];
  for (const kInfo of kelasList) {
    const anggota = siswaProfiles.filter((s) => s.meta.paketLevel === kInfo.paketLevel);
    const mapelNamaList = MAPEL_UTAMA_PER_PAKET[kInfo.paketLevel];
    const mapelObjs = allMapel.filter(
      (mp) => mp.paketId === paketByLevel[kInfo.paketLevel].id && mapelNamaList.includes(mp.nama),
    );

    for (const sp of anggota) {
      for (const mp of mapelObjs) {
        const nTugas = nilaiTugasPerSiswa.get(sp.siswa.id) || randInt(70, 90);
        const nUTS = randInt(65, 90);
        const nUAS = null;
        // Rumus: bila UAS null, hitung (Tugas*0.4 + UTS*0.3); UAS digabung saat ada
        const nAkhir = Number((nTugas * 0.4 + nUTS * 0.3).toFixed(2));
        nilaiData.push({
          siswaId: sp.siswa.id,
          mataPelajaranId: mp.id,
          kelasId: kInfo.kelas.id,
          nilaiTugas: nTugas,
          nilaiUTS: nUTS,
          nilaiUAS: nUAS,
          nilaiAkhir: nAkhir,
          semester: 1,
          tahunAjaran: '2025/2026',
        });
      }
    }
  }
  await prisma.nilai.createMany({ data: nilaiData });
  console.log(`✅ Nilai berhasil dibuat (${nilaiData.length} record)`);

  // ----- PENGUMUMAN -----
  const pengumumanData = [
    {
      judul: 'Selamat Datang di PKBM MUGI SAE Online!',
      konten:
        'Selamat datang di portal pembelajaran online PKBM MUGI SAE. Silakan eksplorasi fitur-fitur yang tersedia untuk mendukung kegiatan belajar Anda.',
      target: 'ALL',
      authorId: adminUser.id,
      isPublished: true,
      publishedAt: daysAgo(30),
      viewCount: 124,
    },
    {
      judul: 'Jadwal Ujian Tengah Semester Ganjil 2025/2026',
      konten:
        'Ujian Tengah Semester akan dilaksanakan mulai 4 November 2025. Mohon semua peserta didik mempersiapkan diri dengan baik.',
      target: 'ALL',
      authorId: adminUser.id,
      isPublished: true,
      publishedAt: daysAgo(7),
      viewCount: 88,
    },
    {
      judul: 'Panduan Upload Tugas untuk Siswa',
      konten:
        'Untuk mengunggah tugas, silakan masuk ke menu Tugas, pilih tugas yang aktif, lalu klik tombol Upload. Format file yang diterima: PDF, DOCX.',
      target: 'SISWA',
      authorId: adminUser.id,
      isPublished: true,
      publishedAt: daysAgo(5),
      viewCount: 56,
    },
    {
      judul: 'Rapat Koordinasi Guru Bulan Oktober',
      konten:
        'Diberitahukan kepada seluruh guru untuk hadir pada rapat koordinasi pada hari Sabtu pukul 09.00 di ruang rapat utama.',
      target: 'GURU',
      authorId: adminUser.id,
      isPublished: true,
      publishedAt: daysAgo(3),
      viewCount: 12,
    },
    {
      judul: 'Pengumuman Penerimaan Siswa Baru Paket A',
      konten:
        'Pendaftaran siswa baru Paket A periode 2025/2026 akan dibuka segera. Informasi lebih lanjut akan diumumkan kemudian.',
      target: 'PAKET_A',
      authorId: adminUser.id,
      isPublished: false,
      publishedAt: null,
      viewCount: 0,
    },
  ];
  await prisma.pengumuman.createMany({ data: pengumumanData });
  console.log(`✅ Pengumuman berhasil dibuat (${pengumumanData.length} record)`);

  // ----- FORUM & FORUM REPLY -----
  let forumCount = 0;
  let replyCount = 0;
  for (const kInfo of kelasList) {
    const threads = FORUM_DATA[kInfo.paketLevel];
    for (const t of threads) {
      const authorSiswa = siswaProfiles.find((s) => s.meta.name === t.authorSiswaName);
      if (!authorSiswa) continue;

      const forum = await prisma.forum.create({
        data: {
          judul: t.judul,
          konten: t.konten,
          kelasId: kInfo.kelas.id,
          authorId: authorSiswa.user.id,
          isPinned: false,
          viewCount: randInt(5, 40),
        },
      });
      forumCount += 1;

      for (const r of t.replies) {
        let authorId;
        if (r.from === 'guru') {
          authorId = kInfo.guruProfile.user.id;
        } else {
          const sp = siswaProfiles.find((s) => s.meta.name === r.name);
          authorId = sp ? sp.user.id : authorSiswa.user.id;
        }
        await prisma.forumReply.create({
          data: {
            forumId: forum.id,
            authorId,
            konten: r.konten,
            isBestAnswer: !!r.isBestAnswer,
            likeCount: randInt(0, 5),
          },
        });
        replyCount += 1;
      }
    }
  }
  console.log(`✅ Forum berhasil dibuat (${forumCount} thread, ${replyCount} reply)`);

  // ----- NOTIFIKASI -----
  const notifData = [];

  // Admin
  notifData.push(
    {
      userId: adminUser.id,
      judul: 'Pendaftaran Siswa Baru',
      pesan: 'Ada 3 calon siswa baru yang menunggu verifikasi pendaftaran.',
      tipe: 'INFO',
      isRead: false,
      link: '/admin/siswa',
    },
    {
      userId: adminUser.id,
      judul: 'Tugas Belum Dinilai',
      pesan: 'Terdapat beberapa tugas yang belum dinilai oleh guru pengampu.',
      tipe: 'TUGAS',
      isRead: false,
      link: '/admin/tugas',
    },
    {
      userId: adminUser.id,
      judul: 'Laporan Mingguan',
      pesan: 'Laporan kehadiran mingguan sudah tersedia.',
      tipe: 'PRESENSI',
      isRead: true,
      link: '/admin/laporan',
      readAt: daysAgo(2),
    },
  );

  // Guru
  for (const gp of guruProfiles) {
    notifData.push(
      {
        userId: gp.user.id,
        judul: 'Tugas Baru Dikumpulkan',
        pesan: 'Beberapa siswa telah mengumpulkan tugas tengah semester.',
        tipe: 'TUGAS',
        isRead: false,
        link: '/guru/tugas',
      },
      {
        userId: gp.user.id,
        judul: 'Pertanyaan Baru di Forum',
        pesan: 'Ada pertanyaan baru di forum kelas Anda.',
        tipe: 'FORUM',
        isRead: false,
        link: '/guru/forum',
      },
      {
        userId: gp.user.id,
        judul: 'Pengumuman: Rapat Koordinasi',
        pesan: 'Rapat koordinasi guru bulan Oktober.',
        tipe: 'PENGUMUMAN',
        isRead: true,
        link: '/guru/pengumuman',
        readAt: daysAgo(2),
      },
    );
  }

  // Siswa
  for (const sp of siswaProfiles) {
    notifData.push(
      {
        userId: sp.user.id,
        judul: 'Tugas Baru Tersedia',
        pesan: 'Tugas tengah semester telah dipublikasikan oleh guru.',
        tipe: 'TUGAS',
        isRead: false,
        link: '/siswa/tugas',
      },
      {
        userId: sp.user.id,
        judul: 'Tugas Anda Sudah Dinilai',
        pesan: 'Nilai untuk tugas latihan Anda telah dipublikasikan.',
        tipe: 'NILAI',
        isRead: false,
        link: '/siswa/nilai',
      },
      {
        userId: sp.user.id,
        judul: 'Pengumuman Baru',
        pesan: 'Panduan upload tugas untuk siswa telah dirilis.',
        tipe: 'PENGUMUMAN',
        isRead: true,
        link: '/siswa/pengumuman',
        readAt: daysAgo(1),
      },
    );
  }

  await prisma.notifikasi.createMany({ data: notifData });
  console.log(`✅ Notifikasi berhasil dibuat (${notifData.length} record)`);

  // =============================
  // Summary
  // =============================
  const summary = {
    Pengaturan: await prisma.pengaturan.count(),
    Paket: await prisma.paket.count(),
    MataPelajaran: await prisma.mataPelajaran.count(),
    User: await prisma.user.count(),
    Guru: await prisma.guru.count(),
    Siswa: await prisma.siswa.count(),
    Kelas: await prisma.kelas.count(),
    KelasAnggota: await prisma.kelasAnggota.count(),
    Materi: await prisma.materi.count(),
    Tugas: await prisma.tugas.count(),
    Pengumpulan: await prisma.pengumpulan.count(),
    Presensi: await prisma.presensi.count(),
    Nilai: await prisma.nilai.count(),
    Pengumuman: await prisma.pengumuman.count(),
    Forum: await prisma.forum.count(),
    ForumReply: await prisma.forumReply.count(),
    Notifikasi: await prisma.notifikasi.count(),
  };

  console.log('\n📊 SUMMARY SEED DATA:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  for (const [k, v] of Object.entries(summary)) {
    console.log(`  ${k.padEnd(18, ' ')}: ${v} record`);
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n🔐 Kredensial Login:');
  console.log(`  Admin : ${ADMIN_DATA.email} / ${ADMIN_DATA.password}`);
  console.log(`  Guru  : guru1@pkbmmugiasae.sch.id / Guru@123 (juga guru2, guru3)`);
  console.log(`  Siswa : siswa1@pkbmmugiasae.sch.id / Siswa@123 (sampai siswa10)`);
  console.log('\n✅ Seed selesai dengan sukses!');
}

main()
  .catch((e) => {
    console.error('❌ Error saat menjalankan seed:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
