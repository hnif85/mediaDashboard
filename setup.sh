#!/bin/bash

echo "🚀 Setting up Telegram Channel Analyzer with Yarn..."

# Check if yarn is installed
if ! command -v yarn &> /dev/null; then
    echo "❌ Yarn is not installed. Please install Yarn first:"
    echo "   npm install -g yarn"
    echo "   or use corepack: corepack enable"
    exit 1
fi

echo "✅ Yarn found: $(yarn --version)"

# Install dependencies
echo "📦 Installing dependencies..."
yarn install

# Copy environment file
if [ ! -f "backend/.env" ]; then
    echo "📝 Creating environment file..."
    cp backend/.env.example backend/.env
    echo "⚠️  Please edit backend/.env with your API keys"
fi

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit backend/.env with your API keys"
echo "2. Setup Supabase database with database/schema.sql"
echo "3. Run: yarn dev"
echo ""
echo "Happy coding! 🎉"