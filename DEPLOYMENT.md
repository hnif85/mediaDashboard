# Deployment Guide untuk Telegram Analyzer di Vercel

## Prerequisites
- Akun Vercel (https://vercel.com)
- Vercel CLI terinstall (`npm install -g vercel`)
- Environment variables yang diperlukan

## Environment Variables

Set environment variables berikut di Vercel dashboard:

### Database (Required)
```
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Telegram API (Optional - jika menggunakan fitur Telegram)
```
TELEGRAM_API_ID=your_api_id
TELEGRAM_API_HASH=your_api_hash
TELEGRAM_SESSION=your_session_string
```

### AI Services (Optional - jika menggunakan analisis AI)
```
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
```

## Deployment Steps

### 1. Install Dependencies
```bash
yarn install:all
```

### 2. Build untuk Production
```bash
yarn build:vercel
```

### 3. Deploy ke Vercel
```bash
# Untuk preview deployment
yarn vercel:dev

# Untuk production deployment
yarn vercel:deploy
```

Atau deploy melalui Vercel dashboard:
- Connect repository GitHub/GitLab
- Set build command: `yarn build:vercel`
- Set output directory: `frontend/dist`

## Struktur Deployment

### Frontend (Static)
- Dibuild menggunakan Vite
- Output: `frontend/dist`
- Dilayani sebagai static files

### Backend (Serverless Functions)
- API routes: `/api/*`
- Implementasi: `api/telegram.js`
- Runtime: Node.js

## Testing Deployment

Setelah deploy, test endpoints berikut:

1. **Health Check**: `GET /api/health`
2. **API Root**: `GET /api/`
3. **Frontend**: `GET /`

## Troubleshooting

### Error: Environment variables not found
- Pastikan semua required environment variables sudah diset di Vercel dashboard
- Check spelling dan case sensitivity

### Error: API routes not working
- Pastikan build command menggunakan `yarn build:vercel`
- Check Vercel Functions logs di dashboard

### Error: CORS issues
- Backend sudah dikonfigurasi untuk mengizinkan origin Vercel
- Pastikan frontend menggunakan relative paths untuk API calls

### Build fails
- Check node version compatibility
- Pastikan semua dependencies terinstall dengan benar

## Development vs Production

### Development
- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- API calls di-proxy ke backend

### Production  
- Frontend: https://your-app.vercel.app
- Backend: https://your-app.vercel.app/api
- API calls langsung ke relative path `/api`

## Performance Notes
- API functions memiliki timeout 30 detik
- Gunakan caching untuk data yang tidak sering berubah
- Optimize bundle size dengan code splitting