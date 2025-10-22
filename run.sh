#!/usr/bin/env bash

set -e # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f .env ]; then
  echo -e "${RED}⚠️  .env file not found!${NC}"
  echo "Please create a .env file with your configuration."
  exit 1
fi

# Parse command line arguments
COMMAND=${1:-start}

case $COMMAND in
  start)
    echo -e "${BLUE}🚀 Starting Matcha services...${NC}"
    docker compose up -d
    echo -e "${GREEN}✅ Services started successfully!${NC}"
    echo ""
    echo -e "Frontend: ${BLUE}http://localhost:5173${NC}"
    echo -e "Backend:  ${BLUE}http://localhost:3000${NC}"
    echo -e "Database: ${BLUE}http://localhost:5432${NC}"
    echo -e "Redis:    ${BLUE}http://localhost:6379${NC}"
    ;;
  
  stop)
    echo -e "${YELLOW}⏹  Stopping Matcha services...${NC}"
    docker compose down
    echo -e "${GREEN}✅ Services stopped${NC}"
    ;;
  
  restart)
    echo -e "${YELLOW}🔄 Restarting Matcha services with rebuild...${NC}"
    docker compose down
    docker compose build --no-cache
    docker compose up -d
    echo -e "${GREEN}✅ Services restarted with fresh build${NC}"
    echo ""
    echo -e "Frontend: ${BLUE}http://localhost:5173${NC}"
    echo -e "Backend:  ${BLUE}http://localhost:3000${NC}"
    echo -e "Database: ${BLUE}http://localhost:5432${NC}"
    echo -e "Redis:    ${BLUE}http://localhost:6379${NC}"
    ;;
  
  logs)
    SERVICE=${2:-}
    if [ -z "$SERVICE" ]; then
      docker compose logs -f
    else
      docker compose logs -f "$SERVICE"
    fi
    ;;
  
  *)
    echo -e "${RED}❌ Unknown command: $COMMAND${NC}"
    echo ""
    echo "Usage: ./run.sh [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  start    - Start all services (default)"
    echo "  stop     - Stop all services"
    echo "  restart  - Restart all services"
    echo "  logs     - Show logs (optional: ./run.sh logs backend)"
    exit 1
    ;;
esac

#===----------------------------------------------------------------------===#

