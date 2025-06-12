import { useEffect, useState } from 'react';
import Spinner from './Spinner';
import { BookmarkPlus } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';

const MovieDetails = ({ movieId, onBack }) => {
  const [movie, setMovie] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingError,setaddingError] = useState("");
  const [isWatchlist, setWatchlist] = useState(false);

  const { user } = useUser();

  const addToWatchlist = async(movieId)=>{

   

    const url = `${import.meta.env.VITE_BACKEND_BASE_URL}/addToWatchList`;

    const options = {
      method: 'POST',
      headers: {
         'Content-Type': 'application/json',
          accept: 'application/json',
    },
    body: JSON.stringify({
         userId:user.id,
         movieId:movieId
    }),
  };

    try{
        console.log(url,options)
        const response = await fetch(url,options);
         if (!response.ok) {
           throw new Error(`Server responded with status: ${response.status}`);
         }
        const data = await response.json()
        setWatchlist(true);
        console.log("ADDED TO WATCHLIST:",data)
    }catch(error){
        setaddingError("Failed to add movie to the watchlist.");
        console.log(`Error adding to watchlist:${error} `);
    }finally{
        setTimeout(()=>{ 
            setaddingError("")
            setWatchlist(false)
        },1000);
    }

  }

  useEffect(() => {
    const fetchMovieDetails = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `https://api.themoviedb.org/3/movie/${movieId}?append_to_response=credits,videos`,
          {
            method: 'GET',
            headers: {
              accept: 'application/json',
              Authorization: `Bearer ${import.meta.env.VITE_TMDB_API_KEY}`
            }
          }
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch movie details');
        }
        
        const data = await response.json();
        console.log("Sep Movie:",data)
        setMovie(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (movieId) {
      fetchMovieDetails();
    }
  }, [movieId]);

  if (isLoading) return <div className="flex justify-center items-center h-64"><Spinner /></div>;
  if (error) return <div className="text-red-500 text-center p-4">Error: {error}</div>;
  if (!movie) return <div className="text-center p-4">No movie found</div>;

  return (
    <div className="movie-details p-4 max-w-6xl mx-auto">
      
      <div className="flex flex-col md:flex-row gap-6">
        <img
          src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
          alt={movie.title}
          className="w-full md:w-1/3 rounded-lg shadow-lg"
        />
        
        <div className="flex-1">
          <h1 className="text-3xl font-bold">
            {movie.title} 
            <span className="text-gray-400 ml-2">
              ({new Date(movie.release_date).getFullYear()})
            </span>
          </h1>

          {addingError && (
            <p className="text-red-500 text-center p-4">{addingError}</p>
          )}
          
          {
            isWatchlist && (<p className="text-white text-center p-4">Added To Watchlist.</p>)
          }

          <div className="flex gap-4 my-3 items-center justify-center ">
            <span className="bg-yellow-500 text-black px-2 py-1 rounded text-sm font-bold ">
              {movie.vote_average.toFixed(1)}/10
            </span>
            <span className='bg-yellow-500 text-black px-2 py-1 rounded text-sm font-bold '>{movie.original_language}</span>
            <span className='bg-yellow-500 text-black px-2 py-1 rounded text-sm font-bold '>{movie.origin_country   }</span>
            <BookmarkPlus className="text-gray-300 hover:text-gray-500" onClick={() => addToWatchlist(movie.id)} />
          </div>
          
          <p className="my-4 text-gray-300">{movie.overview}</p>
          
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-2">Genres</h2>
            <div className="flex flex-wrap gap-2">
              {movie.genres?.map(genre => (
                <span key={genre.id} className="px-3 py-1 bg-gray-700 rounded-full text-sm">
                  {genre.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
      <button 
        onClick={onBack}
        className="mb-4 px-4 py-2 bg-gray-800 text-white mt-4 rounded hover:bg-gray-700 transition"
      >
        ← Back to Movies
      </button>
      
    </div>
  );
};

export default MovieDetails;