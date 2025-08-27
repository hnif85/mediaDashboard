const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Starting build process for Vercel deployment...');

// Copy environment variables if they exist
try {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    console.log('📋 Copying .env file...');
    const envContent = fs.readFileSync(envPath, 'utf8');
    // Filter out comments and empty lines
    const filteredEnv = envContent
      .split('\n')
      .filter(line => line.trim() && !line.trim().startsWith('#'))
      .join('\n');
    
    fs.writeFileSync(path.join(__dirname, 'api', '.env'), filteredEnv);
    console.log('✅ .env file copied to api directory');
  } else {
    console.log('⚠️  No .env file found, using Vercel environment variables');
  }
} catch (error) {
  console.warn('⚠️  Could not copy .env file:', error.message);
}

// Install dependencies for API
console.log('📦 Installing API dependencies...');
try {
  execSync('cd api && npm install', { stdio: 'inherit' });
  console.log('✅ API dependencies installed');
} catch (error) {
  console.error('❌ Failed to install API dependencies:', error.message);
  process.exit(1);
}

// Build frontend
console.log('🏗️  Building frontend...');
try {
  execSync('cd frontend && npm run build', { stdio: 'inherit' });
  console.log('✅ Frontend built successfully');
} catch (error) {
  console.error('❌ Frontend build failed:', error.message);
  process.exit(1);
}

console.log('🎉 Build process completed successfully!');
console.log('📋 Next steps:');
console.log('1. Set environment variables in Vercel dashboard');
console.log('2. Run: vercel --prod');