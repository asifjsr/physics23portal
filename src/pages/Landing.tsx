import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Atom, 
  ChevronRight, 
  Users, 
  Calendar, 
  Wallet, 
  Bot, 
  ShieldCheck,
  Zap,
  Image as ImageIcon,
  LayoutDashboard,
  CheckSquare,
  Calculator,
  User
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const GROUP_PHOTO_URL = "https://lh3.googleusercontent.com/d/1SPESj37CfJVrznPCYT7caFTbHUNk1JCK";

const FALLBACK_BATCHMATES = [
  { studentId: "231701", name: "NAWSHIN KHAN", role: "student", imageUrl: "" },
  { studentId: "231703", name: "ANIKA TASNIM", role: "student", imageUrl: "" },
  { studentId: "231705", name: "APU KUMER PAL", role: "student", imageUrl: "" },
  { studentId: "231708", name: "MST. FARJANA MAHIN", role: "student", imageUrl: "" },
  { studentId: "231709", name: "MD. SAIFUL ISLAM MANIK", role: "student", imageUrl: "" },
  { studentId: "231710", name: "SEJANUR RAHMAN SEJAN", role: "student", imageUrl: "" },
  { studentId: "231711", name: "MST. TANIMA JANNAT HASHI", role: "student", imageUrl: "" },
  { studentId: "231713", name: "MD. SHAKIB", role: "class representative", imageUrl: "" },
  { studentId: "231715", name: "JANNATULL SABDID", role: "student", imageUrl: "" },
  { studentId: "231718", name: "FARDIN AL ZAWAD FAHIM", role: "student", imageUrl: "" },
  { studentId: "231719", name: "MD. ASIF KHAN", role: "student", imageUrl: "" },
  { studentId: "231720", name: "MONOARUL ISLAM FAHIM", role: "student", imageUrl: "" },
  { studentId: "231722", name: "MAHIR MAHDI", role: "student", imageUrl: "" },
  { studentId: "231723", name: "AFIA ANISA", role: "student", imageUrl: "" },
  { studentId: "231729", name: "MST.MODINA KHATUN", role: "student", imageUrl: "" },
  { studentId: "231730", name: "MAHATHIR MOHAMMAD", role: "student", imageUrl: "" },
  { studentId: "231734", name: "TAHSIN AHMED MAHIM", role: "student", imageUrl: "" },
  { studentId: "231735", name: "SOHAN SARDER", role: "student", imageUrl: "" },
  { studentId: "231736", name: "JEET DAY", role: "student", imageUrl: "" },
  { studentId: "231737", name: "PROMA DAS RUPA", role: "student", imageUrl: "" },
  { studentId: "231739", name: "FAHAD BIN SHARAFAT", role: "student", imageUrl: "" },
  { studentId: "231740", name: "SANCHITA MONDAL", role: "student", imageUrl: "" },
  { studentId: "231741", name: "MAFUJUR RAHMAN", role: "student", imageUrl: "" },
  { studentId: "231742", name: "EZAZ MAHMUD", role: "student", imageUrl: "" },
  { studentId: "221703", name: "CHANDAN BALA", role: "student", imageUrl: "" },
  { studentId: "221740", name: "Md. Tariqul Islam", role: "student", imageUrl: "" }
];

