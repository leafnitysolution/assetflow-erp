import { useState, useEffect } from "react"

export function useTheme() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    const stored = localStorage.getItem("theme")
    if (stored) return stored === "dark"
    return document.documentElement.classList.contains("dark")
  })

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark")
      localStorage.setItem("theme", "dark")
    } else {
      document.documentElement.classList.remove("dark")
      localStorage.setItem("theme", "light")
    }
  }, [isDark])

  return { isDark, setIsDark, toggle: () => setIsDark((p) => !p) }
}
