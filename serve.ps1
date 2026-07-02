$port = 8765
$root = $PSScriptRoot
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://127.0.0.1:$port/")
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()

Write-Host "Flarius prototype: http://localhost:$port/"
Write-Host "Press Ctrl+C to stop."

while ($listener.IsListening) {
  $context = $listener.GetContext()
  $request = $context.Request
  $response = $context.Response

  $relativePath = [System.Uri]::UnescapeDataString($request.Url.AbsolutePath.TrimStart('/'))
  if ([string]::IsNullOrWhiteSpace($relativePath)) {
    $relativePath = 'index.html'
  }

  $filePath = Join-Path $root ($relativePath -replace '/', '\')

  if (Test-Path $filePath -PathType Leaf) {
    $bytes = [System.IO.File]::ReadAllBytes($filePath)
    $extension = [System.IO.Path]::GetExtension($filePath).ToLowerInvariant()
    $contentType = switch ($extension) {
      '.html' { 'text/html; charset=utf-8' }
      '.css' { 'text/css; charset=utf-8' }
      '.js' { 'text/javascript; charset=utf-8' }
      '.svg' { 'image/svg+xml' }
      '.png' { 'image/png' }
      '.jpg' { 'image/jpeg' }
      '.jpeg' { 'image/jpeg' }
      default { 'application/octet-stream' }
    }
    $response.ContentType = $contentType
    $response.StatusCode = 200
    $response.OutputStream.Write($bytes, 0, $bytes.Length)
  } else {
    $notFound = [System.Text.Encoding]::UTF8.GetBytes('404 Not Found')
    $response.StatusCode = 404
    $response.ContentType = 'text/plain; charset=utf-8'
    $response.OutputStream.Write($notFound, 0, $notFound.Length)
  }

  $response.Close()
}
