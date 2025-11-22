// ==================== TMDB-konfiguration & Hjälpfunktioner ====================

// API-nyckel mot TMDB (används här i utbildningssyfte)
const API_KEY = "2b744f1e134577232755c6ac96d94497";
const BASE_URL = "https://api.themoviedb.org/3";
const IMG_BASE = "https://image.tmdb.org/t/p/original";
const LANG = "sv-SE";

// Små hjälpfunktioner för DOM-selectors
const qs = (sel) => document.querySelector(sel);
const qid = (id) => document.getElementById(id);

/**
 * Bygger en fullständig TMDB-URL med query-parametrar.
 * @param {string} path - t.ex. "movie/popular"
 * @param {object} params - extra parametrar, t.ex. { page: "2" }
 */
function tmdb(path, params = {}) {
  const url = new URL(`${BASE_URL}/${path}`);
  url.searchParams.set("api_key", API_KEY);
  url.searchParams.set("language", LANG);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return url.toString();
}

/**
 * Hämtar JSON-data med fetch och kastar fel om något går snett.
 * @param {string} url - fullständig URL
 */
async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

// ==================== Fördefinierade TMDB-endpoints ====================

const endpoints = {
  popular: tmdb("movie/popular"),
  top: tmdb("movie/top_rated"),
  upcoming: tmdb("movie/upcoming"),
  playing: tmdb("movie/now_playing"),
};

// ==================== DOM-referenser ====================

const hero = qs(".hero");

// ==================== Filmkort & Detalj-modal ====================

/**
 * Skapar ett filmkort (article) för en film-lista.
 * @param {object} movie - filmobjekt från TMDB
 */
function createCard(movie) {
  const article = document.createElement("article");
  article.classList.add("movie-card");
  // Sparar filmens genre_ids som data-attribut (kan användas för filtrering)
  article.dataset.genres = (movie.genre_ids || []).join(",");

  const overlay = document.createElement("div");
  overlay.classList.add("overlay");

  const moviePic = document.createElement("div");
  moviePic.classList.add("movie-pic");

  const h3 = document.createElement("h3");
  h3.textContent = movie.title || "";

  const img = document.createElement("img");
  // Poster-bild från TMDB
  img.src = `${IMG_BASE}/${movie.poster_path}`;

  overlay.append(h3);
  moviePic.append(img);
  article.append(overlay, moviePic);

  article.addEventListener("click", () => showMovieDetails(movie.id));

  return article;
}

// ==================== Lokal lagring av egna betyg ====================

// Hämtar tidigare sparade betyg från localStorage, annars tom array
const ratingList = JSON.parse(localStorage.getItem("ratings")) || [];

/**
 * Lägger till eller uppdaterar betyg i localStorage.
 * @param {number} movieId - filmens TMDB-id
 * @param {number} rating - betyg 1–5
 */
function addRating(movieId, rating) {
  const idx = ratingList.findIndex((r) => r.movieId === movieId);
  if (idx !== -1) ratingList[idx].rating = rating;
  else ratingList.push({ movieId, rating });
  localStorage.setItem("ratings", JSON.stringify(ratingList));
}

/**
 * Hämtar ett sparat betyg för en film om det finns.
 * @param {number} movieId
 * @returns {number|null}
 */
function getRating(movieId) {
  const entry = ratingList.find((r) => r.movieId === movieId);
  return entry ? entry.rating : null;
}

/**
 * Hämtar detaljerad info och cred-lista för en film,
 * bygger sedan en enkel modal med info + möjlighet att betygsätta.
 * @param {number} movieId - filmens TMDB-id
 */
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

    // Skapa overlay för modalen
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

    // ======= Sektion för eget betyg (1–5 stjärnor) =======
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

    // Om det redan finns ett sparat betyg för filmen, väljs det
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

    // Knapp för att ta bort befintligt betyg
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

    // Spara-knappen sparar betyget i localStorage
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

    // Stäng modalen om man klickar i det mörka området utanför boxen
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.remove();
    });
  } catch (err) {
    console.error("Fel vid hämtning av detaljer:", err);
  }
}

// ============ Ladda in filmsektionerna ==============

/**
 * Hämtar filmer från en TMDB-endpoint och renderar kort i en container.
 * @param {string} url - färdig TMDB-URL
 * @param {string} containerSel - CSS-selector till container, t.ex. "#popular"
 */
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

