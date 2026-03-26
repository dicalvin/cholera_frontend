import { useMemo, useRef, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import FilterPanel from '../components/FilterPanel'
import SummaryCards from '../components/SummaryCards'
import SuspectedVsConfirmedChart from '../components/charts/SuspectedVsConfirmedChart'
import RegionDistributionChart from '../components/charts/RegionDistributionChart'
import CfrTrendChart from '../components/charts/CfrTrendChart'
import ConfirmedPositivityTrend from '../components/charts/ConfirmedPositivityTrend'
import MonthlySuspectedChart from '../components/charts/MonthlySuspectedChart'
import SeasonalityChart from '../components/charts/SeasonalityChart'
import { createAnalyticsReportPdfBlob } from '../utils/generateAnalyticsReport'

const safeNumber = (value) => {
  const n = Number(value ?? 0)
  return Number.isFinite(n) ? n : 0
}

const meanOf = (nums) => {
  if (!nums.length) return 0
  return nums.reduce((acc, n) => acc + n, 0) / nums.length
}

const modeOfRoundedInt = (nums) => {
  if (!nums.length) return 0
  const counts = new Map()
  nums.forEach((n) => {
    const k = Math.round(n)
    counts.set(k, (counts.get(k) || 0) + 1)
  })
  let bestKey = 0
  let bestCount = -1
  counts.forEach((count, key) => {
    if (count > bestCount) {
      bestCount = count
      bestKey = key
    }
  })
  return bestKey
}

const computeMeanModePreview = (rows) => {
  const suspected = (rows || [])
    .map((r) => safeNumber(r?.sCh ?? r?.suspected))
    .filter((n) => Number.isFinite(n))
  const confirmed = (rows || [])
    .map((r) => safeNumber(r?.cCh ?? r?.confirmed))
    .filter((n) => Number.isFinite(n))
  const deaths = (rows || [])
    .map((r) => safeNumber(r?.deaths ?? r?.death))
    .filter((n) => Number.isFinite(n))

  return {
    suspected: {
      mean: meanOf(suspected),
      mode: modeOfRoundedInt(suspected),
    },
    confirmed: {
      mean: meanOf(confirmed),
      mode: modeOfRoundedInt(confirmed),
    },
    deaths: {
      mean: meanOf(deaths),
      mode: modeOfRoundedInt(deaths),
    },
  }
}

function Analytics({
  loading,
  error,
  dateRange,
  onDateChange,
  dateBounds,
  regionOptions,
  districtOptions,
  selectedRegions,
  selectedDistricts,
  onRegionChange,
  onDistrictChange,
  summary,
  scatterData,
  regionDistribution,
  cfrTrend,
  confirmedPositivity,
  monthlySuspected,
  seasonality,
  filteredData = [],
}) {
  const [generated, setGenerated] = useState(false)
  const [fullscreenKey, setFullscreenKey] = useState(null)
  const [showReportPreview, setShowReportPreview] = useState(false)
  const [reportBusy, setReportBusy] = useState(false)
  const [pdfPreviewBusy, setPdfPreviewBusy] = useState(false)
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null)
  const pdfBlobRef = useRef(null)

  const hasAnyFilter = useMemo(
    () =>
      Boolean(dateRange?.start || dateRange?.end) ||
      (selectedRegions?.length || 0) > 0 ||
      (selectedDistricts?.length || 0) > 0,
    [
      dateRange?.start,
      dateRange?.end,
      selectedRegions?.length,
      selectedDistricts?.length,
    ],
  )

  const chartRegistry = useMemo(
    () => ({
      confirmedPositivity: (
        <ConfirmedPositivityTrend series={confirmedPositivity} />
      ),
      monthlySuspected: <MonthlySuspectedChart data={monthlySuspected} />,
      seasonality: <SeasonalityChart data={seasonality} />,
      cfrTrend: <CfrTrendChart series={cfrTrend} />,
      regionDistribution: (
        <RegionDistributionChart data={regionDistribution} />
      ),
      scatter: <SuspectedVsConfirmedChart data={scatterData} />,
    }),
    [
      confirmedPositivity,
      monthlySuspected,
      seasonality,
      cfrTrend,
      regionDistribution,
      scatterData,
    ],
  )

  const buildChartDataForPdf = useMemo(
    () => ({
      confirmedPositivity,
      monthlySuspected,
      seasonality,
      cfrTrend,
      regionDistribution,
    }),
    [confirmedPositivity, monthlySuspected, seasonality, cfrTrend, regionDistribution],
  )

  const handleClosePreview = useCallback(() => {
    setShowReportPreview(false)
    if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl)
    pdfBlobRef.current = null
    setPdfPreviewUrl(null)
  }, [pdfPreviewUrl])

  const handleOpenPreview = useCallback(async () => {
    if (!filteredData.length) return
    setPdfPreviewBusy(true)
    try {
      // Generate a real PDF first, then render it in an iframe.
      const blob = await createAnalyticsReportPdfBlob({
        rows: filteredData,
        summary,
        dateRange,
        selectedRegions,
        selectedDistricts,
        chartData: buildChartDataForPdf,
      })
      pdfBlobRef.current = blob
      if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl)
      const url = URL.createObjectURL(blob)
      setPdfPreviewUrl(url)
      setShowReportPreview(true)
    } catch (e) {
      console.error(e)
    } finally {
      setPdfPreviewBusy(false)
    }
  }, [
    filteredData,
    summary,
    dateRange,
    selectedRegions,
    selectedDistricts,
    buildChartDataForPdf,
    pdfPreviewUrl,
  ])

  const handleDownloadPdf = useCallback(async () => {
    if (!filteredData.length) return
    setReportBusy(true)
    try {
      let blob = pdfBlobRef.current
      if (!blob) {
        blob = await createAnalyticsReportPdfBlob({
          rows: filteredData,
          summary,
          dateRange,
          selectedRegions,
          selectedDistricts,
          chartData: buildChartDataForPdf,
        })
        pdfBlobRef.current = blob
      }

      const safeDate = new Date().toISOString().split('T')[0]
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `cholera-watch-report-${safeDate}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 5000)
    } catch (e) {
      console.error(e)
    } finally {
      setReportBusy(false)
    }
  }, [
    filteredData,
    summary,
    dateRange,
    selectedRegions,
    selectedDistricts,
    buildChartDataForPdf,
  ])

  const meanModePreview = useMemo(
    () => computeMeanModePreview(filteredData),
    [filteredData],
  )

  return (
    <div className="page">
      <motion.section
        className="hero secondary"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      >
        <div>
          <p className="eyebrow">Deep dive</p>
          <h1>Interactive analytics & filters</h1>
          <p className="lede">
            Compare interventions and outbreaks by focusing on any custom date
            range. Charts and the map update automatically to reflect your
            selections.
          </p>
        </div>
      </motion.section>

      <FilterPanel
        dateRange={dateRange}
        onDateChange={onDateChange}
        dateBounds={dateBounds}
        regionOptions={regionOptions}
        districtOptions={districtOptions}
        selectedRegions={selectedRegions}
        selectedDistricts={selectedDistricts}
        onRegionChange={onRegionChange}
        onDistrictChange={onDistrictChange}
      />
      <div className="analytics-generate-row">
        <div className="analytics-generate-actions">
          <button
            type="button"
            className="button primary analytics-generate-btn"
            onClick={() => setGenerated(true)}
          >
            Generate graphs
          </button>
          {generated && (
            <button
              type="button"
              className="analytics-report-btn"
              disabled={!filteredData.length || reportBusy}
              onClick={handleOpenPreview}
            >
              {reportBusy ? 'Building PDF…' : 'Preview report (PDF)'}
            </button>
          )}
        </div>
        <p className="analytics-generate-hint">
          {generated
            ? 'Live mode on: graphs now update automatically as you change filters. Export the current filtered rows as a PDF when you need a shareable summary.'
            : 'Apply filters then click Generate graphs once.'}
        </p>
      </div>

      {loading && <p className="status-text">Loading dataset…</p>}
      {error && <p className="status-text error">{error}</p>}

      {!loading && !error && (
        <>
          <section className="analytics-section analytics-section--summary">
            <h2 className="analytics-section__title">Filter preview</h2>
            <SummaryCards summary={summary} />
            <div className="mean-mode-preview">
              {filteredData.length ? (
                <>
                  <p>
                    <strong>Mean suspected</strong> is{' '}
                    {meanModePreview.suspected.mean.toFixed(2)} per record, and the{' '}
                    <strong>mode suspected</strong> is {meanModePreview.suspected.mode}
                    .
                  </p>
                  <p>
                    <strong>Mean confirmed</strong> is{' '}
                    {meanModePreview.confirmed.mean.toFixed(2)} per record, and the{' '}
                    <strong>mode confirmed</strong> is {meanModePreview.confirmed.mode}
                    .
                  </p>
                  <p>
                    <strong>Mean deaths</strong> is{' '}
                    {meanModePreview.deaths.mean.toFixed(2)} per record, and the{' '}
                    <strong>mode deaths</strong> is {meanModePreview.deaths.mode}
                    .
                  </p>
                </>
              ) : (
                <p className="status-text">No records in the selected window.</p>
              )}
            </div>
          </section>

          {generated && (
            <>
              <section className="analytics-section analytics-section--trends">
                <h2 className="analytics-section__title">Trends over time</h2>
                <p className="analytics-section__desc">
                  Case positivity, monthly suspected cases, seasonality, and CFR.
                </p>
                <div className="analytics-charts analytics-charts--2col">
                  {[
                    'confirmedPositivity',
                    'monthlySuspected',
                    'seasonality',
                    'cfrTrend',
                  ].map((k) => (
                    <div key={k} className="overview-graph-panel">
                      <button
                        type="button"
                        className="graph-fullscreen-btn"
                        onClick={() => setFullscreenKey(k)}
                      >
                        Fullscreen
                      </button>
                      {chartRegistry[k]}
                    </div>
                  ))}
                </div>
              </section>

              <section className="analytics-section analytics-section--distribution">
                <h2 className="analytics-section__title">
                  Distribution & comparison
                </h2>
                <p className="analytics-section__desc">
                  Regional burden and suspected vs confirmed cases.
                </p>
                <div className="analytics-charts analytics-charts--2col">
                  {['regionDistribution', 'scatter'].map((k) => (
                    <div key={k} className="overview-graph-panel">
                      <button
                        type="button"
                        className="graph-fullscreen-btn"
                        onClick={() => setFullscreenKey(k)}
                      >
                        Fullscreen
                      </button>
                      {chartRegistry[k]}
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          {!generated && (
            <section className="chart-card">
              <p className="status-text">
                Select your date/location filters and click{' '}
                <strong>Generate graphs</strong> to begin.
                {hasAnyFilter ? ' Current filter selection is ready.' : ''}
              </p>
            </section>
          )}
        </>
      )}

      {fullscreenKey && (
        <div
          className="graph-fullscreen-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Chart fullscreen"
        >
          <div className="graph-fullscreen-inner">
            <div className="graph-fullscreen-actions">
              <button
                type="button"
                className="graph-fullscreen-close"
                onClick={() => setFullscreenKey(null)}
              >
                Close fullscreen
              </button>
            </div>
            {chartRegistry[fullscreenKey]}
          </div>
        </div>
      )}

      {showReportPreview && (
        <div
          className="graph-fullscreen-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="PDF report preview"
          onClick={handleClosePreview}
        >
          <div
            className="report-preview-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="report-preview-head">
              <div>
                <h2 className="report-preview-title">Cholera Watch</h2>
                <p className="report-preview-subtitle">
                  Report preview — charts are arranged 2 per row.
                </p>
              </div>
              <button
                type="button"
                className="report-preview-close"
                onClick={handleClosePreview}
              >
                Close
              </button>
            </div>

            <div className="report-preview-meanmode">
              <p>
                Mean & mode (per record): suspected mean {meanModePreview.suspected.mean.toFixed(2)} • mode{' '}
                {meanModePreview.suspected.mode}. Confirmed mean {meanModePreview.confirmed.mean.toFixed(2)} • mode{' '}
                {meanModePreview.confirmed.mode}. Deaths mean {meanModePreview.deaths.mean.toFixed(2)} • mode{' '}
                {meanModePreview.deaths.mode}.
              </p>
            </div>

            <div className="report-preview-body">
              {pdfPreviewBusy && (
                <p className="status-text" style={{ margin: '1rem 1.35rem' }}>
                  Generating PDF preview…
                </p>
              )}
              {pdfPreviewUrl && (
                <iframe
                  className="report-preview-iframe"
                  title="Analytics PDF preview"
                  src={pdfPreviewUrl}
                />
              )}
            </div>

            <div className="report-preview-actions">
              <button
                type="button"
                className="analytics-report-btn"
                disabled={!filteredData.length || reportBusy}
                onClick={handleDownloadPdf}
              >
                {reportBusy ? 'Building PDF…' : 'Download PDF'}
              </button>
              <button
                type="button"
                className="report-preview-secondary"
                onClick={handleClosePreview}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Analytics
