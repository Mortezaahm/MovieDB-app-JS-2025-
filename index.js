const API_KEY = '2b744f1e134577232755c6ac96d94497'
const BASE_URL = 'https://api.themoviedb.org/3'
const IMG_BASE = 'https://image.tmdb.org/t/p/original'

//endpoints for different movie categories
const endpoints = {
    popular: `${BASE_URL}/movie/popular?api_key=${API_KEY}`,
    top: `${BASE_URL}/movie/top_rated?api_key=${API_KEY}`,
    upcoming: `${BASE_URL}/movie/upcoming?api_key=${API_KEY}`,
    playing: `${BASE_URL}/movie/now_playing?api_key=${API_KEY}`
}

const hero = document.querySelector('.hero')

// Creating movie cards
function createCard(movie) {
    const article = document.createElement('article')
    article.classList.add('movie-card')

    const overlay = document.createElement('div')
    overlay.classList.add('overlay')

    const moviePic = document.createElement('div')
    moviePic.classList.add('movie-pic')

    const h3 = document.createElement('h3')
    h3.textContent = movie.title

    const img = document.createElement('img')
    img.src = `${IMG_BASE}/${movie.poster_path}`

    overlay.append(h3)
    moviePic.append(img)
    article.append(overlay, moviePic)
    article.addEventListener('click', () => showMovieDetails(movie.id))
    return article
}

// movie info + rating info
function showMovieDetails(movieId) {
    const url = `${BASE_URL}/movie/${movieId}?api_key=${API_KEY}`

    fetch(url)
        .then((response) => response.json())
        .then((movie) => {
            const modal = document.createElement('div')
            modal.classList.add('simple-modal')

            const modalBox = document.createElement('div')
            modalBox.classList.add('modal-box')

            const closeBtn = document.createElement('button')
            closeBtn.classList.add('close-button')
            closeBtn.textContent = 'X'
            closeBtn.addEventListener('click', () => modal.remove())

            const title = document.createElement('h2')
            title.textContent = movie.title

            const desc = document.createElement('p')
            desc.textContent = movie.overview

            // Rating section
            const ratingSection = document.createElement('div')
            ratingSection.classList.add('rating-section')

            const label = document.createElement('label')
            label.textContent = 'Your rating: '

            const selectRating = document.createElement('select')
            selectRating.id = 'rating'

            // Option
            const defaultOption = document.createElement('option')
            defaultOption.value = ''
            defaultOption.textContent = 'Select rating'
            selectRating.appendChild(defaultOption)

            // rating options 1-5 stars for every movie
            const existingRating = getRating(movie.id)
            for (let i = 1; i <= 5; i++) {
                const option = document.createElement('option')
                option.value = i
                option.textContent = '★'.repeat(i)
                if (existingRating == i) {
                    option.selected = true
                }
                selectRating.appendChild(option)
            }

            // saving button for ratings
            const saveButton = document.createElement('button')
            saveButton.textContent = 'Save Rating'
            saveButton.classList.add('save-btn')
            ratingSection.append(label, selectRating, saveButton)

            // remove button if rating exists
            if (existingRating) {
                const removeButton = document.createElement('button')
                removeButton.textContent = 'Remove Rating'
                removeButton.classList.add('remove-btn')
                ratingSection.append(removeButton)

                removeButton.addEventListener('click', () => {
                    const index = ratingList.findIndex(
                        (r) => r.movieId === movie.id
                    )
                    if (index !== -1) {
                        ratingList.splice(index, 1)
                        localStorage.setItem(
                            'ratings',
                            JSON.stringify(ratingList)
                        )
                        alert(`Removed rating for ${movie.title}`)
                        modal.remove()
                    }
                })
            }

            saveButton.addEventListener('click', () => {
                const selectedRating = parseInt(selectRating.value)
                if (!selectedRating) {
                    alert('Choose a rating before saving!')
                    return
                }
                addRating(movie.id, selectedRating)
                alert(`You rated ${movie.title} with ${selectedRating} stars!`)
                modal.remove()
            })

            modalBox.append(closeBtn, title, desc, ratingSection)
            modal.append(modalBox)
            document.body.append(modal)

            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.remove()
            })
        })
        .catch((err) => console.error('Fel vid hämtning av detaljer:', err))
}

// fetch-functionality for movies
async function loadMovies(url, containerId) {
    try {
        const response = await fetch(url)
        const data = await response.json()
        const movies = data.results
        const container = document.querySelector(containerId)

        if (!movies || movies.length === 0) {
            console.log(`Ingen data för ${containerId}`)
            return
        }

        // Hero section for popular movies
        if (containerId === '#popular') {
            const heroMovie = movies[0]
            hero.style.backgroundImage = `url(${IMG_BASE}/${heroMovie.backdrop_path})`

            const heroArticle = document.createElement('article')
            heroArticle.classList.add('hero-text')

            heroArticle.innerHTML = `
        <h1>${heroMovie.title}</h1>
        <p>${heroMovie.overview}</p>
      `
            hero.append(heroArticle)
        }

        movies.forEach((movie) => container.append(createCard(movie)))
    } catch (err) {
        console.error(`Fel vid hämtning av ${containerId}:`, err)
    }
}

// Localstorage for saving ratings
const ratingList = JSON.parse(localStorage.getItem('ratings')) || []

function addRating(movieId, rating) {
    const existingRatingIndex = ratingList.findIndex(
        (r) => r.movieId === movieId
    )
    if (existingRatingIndex !== -1) {
        ratingList[existingRatingIndex].rating = rating
    } else {
        ratingList.push({ movieId, rating })
    }
    localStorage.setItem('ratings', JSON.stringify(ratingList))
}
function getRating(movieId) {
    const ratingEntry = ratingList.find((r) => r.movieId === movieId)
    return ratingEntry ? ratingEntry.rating : null
}

// Load movies for each category
loadMovies(endpoints.popular, '#popular')
loadMovies(endpoints.top, '#top')
loadMovies(endpoints.upcoming, '#upcoming')
loadMovies(endpoints.playing, '#playing')
