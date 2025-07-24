#!/bin/bash

# ===== CCPM Development Environment Setup =====
set -e

echo "🚀 CCPM Development Environment Setup Starting..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Docker is running
check_docker() {
    echo -e "${BLUE}Checking Docker...${NC}"
    if ! docker info > /dev/null 2>&1; then
        echo -e "${RED}❌ Docker is not running. Please start Docker and try again.${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Docker is running${NC}"
}

# Check if Docker Compose is available
check_docker_compose() {
    echo -e "${BLUE}Checking Docker Compose...${NC}"
    if ! command -v docker-compose &> /dev/null; then
        if ! docker compose version &> /dev/null; then
            echo -e "${RED}❌ Docker Compose is not available. Please install Docker Compose.${NC}"
            exit 1
        fi
        DOCKER_COMPOSE_CMD="docker compose"
    else
        DOCKER_COMPOSE_CMD="docker-compose"
    fi
    echo -e "${GREEN}✅ Docker Compose is available${NC}"
}

# Create .env file if it doesn't exist
setup_env() {
    echo -e "${BLUE}Setting up environment variables...${NC}"
    if [ ! -f .env ]; then
        echo -e "${YELLOW}Creating .env file from .env.development...${NC}"
        cp .env.development .env
    else
        echo -e "${GREEN}✅ .env file already exists${NC}"
    fi
}

# Show setup completion message
show_completion() {
    echo -e "\n${GREEN}🎉 CCPM Development Environment Setup Completed!${NC}"
    echo -e "${BLUE}📋 What's been set up:${NC}"
    echo -e "  ✅ Backend (Node.js + TypeScript + Express)"
    echo -e "  ✅ Frontend (React + TypeScript + Vite)"
    echo -e "  ✅ Database (PostgreSQL + Redis)"
    echo -e "  ✅ Docker configurations"
    echo -e "  ✅ TypeScript configurations"
    echo -e "  ✅ Environment variables"
    
    echo -e "\n${YELLOW}🚀 Next steps:${NC}"
    echo -e "1. Install dependencies:"
    echo -e "   cd backend && npm install"
    echo -e "   cd frontend && npm install"
    echo -e ""
    echo -e "2. Start development environment:"
    echo -e "   docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d"
    echo -e ""
    echo -e "3. Access your application:"
    echo -e "   Frontend: http://localhost:3000"
    echo -e "   Backend:  http://localhost:3001"
    echo -e "   Database: http://localhost:8080 (Adminer)"
}

# Main execution
main() {
    echo -e "${GREEN}CCPM Development Environment Setup${NC}"
    echo -e "${BLUE}======================================${NC}"
    
    check_docker
    check_docker_compose
    setup_env
    show_completion
    
    echo -e "\n${GREEN}🚀 Setup completed successfully!${NC}"
}

# Run main function
main "$@"