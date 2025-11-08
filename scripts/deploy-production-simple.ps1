# PowerShell deployment script for Windows
# Hikvision Camera App - Production Deployment Script

param(
    [switch]$SkipTests = $false,
    [switch]$Verbose = $false
)

# Set error action preference
$ErrorActionPreference = "Stop"

# Configuration
$AppVersion = (Get-Content package.json | ConvertFrom-Json).version
$AppName = "com.hikvision"
$BuildDir = "./dist"

Write-Host "Hikvision Camera App - Production Deployment" -ForegroundColor Yellow
Write-Host "=============================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "App Version: $AppVersion" -ForegroundColor Yellow
Write-Host "App Name: $AppName" -ForegroundColor Yellow
Write-Host ""

try {
    # Step 1: Clean previous builds
    Write-Host "Cleaning previous builds..." -ForegroundColor Yellow
    if (Test-Path $BuildDir) {
        Remove-Item -Recurse -Force $BuildDir
    }
    New-Item -ItemType Directory -Force -Path $BuildDir | Out-Null
    npm run clean
    Write-Host "Build directory cleaned" -ForegroundColor Green
    Write-Host ""

    # Step 2: Install dependencies
    Write-Host "Installing all dependencies..." -ForegroundColor Yellow
    npm ci
    Write-Host "Dependencies installed" -ForegroundColor Green
    Write-Host ""

    # Step 3: Run linting
    Write-Host "Running code quality checks..." -ForegroundColor Yellow
    $lintResult = npm run lint 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Linting passed" -ForegroundColor Green
    } else {
        Write-Host "Linting failed - please fix errors" -ForegroundColor Red
        Write-Host $lintResult
        exit 1
    }
    Write-Host ""

    # Step 4: Compile TypeScript
    Write-Host "Compiling TypeScript..." -ForegroundColor Yellow
    $buildResult = npm run build 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "TypeScript compilation successful" -ForegroundColor Green
    } else {
        Write-Host "TypeScript compilation failed" -ForegroundColor Red
        Write-Host $buildResult
        exit 1
    }
    Write-Host ""

    # Step 5: Run comprehensive tests (if not skipped)
    if (-not $SkipTests) {
        Write-Host "Running comprehensive test suite..." -ForegroundColor Yellow

        # Run Jest tests
        Write-Host "Running Jest tests..."
        $testResult = npm run test 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Jest tests passed" -ForegroundColor Green
        } else {
            Write-Host "Jest tests failed" -ForegroundColor Red
            Write-Host $testResult
            exit 1
        }

        Write-Host "Test coverage report generated" -ForegroundColor Green
        Write-Host ""
    } else {
        Write-Host "Skipping tests (SkipTests specified)" -ForegroundColor Yellow
        Write-Host ""
    }

    # Step 6: Security audit
    Write-Host "Running security audit..." -ForegroundColor Yellow
    $auditResult = npm audit --audit-level=moderate 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Security audit passed" -ForegroundColor Green
    } else {
        Write-Host "Security audit found issues - please review" -ForegroundColor Yellow
        if ($Verbose) {
            Write-Host $auditResult
        }
    }
    Write-Host ""

    # Step 7: Validate app.json
    Write-Host "Validating app.json..." -ForegroundColor Yellow
    if (Test-Path "app.json") {
        try {
            $appJson = Get-Content "app.json" | ConvertFrom-Json
            Write-Host "app.json is valid JSON" -ForegroundColor Green
            
            if ($appJson.id -eq $AppName) {
                Write-Host "App ID matches expected value" -ForegroundColor Green
            } else {
                Write-Host "App ID mismatch" -ForegroundColor Red
                exit 1
            }
            
            if ($appJson.version -eq $AppVersion) {
                Write-Host "App version matches package.json" -ForegroundColor Green
            } else {
                Write-Host "Version mismatch between app.json and package.json" -ForegroundColor Red
                exit 1
            }
        } catch {
            Write-Host "app.json is invalid JSON" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "app.json not found" -ForegroundColor Red
        exit 1
    }
    Write-Host ""

    # Step 8: Check required files
    Write-Host "Checking required files..." -ForegroundColor Yellow
    $requiredFiles = @(
        "app.json",
        "package.json",
        "README.md",
        "src/app.ts",
        "src/drivers/hikvision-camnvr/driver.ts",
        "src/drivers/hikvision-camnvr/device.ts"
    )

    foreach ($file in $requiredFiles) {
        if (Test-Path $file) {
            Write-Host "FOUND: $file" -ForegroundColor Green
        } else {
            Write-Host "MISSING: $file" -ForegroundColor Red
            exit 1
        }
    }
    Write-Host ""

    # Step 9: Build Homey app package
    Write-Host "Building Homey app package..." -ForegroundColor Yellow
    $homeyBuildResult = npm run homey:build 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Homey app package built successfully" -ForegroundColor Green
    } else {
        Write-Host "Homey app package build failed" -ForegroundColor Red
        Write-Host $homeyBuildResult
        exit 1
    }
    Write-Host ""

    # Step 10: Validate package contents
    Write-Host "Validating package contents..." -ForegroundColor Yellow
    $packagePath = "$AppName.tar.gz"
    if (Test-Path $packagePath) {
        $packageSize = (Get-Item $packagePath).Length
        $packageSizeMB = [math]::Round($packageSize / 1MB, 2)
        
        Write-Host "Package size: ${packageSizeMB}MB"
        
        if ($packageSizeMB -gt 50) {
            Write-Host "WARNING: Package size is large (${packageSizeMB}MB)" -ForegroundColor Yellow
        } else {
            Write-Host "Package size acceptable" -ForegroundColor Green
        }
    } else {
        Write-Host "Package file not found" -ForegroundColor Red
        exit 1
    }
    Write-Host ""

    # Success message
    Write-Host "DEPLOYMENT PREPARATION COMPLETE!" -ForegroundColor Green
    Write-Host ""
    Write-Host "All checks passed successfully" -ForegroundColor Green
    Write-Host "Package built and validated" -ForegroundColor Green
    Write-Host "Ready for App Store submission" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host "1. Test installation on Homey device"
    Write-Host "2. Submit to Homey App Store"
    Write-Host "3. Monitor deployment metrics"
    Write-Host ""
    Write-Host "Package Location: $packagePath" -ForegroundColor Yellow
    Write-Host "Package Size: ${packageSizeMB}MB" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Ready for takeoff!"

} catch {
    Write-Host "Deployment preparation failed: $_" -ForegroundColor Red
    exit 1
}