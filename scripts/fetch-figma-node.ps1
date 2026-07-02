param(
  [Parameter(Mandatory = $true)]
  [string]$NodeId = "72:1334",

  [string]$FileKey = "QdGiKrY22RbmtO8dfiAvTQ",

  [string]$OutDir = "$PSScriptRoot\..\assets"
)

$token = $env:FIGMA_TOKEN
if (-not $token) {
  Write-Error "Set FIGMA_TOKEN env var first. Create token: Figma → Settings → Security → Personal access tokens"
  exit 1
}

$normalizedNode = $NodeId -replace '-', ':'
$headers = @{ "X-Figma-Token" = $token }

$imageApi = "https://api.figma.com/v1/images/$FileKey?ids=$normalizedNode&format=png&scale=2"
$imageRes = Invoke-RestMethod -Uri $imageApi -Headers $headers
$url = $imageRes.images.$normalizedNode
if (-not $url) {
  Write-Error "Figma did not return image URL for node $normalizedNode"
  exit 1
}

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
$outFile = Join-Path $OutDir "transfer-reference.png"
Invoke-WebRequest -Uri $url -OutFile $outFile
Write-Host "Saved $outFile"
