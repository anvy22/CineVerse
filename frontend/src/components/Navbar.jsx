import { useState } from 'react';
import { useUser } from '@clerk/clerk-react';

function Navbar({ isWatchlistSelected, setWatchlistSelected, setWatchlistData }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useUser();

  const toggleWatchlist = async () => {
    if (isWatchlistSelected) {
      // Switching back to home
      setWatchlistSelected(false);
      // Clear movie data to trigger refetch of discover movies
      setWatchlistData([]);
    } else {
      // Switching to watchlist
      try {
        if (!user) return;
        setWatchlistSelected(true);
        
        const url = `${import.meta.env.VITE_BACKEND_BASE_URL}/getWatchListMovies/${user.id}`;
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error('Failed to fetch watchlist');
        }
        
        const data = await response.json();
        setWatchlistData(data);
        console.log("Watchlist data:", data);
      } catch (error) {
        console.error("Error fetching watchlist:", error);
      }
    }
  };

  return (
    <nav className="text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0 text-xl font-bold">
            {/* Logo or brand name */}
          </div>

          {/* Menu for large screens */}
          <div className="hidden md:flex space-x-6">
            <button 
              className="hover:text-gray-300 text-lg transition"
              onClick={toggleWatchlist}
            >
              {isWatchlistSelected ? "Home" : "Watchlist"}
            </button>
          </div>

          {/* Hamburger menu for small screens */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-white focus:outline-none"
              aria-label="Toggle menu"
              aria-expanded={isMobileMenuOpen}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2"
                viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`md:hidden ${isMobileMenuOpen ? 'block' : 'hidden'} bg-gray-800`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          <button 
            className="block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-700 w-full text-left"
            onClick={() => {
              toggleWatchlist();
              setIsMobileMenuOpen(false);
            }}
          >
            {isWatchlistSelected ? "Home" : "Watchlist"}
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;