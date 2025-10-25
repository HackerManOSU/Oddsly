import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { fetchBothMatchDetails } from '../../services/api';
import { PlayerProps } from '../Player Props/PlayerProps';
import { ArrowLeft, DollarSign } from 'lucide-react';
import {
  DataGrid,
  GridRenderCellParams,
  GridCellParams,
} from '@mui/x-data-grid';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { TextField, Switch, FormControlLabel } from '@mui/material';

interface MatchDetailsPageProps {
  bankroll: number;
  setBankroll: (value: number) => void;
}

// Odds Calculation Functions

const americanToDecimal = (americanOdds: number): number => {
  if (americanOdds > 0) {
    return (americanOdds / 100) + 1;
  } else {
    return (100 / Math.abs(americanOdds)) + 1;
  }
};

const calculateImpliedProbability = (decimalOdds: number): number => {
  return 1 / decimalOdds;
};

const calculateKellyCriterion = (
  decimalOdds: number,
  estimatedProbability: number
): number => {
  const q = 1 - estimatedProbability;
  const b = decimalOdds - 1; // Convert to decimal odds minus 1 for Kelly formula

  // Kelly Formula: f* = (bp - q) / b
  // where f* is the fraction of bankroll to bet
  // b is the decimal odds minus 1
  // p is our estimated probability of winning
  // q is the probability of losing (1-p)
  const kelly = (b * estimatedProbability - q) / b;

  // Return 0 if kelly is negative (no bet)
  // Cap kelly at 25% of bankroll as a conservative measure
  return Math.max(0, Math.min(kelly, 0.25));
};

// Bankroll Input Component

interface BankrollInputProps {
  bankroll: number;
  setBankroll: (value: number) => void;
}

const BankrollInput: React.FC<BankrollInputProps> = ({ bankroll, setBankroll }) => {
  const [inputValue, setInputValue] = useState(bankroll.toString());

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setInputValue(value);
    if (value) {
      setBankroll(parseInt(value));
    }
  };

  return (
    <TextField
      label="Enter bankroll"
      variant="outlined"
      value={inputValue}
      onChange={handleInputChange}
      InputProps={{
        startAdornment: <DollarSign className="h-5 w-5 text-neon" />,
      }}
      sx={{
        width: '200px',
        '& .MuiOutlinedInput-root': {
          '&.Mui-focused': {
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: '#200589',
            },
          },
        },
      }}
    />
  );
};

// Interfaces

interface Outcome {
  name: string;
  description?: string;
  price: number;
  point?: number;
}

interface Market {
  key: string;
  last_update: string;
  outcomes: Outcome[];
}

interface Bookmaker {
  key: string;
  title: string;
  markets: Market[];
}

interface MatchDetails {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Bookmaker[];
}

interface BookmakerCellData {
  odds: number;
  impliedProbability: number;
  probDifference: number;
  kellyFraction: number;
  recommendedBet: number;
  point?: number;
}

interface GridRow {
  id: string;
  team: string;
  estimatedProbability: number;
  [bookmakerKey: string]: string | number | BookmakerCellData | undefined;
}

const theme = createTheme({
  palette: {
    primary: {
      main: '#200589',
    },
  },
});

// MarketTable Component

