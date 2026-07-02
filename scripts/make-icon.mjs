// Generates the app icon with no external dependencies.
//  1. Draws a 1024x1024 PNG in pure Node (zlib only).
//  2. On macOS, converts it into build/icon.icns via sips + iconutil.
// Re-run any time with:  npm run icon
import { deflateSync } from 'node:zlib'
import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const BUILD = join(ROOT, 'build')
const SIZE = 1024

// ---- tiny RGBA canvas -----------------------------------------------------
const buf = Buffer.alloc(SIZE * SIZE * 4)

function setPx(x, y, [r, g, b, a]) {
  if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) return
  const i = (y * SIZE + x) * 4
  if (a >= 255) {
    buf[i] = r
    buf[i + 1] = g
    buf[i + 2] = b
    buf[i + 3] = 255
    return
  }
  // alpha blend over existing pixel
  const af = a / 255
  buf[i] = Math.round(r * af + buf[i] * (1 - af))
  buf[i + 1] = Math.round(g * af + buf[i + 1] * (1 - af))
  buf[i + 2] = Math.round(b * af + buf[i + 2] * (1 - af))
  buf[i + 3] = 255
}

function fill([r, g, b]) {
  for (let i = 0; i < buf.length; i += 4) {
    buf[i] = r
    buf[i + 1] = g
    buf[i + 2] = b
    buf[i + 3] = 255
  }
}

// Rounded-rectangle fill. colorFn(x,y) => [r,g,b,a]
function roundRect(cx, cy, w, h, radius, colorFn) {
  const x0 = Math.round(cx - w / 2)
  const y0 = Math.round(cy - h / 2)
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) {
      const dx = Math.min(x - x0, x0 + w - 1 - x)
      const dy = Math.min(y - y0, y0 + h - 1 - y)
      if (dx < radius && dy < radius) {
        const dist = Math.hypot(radius - dx, radius - dy)
        if (dist > radius) continue
      }
      setPx(x, y, colorFn(x, y))
    }
  }
}

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t)
}

// ---- compose the icon -----------------------------------------------------
fill([15, 20, 25]) // #0f1419 background

// Back card (offset, darker surface) to suggest a stack of cards
roundRect(512 + 46, 512 + 26, 540, 700, 72, () => [35, 45, 61, 255])

// Front card with a vertical HPE-green gradient
const top = [2, 201, 151]
const bot = [1, 110, 84]
const cardH = 700
const cardTop = 512 - 14 - cardH / 2
roundRect(512 - 26, 512 - 14, 540, cardH, 72, (_x, y) => {
  const t = Math.min(1, Math.max(0, (y - cardTop) / cardH))
  return [lerp(top[0], bot[0], t), lerp(top[1], bot[1], t), lerp(top[2], bot[2], t), 255]
})

// Three "text line" bars on the front card to read as a flashcard face
const barColor = [255, 255, 255, 235]
const fcx = 512 - 26
roundRect(fcx, 512 - 120, 300, 46, 23, () => barColor)
roundRect(fcx - 40, 512 - 20, 220, 34, 17, () => [255, 255, 255, 170])
roundRect(fcx - 90, 512 + 60, 120, 34, 17, () => [255, 255, 255, 170])

// ---- encode PNG -----------------------------------------------------------
function crc32(bytes) {
  let c = ~0
  for (let i = 0; i < bytes.length; i++) {
    c ^= bytes[i]
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1))
  }
  return ~c >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'ascii')
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([len, typeBuf, data, crcBuf])
}

const ihdr = Buffer.alloc(13)
ihdr.writeUInt32BE(SIZE, 0)
ihdr.writeUInt32BE(SIZE, 4)
ihdr[8] = 8 // bit depth
ihdr[9] = 6 // color type RGBA
// rest zero (compression, filter, interlace)

// prefix each scanline with filter byte 0
const raw = Buffer.alloc(SIZE * (SIZE * 4 + 1))
for (let y = 0; y < SIZE; y++) {
  raw[y * (SIZE * 4 + 1)] = 0
  buf.copy(raw, y * (SIZE * 4 + 1) + 1, y * SIZE * 4, (y + 1) * SIZE * 4)
}

const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
])

mkdirSync(BUILD, { recursive: true })
const pngPath = join(BUILD, 'icon.png')
writeFileSync(pngPath, png)
console.log('Wrote', pngPath, `(${(png.length / 1024).toFixed(1)} kB)`)

// ---- macOS: build .icns ---------------------------------------------------
if (process.platform === 'darwin') {
  const iconset = join(BUILD, 'icon.iconset')
  rmSync(iconset, { recursive: true, force: true })
  mkdirSync(iconset, { recursive: true })
  const specs = [
    [16, 'icon_16x16.png'],
    [32, 'icon_16x16@2x.png'],
    [32, 'icon_32x32.png'],
    [64, 'icon_32x32@2x.png'],
    [128, 'icon_128x128.png'],
    [256, 'icon_128x128@2x.png'],
    [256, 'icon_256x256.png'],
    [512, 'icon_256x256@2x.png'],
    [512, 'icon_512x512.png'],
    [1024, 'icon_512x512@2x.png'],
  ]
  for (const [px, name] of specs) {
    execFileSync('sips', ['-z', String(px), String(px), pngPath, '--out', join(iconset, name)], {
      stdio: 'ignore',
    })
  }
  execFileSync('iconutil', ['-c', 'icns', iconset, '-o', join(BUILD, 'icon.icns')])
  rmSync(iconset, { recursive: true, force: true })
  console.log('Wrote', join(BUILD, 'icon.icns'))
}
