#!/bin/bash
set -e

echo "🎌 Shadows of the Shogun - Development Environment Setup"
echo "========================================================"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running. Please start Docker and try again."
    exit 1
fi

echo "✓ Docker is running"
echo ""

# Start services
echo "📦 Starting PostgreSQL and Redis..."
docker-compose up -d postgres redis

# Wait for services to be healthy
echo "⏳ Waiting for database to be ready..."
until docker-compose exec -T postgres pg_isready -U shogun > /dev/null 2>&1; do
    sleep 1
done
echo "✓ PostgreSQL is ready"

echo "⏳ Waiting for Redis to be ready..."
until docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; do
    sleep 1
done
echo "✓ Redis is ready"
echo ""

# Backend setup
echo "🔧 Setting up backend..."
cd backend

if [ ! -d "node_modules" ]; then
    echo "  📥 Installing backend dependencies..."
    npm install
else
    echo "  ✓ Backend dependencies already installed"
fi

echo "  🗄️  Running database migrations..."
npm run prisma:migrate

echo "  🌱 Seeding database with initial data..."
npm run seed

cd ..
echo "✓ Backend setup complete"
echo ""

# Admin panel setup
echo "🔧 Setting up admin panel..."
cd admin-panel

if [ ! -d "node_modules" ]; then
    echo "  📥 Installing admin panel dependencies..."
    npm install
else
    echo "  ✓ Admin panel dependencies already installed"
fi

cd ..
echo "✓ Admin panel setup complete"
echo ""

# Economy sim setup
echo "🔧 Setting up economy simulation..."
cd economy-sim

if [ ! -d "node_modules" ]; then
    echo "  📥 Installing economy sim dependencies..."
    npm install
else
    echo "  ✓ Economy sim dependencies already installed"
fi

cd ..
echo "✓ Economy sim setup complete"
echo ""

echo "✅ Setup complete!"
echo ""
echo "🚀 To start all services, run:"
echo "   docker-compose up"
echo ""
echo "📍 Access points:"
echo "   Backend API:    http://localhost:3001/api"
echo "   Admin Panel:    http://localhost:3000"
echo "   PostgreSQL:     localhost:5432 (user: shogun, pass: shogun, db: shogun)"
echo "   Redis:          localhost:6379"
echo ""
echo "🧪 To run tests:"
echo "   cd backend && npm test"
echo ""
echo "📊 To run economy simulation:"
echo "   cd economy-sim && npm run simulate"
echo ""
