🎬 CineFine – Movie App

En responsiv och dynamisk filmsida byggd i **HTML**, **CSS** och **JavaScript**.
Applikationen hämtar aktuell filminformation från **The Movie Database (TMDB)** och visar populära filmer, topplistor, kommande premiärer och filmer som spelas just nu.
Användaren kan även söka efter filmer, se detaljer i en modal, spara egna betyg lokalt och hantera en lista med egna favoritfilmer via en MockAPI-tjänst.

---

## ✅ Funktioner

### TMDB-integration

- Hämtar filmer från TMDBs API:
  - Populära filmer
  - Filmer med högst betyg
  - Kommande filmer
  - Filmer som spelas just nu
- Visar titel, poster och beskrivning.
- Roternade **hero-bild** baserad på slumpade populära filmer.

### Sök

- Sökfält i navbaren.
- Live-sök som triggas när användaren skriver minst 2 tecken.
- Visar upp till 20 träffar i en separat “Sökresultat”-sektion.

### Detaljvy & betyg (LocalStorage)

- Klick på ett filmkort öppnar en egenbyggd modal.
- Modalen visar:
  - Titel
  - Premiärdatum
  - Regissör
  - De fem första skådespelarna
  - TMDB-betyg (vote average)
- Användaren kan sätta ett eget betyg (1–5 stjärnor).
- Betyget sparas i **localStorage** så att det finns kvar vid omladdning.
- Möjlighet att ta bort sitt eget betyg för en film.

### “Mina favoritfilmer” – CRUD med MockAPI

- Formulär där användaren kan:
  - Lägga till en egen film (titel + betyg 1–5).
- Listan hämtas från en **MockAPI**-endpoint.
- För varje post går det att:
  - **Editera** (ändra titel och betyg) – PUT
  - **Ta bort** filmen – DELETE
- Visar användarvänliga felmeddelanden om något går fel med API-anropen.

### Övriga UI-funktioner

- Responsiv layout med **Bootstrap 5**.
- Scrollbara filmrader med egen scrollbar-styling.
- “Back to top”-knapp som visas efter att man har scrollat en bit.
- Enkel login-modal (frontend-only) som demonstrerar formulärhantering.

---

## 🧰 Tekniker & verktyg

- **HTML5** – semantisk struktur för innehåll och sidor (index + Om oss).
- **CSS3** – egen design med variabler, responsivitet och komponent-styling.
- **JavaScript (ES6+)**
  - `fetch` och `async/await` för API-anrop.
  - DOM-manipulation för att skapa filmkort och modaler dynamiskt.
  - Eventhantering för formulär, knappar och scroll.
  - LocalStorage för sparade betyg.
- **Bootstrap 5** – layout, navbar och modalkomponent.
- **MockAPI** – REST-API för användarens egna filmer (GET/POST/PUT/DELETE).
- **TMDB** – extern datakälla för filmer.

---

## 🔧 Installation & körning

1. **Klona eller ladda ner** projektet som zip.
2. Öppna projektmappen i din kodeditor (t.ex. VS Code).
3. Starta projektet genom att:
   - Antingen öppna `index.html` direkt i webbläsaren
   - Eller använda en extension som **Live Server** i VS Code.

> Ingen backend krävs – hela applikationen körs i webbläsaren.

---

## 🔑 API-nyckel (TMDB)

Projektet använder en TMDB API-nyckel som är inlagd direkt i JavaScript-koden.
Detta är gjort enbart i **utbildningssyfte** för att förenkla bedömning och körning av skolprojektet.
I en produktionsmiljö skulle nyckeln istället hanteras på serversidan eller via miljövariabler.

---

## 📄 Strukturer

- `index.html` – startsida med filmsektioner, sök, login-modal och “Mina favoritfilmer”.
- `OmOss.html` – informationssida om tjänsten CineFine.
- `style.css` – all egen styling för hero, kort, modaler, CRUD-lista m.m.
- `index.js` – logik för:
  - TMDB-anrop och rendering av kort
  - Sökfunktion och detaljmodal
  - LocalStorage-betyg
  - CRUD mot MockAPI för favoritfilmer

---

## ✨ Vidareutvecklingsidéer

Om projektet skulle byggas ut ytterligare skulle följande kunna läggas till:

- Filtrering baserat på genre (använda `genre_ids` från TMDB).
- Visning av trailers via TMDBs `/videos`-endpoint och inbäddad YouTube-spelare.
- Visa användarens egna betyg direkt på filmkorten.
- Paginering av sökresultat.
- En enkel inloggning med mockad användare och differentierade vyer.

---

## 📝 Övrigt

Projektet är utvecklat som ett **skolprojekt** och fokuserar på:

- Förståelse för HTTP-anrop och externa API:er.
- Dynamisk DOM-hantering i JavaScript.
- Hantering av persistent data med LocalStorage.
- Enkel CRUD-funktionalitet mot ett REST API (MockAPI).
