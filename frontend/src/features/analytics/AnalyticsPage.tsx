import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { DonutChart } from '../../components/shared/charts/DonutChart';
import { PerformanceBarChart } from '../../components/shared/charts/PerformanceBarChart';
import { LocationFilter, type LocationFilterValue } from '../../components/shared/LocationFilter';
import { RESULT_COLORS, URBAN_COLORS } from '../../lib/chartColors';

export default function AnalyticsPage() {
  const [location, setLocation] = useState<LocationFilterValue>({});

  const { data, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => analyticsService.getAnalytics(),
  });

  if (isLoading)
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-[400px] w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    );



  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Analytics & Reports</h1>
        <div className="flex flex-wrap items-center gap-2">
          <LocationFilter value={location} onChange={setLocation} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle>Pass vs Refer</CardTitle>
          </CardHeader>
          <CardContent>
            {data && <DonutChart data={data.passVsRefer} colors={RESULT_COLORS} />}
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle>Urban vs Rural</CardTitle>
          </CardHeader>
          <CardContent>
            {data && <DonutChart data={data.urbanVsRural} colors={URBAN_COLORS} />}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-1">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle>Year-wise Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.yearlyPerformance && (
              <PerformanceBarChart data={data.yearlyPerformance} screeningsColor="#6366f1" />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
