import { useState } from "react"
import { Button } from "../components/ui/button"
import axios from "axios"
import { useNavigate } from "react-router-dom"

function Plan() {
  const [formData, setFormData] = useState({
    location: "",
    noOfDays: "",
    budget: "",
    traveler: ""
  })

  const [tripResult, setTripResult] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const navigate = useNavigate()

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const onGenerateTrip = async () => {
    setLoading(true)
    setError("")
    setTripResult("")

    try {
      const response = await axios.post("http://localhost:5000/api/trip", formData)

const { tripPlan, weather, hotels } = response.data

// Optional: Save to localStorage to support reload
localStorage.setItem("tripData", JSON.stringify(tripPlan))
localStorage.setItem("weather", JSON.stringify(weather))
localStorage.setItem("hotels", JSON.stringify(hotels))

// Navigate to TripResult with all data
navigate("/trip", {
  state: {
    tripData: tripPlan,
    weather: weather,
    hotels: hotels
  }
})


     
    } catch (err) {
      setError("Failed to generate trip. Please try again.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const SelectBudgetOptions = [
    { title: "Budget", icon: "💸", desc: "Low cost, budget friendly" },
    { title: "Moderate", icon: "💰", desc: "Balanced experience" },
    { title: "Luxury", icon: "💎", desc: "Premium and luxury stay" }
  ]

  const SelectTravelList = [
    { title: "Solo", icon: "🧍", people: "Solo", desc: "Travel alone" },
    { title: "Couple", icon: "👫", people: "Couple", desc: "With a partner" },
    { title: "Group", icon: "👨‍👩‍👧‍👦", people: "Group", desc: "Family or friends" }
  ]

  return (
    <div className="sm:px-10 md:px-32 lg:px-56 px-5 mt-10">
      <div className="text-center mb-10">
        <h2 className="font-bold text-3xl">Tell us your travel preferences 🏝️ 🌴</h2>
        <p className="mt-3 text-gray-500 text-xl">Just provide some basic info, and we'll generate your custom trip!</p>
      </div>

      <div className="mt-20 flex flex-col gap-10">
        {/* Destination */}
        <div>
          <h2 className="text-xl mb-3 font-medium">Where do you want to go?</h2>
          <input
            type="text"
            placeholder="e.g. Goa, Paris, Tokyo"
            className="border rounded-md p-3 w-full"
            value={formData.location}
            onChange={(e) => handleInputChange("location", e.target.value)}
          />
        </div>

        {/* Days */}
        <div>
          <h2 className="text-xl mb-3 font-medium">How many days?</h2>
          <input
            type="number"
            placeholder="e.g. 5"
            className="border rounded-md p-3 w-full"
            value={formData.noOfDays}
            onChange={(e) => handleInputChange("noOfDays", e.target.value)}
          />
        </div>

        {/* Budget */}
        <div>
          <h2 className="text-xl mb-3 font-medium">Your Budget</h2>
          <div className="grid grid-cols-3 gap-4">
            {SelectBudgetOptions.map((item, index) => (
              <div
                key={index}
                onClick={() => handleInputChange('budget', item.title)}
                className={`p-4 border cursor-pointer rounded-lg text-center ${
                  formData.budget === item.title 
                    ? 'border-2 border-blue-500 bg-blue-50' 
                    : 'border hover:shadow-md'
                }`}
              >
                <div className="text-4xl mb-2">{item.icon}</div>
                <h3 className="font-semibold text-lg">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Travelers */}
        <div>
          <h2 className="text-xl mb-3 font-medium">Who are you traveling with?</h2>
          <div className="grid grid-cols-3 gap-4">
            {SelectTravelList.map((item, index) => (
              <div
                key={index}
                onClick={() => handleInputChange('traveler', item.people)}
                className={`p-4 border cursor-pointer rounded-lg text-center ${
                  formData.traveler === item.people 
                    ? 'border-2 border-blue-500 bg-blue-50' 
                    : 'border hover:shadow-md'
                }`}
              >
                <div className="text-4xl mb-2">{item.icon}</div>
                <h3 className="font-semibold text-lg">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Generate Trip */}
        <div className="mt-8 flex justify-center">
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-lg"
            onClick={onGenerateTrip}
            disabled={loading}
          >
            {loading ? "Generating..." : "Generate Trip ✈️"}
          </Button>
        </div>

        {/* Result */}
        {error && <p className="text-red-600 text-center mt-4">{error}</p>}
        {tripResult && (
          <div className="mt-10 p-5 border border-blue-200 bg-blue-50 rounded-lg whitespace-pre-wrap">
            <h2 className="text-xl font-semibold mb-3">Your Trip Plan:</h2>
            <p>{tripResult}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Plan
