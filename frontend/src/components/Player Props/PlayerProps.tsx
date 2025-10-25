/* ++++++++++ IMPORTS ++++++++++ */
import React from 'react';
import { useQuery } from '@tanstack/react-query';

/* ++++++++++ MATERIAL-UI ++++++++++ */
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { createTheme, ThemeProvider } from '@mui/material/styles';

/* ++++++++++ SERVICES ++++++++++ */
import { fetchPlayerProps } from '../../services/api';

/* ++++++++++ TYPES ++++++++++ */
interface PlayerPropOutcome {
  name: string;
  description: string;
  price: number;
  point?: number;
}

interface PlayerPropMarket {
  key: string;
  last_update: string;
  outcomes: PlayerPropOutcome[];
}

interface PlayerPropBookmaker {
  key: string;
  title: string;
  markets: PlayerPropMarket[];
}

/* ++++++++++ CONSTANTS ++++++++++ */
const PROP_TYPE_GROUPS = {
  'Passing': [
    'player_pass_tds',
    'player_pass_yds',
    'player_pass_attempts',
    'player_pass_completions',
    'player_pass_interceptions',
  ],
  'Rushing': ['player_rush_yds', 'player_rush_attempts', 'player_rush_longest'],
  'Receiving': [
    'player_receptions',
    'player_reception_yds',
    'player_reception_longest',
  ],
  'Scoring': [
    'player_pass_rush_reception_tds',
    'player_anytime_td',
    'player_1st_td',
    'player_last_td',
  ],
  'Defense': [
    'player_sacks',
    'player_solo_tackles',
    'player_tackles_assists',
  ],
} as const;

const PROP_DISPLAY_NAMES: Record<string, string> = {
  'player_pass_tds': 'Passing Touchdowns',
  'player_pass_yds': 'Passing Yards',
  'player_pass_attempts': 'Pass Attempts',
  'player_pass_completions': 'Pass Completions',
  'player_pass_interceptions': 'Interceptions',
  'player_rush_yds': 'Rushing Yards',
  'player_rush_attempts': 'Rush Attempts',
  'player_rush_longest': 'Longest Rush',
  'player_receptions': 'Receptions',
  'player_reception_yds': 'Receiving Yards',
  'player_reception_longest': 'Longest Reception',
  'player_pass_rush_reception_tds': 'Total Touchdowns',
  'player_anytime_td': 'Anytime Touchdown',
  'player_1st_td': 'First Touchdown',
  'player_last_td': 'Last Touchdown',
  'player_sacks': 'Sacks',
  'player_solo_tackles': 'Solo Tackles',
  'player_tackles_assists': 'Tackles + Assists',
};

interface PlayerPropsTableProps {
  sportKey: string;
  matchId: string;
  propType: string;
  markets: readonly string[];
}

interface GridRow {
  id: string;
  playerName: string;
  propName: string;
  line: number;
  [bookmakerKey: string]: any;
}

/* ++++++++++ MUI THEME ++++++++++ */
const theme = createTheme({
  palette: {
    primary: {
      main: '#200589',
    },
  },
});

const PlayerPropsTable: React.FC<PlayerPropsTableProps> = ({
  sportKey,
  matchId,
  propType,
  markets,
}) => {
  const { data, isLoading } = useQuery({
    queryKey: ['playerProps', sportKey, matchId, propType],
    queryFn: () => fetchPlayerProps(sportKey, matchId, markets as any[]),
    enabled: !!sportKey && !!matchId,
  });

  if (isLoading)
    return (
      <div className="animate-pulse">Loading {propType} props...</div>
    );
  if (!data?.bookmakers?.length) return null;

  // Get unique players and their props
  const rows: GridRow[] = [];
  const playerPropSet = new Set<string>();

  data.bookmakers.forEach((bookmaker: PlayerPropBookmaker) => {
    bookmaker.markets.forEach((market: PlayerPropMarket) => {
      market.outcomes.forEach((outcome: PlayerPropOutcome) => {
        const key = `${outcome.description}-${market.key}`;
        if (!playerPropSet.has(key)) {
          playerPropSet.add(key);
          rows.push({
            id: key,
            playerName: outcome.description,
            propName: PROP_DISPLAY_NAMES[market.key] || market.key,
            line: outcome.point ?? 0,
          });
        }
      });
    });
  });

  // Build columns
  const columns: GridColDef[] = [
    {
      field: 'playerName',
      headerName: 'Player',
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <div>{params.value}</div>
      ),
    },
    {
      field: 'propName',
      headerName: 'Prop',
      width: 200,
    },
    {
      field: 'line',
      headerName: 'Line',
      width: 80,
    },
  ];

  // Add bookmaker columns
  data.bookmakers.forEach((bookmaker: PlayerPropBookmaker) => {
    columns.push(
      {
        field: `${bookmaker.key}-over`,
        headerName: `${bookmaker.title} Over`,
        width: 120,
        renderCell: (params: GridRenderCellParams) => {
          const value = params.value;
          return (
            <div style={{ color: 'green', fontWeight: 'bold' }}>
              {value !== undefined ? value : '-'}
            </div>
          );
        },
      },
      {
        field: `${bookmaker.key}-under`,
        headerName: `${bookmaker.title} Under`,
        width: 120,
        renderCell: (params: GridRenderCellParams) => {
          const value = params.value;
          return (
            <div style={{ color: 'red', fontWeight: 'bold' }}>
              {value !== undefined ? value : '-'}
            </div>
          );
        },
      }
    );
  });

  // Populate the rows with odds data
  rows.forEach(row => {
    data.bookmakers.forEach((bookmaker: PlayerPropBookmaker) => {
      const market = bookmaker.markets.find(
        m => PROP_DISPLAY_NAMES[m.key] === row.propName
      );
      const overOutcome = market?.outcomes.find(
        o => o.description === row.playerName && o.name === 'Over'
      );
      const underOutcome = market?.outcomes.find(
        o => o.description === row.playerName && o.name === 'Under'
      );

      row[`${bookmaker.key}-over`] = overOutcome?.price;
      row[`${bookmaker.key}-under`] = underOutcome?.price;
    });
  });

  /* ++++++++++ RETURN GRID ++++++++++ */
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">{propType} Props</h2>
      <div style={{ height: 600, width: '100%' }}>
        <ThemeProvider theme={theme}>
          <DataGrid
            rows={rows}
            columns={columns}
            pageSizeOptions={[10, 20, 50]}
            disableRowSelectionOnClick
            sx={{
              '& .MuiDataGrid-cell': {
                borderRight: '1px solid #e0e0e0',
                padding: '8px',
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

/* ++++++++++ RENDER ++++++++++ */
export const PlayerProps: React.FC<{
  sportKey: string;
  matchId: string;
}> = ({ sportKey, matchId }) => {
  return (
    // Render a table for each prop type group
    <div className="space-y-8">
      {Object.entries(PROP_TYPE_GROUPS).map(([groupName, markets]) => ( //
        <PlayerPropsTable
          key={groupName}
          sportKey={sportKey}
          matchId={matchId}
          propType={groupName}
          markets={markets}
        />
      ))}
    </div>
  );
};
