import { motion } from 'framer-motion'
import CholeraMap from '../components/CholeraMap'

function MapPage({
  loading,
  error,
  geoData,
  geoError,
  districtStats,
  dateRange,
  dataUpdatedAt,
}) {
  return (
    <div className="page">
      <motion.section
        className="hero secondary"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div>
          <p className="eyebrow">Geospatial intelligence</p>
          <h1>Interactive cholera map</h1>
          <p className="lede">
            Explore district-level burden from live Supabase data. Hover and click districts for
            suspected, confirmed, and death trends.
          </p>
        </div>
      </motion.section>

      {loading && <p className="status-text">Loading map data…</p>}
      {error && <p className="status-text error">{error}</p>}

      {!loading && !error && (
        <CholeraMap
          geoData={geoData}
          districtStats={districtStats}
          geoError={geoError}
          dateRange={dateRange}
          dataUpdatedAt={dataUpdatedAt}
        />
      )}
    </div>
  )
}

export default MapPage
