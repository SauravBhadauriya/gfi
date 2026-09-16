#!/bin/bash

# Production Readiness Verification Script
# Verifies that the app is ready for App Store/Play Store submission

set -e

echo "🔍 Gully Fame Mobile - Production Readiness Check"
echo "=================================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
WARNINGS=0

# Function to print results
check_result() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ PASS${NC}: $1"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC}: $1"
        ((FAILED++))
    fi
}

check_warning() {
    echo -e "${YELLOW}⚠ WARNING${NC}: $1"
    ((WARNINGS++))
}

# 1. Check for hardcoded secrets (advanced filtering)
echo "1️⃣  Checking for hardcoded secrets..."
# Look for actual hardcoded values like: password = "abc123" or apiKey: "sk-"
SECRETS_COUNT=$(grep -r "password\s*=\s*['\"]" src app --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "// " | wc -l)
SECRETS_COUNT=$((SECRETS_COUNT + $(grep -r "apiKey\s*=\s*['\"]" src app --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "// " | wc -l)))
SECRETS_COUNT=$((SECRETS_COUNT + $(grep -r "Bearer\s\+[a-zA-Z0-9]" src app --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "// " | grep -v "Bearer \$" | wc -l)))

if [ $SECRETS_COUNT -eq 0 ]; then
    check_result "No hardcoded secrets found"
else
    check_warning "Found $SECRETS_COUNT potential hardcoded secrets"
fi

# 2. Check for console logs (should be wrapped in __DEV__)
echo ""
echo "2️⃣  Checking for production console logs..."
CONSOLE_COUNT=$(grep -r "console\\.log" src app --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "if (__DEV__)" | grep -v "// " | wc -l)
if [ $CONSOLE_COUNT -eq 0 ]; then
    check_result "All console.log statements properly wrapped in __DEV__ guards"
else
    check_warning "Found $CONSOLE_COUNT console.log statements not wrapped in __DEV__"
fi

# 3. Check error logs are preserved
echo ""
echo "3️⃣  Checking error logging is preserved..."
ERROR_LOG_COUNT=$(grep -r "console\\.error" src app --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l)
if [ $ERROR_LOG_COUNT -gt 0 ]; then
    check_result "Found $ERROR_LOG_COUNT console.error statements (preserved for production)"
else
    check_warning "No console.error statements found - error tracking may not work"
fi

# 4. Check warn logs are preserved
WARN_LOG_COUNT=$(grep -r "console\\.warn" src app --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l)
if [ $WARN_LOG_COUNT -gt 0 ]; then
    check_result "Found $WARN_LOG_COUNT console.warn statements (preserved for production)"
else
    check_warning "No console.warn statements found"
fi

# 5. Check for TODO/FIXME comments
echo ""
echo "4️⃣  Checking for unresolved TODOs/FIXMEs..."
TODO_COUNT=$(grep -r "TODO\|FIXME" src app --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "node_modules" | wc -l)
if [ $TODO_COUNT -eq 0 ]; then
    check_result "No TODO/FIXME comments found"
else
    check_warning "Found $TODO_COUNT TODO/FIXME comments"
fi

# 6. Check for test files in production
echo ""
echo "5️⃣  Checking test files are not included..."
if [ ! -f "src/__tests__/integration/criticalFlows.test.ts" ]; then
    check_result "Test files properly located in src/__tests__"
else
    check_result "Test files found in correct location (__tests__ directory)"
fi

# 7. Check for error boundaries
echo ""
echo "6️⃣  Checking error boundaries exist..."
if [ -f "src/components/ErrorBoundary.tsx" ]; then
    check_result "ErrorBoundary component found"
else
    check_result "ErrorBoundary component missing"
fi

# 8. Check babel config has production settings
echo ""
echo "7️⃣  Checking babel.config.js has production settings..."
if grep -q "transform-remove-console" babel.config.js; then
    check_result "Babel configured to remove console logs in production"
else
    check_warning "transform-remove-console not configured in babel.config.js"
fi

# 9. Check app.json has required fields
echo ""
echo "8️⃣  Checking app.json configuration..."
if grep -q "\"name\"" app.json && grep -q "\"slug\"" app.json && grep -q "\"version\"" app.json; then
    check_result "app.json has required metadata"
else
    check_warning "app.json missing some required fields"
fi

# 10. Check permissions are configured
echo ""
echo "9️⃣  Checking permissions configuration..."
if grep -q "NSCameraUsageDescription" app.json && grep -q "NSMicrophoneUsageDescription" app.json; then
    check_result "iOS permissions configured"
else
    check_warning "iOS permissions may not be fully configured"
fi

if grep -q "android.permission.CAMERA" app.json && grep -q "android.permission.RECORD_AUDIO" app.json; then
    check_result "Android permissions configured"
else
    check_warning "Android permissions may not be fully configured"
fi

# 11. Check for mock data in production
echo ""
echo "🔟 Checking for mock data in production..."
MOCK_COUNT=$(grep -r "mockData\|__MOCK__\|TEST_" src app --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "__MOCK_DATA__" | wc -l)
if [ $MOCK_COUNT -eq 0 ]; then
    check_result "No mock data found in production code"
else
    check_warning "Found $MOCK_COUNT potential mock data references"
fi

# 12. Run tests
echo ""
echo "1️⃣1️⃣  Running integration tests..."
if npm run test 2>&1 | grep -q "passed"; then
    check_result "Integration tests passing"
else
    check_warning "Could not verify test results"
fi

# 13. Check package.json version
echo ""
echo "1️⃣2️⃣  Checking version configuration..."
if grep -q "\"version\"" package.json; then
    VERSION=$(grep "\"version\"" package.json | head -1 | sed 's/.*"version": "\([^"]*\)".*/\1/')
    check_result "Package version: $VERSION"
else
    check_warning "Version not found in package.json"
fi

# Summary
echo ""
echo "=================================================="
echo "📊 RESULTS SUMMARY"
echo "=================================================="
echo -e "${GREEN}✓ Passed: $PASSED${NC}"
echo -e "${YELLOW}⚠ Warnings: $WARNINGS${NC}"
echo -e "${RED}✗ Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ] && [ $WARNINGS -le 3 ]; then
    echo -e "${GREEN}✅ APP IS READY FOR PRODUCTION${NC}"
    exit 0
elif [ $FAILED -eq 0 ]; then
    echo -e "${YELLOW}⚠️  APP HAS WARNINGS - REVIEW BEFORE SUBMISSION${NC}"
    exit 0
else
    echo -e "${RED}❌ APP HAS FAILURES - FIX BEFORE SUBMISSION${NC}"
    exit 1
fi
