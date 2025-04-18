import axios from 'axios';  // Axios for HTTP requests
import genAI from "../config/gemini.js";  // Gemini integration
import dotenv from 'dotenv';  // Import dotenv to load environment variables

dotenv.config();  // Load environment variables from .env file

// Use the environment variable for Unsplash API key
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

// Function to fetch images from Unsplash
const fetchImageFromUnsplash = async (query) => {
  try {
    const response = await axios.get('https://api.unsplash.com/search/photos', {
      params: {
        query: query,  // Search query (e.g., "Eiffel Tower")
        client_id: UNSPLASH_ACCESS_KEY,  // Use API key from environment variable
        per_page: 1,  // Number of results per request (can adjust)
      },
    });

    // Return the URL of the first image
    return response.data.results[0]?.urls?.regular || null;
  } catch (error) {
    console.error('Error fetching image from Unsplash:', error);
    return null;  // Return null if an error occurs
  }
};

// In your generateTrip controller
export const generateTrip = async (req, res) => {
  const { location, noOfDays, budget, traveler } = req.body;

  const prompt = `
  Create a ${noOfDays}-day travel itinerary for a ${traveler} visiting ${location} on a ${budget} budget.
  
  Each day should begin with "Day X:" and include:
  - 3 to 5 time slots (e.g. 9 AM – 11 AM)
  - Place name
  - Short description of 2 lines
  - Local tips
  - Add image URLs (ending in .jpg or .png) where appropriate
  Format as plain text with each activity on a new line.
  `;
  try {
    // Use the correct model name
    const model = genAI.getGenerativeModel({ model: "models/gemini-1.5-pro-001" });

    const result = await model.generateContent([prompt]);
    const response = await result.response;
    const text = response.text();

    // Extract locations from the generated text
    const locationMatches = text.match(/[A-Z][a-zA-Z\s]+(Museum|Palace|Tower|Garden|Cathedral|Park|Market|Square|Bridge|Temple|Castle|Gallery)/g) || [];
    const uniqueLocations = [...new Set(locationMatches)];

    // Fetch images for each location
    const locationImages = await Promise.all(
      uniqueLocations.map(async (place) => {
        const imageUrl = await fetchImageFromUnsplash(place);
        return { place, imageUrl };
      })
    );

    // Add image references to the text
    let enhancedTrip = text;
    locationImages.forEach(({ place, imageUrl }) => {
      if (imageUrl) {
        // Find all instances of this place in the text and add image reference after
        const regex = new RegExp(`(${place})`, 'g');
        enhancedTrip = enhancedTrip.replace(regex, `$1 (Image: ${imageUrl})`);
      }
    });

    res.status(200).json({ tripPlan: enhancedTrip });
  } catch (error) {
    console.error("Gemini error:", error);
    res.status(500).json({ error: "Failed to generate trip plan." });
  }
};