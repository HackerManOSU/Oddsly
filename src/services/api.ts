import axios from 'axios';

const API_BASE_URL = 'https://api.the-odds-api.com/v4';
const API_KEY = import.meta.env.VITE_ODDS_API_KEY;

export const fetchSports = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/sports`, {
      params: { apiKey: API_KEY },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching sports:', error);
    throw error;
  }
};

export const fetchBookmakers = async () => {
  // Assuming The Odds API provides a way to list all bookmakers (you might need to adjust this endpoint)
  try {
    const response = await axios.get(`${API_BASE_URL}/bookmakers`, {
      params: { apiKey: API_KEY },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching bookmakers:', error);
    throw error;
  }
};

export const fetchOdds = async (sport: string, region: string = 'us', market: string = 'h2h') => {
  try {
    const response = await axios.get(`${API_BASE_URL}/sports/${sport}/odds`, {
      params: {
        apiKey: API_KEY,
        regions: region,
        markets: market,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching odds:', error);
    throw error;
  }
};
