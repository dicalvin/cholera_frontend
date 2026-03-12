import { useState, useEffect } from 'react'

// Weather API configuration - WeatherAPI.com
const WEATHER_API_KEY = 'cb60f5e160d84029b55112040252711'
const WEATHER_BASE_URL = 'https://api.weatherapi.com/v1'

// Uganda major cities (for multi-location monitoring)
const UGANDA_LOCATIONS = {
  kampala: { name: 'Kampala', query: 'Kampala,Uganda', region: 'Central' },
  gulu: { name: 'Gulu', query: 'Gulu,Uganda', region: 'Northern' },
  mbale: { name: 'Mbale', query: 'Mbale,Uganda', region: 'Eastern' },
  mbarara: { name: 'Mbarara', query: 'Mbarara,Uganda', region: 'Western' },
  jinja: { name: 'Jinja', query: 'Jinja,Uganda', region: 'Eastern' },
  arua: { name: 'Arua', query: 'Arua,Uganda', region: 'Northern' },
  lira: { name: 'Lira', query: 'Lira,Uganda', region: 'Northern' },
  masaka: { name: 'Masaka', query: 'Masaka,Uganda', region: 'Central' },
  fortportal: { name: 'Fort Portal', query: 'Fort Portal,Uganda', region: 'Western' },
  soroti: { name: 'Soroti', query: 'Soroti,Uganda', region: 'Eastern' },
  hoima: { name: 'Hoima', query: 'Hoima,Uganda', region: 'Western' },
  moroto: { name: 'Moroto', query: 'Moroto,Uganda', region: 'Northern' },
}

// Temperature thresholds for alerts (in Celsius)
const TEMP_THRESHOLDS = {
  high: 35, // High temperature warning
  low: 15, // Low temperature warning
  extremeHigh: 38, // Extreme high temperature alert
  extremeLow: 12, // Extreme low temperature alert
}

// Temperature change threshold (degrees Celsius change in 24h)
const TEMP_CHANGE_THRESHOLD = 8 // Significant change warning

function useWeatherData(location = 'kampala') {
  const [weatherData, setWeatherData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [alerts, setAlerts] = useState([])

  useEffect(() => {
    const fetchWeather = async () => {
      if (!WEATHER_API_KEY) {
        setError('Weather API key not configured')
        setLoading(false)
        return
      }

      const loc = UGANDA_LOCATIONS[location] || UGANDA_LOCATIONS.kampala

      try {
        // WeatherAPI.com: Fetch current weather and forecast in one call
        const response = await fetch(
          `${WEATHER_BASE_URL}/forecast.json?key=${WEATHER_API_KEY}&q=${loc.query}&days=5&aqi=no&alerts=yes`
        )

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          if (response.status === 401) {
            throw new Error(
              `API key authentication failed. Please verify your WeatherAPI.com API key is valid and activated. Error: ${errorData.error?.message || 'Unauthorized'}`
            )
          }
          throw new Error(
            `Weather API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`
          )
        }

        const data = await response.json()
        
        // Transform WeatherAPI.com response to match our component expectations
        const currentData = {
          location: data.location,
          current: data.current,
          main: {
            temp: data.current.temp_c,
            feels_like: data.current.feelslike_c,
            humidity: data.current.humidity,
          },
          weather: [
            {
              main: data.current.condition.text,
              description: data.current.condition.text,
              icon: data.current.condition.icon,
            },
          ],
          wind: {
            speed: data.current.wind_kph / 3.6, // Convert km/h to m/s
          },
        }

        // Transform forecast data
        const forecastData = {
          list: data.forecast.forecastday.flatMap((day) =>
            day.hour.slice(0, 8).map((hour) => ({
              dt: new Date(hour.time).getTime() / 1000,
              time_epoch: new Date(hour.time).getTime() / 1000,
              main: {
                temp: hour.temp_c,
                temp_c: hour.temp_c,
                feels_like: hour.feelslike_c,
                humidity: hour.humidity,
              },
              weather: [
                {
                  main: hour.condition.text,
                  description: hour.condition.text,
                  icon: hour.condition.icon,
                },
              ],
            }))
          ),
        }

        // Process alerts
        const newAlerts = generateAlerts(currentData, forecastData)

        setWeatherData({
          current: currentData,
          forecast: forecastData,
          location: loc.name,
        })
        setAlerts(newAlerts)
        setError('')
      } catch (err) {
        console.error('Weather fetch error:', err)
        setError(err.message || 'Failed to fetch weather data')
        setWeatherData(null)
        setAlerts([])
      } finally {
        setLoading(false)
      }
    }

    fetchWeather()
    // Refresh every 30 minutes
    const interval = setInterval(fetchWeather, 30 * 60 * 1000)

    return () => clearInterval(interval)
  }, [location])

  return { weatherData, loading, error, alerts }
}

