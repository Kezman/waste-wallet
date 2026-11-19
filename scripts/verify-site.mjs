const base = process.argv[2] ?? 'https://kezman.github.io/waste-wallet/'

const checks = [base, `${base}request/req-9`, `${base}new`]

for (const url of checks) {
  try {
    const response = await fetch(url, { redirect: 'follow' })
    const text = await response.text()
    const title = text.match(/<title>([^<]*)<\/title>/)?.[1] ?? '-'
    console.log(`${response.status} ${url} | bytes ${text.length} | ${title}`)
  } catch (error) {
    console.log(`ERR ${url} ${error.message}`)
  }
}

const index = await fetch(base)
const html = await index.text()
const asset = html.match(/src="([^"]+\.js)"/)?.[1]
console.log('asset in html:', asset)

if (asset) {
  const absolute = new URL(asset, base).href
  const response = await fetch(absolute)
  const body = await response.text()
  console.log(`asset ${response.status} | ${response.headers.get('content-type')} | bytes ${body.length}`)
}

const css = html.match(/href="([^"]+\.css)"/)?.[1]
if (css) {
  const response = await fetch(new URL(css, base).href)
  console.log(`css ${response.status} | ${response.headers.get('content-type')} | bytes ${(await response.text()).length}`)
}
