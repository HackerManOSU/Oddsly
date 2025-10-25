import axios from 'axios';

const API_BASE_URL = 'https://api.the-odds-api.com/v4';
const API_KEY = import.meta.env.VITE_ODDS_API_KEY;

const SUPPORTED_PLAYER_PROP_SPORTS = ['americanfootball_nfl', 'americanfootball_ncaaf', 'baseball_mlb', 'basketball_nba', 'icehockey_nhl', 'mma_mixed_martial_arts', 'tennis_atp_french_open', 'tennis_wta_french_open'];

// Define all available player prop markets
const PLAYER_PROP_MARKETS = [
  'player_assists',
  'player_field_goals',
  'player_kicking_points',
  'player_pass_attempts',
  'player_pass_completions',
  'player_pass_interceptions',
  'player_pass_longest_completion',
  'player_pass_rush_reception_tds',
  'player_pass_rush_reception_yds',
  'player_pass_tds',
  'player_pass_yds',
  'player_pats',
  'player_receptions',
  'player_reception_longest',
  'player_reception_yds',
  'player_rush_attempts',
  'player_rush_longest',
  'player_rush_reception_tds',
  'player_rush_reception_yds',
  'player_rush_yds',
  'player_sacks',
  'player_solo_tackles',
  'player_tackles_assists',
  'player_tds_over',
  'player_1st_td',
  'player_anytime_td',
  'player_last_td'
] as const;

// Define the type using the values
type PlayerPropMarket = (typeof PLAYER_PROP_MARKETS)[number];

// Create a non-readonly array of the markets for the default parameter
const defaultMarkets: PlayerPropMarket[] = [...PLAYER_PROP_MARKETS];

export const fetchSports = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/sports`, {
      params: { 
        apiKey: API_KEY
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching sports:', error);
    throw error;
  }
};

export const fetchBookmakers = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/bookmakers`, {
      params: { 
        apiKey: API_KEY
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching bookmakers:', error);
    throw error;
  }
};

export const fetchOdds = async (sport: string, market: string = 'h2h') => {
  if (!SUPPORTED_PLAYER_PROP_SPORTS.includes(sport)) {
    console.warn(`fetchOdds not supported for: ${sport}`);
    return [];
  }
  try {
    const response = await axios.get(`${API_BASE_URL}/sports/${sport}/odds`, {
      params: {
        apiKey: API_KEY,
        regions: 'us,us2',
        markets: market,
        oddsFormat: 'american'
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching odds:', error);
    throw error;
  }
};

export const fetchMatchDetails = async (sport: string, matchId: string) => {
  if (!SUPPORTED_PLAYER_PROP_SPORTS.includes(sport)) {
    console.warn(`fetchMatchDetails not supported for: ${sport}`);
    return [];
  }
  try {
    const response = await axios.get(`${API_BASE_URL}/sports/${sport}/events/${matchId}/odds`, {
      params: {
        apiKey: API_KEY,
        regions: 'us,us2',
        markets: ['h2h', 'spreads', 'totals', 'player_pass_tds', 'player_pass_yds', 'player_rush_yds', 'player_receptions'],
        oddsFormat: 'american'
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching match details:', error);
    throw error;
  }
};

export const fetchBothMatchDetails = async (sport: string, matchId: string) => {
  if (!SUPPORTED_PLAYER_PROP_SPORTS.includes(sport)) {
    console.warn(`fetchBothMatchDetails not supported for: ${sport}`);
    return [];
  }
  try {
    const response = await axios.get(`${API_BASE_URL}/sports/${sport}/events/${matchId}/odds`, {
      params: {
        apiKey: API_KEY,
        regions: 'us,us2',
        markets: 'h2h,spreads',
        oddsFormat: 'american'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching match details:', error);
    throw error;
  }
};

export const fetchPlayerProps = async (
  sport: string,
  matchId: string,
  markets: PlayerPropMarket[] = defaultMarkets,
  region: string = 'us,us2',
) => {
  if (!SUPPORTED_PLAYER_PROP_SPORTS.includes(sport)) {
    console.warn(`fetchPlayerProps not supported for: ${sport}`);
    return [];
  }
  try {
    const response = await axios.get(`${API_BASE_URL}/sports/${sport}/events/${matchId}/odds`, {
      params: {
        apiKey: API_KEY,
        regions: region,
        markets: markets.join(','),
        oddsFormat: 'american'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching player props:', error);
    throw error;
  }
};