function generateAlerts(currentData, forecastData) {
  const alerts = []
  // Handle both OpenWeatherMap format and WeatherAPI.com format
  const currentTemp = currentData.main?.temp ?? currentData.current?.temp_c ?? 0
  const currentFeelsLike = currentData.main?.feels_like ?? currentData.current?.feelslike_c ?? currentTemp
  const currentHumidity = currentData.main?.humidity ?? currentData.current?.humidity ?? 0

  // Temperature alerts
  if (currentTemp >= TEMP_THRESHOLDS.extremeHigh) {
    alerts.push({
      type: 'extreme_high_temp',
      severity: 'critical',
      message: `Extreme high temperature: ${currentTemp.toFixed(1)}°C`,
      description: `Temperatures above ${TEMP_THRESHOLDS.extremeHigh}°C can increase cholera risk due to water contamination and dehydration.`,
      icon: '🌡️',
    })
  } else if (currentTemp >= TEMP_THRESHOLDS.high) {
    alerts.push({
      type: 'high_temp',
      severity: 'warning',
      message: `High temperature: ${currentTemp.toFixed(1)}°C`,
      description: `Elevated temperatures may increase water contamination risk. Monitor water sources closely.`,
      icon: '🌡️',
    })
  }

  if (currentTemp <= TEMP_THRESHOLDS.extremeLow) {
    alerts.push({
      type: 'extreme_low_temp',
      severity: 'critical',
      message: `Extreme low temperature: ${currentTemp.toFixed(1)}°C`,
      description: `Very low temperatures may affect water infrastructure and access.`,
      icon: '❄️',
    })
  } else if (currentTemp <= TEMP_THRESHOLDS.low) {
    alerts.push({
      type: 'low_temp',
      severity: 'warning',
      message: `Low temperature: ${currentTemp.toFixed(1)}°C`,
      description: `Cooler temperatures may impact water access and sanitation.`,
      icon: '🌡️',
    })
  }

  // Temperature change alerts (compare current with forecast)
  if (forecastData && forecastData.list && forecastData.list.length > 0) {
    // Get tomorrow's temperature (approximately 24h from now)
    const tomorrowForecast = forecastData.list.find((item) => {
      const forecastTime = new Date((item.dt || item.time_epoch) * 1000)
      const now = new Date()
      const hoursDiff = (forecastTime - now) / (1000 * 60 * 60)
      return hoursDiff >= 20 && hoursDiff <= 28 // 20-28 hours from now
    })

    if (tomorrowForecast) {
      const tomorrowTemp = tomorrowForecast.main?.temp ?? tomorrowForecast.main?.temp_c ?? currentTemp
      const tempChange = Math.abs(tomorrowTemp - currentTemp)

      if (tempChange >= TEMP_CHANGE_THRESHOLD) {
        const direction = tomorrowTemp > currentTemp ? 'increase' : 'decrease'
        alerts.push({
          type: 'temp_change',
          severity: 'warning',
          message: `Significant temperature ${direction}: ${tempChange.toFixed(1)}°C change expected`,
          description: `Temperature expected to ${direction} from ${currentTemp.toFixed(1)}°C to ${tomorrowTemp.toFixed(1)}°C. This rapid change may impact water quality and access.`,
          icon: '📊',
        })
      }
    }
  }

  // Humidity alerts (high humidity can affect disease spread)
  if (currentHumidity >= 80) {
    alerts.push({
      type: 'high_humidity',
      severity: 'info',
      message: `High humidity: ${currentHumidity}%`,
      description: `High humidity levels may affect water evaporation and storage conditions.`,
      icon: '💧',
    })
  }

  // Weather condition alerts
  const weatherText = (currentData.weather?.[0]?.main || currentData.weather?.[0]?.description || currentData.current?.condition?.text || '').toLowerCase()
  if (weatherText.includes('rain') || weatherText.includes('storm') || weatherText.includes('drizzle')) {
    alerts.push({
      type: 'rain_alert',
      severity: 'warning',
      message: `Rain/Storm conditions detected`,
      description: `Heavy rainfall can cause flooding and contaminate water sources, increasing cholera risk. Monitor water quality closely.`,
      icon: '🌧️',
    })
  }

  // Forecast-based alerts
  if (forecastData && forecastData.list) {
    // Check for extreme temperatures in forecast
    const forecastTemps = forecastData.list
      .slice(0, 8) // Next 24 hours
      .map((item) => item.main?.temp ?? item.main?.temp_c ?? 0)

    const maxForecastTemp = Math.max(...forecastTemps)
    const minForecastTemp = Math.min(...forecastTemps)

    if (maxForecastTemp >= TEMP_THRESHOLDS.extremeHigh) {
      alerts.push({
        type: 'forecast_extreme_high',
        severity: 'warning',
        message: `Extreme heat forecasted: Up to ${maxForecastTemp.toFixed(1)}°C in next 24h`,
        description: `Prepare for extreme temperatures that may increase water contamination risk.`,
        icon: '🔥',
      })
    }

    if (minForecastTemp <= TEMP_THRESHOLDS.extremeLow) {
      alerts.push({
        type: 'forecast_extreme_low',
        severity: 'warning',
        message: `Extreme cold forecasted: Down to ${minForecastTemp.toFixed(1)}°C in next 24h`,
        description: `Prepare for extreme cold that may affect water infrastructure.`,
        icon: '❄️',
      })
    }
  }

  return alerts
}

export default useWeatherData
export { UGANDA_LOCATIONS }

