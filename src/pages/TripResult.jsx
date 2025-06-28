import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Clock, Info, Cloud, Hotel } from 'lucide-react';
import { useEffect, useState } from 'react';

function TripResult() {
  const location = useLocation();
  const navigate = useNavigate();

  const [tripData, setTripData] = useState(location.state?.tripData || null);
  const [weather, setWeather] = useState(location.state?.weather || []);
  const [hotels, setHotels] = useState(location.state?.hotels || []);

  console.log('Received state:', { tripData, weather, hotels });

  useEffect(() => {
    if (!tripData) {
      const storedTrip = localStorage.getItem('tripData');
      const storedWeather = localStorage.getItem('weather');
      const storedHotels = localStorage.getItem('hotels');

      if (storedTrip && storedWeather && storedHotels) {
        setTripData(JSON.parse(storedTrip));
        setWeather(JSON.parse(storedWeather));
        setHotels(JSON.parse(storedHotels));
      } else {
        navigate('/');
      }
    }
  }, [tripData, navigate]);

  const cleanText = (text) => {
    return text
      .replace(/\*\*?:|:\*\*?|\*\*|\*/g, '')
      .replace(/^\s*-+\s*|\s*-+\s*$/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const removeTimeRange = (text) => {
    return text.replace(/\d{1,2}(?::\d{2})?\s*(?:AM|PM|am|pm)\s*[-–]\s*\d{1,2}(?::\d{2})?\s*(?:AM|PM|am|pm):/g, '').trim();
  };

  const parseTripData = (text) => {
    if (!text || typeof text !== 'string') return [];

    const dayRegex = /Day \d+:/g;
    const dayMatches = [...text.matchAll(dayRegex)];

    if (dayMatches.length === 0) return [];

    const parsedDays = [];

    for (let i = 0; i < dayMatches.length; i++) {
      const currentMatch = dayMatches[i];
      const nextMatch = dayMatches[i + 1];

      const startIndex = currentMatch.index + currentMatch[0].length;
      const endIndex = nextMatch ? nextMatch.index : text.length;

      const dayContent = text.substring(startIndex, endIndex).trim();
      const dayHeader = cleanText(currentMatch[0]);

      const day = {
        title: dayHeader,
        timeBlocks: [],
      };

      const timeBlockRegex = /(\d{1,2}(?::\d{2})?\s*(?:AM|PM|am|pm)\s*[-–]\s*\d{1,2}(?::\d{2})?\s*(?:AM|PM|am|pm))/gi;
      const timeMatches = [...dayContent.matchAll(timeBlockRegex)];

      let lastEndIndex = 0;
      for (let j = 0; j < timeMatches.length; j++) {
        const currentTimeMatch = timeMatches[j];
        const nextTimeMatch = timeMatches[j + 1];

        const timeBlockStartIndex = currentTimeMatch.index;
        const timeBlockContentStart = lastEndIndex;
        const timeBlockEndIndex = nextTimeMatch ? nextTimeMatch.index : dayContent.length;
        const timeBlockContent = dayContent.substring(timeBlockContentStart, timeBlockEndIndex).trim();
        const timeRange = cleanText(currentTimeMatch[0]);

        const timeBlock = {
          timeRange,
          activities: [],
        };

        if (timeBlockContent.trim()) {
          const lines = timeBlockContent.split(/[\n\r]+/).map((line) => line.trim()).filter(Boolean);
          let currentActivity = null;
          const seenTitles = new Set();

          lines.forEach((line) => {
            const cleanedLine = cleanText(line);
            if (!cleanedLine || cleanedLine === timeRange) return;

            if (line.match(/^\*\s*\*\*Local Tip:\*\*/i) || line.includes('Local Tip:') || line.match(/^\(i\)Local Tip:/i)) {
              const tipContent = cleanedLine.replace(/Local Tip:/i, '').trim();
              if (currentActivity) {
                currentActivity.tip = tipContent;
              } else {
                currentActivity = { title: 'Local Advice', tip: tipContent };
                timeBlock.activities.push(currentActivity);
              }
            } else if (line.includes('http') || line.includes('https://')) {
              const imageMatch = line.match(/(https?:\/\/[^\s)]+)/i);
              if (imageMatch) {
                const imageUrl = imageMatch[1].trim();
                let title = cleanText(line.replace(imageMatch[0], ''));
                title = removeTimeRange(title);

                if (title && !seenTitles.has(title)) {
                  currentActivity = { title, image: imageUrl };
                  timeBlock.activities.push(currentActivity);
                  seenTitles.add(title);
                }
              }
            } else if (currentActivity && !line.match(/^\(i\)Local Tip:/i)) {
              currentActivity.description = cleanedLine;
            } else {
              let title = cleanedLine;
              title = removeTimeRange(title);

              if (title && !seenTitles.has(title)) {
                currentActivity = { title };
                timeBlock.activities.push(currentActivity);
                seenTitles.add(title);
              }
            }
          });
        }

        day.timeBlocks.push(timeBlock);
        lastEndIndex = timeBlockEndIndex;
      }

      parsedDays.push(day);
    }

    return parsedDays;
  };

  if (!tripData) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Card className="p-6 max-w-md w-full">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600 mb-6">No trip data available. Please try planning again.</p>
          <Button onClick={() => navigate('/')} className="w-full">
            Plan Another Trip
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-blue-600 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <h1 className="text-2xl md:text-3xl font-bold text-white">Your Travel Itinerary ✈️</h1>
          <Button
            onClick={() => navigate('/')}
            className="bg-white text-blue-700 hover:bg-blue-50 hover:text-blue-800 w-full md:w-auto"
          >
            Plan Another Adventure
          </Button>
        </div>
        <p className="mt-4 text-blue-100 max-w-2xl">
          Explore your personalized trip plan with curated activities, weather forecasts, and hotel recommendations.
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Weather Summary */}
        {weather && weather.length > 0 ? (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Weather Forecast</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {weather.map((w, index) => (
                <Card key={index} className="p-4">
                  <p className="font-semibold text-gray-800">{w.date || 'N/A'}</p>
                  <p className="text-gray-600">
                    {w.temp === 'N/A' ? 'N/A' : `${w.temp}°C`}, {w.weather || 'N/A'}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Weather Forecast</h2>
            <Card className="p-4">
              <p className="text-gray-600">Weather data unavailable. Check API connection.</p>
            </Card>
          </div>
        )}

        {/* Hotel Recommendations */}
        <div className="mb-12">
  <h2 className="text-2xl font-bold text-gray-800 mb-6">Hotel Recommendations</h2>
  <div className="w-full max-w-6xl mx-auto px-4">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"> {/* tighter gap */}
      {hotels.map((hotel, index) => (
        <Card
          key={index}
          className="overflow-hidden shadow-md rounded-lg w-full **h-[320px]** flex flex-col justify-between" // <- set height
        >
          <CardHeader className="py-2 px-3 bg-gray-50">
            <h4 className="font-semibold text-sm text-blue-600 flex items-center">
              <Hotel className="mr-2 h-4 w-4 text-blue-500" />
              {hotel.name.length > 30 ? hotel.name.slice(0, 30) + '...' : hotel.name}
            </h4>
          </CardHeader>
          <CardContent className="p-3">
            {hotel.photo ? (
              <img
                src={hotel.photo}
                alt={hotel.name}
                className="w-32 h-32 object-cover rounded mb-2"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-32 bg-gray-200 flex items-center justify-center rounded mb-2">
                <span className="text-gray-500 text-sm">No photo available</span>
              </div>
            )}
            <p className="text-xs text-gray-600 mb-1">
              <strong>Rating:</strong> {hotel.rating || 'N/A'}
            </p>
            <p className="text-xs text-gray-600 mb-1">
              <strong>Address:</strong> {hotel.address || 'N/A'}
            </p>
            <p className="text-xs text-gray-600">
              <strong>Price:</strong> {hotel.price || 'N/A'}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
</div>



        {/* Itinerary with Weather */}
        {parseTripData(tripData).length > 0 ? (
          parseTripData(tripData).map((day, index) => (
            <div key={index} className="mb-12">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">{day.title}</h2>
                {weather && weather[index] ? (
                  <div className="flex items-center text-sm text-gray-700">
                    <Cloud className="h-5 w-5 mr-2 text-blue-500" />
                    <span>
                      {weather[index].temp === 'N/A' ? 'N/A' : `${weather[index].temp}°C`}, {weather[index].weather || 'N/A'}
                      {weather[index].icon && (
                        <img src={weather[index].icon} alt="weather icon" className="inline h-5 w-5 ml-2" />
                      )}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center text-sm text-gray-700">
                    <Cloud className="h-5 w-5 mr-2 text-blue-500" />
                    <span>Weather data unavailable</span>
                  </div>
                )}
              </div>
              {day.timeBlocks.map((_, i) => {
                if (i % 2 !== 0) return null;
                const block1 = day.timeBlocks[i];
                const block2 = day.timeBlocks[i + 1];
                console.log(`Pairing blocks ${i + 1} and ${i + 2} for ${day.title}:`, { block1, block2 });

                return (
                  <div key={i} className="grid grid-cols-2 gap-4 mb-6">
                    {[block1, block2].map((block, idx) =>
                      block ? (
                        <Card key={idx} className="overflow-hidden shadow-md rounded-lg">
                          <CardHeader className="py-3 px-4 bg-gray-50">
                            <h4 className="font-semibold text-md text-orange-600 flex items-center">
                              <Clock className="mr-2 h-4 w-4 text-orange-500" />
                              {block.timeRange}
                            </h4>
                          </CardHeader>
                          <CardContent className="p-4 flex flex-col justify-between">
                            {block.activities[0]?.image && (
                              <img
                                src={block.activities[0].image}
                                alt={block.activities[0].title || 'Activity image'}
                                className="w-24 h-24 object-cover rounded mb-2"
                                loading="lazy"
                              />
                            )}
                            <div>
                              <h4 className="font-semibold text-md text-gray-800 mb-2">
                                {block.activities[0]?.title || 'No activity'}
                              </h4>
                              {block.activities[0]?.description && (
                                <p className="text-sm text-gray-600 mb-2">
                                  {block.activities[0].description}
                                </p>
                              )}
                            </div>
                            {block.activities[0]?.tip && (
                              <div className="mt-2 text-sm bg-yellow-50 p-2 rounded flex items-center">
                                <Info className="h-4 w-4 text-yellow-500 mr-2" />
                                <span className="text-yellow-700">
                                  Local Tip: {block.activities[0].tip}
                                </span>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ) : (
                        <div key={idx} />
                      )
                    )}
                  </div>
                );
              })}
            </div>
          ))
        ) : (
          <Card className="p-6">
            <p className="text-gray-600">No itinerary data available. Please try again.</p>
          </Card>
        )}
      </div>
    </div>
  );
}

export default TripResult;
