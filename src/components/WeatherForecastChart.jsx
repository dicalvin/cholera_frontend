import { motion } from 'framer-motion'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Area,
  AreaChart,
} from 'recharts'
import useWeatherData from '../hooks/useWeatherData'

function WeatherForecastChart({ location = 'kampala' }) {
  const { weatherData, loading, error } = useWeatherData(location)

  if (loading || error || !weatherData) {
    return null
  }

  // Process forecast data for chart
  const forecastData = weatherData.forecast.list
    .slice(0, 8) // Next 24 hours
    .map((item) => {
      const date = new Date((item.dt || item.time_epoch) * 1000)
      const temp = item.main?.temp ?? item.main?.temp_c ?? 0
      const feelsLike = item.main?.feels_like ?? item.main?.feelslike_c ?? temp
      return {
        time: date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          hour12: true,
        }),
        temperature: Math.round(temp),
        feelsLike: Math.round(feelsLike),
        humidity: item.main?.humidity ?? 0,
        label: date.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
        }),
      }
    })

  const currentTemp = weatherData.current.main?.temp ?? weatherData.current.main?.temp_c ?? 0

  return (
    <motion.section
      className="chart-card"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <div className="section-header">
        <h3>24-Hour Temperature Forecast</h3>
        <p>
          Temperature trends for {weatherData.location} - Next 24 hours
        </p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={forecastData}>
          <defs>
            <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis
            label={{ value: 'Temperature (°C)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            formatter={(value, name) => {
              if (name === 'temperature') {
                return [`${value}°C`, 'Temperature']
              }
              if (name === 'feelsLike') {
                return [`${value}°C`, 'Feels Like']
              }
              return [value, name]
            }}
            labelFormatter={(label) => `Time: ${label}`}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="temperature"
            name="Temperature"
            stroke="#3b82f6"
            fillOpacity={1}
            fill="url(#tempGradient)"
            strokeWidth={2}
          />
          <Line
            type="monotone"
            dataKey="feelsLike"
            name="Feels Like"
            stroke="#f59e0b"
            strokeDasharray="4 4"
            strokeWidth={2}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
      <div className="forecast-summary">
        <div className="forecast-stat">
          <span>Current</span>
          <strong>{currentTemp.toFixed(1)}°C</strong>
        </div>
        <div className="forecast-stat">
          <span>High (24h)</span>
          <strong>
            {Math.max(...forecastData.map((d) => d.temperature))}°C
          </strong>
        </div>
        <div className="forecast-stat">
          <span>Low (24h)</span>
          <strong>
            {Math.min(...forecastData.map((d) => d.temperature))}°C
          </strong>
        </div>
      </div>
    </motion.section>
  )
}

export default WeatherForecastChart

