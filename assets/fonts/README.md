# Inter Font Assets

Place the following Inter font `.ttf` files in this directory before building:

| File | Source |
|---|---|
| `Inter-Regular.ttf` | https://fonts.google.com/specimen/Inter |
| `Inter-Medium.ttf` | https://fonts.google.com/specimen/Inter |
| `Inter-SemiBold.ttf` | https://fonts.google.com/specimen/Inter |
| `Inter-Bold.ttf` | https://fonts.google.com/specimen/Inter |

## Quick download (one-liner)

```bash
# From the project root
curl -L "https://cdn.jsdelivr.net/gh/rsms/inter@v4.0/docs/font-files/Inter-Regular.ttf"  -o assets/fonts/Inter-Regular.ttf
curl -L "https://cdn.jsdelivr.net/gh/rsms/inter@v4.0/docs/font-files/Inter-Medium.ttf"   -o assets/fonts/Inter-Medium.ttf
curl -L "https://cdn.jsdelivr.net/gh/rsms/inter@v4.0/docs/font-files/Inter-SemiBold.ttf" -o assets/fonts/Inter-SemiBold.ttf
curl -L "https://cdn.jsdelivr.net/gh/rsms/inter@v4.0/docs/font-files/Inter-Bold.ttf"     -o assets/fonts/Inter-Bold.ttf
```

## Why local files?

`expo-font`'s `useFonts` hook works best with locally-bundled assets via `require()`.
Loading from a CDN URI requires network on first run, blocks the splash screen in offline
environments, and is not supported in production EAS builds without additional config.
