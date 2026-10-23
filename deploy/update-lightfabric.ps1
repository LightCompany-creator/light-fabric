<#
LightFabric: обновление цехового приложения на сервере фабрики (Windows / IIS).

Забирает последний выпуск из GitHub Releases, сравнивает с установленной
версией (version.json в папке приложения), скачивает архив, распаковывает
рядом и меняет папки местами. Предыдущая версия остаётся в папке
<каталог>.prev, вернуть её: тот же скрипт с ключом -Rollback.

Запуск вручную:
  powershell -NoProfile -ExecutionPolicy Bypass -File C:\lightfabric\update-lightfabric.ps1

По расписанию (от имени SYSTEM, перед сменами):
  schtasks /Create /TN "LightFabric update" /SC DAILY /ST 05:30 /RU SYSTEM /F ^
    /TR "powershell -NoProfile -ExecutionPolicy Bypass -File C:\lightfabric\update-lightfabric.ps1"
  schtasks /Create /TN "LightFabric update 2" /SC DAILY /ST 13:30 /RU SYSTEM /F ^
    /TR "powershell -NoProfile -ExecutionPolicy Bypass -File C:\lightfabric\update-lightfabric.ps1"

Параметры: -SiteRoot (корень сайта IIS), -Folder (каталог приложения),
-Repo (репозиторий), -Force (поставить заново ту же версию), -Rollback.
Журнал: update-lightfabric.log рядом с папкой приложения.
#>
param(
  [string]$Repo = "LightCompany-creator/light-fabric",
  [string]$SiteRoot = "C:\inetpub\wwwroot",
  [string]$Folder = "lightfabric",
  [switch]$Force,
  [switch]$Rollback
)

$ErrorActionPreference = "Stop"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$live = Join-Path $SiteRoot $Folder
$prev = "$live.prev"
$new = "$live.new"
$log = Join-Path $SiteRoot "update-lightfabric.log"
$headers = @{ "User-Agent" = "lightfabric-updater" }

function Log($text) {
  $line = "{0:yyyy-MM-dd HH:mm:ss} {1}" -f (Get-Date), $text
  Write-Host $line
  Add-Content -Path $log -Value $line -Encoding UTF8
}

function InstalledVersion {
  $file = Join-Path $live "version.json"
  if (Test-Path $file) { return (Get-Content $file -Raw -Encoding UTF8 | ConvertFrom-Json).version }
  return ""
}

function Swap($from, $to) {
  # IIS не держит папки со статикой, переименование обычно проходит. Если нет,
  # копируем файлы поверх: это дольше, но тоже приводит к новой версии.
  try {
    if (Test-Path $to) { Rename-Item -Path $to -NewName (Split-Path $prev -Leaf) -ErrorAction Stop }
    Rename-Item -Path $from -NewName (Split-Path $to -Leaf) -ErrorAction Stop
  } catch {
    Log "Переименовать не удалось ($($_.Exception.Message)), копирую поверх"
    robocopy $from $to /MIR /NFL /NDL /NJH /NJS | Out-Null
    Remove-Item $from -Recurse -Force
  }
}

if ($Rollback) {
  if (-not (Test-Path $prev)) { Log "Откатывать нечего: папки $prev нет"; exit 1 }
  $current = InstalledVersion
  if (Test-Path $live) { Rename-Item -Path $live -NewName "$Folder.rolledback" }
  Rename-Item -Path $prev -NewName $Folder
  if (Test-Path "$live.rolledback") { Rename-Item -Path "$live.rolledback" -NewName "$Folder.prev" }
  Log "Откат: $current -> $(InstalledVersion)"
  exit 0
}

$installed = InstalledVersion
$release = Invoke-RestMethod -Uri "https://api.github.com/repos/$Repo/releases/latest" -Headers $headers
$version = $release.tag_name -replace '^v', ''
if ($version -eq $installed -and -not $Force) { Log "Стоит актуальная версия $installed"; exit 0 }

$asset = $release.assets | Where-Object { $_.name -like "$Folder-*.zip" } | Select-Object -First 1
if (-not $asset) { Log "В выпуске $version нет архива $Folder-*.zip"; exit 1 }

$zip = Join-Path $env:TEMP "$Folder-$version.zip"
$unpack = Join-Path $env:TEMP "$Folder-unpack"
Log "Скачиваю $($asset.name)"
Invoke-WebRequest -Uri $asset.browser_download_url -OutFile $zip -Headers $headers
if (Test-Path $unpack) { Remove-Item $unpack -Recurse -Force }
Expand-Archive -LiteralPath $zip -DestinationPath $unpack -Force
$src = Join-Path $unpack $Folder
if (-not (Test-Path $src)) { Log "В архиве нет папки $Folder"; exit 1 }

if (Test-Path $new) { Remove-Item $new -Recurse -Force }
if (Test-Path $prev) { Remove-Item $prev -Recurse -Force }
Move-Item -Path $src -Destination $new
Swap $new $live
Remove-Item $zip, $unpack -Recurse -Force -ErrorAction SilentlyContinue
Log "Обновлено: $(if ($installed) { $installed } else { 'ничего' }) -> $(InstalledVersion)"
