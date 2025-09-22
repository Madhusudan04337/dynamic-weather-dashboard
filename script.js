class WeatherApp {
  constructor() {
    this.apiKey = "cea05ada28b2489e1b514ed41a97bcb3"
    this.baseUrl = "https://api.openweathermap.org/data/2.5"
    this.units = this.getStoredUnits() || "metric"

    this.init()
  }

  init() {
    this.bindEventListeners()
    this.setupThemeToggle()
  }

  bindEventListeners() {
    const searchButton = document.getElementById("searchBtn")
    const locationInput = document.getElementById("locationInput")
    const locationButton = document.getElementById("locationBtn")
    const unitToggle = document.getElementById("unitToggle")

    searchButton.addEventListener("click", () => this.handleWeatherSearch())
    locationInput.addEventListener("keypress", (event) => {
      if (event.key === "Enter") {
        this.handleWeatherSearch()
      }
    })

    locationButton.addEventListener("click", () => this.getCurrentLocation())

    if (unitToggle) {
      unitToggle.addEventListener("click", () => this.toggleUnits())
      // Set initial button text
      unitToggle.textContent = this.units === "metric" ? "°C" : "°F"
    }
  }

  getCurrentLocation() {
    if (!navigator.geolocation) {
      this.displayError("Geolocation is not supported by this browser.")
      return
    }

    this.showLoadingState()
    this.hideError()

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        this.fetchWeatherByCoordinates(latitude, longitude)
      },
      (error) => {
        this.hideLoadingState()
        switch (error.code) {
          case error.PERMISSION_DENIED:
            this.displayError("Location access denied. Please enable location permissions and try again.")
            break
          case error.POSITION_UNAVAILABLE:
            this.displayError("Location information is unavailable.")
            break
          case error.TIMEOUT:
            this.displayError("Location request timed out. Please try again.")
            break
          default:
            this.displayError("An unknown error occurred while retrieving location.")
            break
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000, 
      }
    )
  }

  async fetchWeatherByCoordinates(lat, lon) {
    try {
      const currentWeatherData = await this.fetchCurrentWeatherByCoords(lat, lon)
      const forecastData = await this.fetchForecastByCoords(lat, lon)

      // Update the input field with the detected location
      document.getElementById("locationInput").value = `${currentWeatherData.name}, ${currentWeatherData.sys.country}`

      this.displayCurrentWeather(currentWeatherData)
      this.displayWeatherForecast(forecastData)
    } catch (error) {
      console.error("Weather fetch by coordinates failed:", error)
      this.handleWeatherApiError(error)
    } finally {
      this.hideLoadingState()
    }
  }

  async fetchCurrentWeatherByCoords(lat, lon) {
    const apiUrl = `${this.baseUrl}/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=${this.units}`
    const response = await fetch(apiUrl)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return response.json()
  }

  async fetchForecastByCoords(lat, lon) {
    const apiUrl = `${this.baseUrl}/forecast?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=${this.units}`
    const response = await fetch(apiUrl)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return response.json()
  }

  async handleWeatherSearch() {
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
    } catch (error) {
      console.error("Weather search failed:", error)
      this.handleWeatherApiError(error)
    } finally {
      this.hideLoadingState()
    }
  }

  async fetchCurrentWeatherByCity(cityName) {
    const apiUrl = `${this.baseUrl}/weather?q=${encodeURIComponent(cityName)}&appid=${this.apiKey}&units=${this.units}`
    const response = await fetch(apiUrl)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return response.json()
  }

  async fetchForecastByCity(cityName) {
    const apiUrl = `${this.baseUrl}/forecast?q=${encodeURIComponent(cityName)}&appid=${this.apiKey}&units=${this.units}`
    const response = await fetch(apiUrl)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return response.json()
  }

  displayCurrentWeather(weatherData) {
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

    const temperatureUnit = this.units === "metric" ? "°C" : "°F"
    const windSpeedUnit = this.units === "metric" ? "m/s" : "mph"

    locationElement.textContent = `${weatherData.name}, ${weatherData.sys.country}`
    dateElement.textContent = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })

    temperatureElement.textContent = `${Math.round(weatherData.main.temp)}${temperatureUnit}`
    descriptionElement.textContent = weatherData.weather[0].description

    feelsLikeElement.textContent = `${Math.round(weatherData.main.feels_like)}${temperatureUnit}`
    humidityElement.textContent = `${weatherData.main.humidity}%`
    windSpeedElement.textContent = `${weatherData.wind.speed} ${windSpeedUnit}`
    pressureElement.textContent = `${weatherData.main.pressure} hPa`

    const weatherIcon = weatherData.weather[0].icon
    weatherIconLarge.src = `https://openweathermap.org/img/wn/${weatherIcon}@4x.png`
    weatherIconLarge.alt = weatherData.weather[0].description
    weatherConditionText.textContent = weatherData.weather[0].description

    currentWeatherCard.classList.remove("hidden")
    weatherIconDisplay.classList.remove("hidden")
  }

  displayWeatherForecast(forecastData) {
    const forecastSection = document.getElementById("forecast")
    const forecastCardsContainer = document.getElementById("forecastCards")

    forecastCardsContainer.innerHTML = ""

    const dailyForecasts = forecastData.list.filter((_, index) => index % 8 === 0).slice(0, 5)
    const temperatureUnit = this.units === "metric" ? "°C" : "°F"

    dailyForecasts.forEach((dayData) => {
      const forecastCard = document.createElement("div")
      forecastCard.className = "forecast-card"

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

      forecastCard.addEventListener("click", () => this.showDetailedForecastPopup(dayData))
      forecastCardsContainer.appendChild(forecastCard)
    })

    forecastSection.classList.remove("hidden")
  }

  showDetailedForecastPopup(dayData) {
    const temperatureUnit = this.units === "metric" ? "°C" : "°F"
    const windSpeedUnit = this.units === "metric" ? "m/s" : "mph"
    const forecastDate = new Date(dayData.dt * 1000).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    })

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

    setTimeout(() => this.hideError(), 5000)
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

  saveUnitsPreference() {
    localStorage.setItem("weatherUnits", this.units)
  }

  getStoredUnits() {
    return localStorage.getItem("weatherUnits")
  }

setupThemeToggle() {
    const themeToggle = document.getElementById("themeToggle");
    const body = document.body;

    // Apply the saved theme on page load
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      body.classList.add("dark");
      themeToggle.textContent = "Light Mode";
    } else {
      themeToggle.textContent = "Dark Mode";
    }

    themeToggle.addEventListener("click", () => {
      body.classList.toggle("dark");

      // Update button text and save preference to localStorage
      if (body.classList.contains("dark")) {
        localStorage.setItem("theme", "dark");
        themeToggle.textContent = "Light Mode";
      } else {
        localStorage.setItem("theme", "light");
        themeToggle.textContent = "Dark Mode";
      }
    });
  }

  toggleUnits() {
    this.units = this.units === "metric" ? "imperial" : "metric"
    this.saveUnitsPreference()

    // Update the toggle button text
    const unitToggle = document.getElementById("unitToggle")
    if (unitToggle) {
      unitToggle.textContent = this.units === "metric" ? "°C" : "°F"
    }

    // Refresh weather data if available
    const locationInput = document.getElementById("locationInput")
    if (locationInput.value.trim()) {
      this.handleWeatherSearch()
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("🌤️ Weather App starting up...")
  new WeatherApp()
  console.log("✅ Weather App initialized successfully!")
})
