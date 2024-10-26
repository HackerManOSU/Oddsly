import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchSports, fetchOdds } from '../services/api';
import { convertToAmericanOdds } from '../utils/oddsConversion';

const OddsPage: React.FC = () => {
  const [selectedSport, setSelectedSport] = useState<string | null>(null);

  const { data: sports, isLoading: sportsLoading } = useQuery({
    queryKey: ['sports'],
    queryFn: fetchSports,
  });

  const { data: odds, isLoading: oddsLoading } = useQuery({
    queryKey: ['odds', selectedSport],
    queryFn: () => fetchOdds(selectedSport ?? ''),
    enabled: !!selectedSport,
  });

  const handleSportChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSport(event.target.value);
  };

  return (
    <div className="mt-4">
      <div className="flex justify-center mb-4">
        <select
          className="p-2 border rounded"
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
      </div>

      {oddsLoading && <p className="text-center">Loading odds...</p>}

      {odds && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead>
              <tr>
                <th className="p-2 border-b text-left">Matchup</th>
                <th className="p-2 border-b text-left">Team</th>
                {odds[0]?.bookmakers.map((bookmaker: any) => (
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
                    {match.bookmakers.map((bookmaker: any) => {
                      const moneylineOutcome = bookmaker.markets.find(
                        (market: any) => market.key === 'h2h'
                      )?.outcomes;

                      const homeTeamOddsDecimal = moneylineOutcome?.find(
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
                    {match.bookmakers.map((bookmaker: any) => {
                      const moneylineOutcome = bookmaker.markets.find(
                        (market: any) => market.key === 'h2h'
                      )?.outcomes;

                      const awayTeamOddsDecimal = moneylineOutcome?.find(
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
