$ErrorActionPreference = 'Stop'
$credentialPath = Join-Path (Split-Path -Parent $PSScriptRoot) '.env.staging-demo'
if (Test-Path -LiteralPath $credentialPath) {
    throw 'The credential file already exists. Edit it locally instead of overwriting it.'
}
function Read-MaskedKey([string] $label, [string] $prefix) {
    $secureValue = Read-Host $label -AsSecureString
    $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureValue)
    try {
        $plainValue = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
        if (-not $plainValue.StartsWith($prefix) -or $plainValue -match '[\r\n]') {
            throw 'Unexpected key format. No credentials were saved.'
        }
        return $plainValue
    } finally {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
        $secureValue.Dispose()
    }
}
$adminKey = Read-MaskedKey 'Staging secret API key (hidden)' 'sk_'
$storeKey = Read-MaskedKey 'Staging publishable API key (hidden)' 'pk_'
try {
    $content = "MEDUSA_ADMIN_API_KEY=$adminKey`nMEDUSA_PUBLISHABLE_KEY=$storeKey`n"
    [IO.File]::WriteAllText($credentialPath, $content, [Text.UTF8Encoding]::new($false))
    Write-Host 'Saved .env.staging-demo. Values were not displayed. Do not share this file.'
} finally {
    $adminKey = $null
    $storeKey = $null
    $content = $null
}
