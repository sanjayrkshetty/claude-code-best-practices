# setup.ps1 — register Auto Git Agent as a Windows Task Scheduler job
# Run once: cd auto-git-agent && .\setup.ps1
# Runs daily at 09:30 (30 min after the daily streak agent at 09:00)

$taskName   = "JarvisAutoGit"
$scriptPath = "$PSScriptRoot\index.js"
$nodePath   = (Get-Command node -ErrorAction SilentlyContinue)?.Source
$groqKey    = (Get-Content "$PSScriptRoot\..\dashboard\.env.local" -ErrorAction SilentlyContinue |
               Select-String "GROQ_API_KEY=(.+)" | ForEach-Object { $_.Matches[0].Groups[1].Value })

if (-not $nodePath) { Write-Error "Node.js not in PATH"; exit 1 }

if (Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue) {
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
}

# Build action — pass GROQ_API_KEY via environment
$action   = New-ScheduledTaskAction `
    -Execute $nodePath `
    -Argument "`"$scriptPath`"" `
    -WorkingDirectory $PSScriptRoot

$trigger  = New-ScheduledTaskTrigger -Daily -At "09:30"
$settings = New-ScheduledTaskSettingsSet `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 10) `
    -StartWhenAvailable `
    -RunOnlyIfNetworkAvailable

$principal = New-ScheduledTaskPrincipal `
    -UserId "$env:USERDOMAIN\$env:USERNAME" `
    -LogonType Interactive `
    -RunLevel Limited

Register-ScheduledTask `
    -TaskName   $taskName `
    -Action     $action `
    -Trigger    $trigger `
    -Settings   $settings `
    -Principal  $principal `
    -Description "JARVIS: auto-commit real changes across all repos using Groq AI messages" `
    | Out-Null

# Inject GROQ_API_KEY into the task environment
if ($groqKey) {
    $task = Get-ScheduledTask -TaskName $taskName
    $task.Principal.RunLevel = "Limited"
    # Set env var at system level for this user session only
    [System.Environment]::SetEnvironmentVariable("GROQ_API_KEY", $groqKey, "User")
    Write-Host "  GROQ_API_KEY set in user environment variables" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "✓ Task '$taskName' registered — runs daily at 09:30" -ForegroundColor Green
Write-Host "  Script: $scriptPath"
Write-Host ""
Write-Host "Commands:"
Write-Host "  Run now (test):  node `"$scriptPath`""
Write-Host "  Dry run:         node `"$scriptPath`" --dry-run"
Write-Host "  One repo:        node `"$scriptPath`" --repo=portfolio"
Write-Host "  View log:        Get-Content `"$PSScriptRoot\auto-git.log`" -Tail 30"
Write-Host "  Remove task:     Unregister-ScheduledTask -TaskName '$taskName' -Confirm:`$false"
