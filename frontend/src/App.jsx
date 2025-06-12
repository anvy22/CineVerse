import { useEffect, useState } from 'react'
import './App.css'
import Search from '../src/components/search'
import Spinner from '../src/components/Spinner'
import MovieCard from './components/MovieCard'
import { useDebounce } from 'react-use'
import { updateCount } from './utils/updateCount' 
import { getTopMovies } from './utils/getTopMovies'
import { SignedIn, SignedOut, SignUp } from '@clerk/clerk-react'
import { useUser } from '@clerk/clerk-react';
import { getSuggestions } from './utils/getSuggestions'
import MovieDetails from './components/MovieDetails'
import Navbar from './components/Navbar'
import WatchListCard from './components/WatchlistCard'

const BASE_URL ='https://api.themoviedb.org/3'
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const options = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: `Bearer ${API_KEY}`
  }
};

function App() {
  const [searchTerm, setSearchTerm] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [movieData, setMovieData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deBounceTerm, setdeBounceTerm] = useState("");
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [suggestions, setSuggestions] = useState(null);
  const [selectedMovieId, setSelectedMovieId] = useState(null);
  const [isWatchlistSelected, setWatchlistSelected] = useState(false);
  const [watchlistData,setWatchlistData] = useState([]);

  const { user } = useUser();

  // Fetch movies based on search or discover
  const fetchMovies = async (query = '') => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const endpoint = query 
        ? `${BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
        : `${BASE_URL}/discover/movie?sort_by=popularity.desc`;
      
      const response = await fetch(endpoint, options);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // TMDB uses 'success' property for errors
      if (data.success === false) {
        setErrorMessage(data.status_message || "Error fetching movies.");
        setMovieData([]);
        return;
      }
      
      setMovieData(data.results || []);
      
      if (query && data.results.length > 0 && user) {
        updateCount(query, data.results[0], user.id);
      }
    } catch (error) {
      setErrorMessage("Error fetching movies. Please try again.");
      console.error("Error fetching movies:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMovieSelect = (movieId) => {
    setSelectedMovieId(movieId);
  };

  const handleBackToMovies = () => {
    setSelectedMovieId(null);
  };

  const fetchTopMovies = async () => {
    try {
      const data = await getTopMovies(); 
      setTrendingMovies(data);
    } catch (error) {
      console.error("Error fetching top movies:", error);
    }
  };

  const fetchSuggestions = async () => {
    try {
      if (user) {
        const suggestions = await getSuggestions(user.id);
        setSuggestions(suggestions);
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    }
  };

  // Initial data fetching
  useEffect(() => {
    fetchTopMovies();
    if (user) {
      fetchSuggestions();
      // Fetch initial movies only if not in watchlist view
      if (!isWatchlistSelected) {
        fetchMovies();
      }
    }
  }, [user]);

useEffect(() => {
  const handleWatchlistUpdate = (e) => {
    const removedId = e.detail;
    setWatchlistData(prev => prev.filter(movie => movie.id !== removedId));
  };

  window.addEventListener('watchlistUpdated', handleWatchlistUpdate);
  
  return () => {
    window.removeEventListener('watchlistUpdated', handleWatchlistUpdate);
  };
}, []);

  // Debounced search
  useDebounce(() => {
    setdeBounceTerm(searchTerm);
  }, 500, [searchTerm]);

  // Fetch when debounced term changes
  useEffect(() => {
    if (!isWatchlistSelected) {
      fetchMovies(deBounceTerm);
    }
  }, [deBounceTerm, isWatchlistSelected]);

  return (
    <main>
      <SignedOut>
        <div className="flex justify-center items-center h-screen">
          <SignUp/>
        </div>
      </SignedOut>
      
      <SignedIn>
        {selectedMovieId ? (
          <MovieDetails 
            movieId={selectedMovieId} 
            onBack={handleBackToMovies} 
          />
        ) : (
          <> 
           
            <div className="pattern"/>
            <div className='wrapper'>
            <Navbar 
              isWatchlistSelected={isWatchlistSelected}
              setWatchlistSelected={setWatchlistSelected}
              setWatchlistData={setWatchlistData}
            />
            
            
              {isWatchlistSelected ? (
                // Watchlist View
                <section className='all-movies'>
                  <h2 className='pt-7'>Your Watchlist</h2>
                  <div className='flex items-center justify-center'>
                    {watchlistData.length === 0 ? (
                      <p className="text-white text-center py-10">
                        Your watchlist is empty. Add some movies!
                      </p>
                    ) : (
                      <ul>
                        {watchlistData.map((movie) => (
                          <WatchListCard
                            key={movie.id}
                            movie={movie}
                            onClick={handleMovieSelect}
                          />
                        ))}
                      </ul>
                    )}
                  </div>
                </section>
              ) : (
                // Home View
                <>
                  <header>
                    <img src='./hero.png' alt='Movie Finder logo' />
                    <h1>Find The <span className='text-gradient'>Movies</span> You Like</h1>
                  </header>
                
                  {trendingMovies?.length > 0 && (
                    <section className='trending'>
                      <h2>Trending Movies</h2>
                      <ul>
                        {trendingMovies.map((movie, index) => (
                          <li 
                            key={movie._id} 
                            onClick={() => handleMovieSelect(movie._id)} 
                            className="cursor-pointer hover:scale-105 transition-transform"
                          >
                            <p>{index + 1}</p>
                            <img 
                              src={movie.posterPath} 
                              alt={`${movie.title} poster`}
                              onError={(e) => {
                                e.target.onerror = null; 
                                e.target.src = './no-movie.png';
                              }}
                            />
                          </li>
                        ))}
                      </ul>
                      <Search 
                        searchTerm={searchTerm} 
                        setSearchTerm={setSearchTerm}
                      />
                    </section>
                  )}
                  
                  <section className='all-movies'>
                    <h2 className='pt-7'>{searchTerm ? "Search Results" : "Popular Movies"}</h2>
                    <div className='flex items-center justify-center'>
                      {isLoading ? (
                        <Spinner />
                      ) : errorMessage ? (
                        <p className='text-red-500'>{errorMessage}</p>
                      ) : movieData.length === 0 ? (
                        <p className="text-white">No movies found</p>
                      ) : (
                        <ul>
                          {movieData.map((movie) => (
                            <MovieCard
                              key={movie.id}
                              movie={movie}
                              onClick={handleMovieSelect}
                            />
                          ))}
                        </ul>
                      )}
                    </div>
                  </section>
                  
                  {suggestions?.length > 0 && (
                    <>
                      <h2 className='mt-5'>Recommended For You</h2>
                      <section className='trending'>
                        <ul>
                          {suggestions[0]?.recommendations.map((movie) => (
                            <li 
                              key={movie.id}      
                              onClick={() => handleMovieSelect(movie.id)} 
                              className="cursor-pointer hover:scale-105 transition-transform"
                            >
                              <img 
                                src={
                                  movie.backdrop_path 
                                    ? `https://image.tmdb.org/t/p/w500${movie.backdrop_path}`
                                    : './no-movie.png'
                                } 
                                alt={movie.title}
                                onError={(e) => {
                                  e.target.onerror = null; 
                                  e.target.src = './no-movie.png';
                                }}
                              />
                            </li>
                          ))}
                        </ul>
                      </section>
                    </>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </SignedIn>
    </main>
  );
}

export default App;