const MarketTable: React.FC<{
  details: MatchDetails;
  marketType: string;
  title: string;
  bankroll: number;
  showOnlyKellyBets: boolean;
}> = ({ details, marketType, title, bankroll, showOnlyKellyBets }) => {
  const validBookmakers = details.bookmakers.filter(
    bookmaker =>
      bookmaker.markets.some(
        market =>
          market.key === marketType &&
          market.outcomes &&
          market.outcomes.length > 0
      )
  );

  if (validBookmakers.length === 0) {
    return (
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">{title}</h2>
        <p className="text-gray-500">
          No {title.toLowerCase()} odds available for this match.
        </p>
      </div>
    );
  }

  const calculateTeamProbabilities = (): { homeProb: number; awayProb: number } => {
    const homeProbabilities: number[] = [];
    const awayProbabilities: number[] = [];

    validBookmakers.forEach(bookmaker => {
      const marketData = bookmaker.markets.find((m: Market) => m.key === marketType);
      if (marketData) {
        const homeOutcome = marketData.outcomes.find((o: Outcome) => o.name === details.home_team);
        const awayOutcome = marketData.outcomes.find((o: Outcome) => o.name === details.away_team);

        if (homeOutcome?.price && awayOutcome?.price) {
          const homeDecimalOdds = americanToDecimal(homeOutcome.price);
          const awayDecimalOdds = americanToDecimal(awayOutcome.price);

          const homeImpliedProb = calculateImpliedProbability(homeDecimalOdds);
          const awayImpliedProb = calculateImpliedProbability(awayDecimalOdds);

          const total = homeImpliedProb + awayImpliedProb;
          if (total > 0) {
            homeProbabilities.push(homeImpliedProb / total);
            awayProbabilities.push(awayImpliedProb / total);
          }
        }
      }
    });

    const avgHomeProb = homeProbabilities.length > 0
      ? homeProbabilities.reduce((a, b) => a + b, 0) / homeProbabilities.length
      : 0;
    const avgAwayProb = awayProbabilities.length > 0
      ? awayProbabilities.reduce((a, b) => a + b, 0) / awayProbabilities.length
      : 0;

    return { homeProb: avgHomeProb, awayProb: avgAwayProb };
  };

  const { homeProb, awayProb } = calculateTeamProbabilities();

  function createRow(team: string, estimatedProb: number): GridRow {
    const row: GridRow = {
      id: team,
      team,
      estimatedProbability: estimatedProb,
    };
  
    validBookmakers.forEach(bookmaker => {
      const marketData = bookmaker.markets.find(m => m.key === marketType);
      const outcome = marketData?.outcomes.find(o => o.name === team);
      if (outcome) {
        const decimalOdds = americanToDecimal(outcome.price);
        const impliedProb = calculateImpliedProbability(decimalOdds);
        const probDifference = estimatedProb - impliedProb;
        const kellyFraction = calculateKellyCriterion(decimalOdds, estimatedProb);
        const recommendedBet = kellyFraction * bankroll;
  
        const cellData: BookmakerCellData = {
          odds: outcome.price,
          impliedProbability: impliedProb,
          probDifference,
          kellyFraction,
          recommendedBet,
          point: outcome.point,
        };
  
        row[bookmaker.key] = cellData;
      } else {
        row[bookmaker.key] = undefined;
      }
    });
  
    return row;
  }
  

  const rows: GridRow[] = [
    createRow(details.home_team, homeProb),
    createRow(details.away_team, awayProb),
  ];

  const filteredRows = rows.filter(row => {
    if (!showOnlyKellyBets) return true;

    return validBookmakers.some(bookmaker => {
      const data = row[bookmaker.key] as BookmakerCellData | null;
      return data?.kellyFraction !== undefined && data.kellyFraction > 0;
    });
  });

  const columns = [
    {
      field: 'team',
      headerName: 'Team',
      width: 150,
    },
    {
      field: 'estimatedProbability',
      headerName: 'Est. Prob.',
      width: 100,
      valueFormatter: (params: GridCellParams) => {
        if (params.value === undefined) return '';
        return `${(params.value as number * 100).toFixed(1)}%`;
      },
      renderCell: (params: GridRenderCellParams<GridRow, number>) => {
        if (params.value === undefined) return null;
        return (
          <div className="font-semibold">
            {(params.value * 100).toFixed(1)}%
          </div>
        );
      }
    },
    ...validBookmakers.map(bookmaker => ({
      field: bookmaker.key,
      headerName: bookmaker.title,
      width: 150,
      renderCell: (params: GridRenderCellParams) => {
        const data = params.value as BookmakerCellData | null;
        if (!data) return '-';

        const {
          odds,
          impliedProbability,
          probDifference,
          kellyFraction,
          recommendedBet,
          point,
        } = data;

        const isValueBet = probDifference > 0;
        const isKellyBet = kellyFraction > 0;

        return (
          <div className={`
            p-2 text-center w-full h-full flex flex-col justify-center
            ${isValueBet && isKellyBet ? 'bg-green-100 rounded' : ''}
          `}>
            <div className={`
              text-xs
              ${probDifference > 0 ? 'text-green-600' : 'text-red-600'}
            `}>
              {probDifference !== 0 &&
                `${probDifference > 0 ? '⬆' : '⬇'} ${Math.abs(probDifference * 100).toFixed(1)}%`
              }
            </div>
            <div className="text-lg font-medium">
              {odds > 0 ? `+${odds}` : odds}
            </div>
            <div className="text-xs text-gray-500">
              {(impliedProbability * 100).toFixed(1)}%
            </div>
            {marketType === 'spreads' && point !== undefined && (
              <div className="text-sm text-gray-400">
                {point > 0 ? '+' : ''}{point}
              </div>
            )}
            {bankroll && isKellyBet && (
              <div className="text-xs text-green-600 font-bold">
                ${recommendedBet.toFixed(0)}
                <div className="text-gray-500">
                  ({(kellyFraction * 100).toFixed(1)}%)
                </div>
              </div>
            )}
          </div>
        );
      },
    })),
  ];

  return (
    <div className="mb-8 bg-white">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      <div style={{ width: '100%' }}>
        <ThemeProvider theme={theme}>
          <DataGrid
            rows={filteredRows}
            columns={columns}
            getRowHeight={() => 'auto'}
            getEstimatedRowHeight={() => 200}
            pageSizeOptions={[2]}
            hideFooter
            disableRowSelectionOnClick
            sx={{
              '& .MuiDataGrid-cell': {
                borderRight: '1px solid #e0e0e0',
                padding: '8px',
                '&[data-field="matchInfo"]': {
                  backgroundColor: '#f8f8ff',
                }
              },
              '& .MuiDataGrid-columnHeaders': {
                borderBottom: '2px solid #200589',
                backgroundColor: '#f8f8ff',
                '& .MuiDataGrid-columnHeader': {
                  borderRight: '2px solid #200589',
                  borderTop: '2px solid #200589',
                  '&:first-of-type': {
                    borderLeft: '2px solid #200589',
                  },
                },
              },
              '& .MuiDataGrid-columnHeader': {
                padding: '8px',
                color: '#200589',
                fontWeight: 'bold',
                backgroundColor: '#f8f8ff',
              },
              '& .MuiDataGrid-pinnedColumns': {
                backgroundColor: '#ffffff',
                boxShadow: '2px 0 4px rgba(32, 5, 137, 0.1)',
              },
              '& .MuiDataGrid-columnSeparator': {
                color: '#200589',
              },
              '& .MuiDataGrid-menuIcon': {
                color: '#200589',
              },
              '& .MuiDataGrid-sortIcon': {
                color: '#200589',
              },
            }}
          />
        </ThemeProvider>
      </div>
    </div>
  );
};

