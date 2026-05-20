@echo off
echo ========================================
echo  Clear Cache and Restart Dev Server
echo ========================================
echo.

echo Step 1: Clearing Vite cache...
cd client
if exist "node_modules\.vite" (
    rmdir /s /q "node_modules\.vite"
    echo ✓ Vite cache cleared
) else (
    echo ✓ Vite cache already clean
)

echo.
echo Step 2: Clearing dist folder...
if exist "dist" (
    rmdir /s /q "dist"
    echo ✓ Dist folder cleared
) else (
    echo ✓ Dist folder already clean
)

echo.
echo Step 3: Clearing node cache...
if exist "node_modules\.cache" (
    rmdir /s /q "node_modules\.cache"
    echo ✓ Node cache cleared
) else (
    echo ✓ Node cache already clean
)

echo.
echo ========================================
echo  Cache Cleared Successfully!
echo ========================================
echo.
echo Next steps:
echo 1. Start dev server: pnpm dev
echo 2. In browser, press: Ctrl + Shift + R
echo 3. Or open incognito: Ctrl + Shift + N
echo.
echo Starting dev server now...
echo.

pnpm dev
