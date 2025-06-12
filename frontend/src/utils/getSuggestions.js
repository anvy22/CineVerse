export const getSuggestions = async (userId) => {
  
  console.log("UserREe:",userId)
  const url = `${import.meta.env.VITE_BACKEND_BASE_URL}/recommend/${userId}`;
 

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Suggestions:",data)
    return data;

  } catch (error) {
    console.error(`Error suggestions movies: ${error}`);
  }
};
