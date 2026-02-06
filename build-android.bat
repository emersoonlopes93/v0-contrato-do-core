@echo off
echo ======================
echo BUILD INICIADO
echo ======================

echo > Instalando dependencias
call pnpm install

echo > Compilando projeto web
call pnpm run build

echo > Sincronizando Capacitor
call npx cap sync android

echo > Construindo APK/AAB
cd android
call .\gradlew assembleRelease

echo ======================
echo BUILD FINALIZADO!
echo APK está em:
echo android/app/build/outputs/apk/release/app-release.apk
echo ======================

pause
