// WCAG 2.1 contrast checker — used to verify the palette meets 1.4.3 (text) and
// 1.4.11 (non-text/UI) before committing any color token. Not shipped; a dev tool.
// Formula: WCAG relative luminance + (L1 + 0.05) / (L2 + 0.05).
//
// Colors ship as oklch() (see app/globals.css). This parses BOTH oklch() and
// hex, converting either to sRGB first, so the proof runs on the shipped values.
// With no CLI args it runs the full light+dark token matrix defined below.

function srgbToLinear(c) {
  const cs = c / 255
  return cs <= 0.03928 ? cs / 12.92 : ((cs + 0.055) / 1.055) ** 2.4
}

// oklch() -> sRGB [r,g,b] 0..255, via OKLab (CSS Color 4 matrices).
function oklchToRgb(L, C, H) {
  const hr = (H * Math.PI) / 180
  const a = C * Math.cos(hr)
  const b = C * Math.sin(hr)
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b
  const s_ = L - 0.0894841775 * a - 1.291485548 * b
  const l = l_ ** 3
  const m = m_ ** 3
  const s = s_ ** 3
  const lr = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
  const lg = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
  const lb = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
  const enc = (v) => {
    const g = v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055
    return Math.round(Math.max(0, Math.min(1, g)) * 255)
  }
  return [enc(lr), enc(lg), enc(lb)]
}

// Accepts '#rrggbb', '#rgb', or 'oklch(L C H)' -> [r,g,b] 0..255.
function toRgb(color) {
  const c = color.trim()
  const ok = c.match(/^oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([\d.]+)\s*\)$/i)
  if (ok) {
    const L = ok[1].endsWith('%') ? parseFloat(ok[1]) / 100 : parseFloat(ok[1])
    return oklchToRgb(L, parseFloat(ok[2]), parseFloat(ok[3]))
  }
  const h = c.replace('#', '')
  const full =
    h.length === 3
      ? h
          .split('')
          .map((x) => x + x)
          .join('')
      : h
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ]
}

function luminance(color) {
  const [r, g, b] = toRgb(color)
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b)
}

export function ratio(fg, bg) {
  const l1 = luminance(fg)
  const l2 = luminance(bg)
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1]
  return (hi + 0.05) / (lo + 0.05)
}

// grade(pair) -> which WCAG bars it clears
function grade(r, kind) {
  if (kind === 'ui') return r >= 3 ? 'AA-ui ✓' : 'FAIL (<3:1)'
  const marks = []
  marks.push(r >= 4.5 ? 'AA' : 'aa✗')
  marks.push(r >= 7 ? 'AAA' : 'aaa✗')
  marks.push(r >= 3 ? 'AA-large' : 'large✗')
  return marks.join(' ')
}

// The shipped tokens (app/globals.css). Single source for the built-in matrix.
const LIGHT = {
  background: 'oklch(0.982 0.004 250)',
  foreground: 'oklch(0.300 0.012 260)',
  card: 'oklch(0.966 0.005 250)',
  primary: 'oklch(0.520 0.170 275)',
  'primary-foreground': 'oklch(0.985 0.004 250)',
  secondary: 'oklch(0.470 0.070 200)',
  'secondary-foreground': 'oklch(0.985 0.004 250)',
  'muted-foreground': 'oklch(0.455 0.012 255)',
  destructive: 'oklch(0.520 0.165 27)',
  'destructive-foreground': 'oklch(0.985 0.004 250)',
  success: 'oklch(0.490 0.100 155)',
  'success-foreground': 'oklch(0.985 0.004 250)',
  input: 'oklch(0.560 0.020 255)',
  ring: 'oklch(0.520 0.170 275)',
}
const DARK = {
  background: 'oklch(0.185 0.006 260)',
  foreground: 'oklch(0.885 0.010 250)',
  card: 'oklch(0.225 0.008 258)',
  primary: 'oklch(0.720 0.125 278)',
  'primary-foreground': 'oklch(0.185 0.006 260)',
  secondary: 'oklch(0.680 0.070 200)',
  'secondary-foreground': 'oklch(0.185 0.006 260)',
  'muted-foreground': 'oklch(0.715 0.015 255)',
  destructive: 'oklch(0.650 0.140 27)',
  'destructive-foreground': 'oklch(0.185 0.006 260)',
  success: 'oklch(0.680 0.090 155)',
  'success-foreground': 'oklch(0.185 0.006 260)',
  input: 'oklch(0.550 0.015 258)',
  ring: 'oklch(0.720 0.125 278)',
}

// [label, fgToken, bgToken, kind]
const MATRIX = [
  ['body text', 'foreground', 'background', 'text'],
  ['muted text on paper', 'muted-foreground', 'background', 'text'],
  ['muted text on card', 'muted-foreground', 'card', 'text'],
  ['primary button', 'primary-foreground', 'primary', 'text'],
  ['secondary button', 'secondary-foreground', 'secondary', 'text'],
  ['destructive button', 'destructive-foreground', 'destructive', 'text'],
  ['success button', 'success-foreground', 'success', 'text'],
  ['primary link on paper', 'primary', 'background', 'text'],
  ['primary link on card', 'primary', 'card', 'text'],
  ['ring on paper', 'ring', 'background', 'ui'],
  ['ring on card', 'ring', 'card', 'ui'],
  ['input border on paper', 'input', 'background', 'ui'],
  ['input border on card', 'input', 'card', 'ui'],
  ['primary fill on paper', 'primary', 'background', 'ui'],
  ['secondary fill on paper', 'secondary', 'background', 'ui'],
  ['destructive fill on paper', 'destructive', 'background', 'ui'],
  ['success fill on paper', 'success', 'background', 'ui'],
]

function runBuiltIn() {
  let fails = 0
  let worstText = Infinity
  let bodyRatio = 0
  for (const [name, tokens] of [
    ['LIGHT', LIGHT],
    ['DARK', DARK],
  ]) {
    console.log(`\n=== ${name} ===`)
    for (const [label, fgT, bgT, kind] of MATRIX) {
      const r = ratio(tokens[fgT], tokens[bgT])
      const bar = kind === 'ui' ? 3 : 4.5
      const ok = r >= bar
      if (!ok) fails++
      if (kind === 'text') worstText = Math.min(worstText, r)
      if (label === 'body text') bodyRatio = Math.max(bodyRatio, r)
      console.log(
        `${(ok ? '  ' : 'X ') + label.padEnd(28)} ${r.toFixed(2)}:1  ${grade(r, kind)}`,
      )
    }
  }
  console.log('\n--- summary ---')
  console.log(`body text (AAA ≥7):   ${bodyRatio.toFixed(2)}:1  ${bodyRatio >= 7 ? 'AAA ✓' : 'NOT AAA ✗'}`)
  console.log(`worst text pair (≥4.5): ${worstText.toFixed(2)}:1`)
  console.log(`fails: ${fails}`)
  process.exit(fails === 0 && bodyRatio >= 7 ? 0 : 1)
}

// CLI pairs still supported: node contrast-check.mjs "label:fg:bg:text"
// fg/bg may be hex or oklch(). With no args, run the full built-in matrix.
const args = process.argv.slice(2)
if (args.length === 0) {
  runBuiltIn()
} else {
  let worstText = Infinity
  for (const p of args) {
    const [label, fg, bg, kind = 'text'] = p.split(':')
    const r = ratio(fg, bg)
    if (kind === 'text') worstText = Math.min(worstText, r)
    console.log(`${label.padEnd(30)} ${fg} on ${bg}  ${r.toFixed(2)}:1  ${grade(r, kind)}`)
  }
}

