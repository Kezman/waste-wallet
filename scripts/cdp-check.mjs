/**
 * Проверка интерактивного сценария через Chrome DevTools Protocol.
 * Запускается вручную: node scripts/cdp-check.mjs <url> <out.png>
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
  const url = process.argv[2] ?? 'http://127.0.0.1:5174/request/req-6'
  const out = process.argv[3] ?? 'vote.png'

  const listResponse = await fetch(`http://127.0.0.1:${PORT}/json/list`)
  const targets = await listResponse.json()
  const page = targets.find((target) => target.type === 'page')
  if (!page) throw new Error('нет открытой вкладки')

  const ws = new WebSocket(page.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => {
    ws.onopen = resolve
    ws.onerror = () => reject(new Error('не удалось подключиться к CDP'))
  })

  const cdp = new Cdp(ws)
  await cdp.send('Runtime.enable')
  await cdp.send('Page.enable')
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 1400,
    height: 1500,
    deviceScaleFactor: 1,
    mobile: false,
  })

  const evaluate = async (expression) => {
    const result = await cdp.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    })
    if (result.exceptionDetails) {
      throw new Error(`JS: ${result.exceptionDetails.exception?.description ?? result.exceptionDetails.text}`)
    }
    return result.result.value
  }

  let ready = false
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const state = await evaluate(`(() => {
      const ta = document.querySelector('textarea');
      return ta ? 'ready' : 'loading';
    })()`)
    if (state === 'ready') {
      ready = true
      break
    }
    await wait(250)
  }
  console.log('textarea-ready:', ready)

  const fill = await evaluate(`(() => {
    const ta = document.querySelector('textarea');
    if (!ta) return 'no-textarea';
    const setValue = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
    setValue.call(ta, 'У брата стоит такой же самокат без дела — заберу на месяц и проверю маршрут.');
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    return 'filled';
  })()`)
  console.log('fill:', fill)

  const reject = await evaluate(`(() => {
    const button = [...document.querySelectorAll('button')].find((node) => node.textContent.trim().toLowerCase() === 'отклонить');
    if (!button) return 'no-reject-button';
    button.click();
    return 'reject-clicked';
  })()`)
  console.log('reject:', reject)
  await wait(200)

  const submit = await evaluate(`(() => {
    const button = [...document.querySelectorAll('button')].find((node) => node.textContent.includes('Подписать'));
    if (!button) return 'no-submit';
    if (button.disabled) return 'submit-disabled';
    button.click();
    return 'submit-clicked';
  })()`)
  console.log('submit:', submit)
  await wait(1600)

  const state = await evaluate(`(() => {
    const body = document.body.innerText;
    return {
      signed: /заключение подписано/i.test(body),
      counter: document.querySelectorAll('li').length,
      preview: body.slice(0, 0),
    };
  })()`)
  console.log('signed:', state.signed)

  const shot = await cdp.send('Page.captureScreenshot', { format: 'png' })
  writeFileSync(out, Buffer.from(shot.data, 'base64'))
  console.log('saved:', out)

  ws.close()
  process.exit(state.signed ? 0 : 2)
}

main().catch((error) => {
  console.error('FAILED:', error.message)
  process.exit(1)
})
