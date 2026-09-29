Add-Type @"
  using System;
  using System.Text;
  using System.Runtime.InteropServices;

  public class WindowHelper {
    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);

    [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);
  }
"@

[WindowHelper]::EnumWindows({
    param($hWnd, $lParam)
    $sb = New-Object System.Text.StringBuilder 256
    [WindowHelper]::GetWindowText($hWnd, $sb, $sb.Capacity) | Out-Null
    $title = $sb.ToString()
    if ($title -match "Android Emulator") {
        Write-Host "Found Window: $title (Handle: $hWnd)"
        [WindowHelper]::ShowWindow($hWnd, 9) # SW_RESTORE
        [WindowHelper]::SetForegroundWindow($hWnd)
        Write-Host "Brought to front!"
    }
    return $true
}, [IntPtr]::Zero)
