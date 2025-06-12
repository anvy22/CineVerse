import React, { useState } from 'react';
import { useUser } from '@clerk/clerk-react';

const WatchListCard = ({ movie, onClick }) => {
  const { user } = useUser();
  const [isRemoving, setIsRemoving] = useState(false);
  const { title, vote_average, release_date, original_language, poster_path, id } = movie;

  const RemoveFromWatchlist = async (e) => {
    e.stopPropagation();
    setIsRemoving(true);
    
    try {
      if (!user) {
        alert("You need to be logged in to remove movies");
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_BACKEND_BASE_URL}/removeFromWatchList`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          movieId: id
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to remove movie");
      }

      // Trigger a custom event to notify parent component
      const event = new CustomEvent('watchlistUpdated', { detail: id });
      window.dispatchEvent(event);
      
    } catch (error) {
      console.error("Remove error:", error);
      alert(`Failed to remove movie: ${error.message}`);
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className='movie-card' onClick={() => onClick(id)}>
      <img 
        src={poster_path ? `https://image.tmdb.org/t/p/w500${poster_path}` : `./no-movie.png`} 
        alt={title}
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = './no-movie.png';
        }}
      />
      <div>
        <h3>{title}</h3>
      </div>
      <div className='content'>
        <div className='rating'>
          <img src="star.svg" alt="star icon" />
          <p>{vote_average ? vote_average.toFixed(1) : "N/A"}</p>
        </div>
        <span>•</span>
        <p className='lang'>{original_language.toUpperCase()}</p>
        <span>•</span>
        <p className='year'> 
          {release_date ? release_date.split('-')[0] : "N/A"}
        </p>
      </div>
      <button 
        className='mb-4 px-4 py-2 bg-red-500 text-white mt-4 rounded hover:bg-red-700 transition'
        onClick={RemoveFromWatchlist}
        disabled={isRemoving}
      >
        {isRemoving ? 'Removing...' : 'Remove'}
      </button>
    </div>
  )
}

export default WatchListCard;