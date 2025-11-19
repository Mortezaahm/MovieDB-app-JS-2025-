// ==================== Constants & Helpers ====================

const API_KEY = "2b744f1e134577232755c6ac96d94497";
const BASE_URL = "https://api.themoviedb.org/3";
const IMG_BASE = "https://image.tmdb.org/t/p/original";
const LANG = "sv-SE";

const qs = (sel) => document.querySelector(sel);
const qid = (id) => document.getElementById(id);

function tmdb(path, params = {}) {
  const url = new URL(`${BASE_URL}/${path}`);
  url.searchParams.set("api_key", API_KEY);
  url.searchParams.set("language", LANG);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return url.toString();
}

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

// ==================== Endpoints ====================

const endpoints = {
  popular: tmdb("movie/popular"),
  top: tmdb("movie/top_rated"),
  upcoming: tmdb("movie/upcoming"),
  playing: tmdb("movie/now_playing"),
};

// ==================== DOM References ====================

const hero = qs(".hero");

// ==================== Movie Cards & Modal ====================

function createCard(movie) {
  const article = document.createElement("article");
  article.classList.add("movie-card");
  article.dataset.genres = (movie.genre_ids || []).join(",");

  const overlay = document.createElement("div");
  overlay.classList.add("overlay");

  const moviePic = document.createElement("div");
  moviePic.classList.add("movie-pic");

  const h3 = document.createElement("h3");
  h3.textContent = movie.title || "";

  const img = document.createElement("img");
  img.src = `${IMG_BASE}/${movie.poster_path}`;

  overlay.append(h3);
  moviePic.append(img);
  article.append(overlay, moviePic);

  article.addEventListener("click", () => showMovieDetails(movie.id));

  return article;
}

const ratingList = JSON.parse(localStorage.getItem("ratings")) || [];

function addRating(movieId, rating) {
  const idx = ratingList.findIndex((r) => r.movieId === movieId);
  if (idx !== -1) ratingList[idx].rating = rating;
  else ratingList.push({ movieId, rating });
  localStorage.setItem("ratings", JSON.stringify(ratingList));
}

function getRating(movieId) {
  const entry = ratingList.find((r) => r.movieId === movieId);
  return entry ? entry.rating : null;
}

async function showMovieDetails(movieId) {
  try {
    const [movie, credits] = await Promise.all([
      fetchJSON(tmdb(`movie/${movieId}`)),
      fetchJSON(tmdb(`movie/${movieId}/credits`)),
    ]);

    const cast = (credits.cast || [])
      .slice(0, 5)
      .map((p) => p.name)
      .join(", ");
    const director =
      (credits.crew || []).find((p) => p.job === "Director")?.name || "Okänd";
    const release = movie.release_date || "Okänt datum";
    const rating =
      movie.vote_average != null
        ? `${movie.vote_average.toFixed(1)} / 10`
        : "Ej betygsatt";

    const modal = document.createElement("div");
    modal.classList.add("simple-modal");

    const modalBox = document.createElement("div");
    modalBox.classList.add("modal-box");

    const closeBtn = document.createElement("button");
    closeBtn.classList.add("close-button");
    closeBtn.textContent = "X";
    closeBtn.addEventListener("click", () => modal.remove());

    const title = document.createElement("h2");
    title.textContent = movie.title || "";

    const meta = document.createElement("p");
    meta.className = "modal-meta";
    meta.textContent = `Premiär: ${release} • Regissör: ${director} • Betyg: ${rating}`;

    const actors = document.createElement("p");
    actors.className = "modal-actors";
    actors.textContent = `Skådespelare: ${cast}`;

    const desc = document.createElement("p");
    desc.textContent = movie.overview || "Ingen beskrivning tillgänglig.";

    // Rating section
    const ratingSection = document.createElement("div");
    ratingSection.classList.add("rating-section");

    const label = document.createElement("label");
    label.textContent = "Your rating: ";

    const selectRating = document.createElement("select");
    selectRating.id = "rating";

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Select rating";
    selectRating.appendChild(defaultOption);

    const existingRating = getRating(movie.id);
    for (let i = 1; i <= 5; i++) {
      const opt = document.createElement("option");
      opt.value = i;
      opt.textContent = "★".repeat(i);
      if (existingRating == i) opt.selected = true;
      selectRating.appendChild(opt);
    }

    const saveBtn = document.createElement("button");
    saveBtn.textContent = "Save Rating";
    saveBtn.classList.add("save-btn");

    ratingSection.append(label, selectRating, saveBtn);

    if (existingRating) {
      const removeBtn = document.createElement("button");
      removeBtn.textContent = "Remove Rating";
      removeBtn.classList.add("remove-btn");
      ratingSection.append(removeBtn);
      removeBtn.addEventListener("click", () => {
        const idx = ratingList.findIndex((r) => r.movieId === movie.id);
        if (idx !== -1) {
          ratingList.splice(idx, 1);
          localStorage.setItem("ratings", JSON.stringify(ratingList));
          alert(`Removed rating for ${movie.title}`);
          modal.remove();
        }
      });
    }

    saveBtn.addEventListener("click", () => {
      const val = parseInt(selectRating.value);
      if (!val) {
        alert("Choose a rating!");
        return;
      }
      addRating(movie.id, val);
      alert(`You rated ${movie.title} with ${val} stars!`);
      modal.remove();
    });

    modalBox.append(closeBtn, title, meta, actors, desc, ratingSection);
    modal.append(modalBox);
    document.body.append(modal);

    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.remove();
    });
  } catch (err) {
    console.error("Fel vid hämtning av detaljer:", err);
  }
}

