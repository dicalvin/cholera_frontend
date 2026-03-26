import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import './App.css'
import Layout from './components/Layout'
import Overview from './pages/Overview'
import MapPage from './pages/Map'
import Analytics from './pages/Analytics'
import ResponseInsights from './pages/ResponseInsights'
import EarlyWarning from './pages/EarlyWarning'
import ResourcePlanning from './pages/ResourcePlanning'
import Weather from './pages/Weather'
import DataAdmin from './pages/DataAdmin'
import Profile from './pages/Profile'
import Login from './pages/Login'
import Signup from './pages/Signup'
import AdminLogin from './pages/AdminLogin'
import Terms from './pages/Terms'
import Privacy from './pages/Privacy'
import { AuthProvider, useAuth } from './context/AuthContext'
import useCholeraData from './hooks/useCholeraData'
import ErrorBoundary from './components/ErrorBoundary'
import {
  aggregateSummary,
  buildCfrTrend,
  buildDistrictAggregates,
  buildInsights,
  buildRegionDistribution,
  buildRegionSuspectedDistribution,
  buildSChVsCCh,
  buildConfirmedPositivitySeries,
  buildMonthlySuspectedSeries,
  buildSeasonalityProfile,
  buildMetricBreakdowns,
  buildResponseInsights,
  buildEarlyWarningInsights,
  buildResourcePlanningInsights,
  filterByDateRange,
  filterByRegionAndDistrict,
  getUniqueRegionsAndDistricts,
  formatForInput,
} from './utils/dataTransforms'

const ANALYTICS_START = new Date(2011, 0, 1)
const ANALYTICS_END = new Date(2100, 11, 31)
const ALL_APPROVED_ROLES = ['data_entry', 'epidemiologist', 'surveillance', 'data_manager', 'system_admin']

function canAccessRoute(role, path) {
  const accessMap = {
    '/': ALL_APPROVED_ROLES,
    '/map': ALL_APPROVED_ROLES,
    '/analytics': ALL_APPROVED_ROLES,
    '/weather': ALL_APPROVED_ROLES,
    '/profile': ALL_APPROVED_ROLES,
    '/response-insights': ['epidemiologist', 'surveillance', 'data_manager', 'system_admin'],
    '/early-warning': ['epidemiologist', 'surveillance', 'data_manager', 'system_admin'],
    '/resource-planning': ['data_manager', 'surveillance', 'system_admin'],
    '/data-admin': ['system_admin'],
    '/admin': ['system_admin'],
  }
  return (accessMap[path] || []).includes(role)
}

function RoleProtectedRoute({ role, path, element }) {
  if (!canAccessRoute(role, path)) {
    return <Navigate to="/" replace />
  }
  return element
}

