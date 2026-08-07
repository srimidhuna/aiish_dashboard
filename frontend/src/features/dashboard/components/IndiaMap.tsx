import { useState, useMemo, ReactNode } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { scaleLinear } from 'd3-scale';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import { useTheme } from '../../../components/ThemeProvider';

export interface StateData {
  name: string;
  hospitals: number;
  registered: number;
  screenings: number;
  refers: number;
  referralRate: string;
  pendingFollowUps: number;
}

interface IndiaMapProps {
  data: StateData[];
  onSelectState: (state: string) => void;
  selectedState?: string;
}

const geoUrl = '/india-full-map.geojson';

export function IndiaMap({ data, onSelectState, selectedState }: IndiaMapProps) {
  const [tooltipContent, setTooltipContent] = useState<ReactNode>(null);
  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  // Calculate dynamic max value for the color scale
  const maxRegistered = useMemo(() => {
    if (!data || data.length === 0) return 10;
    return Math.max(...data.map(d => d.registered), 10);
  }, [data]);

  // Color scale mapping the number of registered children to a color gradient
  const colorScale = useMemo(() => {
    if (isDark) {
      return scaleLinear<string>()
        .domain([0, maxRegistered])
        .range(['rgba(52, 211, 153, 0.15)', 'rgba(52, 211, 153, 1)']); // Emerald 400
    }
    return scaleLinear<string>()
      .domain([0, maxRegistered])
      .range(['rgba(99, 102, 241, 0.15)', 'rgba(99, 102, 241, 1)']); // Indigo 500
  }, [maxRegistered, theme]);

  return (
    <div className="w-full h-full relative">
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 1000,
          center: [82, 23] // Center over India
        }}
        width={800}
        height={600}
        style={{ width: '100%', height: '100%' }}
      >
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map(geo => {
              const stateName = geo.properties.name || geo.properties.st_nm;
              const stateData = data?.find(s => s.name === stateName);
              const isSelected = selectedState === stateName;
              
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  data-tooltip-id="map-tooltip"
                  onClick={() => onSelectState(stateName)}
                  onMouseEnter={() => {
                      if (stateData) {
                        setTooltipContent(
                          <div className="p-2 min-w-[200px]">
                            <h3 className="font-bold text-lg mb-2 text-white">{stateName}</h3>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                              <span className="text-indigo-200">Registered:</span>
                              <span className="font-semibold text-white">{stateData.registered}</span>
                              <span className="text-indigo-200">Screenings:</span>
                              <span className="font-semibold text-white">{stateData.screenings}</span>
                              <span className="text-indigo-200">Referral Rate:</span>
                              <span className="font-semibold text-white">{stateData.referralRate}</span>
                            </div>
                          </div>
                        );
                      } else {
                        setTooltipContent(
                          <>
                            <div className="p-2 font-bold text-white">{stateName}</div>
                            <div className="text-sm px-2 pb-2 text-gray-300">No data available</div>
                          </>
                        );
                      }
                    }}
                    onMouseLeave={() => {
                      setTooltipContent(null);
                    }}
                    style={{
                      default: {
                        fill: isSelected ? '#f59e0b' : (stateData ? colorScale(stateData.registered) : (isDark ? '#334155' : '#f1f5f9')),
                        outline: 'none',
                        stroke: isDark ? '#1e293b' : '#cbd5e1',
                        strokeWidth: 1,
                        transition: 'all 250ms'
                      },
                      hover: {
                        fill: '#f59e0b',
                        outline: 'none',
                        stroke: isDark ? '#1e293b' : '#cbd5e1',
                        strokeWidth: 1,
                        cursor: 'pointer',
                        transition: 'all 250ms'
                      },
                      pressed: {
                        fill: '#d97706',
                        outline: 'none'
                      }
                    }}
                  />
              );
            })
          }
        </Geographies>
      </ComposableMap>
      
      <Tooltip 
        id="map-tooltip" 
        style={{
          backgroundColor: 'rgba(17, 24, 39, 0.85)', // Gray-900 with opacity
          borderRadius: '12px',
          padding: 0,
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
          zIndex: 50
        }}
      >
        {tooltipContent}
      </Tooltip>
    </div>
  );
}
