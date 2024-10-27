import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchSports, fetchOdds } from '../services/api';
import { convertToAmericanOdds } from '../utils/oddsConversion';

const marketOptions = [
  { value: 'h2h', label: 'Moneyline' },
  { value: 'spreads', label: 'Spread' },
  { value: 'totals', label: 'Total (Over/Under)' },
  { value: 'props', label: 'Props' },
];

const popularBookmakers = [
  { key: 'draftkings', title: 'DraftKings' },
  { key: 'williamhill_us', title: 'Caesars' },
  { key: 'betus', title: 'BetUS' },
  { key: 'fanduel', title: 'FanDuel' },
  { key: 'mybookieag', title: 'MyBookie.ag' },
  { key: 'betrivers', title: 'BetRivers' },
  { key: 'betmgm', title: 'BetMGM' },
  { key: 'betonlineag', title: 'BetOnline.ag' },
  { key: 'lowvig', title: 'LowVig.ag' },
  { key: 'bovada', title: 'Bovada' },
];

const OddsPage: React.FC = () => {
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [selectedMarket, setSelectedMarket] = useState<string>('h2h');
  const [selectedBooks, setSelectedBooks] = useState<Set<string>>(new Set(popularBookmakers.map(b => b.key)));

  const { data: sports, isLoading: sportsLoading } = useQuery({
    queryKey: ['sports'],
    queryFn: fetchSports,
  });

  const { data: odds, isLoading: oddsLoading } = useQuery({
    queryKey: ['odds', selectedSport, selectedMarket, Array.from(selectedBooks)],
    queryFn: () => fetchOdds(selectedSport ?? '', 'us', selectedMarket),
    enabled: !!selectedSport,
  });

  useEffect(() => {
    if (odds) {
      console.log('Available bookmaker keys:', odds[0]?.bookmakers.map((bookmaker: any) => bookmaker.key));
    }
  }, [odds]);

  const handleSportChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSport(event.target.value);
  };

  const handleMarketChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMarket(event.target.value);
  };

  const handleBookToggle = (bookmakerKey: string) => {
    setSelectedBooks((prev) => {
      const updated = new Set(prev);
      if (updated.has(bookmakerKey)) {
        updated.delete(bookmakerKey);
      } else {
        updated.add(bookmakerKey);
      }
      return updated;
    });
  };

  const handleSelectAllBooks = () => {
    if (selectedBooks.size === popularBookmakers.length) {
      setSelectedBooks(new Set()); // Deselect all if all are selected
    } else {
      setSelectedBooks(new Set(popularBookmakers.map((b: any) => b.key))); // Select all
    }
  };

  const isAllSelected =
    selectedBooks.size === popularBookmakers.length;

    return (
      <div className="mt-4 text-white">
        <div className="flex justify-center mb-4 space-x-4">
          <select
            className="p-2 border rounded border-neon bg-bgcolor text-white"
            onChange={handleSportChange}
            value={selectedSport ?? ''}
          >
            <option value="" disabled>
              Select a Sport
            </option>
            {sportsLoading && <option>Loading sports...</option>}
            {sports?.map((sport: any) => (
              <option key={sport.key} value={sport.key}>
                {sport.title}
              </option>
            ))}
          </select>
  
          <select
            className="p-2 border rounded border-neon bg-bgcolor text-white"
            onChange={handleMarketChange}
            value={selectedMarket}
          >
            {marketOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
  
        <div className="mb-4 flex flex-wrap gap-2 justify-center">
          <button
            onClick={handleSelectAllBooks}
            className={`px-4 py-2 rounded ${isAllSelected ? 'bg-neon' : 'bg-gray-800'} text-white`}
          >
            {isAllSelected ? 'Deselect All' : 'Select All'}
          </button>
          {popularBookmakers.map((bookmaker: any) => (
            <button
              key={bookmaker.key}
              onClick={() => handleBookToggle(bookmaker.key)}
              className={`px-4 py-2 rounded ${selectedBooks.has(bookmaker.key) ? 'bg-neon' : 'bg-gray-800'} text-white`}
            >
              {bookmaker.title}
            </button>
          ))}
        </div>
  
        {oddsLoading && <p className="text-center">Loading odds...</p>}
  
        {odds && (
          <div className="overflow-x-auto">
            <table className="min-w-full border-2 border-neon">
              <thead>
                <tr>
                  <th className="p-2 border-b text-left">Matchup</th>
                  <th className="p-2 border-b text-left">Team</th>
                  {odds[0]?.bookmakers
                    .filter((bookmaker: any) =>
                      selectedBooks.size === 0 || selectedBooks.has(bookmaker.key)
                    )
                    .map((bookmaker: any) => (
                      <th key={bookmaker.key} className="p-2 border-b text-center">
                        {bookmaker.title}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {odds.map((match: any) => (
                  <>
                    <tr key={`${match.id}-home`} className="border-b">
                      <td rowSpan={2} className="p-2 text-center border-r">
                        {match.home_team} vs {match.away_team}
                      </td>
                      <td className="p-2">{match.home_team}</td>
                      {match.bookmakers
                        .filter((bookmaker: any) =>
                          selectedBooks.size === 0 || selectedBooks.has(bookmaker.key)
                        )
                        .map((bookmaker: any) => {
                          const marketOutcome = bookmaker.markets.find(
                            (market: any) => market.key === selectedMarket
                          )?.outcomes;
  
                          const homeTeamOddsDecimal = marketOutcome?.find(
                            (outcome: any) => outcome.name === match.home_team
                          )?.price;
  
                          const homeTeamOdds =
                            homeTeamOddsDecimal !== undefined
                              ? convertToAmericanOdds(homeTeamOddsDecimal)
                              : 'N/A';
  
                          return (
                            <td key={`${bookmaker.key}-home`} className="p-2 text-center">
                              {homeTeamOdds}
                            </td>
                          );
                        })}
                    </tr>
                    <tr key={`${match.id}-away`} className="border-b">
                      <td className="p-2">{match.away_team}</td>
                      {match.bookmakers
                        .filter((bookmaker: any) =>
                          selectedBooks.size === 0 || selectedBooks.has(bookmaker.key)
                        )
                        .map((bookmaker: any) => {
                          const marketOutcome = bookmaker.markets.find(
                            (market: any) => market.key === selectedMarket
                          )?.outcomes;
  
                          const awayTeamOddsDecimal = marketOutcome?.find(
                            (outcome: any) => outcome.name === match.away_team
                          )?.price;
  
                          const awayTeamOdds =
                            awayTeamOddsDecimal !== undefined
                              ? convertToAmericanOdds(awayTeamOddsDecimal)
                              : 'N/A';
  
                          return (
                            <td key={`${bookmaker.key}-away`} className="p-2 text-center">
                              {awayTeamOdds}
                            </td>
                          );
                        })}
                    </tr>
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };
  
  export default OddsPage;