// ======== Hero-bild (roterande populär film) ===============

/**
 * Sätter hero-bakgrunden + text utifrån en film.
 */
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

/**
 * Hämtar en slumpad populär film (från sida 1–5) som har backdrop-bild.
 */
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

/**
 * Startar rotation av hero-bild var 20:e sekund.
 */
async function startHeroRotation() {
  const first = await fetchRandomPopularMovie();
  if (first) setHeroFromMovie(first);
  if (heroTimer) clearInterval(heroTimer);
  heroTimer = setInterval(async () => {
    const m = await fetchRandomPopularMovie();
    if (m) setHeroFromMovie(m);
  }, 20000);
}

// ========= Sökfunktion (desktop + mobil) =============

const nameInput = qid("searchName");
const searchForm = qid("searchForm");
const searchContainer = qid("search");
const searchHeading = qid("searchHeading");
const noResults = qid("noResults");

/**
 * Körs när användaren söker (submit eller input ≥ 2 tecken).
 */
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

/**
 * Visar filmresultat i söksektionen eller “inga resultat”.
 */
function showSearchResults(list) {
  searchContainer.innerHTML = "";
  const has = Array.isArray(list) && list.length > 0;

  // Växlar synlighet på rubrik, container och varningsruta
  searchHeading.classList.toggle("d-none", !has);
  searchContainer.classList.toggle("d-none", !has);
  noResults.classList.toggle("d-none", has || !nameInput.value);

  if (!has) return;

  list.slice(0, 20).forEach((m) => searchContainer.append(createCard(m)));
  // Scrollar upp så att användaren ser sökresultatet
  searchHeading.scrollIntoView({ behavior: "smooth", block: "start" });
}

// Desktop: submit på formuläret + live-sök
searchForm?.addEventListener("submit", runSearch);
nameInput?.addEventListener("input", () => {
  const hasText = (nameInput.value || "").trim().length >= 2;
  if (hasText) runSearch();
  else showSearchResults([]);
});

// ===== Mobil / iPad sök (förstoringsglas + modal) =====
const mobileSearchBtn = qid("mobileSearchBtn");
const mobileSearchInput = qid("mobileSearchInput");
const mobileSearchForm = qid("mobileSearchForm");
let mobileSearchModal = null;

if (qid("mobileSearchModal") && typeof bootstrap !== "undefined") {
  mobileSearchModal = bootstrap.Modal.getOrCreateInstance(
    qid("mobileSearchModal")
  );
}

// Öppna mobil-sökmodallen när man klickar på ikonen
mobileSearchBtn?.addEventListener("click", () => {
  if (!mobileSearchModal) return;
  mobileSearchModal.show();
  // Litet delay så fokus hamnar rätt
  setTimeout(() => mobileSearchInput?.focus(), 200);
});

// När man söker i mobilen, skriv värdet till desktop-input och återanvänd runSearch()
mobileSearchForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!mobileSearchInput) return;
  if (nameInput) {
    nameInput.value = mobileSearchInput.value;
  }
  runSearch();
  mobileSearchModal?.hide();
});

// ========== Navbar, Login-modal & Scroll to top ===========

qid("LoggaIn")?.addEventListener("click", openLoginModal);
qid("Registrera")?.addEventListener("click", () =>
  alert("Registrera knapp klickad!")
);

/**
 * Visar Bootstrap-login-modalen.
 */
function openLoginModal() {
  const loginModal = bootstrap.Modal.getOrCreateInstance(qid("loginModal"));
  loginModal.show();
}

// Enkel “fejk-login” för att visa formulärhantering
qid("loginForm")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const username = qid("username").value;
  const password = qid("password").value;
  console.log(`User: ${username}, Password: ${password}`);
  const modal = bootstrap.Modal.getInstance(qid("loginModal"));
  modal.hide();
});

// Fix för att säkerställa att body inte fastnar i “modal-open”-läge
qid("loginModal")?.addEventListener("hidden.bs.modal", () => {
  document.body.classList.remove("modal-open");
  document.body.style.overflow = "";
  document.querySelector(".modal-backdrop")?.remove();
});

// Scroll-to-top-knappen visas först efter viss scroll
const scrollBtn = qid("scrollToTopBtn");
window.addEventListener("scroll", () => {
  if (!scrollBtn) return;
  scrollBtn.style.display = window.scrollY > 300 ? "flex" : "none";
});
scrollBtn?.addEventListener("click", () =>
  window.scrollTo({ top: 0, behavior: "smooth" })
);

