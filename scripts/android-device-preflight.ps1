[CmdletBinding()]
param(
  [string] $Serial,
  [string] $OutputPath
)

$ErrorActionPreference = 'Stop'
$workspaceRoot = Split-Path -Parent $PSScriptRoot
if (-not $OutputPath) {
  $OutputPath = Join-Path $workspaceRoot 'outputs\audit-20260918\android-device-preflight.json'
}
$packageName = 'com.subscripttrack.app'
$requiredPermissions = @(
  'android.permission.POST_NOTIFICATIONS',
  'android.permission.SCHEDULE_EXACT_ALARM',
  'android.permission.RECEIVE_BOOT_COMPLETED'
)

$adb = Get-Command adb -ErrorAction SilentlyContinue
if (-not $adb) { throw 'adb bulunamadı. Android SDK platform-tools yolunu PATH içine ekleyin.' }

$devices = & $adb.Source devices -l | Select-Object -Skip 1 |
  Where-Object { $_ -match '\S' } |
  ForEach-Object {
    $parts = $_ -split '\s+'
    [pscustomobject]@{ Serial = $parts[0]; State = $parts[1]; Details = ($_ -replace '^\S+\s+\S+\s*', '') }
  }

if ($Serial) {
  $device = $devices | Where-Object Serial -eq $Serial
  if (-not $device) { throw "'$Serial' seri numaralı cihaz adb tarafından görülmüyor." }
} else {
  $authorized = @($devices | Where-Object State -eq 'device')
  if ($authorized.Count -ne 1) {
    $states = if ($devices) { ($devices | ForEach-Object { "$($_.Serial):$($_.State)" }) -join ', ' } else { 'cihaz yok' }
    throw "Tam olarak bir yetkili Android cihaz gerekli. Mevcut durum: $states"
  }
  $device = $authorized[0]
}

if ($device.State -ne 'device') {
  throw "Cihaz yetkili değil: $($device.Serial) durumu '$($device.State)'. Telefonda USB debugging iznini onaylayın."
}

function Invoke-Adb([string[]] $Arguments) {
  & $adb.Source '-s' $device.Serial @Arguments 2>$null
}

$sdk = (Invoke-Adb @('shell', 'getprop', 'ro.build.version.sdk')).Trim()
$androidVersion = (Invoke-Adb @('shell', 'getprop', 'ro.build.version.release')).Trim()
$model = (Invoke-Adb @('shell', 'getprop', 'ro.product.model')).Trim()
$manufacturer = (Invoke-Adb @('shell', 'getprop', 'ro.product.manufacturer')).Trim()
$packageDump = (Invoke-Adb @('shell', 'dumpsys', 'package', $packageName)) -join "`n"
$installed = $packageDump -match "Package \[$([regex]::Escape($packageName))\]"

$permissions = foreach ($permission in $requiredPermissions) {
  $status = if (-not $installed) {
    'not-installed'
  } elseif ($packageDump -match "(?s)$([regex]::Escape($permission)).{0,180}granted=true") {
    'granted'
  } elseif ($packageDump -match [regex]::Escape($permission)) {
    'declared-not-granted'
  } else {
    'not-declared-in-package'
  }
  [pscustomobject]@{ permission = $permission; status = $status }
}

$apkPath = Join-Path $PSScriptRoot '..\mobile\build\app\outputs\flutter-apk\app-debug.apk'
$apk = Get-Item $apkPath -ErrorAction SilentlyContinue
$report = [ordered]@{
  generatedAtUtc = (Get-Date).ToUniversalTime().ToString('o')
  package = $packageName
  device = [ordered]@{
    serial = $device.Serial
    model = $model
    manufacturer = $manufacturer
    androidVersion = $androidVersion
    sdk = $sdk
  }
  application = [ordered]@{
    installed = $installed
    debugApk = if ($apk) { [ordered]@{ path = $apk.FullName; bytes = $apk.Length; modifiedAtUtc = $apk.LastWriteTimeUtc.ToString('o') } } else { $null }
  }
  permissions = $permissions
}

$directory = Split-Path -Parent $OutputPath
New-Item -ItemType Directory -Force -Path $directory | Out-Null
$report | ConvertTo-Json -Depth 5 | Set-Content -Path $OutputPath -Encoding utf8

Write-Output "PASS Android cihaz preflight tamamlandı: $OutputPath"
$report | ConvertTo-Json -Depth 5
