<#
LightFabric: обновление цехового приложения на сервере фабрики (Windows / IIS).
Совместимо с Windows PowerShell 2.0 (Windows Server 2008 R2): без Invoke-WebRequest,
ConvertFrom-Json, Expand-Archive и Get-Content -Raw.

Что делает: берёт последний выпуск из GitHub Releases, сравнивает с установленной
версией (version.json в папке приложения), скачивает архив, распаковывает рядом
и меняет папки местами. Предыдущая версия остаётся в <каталог>.prev,
вернуть её: тот же скрипт с ключом -Rollback.

Требования: TLS 1.2 (GitHub другого не принимает), то есть .NET Framework 4.5
или новее и PowerShell, запущенный на нём. На Server 2008 R2 с PowerShell 2.0
это либо WMF 5.1, либо файл powershell.exe.config с supportedRuntime v4.0,
см. 1С-Арсену/Установка_и_обновление.md. Скрипт сам проверяет и пишет,
чего не хватает.

Запуск вручную:
  powershell -NoProfile -ExecutionPolicy Bypass -File C:\lightfabric\update-lightfabric.ps1

По расписанию (от имени SYSTEM, каждые 30 минут):
  schtasks /Create /TN "LightFabric update" /SC MINUTE /MO 30 /RU SYSTEM /F ^
    /TR "powershell -NoProfile -ExecutionPolicy Bypass -File C:\lightfabric\update-lightfabric.ps1"

Параметры: -SiteRoot (корень сайта IIS), -Folder (каталог приложения),
-Repo (репозиторий), -Force (поставить заново ту же версию), -Rollback.
Журнал: update-lightfabric.log в корне сайта.
#>
param(
  [string]$Repo = "LightCompany-creator/light-fabric",
  [string]$SiteRoot = "C:\inetpub\wwwroot",
  [string]$Folder = "lightfabric",
  [switch]$Force,
  [switch]$Rollback,
  [switch]$ForceShellUnzip
)

$ErrorActionPreference = "Stop"

$live = Join-Path $SiteRoot $Folder
$prev = "$live.prev"
$new = "$live.new"
$log = Join-Path $SiteRoot "update-lightfabric.log"
$userAgent = "lightfabric-updater"

function Log($text) {
  $line = "{0:yyyy-MM-dd HH:mm:ss} {1}" -f (Get-Date), $text
  Write-Host $line
  Add-Content -Path $log -Value $line -Encoding UTF8
}

function ReadText($file) {
  return ((Get-Content -Path $file -Encoding UTF8) -join "`n")
}

function InstalledVersion {
  $file = Join-Path $live "version.json"
  if (-not (Test-Path $file)) { return "" }
  $m = [regex]::Match((ReadText $file), '"version"\s*:\s*"([^"]+)"')
  if ($m.Success) { return $m.Groups[1].Value }
  return ""
}

function NewClient {
  $wc = New-Object System.Net.WebClient
  $wc.Headers.Add("User-Agent", $userAgent)
  return $wc
}

function EnableTls12 {
  # GitHub принимает только TLS 1.2. Он есть в .NET 4.5+, значение 3072.
  if ([Environment]::Version.Major -lt 4) {
    Log "PowerShell работает на .NET $([Environment]::Version), TLS 1.2 недоступен. Нужен .NET 4.5+ и PowerShell на нём (WMF 5.1 или powershell.exe.config), см. инструкцию."
    exit 2
  }
  try {
    [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor 3072
  } catch {
    Log "Не удалось включить TLS 1.2: $($_.Exception.Message). Нужен .NET 4.5+ и включённый TLS 1.2 в системе."
    exit 2
  }
}

function Unzip($zip, $dest) {
  New-Item -ItemType Directory -Path $dest -Force | Out-Null
  if (-not $ForceShellUnzip) {
    try {
      Add-Type -AssemblyName System.IO.Compression.FileSystem -ErrorAction Stop
      [System.IO.Compression.ZipFile]::ExtractToDirectory($zip, $dest)
      return
    } catch {
      Log "Распаковка через .NET недоступна ($($_.Exception.Message)), распаковываю через проводник"
    }
  }
  # Shell.Application есть и на Server 2008 R2. CopyHere работает в фоне,
  # поэтому ждём, пока в распакованной папке появится version.json.
  $shell = New-Object -ComObject Shell.Application
  $items = $shell.NameSpace($zip).Items()
  $shell.NameSpace($dest).CopyHere($items, 1044)
  $marker = Join-Path (Join-Path $dest $Folder) "version.json"
  $deadline = (Get-Date).AddMinutes(10)
  while (-not (Test-Path $marker) -and ((Get-Date) -lt $deadline)) { Start-Sleep -Seconds 2 }
  Start-Sleep -Seconds 5
  if (-not (Test-Path $marker)) { Log "Распаковка не завершилась за 10 минут"; exit 1 }
}

function Swap($from, $to) {
  # IIS не держит папки со статикой, переименование обычно проходит. Если нет,
  # копируем файлы поверх: это дольше, но тоже приводит к новой версии.
  try {
    if (Test-Path $to) { Rename-Item -Path $to -NewName (Split-Path $prev -Leaf) -ErrorAction Stop }
    Rename-Item -Path $from -NewName (Split-Path $to -Leaf) -ErrorAction Stop
  } catch {
    Log "Переименовать не удалось ($($_.Exception.Message)), копирую поверх"
    & robocopy $from $to /MIR /NFL /NDL /NJH /NJS | Out-Null
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

EnableTls12

$installed = InstalledVersion
$client = NewClient
try {
  $json = $client.DownloadString("https://api.github.com/repos/$Repo/releases/latest")
} catch {
  Log "GitHub недоступен: $($_.Exception.Message)"
  exit 1
}
$tag = [regex]::Match($json, '"tag_name"\s*:\s*"([^"]+)"')
if (-not $tag.Success) { Log "Не удалось прочитать версию выпуска"; exit 1 }
$version = $tag.Groups[1].Value -replace '^v', ''
if ($version -eq $installed -and -not $Force) { Log "Стоит актуальная версия $installed"; exit 0 }

$pattern = '"browser_download_url"\s*:\s*"([^"]*/' + [regex]::Escape($Folder) + '-[^"/]*\.zip)"'
$asset = [regex]::Match($json, $pattern)
if (-not $asset.Success) { Log "В выпуске $version нет архива $Folder-*.zip"; exit 1 }
$url = $asset.Groups[1].Value

$zip = Join-Path $env:TEMP "$Folder-$version.zip"
$unpack = Join-Path $env:TEMP "$Folder-unpack"
Log "Скачиваю $url"
$client = NewClient
$client.DownloadFile($url, $zip)
if (Test-Path $unpack) { Remove-Item $unpack -Recurse -Force }
Unzip $zip $unpack
$src = Join-Path $unpack $Folder
if (-not (Test-Path $src)) { Log "В архиве нет папки $Folder"; exit 1 }

if (Test-Path $new) { Remove-Item $new -Recurse -Force }
if (Test-Path $prev) { Remove-Item $prev -Recurse -Force }
Move-Item -Path $src -Destination $new
Swap $new $live
Remove-Item $zip -Force -ErrorAction SilentlyContinue
Remove-Item $unpack -Recurse -Force -ErrorAction SilentlyContinue
$was = $installed
if (-not $was) { $was = "ничего" }
Log "Обновлено: $was -> $(InstalledVersion)"
