@echo off
IF NOT EXIST "dist\index.html" (
  echo [INFO] 未找到 dist/index.html，正在执行构建...
  call npm run build
)

powershell -Command ^
  "Start-Process 'cmd.exe' -ArgumentList '/c','npm run preview -- --port 4000' -WindowStyle Hidden"

exit /b
