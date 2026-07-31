param(
    [Parameter(Position = 0)]
    [string]$Question
)

$ErrorActionPreference = 'Stop'
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

$LocalGraphify = Join-Path $ProjectRoot '.venv\Scripts\graphify.exe'
$GlobalGraphify = Get-Command graphify -ErrorAction SilentlyContinue

if (Test-Path $LocalGraphify) {
    $GraphifyCommand = $LocalGraphify
} elseif ($GlobalGraphify) {
    $GraphifyCommand = $GlobalGraphify.Source
} else {
    throw 'Graphify bulunamadı. .venv kurulumu veya graphifyy yüklemesi gerekli.'
}

if ([string]::IsNullOrWhiteSpace($Question)) {
    if (Test-Path '.\graphify-out\graph.json') {
        & $GraphifyCommand query 'Projenin ana mimari bileşenleri ve aralarındaki ilişkiler nelerdir?'
    } else {
        & $GraphifyCommand . --no-viz
    }
} elseif (Test-Path '.\graphify-out\graph.json') {
    & $GraphifyCommand query $Question
} else {
    Write-Warning 'Graphify graphı henüz yok; önce graphify taraması çalıştırılıyor.'
    & $GraphifyCommand . --no-viz
    if (Test-Path '.\graphify-out\graph.json') {
        & $GraphifyCommand query $Question
    }
}
