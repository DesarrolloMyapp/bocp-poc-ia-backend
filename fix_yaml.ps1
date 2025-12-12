$files = Get-ChildItem -Path . -Recurse -Filter *.yml
foreach ($file in $files) {
    $content = Get-Content $file.FullName
    $newContent = @()
    $modified = $false
    for ($i = 0; $i -lt $content.Count; $i++) {
        $line = $content[$i]
        if ($line -match "^\s*package:\s*$") {
            # Check if next line is mysql2
            if ($i + 1 -lt $content.Count -and $content[$i+1] -match "^\s*mysql2\s*$") {
                $i++ # Skip next line too
                $modified = $true
                continue
            }
        }
        $newContent += $line
    }
    if ($modified) {
        Write-Host "Fixing $($file.FullName)"
        $newContent | Set-Content $file.FullName
    }
}
