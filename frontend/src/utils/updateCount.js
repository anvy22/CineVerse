export const updateCount = async (SearchTerm, movie,userId) => {

  const url = `${import.meta.env.VITE_BACKEND_BASE_URL}/trending/update`;
  const {id,title,poster_path,genre_ids,vote_average} = movie;
 

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      searchTerm: SearchTerm,
      movieId: id,
      movieName: title,
      posterPath: `https://image.tmdb.org/t/p/w500${poster_path}`,
      userId:userId,
      genre_ids:genre_ids,
      vote_average:vote_average,
    }),
  };

  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error(`Error updating count: ${error}`);
  }
};
