/**
 * Открывает страницу и печатает фактический URL, заголовок и заголовок h1.
 * node scripts/cdp-inspect.mjs <url> [waitMs]
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

const [url, waitMs = '3500'] = process.argv.slice(2)

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
  width: 1400,
  height: 1200,
  deviceScaleFactor: 1,
  mobile: false,
})
await cdp.send('Page.navigate', { url })
await wait(Number(waitMs))

const result = await cdp.send('Runtime.evaluate', {
  expression: `({
    href: location.href,
    title: document.title,
    h1: document.querySelector('h1')?.textContent ?? '(нет h1)',
    bodyStart: document.body.innerText.slice(0, 120)
  })`,
  returnByValue: true,
})
console.log(JSON.stringify(result.result.value, null, 2))
ws.close()
process.exit(0)