// ==================== Load Movies ====================

async function loadMovies(url, containerSel) {
  try {
    const data = await fetchJSON(url);
    const movies = data.results || [];
    const container = qs(containerSel);
    if (!container || !movies.length) return;
    movies.forEach((m) => container.append(createCard(m)));
  } catch (err) {
    console.error(`Fel vid hämtning av ${containerSel}:`, err);
  }
}

// ==================== Hero Rotation ====================

function setHeroFromMovie(movie) {
  if (!movie || !movie.backdrop_path) return;
  hero.style.backgroundImage = `url(${IMG_BASE}/${movie.backdrop_path})`;
  hero.innerHTML = "";
  const article = document.createElement("article");
  article.classList.add("hero-text");
  article.innerHTML = `<h1>${movie.title || ""}</h1><p>${
    movie.overview || ""
  }</p>`;
  hero.append(article);
}

let heroTimer = null;
async function fetchRandomPopularMovie() {
  try {
    const page = Math.floor(Math.random() * 5) + 1;
    const data = await fetchJSON(tmdb("movie/popular", { page: String(page) }));
    const list = (data.results || []).filter((m) => m.backdrop_path);
    if (!list.length) return null;
    return list[Math.floor(Math.random() * list.length)];
  } catch (e) {
    console.error(e);
    return null;
  }
}

async function startHeroRotation() {
  const first = await fetchRandomPopularMovie();
  if (first) setHeroFromMovie(first);
  if (heroTimer) clearInterval(heroTimer);
  heroTimer = setInterval(async () => {
    const m = await fetchRandomPopularMovie();
    if (m) setHeroFromMovie(m);
  }, 20000);
}

// ==================== Search ====================

const nameInput = qid("searchName");
const searchForm = qid("searchForm");
const searchContainer = qid("search");
const searchHeading = qid("searchHeading");
const noResults = qid("noResults");

async function runSearch(evt) {
  if (evt) evt.preventDefault();
  const q = (nameInput?.value || "").trim();
  if (!q) return showSearchResults([]);
  try {
    const data = await fetchJSON(
      tmdb("search/movie", { include_adult: "false", query: q })
    );
    showSearchResults(data.results || []);
  } catch (e) {
    console.error(e);
    showSearchResults([]);
  }
}

function showSearchResults(list) {
  searchContainer.innerHTML = "";
  const has = Array.isArray(list) && list.length > 0;
  searchHeading.classList.toggle("d-none", !has);
  searchContainer.classList.toggle("d-none", !has);
  noResults.classList.toggle("d-none", has || !nameInput.value);
  if (!has) return;
  list.slice(0, 20).forEach((m) => searchContainer.append(createCard(m)));
  searchHeading.scrollIntoView({ behavior: "smooth", block: "start" });
}

searchForm?.addEventListener("submit", runSearch);
nameInput?.addEventListener("input", () => {
  const hasText = (nameInput.value || "").trim().length >= 2;
  if (hasText) runSearch();
  else showSearchResults([]);
});

// ==================== Navbar & Login / Scroll ====================

qid("LoggaIn")?.addEventListener("click", openLoginModal);
qid("Registrera")?.addEventListener("click", () =>
  alert("Registrera knapp klickad!")
);

function openLoginModal() {
  const loginModal = bootstrap.Modal.getOrCreateInstance(qid("loginModal"));
  loginModal.show();
}

qid("loginForm")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const username = qid("username").value;
  const password = qid("password").value;
  console.log(`User: ${username}, Password: ${password}`);
  const modal = bootstrap.Modal.getInstance(qid("loginModal"));
  modal.hide();
});

// Fix body after modal closing (to prevent scroll lock issues)
qid("loginModal").addEventListener("hidden.bs.modal", () => {
  document.body.classList.remove("modal-open");
  document.body.style.overflow = "";
  document.querySelector(".modal-backdrop")?.remove();
});

const scrollBtn = qid("scrollToTopBtn");
window.addEventListener("scroll", () => {
  scrollBtn.style.display = window.scrollY > 300 ? "flex" : "none";
});
scrollBtn?.addEventListener("click", () =>
  window.scrollTo({ top: 0, behavior: "smooth" })
);

// ==================== Initialise ====================

loadMovies(endpoints.popular, "#popular");
loadMovies(endpoints.top, "#top");
loadMovies(endpoints.upcoming, "#upcoming");
loadMovies(endpoints.playing, "#playing");
startHeroRotation();

