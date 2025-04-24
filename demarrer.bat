@echo off
title R-Cavalier - Demarrage
echo ===============================
echo     R-CAVALIER DEMENAGEMENT
echo ===============================
echo.

:: Vérifier si Python est installé
python --version > nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Python n'est pas installe ou n'est pas dans le PATH.
    echo Veuillez installer Python 3.8 ou plus recent.
    echo.
    pause
    exit /b 1
)

:: Chemin vers le répertoire de l'application
set APP_DIR=%~dp0

:: Se déplacer vers le répertoire de l'application
cd /d "%APP_DIR%"

echo Repertoire de l'application: %APP_DIR%
echo.

:: Options de démarrage
echo Options disponibles:
echo 1. Demarrer l'application
echo 2. Sauvegarder puis demarrer
echo 3. Sauvegarder uniquement
echo 4. Quitter
echo.

set /p choix=Votre choix (1-4): 

if "%choix%"=="1" (
    goto demarrer
) else if "%choix%"=="2" (
    goto sauvegarder_puis_demarrer
) else if "%choix%"=="3" (
    goto sauvegarder
) else if "%choix%"=="4" (
    exit /b 0
) else (
    echo Choix invalide. Veuillez reessayer.
    goto :eof
)

:sauvegarder
echo.
echo Creation d'une sauvegarde...
python backup.py
echo.
if "%choix%"=="3" (
    pause
    exit /b 0
)
goto demarrer

:sauvegarder_puis_demarrer
call :sauvegarder
goto demarrer

:demarrer
echo.
echo Demarrage de l'application R-Cavalier...
echo.
echo Pour arreter le serveur, appuyez sur Ctrl+C, puis 'O' pour confirmer.
echo.
python main.py
goto :eof
