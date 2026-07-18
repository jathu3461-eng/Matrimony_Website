#!/bin/bash

# ============================================================
# Mukurtham Matrimony - Quick Start Script
# ============================================================
# Usage: ./quick-start.sh
# This script will set up and start the entire application

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════╗"
echo "║  🎭 MUKURTHAM MATRIMONY - Quick Start          ║"
echo "╚════════════════════════════════════════════════╝"
echo -e "${NC}\n"

# Function to print colored output
print_step() {
    echo -e "${BLUE}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Check prerequisites
print_step "Checking prerequisites..."

if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+"
    exit 1
fi
print_success "Node.js found: $(node --version)"

if ! command -v npm &> /dev/null; then
    print_error "npm is not installed"
    exit 1
fi
print_success "npm found: $(npm --version)"

if ! command -v docker &> /dev/null; then
    print_warning "Docker is not installed. Some features may not work."
else
    print_success "Docker found: $(docker --version)"
fi

echo ""

# Install dependencies
print_step "Installing dependencies..."

cd backend
if [ ! -d "node_modules" ]; then
    npm install
    print_success "Backend dependencies installed"
else
    print_success "Backend dependencies already installed"
fi
cd ..

cd frontend
if [ ! -d "node_modules" ]; then
    npm install
    print_success "Frontend dependencies installed"
else
    print_success "Frontend dependencies already installed"
fi
cd ..

echo ""

# Start Docker services
print_step "Starting Docker services..."

if command -v docker &> /dev/null; then
    docker-compose -f infrastructure/docker-compose.yml up -d
    sleep 3
    print_success "Docker services started (MySQL, Redis)"
else
    print_warning "Docker not available. Make sure MySQL and Redis are running on localhost"
fi

echo ""

# Setup database
print_step "Setting up database..."

cd backend
npm run prisma:generate
print_success "Prisma client generated"

npm run prisma:migrate
print_success "Database migrations completed"

cd ..

echo ""

# Create .env if not exists
print_step "Checking environment configuration..."

if [ ! -f "backend/.env" ]; then
    cp backend/.env.example backend/.env
    print_success "Created backend/.env"
else
    print_success "backend/.env already exists"
fi

if [ ! -f "frontend/.env" ]; then
    cp frontend/.env.example frontend/.env
    print_success "Created frontend/.env"
else
    print_success "frontend/.env already exists"
fi

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Setup Complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo ""

echo "📖 Next steps:"
echo ""
echo "1. 🚀 Start Backend (Terminal 1):"
echo -e "   ${BLUE}cd backend && npm run dev${NC}"
echo ""
echo "2. 🎨 Start Frontend (Terminal 2):"
echo -e "   ${BLUE}cd frontend && npm run dev${NC}"
echo ""
echo "3. 🌐 Open your browser:"
echo -e "   ${BLUE}http://localhost:3000${NC}"
echo ""
echo "4. 📡 API Health Check:"
echo -e "   ${BLUE}curl http://localhost:8000/api/health${NC}"
echo ""
echo -e "${YELLOW}ℹ Services running on:${NC}"
echo "   • Frontend:  http://localhost:3000"
echo "   • Backend:   http://localhost:8000"
echo "   • MySQL:     localhost:3306"
echo "   • Redis:     localhost:6379"
echo ""

print_success "All done! Happy coding! 🎉"
