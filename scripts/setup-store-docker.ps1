param(
    [string]$ComposeFile = 'docker-compose.yml',
    [string]$EnvFile = '.env',
    [switch]$Start,
    [switch]$Plan
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
Push-Location $projectRoot
try {
    $composeArgs = @('compose', '--env-file', $EnvFile, '-f', $ComposeFile)
    if ($Plan) {
        if ($Start) { Write-Output 'Build and start Medusa, its worker and database dependencies; wait for readiness.' }
        Write-Output 'Use the existing Medusa container to configure Morocco/MAD, the sales channel and publishable key.'
        Write-Output 'Configure the stock location, free Morocco shipping and cash on delivery.'
        Write-Output 'Copy connection values to the Compose env file and existing storefront .env.'
        Write-Output 'Recreate only the storefront container to load those values. No changes made.'
        return
    }
    if (!(Test-Path -LiteralPath $EnvFile -PathType Leaf)) { throw "Missing Compose environment file: $EnvFile" }
    if (!(Test-Path -LiteralPath $ComposeFile -PathType Leaf)) { throw "Missing Compose file: $ComposeFile" }

    function Invoke-Compose {
        param([string[]]$DockerArguments)
        & docker @composeArgs @DockerArguments
        if ($LASTEXITCODE -ne 0) { throw 'Docker setup failed. Fix the reported error and rerun this script; previous steps may have completed.' }
    }

    if ($Start) {
        Invoke-Compose -DockerArguments @('up', '-d', '--build', '--wait', '--wait-timeout', '180', 'medusa', 'worker')
    }
    $runningServices = @(Invoke-Compose -DockerArguments @('ps', '--services', '--status', 'running'))
    if ($runningServices -notcontains 'medusa') {
        throw 'Medusa is not running in this Compose project. Rerun this script with -Start to build/start it. If startup fails, inspect docker compose logs --tail 80 migrate medusa. For another stack, supply its -ComposeFile and -EnvFile.'
    }

    # The Dockerfile compiles Medusa scripts to JavaScript under /app/src/scripts.
    Invoke-Compose -DockerArguments @('exec', '-T', '-e', 'MEDUSA_WORKER_MODE=shared', 'medusa', 'node', 'node_modules/@medusajs/cli/cli.js', 'exec', './src/scripts/setup-catalog.js')
    Invoke-Compose -DockerArguments @('exec', '-T', '-e', 'MEDUSA_WORKER_MODE=shared', '-e', 'AMOON_DELIVERY_FEE=0', 'medusa', 'node', 'node_modules/@medusajs/cli/cli.js', 'exec', './src/scripts/setup-checkout.js')

    # Capture privately: do not print generated connection values.
    $catalogJson = Invoke-Compose -DockerArguments @('exec', '-T', 'medusa', 'node', '-p', "JSON.stringify(require('./.catalog-setup.json'))")
    $catalog = ($catalogJson -join "`n") | ConvertFrom-Json
    if ($catalog.publishable_key -cnotmatch '^pk_[a-zA-Z0-9]+$' -or
        $catalog.region_id -cnotmatch '^reg_[a-zA-Z0-9]+$' -or
        $catalog.sales_channel_id -cnotmatch '^sc_[a-zA-Z0-9]+$') {
        throw 'Invalid catalog output; environment connection values were not changed.'
    }
    $values = [ordered]@{
        MEDUSA_PUBLISHABLE_KEY = $catalog.publishable_key
        MEDUSA_REGION_ID = $catalog.region_id
        MEDUSA_SALES_CHANNEL_ID = $catalog.sales_channel_id
    }
    $envTargets = @((Resolve-Path -LiteralPath $EnvFile).Path)
    $storefrontEnv = Join-Path $projectRoot 'apps/storefront/.env'
    if (Test-Path -LiteralPath $storefrontEnv -PathType Leaf) { $envTargets += $storefrontEnv }
    $utf8 = New-Object System.Text.UTF8Encoding($false)
    foreach ($target in ($envTargets | Select-Object -Unique)) {
        $contents = [System.IO.File]::ReadAllText($target)
        foreach ($key in $values.Keys) {
            $pattern = '(?m)^' + $key + '=[^\r\n]*'
            $line = $key + '=' + $values[$key]
            if ([regex]::IsMatch($contents, $pattern)) { $contents = [regex]::Replace($contents, $pattern, $line) }
            else { $contents = $contents.TrimEnd() + "`n" + $line + "`n" }
        }
        [System.IO.File]::WriteAllText($target, $contents, $utf8)
    }

    # Restart alone does not reload Compose environment values.
    Invoke-Compose -DockerArguments @('up', '-d', '--no-deps', '--force-recreate', '--wait', '--wait-timeout', '180', 'storefront')
    Write-Output 'Morocco/MAD, sales channel, stock location, free shipping and COD configured. Storefront recreated with its connection values.'
    Write-Output 'Products, MAD prices, inventory, dispatch address and your admin account still need to be present in Medusa. No sample orders or inventory were created.'
}
finally { Pop-Location }