// ========== Initiering av TMDB-sektioner & Hero ============

// Laddar in de olika filmkategorierna direkt när sidan öppnas
loadMovies(endpoints.popular, "#popular");
loadMovies(endpoints.top, "#top");
loadMovies(endpoints.upcoming, "#upcoming");
loadMovies(endpoints.playing, "#playing");
// Startar hero-rotationen
startHeroRotation();

// ==================================================================
//            User Movies CRUD – egna favoritfilmer (MockAPI)
// ==================================================================

// Bas-URL till din MockAPI-resurs
const MOCK_BASE = "https://691dede4d58e64bf0d38468a.mockapi.io/userMovies";

/**
 * Generisk helper för att göra GET/POST/PUT/DELETE mot MockAPI.
 * @param {string} url - endpoint-URL
 * @param {string} method - HTTP-metod, t.ex. "GET", "POST"
 * @param {object|null} body - data som ska skickas med (för POST/PUT)
 */
async function requestMock(url, method = "GET", body = null) {
  const opts = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(url, opts);
  if (!res.ok) {
    // Ger ett tydligt felmeddelande i konsolen om något går fel
    throw new Error(`HTTP ${res.status} ${res.statusText} — ${url}`);
  }
  // Vissa DELETE-svar kan vara 204 (utan innehåll)
  if (res.status === 204) return null;
  return res.json();
}

// --- DOM-referenser för “Mina favoritfilmer” ---
const userMovieForm = qid("userMovieForm");
const userMoviesList = qid("userMoviesList");
const umTitle = qid("um-title");
const umRating = qid("um-rating");

/**
 * Hämtar alla användarfilmer från MockAPI (GET) och renderar dem.
 */
async function fetchUserMovies() {
  try {
    const data = await requestMock(MOCK_BASE, "GET");
    const list = Array.isArray(data) ? data : [];
    renderUserMovies(list);
  } catch (err) {
    console.error("Failed to fetch user movies:", err);
    if (userMoviesList) {
      userMoviesList.innerHTML =
        '<p style="color:var(--gray)">Kunde inte hämta användarfilmer.</p>';
    }
  }
}

/**
 * Renderar listan av användarfilmer i DOM:en.
 * @param {Array} list - array av filmobjekt från MockAPI
 */
function renderUserMovies(list) {
  if (!userMoviesList) return;

  // Nollställer listan varje gång
  userMoviesList.innerHTML = "";
  if (!list.length) {
    userMoviesList.innerHTML = "<p>Inga användarfilmer än.</p>";
    return;
  }

  list.forEach((m) => {
    const item = document.createElement("div");
    item.className = "user-movie-item";

    // ---- Vänster del (titel + betyg) ----
    const leftBox = document.createElement("div");

    const titleEl = document.createElement("strong");
    titleEl.textContent = m.title;

    const ratingEl = document.createElement("span");
    ratingEl.style.opacity = "0.85";
    ratingEl.style.marginLeft = "0.4rem";
    ratingEl.textContent = `(${m.rating}★)`;

    leftBox.append(titleEl, ratingEl);

    // ---- Höger del (Edit/Delete-knappar) ----
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

    // ---- Lägg ihop och lägg till i listan ----
    item.append(leftBox, rightBox);
    userMoviesList.append(item);
  });

  // === Event-hanterare för Delete-knappar ===
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

  // === Event-hanterare för Edit-knappar ===
  userMoviesList.querySelectorAll(".btn-edit").forEach((btn) =>
    btn.addEventListener("click", async (e) => {
      const id = e.currentTarget.dataset.id;

      // Enkel edit-lösning: prompta ny titel och nytt betyg
      const currentTitle =
        btn.closest(".user-movie-item").querySelector("strong").textContent ||
        "";
      const newTitle = prompt("Ny titel:", currentTitle);
      if (newTitle === null) return; // Avbrutet

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

// ==================== Lägg till ny användarfilm (POST) ====================

userMovieForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!umTitle || !umRating) return;

  const title = (umTitle.value || "").trim();
  const rating = parseInt(umRating.value, 10);

  // Enkel validering innan vi skickar POST
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

// Körs när sidan laddas – hämtar befintliga favoritfilmer
fetchUserMovies();
