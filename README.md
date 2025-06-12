
# CINEVERSE

CINEVERSE is a modern movie discovery web application that allows users to explore trending films, view detailed movie information, and manage a personalized watchlist. Built using React, TailwindCSS, Flask (Python), and TMDB API, it provides a clean, responsive interface and robust functionality.

## Features

- Trending movies display (via TMDB)
- Search movies by name
- View detailed movie information (poster, rating, language, release year, etc.)
- Add and remove movies from a personal Watchlist
- Responsive UI with TailwindCSS and custom animations
- Built-in Flask API for watchlist management and personalization
- Dark mode-friendly design

## Tech Stack

| Frontend        | Backend    | API & Data      | Styling        |
|------------------|-------------|------------------|------------------|
| React.js         | Flask       | TMDB API         | TailwindCSS     |
| Vite             | Flask REST  | Custom endpoints | PostCSS         |

## Folder Structure

```
CINEVERSE/
│
├── client/                  # React frontend
│   ├── public/
│   ├── src/
│   │   ├── assets/          # Images and icons
│   │   ├── components/      # Reusable components (MovieCard, WatchlistCard, etc.)
│   │   ├── pages/           # Home, Details, Watchlist
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── tailwind.config.js
│
├── server/                  # Backend (Flask)
│   ├── routes/
│   ├── controllers/
│   ├── app.py
│   └── .env
│
├── README.md
└── requirements.txt
```

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/cineverse.git
cd cineverse
```

### 2. Install Frontend Dependencies

```bash
cd frontend
npm install
```

### 3. Start Frontend

```bash
npm run dev
```

### 4. Setup Backend

```bash
cd ../backend
pip install -r requirements.txt
python app.py
```

Make sure to configure your TMDB API key and CORS settings properly in the backend.

## Environment Variables

Create a `.env` file in both frontend and backend:

### Frontend `.env`

```
VITE_TMDB_API_KEY=your_tmdb_key
VITE_BACKEND_BASE_URL=backend url 
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_key
```

### Backend `.env`

```
TMDB_API_KEY=your_tmdb_key
MONGO_URI=your_db_url
DB_NAME=Db_name

```

## Upcoming Improvements

- Pagination and infinite scroll
- User reviews and comments
- Authentication and user accounts
- Personalized movie recommendations using machine learning
- PWA support

## Credits

- TMDB API (https://www.themoviedb.org/documentation/api)
- TailwindCSS

## License

This project is licensed under the MIT License.
