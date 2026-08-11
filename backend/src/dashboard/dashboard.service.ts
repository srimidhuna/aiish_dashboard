import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';

/**
 * Normalize a free-text state name entered in the registration form so it
 * matches the state names in the india-states.geojson file used on the map.
 * Rules: trim → title-case each word → expand known abbreviations.
 */
function normalizeStateName(raw: string): string {
  const ALIASES: Record<string, string> = {
    'TN': 'Tamil Nadu',
    'AP': 'Andhra Pradesh',
    'TS': 'Telangana',
    'KA': 'Karnataka',
    'KL': 'Kerala',
    'MH': 'Maharashtra',
    'GJ': 'Gujarat',
    'RJ': 'Rajasthan',
    'UP': 'Uttar Pradesh',
    'MP': 'Madhya Pradesh',
    'WB': 'West Bengal',
    'OR': 'Odisha',
    'OD': 'Odisha',
    'PB': 'Punjab',
    'HR': 'Haryana',
    'HP': 'Himachal Pradesh',
    'JH': 'Jharkhand',
    'CG': 'Chhattisgarh',
    'CH': 'Chhattisgarh',
    'BR': 'Bihar',
    'AS': 'Assam',
    'JK': 'Jammu and Kashmir',
    'UK': 'Uttarakhand',
    'UA': 'Uttarakhand',
    'SK': 'Sikkim',
    'NL': 'Nagaland',
    'MN': 'Manipur',
    'ML': 'Meghalaya',
    'TR': 'Tripura',
    'MZ': 'Mizoram',
    'AR': 'Arunachal Pradesh',
    'GA': 'Goa',
    'DL': 'Delhi',
    'PY': 'Puducherry',
    'PD': 'Puducherry',
    'PONDICHERRY': 'Puducherry',
    'ANDAMAN': 'Andaman and Nicobar Islands',
    'ANDAMAN & NICOBAR': 'Andaman and Nicobar Islands',
    'ANDAMAN AND NICOBAR': 'Andaman and Nicobar Islands',
    'LAKSHADWEEP': 'Lakshadweep',
    'LADAKH': 'Ladakh',
    'DNH': 'Dadra and Nagar Haveli and Daman and Diu',
    'DAMAN': 'Dadra and Nagar Haveli and Daman and Diu',
    'DADRA': 'Dadra and Nagar Haveli and Daman and Diu',
    'CHANDIGARH': 'Chandigarh',
    'DELHI': 'Delhi',
    'JAMMU AND KASHMIR': 'Jammu and Kashmir',
    'JAMMU & KASHMIR': 'Jammu and Kashmir',
  };

  const trimmed = raw.trim();
  const upper = trimmed.toUpperCase();
  if (ALIASES[upper]) return ALIASES[upper];

  // Title-case: capitalize first letter of each word
  return trimmed
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

@Injectable()
export class DashboardService {
  private getDateFilter(year?: string, month?: string, day?: string) {
    if (!year) return undefined;
    const y = parseInt(year, 10);
    if (isNaN(y)) return undefined;

    const m = month ? parseInt(month, 10) : undefined;
    const d = day ? parseInt(day, 10) : undefined;

    if (m !== undefined && !isNaN(m) && d !== undefined && !isNaN(d)) {
      // Daily: specific day
      const start = new Date(y, m - 1, d, 0, 0, 0, 0);
      const end = new Date(y, m - 1, d, 23, 59, 59, 999);
      return { gte: start, lte: end };
    }
    if (m !== undefined && !isNaN(m)) {
      // Monthly: entire month
      const start = new Date(y, m - 1, 1, 0, 0, 0, 0);
      const end = new Date(y, m, 0, 23, 59, 59, 999); // day 0 of next month = last day of current month
      return { gte: start, lte: end };
    }
    // Yearly: entire year
    const start = new Date(y, 0, 1);
    const end = new Date(y, 11, 31, 23, 59, 59, 999);
    return { gte: start, lte: end };
  }

  /** Check whether the given filter range includes the current day */
  private filterIncludesToday(year?: string, month?: string, day?: string): boolean {
    if (!year) return true; // no filter = includes today
    const now = new Date();
    const y = parseInt(year, 10);
    if (y !== now.getFullYear()) return false;
    if (month) {
      const m = parseInt(month, 10);
      if (m !== now.getMonth() + 1) return false;
      if (day) {
        const d = parseInt(day, 10);
        if (d !== now.getDate()) return false;
      }
    }
    return true;
  }

  async getAvailableYears() {
    const agg = await this.prisma.baby.aggregate({
      _min: { createdAt: true },
      _max: { createdAt: true }
    });
    const minYear = agg._min.createdAt ? agg._min.createdAt.getFullYear() : new Date().getFullYear();
    const maxYear = agg._max.createdAt ? agg._max.createdAt.getFullYear() : new Date().getFullYear();
    
    const years: string[] = [];
    for (let y = maxYear; y >= Math.min(minYear, maxYear - 5); y--) {
      years.push(y.toString());
    }
    return Array.from(new Set([...years, new Date().getFullYear().toString()])).sort((a, b) => Number(b) - Number(a));
  }

  constructor(private readonly prisma: PrismaService) {}

  async getOverview(year?: string, month?: string, day?: string) {
    const dateFilter = this.getDateFilter(year, month, day);
    const babyWhere = dateFilter ? { deletedAt: null, createdAt: dateFilter } : { deletedAt: null };
    const screeningWhere = dateFilter ? { status: 'completed', testedAt: dateFilter } : { status: 'completed' };
    const followUpWhere = dateFilter ? { status: { in: ['scheduled', 'rescheduled'] }, scheduledDate: dateFilter } : { status: { in: ['scheduled', 'rescheduled'] } };

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const includestoday = this.filterIncludesToday(year, month, day);

    // Use the specific day range if a day is selected.
    // Otherwise, use today's range (if today is within the selected year/month).
    let selectedDayRange;
    if (day) {
      selectedDayRange = dateFilter!;
    } else {
      selectedDayRange = includestoday
        ? { gte: startOfToday, lte: endOfToday }
        : { gte: new Date('1970-01-01'), lte: new Date('1970-01-01') };
    }

    // todaysFollowUps panel still always shows the real today.
    const todaysFollowUpRange = includestoday
      ? { gte: startOfToday, lte: endOfToday }
      : { gte: new Date('1970-01-01'), lte: new Date('1970-01-01') };

    const [
      totalRegistered,
      todaysRegistrations,
      todaysScreenings,
      todaysPass,
      todaysRefer,
      totalScreenings,
      referCount,
      activeHospitals,
      pendingFollowUps,
      todaysFollowUps,
      highRiskBabies,
      rescreeningRequired,
    ] = await Promise.all([
      this.prisma.baby.count({ where: babyWhere as any }),
      this.prisma.baby.count({
        where: { deletedAt: null, createdAt: selectedDayRange },
      }),
      this.prisma.screening.count({
        where: { status: 'completed', testedAt: selectedDayRange },
      }),
      this.prisma.screening.count({
        where: { status: 'completed', testedAt: selectedDayRange, overallResult: 'pass' },
      }),
      this.prisma.screening.count({
        where: { status: 'completed', testedAt: selectedDayRange, overallResult: 'refer' },
      }),
      this.prisma.screening.count({ where: screeningWhere as any }),
      this.prisma.screening.count({ where: { ...screeningWhere, overallResult: 'refer' } as any }),
      this.prisma.hospital.count({ where: { status: 'active' } }),
      this.prisma.followUp.count({ where: followUpWhere as any }),
      this.prisma.followUp.count({ where: { status: { in: ['scheduled', 'rescheduled'] }, scheduledDate: todaysFollowUpRange } }),
      this.prisma.baby.count({ where: { ...babyWhere, riskFactors: { some: {} } } as any }),
      this.prisma.screening.count({
        where: {
          status: 'completed',
          type: 'rescreening',
          testedAt: selectedDayRange,
        },
      }),
    ]);

    return {
      totalRegistered,
      todaysRegistrations,
      todaysScreenings,
      todaysPass,
      todaysRefer,
      totalScreenings,
      referralRate: totalScreenings ? Math.round((referCount / totalScreenings) * 100) + '%' : '0%',
      activeHospitals,
      pendingFollowUps,
      rescreeningRequired,
      todaysFollowUps,
      highRiskBabies,
    };
  }

  async getActivityTimeline(year?: string, month?: string, day?: string) {
    const dateFilter = this.getDateFilter(year, month, day);
    return this.prisma.patientTimeline.findMany({ where: dateFilter ? { createdAt: dateFilter } : undefined,
      include: { baby: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 8,
    });
  }

  async getHighRiskBabies(year?: string, month?: string, day?: string) {
    const dateFilter = this.getDateFilter(year, month, day);
    return this.prisma.baby.findMany({
      where: { deletedAt: null, riskFactors: { some: {} }, ...(dateFilter ? { createdAt: dateFilter } : {}) },
      include: {
        hospital: { select: { name: true } },
        riskFactors: { include: { riskCategory: { select: { label: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 8,
    }).then(babies => babies.map(b => ({
      id: b.id,
      firstName: b.firstName,
      lastName: b.lastName,
      hospital: b.hospital.name,
      reason: b.riskFactors[0]?.riskCategory.label || 'Unknown',
      riskLevel: b.riskFactors.length > 1 ? 'High' : 'Medium',
    })));
  }
  async getTodaysFollowUps(year?: string, month?: string, day?: string) {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    
    const includesToday = this.filterIncludesToday(year, month, day);
    if (!includesToday) return [];

    return this.prisma.followUp.findMany({
      where: {
        status: { in: ['scheduled', 'rescheduled'] },
        scheduledDate: { gte: startOfToday, lte: endOfToday },
      },
      include: {
        baby: {
          select: { firstName: true, lastName: true, hospital: { select: { name: true } } }
        }
      },
      orderBy: { scheduledDate: 'asc' },
    }).then(followUps => followUps.map(f => ({
      id: f.id,
      childId: f.babyId,
      firstName: f.baby.firstName,
      lastName: f.baby.lastName,
      hospital: f.baby.hospital.name,
      status: f.status,
      followUpType: f.followUpType,
    })));
  }

  async getUpcomingFollowUps(year?: string, month?: string, day?: string) {
    const dateFilter = this.getDateFilter(year, month, day);
    return this.prisma.followUp.findMany({
      where: { status: { in: ['scheduled', 'rescheduled'] }, ...(dateFilter ? { scheduledDate: dateFilter } : {}) },
      include: { baby: { select: { firstName: true, lastName: true } } },
      orderBy: { scheduledDate: 'asc' },
      take: 5,
    });
  }

  async getNotifications(year?: string, month?: string, day?: string) {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const [overdue, dueToday, highRiskUnscreened] = await Promise.all([
      this.prisma.followUp.findMany({
        where: { status: 'scheduled', scheduledDate: { lt: startOfToday } },
        include: { baby: { select: { firstName: true, lastName: true } } },
      }),
      this.prisma.followUp.findMany({
        where: { status: 'scheduled', scheduledDate: { gte: startOfToday, lte: endOfToday } },
        include: { baby: { select: { firstName: true, lastName: true } } },
      }),
      this.prisma.baby.findMany({
        where: {
          deletedAt: null,
          riskFactors: { some: {} },
          screenings: { none: { status: 'completed' } },
        },
        select: { id: true, firstName: true, lastName: true, mrNumber: true, createdAt: true },
      }),
    ]);

    const notifications = [
      ...overdue.map((f) => ({
        id: `n-fu-${f.id}`,
        title: 'Follow-up overdue',
        description: `Follow-up for ${f.baby.firstName} ${f.baby.lastName} was due on ${f.scheduledDate.toLocaleDateString()}`,
        date: f.scheduledDate,
        severity: 'high' as const,
      })),
      ...dueToday.map((f) => ({
        id: `n-fu-today-${f.id}`,
        title: 'Follow-up due today',
        description: `Follow-up for ${f.baby.firstName} ${f.baby.lastName} is scheduled for today`,
        date: f.scheduledDate,
        severity: 'medium' as const,
      })),
      ...highRiskUnscreened.map((b) => ({
        id: `n-risk-${b.id}`,
        title: 'High-risk baby awaiting screening',
        description: `${b.firstName} ${b.lastName} (${b.mrNumber ?? 'no MR number'}) has risk factors and no completed screening`,
        date: b.createdAt,
        severity: 'high' as const,
      })),
    ];

    return notifications
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  }

  async getAnalytics(year?: string, month?: string, day?: string) {
    const dateFilter = this.getDateFilter(year, month, day);
    const babies = await this.prisma.baby.findMany({ where: { deletedAt: null, ...(dateFilter ? { createdAt: dateFilter } : {}) },
      
      include: {
        district: { include: { state: true } },
        hospital: true,
        screenings: { where: { status: 'completed' } },
        followUps: true,
      },
    });

    const males = babies.filter((b) => b.gender?.toLowerCase() === 'male').length;
    const females = babies.filter((b) => b.gender?.toLowerCase() === 'female').length;
    const others = babies.length - males - females;

    const allScreenings = babies.flatMap((b) => b.screenings);
    const passes = allScreenings.filter((s) => s.overallResult === 'pass').length;
    const refers = allScreenings.filter((s) => s.overallResult === 'refer').length;
    const incompletes = allScreenings.length - passes - refers;

    let passAfterRefer = 0;

    let urban = 0;
    let rural = 0;

    // Analytics state variables — adaptive trend data
    const trendCounts = new Map<string, number>();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const parsedMonth = month ? parseInt(month, 10) : undefined;
    const parsedDay = day ? parseInt(day, 10) : undefined;
    const parsedYear = year ? parseInt(year, 10) : new Date().getFullYear();

    if (parsedMonth && parsedDay) {
      // Daily view → hourly buckets (0h–23h)
      const maxHour = (parsedYear === new Date().getFullYear() && parsedMonth === new Date().getMonth() + 1 && parsedDay === new Date().getDate()) ? new Date().getHours() : 23;
      for (let h = 0; h <= maxHour; h++) {
        trendCounts.set(`${h}:00`, 0);
      }
    } else if (parsedMonth) {
      // Monthly view → daily buckets
      const daysInMonth = new Date(parsedYear, parsedMonth, 0).getDate();
      const maxDay = (parsedYear === new Date().getFullYear() && parsedMonth === new Date().getMonth() + 1) ? new Date().getDate() : daysInMonth;
      for (let d = 1; d <= maxDay; d++) {
        trendCounts.set(`${d}`, 0);
      }
    } else {
      // Yearly view
      const maxMonthIdx = parsedYear === new Date().getFullYear() ? new Date().getMonth() : 11;
      for (let i = 0; i <= maxMonthIdx; i++) {
        trendCounts.set(months[i], 0);
      }
    }
    
    const ageGroups = {
      '0-7d': 0,
      '8-14d': 0,
      '15-21d': 0,
      '22-28d': 0,
      '>28d': 0,
    };
    let totalFollowUps = 0;
    let completedFollowUps = 0;
    let totalReferredBabies = 0;
    let referredBabiesWithCompletedFollowUp = 0;
    const yearMap = new Map<string, { name: string; screenings: number; refers: number }>();

    const districtMap = new Map<
      string,
      {
        name: string;
        state: string;
        hospitals: Set<string>;
        registered: number;
        screenings: number;
        refers: number;
        passes: number;
        pendingFollowUps: number;
      }
    >();
    const stateMap = new Map<
      string,
      {
        name: string;
        hospitals: Set<string>;
        registered: number;
        screenings: number;
        refers: number;
        passes: number;
        pendingFollowUps: number;
        males: number;
        females: number;
        others: number;
      }
    >();
    const parentStateMap = new Map<
      string,
      {
        name: string;
        hospitals: Set<string>;
        registered: number;
        screenings: number;
        refers: number;
        passes: number;
        pendingFollowUps: number;
        males: number;
        females: number;
        others: number;
      }
    >();
    // Grouped by parentDistrict (the district entered in Parent Information)
    // Key: "STATE||DISTRICT" to handle same district name in different states
    const parentDistrictMap = new Map<
      string,
      {
        name: string;
        state: string;
        registered: number;
        passes: number;
        refers: number;
      }
    >();
    const hospitalMap = new Map<string, { name: string; screenings: number; refers: number }>();

    for (const b of babies) {
      if (b.region === 'urban') urban++;
      else if (b.region === 'rural') rural++;

      const distName = b.district.name;
      const stateName = b.district.state.name;
      const rawParentState = (b.parentState ?? '').trim();
      const bScreenings = b.screenings.length;
      let bPasses = 0;
      let bRefers = 0;
      if (b.screenings.length > 0) {
        const latestScreening = [...b.screenings].sort((a, b) => (b.testedAt?.getTime() || 0) - (a.testedAt?.getTime() || 0))[0];
        if (latestScreening.overallResult === 'pass') bPasses = 1;
        else if (latestScreening.overallResult === 'refer') bRefers = 1;
      }
      const bPendingFollowUps = b.followUps.filter(f => f.status === 'scheduled' || f.status === 'rescheduled').length;

      const sortedScreenings = [...b.screenings].sort((a, b) => (a.testedAt?.getTime() || 0) - (b.testedAt?.getTime() || 0));
      let hadRefer = false;
      for (const s of sortedScreenings) {
        if (s.overallResult === 'refer') {
          hadRefer = true;
        } else if (s.overallResult === 'pass' && hadRefer) {
          passAfterRefer++;
          break;
        }
      }

      // Age calculation in days
      if (b.dob) {
        const diffTime = Math.abs(new Date().getTime() - new Date(b.dob).getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays <= 7) ageGroups['0-7d']++;
        else if (diffDays <= 14) ageGroups['8-14d']++;
        else if (diffDays <= 21) ageGroups['15-21d']++;
        else if (diffDays <= 28) ageGroups['22-28d']++;
        else ageGroups['>28d']++;
      }

      // Follow-up success
      for (const f of b.followUps) {
        totalFollowUps++;
        if (f.status === 'completed') completedFollowUps++;
      }

      // Referral conversion
      if (bRefers > 0) {
        totalReferredBabies++;
        if (b.followUps.some(f => f.status === 'completed')) {
          referredBabiesWithCompletedFollowUp++;
        }
      }

      // Adaptive trend and yearly screenings
      for (const s of b.screenings) {
        if (s.testedAt) {
          // Trend bucket based on view mode
          if (parsedMonth && parsedDay) {
            // Daily → hourly
            const key = `${s.testedAt.getHours()}:00`;
            if (trendCounts.has(key)) trendCounts.set(key, trendCounts.get(key)! + 1);
          } else if (parsedMonth) {
            // Monthly → daily
            const key = `${s.testedAt.getDate()}`;
            if (trendCounts.has(key)) trendCounts.set(key, trendCounts.get(key)! + 1);
          } else {
            // Yearly → monthly
            const monthKey = months[s.testedAt.getMonth()];
            if (trendCounts.has(monthKey)) trendCounts.set(monthKey, trendCounts.get(monthKey)! + 1);
          }

          const yr = s.testedAt.getFullYear().toString();
          if (!yearMap.has(yr)) {
            yearMap.set(yr, { name: yr, screenings: 0, refers: 0 });
          }
          const y = yearMap.get(yr)!;
          y.screenings++;
          if (s.overallResult === 'refer') {
            y.refers++;
          }
        }
      }

      if (!districtMap.has(distName)) {
        districtMap.set(distName, {
          name: distName,
          state: stateName,
          hospitals: new Set(),
          registered: 0,
          screenings: 0,
          refers: 0,
          passes: 0,
          pendingFollowUps: 0,
        });
      }
      const d = districtMap.get(distName)!;
      d.hospitals.add(b.hospitalId);
      d.registered += 1;
      d.screenings += bScreenings;
      d.refers += bRefers;
      d.passes += bPasses;
      d.pendingFollowUps += bPendingFollowUps;

      if (!stateMap.has(stateName)) {
        stateMap.set(stateName, {
          name: stateName,
          hospitals: new Set(),
          registered: 0,
          screenings: 0,
          refers: 0,
          passes: 0,
          pendingFollowUps: 0,
          males: 0,
          females: 0,
          others: 0,
        });
      }
      const s = stateMap.get(stateName)!;
      s.hospitals.add(b.hospitalId);
      s.registered += 1;
      s.screenings += bScreenings;
      s.refers += bRefers;
      s.passes += bPasses;
      s.pendingFollowUps += bPendingFollowUps;
      const gender = b.gender?.toLowerCase();
      if (gender === 'male') s.males += 1;
      else if (gender === 'female') s.females += 1;
      else s.others += 1;

      // Only group babies whose parentState was entered in the registration form
      if (rawParentState) {
        const parentStateName = normalizeStateName(rawParentState);
        if (!parentStateMap.has(parentStateName)) {
          parentStateMap.set(parentStateName, {
            name: parentStateName,
            hospitals: new Set(),
            registered: 0,
            screenings: 0,
            refers: 0,
            passes: 0,
            pendingFollowUps: 0,
            males: 0,
            females: 0,
            others: 0,
          });
        }
        const ps = parentStateMap.get(parentStateName)!;
        ps.hospitals.add(b.hospitalId);
        ps.registered += 1;
        ps.screenings += bScreenings;
        ps.refers += bRefers;
        ps.passes += bPasses;
        ps.pendingFollowUps += bPendingFollowUps;
        const gender = b.gender?.toLowerCase();
        if (gender === 'male') ps.males += 1;
        else if (gender === 'female') ps.females += 1;
        else ps.others += 1;

        // parentDistrict drill-down (within a parent state)
        const rawParentDistrict = (b.parentDistrict ?? '').trim();
        const distKey = `${parentStateName}||${rawParentDistrict || '_unknown_'}`;
        if (!parentDistrictMap.has(distKey)) {
          parentDistrictMap.set(distKey, {
            name: rawParentDistrict || 'Unknown District',
            state: parentStateName,
            registered: 0,
            passes: 0,
            refers: 0,
          });
        }
        const pd = parentDistrictMap.get(distKey)!;
        pd.registered += 1;
        pd.passes += bPasses;
        pd.refers += bRefers;
      }

      if (!hospitalMap.has(b.hospitalId)) {
        hospitalMap.set(b.hospitalId, {
          name: b.hospital.name.split(' ')[0],
          screenings: 0,
          refers: 0,
        });
      }
      const h = hospitalMap.get(b.hospitalId)!;
      h.screenings += bScreenings;
      h.refers += bRefers;
    }

    return {
      passVsRefer: [
        { name: 'PASS', value: passes },
        { name: 'REFER', value: refers },
        { name: 'PASS AFTER REFER', value: passAfterRefer },
        { name: 'INCOMPLETE', value: incompletes },
      ],
      genderDist: [
        { name: 'Male', value: males },
        { name: 'Female', value: females },
        { name: 'Other', value: others },
      ],
      urbanVsRural: [
        { name: 'Urban', value: urban },
        { name: 'Rural', value: rural },
      ],
      hospitalPerformance: Array.from(hospitalMap.values()),
      districtPerformance: Array.from(districtMap.values()).map((d) => ({
        name: d.name,
        state: d.state,
        hospitals: d.hospitals.size,
        registered: d.registered,
        screenings: d.screenings,
        refers: d.refers,
        referralRate: d.screenings ? Math.round((d.refers / d.screenings) * 100) + '%' : '0%',
        pendingFollowUps: d.pendingFollowUps,
      })),
      statePerformance: Array.from(stateMap.values()).map((s) => ({
        name: s.name,
        hospitals: s.hospitals.size,
        registered: s.registered,
        screenings: s.screenings,
        passes: s.passes,
        refers: s.refers,
        referralRate: s.screenings ? Math.round((s.refers / s.screenings) * 100) + '%' : '0%',
        pendingFollowUps: s.pendingFollowUps,
        males: s.males,
        females: s.females,
        others: s.others,
      })),
      // parentStatePerformance: grouped by the 'State' field in Parent Information
      // (normalised to match india-states.geojson names → feeds the dashboard map)
      parentStatePerformance: Array.from(parentStateMap.values()).map((ps) => ({
        name: ps.name,
        hospitals: ps.hospitals.size,
        registered: ps.registered,
        screenings: ps.screenings,
        passes: ps.passes,
        refers: ps.refers,
        referralRate: ps.screenings ? Math.round((ps.refers / ps.screenings) * 100) + '%' : '0%',
        pendingFollowUps: ps.pendingFollowUps,
        males: ps.males,
        females: ps.females,
        others: ps.others,
      })),
      // parentDistrictPerformance: district drill-down based on parentDistrict field
      // Columns: district name, total registrations, BOA pass count, BOA fail count
      parentDistrictPerformance: Array.from(parentDistrictMap.values()).map((pd) => ({
        name: pd.name,
        state: pd.state,
        registered: pd.registered,
        passes: pd.passes,
        refers: pd.refers,
      })),
      monthlyData: Array.from(trendCounts.entries()).map(([name, value]) => ({ name, value })),
      yearlyPerformance: Array.from(yearMap.values()).sort((a, b) => a.name.localeCompare(b.name)),
      ageData: Object.entries(ageGroups).map(([name, value]) => ({ name, value })),
      followUpSuccessRate: totalFollowUps ? Number(((completedFollowUps / totalFollowUps) * 100).toFixed(1)) : 0,
      referralConversionRate: totalReferredBabies ? Number(((referredBabiesWithCompletedFollowUp / totalReferredBabies) * 100).toFixed(1)) : 0,
    };
  }

  /**
   * Staff (audiologist) dashboard — returns KPIs scoped to a single hospital.
   */
  async getStaffOverview(hospitalId: string) {
    const today = new Date();
    const startOfToday = new Date(today);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);

    const [
      todaysScreenings,
      rescreeningRequired,
      todaysFollowUps,
      recentChildren,
    ] = await Promise.all([
      // 1. Today's Screenings
      this.prisma.screening.count({
        where: {
          status: 'completed',
          testedAt: { gte: startOfToday, lte: endOfToday },
          baby: { hospitalId },
        },
      }),
      // 2. Reappearing for Screening (completed rescreenings today)
      this.prisma.screening.count({
        where: {
          status: 'completed',
          type: 'rescreening',
          testedAt: { gte: startOfToday, lte: endOfToday },
          baby: { hospitalId },
        },
      }),
      // 3. Today's Follow-ups
      this.prisma.followUp.count({
        where: {
          status: { in: ['scheduled', 'rescheduled'] },
          scheduledDate: { gte: startOfToday, lte: endOfToday },
          baby: { hospitalId },
        },
      }),
      // Last 10 registered children at this hospital (for quick list)
      this.prisma.baby.findMany({
        where: { deletedAt: null, hospitalId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          mrNumber: true,
          createdAt: true,
          screenings: {
            orderBy: { testedAt: 'desc' },
            take: 1,
            select: { status: true, overallResult: true },
          },
        },
      }),
    ]);

    return {
      todaysScreenings,
      rescreeningRequired,
      todaysFollowUps,
      recentChildren: recentChildren.map((b) => ({
        id: b.id,
        firstName: b.firstName,
        lastName: b.lastName,
        mrNumber: b.mrNumber,
        registeredAt: b.createdAt,
        lastScreeningStatus: b.screenings[0]?.status ?? null,
        lastScreeningResult: b.screenings[0]?.overallResult ?? null,
      })),
    };
  }
}
