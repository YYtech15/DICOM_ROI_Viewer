@echo off
setlocal enabledelayedexpansion

rem ルートディレクトリ
set ROOT_DIR=.

rem ディレクトリリスト
set DIRS=
set DIRS=!DIRS! .github\workflows
set DIRS=!DIRS! backend\app\api
set DIRS=!DIRS! backend\app\core
set DIRS=!DIRS! backend\app\services
set DIRS=!DIRS! backend\app\models
set DIRS=!DIRS! backend\app\utils
set DIRS=!DIRS! backend\tests
set DIRS=!DIRS! backend\config
set DIRS=!DIRS! backend\migrations
set DIRS=!DIRS! frontend\public
set DIRS=!DIRS! frontend\src\components\common
set DIRS=!DIRS! frontend\src\components\auth
set DIRS=!DIRS! frontend\src\components\viewer
set DIRS=!DIRS! frontend\src\components\uploader
set DIRS=!DIRS! frontend\src\hooks
set DIRS=!DIRS! frontend\src\services
set DIRS=!DIRS! frontend\src\store
set DIRS=!DIRS! frontend\src\types
set DIRS=!DIRS! frontend\src\utils
set DIRS=!DIRS! frontend\src\pages
set DIRS=!DIRS! frontend\tests
set DIRS=!DIRS! docs
set DIRS=!DIRS! scripts
set DIRS=!DIRS! docker\backend
set DIRS=!DIRS! docker\frontend

rem ディレクトリ作成
for %%D in (!DIRS!) do (
    mkdir "%ROOT_DIR%\%%D" 2>nul
)

echo フォルダ構成を作成しました。
endlocal
