# Cholera Watch - Health Intelligence Platform

A comprehensive dashboard for monitoring and analyzing cholera outbreak data in Uganda, featuring machine learning-powered forecasting.

## Features

- **Interactive Maps**: Choropleth visualization of cholera cases by district
- **Time Series Analysis**: Confirmed cases, positivity rates, seasonality patterns
- **Response Insights**: Spread pattern analysis, outbreak threshold monitoring, risk factor analysis
- **Early Warning System**: Alert thresholds, anomaly detection, and ML-powered 24-month forecasts
- **Resource Planning**: Priority area identification and impact assessment
- **Machine Learning Predictions**: Voting Ensemble model for accurate case forecasting

## Tech Stack

- **Frontend**: React, Vite, Recharts, Leaflet, Framer Motion
- **Backend API**: Flask (Python)
- **ML Model**: Voting Ensemble (combines Linear, Ridge, Lasso, ElasticNet)

## Getting Started

### Prerequisites

- Node.js 20.19+ or 22.12+
- Python 3.8+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/dicalvin/Cholera-Watch.git
cd Cholera-Watch
```

2. Install frontend dependencies:
```bash
npm install
```

3. Install Python dependencies for the API:
```bash
cd api
pip install -r requirements.txt
```

### Running Locally

1. **Start the Flask API** (Terminal 1):
```bash
cd api
python predict.py
```

The API will run on `http://localhost:5000`

2. **Start the React frontend** (Terminal 2):
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

This creates a `dist/` folder with production-ready files.

### Deploying to GitHub Pages

```bash
npm run deploy
```

This builds the app and deploys it to the `gh-pages` branch.

**Note**: The Flask API must be deployed separately (see `api/DEPLOYMENT.md` for options).

## Project Structure

```
cholera-dashboard/
├── api/                 # Flask API for ML predictions
│   ├── predict.py      # Main API endpoint
│   ├── requirements.txt
│   └── DEPLOYMENT.md   # API deployment guide
├── src/
│   ├── components/     # React components
│   ├── pages/          # Page components
│   ├── utils/          # Data transformation utilities
│   └── hooks/          # Custom React hooks
├── public/             # Static assets
└── dist/               # Production build (generated)
```

## Data

The dashboard uses cholera surveillance data from 2011-2024, including:
- Suspected cases (sCh)
- Confirmed cases (cCh)
- Deaths
- Case Fatality Rate (CFR)
- Positivity rates
- Regional and district-level data

## Model Information

The forecasting uses a **Voting Ensemble** model that combines:
- Linear Regression
- Ridge Regression
- Lasso Regression
- ElasticNet

**Performance**: ~10 RMSE, ~0.98 R² score

## API Endpoints

- `GET /health` - Health check
- `POST /api/predict` - Generate predictions

See `api/README.md` for detailed API documentation.

## License

This project is for academic/research purposes.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
