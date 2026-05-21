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
  User,
  Facebook,
  Youtube
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
  { studentId: "231711", name: "MST. TANIMA JANNAT HASHI", role: "student", imageUrl: "https://lh3.googleusercontent.com/d/1eTKRyPLgDdi8wUROlzg9da_dPPJzNUpF" },
  { studentId: "231713", name: "MD. SHAKIB", role: "class representative", imageUrl: "" },
  { studentId: "231715", name: "JANNATULL SABDID", role: "student", imageUrl: "" },
  { studentId: "231718", name: "FARDIN AL ZAWAD FAHIM", role: "student", imageUrl: "" },
  { studentId: "231719", name: "MD. ASIF KHAN", role: "student", imageUrl: "https://lh3.googleusercontent.com/d/1oAgNKQhVWd7QyytSphvZ0aBpR7qSunoG" },
  { studentId: "231720", name: "MONOARUL ISLAM FAHIM", role: "student", imageUrl: "https://lh3.googleusercontent.com/d/1y-RA22HaYoqtf9h7tkM7MBEnp5CRPM0Q" },
  { studentId: "231722", name: "MAHIR MAHDI", role: "student", imageUrl: "" },
  { studentId: "231723", name: "AFIA ANISA", role: "student", imageUrl: "" },
  { studentId: "231729", name: "MST.MODINA KHATUN", role: "student", imageUrl: "https://lh3.googleusercontent.com/d/1SooeRpHZjTN_LksCi7UK4qgfTsyrxCck" },
  { studentId: "231730", name: "MAHATHIR MOHAMMAD", role: "student", imageUrl: "" },
  { studentId: "231734", name: "TAHSIN AHMED MAHIM", role: "student", imageUrl: "" },
  { studentId: "231735", name: "SOHAN SARDER", role: "student", imageUrl: "" },
  { studentId: "231736", name: "JEET DAY", role: "student", imageUrl: "" },
  { studentId: "231737", name: "PROMA DAS RUPA", role: "student", imageUrl: "https://lh3.googleusercontent.com/d/1wqt5oGrzCoULtEjQRH_4t53_zQqVJup0" },
  { studentId: "231739", name: "FAHAD BIN SHARAFAT", role: "student", imageUrl: "" },
  { studentId: "231740", name: "SANCHITA MONDAL", role: "student", imageUrl: "" },
  { studentId: "231741", name: "MAFUJUR RAHMAN", role: "student", imageUrl: "" },
  { studentId: "231742", name: "EZAZ MAHMUD", role: "student", imageUrl: "" },
  { studentId: "221703", name: "CHANDAN BALA", role: "student", imageUrl: "" },
  { studentId: "221740", name: "Md. Tariqul Islam", role: "student", imageUrl: "https://lh3.googleusercontent.com/d/1bC1Evm71isLy0OFW5e3s-rQhkfxdRYJw" }
];

import { usePerformance } from '@/context/PerformanceContext';
import { ProfileModal } from '@/components/ProfileModal';

const BatchmateMiniCard = React.memo(({ person, idx, onClick, shouldReduceMotion, lowDataMode }: any) => {
  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??';
  };
  
  const showImage = !!person.imageUrl;

  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: shouldReduceMotion ? 0 : (idx % 6) * 0.05 }}
      onClick={() => onClick(person)}
      className="glass p-4 text-center group glass-hover cursor-pointer"
    >
      <div className="w-16 h-16 rounded-2xl mx-auto mb-4 overflow-hidden bg-white/5 border border-white/10 group-hover:border-purple-500/30 transition-all flex items-center justify-center">
        {person.imageUrl && showImage ? (
          <>
            <img 
              src={person.imageUrl} 
              className="w-full h-full object-cover object-center optimized-image" 
              style={{ imageRendering: 'auto' }}
              alt={person.name} 
              referrerPolicy="no-referrer"
              loading="lazy"
              decoding="async"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <span className="text-lg font-bold text-white/20 group-hover:text-purple-400 transition-colors uppercase hidden">
              {getInitials(person.name)}
            </span>
          </>
        ) : (
          <span className="text-lg font-bold text-white/20 group-hover:text-purple-400 transition-colors uppercase">
            {getInitials(person.name)}
          </span>
        )}
      </div>
      <h3 className="text-[11px] font-bold text-white uppercase tracking-tight truncate px-2 w-full">{person.name}</h3>
      <div className="mt-1.5 mb-0.5">
        <span className="px-2 py-0.5 bg-[#ffffff10] border border-[#ffffff15] rounded-full text-[8px] font-bold text-[#94a3b8] tracking-widest inline-flex items-center gap-1 shadow-sm">
          <span>ID</span>
          <span className="text-white tracking-wide">{person.studentId}</span>
        </span>
      </div>
      {person.district && (
        <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-widest mt-1 truncate px-1 w-full text-center">
          {person.district}
        </p>
      )}
    </motion.div>
  );
});

