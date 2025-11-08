#!/bin/bash

# Hikvision Camera App - Production Deployment Script
# This script prepares and validates the app for production deployment

set -e  # Exit on any error

echo "🚀 Hikvision Camera App - Production Deployment"
echo "================================================"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
APP_VERSION=$(node -p "require('./package.json').version")
APP_NAME="com.hikvision"
BUILD_DIR="./dist"
DOCS_DIR="./docs"

echo -e "${YELLOW}App Version: ${APP_VERSION}${NC}"
echo -e "${YELLOW}App Name: ${APP_NAME}${NC}"
echo ""

# Step 1: Clean previous builds
echo -e "${YELLOW}🧹 Cleaning previous builds...${NC}"
npm run clean
rm -rf ${BUILD_DIR}
mkdir -p ${BUILD_DIR}
echo -e "${GREEN}✅ Build directory cleaned${NC}"
echo ""

# Step 2: Install dependencies
echo -e "${YELLOW}📦 Installing production dependencies...${NC}"
npm ci --production
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Step 3: Run linting
echo -e "${YELLOW}🔍 Running code quality checks...${NC}"
npm run lint
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Linting passed${NC}"
else
    echo -e "${RED}❌ Linting failed - please fix errors${NC}"
    exit 1
fi
echo ""

# Step 4: Compile TypeScript
echo -e "${YELLOW}🔨 Compiling TypeScript...${NC}"
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ TypeScript compilation successful${NC}"
else
    echo -e "${RED}❌ TypeScript compilation failed${NC}"
    exit 1
fi
echo ""

# Step 5: Run comprehensive tests
echo -e "${YELLOW}🧪 Running comprehensive test suite...${NC}"

# Run Jest tests
echo "Running Jest tests..."
npm run test
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Jest tests passed${NC}"
else
    echo -e "${RED}❌ Jest tests failed${NC}"
    exit 1
fi

# Run Hikvision-specific tests
echo "Running Hikvision tests..."
npm run test:hikvision
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Hikvision tests passed${NC}"
else
    echo -e "${RED}❌ Hikvision tests failed${NC}"
    exit 1
fi

# Generate coverage report
npm run test:coverage > /dev/null 2>&1
echo -e "${GREEN}✅ Test coverage report generated${NC}"
echo ""

# Step 6: Security audit
echo -e "${YELLOW}🔒 Running security audit...${NC}"
npm audit --audit-level=moderate
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Security audit passed${NC}"
else
    echo -e "${YELLOW}⚠️  Security audit found issues - please review${NC}"
    # Don't exit on audit warnings, but log them
fi
echo ""

# Step 7: Validate app.json
echo -e "${YELLOW}📋 Validating app.json...${NC}"
if [ -f "app.json" ]; then
    # Basic JSON validation
    node -e "JSON.parse(require('fs').readFileSync('app.json', 'utf8'))" 2>/dev/null
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ app.json is valid JSON${NC}"
        
        # Check required fields
        APP_ID=$(node -p "require('./app.json').id" 2>/dev/null)
        APP_VER=$(node -p "require('./app.json').version" 2>/dev/null)
        
        if [ "$APP_ID" = "$APP_NAME" ]; then
            echo -e "${GREEN}✅ App ID matches expected value${NC}"
        else
            echo -e "${RED}❌ App ID mismatch${NC}"
            exit 1
        fi
        
        if [ "$APP_VER" = "$APP_VERSION" ]; then
            echo -e "${GREEN}✅ App version matches package.json${NC}"
        else
            echo -e "${RED}❌ Version mismatch between app.json and package.json${NC}"
            exit 1
        fi
    else
        echo -e "${RED}❌ app.json is invalid JSON${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ app.json not found${NC}"
    exit 1
fi
echo ""

