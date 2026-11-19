/**
 * Создаёт репозиторий и включает GitHub Pages (source: Actions) через API.
 * Токен передаётся в GH_TOKEN, никогда не печатается.
 */
const token = process.env.GH_TOKEN
const repoName = process.env.REPO_NAME ?? 'waste-wallet'
const description = 'Прототип сервиса против импульсивных покупок: заявка, голосование, пауза'

if (!token) {
  console.log('NO_TOKEN')
  process.exit(2)
}

const call = async (path, init = {}) => {
  const response = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'dsh-agent',
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  })
  const text = await response.text()
  let json = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = null
  }
  return { status: response.status, json, text }
}

const me = await call('/user')
if (me.status !== 200) {
  console.log(`AUTH_FAILED ${me.status} ${me.text.slice(0, 200)}`)
  process.exit(3)
}

const login = me.json.login
console.log(`account: ${login}`)

const existing = await call(`/repos/${login}/${repoName}`)
if (existing.status === 200) {
  console.log(`repo: already exists ${existing.json.html_url}`)
} else {
  const created = await call('/user/repos', {
    method: 'POST',
    body: JSON.stringify({
      name: repoName,
      description,
      private: false,
      auto_init: false,
      has_issues: true,
      has_wiki: false,
    }),
  })
  if (created.status !== 201) {
    console.log(`REPO_CREATE_FAILED ${created.status} ${created.text.slice(0, 300)}`)
    process.exit(4)
  }
  console.log(`repo: created ${created.json.html_url}`)
}

const pages = await call(`/repos/${login}/${repoName}/pages`, {
  method: 'POST',
  body: JSON.stringify({ build_type: 'workflow' }),
})
if (pages.status === 201 || pages.status === 204) {
  console.log('pages: enabled (source: GitHub Actions)')
} else if (pages.status === 409) {
  console.log('pages: already enabled')
} else {
  const status = await call(`/repos/${login}/${repoName}/pages`)
  if (status.status === 200) {
    console.log(`pages: already configured (build_type: ${status.json.build_type})`)
  } else {
    console.log(`PAGES_FAILED ${pages.status} ${pages.text.slice(0, 300)}`)
  }
}

console.log(`REPO_URL https://github.com/${login}/${repoName}`)
console.log(`SITE_URL https://${login.toLowerCase()}.github.io/${repoName}/`)
