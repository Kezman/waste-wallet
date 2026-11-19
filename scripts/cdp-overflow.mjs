/**
 * Ищет элементы, вылезающие за правую границу вьюпорта.
 * node scripts/cdp-overflow.mjs <url> [width] [height]
 */
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

const SCAN = `(() => {
  const width = document.documentElement.clientWidth;
  const offenders = [];
  for (const el of document.querySelectorAll('*')) {
    const rect = el.getBoundingClientRect();
    if (rect.right > width + 1 || rect.left < -1) {
      const style = getComputedStyle(el);
      if (style.position === 'fixed' || style.display === 'none') continue;
      offenders.push({
        tag: el.tagName.toLowerCase(),
        cls: (el.className || '').toString().slice(0, 90),
        left: Math.round(rect.left),
        right: Math.round(rect.right),
        width: Math.round(rect.width),
        text: (el.textContent || '').trim().slice(0, 40),
      });
    }
  }
  return { width, scroll: document.documentElement.scrollWidth, bodyScroll: document.body.scrollWidth, scrollTest: (() => { window.scrollTo(300, 0); const x = window.scrollX; window.scrollTo(0, 0); return x })(), offenders: offenders.slice(0, 12) };
})()`

async function main() {
  const [url, width = '390', height = '1600'] = process.argv.slice(2)
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
    mobile: true,
  })
  await cdp.send('Page.navigate', { url })
  await wait(2200)

  const result = await cdp.send('Runtime.evaluate', { expression: SCAN, returnByValue: true })
  console.log(JSON.stringify(result.result.value, null, 2))
  ws.close()
  process.exit(0)
}

main().catch((error) => {
  console.error('FAILED:', error.message)
  process.exit(1)
})