function InnerApp() {
  const { user, profile, loading: authLoading, profileLoading } = useAuth()
  const location = useLocation()

  const { data, loading, error, minDate, maxDate, lastUpdatedAt, dbSummary } = useCholeraData()
  const [geoData, setGeoData] = useState(null)
  const [geoError, setGeoError] = useState('')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [selectedRegions, setSelectedRegions] = useState([])
  const [selectedDistricts, setSelectedDistricts] = useState([])

  const constrainedBounds = useMemo(() => {
    const minBound = minDate
      ? new Date(Math.max(minDate.valueOf(), ANALYTICS_START.valueOf()))
      : ANALYTICS_START
    const maxBound = maxDate
      ? new Date(Math.min(maxDate.valueOf(), ANALYTICS_END.valueOf()))
      : ANALYTICS_END
    return { minBound, maxBound }
  }, [minDate, maxDate])

  const defaultRange = useMemo(
    () => ({
      start: formatForInput(constrainedBounds.minBound),
      end: formatForInput(constrainedBounds.maxBound),
    }),
    [constrainedBounds],
  )

  const effectiveDateRange = useMemo(() => {
    const parsedStart = dateRange.start ? new Date(dateRange.start) : null
    const parsedEnd = dateRange.end ? new Date(dateRange.end) : null
    const start = parsedStart && !Number.isNaN(parsedStart.valueOf())
      ? parsedStart
      : new Date(defaultRange.start)
    const end = parsedEnd && !Number.isNaN(parsedEnd.valueOf())
      ? parsedEnd
      : new Date(defaultRange.end)
    const clampedStart = new Date(
      Math.max(start.valueOf(), constrainedBounds.minBound.valueOf()),
    )
    const clampedEnd = new Date(
      Math.min(end.valueOf(), constrainedBounds.maxBound.valueOf()),
    )
    return {
      start: formatForInput(clampedStart),
      end: formatForInput(clampedEnd),
    }
  }, [dateRange, defaultRange, constrainedBounds])

  useEffect(() => {
    fetch('/ug.json')
      .then((res) => res.json())
      .then(setGeoData)
      .catch(() => setGeoError('Unable to load map boundaries.'))
  }, [])

  const { regions: regionOptions, districts: districtOptions } = useMemo(
    () => getUniqueRegionsAndDistricts(data || []),
    [data],
  )

  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return []
    // Always clamp the dashboard dataset to the effective date range.
    // This guarantees the UI starts from `2011-01-01` even before the user applies filters.
    const byDate = filterByDateRange(data, effectiveDateRange)
    const byLocation = filterByRegionAndDistrict(byDate, {
      regions: selectedRegions,
      districts: selectedDistricts,
    })
    return byLocation
  }, [data, effectiveDateRange, selectedRegions, selectedDistricts])

  const overallData = useMemo(() => {
    const OVERVIEW_START = new Date(2011, 0, 1)
    const overviewRows = (data || []).filter(
      (row) => row.reportingDate && row.reportingDate >= OVERVIEW_START,
    )

    const computed = aggregateSummary(data || [])
    const summary = {
      ...computed,
      totalReports: dbSummary.totalReports,
      totalSuspected: dbSummary.totalSuspected,
      totalConfirmed: dbSummary.totalConfirmed,
      totalDeaths: dbSummary.totalDeaths,
      avgCFR: dbSummary.avgCFR,
      positivityRate: dbSummary.positivityRate,
    }
    const regionDistribution = buildRegionDistribution(overviewRows)
    const cfrTrend = buildCfrTrend(overviewRows, { rangeStart: OVERVIEW_START })
    const confirmedPositivity = buildConfirmedPositivitySeries(overviewRows, {
      rangeStart: OVERVIEW_START,
    })
    const monthlySuspected = buildMonthlySuspectedSeries(overviewRows, {
      rangeStart: OVERVIEW_START,
    })
    const insights = buildInsights(
      data || [],
      regionDistribution,
      cfrTrend,
      summary,
    )
    const districtStats = buildDistrictAggregates(data || [])
    const breakdowns = buildMetricBreakdowns(data || [])
    const overviewDistrictStats = buildDistrictAggregates(overviewRows)
    const districtsBySuspected = Object.values(
      overviewDistrictStats?.districtLookup || {},
    )
      .map((entry) => ({
        label: entry.name || entry.district,
        suspected: entry.suspected || 0,
      }))
      .sort((a, b) => b.suspected - a.suspected)
    const topDistrictsBySuspected = districtsBySuspected.slice(0, 6)
    const allDistrictsBySuspected = districtsBySuspected
    const regionSuspectedDistribution =
      buildRegionSuspectedDistribution(overviewRows)
    const monthlyConfirmedTrend = buildConfirmedPositivitySeries(
      overviewRows,
      { rangeStart: OVERVIEW_START },
    ).monthly.map(({ label, confirmed }) => ({ label, confirmed }))
    return {
      summary,
      insights,
      districtStats,
      breakdowns,
      regionDistribution,
      cfrTrend,
      confirmedPositivity,
      monthlySuspected,
      topDistrictsBySuspected,
      allDistrictsBySuspected,
      regionSuspectedDistribution,
      monthlyConfirmedTrend,
    }
  }, [data, dbSummary])

  const memoizedData = useMemo(() => {
    const summary = aggregateSummary(filteredData)
    const regionDistribution = buildRegionDistribution(filteredData)
    const scatterData = buildSChVsCCh(filteredData)
    const cfrTrend = buildCfrTrend(filteredData, {
      rangeStart: effectiveDateRange.start,
      rangeEnd: effectiveDateRange.end,
    })
    const confirmedPositivity = buildConfirmedPositivitySeries(filteredData, {
      rangeStart: effectiveDateRange.start,
      rangeEnd: effectiveDateRange.end,
    })
    const monthlySuspected = buildMonthlySuspectedSeries(filteredData, {
      rangeStart: effectiveDateRange.start,
      rangeEnd: effectiveDateRange.end,
    })
    const seasonality = buildSeasonalityProfile(filteredData)
    const insights = buildInsights(
      filteredData,
      regionDistribution,
      cfrTrend,
      summary,
    )
    const districtStats = buildDistrictAggregates(filteredData)
    const breakdowns = buildMetricBreakdowns(filteredData)
    const responseInsights = buildResponseInsights(filteredData, breakdowns)
    const earlyWarning = buildEarlyWarningInsights(filteredData)
    const resourcePlanning = buildResourcePlanningInsights(
      filteredData,
      districtStats,
      breakdowns,
    )

    return {
      summary,
      regionDistribution,
      scatterData,
      cfrTrend,
      insights,
      districtStats,
      confirmedPositivity,
      monthlySuspected,
      seasonality,
      breakdowns,
      responseInsights,
      earlyWarning,
      resourcePlanning,
    }
  }, [filteredData, effectiveDateRange.start, effectiveDateRange.end])

  const dateBounds = useMemo(
    () => ({
      min: formatForInput(constrainedBounds.minBound),
      max: formatForInput(constrainedBounds.maxBound),
    }),
    [constrainedBounds],
  )

  const isAuthPage =
    location.pathname === '/login' ||
    location.pathname === '/signup' ||
    location.pathname === '/admin-login' ||
    location.pathname === '/terms' ||
    location.pathname === '/privacy'

  if (isAuthPage) {
    // Public pages: no Layout, no auth required
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  if (authLoading) {
    return (
      <div className="page">
        <p className="status-text">Checking access…</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // While the profile row is being fetched from Supabase, show a spinner.
  // Without this guard, App briefly sees user=set + profile=null and renders
  // the pending-approval wall before the fetch finishes.
  if (profileLoading && !profile) {
    return (
      <div className="page">
        <p className="status-text">Loading profile…</p>
      </div>
    )
  }

  // Block access for users whose profile is not yet approved.
  // system_admin users are always allowed through regardless of status.
  // The primary admin email is also hardcoded as a fallback in case the
  // DB migration hasn't been run yet.
  const ADMIN_EMAILS = ['dicalvin17@gmail.com']
  const isAdmin = profile?.role === 'system_admin' || ADMIN_EMAILS.includes(user?.email)
  const isApproved = profile?.status === 'approved'
  const currentRole = isAdmin ? 'system_admin' : (profile?.role || 'data_entry')

  if (!isApproved && !isAdmin) {
    return (
      <div className="page">
        <section className="chart-card">
          <div className="section-header">
            <h3>Access pending approval</h3>
            <p>
              Your account has been created but is still awaiting approval from a system
              administrator. You will receive access to the dashboard once your status is updated
              to approved.
            </p>
          </div>
          <p className="status-text">
            Current status:
            {' '}
            <strong>{profile?.status || 'pending'}</strong>
          </p>
          <p className="status-text" style={{ marginTop: '0.5rem' }}>
            If this takes longer than expected, please contact your Cholera Watch system
            administrator.
          </p>
        </section>
      </div>
    )
  }

  // Protected application: wrapped in Layout, all routes require login
  return (
    <ErrorBoundary>
      <Layout
        loading={loading}
        summary={memoizedData.summary}
        lastUpdatedAt={lastUpdatedAt}
      >
        <Routes>
          <Route
            path="/"
            element={(
              <RoleProtectedRoute
                role={currentRole}
                path="/"
                element={(
                  <Overview
                    loading={loading}
                    error={error}
                    insights={overallData.insights}
                    summary={overallData.summary}
                    breakdowns={overallData.breakdowns}
                    regionDistribution={overallData.regionDistribution}
                    regionSuspectedDistribution={
                      overallData.regionSuspectedDistribution
                    }
                    monthlySuspected={overallData.monthlySuspected}
                    monthlyConfirmedTrend={overallData.monthlyConfirmedTrend}
                    topDistrictsBySuspected={overallData.topDistrictsBySuspected}
                    allDistrictsBySuspected={overallData.allDistrictsBySuspected}
                  />
                )}
              />
            )}
          />
          <Route
            path="/map"
            element={(
              <RoleProtectedRoute
                role={currentRole}
                path="/map"
                element={(
                  <MapPage
                    loading={loading}
                    error={error}
                    geoData={geoData}
                    geoError={geoError}
                    districtStats={overallData.districtStats}
                    dateRange={effectiveDateRange}
                    dataUpdatedAt={lastUpdatedAt}
                  />
                )}
              />
            )}
          />
          <Route
            path="/analytics"
            element={(
              <RoleProtectedRoute
                role={currentRole}
                path="/analytics"
                element={(
                  <Analytics
                    loading={loading}
                    error={error}
                    dateRange={effectiveDateRange}
                    onDateChange={setDateRange}
                    dateBounds={dateBounds}
                    regionOptions={regionOptions}
                    districtOptions={districtOptions}
                    selectedRegions={selectedRegions}
                    selectedDistricts={selectedDistricts}
                    onRegionChange={setSelectedRegions}
                    onDistrictChange={setSelectedDistricts}
                    summary={memoizedData.summary}
                    scatterData={memoizedData.scatterData}
                    regionDistribution={memoizedData.regionDistribution}
                    cfrTrend={memoizedData.cfrTrend}
                    confirmedPositivity={memoizedData.confirmedPositivity}
                    monthlySuspected={memoizedData.monthlySuspected}
                    seasonality={memoizedData.seasonality}
                    filteredData={filteredData}
                  />
                )}
              />
            )}
          />
          <Route
            path="/response-insights"
            element={(
              <RoleProtectedRoute
                role={currentRole}
                path="/response-insights"
                element={(
                  <ResponseInsights
                    loading={loading}
                    error={error}
                    spreadInsights={memoizedData.responseInsights}
                    filteredData={filteredData}
                    summary={memoizedData.summary}
                  />
                )}
              />
            )}
          />
          <Route
            path="/early-warning"
            element={(
              <RoleProtectedRoute
                role={currentRole}
                path="/early-warning"
                element={(
                  <EarlyWarning
                    loading={loading}
                    error={error}
                    earlyWarning={memoizedData.earlyWarning}
                    filteredData={filteredData}
                    summary={memoizedData.summary}
                  />
                )}
              />
            )}
          />
          <Route
            path="/resource-planning"
            element={(
              <RoleProtectedRoute
                role={currentRole}
                path="/resource-planning"
                element={(
                  <ResourcePlanning
                    loading={loading}
                    error={error}
                    resourcePlanning={memoizedData.resourcePlanning}
                    filteredData={filteredData}
                    summary={memoizedData.summary}
                  />
                )}
              />
            )}
          />
          <Route
            path="/weather"
            element={<RoleProtectedRoute role={currentRole} path="/weather" element={<Weather />} />}
          />
          <Route
            path="/profile"
            element={<RoleProtectedRoute role={currentRole} path="/profile" element={<Profile />} />}
          />
          <Route
            path="/data-admin"
            element={<RoleProtectedRoute role={currentRole} path="/data-admin" element={<DataAdmin />} />}
          />
          <Route
            path="/admin"
            element={<RoleProtectedRoute role={currentRole} path="/admin" element={<DataAdmin />} />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </ErrorBoundary>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <InnerApp />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
