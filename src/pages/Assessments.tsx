import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, getDocs, query, orderBy, doc, setDoc, deleteDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { getPermissions } from '@/lib/permissions';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';
import { ConfirmModal } from '@/components/ConfirmModal';
import { Modal } from '@/components/Modal';
import { usePerformance } from '@/context/PerformanceContext';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Link as LinkIcon, 
  Trash2, 
  Edit2, 
  ChevronRight,
  Info,
  Tag,
  AlertCircle,
  Hash
} from 'lucide-react';
import { formatReadableDate } from '@/lib/date';

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

const ASSESSMENT_TYPES = [
  { id: 'ct', label: 'Class Test', icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-400/10' },
  { id: 'assignment', label: 'Assignment', icon: BookOpen, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  { id: 'exam', label: 'Exam', icon: Hash, color: 'text-purple-400', bg: 'bg-purple-400/10' },
  { id: 'quiz', label: 'Quiz', icon: Tag, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
];

export default function Assessments() {
  const { profile, user } = useAuth();
  const { canManageShared: canManage, isApproved } = getPermissions(profile);
  const { lowDataMode, isSlowNetwork } = usePerformance();
  const shouldReduceMotion = lowDataMode || isSlowNetwork;
  const backdropBlurClass = lowDataMode ? 'low-performance-blur' : 'backdrop-blur-md';

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Assessment | null>(null);
  const [selectedItem, setSelectedItem] = useState<Assessment | null>(null);
  const [formData, setFormData] = useState<Partial<Assessment>>({
    type: 'ct'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const fetchAssessments = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'assessments'), orderBy('date', 'asc'), orderBy('time', 'asc'));
      const snapshot = await getDocs(q);
      setAssessments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Assessment)));
    } catch (err: any) {
      console.error("Error fetching assessments:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isApproved) return;
    fetchAssessments();
  }, [isApproved, fetchAssessments]);

  const handleOpenModal = (item?: Assessment) => {
    if (item) {
      setEditingItem(item);
      setFormData(item);
    } else {
      setEditingItem(null);
      setFormData({ type: 'ct' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;
    setIsSubmitting(true);

    try {
      const data = {
        ...formData,
        updatedAt: serverTimestamp(),
      };

      if (!editingItem) {
        data.createdAt = serverTimestamp();
        data.createdBy = profile.name;
        data.createdByUid = user.uid;
        const newDocRef = doc(collection(db, 'assessments'));
        await setDoc(newDocRef, data);
      } else {
        await updateDoc(doc(db, 'assessments', editingItem.id), data);
      }

      setIsModalOpen(false);
    } catch (err: any) {
      handleFirestoreError(err, editingItem ? OperationType.UPDATE : OperationType.CREATE, 'assessments');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = (item: Assessment) => {
    setEditingItem(item);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!editingItem) return;
    setIsSubmitting(true);
    try {
      await deleteDoc(doc(db, 'assessments', editingItem.id));
      setIsDeleteModalOpen(false);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.DELETE, `assessments/${editingItem.id}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredAssessments = assessments.filter(a => {
    const matchesTab = activeTab === 'all' || a.type === activeTab;
    const matchesSearch = 
      a.title?.toLowerCase().includes(search.toLowerCase()) || 
      a.subject?.toLowerCase().includes(search.toLowerCase()) ||
      a.chapter?.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase mb-2">Assessments</h2>
          <p className="text-white/40 text-sm font-bold uppercase tracking-widest flex items-center gap-2">
            <BookOpen size={14} className="text-purple-400" /> Track Tests & Resources
          </p>
        </div>
        
        {canManage && (
          <button 
            onClick={() => handleOpenModal()}
            className="h-12 px-6 rounded-xl accent-gradient text-white font-bold uppercase text-[11px] tracking-widest shadow-lg shadow-purple-600/20 flex items-center gap-2 group transition-all hover:scale-105 active:scale-95 self-start md:self-auto"
          >
            <Plus size={18} />
            Add Assessment
          </button>
        )}
      </header>

      <section className="flex flex-col gap-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-purple-400 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search Subject, Chapter or Title..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-12 pl-12 pr-4 glass-input bg-white/5 border-white/5 focus:border-purple-500/30 transition-all text-sm"
            />
          </div>

          <div className="flex bg-white/5 p-1 rounded-xl border border-white/5 overflow-x-auto scrollbar-hide">
            {['all', 'ct', 'assignment', 'exam', 'quiz'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  activeTab === tab 
                    ? 'bg-purple-600 text-white shadow-lg' 
                    : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredAssessments.length > 0 ? (
              filteredAssessments.map((a) => {
                const typeInfo = ASSESSMENT_TYPES.find(t => t.id === a.type) || ASSESSMENT_TYPES[0];
                const TypeIcon = typeInfo.icon;
                
                return (
                  <motion.div 
                    layout
                    key={a.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="glass-card group cursor-pointer border-white/5 hover:border-purple-500/20 transition-all flex flex-col p-6"
                    onClick={() => {
                      setSelectedItem(a);
                      setIsDetailsModalOpen(true);
                    }}
                  >
                    <div className="flex items-start justify-between mb-6">
                      <div className={`p-3 rounded-xl ${typeInfo.bg} ${typeInfo.color}`}>
                        <TypeIcon size={24} />
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        {canManage && (
                          <>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenModal(a);
                              }}
                              className="p-2 rounded-lg bg-white/5 text-blue-400 hover:bg-blue-400/20 transition-all"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                confirmDelete(a);
                              }}
                              className="p-2 rounded-lg bg-white/5 text-red-400 hover:bg-red-400/20 transition-all"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="mb-6">
                      <h4 className="text-xl font-bold text-white mb-2 uppercase tracking-tight group-hover:text-purple-400 transition-colors">{a.subject}</h4>
                      <div className="flex items-center gap-2">
                         <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${typeInfo.bg} ${typeInfo.color}`}>
                           {typeInfo.label}
                         </span>
                         <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest">
                           {a.chapter}
                         </span>
                      </div>
                    </div>

                    <div className="space-y-3 mt-auto">
                      <div className="flex items-center gap-3 text-white/50">
                        <Calendar size={14} className="text-purple-400/50" />
                        <span className="text-xs font-medium">{formatReadableDate(a.date)}</span>
                      </div>
                      <div className="flex items-center gap-3 text-white/50">
                        <Clock size={14} className="text-purple-400/50" />
                        <span className="text-xs font-medium">{a.time || 'TBA'}</span>
                      </div>
                      <div className="flex items-center gap-3 text-white/40 pt-4 border-t border-white/5">
                        <MapPin size={12} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">{a.room || 'No Room'}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              !loading && (
                <div className="col-span-full py-20 glass flex flex-col items-center text-center">
                  <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 text-white/10">
                    <BookOpen size={40} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-tight">No Items Found</h3>
                  <p className="text-white/40 text-sm max-w-xs">There are no assessments matching your criteria at this moment.</p>
                </div>
              )
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Assessment' : 'New Assessment'}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Type</label>
              <select 
                value={formData.type} 
                onChange={e => setFormData({...formData, type: e.target.value})}
                className="glass-input w-full"
                required
              >
                {ASSESSMENT_TYPES.map(t => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Subject</label>
                <input 
                  required={formData.type === 'ct'} 
                  value={formData.subject || ''} 
                  onChange={e => setFormData({...formData, subject: e.target.value})} 
                  className="glass-input w-full" 
                  placeholder="e.g. Quantum Physics"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Topic / Title</label>
                <input 
                  required 
                  value={formData.title || ''} 
                  onChange={e => setFormData({...formData, title: e.target.value})} 
                  className="glass-input w-full" 
                  placeholder="e.g. Periodic Table"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Chapter / Details</label>
              <input 
                value={formData.chapter || ''} 
                onChange={e => setFormData({...formData, chapter: e.target.value})} 
                className="glass-input w-full" 
                placeholder="e.g. Chapter 4, 5"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Date</label>
                <input 
                  type="date" 
                  required 
                  value={formData.date || ''} 
                  onChange={e => setFormData({...formData, date: e.target.value})} 
                  className="glass-input w-full"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Time</label>
                <input 
                  type="time" 
                  required={formData.type === 'ct'} 
                  value={formData.time || ''} 
                  onChange={e => setFormData({...formData, time: e.target.value})} 
                  className="glass-input w-full text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Room</label>
                <input 
                  value={formData.room || ''} 
                  onChange={e => setFormData({...formData, room: e.target.value})} 
                  className="glass-input w-full" 
                  placeholder="e.g. 402"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Teacher</label>
                <input 
                  value={formData.teacher || ''} 
                  onChange={e => setFormData({...formData, teacher: e.target.value})} 
                  className="glass-input w-full" 
                  placeholder="e.g. Dr. Azad"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Resource Title</label>
                <input 
                  value={formData.materialTitle || ''} 
                  onChange={e => setFormData({...formData, materialTitle: e.target.value})} 
                  className="glass-input w-full" 
                  placeholder="e.g. Lecture Notes"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Resource Link</label>
                <input 
                  value={formData.materialLink || ''} 
                  onChange={e => setFormData({...formData, materialLink: e.target.value})} 
                  className="glass-input w-full" 
                  placeholder="e.g. https://drive..."
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Note</label>
              <textarea 
                value={formData.note || ''} 
                onChange={e => setFormData({...formData, note: e.target.value})} 
                className="glass-input w-full h-24 py-3" 
                placeholder="Additional instructions..."
              ></textarea>
            </div>
          </div>

          <div className="pt-6 flex gap-3">
             <button type="button" onClick={() => setIsModalOpen(false)} className="h-12 flex-1 rounded-xl bg-white/5 text-white font-bold uppercase text-[11px] tracking-widest transition-all border border-white/5">Cancel</button>
             <button type="submit" disabled={isSubmitting} className="h-12 flex-[2] rounded-xl accent-gradient text-white font-bold uppercase text-[11px] tracking-widest transition-all shadow-lg shadow-purple-600/20">
               {isSubmitting ? 'Saving...' : editingItem ? 'Save Changes' : 'Create Assessment'}
             </button>
          </div>
        </form>
      </Modal>

      {/* Details Modal */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title={selectedItem?.type ? selectedItem.type.toUpperCase() : 'Assessment Details'}
      >
        {selectedItem && (
          <div className="space-y-6">
            <div className="flex flex-col gap-4">
              <h2 className="text-2xl font-extrabold text-white tracking-tight uppercase leading-tight">{selectedItem.subject}</h2>
              <div className="flex flex-wrap gap-2">
                <span className={`badge ${
                  ASSESSMENT_TYPES.find(t => t.id === selectedItem.type)?.bg || 'bg-white/5'
                } ${
                  ASSESSMENT_TYPES.find(t => t.id === selectedItem.type)?.color || 'text-white'
                }`}>
                  {ASSESSMENT_TYPES.find(t => t.id === selectedItem.type)?.label || selectedItem.type}
                </span>
                <span className="badge border-white/10 text-white/40">
                  {selectedItem.title}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl glass flex items-center justify-center text-purple-400">
                  <Calendar size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Date</p>
                  <p className="text-sm font-semibold text-white">{formatReadableDate(selectedItem.date)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl glass flex items-center justify-center text-blue-400">
                  <Clock size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Time</p>
                  <p className="text-sm font-semibold text-white">{selectedItem.time || "Not specified"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl glass flex items-center justify-center text-emerald-400">
                  <MapPin size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Room</p>
                  <p className="text-sm font-semibold text-white">{selectedItem.room || "Not specified"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl glass flex items-center justify-center text-indigo-400">
                  <User size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Teacher</p>
                  <p className="text-sm font-semibold text-white">{selectedItem.teacher || "Not specified"}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {selectedItem.chapter && (
                <div>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <BookOpen size={14} /> Chapter Details
                  </p>
                  <p className="text-white/80 text-sm bg-white/5 p-4 rounded-xl border border-white/5 leading-relaxed">
                    {selectedItem.chapter}
                  </p>
                </div>
              )}

              {selectedItem.materialLink && (
                <div>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <LinkIcon size={14} /> Study Materials
                  </p>
                  <a 
                    href={selectedItem.materialLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 rounded-xl bg-purple-500/10 border border-purple-500/10 hover:bg-purple-500/20 transition-all text-purple-400"
                  >
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <LinkIcon size={16} />
                    </div>
                    <span className="text-sm font-semibold truncate">{selectedItem.materialTitle || 'Open Resource'}</span>
                    <ChevronRight size={14} className="ml-auto" />
                  </a>
                </div>
              )}

              {selectedItem.note && (
                <div>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Info size={14} /> Additional Note
                  </p>
                  <p className="text-white/60 text-sm bg-white/5 p-4 rounded-xl border border-white/5 leading-relaxed">
                    {selectedItem.note}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-6 mt-6 border-t border-white/5 flex items-center justify-between gap-3 text-white/30 text-[9px] font-bold uppercase tracking-widest">
              <span>Added by: {selectedItem.createdBy}</span>
              <button 
                onClick={() => setIsDetailsModalOpen(false)}
                className="h-10 px-6 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all text-[11px]"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Assessment"
        itemType={editingItem?.type}
        itemName={editingItem?.subject}
        message="This will permanently remove this assessment and associated material links for all students. This action cannot be undone."
        isLoading={isSubmitting}
      />
    </div>
  );
}
