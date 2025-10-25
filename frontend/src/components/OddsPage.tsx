
/* ++++++++++ IMPORTS ++++++++++ */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { Search, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';

/* ++++++++++ MATERIAL UI ++++++++++ */
import { 
  DataGrid, 
  GridRenderCellParams,
  GridCellParams,
} from '@mui/x-data-grid';
import { TextField, Button, Switch, FormControlLabel } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';

/* ++++++++++ SERVICES ++++++++++ */
import { fetchOdds } from '../services/api';


/* ++++++++++ TYPES ++++++++++ */
interface OddsPageProps {
  bankroll: number;
  setBankroll: (value: number) => void;
}

interface Sport {
  key: string;
  title: string;
}

interface MarketOption {
  value: string;
  label: string;
}

interface Market {
  key: string;
  outcomes: Outcome[];
}

interface BookmakerData {
  key: string;
  title: string;
  markets: Market[];
}

interface Bookmaker {
  key: string;
  title: string;
}

interface Outcome {
  name: string;
  price: number;
  point?: number;
}

interface Match {
  id: string;
  home_team: string;
  away_team: string;
  bookmakers: BookmakerData[];
  sport?: string;
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
  matchId: string;
  matchIndex: number;
  sport: string;
  sportTitle?: string;
  matchName: string;
  team: string;
  estimatedProbability: number;
  [bookmakerKey: string]: BookmakerCellData | string | number | undefined;
}

interface BankrollInputProps {
  bankroll: number;
  setBankroll: (value: number) => void;
}

interface OddsDataGridProps {
  matches: Match[];
  selectedMarket: string;
  selectedBooks: Set<string>;
  bankroll: number;
  popularBookmakers: Bookmaker[];
  ALL_SPORTS: Sport[];
  showOnlyKellyBets: boolean;
  evFilterThreshold: number;
}

/* ++++++++++ CONSTANTS ++++++++++ */
const MAIN_SPORTS: Sport[] = [
  { key: 'americanfootball_nfl', title: 'NFL' },
  { key: 'americanfootball_ncaaf', title: 'NCAAF' },
  { key: 'basketball_nba', title: 'NBA' },
  { key: 'baseball_mlb', title: 'MLB' },
  { key: 'mma_mixed_martial_arts', title: 'MMA' },
  { key: 'icehockey_nhl', title: 'NHL' },
  { key: 'tennis_atp_french_open', title: 'Tennis' },
];

const SOCCER_LEAGUES: Sport[] = [
  { key: 'soccer_usa_mls', title: 'MLS' },
  { key: 'soccer_brazil_campeonato', title: 'Brazil Série A' },
  { key: 'soccer_spain_segunda_division', title: 'La Liga 2' },
  { key: 'soccer_uefa_european_championship', title: 'UEFA Euro' },
  { key: 'soccer_australia_aleague', title: 'A-League' },
  { key: 'soccer_japan_j_league', title: 'J League' }
];

const ALL_SPORTS = [...MAIN_SPORTS, ...SOCCER_LEAGUES];

const marketOptions: MarketOption[] = [
  { value: 'h2h', label: 'Moneyline' },
  { value: 'spreads', label: 'Spread' }
];

const popularBookmakers: Bookmaker[] = [
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
  { key: 'ballybet', title: 'Bally Bet' },
  { key: 'betanysports', title: 'BetAnySports' },
  { key: 'betparx', title: 'betPARX' },
  { key: 'espnbet', title: 'ESPN BET' },
  { key: 'fliff', title: 'Fliff' },
  { key: 'hardrockbet', title: 'Hard Rock Bet' },
  { key: 'windcreek', title: 'Wind Creek (Betfred PA)' },
];

/* ++++++++++ MATERIAL UI THEME ++++++++++ */
const theme = createTheme({
  palette: {
    primary: {
      main: '#200589',
    },
  },
  components: {
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '&:hover fieldset': {
              borderColor: '#200589',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#200589',
            },
          },
          '& .MuiInputLabel-root.Mui-focused': {
            color: '#200589',
          },
        },
      },
    },
  },
});


/* ++++++++++ UTILITIES ++++++++++ */
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

/* ++++++++++ COMPONENTS ++++++++++ */
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

