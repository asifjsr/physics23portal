import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, getDocs, query, orderBy, doc, deleteDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Calculator, Plus, Trash2, Edit, Save, RefreshCw, BarChart3, TrendingUp, Info, Edit2 } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { ConfirmModal } from '@/components/ConfirmModal';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';
import { getPermissions } from '@/lib/permissions';
import { usePerformance } from '@/context/PerformanceContext';

interface BackupRecord {
  id: string;
  course: string;
  section1CT1: number;
  section1CT2: number;
  section2CT1: number;
  section2CT2: number;
  section1Best: number;
  section2Best: number;
  ctAverage: number;
  attendanceSection1: number;
  attendanceSection2: number;
  attendanceAverage: number;
  total: number;
}

export default function BackupCounter() {
  const { user, profile } = useAuth();
  const { isApproved } = getPermissions(profile);
  const { lowDataMode, isSlowNetwork } = usePerformance();
  const shouldReduceMotion = lowDataMode || isSlowNetwork;

  const [records, setRecords] = useState<BackupRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BackupRecord | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BackupRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const initialForm = {
    course: '',
    section1CT1: 0,
    section1CT2: 0,
    section2CT1: 0,
    section2CT2: 0,
    attendanceSection1: 0,
    attendanceSection2: 0
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchRecords = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const q = query(collection(db, 'users', user.uid, 'backupRecords'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      setRecords(snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as any);
    } catch (err) {
      console.error("Error fetching backup records:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const calculateResults = (data: typeof initialForm) => {
    const s1Best = Math.max(data.section1CT1, data.section1CT2);
    const s2Best = Math.max(data.section2CT1, data.section2CT2);
    const ctAvg = (s1Best + s2Best) / 2;
    const attAvg = (data.attendanceSection1 + data.attendanceSection2) / 2;
    const tot = ctAvg + attAvg;
    return { 
      section1Best: s1Best, 
      section2Best: s2Best, 
      ctAverage: ctAvg, 
      attendanceAverage: attAvg, 
      total: tot 
    };
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const results = calculateResults(formData);
      const data = { ...formData, ...results, updatedAt: new Date() };
      const ref = collection(db, 'users', user.uid, 'backupRecords');
      if (editingItem) {
        await updateDoc(doc(db, 'users', user.uid, 'backupRecords', editingItem.id), data);
      } else {
        await setDoc(doc(ref), { ...data, createdAt: new Date() });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      handleFirestoreError(err, editingItem ? OperationType.UPDATE : OperationType.CREATE, `users/${user.uid}/backupRecords`);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (item: BackupRecord | null = null) => {
    setEditingItem(item);
    setFormData(item || initialForm);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!user || !deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'backupRecords', deleteTarget.id));
      setIsDeleteModalOpen(false);
      setDeleteTarget(null);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/backupRecords/${deleteTarget.id}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Backup <span className="gradient-text">Counter</span></h1>
          <p className="text-gray-400">Calculate and store your CT marks and attendance averages.</p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn-primary flex items-center gap-2 h-14 px-8">
          <RefreshCw size={20} /> New Calculation
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {records.map(r => (
          <motion.div key={r.id} layout className="glass-card p-8 group relative overflow-hidden glass-card-hover border-white/5">
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 flex gap-2">
               <button onClick={() => handleOpenModal(r)} className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-all font-bold"><Edit2 size={16} /></button>
               <button 
                 onClick={() => {
                   setDeleteTarget(r);
                   setIsDeleteModalOpen(true);
                 }} 
                 className="p-2 rounded-lg bg-red-500/10 text-red-500 group-hover:scale-110 transition-all font-bold"
               >
                 <Trash2 size={16} />
                </button>
            </div>
            
            <div className="flex items-center justify-between mb-8">
               <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                  <BarChart3 size={24} />
               </div>
               <div className="text-right">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Total Mark</p>
                  <p className="text-2xl font-black text-white tabular-nums">{r.total.toFixed(2)}</p>
               </div>
            </div>

            <h3 className="text-xl font-bold text-white mb-6 uppercase tracking-tight truncate">{r.course}</h3>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">CT Average</p>
                <div className="flex items-center gap-2">
                   <span className="text-lg font-bold text-blue-400">{r.ctAverage.toFixed(2)}</span>
                   <span className="text-[10px] text-gray-600 font-bold uppercase">/ 30</span>
                </div>
                <div className="mt-2 flex gap-1">
                   <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: `${(r.ctAverage/30)*100}%` }}></div>
                   </div>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Attendance</p>
                <div className="flex items-center gap-2">
                   <span className="text-lg font-bold text-green-400">{r.attendanceAverage.toFixed(2)}</span>
                   <span className="text-[10px] text-gray-600 font-bold uppercase">/ 10</span>
                </div>
                <div className="mt-2 flex gap-1">
                   <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500" style={{ width: `${(r.attendanceAverage/10)*100}%` }}></div>
                   </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-white/5">
               <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-bold uppercase tracking-widest">Section 1 Marks</span>
                  <span className="text-white font-black">{r.section1CT1}, {r.section1CT2} (Best: {r.section1Best})</span>
               </div>
               <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-bold uppercase tracking-widest">Section 2 Marks</span>
                  <span className="text-white font-black">{r.section2CT1}, {r.section2CT2} (Best: {r.section2Best})</span>
               </div>
            </div>
          </motion.div>
        ))}
        {records.length === 0 && (
          <div className="col-span-full glass-card p-24 text-center">
             <Calculator className="text-gray-700 mx-auto mb-4" size={48} />
             <p className="text-gray-500 font-bold uppercase tracking-widest">Start tracking marks with the counter</p>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? 'Edit Calc' : 'New Backup Calculation'}>
        <form onSubmit={handleSave} className="space-y-6">
           <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-1">Course Name</label>
              <input required value={formData.course} onChange={e => setFormData({...formData, course: e.target.value})} className="glass-input w-full uppercase" placeholder="e.g. QUANTUM MECHANICS" />
           </div>

           <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                 <h4 className="text-xs font-bold text-purple-400 uppercase tracking-widest flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-purple-500 shadow-lg shadow-purple-500" /> Section 1
                 </h4>
                 <div className="space-y-1">
                    <label className="text-[10px] text-gray-500 font-bold">CT 1 (out of 30)</label>
                    <input type="number" step="0.5" max="30" value={formData.section1CT1} onChange={e => setFormData({...formData, section1CT1: parseFloat(e.target.value)})} className="glass-input w-full" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] text-gray-500 font-bold">CT 2 (out of 30)</label>
                    <input type="number" step="0.5" max="30" value={formData.section1CT2} onChange={e => setFormData({...formData, section1CT2: parseFloat(e.target.value)})} className="glass-input w-full" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] text-gray-500 font-bold">Attendance (out of 10)</label>
                    <input type="number" step="0.5" max="10" value={formData.attendanceSection1} onChange={e => setFormData({...formData, attendanceSection1: parseFloat(e.target.value)})} className="glass-input w-full" />
                 </div>
              </div>
              <div className="space-y-4">
                 <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-blue-500 shadow-lg shadow-blue-500" /> Section 2
                 </h4>
                 <div className="space-y-1">
                    <label className="text-[10px] text-gray-500 font-bold">CT 1 (out of 30)</label>
                    <input type="number" step="0.5" max="30" value={formData.section2CT1} onChange={e => setFormData({...formData, section2CT1: parseFloat(e.target.value)})} className="glass-input w-full" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] text-gray-500 font-bold">CT 2 (out of 30)</label>
                    <input type="number" step="0.5" max="30" value={formData.section2CT2} onChange={e => setFormData({...formData, section2CT2: parseFloat(e.target.value)})} className="glass-input w-full" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] text-gray-500 font-bold">Attendance (out of 10)</label>
                    <input type="number" step="0.5" max="10" value={formData.attendanceSection2} onChange={e => setFormData({...formData, attendanceSection2: parseFloat(e.target.value)})} className="glass-input w-full" />
                 </div>
              </div>
           </div>

           <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-600/10 to-blue-600/10 border border-white/5 flex items-center justify-between">
              <div>
                 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-1">Calculated Total</p>
                 <p className="text-3xl font-black text-white tabular-nums">{calculateResults(formData).total.toFixed(2)}</p>
              </div>
              <div className="text-right">
                 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-1">CT Average</p>
                 <p className="text-xl font-bold text-blue-400 tabular-nums">{calculateResults(formData).ctAverage.toFixed(2)}</p>
              </div>
           </div>

           <div className="pt-6 flex gap-3">
             <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary flex-1">Discard</button>
             <button type="submit" disabled={loading} className="btn-primary flex-[2]">
                <Save size={18} className="mr-2" /> Save to Record
             </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Record"
        itemType="Backup Record"
        itemName={deleteTarget?.course}
        message="This will permanently remove this marks calculation from your records. This action cannot be undone."
        isLoading={isDeleting}
      />
    </div>
  );
}
