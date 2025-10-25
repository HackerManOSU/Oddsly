
# Oddsly!

A web application for comparing betting odds across multiple sportsbooks to help users find the best value bets. This app leverages various formulas, data aggregation from APIs, and React components to create an interactive interface with real-time data.

## Tech Stack

### Front end
- [x] **Vite**
- [x] **React**
- [x] **TypeScript**
- [x] **TailwindCSS**

### Backend
- [x] **Node.js**

### Tools and Libraries
- [x] **ESLint**
- [x] **MaterialUI**
- [x] **APIs**:
  - [The Odds API](https://the-odds-api.com/): For fetching odds data
  - Additional data from Express server with Axios for API requests
- [x] **Axios**:
- [x] **dotenv**

## Features
- Aggregated betting odds across multiple sportsbooks
- Market and bookmaker filters
- Kelly Criterion recommended bets based on bankroll input
- Comprehensive player prop markets and specific match details
- Toggle feature to display only Kelly-recommended bets

## Installation
1. Clone this repository:
   ```bash
   git clone https://github.com/hackermanosu/oddsly.git
   ```
2. Install dependencies:
   ```bash
   cd oddsly
   npm install
   ```
3. Add your API key to `.env`:
   ```plaintext
   VITE_ODDS_API_KEY=your_api_key
   ```
4. Run the app:
   ```bash
   npm run dev
   ```

## Components

### `OddsPage`
This component allows users to view odds across various markets (e.g., moneyline, spreads) and filter results by bookmakers. Users can also toggle to view only bets recommended by the **Kelly Criterion**.

### `MatchDetails`
Displays detailed match information, including odds changes and potential value bets calculated based on implied probability.

### `PlayerProps`
A dedicated component for player-specific prop bets, including markets for individual performance metrics (e.g., touchdowns, assists).

## API and Utility Modules

### `api.ts`
Handles interactions with The Odds API:
- **fetchSports**: Fetches a list of sports available for betting.
- **fetchBookmakers**: Retrieves bookmakers offering odds.
- **fetchOdds**: Retrieves odds by sport and market.
- **fetchMatchDetails**: Fetches detailed odds for a specific match.
- **fetchPlayerProps**: Retrieves player prop markets for specific player metrics.

### `oddsConversion.ts`
Contains utility functions for odds format conversions, specifically:
- **convertToAmericanOdds**: Converts decimal odds to American format.

## Formulas and Calculations

### Implied Probability
Used to determine if a bet offers positive value. Calculated as:
```javascript
impliedProbability = 1 / decimalOdds;
```

### Kelly Criterion
Provides bet size recommendations based on the bankroll and edge:
```javascript
kellyFraction = (edge / odds) * (bankroll);
```

### Conversion Formulas
**Decimal to American Odds**:
- Positive: `+((decimalOdds - 1) * 100)`
- Negative: `-(100 / (decimalOdds - 1))`

## License
This project is licensed under the MIT License.
