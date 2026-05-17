import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { 
  Bot, 
  User, 
  Send, 
  Sparkles, 
  AlertCircle, 
  CheckCircle, 
  HelpCircle,
  Calendar,
  CheckSquare,
  Zap,
  Info
} from 'lucide-react';
import { getLocalDateString, parseRelativeDate, getWeekdayName } from '@/lib/date';
import { usePerformance } from '@/hooks/usePerformance';

interface Message {
  id: string;
  role: 'bot' | 'user';
  text: string;
  intent?: string;
  data?: any;
  status?: 'success' | 'fail' | 'info';
}

const MessageItem = React.memo(({ msg, shouldReduceMotion }: any) => (
  <motion.div
    initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
  >
    <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center ${
      msg.role === 'bot' 
        ? 'bg-purple-600/10 border border-purple-500/20 text-purple-400' 
        : 'bg-blue-600/10 border border-blue-500/20 text-blue-400'
    }`}>
      {msg.role === 'bot' ? <Bot size={20} /> : <User size={20} />}
    </div>

    <div className={`max-w-[80%] space-y-2 ${msg.role === 'user' ? 'text-right' : ''}`}>
      <div className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
        msg.role === 'bot' 
          ? 'bg-white/5 border border-white/5 text-gray-200' 
          : 'bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/10'
      }`}>
        {msg.text}
      </div>
      {msg.status && (
        <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest ${
          msg.status === 'success' ? 'text-green-500' :
          msg.status === 'fail' ? 'text-red-500' : 'text-blue-400'
        }`}>
          {msg.status === 'success' ? <CheckCircle size={10} /> : 
           msg.status === 'fail' ? <AlertCircle size={10} /> : <Info size={10} />}
          {msg.status}
        </div>
      )}
    </div>
  </motion.div>
));

export default function AIChatbot() {
  const { user, profile } = useAuth();
  const { shouldReduceMotion, backdropBlurClass } = usePerformance();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'bot',
      text: `Hello ${profile?.name}! I am your Physics 23 Assistant. How can I help you today?\n\nYou can ask me to:\n1. Add routine (e.g. "Add Quantum class today at 11 AM")\n2. Add tasks (e.g. "Add task submit assignment tomorrow")\n3. Create study plans\n4. Explain backup counter`,
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const parseIntent = (text: string) => {
    const lowText = text.toLowerCase();
    const date = parseRelativeDate(text) || new Date();
    const dateStr = getLocalDateString(date);
    const day = getWeekdayName(date);

    // 1. ADD ROUTINE
    if ((lowText.includes('routine') || lowText.includes('class') || lowText.includes('lab')) && (lowText.includes('add') || lowText.includes('rakho') || lowText.includes('koro'))) {
      const subjects = ['quantum', 'electrodynamics', 'math', 'discrete', 'electronics', 'optics', 'solid', 'nuclear', 'lab'];
      const subject = subjects.find(s => lowText.includes(s)) || 'Unknown Subject';
      
      const timeMatch = text.match(/(\d{1,2}:\d{2})\s*(am|pm|AM|PM)?/) || text.match(/(\d{1,2})\s*(am|pm|AM|PM)/);
      const time = timeMatch ? timeMatch[0] : '10:00 AM';
      
      const roomMatch = text.match(/(room|room e|rum|rum e)\s*([A-Za-z0-9-]+)/i);
      const room = roomMatch ? roomMatch[2] : 'TBA';

      return {
        intent: 'add_routine',
        data: { subject: subject.toUpperCase(), time, room, day, date: dateStr, title: `${subject.toUpperCase()} Class` }
      };
    }

    // 2. ADD TASK
    if (lowText.includes('task') || lowText.includes('remind') || lowText.includes('submit')) {
      const cleanText = text.replace(/task|add|remind|me|to/gi, '').trim();
      return {
        intent: 'add_task',
        data: { title: cleanText || 'New Task', dueDate: dateStr }
      };
    }

    // 3. STUDY PLAN
    if (lowText.includes('plan') || lowText.includes('study')) {
      const subject = text.match(/(for|of|er)\s*([A-Za-z\s]+)/i)?.[2] || 'Physics';
      return { intent: 'study_plan', data: { subject } };
    }

    // 4. BACKUP COUNTER
    if (lowText.includes('backup') || lowText.includes('counter') || lowText.includes('mark') || lowText.includes('hisab')) {
      return { intent: 'explain_backup' };
    }

    return { intent: 'unknown' };
  };

  const handleSend = async () => {
    if (!input.trim() || !user) return;
    
    console.log('--- AI Input ---');
    console.log('Input:', input);

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const { intent, data } = parseIntent(input);
    console.log('Detected Intent:', intent);
    console.log('Parsed Data:', data);

    let reply: Message = { id: (Date.now()+1).toString(), role: 'bot', text: '' };

    try {
      if (intent === 'add_routine') {
        const path = `users/${user.uid}/routines`;
        console.log('Firestore Path:', path);
        await addDoc(collection(db, path), {
          ...data,
          source: 'ai',
          createdAt: serverTimestamp()
        });
        reply.text = `Succesfully added **${data.subject}** to your routine for **${data.day}** at **${data.time}** (Room: ${data.room}).`;
        reply.status = 'success';
      } 
      else if (intent === 'add_task') {
        const path = `users/${user.uid}/tasks`;
        console.log('Firestore Path:', path);
        await addDoc(collection(db, path), {
          ...data,
          status: 'pending',
          source: 'ai',
          createdAt: serverTimestamp()
        });
        reply.text = `Added task: **${data.title}** due on **${data.dueDate}**.`;
        reply.status = 'success';
      }
      else if (intent === 'study_plan') {
        reply.text = `Here is a basic 3-day study plan for **${data.subject}**:\n\n- **Day 1**: Clear basic concepts and derivation of main equations.\n- **Day 2**: Solve mathematical problems and past questions.\n- **Day 3**: Review short questions and final prep.`;
        reply.status = 'info';
      }
      else if (intent === 'explain_backup') {
        reply.text = `The Backup Counter takes your best CT from Section 1 and Section 2 (each out of 30), averages them, and adds your average attendance (out of 10). The total is out of 40.`;
        reply.status = 'info';
      }
      else {
        reply.text = "I'm not exactly sure how to do that yet, but I can help you add routine, tasks, or study plans! Try saying: 'Add Quantum class today at 11 AM'";
        reply.status = 'info';
      }
    } catch (err: any) {
      console.error('Firebase Error:', err);
      reply.text = `I encountered an error: ${err.message}`;
      reply.status = 'fail';
    }

    setMessages(prev => [...prev, reply]);
    setLoading(false);
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col gap-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
          <Bot className="text-white" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">AI <span className="gradient-text">Assistant</span></h1>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">Self-Sustaining Personal AI</p>
        </div>
      </div>

      <div className="flex-1 glass-card flex flex-col overflow-hidden border-white/5 shadow-2xl backdrop-blur-2xl">
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <MessageItem key={msg.id} msg={msg} shouldReduceMotion={shouldReduceMotion} />
            ))}
          </AnimatePresence>
          {loading && (
             <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-purple-600/10 border border-purple-500/20 text-purple-400 flex items-center justify-center animate-pulse">
                  <Bot size={20} />
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 max-w-[80%]">
                   <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" />
                   </div>
                </div>
             </div>
          )}
          <div ref={scrollRef} />
        </div>

        <div className="p-4 bg-white/5 border-t border-white/5">
          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask anything... (e.g. 'Add Math class tomorrow at 11 AM')"
              className="glass-input w-full pr-14 h-14"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center hover:bg-purple-500 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Suggestion Chips */}
      <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
         {[
           { label: 'Add Quantum today at 11 AM', icon: Calendar },
           { label: 'Add task submit physics paper', icon: CheckSquare },
           { label: 'Study plan for Optics', icon: Zap },
           { label: 'How backup works?', icon: HelpCircle }
         ].map((s, i) => (
           <button 
             key={i} 
             onClick={() => setInput(s.label)}
             className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all text-[10px] font-bold text-gray-400 uppercase tracking-widest"
           >
             <s.icon size={12} className="text-purple-400" />
             {s.label}
           </button>
         ))}
      </div>
    </div>
  );
}
