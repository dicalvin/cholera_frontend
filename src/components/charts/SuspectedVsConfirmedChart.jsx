import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ZAxis,
  ReferenceLine,
  Legend,
  Cell,
} from 'recharts'
import { motion } from 'framer-motion'

function SuspectedVsConfirmedChart({ data = [] }) {
  const xMax = data.length
    ? Math.max(...data.map((item) => item.sCh || 0))
    : 0
  const yMax = data.length
    ? Math.max(...data.map((item) => item.cCh || 0))
    : 0
  const roundedMax = (value) => {
    if (!value) return 10
    const magnitude = 10 ** Math.floor(Math.log10(value))
    return Math.ceil(value / magnitude) * magnitude
  }
  const xDomain = [0, roundedMax(xMax)]
  const yDomain = [0, roundedMax(yMax)]
  const avgPositivity =
    data.length > 0
      ? data.reduce((sum, item) => sum + (item.positivity || 0), 0) / data.length
      : 0
  const avgCfr =
    data.length > 0
      ? data.reduce((sum, item) => sum + (item.cfr || 0), 0) / data.length
      : 0

  const colorByPositivity = (value) => {
    if (value >= 75) return '#991b1b'
    if (value >= 50) return '#dc2626'
    if (value >= 25) return '#fb923c'
    return '#0ea5e9'
  }

  const renderTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    const point = payload[0].payload
    return (
      <div className="chart-tooltip">
        <strong>{point.label}</strong>
        <p>
          sCh: <span>{point.sCh.toLocaleString()}</span>
        </p>
        <p>
          cCh: <span>{point.cCh.toLocaleString()}</span>
        </p>
        <p>
          Deaths: <span>{point.deaths.toLocaleString()}</span>
        </p>
        <p>
          Positivity: <span>{point.positivity?.toFixed(1) ?? 0}%</span>
        </p>
        <p>
          CFR: <span>{point.cfr?.toFixed(2) ?? 0}%</span>
        </p>
      </div>
    )
  }

  return (
    <motion.article
      className="chart-card"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <div className="section-header">
        <div>
          <h3>sCh vs cCh relationship</h3>
          <p>Each dot is a report; circle size reflects reported deaths.</p>
        </div>
        <div className="stat-chips">
          <span className="stat-chip">
            Avg positivity {avgPositivity.toFixed(1)}%
          </span>
          <span className="stat-chip">Avg CFR {avgCfr.toFixed(2)}%</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={340}>
        <ScatterChart margin={{ top: 12, right: 16, bottom: 8, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            type="number"
            dataKey="sCh"
            name="Suspected cases"
            domain={xDomain}
            allowDecimals={false}
            tickFormatter={(value) =>
              value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value
            }
          />
          <YAxis
            type="number"
            dataKey="cCh"
            name="Confirmed cases"
            domain={yDomain}
            allowDecimals={false}
          />
          <ZAxis
            dataKey="deaths"
            range={[50, 320]}
            name="Reported deaths"
            unit=""
          />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} content={renderTooltip} />
          {Math.max(xDomain[1], yDomain[1]) > 0 && (
            <ReferenceLine
              segment={[
                { x: 0, y: 0 },
                {
                  x: Math.max(xDomain[1], yDomain[1]),
                  y: Math.max(xDomain[1], yDomain[1]),
                },
              ]}
              stroke="#94a3b8"
              strokeDasharray="4 4"
              label={{ value: 'Parity line (sCh = cCh)', position: 'insideEnd' }}
            />
          )}
          <Legend />
          <Scatter data={data} name="Situation report" shape="circle" opacity={0.85}>
            {data.map((entry) => (
              <Cell key={entry.id} fill={colorByPositivity(entry.positivity || 0)} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </motion.article>
  )
}

export default SuspectedVsConfirmedChart


