import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  BookOpen, 
  AlertCircle, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  Info,
  Link as LinkIcon,
  MapPin,
  User as UserIcon,
  Search,
  Sparkles,
  Send
} from 'lucide-react';
import { Modal } from '@/components/Modal';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  isAfter,
  startOfToday
} from 'date-fns';
import { normalizeEventType } from '@/lib/eventTypes';
import { getPermissions } from '@/lib/permissions';
import { doc, deleteDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';
import { ConfirmModal } from '@/components/ConfirmModal';
import { Edit2, Trash2 } from 'lucide-react';
import { getLocalDateString, formatReadableDate } from '@/lib/date';
import { parseLocalDateTime, getCountdownText, isUpcomingDateTime } from '@/lib/countdown';

interface CalendarEvent {
  id: string;
  title: string;
  type: string;
  subject: string;
  chapter: string;
  date: string;
  time: string;
  room: string;
  teacher: string;
  materialTitle: string;
  materialLink: string;
  note: string;
  createdBy: string;
  createdAt: any;
}

interface Assessment {
  id: string;
  title: string;
  subject: string;
  chapter: string;
  type: string;
  date: string;
  time: string;
  room: string;
  teacher: string;
  materialTitle: string;
  materialLink: string;
  note: string;
  createdBy: string;
  createdByUid: string;
  createdAt: any;
  updatedAt: any;
}

export default function Dashboard() {
  const { profile, user, settings } = useAuth();
  const { canManageShared, isApproved } = getPermissions(profile);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [fundBalance, setFundBalance] = useState(0);
  const [weekIncome, setWeekIncome] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // AI Input states
  const [aiInput, setAiInput] = useState('');
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Countdown timer state
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isApproved) return;

    const errorHandler = (collectionName: string) => (error: any) => {
      console.error("SNAPSHOT ERROR", {
        path: collectionName,
        code: error.code,
        message: error.message,
        uid: user?.uid,
        role: profile?.role,
        status: profile?.status
      });
      setLoading(false);
    };

    const unsubEvents = onSnapshot(query(collection(db, 'globalCalendarEvents'), orderBy('date', 'asc')), 
      (snapshot) => {
        setEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CalendarEvent)));
      },
      errorHandler('globalCalendarEvents')
    );

    const unsubAssessments = onSnapshot(query(collection(db, 'assessments'), orderBy('date', 'asc')), 
      (snapshot) => {
        setAssessments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Assessment)));
      },
      errorHandler('assessments')
    );

    const unsubNotices = onSnapshot(query(collection(db, 'notices'), orderBy('createdAt', 'desc')), 
      (s) => {
        setNotices(s.docs.map(d => ({ id: d.id, ...d.data() })));
      },
      errorHandler('notices')
    );

    const unsubFund = onSnapshot(collection(db, 'classFund'), 
      (s) => {
        let balance = 0;
        let weekly = 0;
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        s.docs.forEach(doc => {
          const data = doc.data();
          const amount = data.amount || 0;
          if (data.type === 'income') balance += amount;
          else balance -= amount;

          const dateStr = data.date;
          if (dateStr) {
            const date = new Date(dateStr);
            if (date >= weekAgo && data.type === 'income') weekly += amount;
          }
        });
        setFundBalance(balance);
        setWeekIncome(weekly);
        setLoading(false);
      },
      errorHandler('classFund')
    );

    return () => {
      unsubEvents();
      unsubAssessments();
      unsubNotices();
      unsubFund();
    };
  }, [isApproved]);

  const todayStr = getLocalDateString(new Date());
  
  // Upcoming classes from globalCalendarEvents
  const upcomingClasses = events
    .filter(e => normalizeEventType(e.type) === 'class' && e.date >= todayStr)
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return (a.time || '').localeCompare(b.time || '');
    });

  const todayClasses = upcomingClasses.filter(c => c.date === todayStr);

  // Upcoming CTs from assessments
  const upcomingCTs = assessments
    .filter(a => a.type === 'ct' && isUpcomingDateTime(a.date, a.time))
    .slice(0, 3);

  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const getDayEvents = (day: Date) => {
    const dStr = getLocalDateString(day);
    const dayEvents = events.filter(e => e.date === dStr);
    const dayAssessments = assessments.filter(a => a.date === dStr);
    return [...dayEvents, ...dayAssessments];
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleAssessmentClick = (a: Assessment) => {
    setSelectedAssessment(a);
    setIsAssessmentModalOpen(true);
  };

  const handleAISubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim() || isProcessingAI) return;
    
    setIsProcessingAI(true);
    setAiError(null);
    
    try {
      // AI logic would go here
      setAiInput('');
    } catch (err: any) {
      setAiError(err.message || 'Failed to process command');
    } finally {
      setIsProcessingAI(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Quick Overview Stats */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="glass p-5">
            <div className="text-[12px] text-white/40 uppercase font-bold mb-3 tracking-wider flex items-center justify-between">
              Batch Fund Balance
              {settings?.fundGoalAmount && (
                <span className="text-[9px] bg-purple-500/10 text-purple-400 px-1.5 py-0.5 rounded border border-purple-500/20">
                  Target: {Math.min(100, Math.round((fundBalance / settings.fundGoalAmount) * 100))}%
                </span>
              )}
            </div>
            <div className="text-2xl font-bold text-white leading-none">৳ {fundBalance.toLocaleString()}</div>
            <div className="text-[12px] text-emerald-400 mt-2 font-medium">
              {settings?.fundGoalAmount && fundBalance < settings.fundGoalAmount 
                ? `৳ ${(settings.fundGoalAmount - fundBalance).toLocaleString()} more needed for ${settings.fundGoalTitle || 'Goal'}`
                : `+ ৳ ${weekIncome.toLocaleString()} this week`
              }
            </div>
          </div>

        <div className="glass p-5">
          <div className="text-[12px] text-white/40 uppercase font-bold mb-3 tracking-wider">Upcoming CTs</div>
          <div className="text-2xl font-bold text-white leading-none">
            {upcomingCTs.length} <span className="text-[14px] text-white/40 font-medium">Scheduled</span>
          </div>
          <div className="text-[12px] text-amber-400 mt-2 font-medium uppercase tracking-tight">
            {upcomingCTs.length > 0 ? `Next: ${upcomingCTs[0].subject}` : 'Relax, No CTs'}
          </div>
        </div>

        <div className="glass p-5">
          <div className="text-[12px] text-white/40 uppercase font-bold mb-3 tracking-wider">Classes Today</div>
          <div className="text-2xl font-bold text-white leading-none">
            {todayClasses.length} <span className="text-[14px] text-white/40 font-medium">Periods</span>
          </div>
          <div className="text-[12px] text-purple-400 mt-2 font-medium uppercase tracking-tight">
            {todayClasses.length > 0 ? `First: ${todayClasses[0].time}` : 'No classes today'}
          </div>
        </div>
      </section>

      {/* Main Grid Content */}
      <section className="grid grid-cols-1 lg:grid-cols-[1.8fr_1fr] gap-6 min-h-0">
        <div className="flex flex-col gap-6">
          {/* Upcoming Schedule (Global Classes) */}
          <div className="glass p-6 flex flex-col min-h-[400px]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white uppercase tracking-tighter">Class Schedule</h3>
              <div className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em]">Next 7 Days</div>
            </div>
            
            <div className="flex-1 space-y-4 overflow-y-auto scrollbar-hide pr-1">
              {upcomingClasses.length > 0 ? (
                // Group by date
                Object.entries(
                  upcomingClasses.reduce((acc: any, curr) => {
                    if (!acc[curr.date]) acc[curr.date] = [];
                    acc[curr.date].push(curr);
                    return acc;
                  }, {})
                ).map(([date, dayEvents]: [string, any]) => (
                  <div key={date} className="space-y-2">
                    <div className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] px-2">
                      {date === todayStr ? 'Today' : formatReadableDate(date)}
                    </div>
                    {dayEvents.map((item: any) => (
                      <div 
                        key={item.id}
                        onClick={() => handleEventClick(item)}
                        className="flex items-center justify-between p-4 bg-white/[0.03] rounded-xl border border-white/5 hover:border-white/10 transition-all cursor-pointer group"
                      >
                        <div className="flex gap-4">
                          <div className={`w-1 rounded-full ${date === todayStr ? 'accent-gradient' : 'bg-white/10'}`} />
                          <div>
                            <div className="font-bold text-white group-hover:text-purple-300 transition-colors uppercase tracking-tight">
                              {item.subject || item.title}
                            </div>
                            <div className="text-[12px] text-white/50 mt-0.5">
                              {item.room || 'TBA'} • {item.teacher || 'TBA'}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-black text-sm text-white">{item.time}</div>
                          {item.note && <div className="text-[9px] text-purple-400/60 font-bold uppercase truncate max-w-[80px]">{item.note}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-white/20">
                  <CalendarIcon size={48} strokeWidth={1} className="mb-4" />
                  <p className="text-sm font-bold uppercase tracking-widest">No upcoming classes</p>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming CTs with Countdowns */}
          <div className="glass p-6 flex flex-col">
            <h3 className="text-lg font-bold text-white mb-6 uppercase tracking-tighter">Upcoming Class Tests</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingCTs.length > 0 ? (
                upcomingCTs.map((ct) => {
                  const targetDate = parseLocalDateTime(ct.date, ct.time);
                  const countdown = getCountdownText(targetDate);
                  
                  return (
                    <div 
                      key={ct.id}
                      onClick={() => handleAssessmentClick(ct)}
                      className="glass bg-white/[0.02] p-5 rounded-2xl border-white/5 hover:border-red-500/30 transition-all cursor-pointer group relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 p-3">
                        <AlertCircle size={16} className="text-red-500/40 group-hover:text-red-500 transition-colors" />
                      </div>
                      <h4 className="text-sm font-black text-white/60 mb-1 uppercase tracking-widest">{ct.subject}</h4>
                      <h3 className="text-xl font-bold text-white mb-4 tracking-tight group-hover:text-red-400 transition-colors uppercase truncate">{ct.chapter}</h3>
                      
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-white/40">
                          <Clock size={14} className="text-red-400" />
                          <span>{countdown}</span>
                        </div>
                        <div className="flex items-center justify-between mt-2 pt-3 border-t border-white/5">
                           <div className="flex items-center gap-2">
                             <MapPin size={12} className="text-white/20" />
                             <span className="text-[10px] font-bold text-white/30 uppercase">{ct.room || 'TBA'}</span>
                           </div>
                           {ct.materialLink && (
                             <button className="text-[10px] font-black text-purple-400 uppercase tracking-widest flex items-center gap-1">
                               <LinkIcon size={10} /> Materials
                             </button>
                           )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full py-12 glass flex flex-col items-center justify-center text-white/20 border-dashed">
                  <BookOpen size={32} className="mb-4" />
                  <p className="text-xs font-bold uppercase tracking-[0.2em]">All tests cleared</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* AI & Notices Side */}
        <div className="flex flex-col gap-6">
          <div className="glass p-6 flex flex-col min-h-[350px]">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles size={18} className="text-purple-400" />
              <div className="text-[12px] text-white/40 uppercase font-bold tracking-wider">AI Assistant</div>
            </div>
            
            <div className="flex-1 flex flex-col">
              <div className="bg-black/20 rounded-2xl p-4 text-[13px] leading-relaxed text-white/80 mb-4 italic border border-white/5 shadow-inner">
                "Ajke 11:30 e Quantum class routine e add koro"
              </div>
              <p className="text-[12px] text-white/40 italic mb-6">
                Try asking for study plans, adding tasks, or managing your routine via mixed commands...
              </p>
              
              <form onSubmit={handleAISubmit} className="mt-auto space-y-3">
                {aiError && <p className="text-[10px] text-red-400 font-bold uppercase ml-2">{aiError}</p>}
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Type a command..." 
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    disabled={isProcessingAI}
                    className="flex-1 h-12 glass-input bg-white/[0.03] px-6 text-sm text-white placeholder:text-white/20 focus:border-purple-500/30 transition-all rounded-xl"
                  />
                  <button 
                    type="submit"
                    disabled={isProcessingAI || !aiInput.trim()}
                    className="w-12 h-12 accent-gradient rounded-xl flex items-center justify-center text-white cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-lg shadow-purple-600/20 disabled:opacity-50 disabled:grayscale disabled:hover:scale-100"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="glass p-6 min-h-[160px] relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-600/10 rounded-full blur-3xl"></div>
            <div className="text-[12px] text-white/40 uppercase font-bold mb-4 tracking-wider flex items-center gap-2">
              <Info size={14} className="text-purple-400" /> Global Notice
            </div>
            {notices.length > 0 ? (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="text-lg font-bold text-white mb-2 leading-tight">
                  {notices[0].title}
                </div>
                <div className="text-sm text-white/50 leading-relaxed italic border-l-2 border-purple-500/30 pl-4 py-1">
                  {notices[0].content}
                </div>
              </div>
            ) : (
              <div className="text-[14px] font-semibold text-white/20 italic">
                No active announcements
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Calendar Grid */}
      <section className="glass p-6">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <CalendarIcon size={22} className="text-purple-400" />
            <span className="uppercase tracking-tighter">Physics 23 Calendar</span>
          </h2>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSelectedDate(subMonths(selectedDate, 1))}
              className="p-2.5 rounded-xl hover:bg-white/5 text-white/40 hover:text-white transition-all border border-transparent hover:border-white/5"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-sm font-black text-white min-w-36 text-center uppercase tracking-[0.2em] bg-white/5 px-4 py-2 rounded-xl">
              {format(selectedDate, 'MMM yyyy')}
            </span>
            <button 
              onClick={() => setSelectedDate(addMonths(selectedDate, 1))}
              className="p-2.5 rounded-xl hover:bg-white/5 text-white/40 hover:text-white transition-all border border-transparent hover:border-white/5"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-px rounded-2xl overflow-hidden bg-white/5 border border-white/5 shadow-2xl">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
            <div key={day} className={`p-4 text-center text-[10px] font-black uppercase tracking-widest bg-white/5 ${i === 5 ? 'text-red-400/60' : 'text-white/40'}`}>
              {day}
            </div>
          ))}
          {calendarDays.map((day) => {
            const dayEvents = getDayEvents(day);
            const isCurrMonth = isSameMonth(day, monthStart);
            const isToday = isSameDay(day, new Date());
            
            return (
              <div 
                key={day.toString()} 
                className={`min-h-[110px] p-2 bg-gray-950/20 transition-all border-white/[0.02] border-r border-b last:border-r-0 ${!isCurrMonth ? 'opacity-10 grayscale' : ''}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className={`text-[11px] font-bold w-7 h-7 flex items-center justify-center rounded-xl transition-all ${isToday ? 'accent-gradient text-white shadow-lg shadow-purple-600/30 ring-2 ring-white/20' : 'text-white/40'}`}>
                    {format(day, 'd')}
                  </span>
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map(event => {
                    const isAssessment = 'type' in event && ['ct', 'assignment', 'exam', 'quiz'].includes(event.type);
                    const type = normalizeEventType(event.type);
                    
                    return (
                      <button
                        key={event.id}
                        onClick={() => isAssessment ? handleAssessmentClick(event as Assessment) : handleEventClick(event as CalendarEvent)}
                        className={`w-full text-[9px] p-2 rounded-lg text-left truncate font-bold border transition-all active:scale-95 hover:brightness-125 ${
                          type === 'ct' ? 'bg-red-500/10 text-red-400 border-red-500/10' :
                          type === 'assignment' ? 'bg-blue-500/10 text-blue-400 border-blue-500/10' :
                          type === 'class' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/10' :
                          'bg-white/5 text-white/50 border-white/5'
                        }`}
                      >
                        <span className="uppercase">{ (event as any).subject || event.title }</span>
                      </button>
                    );
                  })}
                  {dayEvents.length > 3 && (
                    <div className="text-[8px] text-white/20 font-black text-center mt-1 uppercase tracking-tighter">
                      + {dayEvents.length - 3} MORE
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Event Details Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={selectedEvent?.type ? selectedEvent.type.toUpperCase() : "Event Details"}
      >
        {selectedEvent && (
          <div className="space-y-6">
            <div className="flex flex-col gap-4">
              <h2 className="text-2xl font-extrabold text-white tracking-tight uppercase leading-tight">{selectedEvent.title}</h2>
              <div className="flex flex-wrap gap-2">
                <span className={`badge ${
                  normalizeEventType(selectedEvent.type) === 'ct' ? 'badge-red' :
                  normalizeEventType(selectedEvent.type) === 'assignment' ? 'badge-blue' :
                  normalizeEventType(selectedEvent.type) === 'class' ? 'badge-emerald' :
                  'badge-purple'
                }`}>
                  {selectedEvent.subject}
                </span>
                <span className="badge border-white/10 text-white/40">
                  {selectedEvent.type}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl glass flex items-center justify-center text-purple-400">
                  <CalendarIcon size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Date</p>
                  <p className="text-sm font-semibold text-white">{formatReadableDate(selectedEvent.date)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl glass flex items-center justify-center text-blue-400">
                  <Clock size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Time</p>
                  <p className="text-sm font-semibold text-white">{selectedEvent.time || "Not specified"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl glass flex items-center justify-center text-emerald-400">
                  <MapPin size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Room</p>
                  <p className="text-sm font-semibold text-white">{selectedEvent.room || "Not specified"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl glass flex items-center justify-center text-indigo-400">
                  <UserIcon size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Teacher</p>
                  <p className="text-sm font-semibold text-white">{selectedEvent.teacher || "Not specified"}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 text-white/60 text-sm">
              {selectedEvent.note && (
                <div className="p-4 rounded-xl bg-white/5 border border-white/5 italic">
                  "{selectedEvent.note}"
                </div>
              )}
              {selectedEvent.materialLink && (
                <a 
                  href={selectedEvent.materialLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full h-12 flex items-center justify-center gap-2 rounded-xl accent-gradient text-white font-bold uppercase text-[11px] tracking-widest"
                >
                  <LinkIcon size={16} /> {selectedEvent.materialTitle || 'Open Class Material'}
                </a>
              )}
            </div>

            <div className="pt-6 mt-6 border-t border-white/5 flex items-center justify-between gap-3">
              <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest truncate flex-1">Added by: {selectedEvent.createdBy}</p>
              <div className="flex gap-2">
                {canManageShared && (
                  <button 
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
                <button onClick={() => setIsModalOpen(false)} className="btn-secondary h-10 px-8 text-xs">Close</button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Assessment Details Modal */}
      <Modal 
        isOpen={isAssessmentModalOpen} 
        onClose={() => setIsAssessmentModalOpen(false)} 
        title={selectedAssessment?.type ? selectedAssessment.type.toUpperCase() : "Assessment Details"}
      >
        {selectedAssessment && (
          <div className="space-y-6">
            <div className="flex flex-col gap-4">
              <h2 className="text-2xl font-extrabold text-white tracking-tight uppercase leading-tight">{selectedAssessment.subject}</h2>
              <div className="flex flex-wrap gap-2">
                <span className={`badge ${
                  selectedAssessment.type === 'ct' ? 'badge-red' : 
                  selectedAssessment.type === 'assignment' ? 'badge-blue' : 
                  'badge-purple'
                }`}>
                  {selectedAssessment.type.toUpperCase()}
                </span>
                <span className="badge border-white/10 text-white/40">
                  {selectedAssessment.chapter}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl glass flex items-center justify-center text-purple-400">
                  <CalendarIcon size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Date</p>
                  <p className="text-sm font-semibold text-white">{formatReadableDate(selectedAssessment.date)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl glass flex items-center justify-center text-blue-400">
                  <Clock size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Time</p>
                  <p className="text-sm font-semibold text-white">{selectedAssessment.time || "Not specified"}</p>
                </div>
              </div>
              {selectedAssessment.room && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl glass flex items-center justify-center text-emerald-400">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Room</p>
                    <p className="text-sm font-semibold text-white">{selectedAssessment.room}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {selectedAssessment.note && (
                <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-sm text-white/60 italic leading-relaxed">
                  "{selectedAssessment.note}"
                </div>
              )}
              {selectedAssessment.materialLink && (
                <a 
                  href={selectedAssessment.materialLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full h-14 flex items-center justify-center gap-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold uppercase text-[11px] tracking-widest transition-all shadow-lg shadow-purple-600/20"
                >
                  <LinkIcon size={18} /> {selectedAssessment.materialTitle || 'Open Study Resource'}
                </a>
              )}
            </div>

            <div className="pt-6 mt-6 border-t border-white/5 flex items-center justify-between gap-3 text-white/30 text-[9px] font-bold uppercase tracking-widest">
              <span>Added by: {selectedAssessment.createdBy}</span>
              <button 
                onClick={() => setIsAssessmentModalOpen(false)}
                className="h-10 px-8 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={async () => {
          if (!selectedEvent) return;
          setIsDeleting(true);
          try {
            await deleteDoc(doc(db, 'globalCalendarEvents', selectedEvent.id));
            setIsDeleteModalOpen(false);
            setIsModalOpen(false);
            setSelectedEvent(null);
          } catch (err: any) {
            handleFirestoreError(err, OperationType.DELETE, `globalCalendarEvents/${selectedEvent.id}`);
          } finally {
            setIsDeleting(false);
          }
        }}
        title="Delete Event"
        itemType="Event"
        itemName={selectedEvent?.title}
        message="This will remove the event from the global calendar for all students. This action cannot be undone."
        isLoading={isDeleting}
      />
    </div>
  );
}
