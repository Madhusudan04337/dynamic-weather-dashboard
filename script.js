class WeatherApp {
  constructor() {
    // OpenWeatherMap API configuration - Get your free API key at: https://openweathermap.org/api
    this.apiKey = this.getApiKeyFromStorage() || null
    this.baseUrl = "https://api.openweathermap.org/data/2.5"

    this.units = this.getStoredUnits() || "metric" // metric = Celsius, imperial = Fahrenheit
    this.init()
  }
  init() {
    this.bindEventListeners()
    this.loadPreviousSearch()
    this.setupUnitToggleButton()
    this.setupThemeToggleButton()
    this.setupApiKeyInput()
    this.validateApiKey()
  }

  getApiKeyFromStorage() {
    return localStorage.getItem("openweathermap_api_key")
  }

  saveApiKeyToStorage(apiKey) {
    localStorage.setItem("openweathermap_api_key", apiKey)
    this.apiKey = apiKey
  }

  /**
   * Create and set up the API key input field
   * Allows users to enter their OpenWeatherMap API key
   */
  setupApiKeyInput() {
    const containerElement = document.querySelector(".container")

    if (!this.apiKey || this.apiKey.length < 10) {
      const apiKeyContainer = document.createElement("div")
      apiKeyContainer.style.cssText = `
        margin: 2rem 0;
        padding: 1.5rem;
        background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(16, 185, 129, 0.1));
        border: 2px solid rgba(245, 158, 11, 0.2);
        border-radius: 1rem;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      `
      apiKeyContainer.innerHTML = `
        <div style="color: var(--foreground); font-size: 1.125rem; margin-bottom: 1rem; font-weight: 600;">
          <strong>🔑 API Key Required:</strong> Get your free API key from 
          <a href="https://openweathermap.org/api" target="_blank" style="color: var(--primary); text-decoration: underline; font-weight: 700;">OpenWeatherMap</a>
          <br><small style="color: var(--muted-foreground); font-weight: 500;">Sign up → My API Keys → Create new key (takes ~10 minutes to activate)</small>
        </div>
        <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
          <input 
            type="text" 
            id="apiKeyInput" 
            placeholder="Enter your OpenWeatherMap API key" 
            style="flex: 1; min-width: 250px; padding: 0.75rem 1rem; border: 2px solid var(--border); border-radius: 0.75rem; font-size: 1rem; background: var(--input); color: var(--foreground); outline: none;"
          >
          <button 
            id="saveApiKey" 
            style="padding: 0.75rem 1.5rem; background: linear-gradient(135deg, var(--primary), var(--secondary)); color: var(--primary-foreground); border: none; border-radius: 0.75rem; font-size: 1rem; font-weight: 600; cursor: pointer;"
          >
            Save
          </button>
        </div>
      `
      const subtitle = document.querySelector(".subtitle")
      subtitle.parentNode.insertBefore(apiKeyContainer, subtitle.nextSibling)

      // Add event listeners for API key input
      document.getElementById("saveApiKey").addEventListener("click", () => {
        const apiKeyInput = document.getElementById("apiKeyInput")
        const newApiKey = apiKeyInput.value.trim()

        if (newApiKey && newApiKey.length > 10) {
          this.saveApiKeyToStorage(newApiKey)
          apiKeyContainer.remove() // Remove the input after saving
          this.displaySuccess("API key saved successfully! You can now search for weather.")
        } else {
          this.displayError("Please enter a valid API key (should be longer than 10 characters)")
        }
      })

      // Allow Enter key to save API key
      document.getElementById("apiKeyInput").addEventListener("keypress", (event) => {
        if (event.key === "Enter") {
          document.getElementById("saveApiKey").click()
        }
      })
    }
  }

  displaySuccess(message) {
    const successDiv = document.createElement("div")
    successDiv.className = "fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50"
    successDiv.textContent = message
    document.body.appendChild(successDiv)

    setTimeout(() => {
      successDiv.remove()
    }, 3000)
  }

  /**
    Set up all event listeners for user interactions
    Handles search, location detection, and input validation
   */
  bindEventListeners() {
    const searchButton = document.getElementById("searchBtn")
    const locationInput = document.getElementById("locationInput")
    const locationButton = document.getElementById("locationBtn")

    searchButton.addEventListener("click", () => this.handleWeatherSearch())
    locationInput.addEventListener("keypress", (event) => {
      if (event.key === "Enter") {
        this.handleWeatherSearch()
      }
    })

    // Geolocation button click handler
    locationButton.addEventListener("click", () => this.handleCurrentLocationRequest())

    // Real-time input validation as user types
    locationInput.addEventListener("input", (event) => {
      const userInput = event.target.value

      // Check if input contains only valid characters (letters, spaces, commas, periods, hyphens)
      if (userInput.length > 0 && !/^[a-zA-Z\s,.-]+$/.test(userInput)) {
        this.displayError("Please enter a valid city name (letters only).")
      } else {
        this.hideError()
      }
    })
  }

  setupUnitToggleButton() {
    const unitToggleButton = document.getElementById("unitToggle")
    unitToggleButton.textContent = this.units === "metric" ? "°C" : "°F"

    unitToggleButton.addEventListener("click", () => {
      this.units = this.units === "metric" ? "imperial" : "metric"
      this.saveUnitsPreference()

      unitToggleButton.textContent = this.units === "metric" ? "°C" : "°F"

      const currentWeatherCard = document.getElementById("currentWeather")
      if (!currentWeatherCard.classList.contains("hidden")) {
        const currentLocation = document.getElementById("locationInput").value
        if (currentLocation) {
          this.handleWeatherSearch()
        }
      }
    })
  }

  /**
    Create and set up the dark/light mode toggle button
    Allows users to switch between light and dark themes
   */
  setupThemeToggleButton() {
    const themeToggleButton = document.getElementById("themeToggle")

    // Check if user previously selected dark mode
    const isDarkModeEnabled = localStorage.getItem("darkMode") === "true"
    if (isDarkModeEnabled) {
      document.documentElement.classList.add("dark")
      themeToggleButton.textContent = "☀️ Light Mode"
    }

    // Add click handler for theme switching
    themeToggleButton.addEventListener("click", () => {
      const isDarkMode = document.documentElement.classList.toggle("dark")
      localStorage.setItem("darkMode", isDarkMode)
      themeToggleButton.textContent = isDarkMode ? "☀️ Light Mode" : "🌙 Dark Mode"
    })
  }

  /**
    Check if the API key has been configured
    Shows an error message if no valid API key is available
   */
  validateApiKey() {
    if (!this.apiKey || this.apiKey.length < 10) {
      this.displayError(
        "🔑 Please enter your OpenWeatherMap API key above to start using the weather app. Get your free key at openweathermap.org/api",
      )
      return false
    }
    return true
  }

  /**
    Handle weather search requests
    Validates input, fetches weather data, and updates the display
   */
  async handleWeatherSearch() {
    if (!this.validateApiKey()) {
      return
    }

    const locationQuery = document.getElementById("locationInput").value.trim()

    if (!locationQuery) {
      this.displayError("Please enter a city name.")
      return
    }
    if (!/^[a-zA-Z\s,.-]+$/.test(locationQuery)) {
      this.displayError("Please enter a valid city name (letters only).")
      return
    }

    this.showLoadingState()
    this.hideError()

    try {
      const currentWeatherData = await this.fetchCurrentWeatherByCity(locationQuery)
      const forecastData = await this.fetchForecastByCity(locationQuery)

      this.displayCurrentWeather(currentWeatherData)
      this.displayWeatherForecast(forecastData)

      this.saveSearchToStorage(locationQuery, currentWeatherData)
      this.addLocationToSearchHistory(locationQuery)
    } catch (error) {
      console.error("Weather search failed:", error)
      this.handleWeatherApiError(error)
    } finally {
      this.hideLoadingState()
    }
  }

  /**
    Handle requests to use the user's current location
    Uses the browser's Geolocation API to get coordinates
   */
  async handleCurrentLocationRequest() {
    if (!this.validateApiKey()) {
      return
    }

    if (!navigator.geolocation) {
      this.displayError("Geolocation is not supported by this browser.")
      return
    }

    this.showLoadingState()
    this.hideError()

    const geolocationOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000,
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords

          const currentWeatherData = await this.fetchCurrentWeatherByCoords(latitude, longitude)
          const forecastData = await this.fetchForecastByCoords(latitude, longitude)

          this.displayCurrentWeather(currentWeatherData)
          this.displayWeatherForecast(forecastData)
          this.saveSearchToStorage(currentWeatherData.name, currentWeatherData)

          document.getElementById("locationInput").value = currentWeatherData.name
        } catch (error) {
          console.error("Location weather fetch failed:", error)
          this.handleWeatherApiError(error)
        } finally {
          this.hideLoadingState()
        }
      },
      (error) => {
        this.hideLoadingState()
        this.handleGeolocationError(error)
      },
      geolocationOptions,
    )
  }

  /**
    Fetch current weather data for a specific city
    @param {string} cityName - Name of the city to search for
    @returns {Promise<Object>} Weather data from OpenWeatherMap API
   */
  async fetchCurrentWeatherByCity(cityName) {
    const apiUrl = `${this.baseUrl}/weather?q=${encodeURIComponent(cityName)}&appid=${this.apiKey}&units=${this.units}`
    const response = await fetch(apiUrl)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return response.json()
  }

  /**
    Fetch current weather data using geographic coordinates
    @param {number} latitude - Latitude coordinate
    @param {number} longitude - Longitude coordinate
    @returns {Promise<Object>} Weather data from OpenWeatherMap API
   */
  async fetchCurrentWeatherByCoords(latitude, longitude) {
    const apiUrl = `${this.baseUrl}/weather?lat=${latitude}&lon=${longitude}&appid=${this.apiKey}&units=${this.units}`
    const response = await fetch(apiUrl)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return response.json()
  }

  /**
    Fetch 5-day weather forecast for a specific city
    @param {string} cityName - Name of the city to search for
    @returns {Promise<Object>} Forecast data from OpenWeatherMap API
   */
  async fetchForecastByCity(cityName) {
    const apiUrl = `${this.baseUrl}/forecast?q=${encodeURIComponent(cityName)}&appid=${this.apiKey}&units=${this.units}`
    const response = await fetch(apiUrl)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Fetch 5-day weather forecast using geographic coordinates
    @param {number} latitude - Latitude coordinate
    @param {number} longitude - Longitude coordinate
    @returns {Promise<Object>} Forecast data from OpenWeatherMap API
   */
  async fetchForecastByCoords(latitude, longitude) {
    const apiUrl = `${this.baseUrl}/forecast?lat=${latitude}&lon=${longitude}&appid=${this.apiKey}&units=${this.units}`
    const response = await fetch(apiUrl)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return response.json()
  }

  /**
    Display current weather information in the UI
    @param {Object} weatherData - Current weather data from API
   */
  displayCurrentWeather(weatherData) {
    // Get references to all display elements
    const currentWeatherCard = document.getElementById("currentWeather")
    const locationElement = document.getElementById("currentLocation")
    const dateElement = document.getElementById("currentDate")
    const temperatureElement = document.getElementById("currentTemp")
    const descriptionElement = document.getElementById("currentDescription")
    const feelsLikeElement = document.getElementById("feelsLike")
    const humidityElement = document.getElementById("humidity")
    const windSpeedElement = document.getElementById("windSpeed")
    const pressureElement = document.getElementById("pressure")

    const weatherIconDisplay = document.getElementById("weatherIconDisplay")
    const weatherIconLarge = document.getElementById("weatherIconLarge")
    const weatherConditionText = document.getElementById("weatherConditionText")

    // Determine units for display
    const temperatureUnit = this.units === "metric" ? "°C" : "°F"
    const windSpeedUnit = this.units === "metric" ? "m/s" : "mph"

    // Update location and date information
    locationElement.textContent = `${weatherData.name}, ${weatherData.sys.country}`
    dateElement.textContent = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })

    temperatureElement.textContent = `${Math.round(weatherData.main.temp)}${temperatureUnit}`
    descriptionElement.textContent = weatherData.weather[0].description

    // Update additional weather details
    feelsLikeElement.textContent = `${Math.round(weatherData.main.feels_like)}${temperatureUnit}`
    humidityElement.textContent = `${weatherData.main.humidity}%`
    windSpeedElement.textContent = `${weatherData.wind.speed} ${windSpeedUnit}`
    pressureElement.textContent = `${weatherData.main.pressure} hPa`

    const weatherIcon = weatherData.weather[0].icon
    weatherIconLarge.src = `https://openweathermap.org/img/wn/${weatherIcon}@4x.png`
    weatherIconLarge.alt = weatherData.weather[0].description
    weatherConditionText.textContent = weatherData.weather[0].description

    // Show both the weather card and icon display
    currentWeatherCard.classList.remove("hidden")
    weatherIconDisplay.classList.remove("hidden")
  }

  /**
    Display 5-day weather forecast in the UI
    @param {Object} forecastData - Forecast data from API
   */
  displayWeatherForecast(forecastData) {
    const forecastSection = document.getElementById("forecast")
    const forecastCardsContainer = document.getElementById("forecastCards")

    // Clear any existing forecast cards
    forecastCardsContainer.innerHTML = ""

    // Extract daily forecasts (API returns data every 3 hours, so we take every 8th item for daily)
    const dailyForecasts = forecastData.list.filter((_, index) => index % 8 === 0).slice(0, 5)
    const temperatureUnit = this.units === "metric" ? "°C" : "°F"

    dailyForecasts.forEach((dayData) => {
      const forecastCard = document.createElement("div")
      forecastCard.className = "forecast-card"

      // Format date information
      const forecastDate = new Date(dayData.dt * 1000)
      const dayName = forecastDate.toLocaleDateString("en-US", { weekday: "short" })
      const monthDay = forecastDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })

      forecastCard.innerHTML = `
        <div class="forecast-day">${dayName}</div>
        <div class="forecast-date">${monthDay}</div>
        <img src="https://openweathermap.org/img/wn/${dayData.weather[0].icon}@2x.png" 
             alt="${dayData.weather[0].description}" 
             class="forecast-icon">
        <div class="forecast-temp">
          ${Math.round(dayData.main.temp)}${temperatureUnit}
        </div>
        <div class="forecast-desc">${dayData.weather[0].description}</div>
        <div class="temp-range">
          <span>H: ${Math.round(dayData.main.temp_max)}${temperatureUnit}</span>
          <span>L: ${Math.round(dayData.main.temp_min)}${temperatureUnit}</span>
        </div>
      `

      // Add click event for detailed forecast view
      forecastCard.addEventListener("click", () => this.showDetailedForecastPopup(dayData))

      forecastCardsContainer.appendChild(forecastCard)
    })

    // Show the forecast section
    forecastSection.classList.remove("hidden")
  }

  /**
    Show detailed forecast information in a popup
    @param {Object} dayData - Single day forecast data
   */
  showDetailedForecastPopup(dayData) {
    const temperatureUnit = this.units === "metric" ? "°C" : "°F"
    const windSpeedUnit = this.units === "metric" ? "m/s" : "mph"
    const forecastDate = new Date(dayData.dt * 1000).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    })

    // Create detailed forecast message
    const detailedInfo = `Detailed Forecast for ${forecastDate}:

Temperature: ${Math.round(dayData.main.temp)}${temperatureUnit}
Feels like: ${Math.round(dayData.main.feels_like)}${temperatureUnit}
High: ${Math.round(dayData.main.temp_max)}${temperatureUnit}
Low: ${Math.round(dayData.main.temp_min)}${temperatureUnit}
Humidity: ${dayData.main.humidity}%
Wind: ${dayData.wind.speed} ${windSpeedUnit}
Pressure: ${dayData.main.pressure} hPa
Conditions: ${dayData.weather[0].description}`

    alert(detailedInfo)
  }


  showLoadingState() {
    document.getElementById("loading").classList.remove("hidden")
  }


  hideLoadingState() {
    document.getElementById("loading").classList.add("hidden")
  }


  displayError(message) {
    const errorContainer = document.getElementById("error")
    const errorMessageElement = document.getElementById("errorMessage")

    errorMessageElement.textContent = message
    errorContainer.classList.remove("hidden")

    setTimeout(() => {
      this.hideError()
    }, 5000)
  }

  hideError() {
    document.getElementById("error").classList.add("hidden")
  }


  handleWeatherApiError(error) {
    if (error.message.includes("401")) {
      this.displayError("❌ Invalid API key. Please check your OpenWeatherMap API key and try again.")
    } else if (error.message.includes("404")) {
      this.displayError("🏙️ City not found. Please check the spelling and try again.")
    } else if (error.message.includes("429")) {
      this.displayError("⏳ Too many requests. Please wait a moment and try again.")
    } else if (error.message.includes("Failed to fetch")) {
      this.displayError("🌐 Network error. Please check your internet connection and try again.")
    } else {
      this.displayError("⚠️ Unable to fetch weather data. Please try again later.")
    }
  }

  /**
   Handle geolocation errors with specific messages
   @param {GeolocationPositionError} error - Geolocation error object
   */
  handleGeolocationError(error) {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        this.displayError("Location access denied. Please enable location services and try again.")
        break
      case error.POSITION_UNAVAILABLE:
        this.displayError("Location information unavailable. Please search manually.")
        break
      case error.TIMEOUT:
        this.displayError("Location request timed out. Please try again.")
        break
      default:
        this.displayError("Unable to retrieve your location. Please search manually.")
        break
    }
  }

  /**
    Save successful weather search to local storage
    @param {string} location - Location name
    @param {Object} weatherData - Weather data to save
   */
  saveSearchToStorage(location, weatherData) {
    const searchData = {
      location,
      data: weatherData,
      units: this.units,
      timestamp: Date.now(),
    }
    localStorage.setItem("lastWeatherSearch", JSON.stringify(searchData))
  }

  /**
    Load previous weather search from local storage
    Automatically displays the last search if it's recent and units match
   */
  loadPreviousSearch() {
    const savedSearch = localStorage.getItem("lastWeatherSearch")
    if (savedSearch) {
      try {
        const { location, data, units, timestamp } = JSON.parse(savedSearch)

        // Only load if data is less than 10 minutes old and units match current preference
        const tenMinutesAgo = Date.now() - 10 * 60 * 1000
        if (timestamp > tenMinutesAgo && units === this.units) {
          document.getElementById("locationInput").value = location
          this.displayCurrentWeather(data)
        }
      } catch (error) {
        console.error("Error loading previous search:", error)
        localStorage.removeItem("lastWeatherSearch") // Clean up corrupted data
      }
    }
  }

  /**
    Add location to search history for quick access
    @param {string} location - Location name to add to history
   */
  addLocationToSearchHistory(location) {
    let searchHistory = JSON.parse(localStorage.getItem("searchHistory") || "[]")

    // Remove location if it already exists (to avoid duplicates)
    searchHistory = searchHistory.filter((item) => item.toLowerCase() !== location.toLowerCase())

    // Add new location to the beginning of the array
    searchHistory.unshift(location)

    // Keep only the 5 most recent searches
    searchHistory = searchHistory.slice(0, 5)

    localStorage.setItem("searchHistory", JSON.stringify(searchHistory))
    // this.updateSearchSuggestions(searchHistory) // Removed to prevent layout expansion
  }

  /**
    Update search input with suggestions dropdown
    @param {Array<string>} history - Array of recent search locations
   */
  updateSearchSuggestions(history) {
    // This function is now disabled to maintain clean, fixed search bar layout
    return

    const searchInput = document.getElementById("locationInput")
    let suggestionsDropdown = document.getElementById("suggestions")

    // Create suggestions dropdown if it doesn't exist
    if (!suggestionsDropdown) {
      suggestionsDropdown = document.createElement("div")
      suggestionsDropdown.id = "suggestions"
      suggestionsDropdown.className =
        "absolute top-full left-0 right-0 bg-popover border border-border rounded-lg mt-1 shadow-lg z-10 hidden"
      searchInput.parentElement.appendChild(suggestionsDropdown)
    }

    // Show suggestions when input is focused
    searchInput.addEventListener("focus", () => {
      if (history.length > 0) {
        suggestionsDropdown.innerHTML = history
          .map((city) => `<div class="px-4 py-2 hover:bg-muted cursor-pointer text-popover-foreground">${city}</div>`)
          .join("")

        suggestionsDropdown.classList.remove("hidden")

        // Add click handlers to suggestion items
        suggestionsDropdown.querySelectorAll("div").forEach((suggestionItem) => {
          suggestionItem.addEventListener("click", () => {
            searchInput.value = suggestionItem.textContent
            suggestionsDropdown.classList.add("hidden")
            this.handleWeatherSearch()
          })
        })
      }
    })

    // Hide suggestions when input loses focus (with small delay for clicks)
    searchInput.addEventListener("blur", () => {
      setTimeout(() => suggestionsDropdown.classList.add("hidden"), 200)
    })
  }

  /**
    Save user's preferred temperature units to local storage
   */
  saveUnitsPreference() {
    localStorage.setItem("weatherUnits", this.units)
  }

  /**
    Get user's preferred temperature units from local storage
    @returns {string|null} Saved units preference or null if not set
   */
  getStoredUnits() {
    return localStorage.getItem("weatherUnits")
  }
}

/**
  Initialize the Weather App when the page finishes loading
  This ensures all DOM elements are available before we try to access them
 */
document.addEventListener("DOMContentLoaded", () => {
  console.log("🌤️ Weather App starting up...")
  new WeatherApp()
  console.log("✅ Weather App initialized successfully!")
})
