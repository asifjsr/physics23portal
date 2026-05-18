
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, addDoc, serverTimestamp, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { 
  Bot, 
  User, 
  Send, 
  Sparkles, 
  AlertCircle, 
  CheckCircle, 
  Info,
  Image as ImageIcon,
  X,
  Loader2,
  Calendar,
  CheckSquare,
  FileText,
  Users,
  Settings,
  ChevronRight,
  Save,
  MessageCircle,
  HelpCircle,
  Clock,
  MapPin,
  Target
} from 'lucide-react';
import { usePerformance } from '@/context/PerformanceContext';
import { runAssistant } from '@/lib/gemini';
import { getPermissions } from '@/lib/permissions';
import imageCompression from 'browser-image-compression';

interface Message {
  id: string;
  role: 'bot' | 'user';
  text: string;
  actionRes?: any;
  status?: 'success' | 'fail' | 'info';
  imagePreview?: string;
}

const TablePreview = ({ rows, action }: { rows: any[], action: string }) => {
  if (!Array.isArray(rows) || rows.length === 0) return null;
  const isMarks = action === 'extract_marks_from_image';
  
  return (
    <div className="overflow-x-auto mt-4 rounded-xl border border-white/10 bg-black/40">
      <table className="w-full text-left border-collapse min-w-[300px]">
        <thead>
          <tr className="bg-white/5">
            <th className="p-3 text-[9px] font-black uppercase tracking-widest text-white/40">ID</th>
            <th className="p-3 text-[9px] font-black uppercase tracking-widest text-white/40">Name</th>
            <th className="p-3 text-[9px] font-black uppercase tracking-widest text-white/40">{isMarks ? 'Mark' : 'Attendance'}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-white/5 transition-colors">
              <td className="p-3 text-[10px] font-mono text-gray-300">{row?.studentId || 'N/A'}</td>
              <td className="p-3 text-[10px] text-gray-300 truncate max-w-[120px]">{row?.name || 'N/A'}</td>
              <td className="p-3">
                <span className={`text-[10px] font-bold ${(row?.confidence || 0) > 0.8 ? 'text-green-400' : 'text-yellow-400'}`}>
                  {isMarks ? (row?.mark || 0) : (row?.attendance || 0)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const ActionPreview = ({ actionRes, onConfirm, onCancel, isSaving, isAdmin }: any) => {
  if (!actionRes || typeof actionRes !== 'object') return null;
  if (actionRes.action === 'answer_question_only') return null;

  try {
    const { action, data, message, missingFields } = actionRes;
    
    // Defensive check for action type
    const actionStr = typeof action === 'string' ? action : '';
    if (!actionStr) {
      return (
        <div className="mt-4 p-3 rounded-xl bg-red-500/5 border border-red-500/10 text-red-400 text-[10px] flex items-center gap-2">
          <AlertCircle size={12} />
          No valid action preview available
        </div>
      );
    }

    const hasMissing = Array.isArray(missingFields) && missingFields.length > 0;
    
    const isAdminAction = [
      'add_notice', 
      'extract_people_from_text', 
      'extract_marks_from_image', 
      'extract_attendance_from_image', 
      'add_backup_record'
    ].includes(actionStr);

    if (isAdminAction && !isAdmin) {
      return (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mt-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle size={16} />
            <span className="font-bold uppercase tracking-widest text-[10px]">Permission Denied</span>
          </div>
          You do not have permission to perform this admin action.
        </div>
      );
    }

    return (
      <div className="mt-4 p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-purple-400">
            <Sparkles size={16} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Assistant Preview</span>
          </div>
          <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
            actionStr.startsWith('extract') ? 'bg-blue-500/10 text-blue-400' : 'bg-green-500/10 text-green-400'
          }`}>
            {actionStr.replace(/_/g, ' ')}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs text-white/70 italic leading-relaxed">"{message || "I've analyzed your request and prepared the following action."}"</p>
          
          {hasMissing ? (
            <div className="p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/20">
              <p className="text-[9px] font-black text-yellow-500 uppercase tracking-widest mb-1">Missing Info</p>
              <p className="text-[10px] text-yellow-400/80">Please provide: {missingFields.join(', ')}</p>
            </div>
          ) : (
            <>
              {data && (
                <div className="bg-black/20 rounded-xl p-4 border border-white/5 max-h-48 overflow-y-auto hidden sm:block">
                  <pre className="text-[10px] text-gray-500 font-mono whitespace-pre-wrap">
                    {JSON.stringify(data, null, 2)}
                  </pre>
                </div>
              )}
              {data?.rows && Array.isArray(data.rows) && (actionStr === 'extract_marks_from_image' || actionStr === 'extract_attendance_from_image') && (
                <TablePreview rows={data.rows} action={actionStr} />
              )}
            </>
          )}
        </div>

        {!hasMissing && (
          <div className="flex gap-2">
            <button 
              onClick={onConfirm}
              disabled={isSaving}
              className="flex-1 btn-primary h-10 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
            >
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Confirm & Save
            </button>
            <button 
              onClick={onCancel}
              disabled={isSaving}
              className="px-4 rounded-xl bg-white/5 text-white/40 hover:bg-white/10 transition-all text-[10px] font-black uppercase tracking-widest"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    );
  } catch (err) {
    console.error("ActionPreview rendering error:", err);
    return (
      <div className="mt-4 p-3 rounded-xl bg-red-500/5 border border-red-500/10 text-red-400 text-[10px] flex items-center gap-2">
        <AlertCircle size={12} />
        No valid action preview available
      </div>
    );
  }
};

const BOT_TIMEOUT = 5000; // 5 second throttle

export default function AIChatbot() {
  const { user, profile } = useAuth();
  const { lowDataMode, isSlowNetwork } = usePerformance();
  const shouldReduceMotion = lowDataMode || isSlowNetwork;
  const { isAdmin } = getPermissions(profile);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastRequestTime, setLastRequestTime] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile && messages.length === 0) {
      setMessages([
        {
          id: '1',
          role: 'bot',
          text: `Hi ${profile?.name || 'Classmate'}! I'm your ClassVerse AI Assistant. I can understand Bangla, English, and even process your uploaded images for class updates, marks, and more. How can I help?`,
        }
      ]);
    }
  }, [profile]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: loading ? 'smooth' : 'auto' });
  }, [messages, loading]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        alert("File too large! Max 20MB allowed.");
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setFilePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = async () => {
    if (loading) return;
    if (!input.trim() && !selectedFile) return;
    if (!user) return;

    // Throttling: 5 seconds
    const now = Date.now();
    if (now - lastRequestTime < BOT_TIMEOUT) {
      const wait = Math.ceil((BOT_TIMEOUT - (now - lastRequestTime)) / 1000);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'bot',
        text: `Please wait ${wait}s before sending another message.`,
        status: 'info'
      }]);
      return;
    }

    setLastRequestTime(now);
    const currentInput = input;
    const currentFile = selectedFile;
    const currentPreview = filePreview;

    const userMsg: Message = { 
      id: Date.now().toString(), 
      role: 'user', 
      text: currentInput || (currentFile ? "Analyzing image..." : ""),
      imagePreview: currentPreview || undefined
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    removeFile();
    setLoading(true);

    try {
      let fileToSend = currentFile;
      if (currentFile && currentFile.size > 1024 * 1024) {
        fileToSend = await imageCompression(currentFile, { maxSizeMB: 1, maxWidthOrHeight: 1920 });
      }

      const response = await runAssistant(currentInput, fileToSend || undefined);
      
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        text: response.message,
        actionRes: response,
        status: response.needsConfirmation ? 'info' : 'success'
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      console.error('AI Error:', err);
      // Specific mapping for 429 in runAssistant is already handled, 
      // but let's make sure the msg is clear.
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'bot',
        text: err.message || "Something went wrong. Please check your connection or try again.",
        status: 'fail'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (botMsgId: string, actionRes: any) => {
    if (!user || isSaving || !actionRes) return;
    setIsSaving(true);
    
    try {
      const action = actionRes.action;
      const data = actionRes.data || {};
      let success = false;

      switch (action) {
        case 'add_task':
          await addDoc(collection(db, `users/${user.uid}/tasks`), { ...data, status: 'pending', createdAt: serverTimestamp() });
          success = true;
          break;
        case 'add_assessment':
          await addDoc(collection(db, `users/${user.uid}/assessments`), { ...data, createdAt: serverTimestamp() });
          success = true;
          break;
        case 'add_routine':
          await addDoc(collection(db, `users/${user.uid}/routines`), { ...data, createdAt: serverTimestamp() });
          success = true;
          break;
        case 'add_calendar_event':
          await addDoc(collection(db, `users/${user.uid}/calendarEvents`), { ...data, createdAt: serverTimestamp() });
          success = true;
          break;
        case 'add_notice':
          if (!isAdmin) throw new Error("Unauthorized");
          await addDoc(collection(db, 'notices'), { ...data, author: profile?.name, createdAt: serverTimestamp() });
          success = true;
          break;
        case 'extract_people_from_text':
          if (!isAdmin) throw new Error("Unauthorized");
          const people = Array.isArray(data.people) ? data.people : [];
          for (const p of people) {
            if (p?.studentId) {
              await setDoc(doc(db, 'batchmates', p.studentId), { ...p, createdAt: serverTimestamp() });
            }
          }
          success = true;
          break;
        case 'add_backup_record':
        case 'extract_marks_from_image':
        case 'extract_attendance_from_image':
          if (!isAdmin) throw new Error("Unauthorized");
          const rows = Array.isArray(data.rows) ? data.rows : (Object.keys(data).length > 0 ? [data] : []);
          for (const row of rows) {
            const courseCode = data.courseCode || row.courseCode;
            if (!row?.studentId || !courseCode) continue;
            
            const recordRef = doc(db, `backupRecords/${row.studentId}/courses/${courseCode}`);
            const snap = await getDoc(recordRef);
            const cur = snap.exists() ? snap.data() : { sections: { sectionA: {}, sectionB: {} } };

            const section = data.section === 'B' ? 'sectionB' : 'sectionA';
            const isAttendance = action === 'extract_attendance_from_image';
            
            const updatedSections = { ...cur.sections };
            if (!updatedSections.sectionA) updatedSections.sectionA = {};
            if (!updatedSections.sectionB) updatedSections.sectionB = {};

            if (isAttendance) {
              updatedSections[section].attendance = row.attendance || 0;
            } else {
              const ctKey = (data.ctNumber || row.ctNumber || 'ct1').toLowerCase();
              updatedSections[section][ctKey] = row.mark || 0;
            }

            // Calc
            const secA = updatedSections.sectionA || {};
            const secB = updatedSections.sectionB || {};
            secA.bestCt = Math.max(secA.ct1 || 0, secA.ct2 || 0);
            secB.bestCt = Math.max(secB.ct1 || 0, secB.ct2 || 0);
            const totalCt = (secA.bestCt || 0) + (secB.bestCt || 0);
            const attAvg = ((secA.attendance || 0) + (secB.attendance || 0)) / 2;
            
            await setDoc(recordRef, {
              studentId: row.studentId,
              courseCode,
              courseName: data.courseName || row.courseName || '',
              sections: updatedSections,
              totalCtOutOf30: totalCt,
              attendanceAverageOutOf10: attAvg,
              finalBackupScore: totalCt + attAvg,
              updatedAt: serverTimestamp()
            });
          }
          success = true;
          break;
      }

      if (success) {
        setMessages(prev => prev.map(m => 
          m.id === botMsgId ? { ...m, status: 'success', actionRes: null, text: `Sweet! Everything is saved as requested.` } : m
        ));
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleActionCancel = (botMsgId: string) => {
    setMessages(prev => prev.map(m => 
      m.id === botMsgId ? { ...m, actionRes: null, text: "Action cancelled.", status: 'info' } : m
    ));
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-120px)] sm:h-[calc(100vh-160px)] gap-4 pb-4">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl accent-gradient flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Bot className="text-white" size={22} />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight leading-none">Assistant</h1>
            <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest mt-1">POWERED BY GEMINI AI</p>
          </div>
        </div>
      </div>

      <div className="flex-1 glass shadow-2xl rounded-[2.5rem] flex flex-col overflow-hidden border-white/5">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-hide">
          {messages.map((msg) => (
            <motion.div 
              key={msg.id}
              initial={shouldReduceMotion ? {} : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center ${
                msg.role === 'bot' ? 'bg-purple-500/10 text-purple-400' : 'bg-blue-500/10 text-blue-400'
              }`}>
                {msg.role === 'bot' ? <Bot size={18} /> : <User size={18} />}
              </div>

              <div className={`max-w-[88%] sm:max-w-[75%] space-y-2 ${msg.role === 'user' ? 'text-right' : ''}`}>
                {msg.imagePreview && <img src={msg.imagePreview} className="w-full sm:w-64 aspect-video object-cover rounded-2xl mb-2 border border-white/10" alt="Uploaded" />}
                <div className={`p-4 rounded-3xl text-xs sm:text-sm leading-relaxed shadow-sm ${
                  msg.role === 'bot' ? 'bg-white/5 text-gray-200 rounded-tl-none' : 'accent-gradient text-white rounded-tr-none'
                }`}>
                  {msg.text}
                  {msg.actionRes && (
                    <ActionPreview 
                      actionRes={msg.actionRes} 
                      onConfirm={() => handleConfirm(msg.id, msg.actionRes)}
                      onCancel={() => handleActionCancel(msg.id)}
                      isSaving={isSaving}
                      isAdmin={isAdmin}
                    />
                  )}
                </div>
                {msg.status && (
                  <div className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest ${
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
          ))}
          {loading && (
             <div className="flex gap-3">
               <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shadow-inner">
                 <Loader2 size={18} className="animate-spin" />
               </div>
               <div className="px-4 py-3 rounded-3xl bg-white/5 border border-white/5 rounded-tl-none">
                 <div className="flex gap-1">
                   <div className="w-1.5 h-1.5 rounded-full bg-purple-400/50 animate-bounce" />
                   <div className="w-1.5 h-1.5 rounded-full bg-purple-400/50 animate-bounce [animation-delay:0.2s]" />
                   <div className="w-1.5 h-1.5 rounded-full bg-purple-400/50 animate-bounce [animation-delay:0.4s]" />
                 </div>
               </div>
             </div>
          )}
          <div ref={scrollRef} />
        </div>

        <div className="p-4 bg-white/5 border-t border-white/5 space-y-4">
           {filePreview && (
             <div className="relative inline-block">
               <img src={filePreview} className="w-16 h-16 object-cover rounded-2xl border border-white/20" alt="Preview" />
               <button onClick={removeFile} className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg"><X size={10}/></button>
             </div>
           )}
           <div className="flex gap-2 items-center">
             <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />
             <button onClick={() => fileInputRef.current?.click()} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 text-gray-400 flex items-center justify-center hover:bg-white/10 transition-all active:scale-90"><ImageIcon size={18}/></button>
             <div className="flex-1 relative">
               <input 
                 value={input} 
                 onChange={e=>setInput(e.target.value)} 
                 onKeyPress={e=>(e.key==='Enter' && !loading) && handleSend()} 
                 placeholder={selectedFile ? "What to do with this?" : "Add assessment, routine..."} 
                 disabled={loading}
                 className="glass-input w-full h-12 pr-12 text-sm rounded-2xl disabled:opacity-50"
               />
               <button onClick={handleSend} disabled={loading || (!input.trim() && !selectedFile)} className="absolute right-1 text-white top-1 w-10 h-10 rounded-xl accent-gradient flex items-center justify-center disabled:opacity-50"><Send size={16}/></button>
             </div>
           </div>
        </div>
      </div>
      
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
         {[
           { l: 'Add lab report due Sunday', i: CheckSquare },
           { l: 'Add Quantum Class tomorrow 10am', i: Clock },
           { l: 'Important: Next Sunday CT', i: AlertCircle, a: true }
         ].filter(s=>!s.a || isAdmin).map((s,i)=>(
           <button key={i} onClick={()=>setInput(s.l)} className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-widest text-gray-400 hover:bg-white/10">{s.l}</button>
         ))}
      </div>
    </div>
  );
}
