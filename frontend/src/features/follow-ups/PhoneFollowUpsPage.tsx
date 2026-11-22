/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { followUpsService, type PhoneSurveillanceItem, type LogPhoneCallPayload } from '../../services/api/followUpsService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/shared/EmptyState';
import { toast } from 'sonner';
import {
  PhoneCall,
  Phone,
  AlertCircle,
  CheckCircle2,
  Clock,
  Search,
  Download,
  Baby,
  MessageCircle,
  FileText,
  Activity,
  X,
  ShieldAlert,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PhoneFollowUpsPage() {
  const [activeTab, setActiveTab] = useState<'due' | 'upcoming' | 'completed' | 'all'>('due');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<PhoneSurveillanceItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state for logging phone call
  const [callStatus, setCallStatus] = useState<'completed' | 'rescheduled' | 'missed'>('completed');
  const [outcomeReason, setOutcomeReason] = useState<string>('Normal auditory & speech development milestones');
  const [callNotes, setCallNotes] = useState('');
  const [callDate, setCallDate] = useState(() => new Date().toISOString().split('T')[0]);

  const queryClient = useQueryClient();

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ['phoneSurveillance'],
    queryFn: () => followUpsService.getPhoneSurveillance(),
  });

  const logCallMutation = useMutation({
    mutationFn: (payload: LogPhoneCallPayload) => followUpsService.logPhoneCall(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phoneSurveillance'] });
      queryClient.invalidateQueries({ queryKey: ['followUps'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
      toast.success('Phone follow-up logged successfully.');
      setDialogOpen(false);
      setSelectedPatient(null);
    },
    onError: (err: any) => {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Failed to log phone follow-up.');
    },
  });

  const openLogDialog = (p: PhoneSurveillanceItem) => {
    setSelectedPatient(p);
    setCallStatus(p.status === 'completed' ? 'completed' : 'completed');
    setOutcomeReason('Normal auditory & speech development milestones');
    setCallNotes(p.callNotes || '');
    setCallDate(p.callDate ? p.callDate.split('T')[0] : new Date().toISOString().split('T')[0]);
    setDialogOpen(true);
  };

  const handleSaveCall = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;

    const fullNotes = [
      outcomeReason ? `[Outcome: ${outcomeReason}]` : '',
      callNotes.trim(),
    ].filter(Boolean).join('\n');

    logCallMutation.mutate({
      babyId: selectedPatient.id,
      status: callStatus,
      notes: fullNotes,
      callDate: callDate ? new Date(`${callDate}T00:00:00`).toISOString() : undefined,
    });
  };

  const downloadCSV = () => {
    if (!patients.length) {
      toast.error('No data available to export.');
      return;
    }

    const headers = [
      'Category Status',
      'Child Name',
      'MR Records No',
      'POCD No',
      'Date of Birth',
      "Mother's Name",
      'Primary Phone',
      'WhatsApp Number',
      'Hospital',
      'District',
      'High Risk Factors',
      'Screening Pass Date',
      '6-Month Due Date',
      'Call Status',
      'Call Notes',
    ];

    const rows = filteredPatients.map((p) => [
      p.status.toUpperCase(),
      `"${p.firstName} ${p.lastName}"`.trim(),
      `"${p.mrNumber || '-'}"`,
      `"${p.pocdNumber || '-'}"`,
      p.dob ? new Date(p.dob).toLocaleDateString('en-IN') : '-',
      `"${p.motherName || '-'}"`,
      `"\t${p.contactNumber || p.phone2 || '-'}"`,
      `"\t${p.whatsappNumber || '-'}"`,
      `"${p.hospitalName || '-'}"`,
      `"${p.district || '-'}"`,
      `"${(p.riskFactors || []).join('; ')}"`,
      p.screeningPassDate ? new Date(p.screeningPassDate).toLocaleDateString('en-IN') : '-',
      p.dueDate ? new Date(p.dueDate).toLocaleDateString('en-IN') : '-',
      p.callStatus || (p.isDue ? 'DUE' : 'SCHEDULED'),
      `"${(p.callNotes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF', csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `phone_follow_ups_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const duePatients = patients.filter((p) => p.status === 'due');
  const upcomingPatients = patients.filter((p) => p.status === 'upcoming');
  const completedPatients = patients.filter((p) => p.status === 'completed');

  const filteredPatients = patients.filter((p) => {
    if (activeTab === 'due' && p.status !== 'due') return false;
    if (activeTab === 'upcoming' && p.status !== 'upcoming') return false;
    if (activeTab === 'completed' && p.status !== 'completed') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = `${p.firstName} ${p.lastName}`.toLowerCase().includes(q);
      const matchMother = (p.motherName || '').toLowerCase().includes(q);
      const matchMr = (p.mrNumber || '').toLowerCase().includes(q);
      const matchPocd = (p.pocdNumber || '').toLowerCase().includes(q);
      const matchPhone = (p.contactNumber || '').includes(q) || (p.whatsappNumber || '').includes(q);
      const matchHospital = (p.hospitalName || '').toLowerCase().includes(q);
      return matchName || matchMother || matchMr || matchPocd || matchPhone || matchHospital;
    }

    return true;
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <h1 className="text-3xl font-bold tracking-tight">Phone Follow-ups</h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">
              <PhoneCall className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Phone Follow-ups</h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Surveillance registry for infants with <strong>High-Risk Register (HRR)</strong> factors who passed initial screening — scheduled for 6-month auditory milestone check.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={downloadCSV} className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Due Now Card */}
        <div
          onClick={() => setActiveTab('due')}
          className={`cursor-pointer rounded-2xl p-5 border transition-all duration-200 ${
            activeTab === 'due'
              ? 'ring-2 ring-red-500 shadow-md bg-red-50/70 border-red-200 dark:bg-red-950/30 dark:border-red-800'
              : 'bg-card border-border hover:border-red-300 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-red-700 dark:text-red-400 flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 text-red-600 animate-pulse" />
              Due to be Contacted
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300">
              ≥ 6 Months
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-red-900 dark:text-red-100">
              {duePatients.length}
            </span>
            <span className="text-xs text-muted-foreground">patients due now</span>
          </div>
          <p className="text-xs text-red-600/90 dark:text-red-400/90 mt-2 font-medium">
            Requires doctors to call parents
          </p>
        </div>

        {/* Upcoming Card */}
        <div
          onClick={() => setActiveTab('upcoming')}
          className={`cursor-pointer rounded-2xl p-5 border transition-all duration-200 ${
            activeTab === 'upcoming'
              ? 'ring-2 ring-blue-500 shadow-md bg-blue-50/70 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800'
              : 'bg-card border-border hover:border-blue-300 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-blue-600" />
              Upcoming Calls
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
              &lt; 6 Months
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-blue-900 dark:text-blue-100">
              {upcomingPatients.length}
            </span>
            <span className="text-xs text-muted-foreground">in surveillance</span>
          </div>
          <p className="text-xs text-blue-600/90 dark:text-blue-400/90 mt-2 font-medium">
            Awaiting 6-month surveillance milestone
          </p>
        </div>

        {/* Completed Card */}
        <div
          onClick={() => setActiveTab('completed')}
          className={`cursor-pointer rounded-2xl p-5 border transition-all duration-200 ${
            activeTab === 'completed'
              ? 'ring-2 ring-emerald-500 shadow-md bg-emerald-50/70 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800'
              : 'bg-card border-border hover:border-emerald-300 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Contacted & Reviewed
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-900 dark:text-emerald-100">
              {completedPatients.length}
            </span>
            <span className="text-xs text-muted-foreground">calls completed</span>
          </div>
          <p className="text-xs text-emerald-600/90 dark:text-emerald-400/90 mt-2 font-medium">
            Doctor telephone reviews logged
          </p>
        </div>

        {/* Total Registry Card */}
        <div
          onClick={() => setActiveTab('all')}
          className={`cursor-pointer rounded-2xl p-5 border transition-all duration-200 ${
            activeTab === 'all'
              ? 'ring-2 ring-violet-500 shadow-md bg-violet-50/70 border-violet-200 dark:bg-violet-950/30 dark:border-violet-800'
              : 'bg-card border-border hover:border-violet-300 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-violet-700 dark:text-violet-400 flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-violet-600" />
              Total HRR Pass Registry
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-violet-900 dark:text-violet-100">
              {patients.length}
            </span>
            <span className="text-xs text-muted-foreground">total patients</span>
          </div>
          <p className="text-xs text-violet-600/90 dark:text-violet-400/90 mt-2 font-medium">
            Passed screening with high risk
          </p>
        </div>
      </div>

      {/* Tabs and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-3">
        {/* Navigation Tabs */}
        <nav className="flex space-x-2 sm:space-x-4 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveTab('due')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
              activeTab === 'due'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <AlertCircle className="h-4 w-4" />
            Due for Contact
            {duePatients.length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                activeTab === 'due' ? 'bg-white text-red-700' : 'bg-red-100 text-red-700'
              }`}>
                {duePatients.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('upcoming')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
              activeTab === 'upcoming'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Clock className="h-4 w-4" />
            Upcoming (&lt; 6 Months)
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              activeTab === 'upcoming' ? 'bg-white text-blue-700' : 'bg-muted text-foreground'
            }`}>
              {upcomingPatients.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('completed')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
              activeTab === 'completed'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <CheckCircle2 className="h-4 w-4" />
            Contacted ({completedPatients.length})
          </button>

          <button
            onClick={() => setActiveTab('all')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
              activeTab === 'all'
                ? 'bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900 shadow-sm'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            All ({patients.length})
          </button>
        </nav>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search patient, mother, phone, POCD..."
            className="pl-9 h-9 text-xs sm:text-sm"
          />
        </div>
      </div>

      {/* Patient Table / List */}
      <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
        {filteredPatients.length === 0 ? (
          <EmptyState
            title={
              activeTab === 'due'
                ? 'No patients currently due for 6-month phone contact'
                : activeTab === 'upcoming'
                ? 'No upcoming phone surveillance patients found'
                : activeTab === 'completed'
                ? 'No phone follow-up calls logged yet'
                : 'No patients found'
            }
            description={
              activeTab === 'due'
                ? 'Great job! All high-risk infants under 6-month telephone surveillance are either contacted or still within the 6-month window.'
                : 'Patients with High-Risk Register (HRR) factors who pass their screening will appear here automatically.'
            }
          />
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-muted/60 text-muted-foreground border-b font-semibold tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Status & Due Date</th>
                  <th className="px-5 py-3.5">Patient Details</th>
                  <th className="px-5 py-3.5">Mother & Contact</th>
                  <th className="px-5 py-3.5">HRR Risk Factors</th>
                  <th className="px-5 py-3.5">Screening Pass</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredPatients.map((p) => {
                  const passDateFormatted = p.screeningPassDate
                    ? new Date(p.screeningPassDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '—';
                  const dueDateObj = new Date(p.dueDate);
                  const dueDateFormatted = p.dueDate
                    ? dueDateObj.toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '—';

                  return (
                    <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                      {/* Status & Due Date */}
                      <td className="px-5 py-4 align-top">
                        {p.status === 'completed' ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Contacted
                            </span>
                            {p.callDate && (
                              <p className="text-[11px] text-muted-foreground">
                                on {new Date(p.callDate).toLocaleDateString('en-IN')}
                              </p>
                            )}
                          </div>
                        ) : p.status === 'due' ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 animate-pulse">
                              <AlertCircle className="h-3.5 w-3.5" />
                              DUE NOW
                            </span>
                            <p className="text-xs font-bold text-red-600 dark:text-red-400">
                              📅 {dueDateFormatted}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              (6 months elapsed)
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                              <Clock className="h-3.5 w-3.5" />
                              Upcoming
                            </span>
                            <p className="text-xs font-semibold text-foreground">
                              📅 {dueDateFormatted}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              in {Math.max(1, Math.round(p.daysUntilDue / 30))} month(s)
                            </p>
                          </div>
                        )}
                      </td>

                      {/* Patient Details */}
                      <td className="px-5 py-4 align-top">
                        <div className="space-y-1">
                          <Link
                            to={`/children/${p.id}`}
                            className="font-bold text-foreground hover:text-primary transition-colors flex items-center gap-1 text-sm"
                          >
                            <Baby className="h-4 w-4 text-violet-600 shrink-0" />
                            {p.firstName || p.lastName
                              ? `${p.firstName} ${p.lastName}`.trim()
                              : 'Unnamed Child'}
                          </Link>
                          <div className="text-xs text-muted-foreground space-y-0.5">
                            {p.pocdNumber && (
                              <p>
                                <span className="font-semibold text-foreground/80">POCD:</span>{' '}
                                <span className="font-mono">{p.pocdNumber}</span>
                              </p>
                            )}
                            {p.mrNumber && (
                              <p>
                                <span className="font-semibold text-foreground/80">MR No:</span>{' '}
                                <span className="font-mono">{p.mrNumber}</span>
                              </p>
                            )}
                            {p.dob && (
                              <p>
                                DOB: {new Date(p.dob).toLocaleDateString('en-IN')} (
                                {p.gender})
                              </p>
                            )}
                            <p className="text-[11px] text-muted-foreground/80">
                              {p.hospitalName} {p.district ? `• ${p.district}` : ''}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Mother & Contact */}
                      <td className="px-5 py-4 align-top">
                        <div className="space-y-1.5 text-xs">
                          <p className="font-semibold text-foreground">
                            Mother: {p.motherName || '—'}
                          </p>
                          {p.contactNumber && (
                            <div className="flex items-center gap-2">
                              <a
                                href={`tel:${p.contactNumber}`}
                                className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-muted hover:bg-violet-100 dark:hover:bg-violet-950/50 text-foreground hover:text-violet-700 font-mono text-xs transition-colors"
                                title="Click to Call"
                              >
                                <Phone className="h-3 w-3 text-violet-600" />
                                {p.contactNumber}
                              </a>
                            </div>
                          )}
                          {p.whatsappNumber && (
                            <div>
                              <a
                                href={`https://wa.me/91${p.whatsappNumber.replace(/\D/g, '')}?text=Hello%2C%20this%20is%20from%20AIISH%20Newborn%20Hearing%20Screening%20Team%20following%20up%20on%20your%20baby's%20hearing%20milestones.`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                              >
                                <MessageCircle className="h-3 w-3" />
                                WhatsApp
                              </a>
                            </div>
                          )}
                          {!p.contactNumber && !p.whatsappNumber && (
                            <span className="text-muted-foreground italic">No phone recorded</span>
                          )}
                        </div>
                      </td>

                      {/* HRR Risk Factors */}
                      <td className="px-5 py-4 align-top max-w-xs">
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-300">
                            <ShieldAlert className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                            HRR Indicators:
                          </span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {p.riskFactors && p.riskFactors.length > 0 ? (
                              p.riskFactors.map((rf, idx) => (
                                <span
                                  key={idx}
                                  className="text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
                                >
                                  {rf}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground">High Risk Register recorded</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Screening Pass Details */}
                      <td className="px-5 py-4 align-top">
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300">
                            <CheckCircle2 className="h-3 w-3" />
                            Passed All Tests
                          </span>
                          <p className="text-xs text-muted-foreground">
                            Screened: {passDateFormatted}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            6-Month Target: {dueDateFormatted}
                          </p>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 align-top text-right">
                        <div className="flex flex-col items-end gap-1.5">
                          <Button
                            size="sm"
                            variant={p.status === 'due' ? 'default' : 'outline'}
                            onClick={() => openLogDialog(p)}
                            className={`gap-1.5 text-xs ${
                              p.status === 'due'
                                ? 'bg-red-600 hover:bg-red-700 text-white shadow-sm'
                                : ''
                            }`}
                          >
                            <PhoneCall className="h-3.5 w-3.5" />
                            {p.status === 'completed' ? 'Update Call Notes' : 'Log Doctor Call'}
                          </Button>
                          {p.callNotes && (
                            <p
                              className="text-[11px] text-muted-foreground line-clamp-2 max-w-[180px] text-right italic"
                              title={p.callNotes}
                            >
                              &ldquo;{p.callNotes}&rdquo;
                            </p>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Log Phone Call Dialog */}
      {dialogOpen && selectedPatient && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b flex items-center justify-between bg-muted/40">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                  <PhoneCall className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Log 6-Month Phone Follow-up Call
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Doctor telephone consultation & auditory milestones review
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                className="text-muted-foreground hover:text-foreground rounded-lg p-1 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveCall} className="p-6 space-y-4 overflow-y-auto">
              {/* Patient Banner */}
              <div className="p-3 rounded-xl bg-violet-50/70 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-violet-950 dark:text-violet-100">
                    👶 {selectedPatient.firstName} {selectedPatient.lastName}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-violet-200 text-violet-800 dark:bg-violet-900/60 dark:text-violet-200">
                    POCD: {selectedPatient.pocdNumber || selectedPatient.mrNumber}
                  </span>
                </div>
                <p className="text-xs text-violet-800 dark:text-violet-300">
                  Mother: <strong>{selectedPatient.motherName}</strong> • Phone:{' '}
                  <strong>{selectedPatient.contactNumber || '—'}</strong>
                </p>
                {selectedPatient.riskFactors && selectedPatient.riskFactors.length > 0 && (
                  <div className="pt-1">
                    <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 block">
                      High-Risk Indicators:
                    </span>
                    <p className="text-xs text-amber-800 dark:text-amber-200">
                      {selectedPatient.riskFactors.join(', ')}
                    </p>
                  </div>
                )}
              </div>

              {/* Call Status / Outcome Selection */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-foreground block mb-1.5">
                  Call Outcome *
                </label>
                <select
                  value={callStatus}
                  onChange={(e) => setCallStatus(e.target.value as any)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="completed">Call Answered & Completed</option>
                  <option value="rescheduled">Could Not Reach / Reschedule Call</option>
                  <option value="missed">Wrong Number / Inactive / Unreachable</option>
                </select>
              </div>

              {/* Standard Auditory Milestones Checklist / Preset */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-foreground block mb-1.5">
                  Clinical Assessment / Milestone Finding
                </label>
                <select
                  value={outcomeReason}
                  onChange={(e) => setOutcomeReason(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="Normal auditory & speech development milestones">
                    ✅ Normal auditory milestones (turns to sound, babbles, responds to voice)
                  </option>
                  <option value="Hearing concern suspected by parent — Advised clinical visit">
                    ⚠️ Parent reports reduced responsiveness to sound — Advised visit
                  </option>
                  <option value="Delayed speech/language development observed">
                    ⚠️ Speech/language delay observed — Referred for clinical evaluation
                  </option>
                  <option value="Switched off / Not reachable — Will retry next week">
                    📞 Switched off / Ringing no answer — Will retry next week
                  </option>
                  <option value="Parent requested callback at another time">
                    ⏰ Parent busy / Requested callback at later time
                  </option>
                  <option value="Other observation (see clinical notes below)">
                    📝 Other observation (specified in notes below)
                  </option>
                </select>
              </div>

              {/* Call Date */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-foreground block mb-1.5">
                  Date of Contact
                </label>
                <Input
                  type="date"
                  value={callDate}
                  onChange={(e) => setCallDate(e.target.value)}
                  className="h-10 text-sm"
                  required
                />
              </div>

              {/* Doctor's Notes */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-foreground block mb-1.5">
                  Doctor&apos;s Notes & Recommendations
                </label>
                <textarea
                  value={callNotes}
                  onChange={(e) => setCallNotes(e.target.value)}
                  rows={3}
                  placeholder="Enter notes on child's responsiveness to sounds, vocalization, parent feedback, or recommendations given..."
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={logCallMutation.isPending}
                  className="gap-1.5"
                >
                  <FileText className="h-4 w-4" />
                  {logCallMutation.isPending ? 'Saving...' : 'Save Follow-up'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
