import { Button } from "../components/ui/button"
import { Link } from "react-router-dom"

function Home() {
  return (
    <div className="flex flex-col items-center mx-56 gap-9">
      <h1 className="font-extrabold text-[50px] text-center mt-16">
        <span className="text-[#f56551]">Discover Your Next Adventure with AI:</span> Personalised Itineraries at your fingertips
      </h1>
      <p className="text-xl text-gray-500 text-center">
        Your personal trip and travel curator, creating custom itineraries tailored to your interests and budget.
      </p>

      <Link to="/Plan">
        <Button>Get Started</Button>
      </Link>
    </div>
  )
}

export default Home
