[CmdletBinding(SupportsShouldProcess = $true, ConfirmImpact = 'High')]
param(
  [ValidateNotNullOrEmpty()]
  [string]$Bucket = 'foto-siswa',

  [string]$ZipPath = (Join-Path $HOME 'Downloads\XII.RPL.zip'),

  [switch]$Upsert
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path -LiteralPath $ZipPath -PathType Leaf)) {
  throw "ZIP file not found: $ZipPath"
}

$supabaseUrl = $env:SUPABASE_URL
if ([string]::IsNullOrWhiteSpace($supabaseUrl)) {
  $supabaseUrl = $env:NEXT_PUBLIC_SUPABASE_URL
}
if ([string]::IsNullOrWhiteSpace($supabaseUrl)) {
  $supabaseUrl = 'https://pqjkihmvjikawttraetr.supabase.co'
}
$serviceRoleKey = $env:SUPABASE_SERVICE_ROLE_KEY

if ([string]::IsNullOrWhiteSpace($supabaseUrl)) {
  throw 'Set SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) in this PowerShell session.'
}
if ([string]::IsNullOrWhiteSpace($serviceRoleKey)) {
  throw 'Set SUPABASE_SERVICE_ROLE_KEY in this PowerShell session. Do not use the anon key.'
}

$baseUri = $null
if (-not [Uri]::TryCreate($supabaseUrl, [UriKind]::Absolute, [ref]$baseUri) -or $baseUri.Scheme -ne 'https') {
  throw 'SUPABASE_URL must be an absolute HTTPS URL.'
}

Add-Type -AssemblyName System.IO.Compression.FileSystem
Add-Type -AssemblyName System.Net.Http
$archive = [System.IO.Compression.ZipFile]::OpenRead((Resolve-Path -LiteralPath $ZipPath).Path)
$httpClient = [System.Net.Http.HttpClient]::new()

try {
  $entries = @(
    $archive.Entries | Where-Object {
      $_.FullName -match '^XII\.RPL-[1-4]/' -and -not $_.FullName.EndsWith('/')
    }
  )

  foreach ($class in 1..4) {
    $prefix = "XII.RPL-$class/"
    $classEntries = @($entries | Where-Object { $_.FullName.StartsWith($prefix) })
    if ($classEntries.Count -eq 0) {
      throw "No photos found for $($prefix.TrimEnd('/')) in the ZIP."
    }

    $invalidEntries = @(
      $classEntries | Where-Object {
        [IO.Path]::GetExtension($_.FullName).ToLowerInvariant() -notin @('.jpg', '.jpeg')
      }
    )
    if ($invalidEntries.Count -gt 0) {
      throw "Unexpected non-JPEG file in $($prefix.TrimEnd('/')): $($invalidEntries[0].FullName)"
    }
  }

  if (-not $PSCmdlet.ShouldProcess("$Bucket bucket", "Upload $($entries.Count) photos from $ZipPath")) {
    return
  }

  $escapedBucket = [Uri]::EscapeDataString($Bucket)
  $httpClient.DefaultRequestHeaders.Add('apikey', $serviceRoleKey)
  $httpClient.DefaultRequestHeaders.Authorization =
    [System.Net.Http.Headers.AuthenticationHeaderValue]::new('Bearer', $serviceRoleKey)

  foreach ($entry in $entries) {
    $objectPath = ($entry.FullName -split '/' | ForEach-Object {
      [Uri]::EscapeDataString($_)
    }) -join '/'
    $uploadUri = "$($baseUri.AbsoluteUri.TrimEnd('/'))/storage/v1/object/$escapedBucket/$objectPath"
    $request = [System.Net.Http.HttpRequestMessage]::new([System.Net.Http.HttpMethod]::Post, $uploadUri)
    $response = $null

    try {
      $memoryStream = [System.IO.MemoryStream]::new()
      try {
        $entryStream = $entry.Open()
        try {
          $entryStream.CopyTo($memoryStream)
        }
        finally {
          $entryStream.Dispose()
        }
        $content = [System.Net.Http.ByteArrayContent]::new($memoryStream.ToArray())
      }
      finally {
        $memoryStream.Dispose()
      }

      $content.Headers.ContentType =
        [System.Net.Http.Headers.MediaTypeHeaderValue]::new('image/jpeg')
      $request.Content = $content
      if ($Upsert) {
        $request.Headers.Add('x-upsert', 'true')
      }

      $response = $httpClient.SendAsync($request).GetAwaiter().GetResult()
      if (-not $response.IsSuccessStatusCode) {
        $details = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult()
        throw "Upload failed for '$($entry.FullName)': HTTP $([int]$response.StatusCode) $details"
      }
      else {
        Write-Output "Uploaded $($entry.FullName)"
      }
    }
    finally {
      if ($null -ne $response) {
        $response.Dispose()
      }
      $request.Dispose()
    }
  }

  Write-Output "Successfully uploaded $($entries.Count) photos to bucket '$Bucket'."
}
finally {
  $httpClient.Dispose()
  $archive.Dispose()
}
