// API:er

const API_KEY = "2b744f1e134577232755c6ac96d94497";
const BASE_URL = "https://api.themoviedb.org/3";
const IMG_BASE = "https://image.tmdb.org/t/p/original";

//Samlade endpoints för de olika filmkategorierna

const endpoints = {
  popular: `${BASE_URL}/movie/popular?api_key=${API_KEY}`,
  top: `${BASE_URL}/movie/top_rated?api_key=${API_KEY}`,
  upcoming: `${BASE_URL}/movie/upcoming?api_key=${API_KEY}`,
  playing: `${BASE_URL}/movie/now_playing?api_key=${API_KEY}`,
};

const hero = document.querySelector(".hero");

// Filmkort skapade som återanvänds.
function createCard(movie) {
  const article = document.createElement("article");
  article.classList.add("movie-card");

  const overlay = document.createElement("div");
  overlay.classList.add("overlay");

  const moviePic = document.createElement("div");
  moviePic.classList.add("movie-pic");

  const h3 = document.createElement("h3");
  h3.textContent = movie.title;

  const img = document.createElement("img");
  img.src = `${IMG_BASE}/${movie.poster_path}`;

  overlay.append(h3);
  moviePic.append(img);
  article.append(overlay, moviePic);

  // Användaren klickar för att visa detaljer
  article.addEventListener("click", () => showMovieDetails(movie.id));

  return article;
}

// filminfo
function showMovieDetails(movieId) {
  const url = `${BASE_URL}/movie/${movieId}?api_key=${API_KEY}`;

  fetch(url)
    .then((res) => res.json())
    .then((movie) => {
      const modal = document.createElement("div");
      modal.classList.add("simple-modal");

      const modalBox = document.createElement("div");
      modalBox.classList.add("modal-box");

      const closeBtn = document.createElement("button");
      closeBtn.classList.add("close-button");
      closeBtn.textContent = "X";
      closeBtn.addEventListener("click", () => modal.remove());

      const title = document.createElement("h2");
      title.textContent = movie.title;

      const desc = document.createElement("p");
      desc.textContent = movie.overview;

      modalBox.append(closeBtn, title, desc);
      modal.append(modalBox);
      document.body.append(modal);

      modal.addEventListener("click", (e) => {
        if (e.target === modal) modal.remove();
      });
    })
    .catch((err) => console.error("Fel vid hämtning av detaljer:", err));
}

// fetch-funktionalitet

async function loadMovies(url, containerId) {
  try {
    const response = await fetch(url);
    const data = await response.json();
    const movies = data.results;
    const container = document.querySelector(containerId);

    if (!movies || movies.length === 0) {
      console.log(`Ingen data för ${containerId}`);
      return;
    }

    // Hero bild sätts beroende på vilken som är (t.ex. popular)
    if (containerId === "#popular") {
      const heroMovie = movies[0];
      hero.style.backgroundImage = `url(${IMG_BASE}/${heroMovie.backdrop_path})`;

      const heroArticle = document.createElement("article");
      heroArticle.classList.add("hero-text");

      heroArticle.innerHTML = `
        <h1>${heroMovie.title}</h1>
        <p>${heroMovie.overview}</p>
      `;
      hero.append(heroArticle);
    }

    // Skapa filmkort. Klart.
    movies.forEach((movie) => container.append(createCard(movie)));
  } catch (err) {
    console.error(`Fel vid hämtning av ${containerId}:`, err);
  }
}
// Startar appen(funktionerna)
loadMovies(endpoints.popular, "#popular");
loadMovies(endpoints.top, "#top");
loadMovies(endpoints.upcoming, "#upcoming");
loadMovies(endpoints.playing, "#playing");

// Navbar button funktionalitet
const loginBtn = document.querySelector("#LoggaIn");
const registerBtn = document.querySelector("#Registrera");

loginBtn.addEventListener("click", openLoginModal);

registerBtn.addEventListener("click", () => {
  alert("Registrera knapp klickad!");
});

function openLoginModal() {
  const loginModal = new bootstrap.Modal(document.getElementById("loginModal"));
  loginModal.show();
}

// Hantera inloggningsformulär
document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  console.log(`User: ${username}, Password: ${password}`);

  // Här kan du lägga till riktig inloggningslogik

  // Stäng modalen efter inlämning
  const modal = bootstrap.Modal.getInstance(
    document.getElementById("loginModal")
  );
  modal.hide();
});
