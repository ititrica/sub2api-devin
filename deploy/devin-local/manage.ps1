param(
    [ValidateSet('start', 'stop', 'restart', 'status', 'logs', 'rebuild')]
    [string]$Action = 'status'
)

$ErrorActionPreference = 'Stop'
$composeFile = Join-Path $PSScriptRoot 'compose.yaml'
$envFile = Join-Path $PSScriptRoot '.env'
if (-not (Test-Path -LiteralPath $envFile)) {
    throw "Missing local credentials: $envFile"
}
$composeArgs = @('compose', '--project-name', 'sub2api-devin-local', '--env-file', $envFile, '-f', $composeFile)
switch ($Action) {
    'start'   { & docker @composeArgs up -d --no-build }
    'stop'    { & docker @composeArgs stop }
    'restart' { & docker @composeArgs restart }
    'status'  { & docker @composeArgs ps }
    'logs'    { & docker @composeArgs logs --tail 100 sub2api }
    'rebuild' {
        & docker @composeArgs build sub2api
        if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
        & docker @composeArgs up -d --no-build
    }
}
exit $LASTEXITCODE
