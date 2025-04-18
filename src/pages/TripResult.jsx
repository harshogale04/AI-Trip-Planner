import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Clock, Info } from "lucide-react";
import { useEffect } from "react";

function TripResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const { tripData } = location.state || {};

  useEffect(() => {
    if (!tripData) navigate("/");
  }, [tripData, navigate]);

  const cleanText = (text) => {
    return text
      .replace(/\*\*?:|:\*\*?|\*\*|\*/g, "")
      .replace(/^\s*-+\s*|\s*-+\s*$/g, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  const parseTripData = (text) => {
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

            if (line.match(/^\*\s*\*\*Local Tip:\*\*/i) || line.includes("Local Tip:") || line.match(/^\(i\)Local Tip:/i)) {
              const tipContent = cleanedLine.replace(/Local Tip:/i, "").trim();
              if (currentActivity) {
                currentActivity.tip = tipContent;
              } else {
                currentActivity = { title: "Local Advice", tip: tipContent };
                timeBlock.activities.push(currentActivity);
              }
            } else if (line.includes("http") || line.includes("https://")) {
              const imageMatch = line.match(/(https?:\/\/[^\s)]+)/i);
              if (imageMatch) {
                const imageUrl = imageMatch[1].trim();
                const title = cleanText(line.replace(imageMatch[0], ""));
                if (title && !seenTitles.has(title)) {
                  currentActivity = { title, image: imageUrl };
                  timeBlock.activities.push(currentActivity);
                  seenTitles.add(title);
                }
              }
            } else if (currentActivity && !line.match(/^\(i\)Local Tip:/i)) {
              currentActivity.description = cleanedLine;
            } else {
              const title = cleanedLine;
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

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-blue-600 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <h1 className="text-2xl md:text-3xl font-bold text-black">Your Travel Itinerary ✈️</h1>
          <Button
            onClick={() => navigate("/")}
            className="bg-white text-blue-700 hover:bg-blue-50 hover:text-blue-800 w-full md:w-auto"
          >
            Plan Another Adventure
          </Button>
        </div>
        <p className="mt-4 text-blue-100 max-w-2xl">
          Explore your personalized trip plan with curated activities and local recommendations.
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">
        {parseTripData(tripData).map((day, index) => (
          <div key={index} className="mb-24">
            <h2 className="text-2xl font-bold text-black mb-6">{day.title}</h2>
            {/* Render time blocks in pairs */}
            {day.timeBlocks.map((_, i) => {
              if (i % 2 !== 0) return null; // Only handle even indexes
              const block1 = day.timeBlocks[i];
              const block2 = day.timeBlocks[i + 1];

              return (
                <div key={i} className="grid grid-cols-2 gap-4 mb-6">
                  {[block1, block2].map((block, idx) =>
                    block ? (
                      <Card
                        key={idx}
                        className="overflow-hidden shadow-md rounded-lg w-full h-48"
                      >
                        <CardHeader className="py-3 px-4 bg-gray-50">
                          <h4 className="font-semibold text-md text-orange-600 flex items-center">
                            <Clock className="mr-2 h-4 w-4 text-orange-500" />{" "}
                            {block.timeRange}
                          </h4>
                        </CardHeader>
                        <CardContent className="p-4 flex flex-col justify-between h-full">
                          {block.activities[0]?.image && (
                            <img
                              src={block.activities[0].image}
                              alt={
                                block.activities[0].title || "Activity image"
                              }
                              className="w-full h-24 object-cover mb-2 rounded"
                            />
                          )}
                          <div>
                            <h4 className="font-semibold text-md text-black mb-2">
                              {block.activities[0]?.title || "No activity"}
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
                      <div key={idx} /> // Empty block if none
                    )
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export default TripResult;
