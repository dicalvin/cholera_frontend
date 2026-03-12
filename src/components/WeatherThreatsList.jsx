import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { UGANDA_LOCATIONS } from '../hooks/useWeatherData'

const WEATHER_API_KEY = 'cb60f5e160d84029b55112040252711'
const WEATHER_BASE_URL = 'https://api.weatherapi.com/v1'

// Fetch 14-day forecast for a location
function useTwoWeekForecast(location = 'kampala') {
  const [forecastData, setForecastData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loc = UGANDA_LOCATIONS[location] || UGANDA_LOCATIONS.kampala

    const fetchForecast = async () => {
      try {
        const response = await fetch(
          `${WEATHER_BASE_URL}/forecast.json?key=${WEATHER_API_KEY}&q=${loc.query}&days=14&aqi=no&alerts=yes`
        )

        if (!response.ok) {
          throw new Error('Failed to fetch forecast')
        }

        const data = await response.json()
        setForecastData(data)
        setError('')
      } catch (err) {
        setError(err.message)
        setForecastData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchForecast()
  }, [location])

  return { forecastData, loading, error }
}

// Analyze threats from forecast
function analyzeThreats(forecastData, locationName) {
  if (!forecastData || !forecastData.forecast) return []

  const threats = []
  const forecastDays = forecastData.forecast.forecastday || []

  forecastDays.forEach((day) => {
    const date = new Date(day.date)
    const maxTemp = day.day.maxtemp_c
    const minTemp = day.day.mintemp_c
    const totalPrecip = day.day.totalprecip_mm
    const avgHumidity = day.day.avghumidity
    const maxWind = day.day.maxwind_kph
    const condition = day.day.condition.text.toLowerCase()

    // Extreme heat threat
    if (maxTemp >= 38) {
      threats.push({
        date: day.date,
        dateFormatted: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        time: 'All day',
        location: locationName,
        condition: `Extreme Heat: ${maxTemp.toFixed(1)}°C`,
        severity: 'critical',
        icon: '🔥',
        description: 'Extreme temperatures increase water contamination risk and dehydration',
      })
    } else if (maxTemp >= 35) {
      threats.push({
        date: day.date,
        dateFormatted: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        time: 'All day',
        location: locationName,
        condition: `High Temperature: ${maxTemp.toFixed(1)}°C`,
        severity: 'warning',
        icon: '🌡️',
        description: 'Elevated temperatures increase water contamination risk',
      })
    }

    // Extreme cold threat
    if (minTemp <= 12) {
      threats.push({
        date: day.date,
        dateFormatted: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        time: 'All day',
        location: locationName,
        condition: `Extreme Cold: ${minTemp.toFixed(1)}°C`,
        severity: 'critical',
        icon: '❄️',
        description: 'Very low temperatures may affect water infrastructure',
      })
    }

    // Heavy rainfall threat
    if (totalPrecip >= 50) {
      threats.push({
        date: day.date,
        dateFormatted: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        time: 'All day',
        location: locationName,
        condition: `Heavy Rainfall: ${totalPrecip.toFixed(1)}mm`,
        severity: 'critical',
        icon: '🌧️',
        description: 'Heavy rainfall can cause flooding and contaminate water sources',
      })
    } else if (totalPrecip >= 25) {
      threats.push({
        date: day.date,
        dateFormatted: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        time: 'All day',
        location: locationName,
        condition: `Moderate Rainfall: ${totalPrecip.toFixed(1)}mm`,
        severity: 'warning',
        icon: '🌦️',
        description: 'Moderate rainfall may affect water quality',
      })
    }

    // Strong winds threat
    if (maxWind >= 50) {
      threats.push({
        date: day.date,
        dateFormatted: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        time: 'All day',
        location: locationName,
        condition: `Strong Winds: ${maxWind.toFixed(0)} km/h`,
        severity: 'warning',
        icon: '💨',
        description: 'Strong winds may affect water infrastructure',
      })
    }
  })

  return threats.sort((a, b) => new Date(a.date) - new Date(b.date))
}

function WeatherThreatsList() {
  const [threats, setThreats] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAllThreats = async () => {
      setLoading(true)
      const allThreats = []

      for (const [key, location] of Object.entries(UGANDA_LOCATIONS)) {
        try {
          const response = await fetch(
            `${WEATHER_BASE_URL}/forecast.json?key=${WEATHER_API_KEY}&q=${location.query}&days=14&aqi=no&alerts=yes`
          )
          if (response.ok) {
            const data = await response.json()
            const locationThreats = analyzeThreats(data, location.name)
            allThreats.push(...locationThreats)
          }
        } catch (err) {
          console.error(`Error fetching threats for ${location.name}:`, err)
        }
      }

      // Sort by date and severity
      allThreats.sort((a, b) => {
        const dateCompare = new Date(a.date) - new Date(b.date)
        if (dateCompare !== 0) return dateCompare
        if (a.severity === 'critical' && b.severity !== 'critical') return -1
        if (a.severity !== 'critical' && b.severity === 'critical') return 1
        return 0
      })

      setThreats(allThreats)
      setLoading(false)
    }

    fetchAllThreats()
  }, [])

  if (loading) {
    return (
      <motion.section
        className="chart-card wide"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div className="section-header">
          <h3>Weather Threats Forecast (Next 14 Days)</h3>
          <p>Analyzing weather conditions across all districts...</p>
        </div>
        <div className="status-text">Loading threat analysis...</div>
      </motion.section>
    )
  }

  const criticalThreats = threats.filter((t) => t.severity === 'critical')
  const warningThreats = threats.filter((t) => t.severity === 'warning')

  return (
    <motion.section
      className="chart-card wide"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <div className="section-header">
        <div>
          <h3>Weather Threats Forecast (Next 14 Days)</h3>
          <p>Potential weather-related threats that could impact cholera transmission across districts.</p>
        </div>
        {threats.length > 0 && (
          <div className="threat-summary-badges">
            <div className="threat-badge critical">
              {criticalThreats.length} Critical
            </div>
            <div className="threat-badge warning">
              {warningThreats.length} Warnings
            </div>
          </div>
        )}
      </div>

      {threats.length > 0 ? (
        <div className="threats-list-grid">
          {threats.map((threat, idx) => (
            <motion.div
              key={`${threat.date}-${threat.location}-${idx}`}
              className={`threat-item ${threat.severity}`}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
            >
              <div className="threat-icon">{threat.icon}</div>
              <div className="threat-content">
                <div className="threat-header">
                  <div>
                    <h4>{threat.location}</h4>
                    <span className="threat-date">{threat.dateFormatted}</span>
                  </div>
                  <span className={`threat-severity-badge ${threat.severity}`}>
                    {threat.severity === 'critical' ? '🔴 Critical' : '🟡 Warning'}
                  </span>
                </div>
                <div className="threat-condition">
                  <strong>{threat.condition}</strong>
                </div>
                <div className="threat-time">
                  <span>⏰ Time:</span> {threat.time}
                </div>
                <div className="threat-description">{threat.description}</div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="weather-status-ok">
          <span className="status-icon">✅</span>
          <div>
            <strong>No Significant Threats Detected</strong>
            <p>
              The 14-day forecast shows no extreme weather conditions that would
              significantly impact cholera transmission across monitored districts.
            </p>
          </div>
        </div>
      )}
    </motion.section>
  )
}

export default WeatherThreatsList

