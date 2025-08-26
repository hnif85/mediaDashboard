# Telegram Channel Analyzer Dashboard

Dashboard untuk menganalisis legitimasi dan engagement channel Telegram menggunakan AI.

## Fitur Utama

### 1. Analisis Channel Telegram
- Input berupa link channel Telegram (https://t.me/channelname)
- Mengambil data channel menggunakan RapidAPI Telegram
- Analisis otomatis menggunakan AI (OpenAI GPT-4)

### 2. Dashboard Visualisasi
- Statistik total analisis dan trust score rata-rata
- Chart distribusi rating (Legit/Doubtful/Scam Risk)
- Chart indikator scam terbanyak
- Tabel analisis terbaru

### 3. Laporan dan Export
- Filter berdasarkan rating
- Export laporan dalam format CSV
- Pagination untuk data besar

### 4. Detail Analisis
- Profile check (bio consistency, external links, owner contact)
- Content check (relevance, activity level, engagement metrics)
- Cross check (official references, inconsistencies)
- Scam indicators detection
- Trust score (0-100) dan rating final

## Tech Stack
- **Frontend**: React 18 + Vite + Tailwind CSS + Chart.js
- **Backend**: Node.js + Express + Joi validation
- **Database**: Supabase (PostgreSQL)
- **AI Analysis**: OpenAI GPT-4
- **API**: RapidAPI Telegram Channel API
- **Charts**: Chart.js + react-chartjs-2
- **Package Manager**: Yarn dengan Workspaces

## Struktur Project
```
telegram-analyzer/
├── frontend/                 # React dashboard
│   ├── src/
│   │   ├── App.jsx          # Main app dengan routing
│   │   ├── main.jsx         # Entry point
│   │   └── index.css        # Tailwind styles
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── backend/                  # Express API server
│   ├── routes/
│   │   ├── telegram.js      # Telegram API endpoints
│   │   ├── analysis.js      # Analysis endpoints
│   │   └── reports.js       # Reports & stats endpoints
│   ├── services/
│   │   ├── telegramService.js # Telegram API integration
│   │   └── aiService.js     # OpenAI integration
│   ├── config/
│   │   └── supabase.js      # Supabase client
│   ├── server.js            # Express server
│   ├── package.json
│   └── .env.example
├── database/
│   └── schema.sql           # Supabase database schema
├── package.json             # Root package.json
└── README.md
```

## Setup dan Instalasi

### 1. Prerequisites
Pastikan Yarn sudah terinstall:
```bash
# Install Yarn jika belum ada
npm install -g yarn

# Atau menggunakan corepack (Node.js 16.10+)
corepack enable
```

### 2. Clone Repository
```bash
git clone <repository-url>
cd telegram-analyzer
```

### 3. Install Dependencies
```bash
# Install semua dependencies menggunakan yarn workspaces
yarn install

# Dependencies akan otomatis terinstall untuk semua workspace (backend & frontend)
```

### 4. Setup Environment Variables

#### Backend (.env)
Copy `backend/.env.example` ke `backend/.env` dan isi:
```env
PORT=3001
NODE_ENV=development

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# RapidAPI Telegram
RAPIDAPI_KEY=your_rapidapi_key
RAPIDAPI_HOST=telegram-channel.p.rapidapi.com

# OpenAI
OPENAI_API_KEY=your_openai_api_key
```

### 5. Setup Database
1. Buat project baru di [Supabase](https://supabase.com)
2. Jalankan SQL schema dari `database/schema.sql`
3. Update environment variables dengan URL dan key Supabase

### 6. Setup API Keys
1. **RapidAPI**: Daftar di [RapidAPI](https://rapidapi.com) dan subscribe ke Telegram Channel API
2. **OpenAI**: Dapatkan API key dari [OpenAI Platform](https://platform.openai.com)

### 7. Jalankan Aplikasi
```bash
# Development mode (backend + frontend bersamaan)
yarn dev

# Atau jalankan terpisah
yarn dev:backend  # Backend di port 3001
yarn dev:frontend # Frontend di port 5173

# Atau jalankan langsung dari workspace
yarn workspace backend dev
yarn workspace frontend dev
```

### 8. Build untuk Production
```bash
yarn build
```

## API Endpoints

### Telegram API
- `POST /api/telegram/info` - Get channel info
- `POST /api/telegram/messages` - Get channel messages
- `POST /api/telegram/complete` - Get complete channel data

### Analysis API
- `POST /api/analysis/analyze` - Analyze channel
- `GET /api/analysis/:id` - Get analysis by ID
- `GET /api/analysis` - Get all analyses (with pagination)

### Reports API
- `GET /api/reports/stats` - Get dashboard statistics
- `GET /api/reports/csv` - Export CSV report

## Database Schema

### Table: channel_analyses
- `id` - Primary key
- `channel_name` - Nama channel
- `channel_link` - Link channel
- `channel_info` - Info channel (JSON)
- `messages` - Messages data (JSON)
- `analysis_result` - Hasil analisis AI (JSON)
- `created_at` - Timestamp

### Views
- `channel_analysis_summary` - Summary untuk reporting
- `dashboard_stats` - Statistik untuk dashboard

## Yarn Workspaces

Project ini menggunakan Yarn Workspaces untuk mengelola dependencies:

### Commands Berguna
```bash
# Install dependencies untuk semua workspace
yarn install

# Jalankan script di workspace tertentu
yarn workspace backend dev
yarn workspace frontend build

# Add dependency ke workspace tertentu
yarn workspace backend add express
yarn workspace frontend add react

# Add dev dependency
yarn workspace backend add -D nodemon
yarn workspace frontend add -D vite

# Remove dependency
yarn workspace backend remove express
yarn workspace frontend remove react
```

### Struktur Workspaces
- `backend/` - Express API server
- `frontend/` - React dashboard

## Cara Penggunaan

### 1. Analisis Channel Baru
1. Buka halaman "Analyze Channel"
2. Masukkan link Telegram channel (contoh: https://t.me/telegram)
3. Klik "Analyze" dan tunggu proses selesai
4. Lihat hasil analisis lengkap

### 2. Lihat Dashboard
1. Dashboard menampilkan statistik keseluruhan
2. Chart distribusi rating dan scam indicators
3. Tabel analisis terbaru

### 3. Export Laporan
1. Buka halaman "Reports"
2. Filter berdasarkan rating jika diperlukan
3. Klik "Export CSV" untuk download laporan

## Troubleshooting

### Error: Missing environment variables
- Pastikan file `.env` ada di folder `backend/`
- Periksa semua environment variables sudah diisi

### Error: Supabase connection failed
- Periksa SUPABASE_URL dan SUPABASE_ANON_KEY
- Pastikan database schema sudah dijalankan

### Error: RapidAPI rate limit
- Periksa quota RapidAPI subscription
- Tunggu beberapa saat sebelum mencoba lagi

### Error: OpenAI API failed
- Periksa OPENAI_API_KEY valid
- Pastikan ada credit di akun OpenAI

## Kontribusi
1. Fork repository
2. Buat feature branch
3. Commit changes
4. Push ke branch
5. Buat Pull Request

## License
MIT License