// MatchDetailsPage Component

const MatchDetailsPage: React.FC<MatchDetailsPageProps> = ({ bankroll, setBankroll }) => {
  const { sportKey, matchId } = useParams<{ sportKey: string; matchId: string }>();

  const [showOnlyKellyBets, setShowOnlyKellyBets] = useState<boolean>(false);

  const { data: matchDetails, isLoading, error } = useQuery({
    queryKey: ['matchDetails', sportKey, matchId],
    queryFn: async () => {
      try {
        const response = await fetchBothMatchDetails(sportKey!, matchId!);
        return response;
      } catch (error) {
        console.error('Error fetching match details:', error);
        throw error;
      }
    },
    enabled: !!sportKey && !!matchId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen p-8">
        <div className="animate-pulse text-center">Loading match details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-8">
        <div className="text-red-500 text-center">Error loading match details</div>
      </div>
    );
  }

  const details = matchDetails as MatchDetails;

  return (
    <div className="min-h-screen p-8 bg-white">
      <Link to="/" className="flex items-center gap-2 text-neon mb-6 hover:underline">
        <ArrowLeft size={20} />
        Back to all matches
      </Link>

      <h1 className="text-4xl font-bold mb-6">
        {details.home_team} vs {details.away_team}
      </h1>

      {/* Bankroll Input */}
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <h2 style={{ paddingBottom: '8px', fontWeight: 'bold' }}>
          Bankroll (Kelly Criterion)
        </h2>
        <BankrollInput bankroll={bankroll} setBankroll={setBankroll} />
      </div>

      {/* Kelly Bets Toggle */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
        <FormControlLabel
          control={<Switch checked={showOnlyKellyBets} onChange={() => setShowOnlyKellyBets(!showOnlyKellyBets)} color="primary" />}
          label="Show Only Kelly Bets"
        />
      </div>

      <div className="space-y-8">
        <MarketTable
          details={details}
          marketType="h2h"
          title="Moneyline"
          bankroll={bankroll}
          showOnlyKellyBets={showOnlyKellyBets}
        />

        <MarketTable
          details={details}
          marketType="spreads"
          title="Spread"
          bankroll={bankroll}
          showOnlyKellyBets={showOnlyKellyBets}
        />


        <PlayerProps sportKey={sportKey!} matchId={matchId!} />

      </div>
    </div>
  );
};

export default MatchDetailsPage;
