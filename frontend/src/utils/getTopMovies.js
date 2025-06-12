export const getTopMovies = async () => {

  const url = `${import.meta.env.VITE_BACKEND_BASE_URL}/trending/get`;
 

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error(`Error fetching top 10 movies: ${error}`);
  }
};
