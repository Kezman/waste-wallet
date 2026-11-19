/**
 * Скриншот через CDP с точной эмуляцией вьюпорта.
 * node scripts/cdp-shot.mjs <url> <out.png> [width] [height] [mobile:0|1]
 */
import { writeFileSync } from 'node:fs'

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const PORT = 9222

class Cdp {
  constructor(ws) {
    this.ws = ws
    this.id = 0
    this.pending = new Map()
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data)
      if (message.id && this.pending.has(message.id)) {
        const { resolve, reject } = this.pending.get(message.id)
        this.pending.delete(message.id)
        if (message.error) reject(new Error(message.error.message))
        else resolve(message.result)
      }
    }
  }

  send(method, params = {}) {
    const id = ++this.id
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
      this.ws.send(JSON.stringify({ id, method, params }))
    })
  }
}

async function main() {
  const [url, out, width = '390', height = '1600', mobile = '1'] = process.argv.slice(2)
  const targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()
  const page = targets.find((target) => target.type === 'page')
  if (!page) throw new Error('нет открытой вкладки')

  const ws = new WebSocket(page.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => {
    ws.onopen = resolve
    ws.onerror = () => reject(new Error('не удалось подключиться к CDP'))
  })

  const cdp = new Cdp(ws)
  await cdp.send('Page.enable')
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: Number(width),
    height: Number(height),
    deviceScaleFactor: 1,
    mobile: mobile === '1',
  })

  await cdp.send('Page.navigate', { url })
  await wait(2200)

  const metrics = await cdp.send('Runtime.evaluate', {
    expression: '`${document.documentElement.clientWidth}x${document.documentElement.clientHeight} scroll=${document.documentElement.scrollWidth}`',
    returnByValue: true,
  })
  console.log('viewport:', metrics.result.value)

  const shot = await cdp.send('Page.captureScreenshot', { format: 'png' })
  writeFileSync(out, Buffer.from(shot.data, 'base64'))
  console.log('saved:', out)

  ws.close()
  process.exit(0)
}

main().catch((error) => {
  console.error('FAILED:', error.message)
  process.exit(1)
})
