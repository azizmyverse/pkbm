# PKBM MUGI SAE — LMS

Web Learning Management System untuk **PKBM MUGI SAE**, lembaga pendidikan kesetaraan
di Indonesia yang menyelenggarakan program **Paket A** (setara SD), **Paket B** (setara SMP),
dan **Paket C** (setara SMA).

> Repo ini sedang dalam pengembangan. **Tahap 1** mencakup foundation: struktur folder,
> skema database (Prisma), seed data, konfigurasi Docker, dan environment variables.

---

## 🛠️ Tech Stack

**Backend**
- Node.js + Express.js
- PostgreSQL 16 + Prisma ORM 5.x
- JWT (jsonwebtoken) + bcryptjs
- Multer, Nodemailer, express-rate-limit, helmet, cors, morgan, dotenv

**Frontend**
- React 18 + Vite 5
- TailwindCSS v3 + shadcn/ui
- Zustand, Axios, React Router v6
- Recharts, react-hot-toast, Lucide React, Quill

**DevOps**
- Docker Compose (postgres, backend, frontend, pgadmin)

---

## 🚀 Quick Start

### 1. Prasyarat

- Node.js >= 18
- Docker & Docker Compose
- (opsional) `pnpm` atau `npm`

### 2. Setup Environment

```bash
cp .env.example .env
# Edit .env sesuai kebutuhan (terutama JWT_SECRET, JWT_REFRESH_SECRET,
# kredensial SMTP, dan kredensial database)
```

### 3. Jalankan dengan Docker Compose

```bash
# Database + backend + frontend
docker compose up -d

# Tambahkan pgAdmin (opsional)
docker compose --profile tools up -d pgadmin
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- pgAdmin: http://localhost:5050

### 4. Setup Database (manual / lokal)

```bash
cd backend
npm install
npx prisma migrate dev --name init
npm run db:seed
```

---

## 🔐 Akun Demo (setelah seed)

| Role  | Email                            | Password  |
| ----- | -------------------------------- | --------- |
| Admin | `admin@pkbmmugiasae.sch.id`      | `Admin@123` |
| Guru  | `guru1@pkbmmugiasae.sch.id` (juga `guru2`, `guru3`) | `Guru@123` |
| Siswa | `siswa1@pkbmmugiasae.sch.id` ... `siswa10@pkbmmugiasae.sch.id` | `Siswa@123` |

---

## 📁 Struktur Project

```
pkbm-mugi-sae/
├── frontend/                # React + Vite + Tailwind
│   ├── public/
│   └── src/
│       ├── components/      # ui/, shared/, admin/, guru/, siswa/
│       ├── pages/           # auth/, admin/, guru/, siswa/
│       ├── hooks/
│       ├── store/
│       └── lib/
├── backend/                 # Express + Prisma
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middlewares/
│   │   ├── services/
│   │   └── utils/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js
│   └── uploads/
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 📜 Roadmap

- [x] **Tahap 1** — Foundation (folder structure, schema, seed, docker, env)
- [ ] Tahap 2 — Auth (JWT + refresh token), middleware, role-based access
- [ ] Tahap 3 — CRUD Admin (user, paket, mapel, kelas, pengaturan)
- [ ] Tahap 4 — Modul Guru (materi, tugas, presensi, nilai, forum)
- [ ] Tahap 5 — Modul Siswa (materi, pengumpulan tugas, nilai, forum)
- [ ] Tahap 6 — Notifikasi, pengumuman, email
- [ ] Tahap 7 — Dashboard + chart (Recharts)
- [ ] Tahap 8 — Polish, testing, deployment