/* ++++++++++ ODDS DATA GRID ++++++++++ */
const OddsDataGrid: React.FC<OddsDataGridProps> = ({
  matches,
  selectedMarket,
  selectedBooks,
  bankroll,
  popularBookmakers,
  ALL_SPORTS,
  showOnlyKellyBets,
  evFilterThreshold
}) => {
  const rows: GridRow[] = useMemo(() => {
    const allRows = matches.flatMap((match: Match, index: number) => {
      const filteredBookmakers = match.bookmakers
        .filter((bookmaker: BookmakerData) => selectedBooks.has(bookmaker.key));

      const calculateTeamProbabilities = (homeTeam: string, awayTeam: string): { homeProb: number; awayProb: number } => {
        const homeProbabilities: number[] = [];
        const awayProbabilities: number[] = [];

        filteredBookmakers.forEach(bookmaker => {
          const marketData = bookmaker.markets.find((m: Market) => m.key === selectedMarket);
          if (marketData) {
            const homeOutcome = marketData.outcomes.find((o: Outcome) => o.name === homeTeam);
            const awayOutcome = marketData.outcomes.find((o: Outcome) => o.name === awayTeam);

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

      const { homeProb, awayProb } = calculateTeamProbabilities(match.home_team, match.away_team);

      /* ++++++++++ CREATE BOOKMAKER DATA ++++++++++ */
      const createBookmakerData = (team: string, estimatedProb: number): Record<string, BookmakerCellData> => {
        const bookmakerData: Record<string, BookmakerCellData> = {};
        
        filteredBookmakers.forEach((bookmaker) => {
          const marketData = bookmaker.markets.find(m => m.key === selectedMarket);
          const outcome = marketData?.outcomes.find(o => o.name === team);
          
          if (outcome?.price) {
            const decimalOdds = americanToDecimal(outcome.price);
            const impliedProb = calculateImpliedProbability(decimalOdds);
            const probDifference = estimatedProb - impliedProb;
            const kellyFraction = calculateKellyCriterion(decimalOdds, estimatedProb);
            const recommendedBet = kellyFraction * (bankroll || 0);

            bookmakerData[bookmaker.key] = {
              odds: outcome.price,
              impliedProbability: impliedProb,
              probDifference,
              kellyFraction,
              recommendedBet,
              point: outcome.point
            };
          }
        });

        return bookmakerData;
      };

      const homeData = createBookmakerData(match.home_team, homeProb);
      const awayData = createBookmakerData(match.away_team, awayProb);

      // Create rows as before
      const homeRow = {
        id: `${match.id}-home`,
        matchId: match.id,
        matchIndex: index,
        sport: match.sport || '',
        sportTitle: ALL_SPORTS.find(sport => sport.key === match.sport)?.title,
        matchName: `${match.home_team} vs ${match.away_team}`,
        team: match.home_team,
        estimatedProbability: homeProb,
        ...homeData
      };

      const awayRow = {
        id: `${match.id}-away`,
        matchId: match.id,
        matchIndex: index,
        sport: match.sport || '',
        sportTitle: ALL_SPORTS.find(sport => sport.key === match.sport)?.title,
        matchName: `${match.home_team} vs ${match.away_team}`,
        team: match.away_team,
        estimatedProbability: awayProb,
        ...awayData
      };

      return [homeRow, awayRow];
    });

    const getBookmakerData = (row: GridRow, key: string): BookmakerCellData | undefined => {
      return row[key] as BookmakerCellData | undefined;
    };
    
    if (showOnlyKellyBets) {
      return allRows.filter(row => {
        const bookmakerKeys = Array.from(selectedBooks);
    
        return bookmakerKeys.some(key => {
          const data = getBookmakerData(row, key);
          return data?.kellyFraction !== undefined && data.kellyFraction > 0;
        });
      });
    }

    return allRows.filter(row => {
      const bookmakerKeys = Array.from(selectedBooks);
  
      return bookmakerKeys.some(key => {
        const data = getBookmakerData(row, key);
        if (data) {
          const evPercent = data.probDifference * 100;
          const meetsEvThreshold = evPercent >= evFilterThreshold;
          const meetsKellyBets = !showOnlyKellyBets || (data.kellyFraction !== undefined && data.kellyFraction > 0);
          return meetsEvThreshold && meetsKellyBets;
        }
        return false;
      });
    });
  }, [matches, selectedBooks, selectedMarket, bankroll, showOnlyKellyBets, evFilterThreshold, ALL_SPORTS]);
  // Create columns for the DataGrid
  const columns = useMemo(() => {
    const baseColumns = [
      {
        field: 'matchInfo',
        headerName: 'Game',
        width: 200,
        renderCell: (params: GridRenderCellParams) => (
          <div>
            <div className="text-sm text-gray-500">{params.row.sportTitle}</div>
            <Link 
              to={`/match/${params.row.sport}/${params.row.matchId}`}
              className="text-blue-600 hover:underline"
            >
              {params.row.matchName}
            </Link>
          </div>
        ),
      },
      {
        field: 'team',
        headerName: 'Team',
        width: 150,
      },
      {
        field: 'estimatedProbability',
        headerName: 'Est. Prob.',
        width: 80,
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
      }
    ];

    const bookmakerColumns = popularBookmakers
      .filter(bookmaker => selectedBooks.has(bookmaker.key))
      .map(bookmaker => ({
        field: bookmaker.key,
        headerName: bookmaker.title,
        width: 120,
        renderCell: (params: GridRenderCellParams<GridRow>) => {
          const data = params.row[bookmaker.key] as BookmakerCellData | undefined;
          if (!data) return '-';

          const {
            odds,
            impliedProbability,
            probDifference,
            kellyFraction,
            recommendedBet,
            point
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
              {selectedMarket === 'spreads' && point !== undefined && (
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
        }
      }));

    return [...baseColumns, ...bookmakerColumns];
  }, [selectedMarket, selectedBooks, bankroll, popularBookmakers]);

  // Render the DataGrid
  return (
    <div style={{ height: 'calc(95vh)', width: '100%' }}>
      <DataGrid
        rows={rows}
        columns={columns}
        density="comfortable"
        disableRowSelectionOnClick
        getRowHeight={() => 'auto'}
        getEstimatedRowHeight={() => 200}
        initialState={{
          pagination: { paginationModel: { pageSize: 100 } },
        }}
        sx={{
          '& .MuiDataGrid-cell': {
            borderRight: '1px solid #e0e0e0',
            padding: '8px',
            minHeight: 'unset !important',
            maxHeight: 'unset !important',
            '&[data-field="matchInfo"]': {
              backgroundColor: '#f8f8ff',
            }
          },
          '& .MuiDataGrid-row': {
            minHeight: 'unset !important',
            maxHeight: 'unset !important',
            '&:hover': {
              backgroundColor: 'rgba(32, 5, 137, 0.04)',
            },
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
    </div>
  );
};

/* ++++++++++ ODDS PAGE ++++++++++ */
const OddsPage: React.FC<OddsPageProps> = ({ bankroll, setBankroll }) => {
  /* ++++++++++ STATE ++++++++++ */
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [selectedSoccerLeague, setSelectedSoccerLeague] = useState<string | null>(null);
  const [selectedMarket, setSelectedMarket] = useState<string>('h2h');
  const [selectedBooks, setSelectedBooks] = useState<Set<string>>(new Set(popularBookmakers.map(b => b.key)));
  const [showSoccerLeagues, setShowSoccerLeagues] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showOnlyKellyBets, setShowOnlyKellyBets] = useState<boolean>(false);
  const [evFilterThreshold, setEvFilterThreshold] = useState<number>(0);

  /* ++++++++++ REFS ++++++++++ */
  const fixedTableRef = useRef<HTMLDivElement>(null);
  const scrollableTableRef = useRef<HTMLDivElement>(null);
  const isUserScrolling = useRef(false);

  /* ++++++++++ USE QUERIES ++++++++++ */
  const fixedTableRowRefs = useRef<{ [key: string]: HTMLTableRowElement | null }>({});
  const scrollableTableRowRefs = useRef<{ [key: string]: HTMLTableRowElement | null }>({});

  const handleToggleKellyBets = () => setShowOnlyKellyBets((prev) => !prev);

  /* ++++++++++ QUERIES ++++++++++ */
  const sportsQueries = useQueries({
    queries: ALL_SPORTS.map(sport => ({
      queryKey: ['odds', sport.key, selectedMarket, Array.from(selectedBooks)],
      queryFn: () => fetchOdds(sport.key, selectedMarket).then(data => 
        data.map((match: Match) => ({
          ...match,
          sport: sport.key,
          sportTitle: sport.title
        }))
      ),
      enabled: !selectedSport || selectedSport === sport.key,
    }))
  });

  const isLoading = sportsQueries.some(query => query.isLoading);
  const allOdds = sportsQueries
    .filter(query => query.data)
    .flatMap(query => query.data ?? []);

  /* ++++++++++ HANDLERS ++++++++++ */
  const handleSportClick = (sportKey: string) => {
    if (sportKey === 'soccer') {
      setShowSoccerLeagues(true);
      setSelectedSport(null);
    } else {
      setShowSoccerLeagues(false);
      setSelectedSport(sportKey);
      setSelectedSoccerLeague(null);
    }
  };

  const handleSoccerLeagueClick = (leagueKey: string) => {
    setSelectedSport(leagueKey);
    setSelectedSoccerLeague(leagueKey);
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
    setSelectedBooks(
      selectedBooks.size === popularBookmakers.length
        ? new Set()
        : new Set(popularBookmakers.map(b => b.key))
    );
  };

  const filterMatches = (matches: Match[]) => {
    if (!searchQuery) {
      return selectedSport ? matches.filter(match => match.sport === selectedSport) : matches;
    }
    
    const query = searchQuery.toLowerCase();
    return matches.filter(match => 
      match.home_team.toLowerCase().includes(query) ||
      match.away_team.toLowerCase().includes(query)
    );
  };

  const isAllSelected = selectedBooks.size === popularBookmakers.length;
  const filteredMatches = filterMatches(allOdds);

  /* ++++++++++ ROW HEIGHT SYNC ++++++++++ */
  useEffect(() => {
    const syncRowHeights = () => {
      Object.keys(fixedTableRowRefs.current).forEach((key) => {
        const fixedRow = fixedTableRowRefs.current[key];
        const scrollableRow = scrollableTableRowRefs.current[key];
        
        if (fixedRow && scrollableRow) {
          // Get the natural heights of both rows
          fixedRow.style.height = 'auto';
          scrollableRow.style.height = 'auto';
          
          const fixedHeight = fixedRow.getBoundingClientRect().height;
          const scrollableHeight = scrollableRow.getBoundingClientRect().height;
          
          // Set both rows to the maximum height
          const maxHeight = Math.max(fixedHeight, scrollableHeight);
          fixedRow.style.height = `${maxHeight}px`;
          scrollableRow.style.height = `${maxHeight}px`;
        }
      });
    };

    // Run synchronization after initial render
    syncRowHeights();
    
    // Add resize observer to handle dynamic content changes
    const resizeObserver = new ResizeObserver(syncRowHeights);
    
    Object.values(fixedTableRowRefs.current).forEach(row => {
      if (row) resizeObserver.observe(row);
    });
    Object.values(scrollableTableRowRefs.current).forEach(row => {
      if (row) resizeObserver.observe(row);
    });

    return () => {
      resizeObserver.disconnect();
    };
  }, [filteredMatches, selectedMarket, bankroll]);

  /* ++++++++++ SCROLL SYNC ++++++++++ */
  useEffect(() => {
    const fixedTable = fixedTableRef.current;
    const scrollableTable = scrollableTableRef.current;

    if (!fixedTable || !scrollableTable) return;

    const syncScroll = (e: Event) => {
      if (!isUserScrolling.current) {
        isUserScrolling.current = true;
        const sourceElement = e.target as HTMLDivElement;
        const targetElement = sourceElement === fixedTable ? scrollableTable : fixedTable;
        targetElement.scrollTop = sourceElement.scrollTop;
        requestAnimationFrame(() => {
          isUserScrolling.current = false;
        });
      }
    };

    // Add passive scroll listeners for better performance
    fixedTable.addEventListener('scroll', syncScroll, { passive: true });
    scrollableTable.addEventListener('scroll', syncScroll, { passive: true });

    return () => {
      fixedTable.removeEventListener('scroll', syncScroll);
      scrollableTable.removeEventListener('scroll', syncScroll);
    };
  }, []);

  /* ++++++++++ RENDER ++++++++++ */
  return (
    <ThemeProvider theme={theme}>
      <div className="pt-8 text-black bg-white">
        {/* Search Bar with updated styling */}
        <div className="flex justify-center mb-6">
          <TextField
            label="Search across all sports and leagues..."
            variant="outlined"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <Search className="text-neon" size={20} />,
            }}
            sx={{
              width: '100%',
              maxWidth: '400px',
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: '#200589',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#200589',
                },
              },
            }}
          />
        </div>

      {/* Bankroll Input */}
      <div
        style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}
      >
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ paddingBottom: '8px', fontWeight: 'bold' }}>
            Bankroll (Kelly Criterion)
          </h2>
          <BankrollInput bankroll={bankroll} setBankroll={setBankroll} />
        </div>
      </div>

      {/* Kelly Bets Toggle */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
        <FormControlLabel
          control={<Switch checked={showOnlyKellyBets} onChange={handleToggleKellyBets} color="primary" />}
          label="Show Only Kelly Bets"
        />
      </div>

      {/* EV% Filter */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
        <TextField
          label="Minimum EV%"
          variant="outlined"
          type="number"
          value={evFilterThreshold}
          onChange={(e) => {
            const value = parseFloat(e.target.value);
            if (!isNaN(value)) {
              setEvFilterThreshold(value);
            } else {
              setEvFilterThreshold(0);
            }
          }}          InputProps={{
            endAdornment: <span>%</span>,
          }}
          sx={{
            width: '200px',
            '& .MuiOutlinedInput-root': {
              '&:hover fieldset': {
                borderColor: '#200589',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#200589',
              },
            },
          }}
        />
      </div>

      {/* Sports List */}
      <div
        style={{
          overflowX: 'auto',
          marginBottom: '16px',
          borderBottom: '1px solid #00f',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            padding: '0 16px 8px',
            minWidth: '800px',
          }}
        >
          {MAIN_SPORTS.map((sport) => (
            <Button
              key={sport.key}
              onClick={() => handleSportClick(sport.key)}
              style={{
                borderBottom: selectedSport === sport.key ? '2px solid #00f' : 'none',
                fontSize: '24px',
                marginRight: '16px',
                whiteSpace: 'nowrap',
              }}
            >
              {sport.title}
            </Button>
          ))}
          {/*}
          <Button
            onClick={() => handleSportClick('soccer')}
            style={{
              borderBottom: showSoccerLeagues ? '2px solid #00f' : 'none',
              fontSize: '24px',
              whiteSpace: 'nowrap',
            }}
          >
            Soccer
          </Button>
          */}
        </div>
      </div>


      {/* Soccer Leagues */}
      {showSoccerLeagues && (
        <div
          style={{
            overflowX: 'auto',
            marginBottom: '16px',
            borderBottom: '1px solid #00f',
          }}
        >
          <div style={{ display: 'flex', padding: '0 16px 8px', justifyContent: 'center' }}>
            {SOCCER_LEAGUES.map((league) => (
              <Button
                key={league.key}
                onClick={() => handleSoccerLeagueClick(league.key)}
                style={{
                  borderBottom:
                    selectedSoccerLeague === league.key ? '2px solid #00f' : 'none',
                  fontSize: '18px',
                  marginRight: '16px',
                }}
              >
                {league.title}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Market Selection and Bookmaker Filters */}
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '16px',
            borderBottom: '1px solid #00f',
          }}
        >
          {marketOptions.map((option) => (
            <Button
              key={option.value}
              onClick={() => setSelectedMarket(option.value)}
              style={{
                borderBottom:
                  selectedMarket === option.value ? '2px solid #00f' : 'none',
                fontSize: '18px',
                marginRight: '16px',
              }}
            >
              {option.label}
            </Button>
          ))}
        </div>

        <div className="mb-4 flex flex-wrap gap-2 justify-center">
          <button
            onClick={handleSelectAllBooks}
            className={`px-4 py-2 rounded ${
              isAllSelected ? 'bg-neon' : 'bg-gray-800'
            } text-white`}
          >
            {isAllSelected ? 'Deselect All' : 'Select All'}
          </button>
          {popularBookmakers.map((bookmaker) => (
            <button
              key={bookmaker.key}
              onClick={() => handleBookToggle(bookmaker.key)}
              className={`px-4 py-2 rounded ${
                selectedBooks.has(bookmaker.key) ? 'bg-neon' : 'bg-gray-800'
              } text-white`}
            >
              {bookmaker.title}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {isLoading && <p className="text-center">Loading odds...</p>}

        {/* Main Content */}
        {filteredMatches.length > 0 && (
        <OddsDataGrid
          matches={filteredMatches}
          selectedMarket={selectedMarket}
          selectedBooks={selectedBooks}
          bankroll={bankroll}
          popularBookmakers={popularBookmakers}
          ALL_SPORTS={ALL_SPORTS}
          showOnlyKellyBets={showOnlyKellyBets}
          evFilterThreshold={evFilterThreshold}
        />
      )}
        
        {filteredMatches.length === 0 && !isLoading && (
          <p className="text-center text-gray-500 mt-4">
            No matches found. Try adjusting your search or filters.
          </p>
        )}
      </div>
    </div>
    </ThemeProvider>
  );
};

export default OddsPage;