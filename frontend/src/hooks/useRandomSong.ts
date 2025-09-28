import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { fetchRandomSong } from "@/services/recommend"

export function useRandomSong() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)

  const getRandomSong = async () => {
    try {
      setIsLoading(true)
      const songId = await fetchRandomSong()
      navigate(`/songs/${songId}?source=random`)
    } catch (error) {
      console.error("Failed to fetch random song:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  return {
    getRandomSong,
    isLoading,
  }
}