export default function Landing() {
  const { user } = useAuth();
  const [batchmates, setBatchmates] = useState<any[]>([]);

  useEffect(() => {
    const reorderBatchmates = (list: any[]) => {
      const specialIds = ["221703", "221730", "221740"];
      const normal = list.filter(p => !specialIds.includes(p.studentId));
      const special = list.filter(p => specialIds.includes(p.studentId))
                         .sort((a, b) => a.studentId.localeCompare(b.studentId));
      return [...normal, ...special];
    };

    const fetchBatchmates = async () => {
      try {
        const q = query(collection(db, 'batchmates'), orderBy('studentId', 'asc'), limit(26));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const rawData = snapshot.docs.map(doc => doc.data());
          setBatchmates(reorderBatchmates(rawData));
        } else {
          setBatchmates(reorderBatchmates(FALLBACK_BATCHMATES));
        }
      } catch (error: any) {
        // Silently fall back if permissions are missing (common for unauthenticated landing page visits)
        if (error?.code !== 'permission-denied') {
          console.error("Error fetching batchmates for landing:", error);
        }
        setBatchmates(reorderBatchmates(FALLBACK_BATCHMATES));
      }
    };
    fetchBatchmates();
  }, []);

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??';
  };

  return (
    <div className="min-h-screen w-full relative selection:bg-purple-500/30">
      <div className="mesh-bg" />
      
      {/* Navbar */}
      <header className="fixed top-4 left-4 right-4 z-50">
        <div className="max-w-7xl mx-auto glass h-16 flex items-center justify-between px-6 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <Atom className="text-purple-400" size={24} />
            <span className="text-lg font-extrabold text-white tracking-tight uppercase">Physics 23</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 mr-6 ml-auto">
            <a href="#about" className="text-xs font-bold text-white/50 hover:text-white uppercase tracking-widest transition-colors">About</a>
            <a href="#showcase" className="text-xs font-bold text-white/50 hover:text-white uppercase tracking-widest transition-colors">Batch</a>
            <a href="#features" className="text-xs font-bold text-white/50 hover:text-white uppercase tracking-widest transition-colors">Features</a>
            <Link to="/people" className="text-xs font-bold text-purple-400 hover:text-purple-300 uppercase tracking-widest transition-colors">People</Link>
          </nav>
          <div className="flex items-center gap-4">
            {user ? (
              <Link to="/dashboard" className="btn-primary py-2 px-5 text-sm uppercase tracking-widest">
                Dashboard
              </Link>
            ) : (
              <Link to="/login" className="btn-primary py-2 px-5 text-sm uppercase tracking-widest">
                Login
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="pt-40 pb-20 px-4">
        <div className="max-w-7xl mx-auto flex flex-col items-center">
          <section id="hero" className="text-center mb-32">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border-purple-500/20 text-purple-400 text-[11px] font-extrabold uppercase tracking-widest mb-8"
            >
              <Zap size={14} /> Empowering Your Academic Journey
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-6xl lg:text-9xl font-black text-white mb-8 tracking-tighter leading-[0.9] uppercase"
            >
              Physics <span className="gradient-text">23</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-white/50 text-lg lg:text-xl max-w-3xl mb-12 font-medium"
            >
              Our centralized class portal for routines, CT trackers, assignment vaults, 
              batch fund transparency, and digital album. Built by the batch, for the batch.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link to="/login" className="btn-primary w-full sm:w-auto h-14 flex items-center justify-center text-lg px-12 group uppercase tracking-widest text-sm">
                Join the Portal <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/people" className="btn-secondary w-full sm:w-auto h-14 flex items-center justify-center text-lg px-12 uppercase tracking-widest text-sm">
                Explore Batch
              </Link>
            </motion.div>
          </section>

          {/* Group Photo Section */}
          <section id="about" className="w-full mb-32">
            <div className="relative aspect-[16/9] w-full rounded-[2rem] overflow-hidden glass border-white/10 group shadow-2xl">
              {GROUP_PHOTO_URL ? (
                <img 
                  src={GROUP_PHOTO_URL} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" 
                  alt="Physics 23 Group"
                />
              ) : (
                <div className="w-full h-full accent-gradient opacity-20 flex items-center justify-center" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8 lg:p-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-3xl lg:text-5xl font-black text-white uppercase tracking-tighter mb-4">Our Batch, Our Journey</h2>
                  <p className="text-white/60 max-w-xl text-sm lg:text-base">
                    From the first lab session to the final semester, Physics 23 is more than just a roll call. 
                    It's a community of aspiring scientists and lifelong friends.
                  </p>
                </motion.div>
              </div>
              {!GROUP_PHOTO_URL && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <ImageIcon className="mx-auto text-white/20 mb-4" size={48} />
                    <p className="text-white/40 font-bold uppercase tracking-widest text-xs">Add your group photo URL in Landing.tsx</p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Batch Showcase Section */}
          <section id="showcase" className="w-full mb-32">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
              <div>
                <h2 className="text-3xl lg:text-5xl font-black text-white uppercase tracking-tighter mb-2">Meet Physics 23</h2>
                <p className="text-white/40 font-bold uppercase tracking-widest text-xs">A directory of our core members</p>
              </div>
              <Link to="/people" className="btn-secondary h-12 flex items-center gap-2 text-xs uppercase tracking-widest font-bold">
                View All Batchmates <ChevronRight size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {batchmates.map((person, idx) => (
                <motion.div
                  key={person.studentId}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: (idx % 6) * 0.05 }}
                  className="glass p-4 text-center group glass-hover"
                >
                  <div className="w-16 h-16 rounded-2xl mx-auto mb-4 overflow-hidden bg-white/5 border border-white/10 group-hover:border-purple-500/30 transition-all flex items-center justify-center">
                    {person.imageUrl ? (
                      <img src={person.imageUrl} className="w-full h-full object-cover" alt={person.name} />
                    ) : (
                      <span className="text-lg font-bold text-white/20 group-hover:text-purple-400 transition-colors uppercase">
                        {getInitials(person.name)}
                      </span>
                    )}
                  </div>
                  <h3 className="text-[11px] font-bold text-white uppercase tracking-tight truncate px-2">{person.name}</h3>
                  <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest mt-1">ID: {person.studentId}</p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Features Section */}
          <section id="features" className="w-full mb-32">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-5xl font-black text-white uppercase tracking-tighter mb-2">Platform Features</h2>
              <p className="text-white/40 font-bold uppercase tracking-widest text-xs">Everything you need in one place</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: LayoutDashboard, title: 'Dashboard', desc: 'Real-time overview of upcoming CTs, assignments, and routine' },
                { icon: Calendar, title: 'Smart Routine', desc: 'Interactive schedule with room details and teacher info' },
                { icon: Wallet, title: 'Batch Fund', desc: 'Transparent tracking of contributions and expenses' },
                { icon: Bot, title: 'AI Assistant', desc: 'Process natural language commands to update schedule or solve doubts' },
                { icon: ImageIcon, title: 'Album', desc: 'Preserving our best moments with cloud-based batch gallery' },
                { icon: Calculator, title: 'Backup Counter', desc: 'Track class attendance and backup stats efficiently' }
              ].map((feature, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05 }}
                  className="glass p-8 text-left glass-hover group"
                >
                  <div className="w-12 h-12 rounded-xl glass bg-white/5 border-white/10 flex items-center justify-center mb-6 group-hover:accent-gradient group-hover:border-transparent transition-all">
                    <feature.icon className="text-white group-hover:text-white" size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-tight">{feature.title}</h3>
                  <p className="text-white/40 text-sm leading-relaxed">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 mx-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 px-4">
          <div className="flex items-center gap-3">
            <Atom className="text-purple-400" size={20} />
            <span className="font-extrabold text-white uppercase tracking-wider text-sm">Physics 23 Portal</span>
          </div>
          <p className="text-white/20 text-[10px] font-bold uppercase tracking-widest">&copy; 2026 Dept. of Physics. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
}

