#!/bin/bash

echo "🚀 Running Skironia Island Test Suite"
echo "====================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to run tests with error handling
run_tests() {
    local test_name=$1
    local test_command=$2
    local test_dir=$3

    echo -e "\n${YELLOW}Running $test_name tests...${NC}"
    echo "Directory: $test_dir"
    echo "Command: $test_command"

    cd "$test_dir"

    if eval "$test_command"; then
        echo -e "${GREEN}✅ $test_name tests passed${NC}"
        cd - > /dev/null
        return 0
    else
        echo -e "${RED}❌ $test_name tests failed${NC}"
        cd - > /dev/null
        return 1
    fi
}

# Track overall success
BACKEND_PASSED=0
FRONTEND_PASSED=0

# Run backend tests
if run_tests "Backend" "npm test" "back"; then
    BACKEND_PASSED=1
fi

# Run frontend tests
if run_tests "Frontend" "npm test" "front"; then
    FRONTEND_PASSED=1
fi

# Summary
echo -e "\n====================================="
echo "🏁 Test Suite Summary"
echo "====================================="

if [ $BACKEND_PASSED -eq 1 ]; then
    echo -e "${GREEN}✅ Backend tests: PASSED${NC}"
else
    echo -e "${RED}❌ Backend tests: FAILED${NC}"
fi

if [ $FRONTEND_PASSED -eq 1 ]; then
    echo -e "${GREEN}✅ Frontend tests: PASSED${NC}"
else
    echo -e "${RED}❌ Frontend tests: FAILED${NC}"
fi

echo ""

if [ $BACKEND_PASSED -eq 1 ] && [ $FRONTEND_PASSED -eq 1 ]; then
    echo -e "${GREEN}🎉 All tests passed! Skironia Island is ready for adventure.${NC}"
    exit 0
else
    echo -e "${RED}💥 Some tests failed. Please fix the issues before deploying.${NC}"
    exit 1
fi
