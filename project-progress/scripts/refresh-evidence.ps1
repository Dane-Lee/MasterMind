param(
  [switch]$Static,
  [string]$OutFile
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$trackerRoot = Split-Path -Parent $scriptDir
$projectsPath = Join-Path $trackerRoot "projects.json"
$projectsData = Get-Content -LiteralPath $projectsPath -Raw | ConvertFrom-Json

function Get-PathMetadata {
  param([string]$Path)

  $item = Get-Item -LiteralPath $Path -ErrorAction SilentlyContinue
  if (-not $item) {
    return [ordered]@{
      path = $Path
      exists = $false
      type = $null
      lastWriteTime = $null
      length = $null
    }
  }

  return [ordered]@{
    path = $item.FullName
    exists = $true
    type = if ($item.PSIsContainer) { "directory" } else { "file" }
    lastWriteTime = $item.LastWriteTime.ToString("o")
    length = if ($item.PSIsContainer) { $null } else { $item.Length }
  }
}

function Get-PackageScripts {
  param([string]$CodePath)

  $packagePath = Join-Path $CodePath "package.json"
  if (-not (Test-Path -LiteralPath $packagePath)) {
    return $null
  }

  try {
    $packageJson = Get-Content -LiteralPath $packagePath -Raw | ConvertFrom-Json
    $scripts = [ordered]@{}
    if ($packageJson.scripts) {
      foreach ($script in $packageJson.scripts.PSObject.Properties) {
        $scripts[$script.Name] = $script.Value
      }
    }

    return [ordered]@{
      packagePath = $packagePath
      name = $packageJson.name
      version = $packageJson.version
      scripts = $scripts
    }
  } catch {
    return [ordered]@{
      packagePath = $packagePath
      error = $_.Exception.Message
    }
  }
}

function Protect-SensitiveLine {
  param([string]$Line)

  if ($Line -match "(?i)(password|credential|secret|service[_-]?role|jwt[_-]?secret|api[_-]?key)") {
    return "[redacted sensitive status line]"
  }

  return $Line
}

function Get-GitSnapshot {
  param([string]$RootPath)

  $gitDir = Join-Path $RootPath ".git"
  if (-not (Test-Path -LiteralPath $gitDir)) {
    return [ordered]@{
      isGitRepo = $false
      status = @()
      recentCommits = @()
    }
  }

  $status = @()
  $recentCommits = @()

  try {
    $status = @(git -c "safe.directory=$RootPath" -C $RootPath status --short --branch 2>&1 | ForEach-Object { Protect-SensitiveLine -Line "$_" })
  } catch {
    $status = @("git status failed: $($_.Exception.Message)")
  }

  try {
    $recentCommits = @(git -c "safe.directory=$RootPath" -C $RootPath log --max-count=5 --date=short --pretty=format:"%h %ad %s" 2>&1 | ForEach-Object { Protect-SensitiveLine -Line "$_" })
  } catch {
    $recentCommits = @("git log failed or no commits yet: $($_.Exception.Message)")
  }

  return [ordered]@{
    isGitRepo = $true
    status = $status
    recentCommits = $recentCommits
  }
}

function Get-SourceMetadata {
  param([object[]]$SourceDocs)

  $result = @()
  foreach ($source in ($SourceDocs | Where-Object { $_ })) {
    $path = [string]$source.path
    if ($path -match "(?i)(password|credential|secret)") {
      $result += [ordered]@{
        title = $source.title
        path = $path
        skipped = $true
        reason = "Sensitive title pattern"
      }
      continue
    }

    $metadata = Get-PathMetadata -Path $path
    $metadata["title"] = $source.title
    $metadata["sourceType"] = $source.sourceType
    $result += $metadata
  }

  return $result
}

$snapshot = [ordered]@{
  generatedAt = (Get-Date).ToString("o")
  mode = if ($Static) { "static" } else { "write" }
  trackerPath = $trackerRoot
  projects = @()
}

foreach ($project in $projectsData.projects) {
  $activePaths = @()
  $packageScripts = @()
  foreach ($codePath in $project.activeCodePaths) {
    $activePaths += Get-PathMetadata -Path ([string]$codePath)
    $packageInfo = Get-PackageScripts -CodePath ([string]$codePath)
    if ($packageInfo) {
      $packageScripts += $packageInfo
    }
  }

  $snapshot.projects += [ordered]@{
    id = $project.id
    name = $project.name
    root = Get-PathMetadata -Path ([string]$project.rootPath)
    activeCodePaths = $activePaths
    packageScripts = $packageScripts
    verificationCommands = $project.verificationCommands
    sourceDocs = Get-SourceMetadata -SourceDocs $project.sourceDocs
    git = Get-GitSnapshot -RootPath ([string]$project.rootPath)
  }
}

if ($Static) {
  $snapshot | ConvertTo-Json -Depth 20
  exit 0
}

if (-not $OutFile) {
  $date = Get-Date -Format "yyyy-MM-dd"
  $OutFile = Join-Path (Join-Path $trackerRoot "evidence") "evidence-$date.json"
}

$outDir = Split-Path -Parent $OutFile
if ($outDir) {
  New-Item -ItemType Directory -Force -Path $outDir | Out-Null
}

$snapshot | ConvertTo-Json -Depth 20 | Set-Content -LiteralPath $OutFile -Encoding UTF8
Write-Output "Evidence snapshot written to $OutFile"
