import { motion } from 'framer-motion'
import WeatherThreatsList from '../components/WeatherThreatsList'
import RecentWeatherAnomalies from '../components/RecentWeatherAnomalies'

function Weather() {
  return (
    <div className="page page--weather">
      <motion.section
        className="hero hero--secondary"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div>
          <p className="eyebrow">Weather monitoring</p>
          <h1>Real-time weather & risk</h1>
          <p className="lede">
            Track key weather threats and recent anomalies that could affect cholera risk.
          </p>
        </div>
        <div className="weather-hero-anim" aria-hidden="true">
          <motion.span
            className="weather-orb weather-orb--one"
            animate={{ y: [0, -8, 0], opacity: [0.5, 0.85, 0.5] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.span
            className="weather-orb weather-orb--two"
            animate={{ y: [0, 10, 0], opacity: [0.55, 0.9, 0.55] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
          />
          <motion.span
            className="weather-orb weather-orb--three"
            animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.75, 0.4] }}
            transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
          />
        </div>
      </motion.section>

      <section className="weather-page-sections weather-page-sections--simplified">
        <div className="weather-section weather-section--threats">
          <WeatherThreatsList />
        </div>

        <div className="weather-section weather-section--anomalies">
          <RecentWeatherAnomalies />
        </div>
      </section>
    </div>
  )
}

export default Weather
