#!/bin/bash

# InternConnect - Quick Testing Script

echo "🧪 InternConnect Feature Test Suite"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if backend is running
echo "1️⃣  Checking Backend..."
if curl -s http://127.0.0.1:8000/auth/internships > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend running on http://127.0.0.1:8000${NC}"
else
    echo -e "${RED}✗ Backend not running!${NC}"
    echo "Start backend with: ./start.sh"
    exit 1
fi

# Check if frontend is running
echo ""
echo "2️⃣  Checking Frontend..."
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend running on http://localhost:5173${NC}"
else
    echo -e "${RED}✗ Frontend not running!${NC}"
    echo "Start frontend with: cd frontend && npm run dev"
    exit 1
fi

# Test endpoints
echo ""
echo "3️⃣  Testing Endpoints..."
echo ""

# You need to get a valid token first - manual testing required
echo -e "${YELLOW}Manual Testing Required:${NC}"
echo ""
echo "Step 1: Login to the application"
echo "  - Open http://localhost:5173"
echo "  - Login as an employer"
echo ""
echo "Step 2: Check timer in navbar"
echo "  - Timer should show: ⏱️ 10:00"
echo "  - Timer should count down every second"
echo ""
echo "Step 3: Test activity reset"
echo "  - Wait 3 seconds"
echo "  - Click on the page"
echo "  - Timer should reset to 10:00"
echo ""
echo "Step 4: Test employer features"
echo "  - Go to Dashboard"
echo "  - Click Profile button"
echo "  - Fill in company name: 'TestCorp'"
echo "  - Fill in company bio"
echo "  - Click Save - should see green toast"
echo ""
echo "Step 5: Test applications"
echo "  - Click 'Applications' tab"
echo "  - Should see list of internships with applicants"
echo "  - Try clicking 'Accept' on an applicant"
echo "  - Edit the offer message"
echo "  - Click 'Send & Offer'"
echo "  - Status should change to 'Offered'"
echo ""
echo "Step 6: Test auto-logout"
echo "  - Let the timer count down to 0:00"
echo "  - Should auto-logout after 10 minutes of inactivity"
echo "  - Should show alert: 'Your session has expired...'"
echo ""
echo -e "${GREEN}✅ All systems ready for testing!${NC}"
