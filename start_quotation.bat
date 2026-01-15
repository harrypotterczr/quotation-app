@echo off
REM 切到脚本所在目录
cd /d "%~dp0"

REM 启动一个隐藏的 cmd，在里面跑 serve，独立于当前窗口
powershell -Command ^
  "Start-Process 'cmd.exe' -ArgumentList '/c','serve -s dist -l 4000' -WindowStyle Hidden"

exit /b