/* ====================
   User Movies CRUD (MockAPI)
   BASE = MockAPI URL
   =================== */
const MOCK_BASE = "https://691dede4d58e64bf0d38468a.mockapi.io/userMovies";

/* Generic request wrapper for MockAPI (GET/POST/PUT/DELETE) */
async function requestMock(url, method = "GET", body = null) {
  const opts = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(url, opts);
  if (!res.ok) {
    // throw a helpful error with status
    throw new Error(`HTTP ${res.status} ${res.statusText} — ${url}`);
  }
  // Some DELETE endpoints return 200/204 with empty body
  if (res.status === 204) return null;
  return res.json();
}

/* --- DOM refs --- */
const userMovieForm = qid("userMovieForm");
const userMoviesList = qid("userMoviesList");
const umTitle = qid("um-title");
const umRating = qid("um-rating");

/* ========== FETCH (GET) - get all user movies and render ========== */
async function fetchUserMovies() {
  try {
    const data = await requestMock(MOCK_BASE, "GET");
    const list = Array.isArray(data) ? data : [];
    renderUserMovies(list);
  } catch (err) {
    console.error("Failed to fetch user movies:", err);
    userMoviesList.innerHTML = `<p style="color:var(--gray)">Kunde inte hämta användarfilmer.</p>`;
  }
}

/* ========== RENDER list ========== */
function renderUserMovies(list) {
  userMoviesList.innerHTML = ""; // Clear existing, I learned this from Richard :)
  if (!list.length) {
    userMoviesList.innerHTML = "<p>Inga användarfilmer än.</p>";
    return;
  }

  list.forEach((m) => {
    const item = document.createElement("div");
    item.className = "user-movie-item";
    // ---- Left (title + rating)
    const leftBox = document.createElement("div");

    const titleEl = document.createElement("strong");
    titleEl.textContent = m.title;

    const ratingEl = document.createElement("span");
    ratingEl.style.opacity = "0.85";
    ratingEl.style.marginLeft = "0.4rem";
    ratingEl.textContent = `(${m.rating}★)`;

    leftBox.append(titleEl, ratingEl);

    // ---- Right (buttons)
    const rightBox = document.createElement("div");

    const editBtn = document.createElement("button");
    editBtn.textContent = "Edit";
    editBtn.className = "btn btn-sm btn-secondary btn-edit";
    editBtn.dataset.id = m.id;

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.className = "btn btn-sm btn-danger btn-delete";
    deleteBtn.dataset.id = m.id;

    rightBox.append(editBtn, deleteBtn);

    // ---- Append to container
    item.append(leftBox, rightBox);
    userMoviesList.append(item);
  });

  // Attach delete listeners
  userMoviesList.querySelectorAll(".btn-delete").forEach((btn) =>
    btn.addEventListener("click", async (e) => {
      const id = e.currentTarget.dataset.id;
      if (!confirm("Vill du ta bort denna film?")) return;
      try {
        await requestMock(`${MOCK_BASE}/${id}`, "DELETE");
        await fetchUserMovies();
      } catch (err) {
        console.error("Delete failed:", err);
        alert("Kunde inte ta bort filmen.");
      }
    })
  );

  // Attach edit listeners
  userMoviesList.querySelectorAll(".btn-edit").forEach((btn) =>
    btn.addEventListener("click", async (e) => {
      const id = e.currentTarget.dataset.id;
      // Simple edit: prompt for new title and rating
      const currentTitle =
        btn.closest(".user-movie-item").querySelector("strong").textContent ||
        "";
      const newTitle = prompt("Ny titel:", currentTitle);
      if (newTitle === null) return; // cancel
      const newRatingRaw = prompt("Ny rating (måste vara mellan 1-5):");
      const newRating = parseInt(newRatingRaw, 10);
      if (
        !newTitle.trim() ||
        isNaN(newRating) ||
        newRating < 1 ||
        newRating > 5
      ) {
        alert("Ogiltig titel eller rating.");
        return;
      }
      try {
        await requestMock(`${MOCK_BASE}/${id}`, "PUT", {
          title: newTitle.trim(),
          rating: newRating,
        });
        await fetchUserMovies();
      } catch (err) {
        console.error("Update failed:", err);
        alert("Kunde inte uppdatera filmen.");
      }
    })
  );
}

/* ========== POST - Add new movie from form ========== */
userMovieForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = (umTitle.value || "").trim();
  const rating = parseInt(umRating.value, 10);
  if (!title || isNaN(rating) || rating < 1 || rating > 5) {
    alert("Ange giltig titel och rating (1-5).");
    return;
  }
  try {
    await requestMock(MOCK_BASE, "POST", { title, rating });
    userMovieForm.reset();
    await fetchUserMovies();
  } catch (err) {
    console.error("Add failed:", err);
    alert("Kunde inte lägga till filmen.");
  }
});

/* Initialize fetch on load (call once) */
fetchUserMovies();
