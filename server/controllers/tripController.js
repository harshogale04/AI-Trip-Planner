import axios from 'axios';
import genAI from '../config/gemini.js';
import dotenv from 'dotenv';

dotenv.config();

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
const OPENWEATHER_KEY = process.env.OPENWEATHER_KEY;
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

// Fetch image from Unsplash
const fetchImageFromUnsplash = async (query) => {
  try {
    const response = await axios.get('https://api.unsplash.com/search/photos', {
      params: { query, client_id: UNSPLASH_ACCESS_KEY, per_page: 1 },
    });
    return response.data.results[0]?.urls?.regular || null;
  } catch (error) {
    console.error('Error fetching image from Unsplash:', error.message);
    return null;
  }
};

// Fetch city coordinates using GeoDB Cities API
const fetchCityCoordinates = async (cityName) => {
  try {
    const response = await axios.get('https://wft-geo-db.p.rapidapi.com/v1/geo/cities', {
      params: { namePrefix: cityName, limit: 1 },
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'wft-geo-db.p.rapidapi.com',
      },
    });
    const city = response.data.data[0];
    if (!city) {
      console.warn(`No coordinates found for ${cityName}`);
      return { lat: 35.6762, lon: 139.6503 }; // Fallback to Tokyo coordinates
    }
    console.log(`Coordinates for ${cityName}:`, { lat: city.latitude, lon: city.longitude });
    return { lat: city.latitude, lon: city.longitude };
  } catch (error) {
    console.error('Error fetching city coordinates:', error.message);
    return { lat: 35.6762, lon: 139.6503 }; // Fallback to Tokyo coordinates
  }
};

// Fetch weather forecast from OpenWeatherMap
const fetchWeatherForecast = async (lat, lon, noOfDays) => {
  try {
    const response = await axios.get('https://api.openweathermap.org/data/2.5/forecast', {
      params: {
        lat,
        lon,
        cnt: noOfDays * 8, // 3-hour intervals per day
        appid: OPENWEATHER_KEY,
        units: 'metric',
      },
    });
    if (!response.data.list || response.data.list.length === 0) {
      console.warn('No weather data available from OpenWeatherMap');
      return Array(noOfDays).fill({ temp: 'N/A', weather: 'Data unavailable', icon: null });
    }
    console.log('Raw weather data fetched:', response.data.list);
    const dailyForecasts = [];
    const forecasts = response.data.list;
    for (let i = 0; i < Math.min(forecasts.length, noOfDays * 8); i += 8) {
      const forecast = forecasts[i] || forecasts[0]; // Fallback to first if not enough data
      dailyForecasts.push({
        date: new Date(forecast.dt * 1000).toLocaleDateString(),
        temp: forecast.main.temp,
        weather: forecast.weather[0].description,
        icon: `http://openweathermap.org/img/wn/${forecast.weather[0].icon}.png`,
      });
    }
    // Pad with fallback if fewer days than requested
    while (dailyForecasts.length < noOfDays) {
      dailyForecasts.push({ temp: 'N/A', weather: 'Data unavailable', icon: null });
    }
    console.log('Processed weather data:', dailyForecasts);
    return dailyForecasts;
  } catch (error) {
    console.error('Error fetching weather:', error.message, error.response?.data);
    return Array(noOfDays).fill({ temp: 'N/A', weather: 'Data unavailable', icon: null });
  }
};

// Fetch hotels from Travel Advisor (using RapidAPI)
const fetchHotels = async (lat, lon) => {
  try {
    const response = await axios.get('https://travel-advisor.p.rapidapi.com/hotels/list-by-latlng', {
      params: { latitude: lat, longitude: lon, limit: 5, lang: 'en_US' },
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'travel-advisor.p.rapidapi.com',
      },
    });
    const hotels = response.data.data || [];
    if (hotels.length === 0) {
      console.warn('No hotels found for the given coordinates');
      return [];
    }
    console.log('Hotels fetched:', hotels);
    return hotels.map(hotel => ({
      name: hotel.name || 'Unnamed Hotel',
      rating: hotel.rating || 'N/A',
      address: hotel.address || 'No address provided',
      price: hotel.price || 'Price not available',
      photo: hotel.photo?.images?.medium?.url || null,
    }));
  } catch (error) {
    console.error('Error fetching hotels:', error.message, error.response?.data);
    return [];
  }
};

// Generate trip controller
export const generateTrip = async (req, res) => {
  const { location, noOfDays, budget, traveler, startDate } = req.body;

  if (!location || !noOfDays) {
    return res.status(400).json({ error: 'Location and number of days are required.' });
  }

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
    const coordinates = await fetchCityCoordinates(location);
    const [weatherData, hotels] = await Promise.all([
      fetchWeatherForecast(coordinates.lat, coordinates.lon, noOfDays),
      fetchHotels(coordinates.lat, coordinates.lon),
    ]);

    const model = genAI.getGenerativeModel({ model: 'models/gemini-1.5-pro-001' });
    const result = await model.generateContent([prompt]);
    const response = await result.response;
    let text = response.text();

    const locationMatches = text.match(/[A-Z][a-zA-Z\s]+(Museum|Palace|Tower|Garden|Cathedral|Park|Market|Square|Bridge|Temple|Castle|Gallery)/g) || [];
    const uniqueLocations = [...new Set(locationMatches)];

    const locationImages = await Promise.all(
      uniqueLocations.map(async (place) => {
        const imageUrl = await fetchImageFromUnsplash(place);
        return { place, imageUrl };
      })
    );

    let enhancedTrip = text;
    locationImages.forEach(({ place, imageUrl }) => {
      if (imageUrl) {
        const regex = new RegExp(`(${place})`, 'g');
        enhancedTrip = enhancedTrip.replace(regex, `$1 (Image: ${imageUrl})`);
      }
    });

    res.status(200).json({
      tripPlan: enhancedTrip,
      weather: weatherData,
      hotels: hotels,
    });
  } catch (error) {
    console.error('Error generating trip:', error.message);
    res.status(500).json({ error: 'Failed to generate trip plan. Please try again later.' });
  }
};