export default function Landing() {
  const { user } = useAuth();
  const { lowDataMode, setLowDataMode, isSlowNetwork } = usePerformance();
  const shouldReduceMotion = lowDataMode || isSlowNetwork;
  const backdropBlurClass = lowDataMode ? 'low-performance-blur' : 'backdrop-blur-md';
  
  const [batchmates, setBatchmates] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<any>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const q = query(collection(db, 'album'), orderBy('createdAt', 'desc'), limit(8));
        
        let timeoutId: any;
        const timeoutPromise = new Promise<any>((resolve) => {
          timeoutId = setTimeout(() => resolve({ empty: true, docs: [] }), 5000);
        });
        
        const snapshot = await Promise.race([getDocs(q), timeoutPromise]);
        clearTimeout(timeoutId);

        if (!snapshot.empty) {
          const data = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
          setPhotos(data);
        }
      } catch (err: any) {
        if (err?.code !== 'permission-denied') {
          console.error("Error fetching photos for landing:", err);
        }
      }
    };
    // Defer non-critical fetching slightly to improve initial layout paint (First Contentful Paint)
    const timer = setTimeout(() => fetchPhotos(), 500);
    return () => clearTimeout(timer);
  }, []);

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
        const q = query(collection(db, 'batchmates'), orderBy('studentId', 'asc'), limit(12)); // Reduced limit
        
        let timeoutId: any;
        const timeoutPromise = new Promise<any>((resolve) => {
          timeoutId = setTimeout(() => resolve({ empty: true, timedOut: true }), 5000);
        });
        
        const snapshot = await Promise.race([getDocs(q), timeoutPromise]);
        clearTimeout(timeoutId);

        let finalData: any[] = [];
        
        if (!snapshot.empty && !snapshot.timedOut) {
          const dbData = snapshot.docs.map((doc: any) => {
            const data = doc.data();
            return {
              ...data,
              id: doc.id,
              studentId: data.studentId || data.id || 'N/A',
              name: data.name || data.fullName || 'Unknown',
              role: data.role || data.position || 'STUDENT',
              imageUrl: data.imageUrl || data.photoURL || data.avatarUrl || ''
            };
          });
          // Merge images from fallback if missing in DB
          finalData = dbData.map((p: any) => {
            const fallback = FALLBACK_BATCHMATES.find(f => f.studentId === p.studentId);
            return {
              ...p,
              imageUrl: p.imageUrl || fallback?.imageUrl || ''
            };
          });
        } else {
          finalData = FALLBACK_BATCHMATES.slice(0, 12);
        }
        setBatchmates(reorderBatchmates(finalData));
      } catch (error: any) {
        // Silently fall back if permissions are missing (common for unauthenticated landing page visits)
        if (error?.code !== 'permission-denied') {
          console.error("Error fetching batchmates for landing:", error);
        }
        setBatchmates(reorderBatchmates(FALLBACK_BATCHMATES.slice(0, 12)));
      }
    };
    const timer = setTimeout(() => fetchBatchmates(), 500);
    return () => clearTimeout(timer);
  }, []);

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??';
  };

  return (
    <div className="min-h-screen w-full relative selection:bg-purple-500/30">
      <div className="mesh-bg" />
      
      {/* Navbar */}
      <header className="fixed top-4 left-4 right-4 z-50">
        <div className={`max-w-7xl mx-auto glass h-16 flex items-center justify-between px-6 bg-white/[0.02] ${backdropBlurClass}`}>
          <div className="flex items-center gap-3">
            <Atom className="text-purple-400" size={24} />
            <span className="text-lg font-extrabold text-white tracking-tight uppercase">Physics 23</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 mr-6 ml-auto">
            <a href="#about" className="text-xs font-bold text-white/50 hover:text-white uppercase tracking-widest transition-colors">About</a>
            <a href="#showcase" className="text-xs font-bold text-white/50 hover:text-white uppercase tracking-widest transition-colors">Batch</a>
            <a href="#features" className="text-xs font-bold text-white/50 hover:text-white uppercase tracking-widest transition-colors">Features</a>
            <Link to="/album" className="text-xs font-bold text-white/50 hover:text-white uppercase tracking-widest transition-colors">Album</Link>
            <a href="#showcase" className="text-xs font-bold text-purple-400 hover:text-purple-300 uppercase tracking-widest transition-colors">People</a>
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
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-white/50 text-lg lg:text-xl max-w-3xl mb-12 font-medium flex flex-col gap-2"
            >
              <p className="font-bold text-white/80">Tachyon | Physics '23</p>
              <p className="italic">Faster than light, stronger than limits.</p>
              <p>Official page of the Physics 23 Batch Khulna University – Tachyon.</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link to={user ? "/dashboard" : "/login"} className="btn-primary w-full sm:w-auto h-14 flex items-center justify-center text-lg px-12 group uppercase tracking-widest text-sm">
                Join the Portal <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a href="#showcase" className="btn-secondary w-full sm:w-auto h-14 flex items-center justify-center text-lg px-12 uppercase tracking-widest text-sm">
                Explore Batch
              </a>
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
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  decoding="async"
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
              {/* Note: 'View All Batchmates' could still go to /people if preferred, but user said 'meet physics 23 te niye asbe' */}
              {/* So I will change this to just hide or point to dashboard if they want full access, but for now scrolling to top of section is what they asked */}
              <a href="#showcase" className="btn-secondary h-12 flex items-center gap-2 text-xs uppercase tracking-widest font-bold">
                View All Batchmates <ChevronRight size={14} />
              </a>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {batchmates.map((person, idx) => (
                <BatchmateMiniCard 
                  key={person.studentId} 
                  person={person} 
                  idx={idx} 
                  shouldReduceMotion={shouldReduceMotion} 
                  onClick={(p: any) => {
                    setSelectedPerson(p);
                    setIsProfileModalOpen(true);
                  }}
                />
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

          {/* Album Showcase Section */}
          {photos.length > 0 && (
            <section id="album" className="w-full mb-32">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div>
                  <h2 className="text-3xl lg:text-5xl font-black text-white uppercase tracking-tighter mb-2">Public Album</h2>
                  <p className="text-white/40 font-bold uppercase tracking-widest text-xs">Our latest memories</p>
                </div>
                <Link to="/album" className="btn-secondary h-12 flex items-center gap-2 text-xs uppercase tracking-widest font-bold">
                  View Full Album <ChevronRight size={14} />
                </Link>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {photos.slice(0, 8).map((photo, idx) => (
                  <motion.div
                    key={photo.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.05 }}
                    className="relative aspect-square w-full rounded-2xl overflow-hidden glass group cursor-pointer"
                  >
                    <img 
                      src={photo.imageUrl} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 optimized-image" 
                      alt={photo.title || photo.caption || "Batch photo"}
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                      {(photo.title || photo.caption) && (
                        <p className="text-white text-xs font-bold truncate w-full">{photo.title || photo.caption}</p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

        </div>
      </main>

      <ProfileModal 
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        person={selectedPerson}
        backdropBlurClass={backdropBlurClass}
      />

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 mx-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 px-4">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-3">
              <Atom className="text-purple-400" size={20} />
              <span className="font-extrabold text-white uppercase tracking-wider text-sm">Physics 23 Portal</span>
            </div>
            
            <button 
              onClick={() => setLowDataMode(!lowDataMode)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all text-[10px] font-black uppercase tracking-widest ${
                lowDataMode 
                  ? 'bg-purple-500/20 border-purple-500/50 text-purple-400' 
                  : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
              }`}
            >
              <Zap size={10} className={lowDataMode ? 'fill-current' : ''} />
              {lowDataMode ? 'Low Data Mode On' : 'Low Data Mode Off'}
              {isSlowNetwork && !lowDataMode && (
                <span className="ml-1 text-yellow-500/80">(Slow Network Detected)</span>
              )}
            </button>
          </div>
          <div className="flex flex-col items-center md:items-end gap-4">
            <div className="flex gap-4">
              <a href="https://www.facebook.com/kuphysics23" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-purple-400 transition-colors">
                <Facebook size={20} />
              </a>
              <a href="https://www.youtube.com/@Ku_physics23" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-purple-400 transition-colors">
                <Youtube size={20} />
              </a>
            </div>
            <p className="text-white/20 text-[10px] font-bold uppercase tracking-widest leading-loose text-center md:text-right">
              &copy; 2026 Physics '23. All Rights Reserved.<br/>
              Optimized for low-bandwidth mobile environments.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

