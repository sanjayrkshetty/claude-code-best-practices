# setup-scheduler.ps1
# Registers the daily commit agent as a Windows Task Scheduler job.
# Run ONCE as the current user (no admin needed for user-scoped tasks).
#
# Usage: Right-click → "Run with PowerShell" OR in terminal:
#   cd daily-agent && .\setup-scheduler.ps1

$taskName    = "JarvisDailyCommit"
$scriptPath  = "$PSScriptRoot\agent.js"
$nodePath    = (Get-Command node -ErrorAction SilentlyContinue)?.Source

if (-not $nodePath) {
    Write-Error "Node.js not found in PATH. Install Node.js first."
    exit 1
}

# Remove existing task if it exists
if (Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue) {
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
    Write-Host "Removed existing task: $taskName"
}

# Action: node agent.js
$action = New-ScheduledTaskAction `
    -Execute $nodePath `
    -Argument "`"$scriptPath`"" `
    -WorkingDirectory $PSScriptRoot

# Triggers: daily at 09:00 + at logon (catches days PC was off at 9am)
$triggerDaily  = New-ScheduledTaskTrigger -Daily -At "09:00"
$triggerLogon  = New-ScheduledTaskTrigger -AtLogOn -User "$env:USERDOMAIN\$env:USERNAME"

# Settings: run even if missed, no AC requirement, network required
$settings = New-ScheduledTaskSettingsSet `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 10) `
    -StartWhenAvailable `
    -RunOnlyIfNetworkAvailable `
    -RunOnlyIfIdle:$false

# Principal: current user (no elevation needed)
$principal = New-ScheduledTaskPrincipal `
    -UserId "$env:USERDOMAIN\$env:USERNAME" `
    -LogonType Interactive `
    -RunLevel Limited

Register-ScheduledTask `
    -TaskName    $taskName `
    -Action      $action `
    -Trigger     @($triggerDaily, $triggerLogon) `
    -Settings    $settings `
    -Principal   $principal `
    -Description "JARVIS: daily repo improver — AI-driven README improvements + profile research log" `
    | Out-Null

Write-Host ""
Write-Host "✓ Task '$taskName' registered — runs daily at 09:00 + at each logon" -ForegroundColor Green
Write-Host "  Script : $scriptPath"
Write-Host "  Node   : $nodePath"
Write-Host "  Missed : runs as soon as possible after missed schedule (StartWhenAvailable)"
Write-Host ""
Write-Host "To run immediately and test:"
Write-Host "  Start-ScheduledTask -TaskName '$taskName'"
Write-Host ""
Write-Host "To view logs:"
Write-Host "  Get-Content '$PSScriptRoot\run.log' -Tail 20"
Write-Host ""
Write-Host "To remove:"
Write-Host "  Unregister-ScheduledTask -TaskName '$taskName' -Confirm:`$false"
