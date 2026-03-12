# Troubleshooting Guide - Data Loading and Page Issues

## Issues Fixed

### 1. Date Parsing Issue
**Problem**: The CSV file uses `DD/MM/YYYY` format (e.g., "29/10/2015"), but JavaScript's `new Date()` constructor doesn't reliably parse this format.

**Solution**: Added a custom `parseDate()` function that:
- Handles `DD/MM/YYYY` format explicitly
- Falls back to ISO format (`YYYY-MM-DD`)
- Uses standard Date parsing as last resort
- Returns `null` if parsing fails

### 2. Missing Error Handling
**Problem**: Pages would crash when data was empty or malformed.

**Solution**: Added safety checks to all data transformation functions:
- `buildMetricBreakdowns()` - Returns empty arrays if no data
- `buildResponseInsights()` - Returns empty structures if no data
- `buildEarlyWarningInsights()` - Returns empty structures if no data
- `buildResourcePlanningInsights()` - Returns empty structures if no data
- `buildDistrictAggregates()` - Returns empty lookup if no data

### 3. Limited Debugging Information
**Problem**: No console logs to help diagnose data loading issues.

**Solution**: Added comprehensive console logging:
- Logs when data loading starts
- Logs CSV parsing results
- Logs valid vs invalid row counts
- Logs date range after parsing
- Logs errors with detailed messages

## How to Verify Fixes

### 1. Check Browser Console
Open browser DevTools (F12) and check the Console tab. You should see:
```
Loading data from: /cholera_data3.csv
CSV parsed successfully. Total rows: [number]
Valid rows: [number], Invalid rows: [number]
Date range: { min: "...", max: "..." }
Data loaded successfully!
```

### 2. Check Network Tab
In DevTools Network tab, verify:
- `cholera_data3.csv` loads with status 200
- `ug.json` loads with status 200 (for map)

### 3. Verify Data Loading
- Overview page should show summary cards with numbers
- Map should display districts with colors
- All pages should load without errors

## Common Issues and Solutions

### Issue: "No dated records were found"
**Cause**: Date parsing is failing for all rows.

**Solutions**:
1. Check CSV date format - should be `DD/MM/YYYY` or `YYYY-MM-DD`
2. Check browser console for parsing errors
3. Verify CSV file is in `public/` folder
4. Check CSV file encoding (should be UTF-8)

### Issue: Pages show "Loading..." indefinitely
**Cause**: Data loading is stuck or failed silently.

**Solutions**:
1. Check browser console for errors
2. Verify CSV file exists: `public/cholera_data3.csv`
3. Check network tab for failed requests
4. Restart the dev server: `npm run dev`

### Issue: Some pages show empty data
**Cause**: Date range filtering is too restrictive or data transformation failed.

**Solutions**:
1. Check date range in filters (should be 2011-2024)
2. Check browser console for transformation errors
3. Verify data has valid dates in the range

### Issue: API predictions not working
**Cause**: Flask API is not running or model files are missing.

**Solutions**:
1. Start Flask API: `cd api && python predict.py`
2. Check API is running on `http://localhost:5000`
3. Verify model files exist in parent `Cholera` folder
4. Check API health: `http://localhost:5000/health`

## Testing Checklist

- [ ] CSV file loads without errors
- [ ] Date parsing works correctly
- [ ] Overview page displays data
- [ ] Analytics page displays charts
- [ ] Response Insights page loads
- [ ] Early Warning page loads
- [ ] Resource Planning page loads
- [ ] Map displays districts
- [ ] Summary cards show numbers
- [ ] No console errors
- [ ] All pages responsive

## File Changes Made

1. **src/hooks/useCholeraData.js**
   - Added `parseDate()` function for DD/MM/YYYY format
   - Added console logging for debugging
   - Improved error messages

2. **src/utils/dataTransforms.js**
   - Added null/empty checks to all insight builders
   - Added safety returns for empty data
   - Prevents crashes when data is missing

## Next Steps

If issues persist:
1. Check browser console for specific error messages
2. Verify CSV file format matches expected structure
3. Check that all required files are in place
4. Restart both frontend and backend servers
5. Clear browser cache and reload

