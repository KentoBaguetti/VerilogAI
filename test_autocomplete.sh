#!/bin/bash

# Test script for AI Autocomplete
echo "🧪 Testing AI Autocomplete Backend..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if backend is running
echo "1. Checking if backend is running on port 8000..."
if curl -s http://localhost:8000/docs > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is running${NC}"
else
    echo -e "${RED}❌ Backend is NOT running${NC}"
    echo "   Start it with: cd backend && uvicorn app.main:app --reload --port 8000"
    exit 1
fi

echo ""
echo "2. Testing /api/v1/generate/ endpoint..."

# Test the generate endpoint
RESPONSE=$(curl -s -X POST "http://localhost:8000/api/v1/generate/" \
    -H "Content-Type: application/json" \
    -d '{
        "prompt": "module counter",
        "max_tokens": 50,
        "temperature": 0.3
    }')

# Check if response contains "text" field
if echo "$RESPONSE" | grep -q '"text"'; then
    echo -e "${GREEN}✅ Generate endpoint is working${NC}"
    echo ""
    echo "Response preview:"
    echo "$RESPONSE" | python3 -m json.tool 2>/dev/null | head -n 10
    echo ""
else
    echo -e "${RED}❌ Generate endpoint returned an error${NC}"
    echo "Response:"
    echo "$RESPONSE"
    echo ""
    
    # Check for common errors
    if echo "$RESPONSE" | grep -q "OPENAI_API_KEY"; then
        echo -e "${YELLOW}⚠️  OpenAI API key is not configured${NC}"
        echo "   Add OPENAI_API_KEY to your .env file"
    fi
    exit 1
fi

echo ""
echo "3. Checking frontend build..."
cd new-frontend
if [ -f "package.json" ]; then
    echo -e "${GREEN}✅ Frontend directory found${NC}"
else
    echo -e "${RED}❌ Frontend directory not found${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 All checks passed!${NC}"
echo ""
echo "To use AI Autocomplete:"
echo "1. Start frontend: cd new-frontend && npm run dev"
echo "2. Open http://localhost:5173"
echo "3. Create/open a .v file"
echo "4. Start typing - AI suggestions will appear as grey text"
echo "5. Press Tab to accept suggestions"
echo ""

