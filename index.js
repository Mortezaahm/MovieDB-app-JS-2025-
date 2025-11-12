
// Grundkonstanter och hjälpfunktioner //

const API_KEY = '2b744f1e134577232755c6ac96d94497' // Demo-nyckel
const BASE_URL = 'https://api.themoviedb.org/3'
const IMG_BASE = 'https://image.tmdb.org/t/p/original'
const LANG = 'sv-SE'

const qs  = (sel) => document.querySelector(sel)
const qid = (id)  => document.getElementById(id)

/** Bygg en TMDB-URL med standardparametrar + ev. extra */
function tmdb(path, params = {}) {
  const url = new URL(`${BASE_URL}/${path}`)
  url.searchParams.set('api_key', API_KEY)
  url.searchParams.set('language', LANG)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  return url.toString()
}

/** Hämta JSON med enkel felhantering */
async function fetchJSON(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} för ${url}`)
  return res.json()
}


// Fördefinierade API-ändpunkter (listor) //

const endpoints = {
  popular:  tmdb('movie/popular'),
  top:      tmdb('movie/top_rated'),
  upcoming: tmdb('movie/upcoming'),
  playing:  tmdb('movie/now_playing')
}


// Referenser till DOM-element

const hero = qs('.hero')


// Hjälp: skapa filmkort (återanvänds) //

function createCard(movie) {
  const article = document.createElement('article')
  article.classList.add('movie-card')
  article.dataset.genres = (movie.genre_ids || []).join(',')

  const overlay = document.createElement('div')
  overlay.classList.add('overlay')

  const moviePic = document.createElement('div')
  moviePic.classList.add('movie-pic')

  const h3 = document.createElement('h3')
  h3.textContent = movie.title || ''

  const img = document.createElement('img')
  img.src = `${IMG_BASE}/${movie.poster_path}`

  overlay.append(h3)
  moviePic.append(img)
  article.append(overlay, moviePic)

  // Klick öppnar enkel detaljmodal //
  article.addEventListener('click', () => showMovieDetails(movie.id))
  return article
}


// Modal: visar detaljer för vald film //

async function showMovieDetails(movieId) {
  try {
    const [movie, credits] = await Promise.all([
      fetchJSON(tmdb(`movie/${movieId}`)),
      fetchJSON(tmdb(`movie/${movieId}/credits`))
    ])

    const cast = (credits.cast || []).slice(0, 5).map((p) => p.name).join(', ')
    const director = (credits.crew || []).find((p) => p.job === 'Director')?.name || 'Okänd'
    const release = movie.release_date || 'Okänt datum'
    const rating = movie.vote_average != null ? `${movie.vote_average.toFixed(1)} / 10` : 'Ej betygsatt'

    // Skapa modalstruktur
    const modal = document.createElement('div')
    modal.classList.add('simple-modal')

    const modalBox = document.createElement('div')
    modalBox.classList.add('modal-box')

    const closeBtn = document.createElement('button')
    closeBtn.classList.add('close-button')
    closeBtn.textContent = 'Stäng'
    closeBtn.addEventListener('click', () => modal.remove())

    const title = document.createElement('h2')
    title.textContent = movie.title || ''

    const meta = document.createElement('p')
    meta.className = 'modal-meta'
    meta.textContent = `Premiär: ${release} • Regissör: ${director} • Betyg: ${rating}`

    const actors = document.createElement('p')
    actors.className = 'modal-actors'
    actors.textContent = `Skådespelare: ${cast}`

    const desc = document.createElement('p')
    desc.textContent = movie.overview || 'Ingen beskrivning tillgänglig.'

    modalBox.append(closeBtn, title, meta, actors, desc)
    modal.append(modalBox)
    document.body.append(modal)

    // Stäng vid klick utanför rutan //
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove() })
  } catch (err) {
    console.error('Fel vid hämtning av detaljer:', err)
  }
}

// Hero: rotera slumpmässigt populära bakgrunder //

function setHeroFromMovie(movie) {
  if (!movie || !movie.backdrop_path) return
  hero.style.backgroundImage = `url(${IMG_BASE}/${movie.backdrop_path})`
  hero.innerHTML = ''
  const article = document.createElement('article')
  article.classList.add('hero-text')
  article.innerHTML = `<h1>${movie.title || ''}</h1><p>${movie.overview || ''}</p>`
  hero.append(article)
}

async function fetchRandomPopularMovie() {
  try {
    const page = Math.floor(Math.random() * 5) + 1 // begränsa till sidorna 1–5
    const data = await fetchJSON(tmdb('movie/popular', { page: String(page) }))
    const list = (data.results || []).filter((m) => m.backdrop_path)
    if (!list.length) return null
    return list[Math.floor(Math.random() * list.length)]
  } catch (e) {
    console.error('Fel vid hämtning av slumpfilm:', e)
    return null
  }
}

let heroTimer = null
async function startHeroRotation() {
  const first = await fetchRandomPopularMovie()
  if (first) setHeroFromMovie(first)

  if (heroTimer) clearInterval(heroTimer)
  heroTimer = setInterval(async () => {
    const m = await fetchRandomPopularMovie()
    if (m) setHeroFromMovie(m)
  }, 20000)
}

// Ladda listor till respektive sektion //

async function loadMovies(url, containerSel) {
  try {
    const data = await fetchJSON(url)
    const movies = data.results || []
    const container = qs(containerSel)
    if (!container || !movies.length) return
    movies.forEach((m) => container.append(createCard(m)))
  } catch (err) {
    console.error(`Fel vid hämtning av ${containerSel}:`, err)
  }
}

/*  Initialise  */

loadMovies(endpoints.popular, '#popular')
loadMovies(endpoints.top, '#top')
loadMovies(endpoints.upcoming, '#upcoming')
loadMovies(endpoints.playing, '#playing')
startHeroRotation()

/* Sök (ENDA fältet: fri textruta), tom fråga rensar resultatsektionen
Input körs när 2+ tecken skrivs*/

const nameInput      = qid('searchName')
const searchForm     = qid('searchForm')
const searchContainer= qid('search')
const searchHeading  = qid('searchHeading')
const noResults      = qid('noResults')

async function runSearch(evt) {
  if (evt) evt.preventDefault()

  const q = (nameInput?.value || '').trim()
  if (!q) return showSearchResults([])

  try {
    const data = await fetchJSON(
      tmdb('search/movie', { include_adult: 'false', query: q })
    )
    const results = data.results || []
    showSearchResults(results)
  } catch (e) {
    console.error('Fel vid sökning:', e)
    showSearchResults([])
  }
}

/** Visa/skräm bort sökresultat och ingen-träff-indikatorn */
function showSearchResults(list) {
  searchContainer.innerHTML = ''
  const has = Array.isArray(list) && list.length > 0

  searchHeading.classList.toggle('d-none', !has)
  searchContainer.classList.toggle('d-none', !has)
  noResults.classList.toggle('d-none', has || !nameInput.value)

  if (!has) return

  list.slice(0, 20).forEach((m) => searchContainer.append(createCard(m)))
  searchHeading.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// Händelser: submit + live-sök vid ≥2 tecken
searchForm?.addEventListener('submit', runSearch)
nameInput?.addEventListener('input', () => {
  const hasText = (nameInput.value || '').trim().length >= 2
  if (hasText) runSearch()
  else showSearchResults([])
})

// Knappar: inloggning/registrering //
qid('LoggaIn')?.addEventListener('click', openLoginModal)
qid('Registrera')?.addEventListener('click', () => alert('Registrera knapp klickad!'))

function openLoginModal() {
  const loginModal = new bootstrap.Modal(qid('loginModal'))
  loginModal.show()
}

qid('loginForm')?.addEventListener('submit', (e) => {
  e.preventDefault()
  const username = qid('username').value
  const password = qid('password').value
  console.log(`Användare: ${username}, Lösenord: ${password}`)
  const modal = bootstrap.Modal.getInstance(qid('loginModal'))
  modal.hide()
})
