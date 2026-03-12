import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { UGANDA_LOCATIONS } from '../hooks/useWeatherData'

const WEATHER_API_KEY = 'cb60f5e160d84029b55112040252711'
const WEATHER_BASE_URL = 'https://api.weatherapi.com/v1'

// Analyze interventions needed from forecast
function analyzeInterventions(forecastData, locationName) {
  if (!forecastData || !forecastData.forecast) return []

  const interventions = []
  const forecastDays = forecastData.forecast.forecastday || []
  const today = new Date()

  // Analyze 14-day forecast for intervention needs
  const maxTemp = Math.max(...forecastDays.map((d) => d.day.maxtemp_c))
  const minTemp = Math.min(...forecastDays.map((d) => d.day.mintemp_c))
  const totalPrecip = forecastDays.reduce((sum, d) => sum + d.day.totalprecip_mm, 0)
  const avgHumidity = forecastDays.reduce((sum, d) => sum + d.day.avghumidity, 0) / forecastDays.length

  // Extreme heat interventions
  if (maxTemp >= 38) {
    const actionDate = new Date(today)
    actionDate.setDate(actionDate.getDate() + 3)
    interventions.push({
      location: locationName,
      type: 'extreme_heat',
      severity: 'critical',
      title: 'Water Treatment & Distribution',
      description: 'Extreme heat requires immediate water quality interventions',
      interventions: [
        'Deploy mobile water treatment units',
        'Increase water quality testing frequency',
        'Establish emergency water distribution points',
        'Launch public health campaigns',
      ],
      actionDate: actionDate,
      icon: '💧',
    })
  }

  // Heavy rainfall interventions
  if (totalPrecip >= 200) {
    const actionDate = new Date(today)
    actionDate.setDate(actionDate.getDate() + 5)
    interventions.push({
      location: locationName,
      type: 'flood_preparation',
      severity: 'critical',
      title: 'Flood Response Preparation',
      description: 'Heavy rainfall requires flood response interventions',
      interventions: [
        'Pre-position emergency water treatment equipment',
        'Activate flood monitoring protocols',
        'Prepare mobile health teams',
        'Stockpile treatment supplies',
      ],
      actionDate: actionDate,
      icon: '🌊',
    })
  } else if (totalPrecip >= 100) {
    const actionDate = new Date(today)
    actionDate.setDate(actionDate.getDate() + 3)
    interventions.push({
      location: locationName,
      type: 'water_quality',
      severity: 'warning',
      title: 'Water Quality Monitoring',
      description: 'Moderate rainfall requires enhanced water quality monitoring',
      interventions: [
        'Monitor water quality in flood-prone areas',
        'Ensure backup water sources available',
        'Prepare for infrastructure disruptions',
      ],
      actionDate: actionDate,
      icon: '🔍',
    })
  }

  // Combined risk interventions
  if (maxTemp >= 32 && totalPrecip >= 50) {
    const actionDate = new Date(today)
    actionDate.setDate(actionDate.getDate() + 3)
    interventions.push({
      location: locationName,
      type: 'combined_response',
      severity: 'critical',
      title: 'Multi-Hazard Response',
      description: 'Combined heat and rainfall requires comprehensive response',
      interventions: [
        'Implement enhanced surveillance protocols',
        'Increase water treatment capacity',
        'Coordinate multi-sectoral response',
        'Prepare for rapid case escalation',
      ],
      actionDate: actionDate,
      icon: '⚡',
    })
  }

  return interventions
}

function WeatherInterventionsSummary() {
  const [interventions, setInterventions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAllInterventions = async () => {
      setLoading(true)
      const allInterventions = []

      for (const [key, location] of Object.entries(UGANDA_LOCATIONS)) {
        try {
          const response = await fetch(
            `${WEATHER_BASE_URL}/forecast.json?key=${WEATHER_API_KEY}&q=${location.query}&days=14&aqi=no&alerts=yes`
          )
          if (response.ok) {
            const data = await response.json()
            const locationInterventions = analyzeInterventions(data, location.name)
            allInterventions.push(...locationInterventions)
          }
        } catch (err) {
          console.error(`Error fetching interventions for ${location.name}:`, err)
        }
      }

      // Sort by severity and action date
      allInterventions.sort((a, b) => {
        if (a.severity === 'critical' && b.severity !== 'critical') return -1
        if (a.severity !== 'critical' && b.severity === 'critical') return 1
        return a.actionDate - b.actionDate
      })

      setInterventions(allInterventions)
      setLoading(false)
    }

    fetchAllInterventions()
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
          <h3>Weather-Based Intervention Summaries</h3>
          <p>Analyzing forecasted weather disasters and required interventions...</p>
        </div>
        <div className="status-text">Loading intervention analysis...</div>
      </motion.section>
    )
  }

  const criticalInterventions = interventions.filter((i) => i.severity === 'critical')
  const warningInterventions = interventions.filter((i) => i.severity === 'warning')

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
          <h3>Weather-Based Intervention Summaries</h3>
          <p>
            Required interventions based on forecasted weather disasters that could impact
            cholera response effectiveness across districts.
          </p>
        </div>
        {interventions.length > 0 && (
          <div className="intervention-summary-badges">
            <div className="intervention-badge critical">
              {criticalInterventions.length} Critical
            </div>
            <div className="intervention-badge warning">
              {warningInterventions.length} Warnings
            </div>
          </div>
        )}
      </div>

      {interventions.length > 0 ? (
        <div className="interventions-list">
          {interventions.map((intervention, idx) => (
            <motion.div
              key={`${intervention.location}-${intervention.type}-${idx}`}
              className={`intervention-item ${intervention.severity}`}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
            >
              <div className="intervention-icon">{intervention.icon}</div>
              <div className="intervention-content">
                <div className="intervention-header">
                  <div>
                    <h4>{intervention.location}</h4>
                    <span className="intervention-type">{intervention.title}</span>
                  </div>
                  <span className={`intervention-severity-badge ${intervention.severity}`}>
                    {intervention.severity === 'critical' ? '🔴 Critical' : '🟡 Warning'}
                  </span>
                </div>
                <p className="intervention-description">{intervention.description}</p>
                <div className="intervention-actions">
                  <strong>Required Interventions:</strong>
                  <ul>
                    {intervention.interventions.map((action, actionIdx) => (
                      <li key={actionIdx}>{action}</li>
                    ))}
                  </ul>
                </div>
                <div className="intervention-date">
                  <strong>📅 Action Date:</strong>{' '}
                  {intervention.actionDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="weather-status-ok">
          <span className="status-icon">✅</span>
          <div>
            <strong>No Interventions Required</strong>
            <p>
              The 14-day forecast shows no extreme weather conditions requiring
              specific interventions across monitored districts.
            </p>
          </div>
        </div>
      )}
    </motion.section>
  )
}

export default WeatherInterventionsSummary

