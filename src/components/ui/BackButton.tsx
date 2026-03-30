import { useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { Button } from "./button"

interface BackButtonProps {
  to?: string
  children?: React.ReactNode
  className?: string
  variant?: "default" | "ghost" | "outline"
}

export function BackButton({
  to,
  children = "Back",
  className = "",
  variant = "ghost"
}: BackButtonProps) {
  const navigate = useNavigate()

  const handleClick = () => {
    if (to) {
      navigate(to)
    } else {
      navigate(-1) // Go back to previous page
    }
  }

  return (
    <Button
      onClick={handleClick}
      variant={variant}
      className={`flex items-center space-x-2 hover:scale-105 transition-transform ${className}`}
      aria-label="Go back to previous page"
    >
      <ArrowLeft className="h-4 w-4" />
      <span>{children}</span>
    </Button>
  )
}