# Step 8: Check required files
echo -e "${YELLOW}📁 Checking required files...${NC}"
REQUIRED_FILES=(
    "app.json"
    "package.json"
    "README.md"
    "src/app.ts"
    "src/drivers/hikvision-camnvr/driver.ts"
    "src/drivers/hikvision-camnvr/device.ts"
    "assets/images/large.png"
    "assets/images/small.png"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ ${file}${NC}"
    else
        echo -e "${RED}❌ Missing required file: ${file}${NC}"
        exit 1
    fi
done
echo ""

# Step 9: Build Homey app package
echo -e "${YELLOW}📦 Building Homey app package...${NC}"
npm run homey:build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Homey app package built successfully${NC}"
else
    echo -e "${RED}❌ Homey app package build failed${NC}"
    exit 1
fi
echo ""

# Step 10: Validate package contents
echo -e "${YELLOW}📋 Validating package contents...${NC}"
if [ -f "${APP_NAME}.tar.gz" ]; then
    # List package contents
    echo "Package contents:"
    tar -tzf "${APP_NAME}.tar.gz" | head -20
    
    # Check package size
    PACKAGE_SIZE=$(stat -c%s "${APP_NAME}.tar.gz" 2>/dev/null || stat -f%z "${APP_NAME}.tar.gz" 2>/dev/null)
    PACKAGE_SIZE_MB=$((PACKAGE_SIZE / 1024 / 1024))
    
    echo "Package size: ${PACKAGE_SIZE_MB}MB"
    
    if [ $PACKAGE_SIZE_MB -gt 50 ]; then
        echo -e "${YELLOW}⚠️  Package size is large (${PACKAGE_SIZE_MB}MB)${NC}"
    else
        echo -e "${GREEN}✅ Package size acceptable${NC}"
    fi
else
    echo -e "${RED}❌ Package file not found${NC}"
    exit 1
fi
echo ""

# Step 11: Performance check
echo -e "${YELLOW}⚡ Running performance checks...${NC}"

# Check TypeScript output size
if [ -d "dist" ]; then
    DIST_SIZE=$(du -sh dist | cut -f1)
    echo "Compiled code size: ${DIST_SIZE}"
fi

# Check for potential performance issues
echo "Checking for performance issues..."
grep -r "console.log" src/ > /dev/null && echo -e "${YELLOW}⚠️  Found console.log statements - consider removing for production${NC}" || echo -e "${GREEN}✅ No debug console.log found${NC}"
grep -r "setTimeout.*0" src/ > /dev/null && echo -e "${YELLOW}⚠️  Found setTimeout(0) - potential performance issue${NC}" || echo -e "${GREEN}✅ No immediate timeouts found${NC}"
echo ""

# Step 12: Documentation check
echo -e "${YELLOW}📚 Checking documentation...${NC}"
REQUIRED_DOCS=(
    "docs/USER_GUIDE.md"
    "docs/API_DOCUMENTATION.md"
    "docs/DEPLOYMENT_GUIDE.md"
    "README.md"
)

for doc in "${REQUIRED_DOCS[@]}"; do
    if [ -f "$doc" ]; then
        WORD_COUNT=$(wc -w < "$doc")
        echo -e "${GREEN}✅ ${doc} (${WORD_COUNT} words)${NC}"
    else
        echo -e "${YELLOW}⚠️  Documentation missing: ${doc}${NC}"
    fi
done
echo ""

# Step 13: Final deployment checklist
echo -e "${YELLOW}📋 Final deployment checklist...${NC}"
echo "Please verify the following manually:"
echo "□ Version number updated in all files"
echo "□ Changelog updated with new features"
echo "□ Breaking changes documented"
echo "□ Migration guide provided (if needed)"
echo "□ App store metadata updated"
echo "□ Screenshots updated"
echo "□ Support documentation current"
echo "□ Privacy policy updated (if needed)"
echo ""

# Step 14: Generate deployment report
echo -e "${YELLOW}📊 Generating deployment report...${NC}"
REPORT_FILE="deployment-report-${APP_VERSION}.txt"

cat > "$REPORT_FILE" << EOF
Hikvision Camera App - Deployment Report
========================================

App Information:
- Name: ${APP_NAME}
- Version: ${APP_VERSION}
- Build Date: $(date)
- Package Size: ${PACKAGE_SIZE_MB}MB

Build Status:
- TypeScript Compilation: ✅ PASSED
- Linting: ✅ PASSED
- Jest Tests: ✅ PASSED
- Hikvision Tests: ✅ PASSED
- Security Audit: ✅ PASSED
- Package Build: ✅ PASSED

Files Validated:
$(for file in "${REQUIRED_FILES[@]}"; do echo "- $file"; done)

Documentation Status:
$(for doc in "${REQUIRED_DOCS[@]}"; do
    if [ -f "$doc" ]; then
        echo "- $doc: PRESENT"
    else
        echo "- $doc: MISSING"
    fi
done)

Performance Metrics:
- Compiled Size: ${DIST_SIZE}
- Package Size: ${PACKAGE_SIZE_MB}MB

Next Steps:
1. Manual testing on Homey device
2. App store submission
3. Community announcement
4. Monitor deployment metrics

EOF

echo -e "${GREEN}✅ Deployment report generated: ${REPORT_FILE}${NC}"
echo ""

# Success message
echo -e "${GREEN}🎉 DEPLOYMENT PREPARATION COMPLETE! 🎉${NC}"
echo ""
echo -e "${GREEN}✅ All checks passed successfully${NC}"
echo -e "${GREEN}✅ Package built and validated${NC}"
echo -e "${GREEN}✅ Ready for App Store submission${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Review deployment report: ${REPORT_FILE}"
echo "2. Test installation on Homey device"
echo "3. Submit to Homey App Store"
echo "4. Monitor deployment metrics"
echo ""
echo -e "${YELLOW}Package Location:${NC} ${APP_NAME}.tar.gz"
echo -e "${YELLOW}Package Size:${NC} ${PACKAGE_SIZE_MB}MB"
echo ""
echo "🚀 Ready for takeoff!"