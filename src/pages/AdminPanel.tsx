import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  setDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { 
  Info,
  BookOpen,
  Users, 
  ShieldCheck, 
  Calendar, 
  DollarSign, 
  Camera, 
  ShieldOff, 
  Check, 
  X, 
  Trash2, 
  Plus, 
  Edit, 
  UserCog, 
  ToggleLeft, 
  ToggleRight,
  Database,
  Target,
  Search,
  MoreVertical,
  ChevronRight
} from 'lucide-react';
import { Modal } from '@/components/Modal';
import { ConfirmModal } from '@/components/ConfirmModal';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';
import { getPermissions } from '@/lib/permissions';
import { getLocalDateString } from '@/lib/date';
import { normalizeEventType } from '@/lib/eventTypes';

export default function AdminPanel() {
  const { profile, settings } = useAuth();
  const { isAdmin, isCR, canManageUsers, canManageShared } = getPermissions(profile);
  const [activeTab, setActiveTab] = useState<'users' | 'events' | 'people' | 'fund' | 'album' | 'notices' | 'assessments'>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [batchmates, setBatchmates] = useState<any[]>([]);
  const [funds, setFunds] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!profile || profile.status !== 'approved') return;

    const errorHandler = (collectionName: string) => (error: any) => {
      console.error(`SNAPSHOT ERROR [${collectionName}]:`, error);
      setErrors(prev => ({ ...prev, [collectionName]: `${error.code}: ${error.message}` }));
    };

    const unsubUsers = isAdmin ? onSnapshot(collection(db, 'users'), 
      (s) => setUsers(s.docs.map(d => ({ id: d.id, ...d.data() }))),
      errorHandler('users')
    ) : () => {};

    const unsubEvents = isCR ? onSnapshot(query(collection(db, 'globalCalendarEvents'), orderBy('date', 'desc')), 
      (s) => setEvents(s.docs.map(d => ({ id: d.id, ...d.data() }))),
      errorHandler('events')
    ) : () => {};

    const unsubAssessments = isCR ? onSnapshot(query(collection(db, 'assessments'), orderBy('date', 'desc')), 
      (s) => setAssessments(s.docs.map(d => ({ id: d.id, ...d.data() }))),
      errorHandler('assessments')
    ) : () => {};

    const unsubPeople = isCR ? onSnapshot(collection(db, 'batchmates'), 
      (s) => setBatchmates(s.docs.map(d => ({ id: d.id, ...d.data() }))),
      errorHandler('people')
    ) : () => {};

    const unsubFund = isCR ? onSnapshot(query(collection(db, 'classFund'), orderBy('date', 'desc')), 
      (s) => setFunds(s.docs.map(d => ({ id: d.id, ...d.data() }))),
      errorHandler('fund')
    ) : () => {};

    const unsubPhotos = isCR ? onSnapshot(query(collection(db, 'album'), orderBy('createdAt', 'desc')), 
      (s) => setPhotos(s.docs.map(d => ({ id: d.id, ...d.data() }))),
      errorHandler('album')
    ) : () => {};

    const unsubNotices = isCR ? onSnapshot(query(collection(db, 'notices'), orderBy('createdAt', 'desc')), 
      (s) => setNotices(s.docs.map(d => ({ id: d.id, ...d.data() }))),
      errorHandler('notices')
    ) : () => {};

    return () => {
      unsubUsers(); unsubEvents(); unsubAssessments(); unsubPeople(); unsubFund(); unsubPhotos(); unsubNotices();
    };
  }, [profile, isAdmin, isCR]);

  const handleUpdateUserStatus = async (uid: string, status: 'approved' | 'rejected') => {
    await updateDoc(doc(db, 'users', uid), { status });
  };

  const handleUpdateUserRole = async (uid: string, role: string) => {
    await updateDoc(doc(db, 'users', uid), { role });
  };

  const handleToggleApproval = async () => {
    await updateDoc(doc(db, 'settings', 'app'), { loginApprovalRequired: !settings?.loginApprovalRequired });
  };

  const handleOpenModal = (tab: any, item: any = null) => {
    setEditingItem(item);
    if (item) {
      setFormData(item);
    } else {
      const defaults: any = {
        date: getLocalDateString(),
      };
      if (tab === 'events') defaults.type = 'event';
      if (tab === 'assessments') defaults.type = 'ct';
      if (tab === 'people') {
        defaults.role = 'student';
        defaults.studentId = '';
        defaults.name = '';
      }
      if (tab === 'fund') {
        defaults.type = 'income';
        defaults.amount = 0;
      }
      setFormData(defaults);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let coll = '';
      if (activeTab === 'events') coll = 'globalCalendarEvents';
      if (activeTab === 'assessments') coll = 'assessments';
      if (activeTab === 'people') coll = 'batchmates';
      if (activeTab === 'fund') coll = 'classFund';
      if (activeTab === 'album') coll = 'album';
      if (activeTab === 'notices') coll = 'notices';

      const data = {
        ...formData,
        updatedAt: new Date(),
        updatedBy: profile?.name,
        updatedByUid: profile?.uid
      };

      if (!editingItem) {
        data.createdAt = new Date();
        data.createdBy = profile?.name;
        data.createdByUid = profile?.uid;
        await setDoc(doc(collection(db, coll)), data);
      } else {
        await updateDoc(doc(db, coll, editingItem.id), data);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      handleFirestoreError(err, editingItem ? OperationType.UPDATE : OperationType.CREATE, activeTab);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (item: any) => {
    setDeleteTarget(item);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      let coll = '';
      if (activeTab === 'users') coll = 'users';
      if (activeTab === 'events') coll = 'globalCalendarEvents';
      if (activeTab === 'assessments') coll = 'assessments';
      if (activeTab === 'people') coll = 'batchmates';
      if (activeTab === 'fund') coll = 'classFund';
      if (activeTab === 'album') coll = 'album';
      if (activeTab === 'notices') coll = 'notices';
      
      await deleteDoc(doc(db, coll, deleteTarget.id));
      setIsDeleteModalOpen(false);
      setDeleteTarget(null);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.DELETE, `${activeTab}/${deleteTarget.id}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const seedFundData = async () => {
    const data = [
      { title: "Total Collected Money", amount: 2600, type: "income", date: "2024-05-15", note: "Initial collection" },
      { title: "Ezaz's Expenses", amount: 840, type: "expense", date: "2024-05-15", note: "Expenses for Ezaz" },
      { title: "Parvez Sir's Farewell", amount: 1000, type: "expense", date: "2024-05-15", note: "Farewell payment" }
    ];

    setLoading(true);
    const batch = writeBatch(db);
    data.forEach(item => {
      const ref = doc(collection(db, 'classFund'));
      batch.set(ref, {
        ...item,
        createdAt: new Date(),
        createdBy: profile?.name,
        createdByUid: profile?.uid
      });
    });

    try {
      await batch.commit();
      // Also set the goal
      await updateDoc(doc(db, 'settings', 'app'), {
        fundGoalAmount: 1500,
        fundGoalTitle: "Required for Futsal"
      });
      alert('Fund data synchronized from the image!');
    } catch(err: any) {
      alert(`Sync failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const seedBatchmates = async () => {
    const data = [
      { studentId: "231701", name: "NAWSHIN KHAN", role: "student", imageUrl: "" },
      { studentId: "231703", name: "ANIKA TASNIM", role: "student", imageUrl: "" },
      { studentId: "231705", name: "APU KUMER PAL", role: "student", imageUrl: "" },
      { studentId: "231708", name: "MST. FARJANA MAHIN", role: "student", imageUrl: "" },
      { studentId: "231709", name: "MD. SAIFUL ISLAM MANIK", role: "student", imageUrl: "" },
      { studentId: "231710", name: "SEJANUR RAHMAN SEJAN", role: "student", imageUrl: "" },
      { studentId: "231711", name: "MST. TANIMA JANNAT HASHI", role: "student", imageUrl: "" },
      { studentId: "231713", name: "MD. SHAKIB", role: "cr", imageUrl: "" },
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

    setLoading(true);
    const batch = writeBatch(db);
    data.forEach(item => {
      const ref = doc(db, 'batchmates', item.studentId);
      batch.set(ref, {
        ...item,
        updatedAt: new Date()
      }, { merge: true });
    });
    try {
      await batch.commit();
      alert('Batchmates database updated with 26 students!');
    } catch(err: any) {
      alert(`Seeding failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Admin <span className="gradient-text">Panel</span></h1>
          <p className="text-gray-400">Manage users, batch data and global settings.</p>
        </div>
        <div className="flex gap-3">
           {activeTab === 'fund' && (
             <button onClick={seedFundData} disabled={loading} className="btn-secondary flex items-center gap-2 text-sm h-12 border-blue-500/20 text-blue-400">
               <Database size={18} /> Sync Fund from Image
             </button>
           )}
           <button onClick={seedBatchmates} disabled={loading} className="btn-secondary flex items-center gap-2 text-sm h-12">
             <Database size={18} /> Seed Batchmates
           </button>
           <button 
             onClick={handleToggleApproval}
             className={`flex items-center gap-3 px-6 py-3 rounded-xl font-bold text-sm transition-all border ${settings?.loginApprovalRequired ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' : 'bg-green-500/10 border-green-500/20 text-green-400'}`}
           >
             {settings?.loginApprovalRequired ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
             Auto-Approval: {settings?.loginApprovalRequired ? 'OFF' : 'ON'}
           </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-2 p-1 bg-white/5 border border-white/10 rounded-2xl sticky top-4 z-20 backdrop-blur-xl scrollbar-hide">
        {[
          { id: 'users', label: 'Users', icon: Users, permission: isAdmin },
          { id: 'notices', label: 'Notices', icon: Info, permission: canManageShared },
          { id: 'events', label: 'Calendar', icon: Calendar, permission: canManageShared },
          { id: 'assessments', label: 'Assessments', icon: BookOpen, permission: canManageShared },
          { id: 'people', label: 'People', icon: UserCog, permission: canManageShared },
          { id: 'fund', label: 'Fund', icon: DollarSign, permission: canManageShared },
          { id: 'album', label: 'Album', icon: Camera, permission: canManageShared }
        ].filter(t => t.permission).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
              activeTab === tab.id ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-gray-500 hover:text-white hover:bg-white/5'
            }`}
          >
            <tab.icon size={18} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <section className="animate-in slide-in-from-bottom-4 duration-500">
        {/* Error States */}
        {errors[activeTab] && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400">
            <X size={18} />
            <p className="text-xs font-bold uppercase tracking-widest">
              Permission Error: {errors[activeTab]}
            </p>
          </div>
        )}

        {/* User Management */}
        {activeTab === 'users' && (
          <div className="glass-card overflow-hidden">
            <div className="grid grid-cols-5 p-4 border-b border-white/5 text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-white/5">
               <span className="col-span-2">Student Info</span>
               <span>Role</span>
               <span>Status</span>
               <span className="text-right">Actions</span>
            </div>
            <div className="divide-y divide-white/5">
              {users.map(u => (
                <div key={u.id} className="grid grid-cols-5 items-center p-4 hover:bg-white/5 transition-colors">
                  <div className="col-span-2 flex items-center gap-3">
                    <img src={u.photoURL || `https://ui-avatars.com/api/?name=${u.name}`} className="w-10 h-10 rounded-xl object-cover ring-2 ring-white/10" alt="" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate">{u.name}</p>
                      <p className="text-xs text-gray-500 truncate">{u.email}</p>
                    </div>
                  </div>
                  <div>
                    <select 
                      value={u.role} 
                      onChange={(e) => handleUpdateUserRole(u.id, e.target.value)}
                      className="bg-white/5 border border-white/10 text-xs text-white rounded-lg px-2 py-1 outline-none font-semibold focus:ring-1 focus:ring-purple-500 transition-all uppercase"
                    >
                      <option value="student">Student</option>
                      <option value="cr">CR</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                      u.status === 'approved' ? 'bg-green-500/10 text-green-400' :
                      u.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400' :
                      'bg-red-500/10 text-red-500'
                    }`}>
                      {u.status}
                    </span>
                  </div>
                  <div className="flex justify-end gap-2">
                    {u.status !== 'approved' && (
                      <button onClick={() => handleUpdateUserStatus(u.id, 'approved')} className="p-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-all">
                        <Check size={16} />
                      </button>
                    )}
                    {u.status !== 'rejected' && (
                      <button onClick={() => handleUpdateUserStatus(u.id, 'rejected')} className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all">
                        <ShieldOff size={16} />
                      </button>
                    )}
                    {canManageUsers && (
                      <button onClick={() => confirmDelete(u)} className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Other Tabs with Add Button */}
        {['events', 'assessments', 'people', 'fund', 'album', 'notices'].includes(activeTab) && (
          <div className="space-y-6">
            <div className="flex items-center justify-between px-4">
               <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">
                 {activeTab} Management ({
                   activeTab === 'events' ? events.length : 
                   activeTab === 'assessments' ? assessments.length :
                   activeTab === 'people' ? batchmates.length : 
                   activeTab === 'fund' ? funds.length : 
                   activeTab === 'notices' ? notices.length :
                   photos.length
                 })
               </h3>
               <button onClick={() => handleOpenModal(activeTab)} className="btn-primary py-2 px-4 text-xs flex items-center gap-2 h-auto rounded-lg">
                 <Plus size={16} /> Add New {activeTab === 'album' ? 'Photo' : activeTab.slice(0, -1)}
               </button>
            </div>

            {activeTab === 'fund' && (
              <div className="glass-card mb-6 p-6 border-purple-500/20 bg-purple-500/5">
                <h4 className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <Target size={14} /> Fund Goal Management
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Goal Title</label>
                    <input 
                      value={settings?.fundGoalTitle || ''} 
                      onChange={e => updateDoc(doc(db, 'settings', 'app'), { fundGoalTitle: e.target.value })} 
                      className="glass-input w-full" 
                      placeholder="e.g. Required for Futsal" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Goal Amount (৳)</label>
                    <input 
                      type="number" 
                      value={settings?.fundGoalAmount || 0} 
                      onChange={e => updateDoc(doc(db, 'settings', 'app'), { fundGoalAmount: parseFloat(e.target.value) || 0 })} 
                      className="glass-input w-full" 
                      placeholder="1500" 
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(
                activeTab === 'events' ? events : 
                activeTab === 'assessments' ? assessments :
                activeTab === 'people' ? batchmates : 
                activeTab === 'fund' ? funds : 
                activeTab === 'notices' ? notices :
                photos
              ).map((item: any) => (
                <div key={item.id} className="glass-card p-4 flex flex-col group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="min-w-0">
                      <h4 className="font-bold text-white truncate text-sm">{item.title || item.name || item.subject || 'Untitled'}</h4>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                        {item.date || item.studentId || item.type || 'No Date'}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => handleOpenModal(activeTab, item)} className="p-2 rounded-lg bg-white/5 text-blue-400 hover:bg-blue-500/10 transition-all opacity-0 group-hover:opacity-100">
                        <Edit size={14} />
                      </button>
                      <button onClick={() => confirmDelete(item)} className="p-2 rounded-lg bg-white/5 text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  {activeTab === 'fund' && (
                    <p className={`text-lg font-extrabold ${item.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                      {item.type === 'income' ? '+' : '-'}৳{item.amount?.toLocaleString()}
                    </p>
                  )}
                  {activeTab === 'album' && item.imageUrl && (
                    <img src={item.imageUrl} className="w-full h-32 object-cover rounded-xl mt-2" alt="" />
                  )}
                  {activeTab === 'notices' && (
                    <p className="text-xs text-gray-400 line-clamp-3 italic">"{item.content}"</p>
                  )}
                </div>
              ))}
            </div>
            {(
              (activeTab === 'events' && events.length === 0) || 
              (activeTab === 'assessments' && assessments.length === 0) ||
              (activeTab === 'people' && batchmates.length === 0) ||
              (activeTab === 'notices' && notices.length === 0)
            ) ? (
               <div className="glass-card p-20 text-center flex flex-col items-center">
                  <Database className="text-gray-700 mb-4" size={48} />
                  <p className="text-gray-500 font-bold uppercase tracking-widest">No records found</p>
                  <button onClick={() => handleOpenModal(activeTab)} className="text-purple-400 text-xs font-bold mt-2 hover:underline">Add First Record</button>
               </div>
            ) : null}
          </div>
        )}
      </section>

      {/* Dynamic Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingItem ? `Edit ${activeTab.slice(0, -1)}` : `Add ${activeTab.slice(0, -1)}`}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {activeTab === 'events' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Title</label>
                  <input required value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} className="glass-input w-full" placeholder="Event Title" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Type</label>
                  <select required value={formData.type || ''} onChange={e => setFormData({...formData, type: e.target.value})} className="glass-input w-full appearance-none">
                    <option value="class">Class</option>
                    <option value="event">Event</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Subject</label>
                  <input required value={formData.subject || ''} onChange={e => setFormData({...formData, subject: e.target.value})} className="glass-input w-full" placeholder="Physics" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Room</label>
                  <input value={formData.room || ''} onChange={e => setFormData({...formData, room: e.target.value})} className="glass-input w-full" placeholder="L-301" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Date</label>
                  <input type="date" required value={formData.date || ''} onChange={e => setFormData({...formData, date: e.target.value})} className="glass-input w-full" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Time</label>
                  <input type="time" value={formData.time || ''} onChange={e => setFormData({...formData, time: e.target.value})} className="glass-input w-full text-white invert" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Teacher</label>
                <input value={formData.teacher || ''} onChange={e => setFormData({...formData, teacher: e.target.value})} className="glass-input w-full" placeholder="Dr. Smith" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Material Title</label>
                  <input value={formData.materialTitle || ''} onChange={e => setFormData({...formData, materialTitle: e.target.value})} className="glass-input w-full" placeholder="Notes title" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Material Link</label>
                  <input value={formData.materialLink || ''} onChange={e => setFormData({...formData, materialLink: e.target.value})} className="glass-input w-full" placeholder="URL" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Note</label>
                <textarea value={formData.note || ''} onChange={e => setFormData({...formData, note: e.target.value})} className="glass-input w-full h-24" placeholder="Extra info..."></textarea>
              </div>
            </>
          )}

          {activeTab === 'assessments' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Subject</label>
                  <input required value={formData.subject || ''} onChange={e => setFormData({...formData, subject: e.target.value})} className="glass-input w-full" placeholder="Quantum Physics" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Type</label>
                  <select required value={formData.type || 'ct'} onChange={e => setFormData({...formData, type: e.target.value})} className="glass-input w-full appearance-none">
                    <option value="ct">CT</option>
                    <option value="assignment">Assignment</option>
                    <option value="exam">Exam</option>
                    <option value="quiz">Quiz</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Chapter / Title</label>
                <input required value={formData.chapter || ''} onChange={e => setFormData({...formData, chapter: e.target.value})} className="glass-input w-full" placeholder="Chapter 1-3" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Date</label>
                  <input type="date" required value={formData.date || ''} onChange={e => setFormData({...formData, date: e.target.value})} className="glass-input w-full" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Time</label>
                  <input type="time" value={formData.time || ''} onChange={e => setFormData({...formData, time: e.target.value})} className="glass-input w-full text-white invert" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Room</label>
                  <input value={formData.room || ''} onChange={e => setFormData({...formData, room: e.target.value})} className="glass-input w-full" placeholder="402" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Teacher</label>
                  <input value={formData.teacher || ''} onChange={e => setFormData({...formData, teacher: e.target.value})} className="glass-input w-full" placeholder="Teacher Name" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Material Title</label>
                  <input value={formData.materialTitle || ''} onChange={e => setFormData({...formData, materialTitle: e.target.value})} className="glass-input w-full" placeholder="Lecture Notes" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Material Link</label>
                  <input value={formData.materialLink || ''} onChange={e => setFormData({...formData, materialLink: e.target.value})} className="glass-input w-full" placeholder="Drive URL" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Note</label>
                <textarea value={formData.note || ''} onChange={e => setFormData({...formData, note: e.target.value})} className="glass-input w-full h-24" placeholder="Extra instructions..."></textarea>
              </div>
            </>
          )}

          {activeTab === 'people' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">ID</label>
                  <input required value={formData.studentId || ''} onChange={e => setFormData({...formData, studentId: e.target.value})} className="glass-input w-full" placeholder="231701" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Name</label>
                  <input required value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="glass-input w-full" placeholder="John Doe" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Role</label>
                  <input value={formData.role || ''} onChange={e => setFormData({...formData, role: e.target.value})} className="glass-input w-full" placeholder="Student / CR" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Phone</label>
                  <input value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} className="glass-input w-full" placeholder="+880..." />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Image URL</label>
                <input value={formData.imageUrl || ''} onChange={e => setFormData({...formData, imageUrl: e.target.value})} className="glass-input w-full" placeholder="https://..." />
              </div>
            </>
          )}

          {activeTab === 'fund' && (
            <>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Title</label>
                <input required value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} className="glass-input w-full" placeholder="Title" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Amount</label>
                  <input type="number" required value={formData.amount ?? ''} onChange={e => setFormData({...formData, amount: e.target.value === '' ? 0 : parseFloat(e.target.value)})} className="glass-input w-full" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Type</label>
                  <select required value={formData.type || ''} onChange={e => setFormData({...formData, type: e.target.value})} className="glass-input w-full">
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Date</label>
                <input type="date" required value={formData.date || ''} onChange={e => setFormData({...formData, date: e.target.value})} className="glass-input w-full" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Note</label>
                <textarea value={formData.note || ''} onChange={e => setFormData({...formData, note: e.target.value})} className="glass-input w-full h-24" placeholder="Details..."></textarea>
              </div>
            </>
          )}

          {activeTab === 'album' && (
            <>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Title</label>
                <input required value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} className="glass-input w-full" placeholder="Farewell Party" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Image URL</label>
                <input required value={formData.imageUrl || ''} onChange={e => setFormData({...formData, imageUrl: e.target.value})} className="glass-input w-full" placeholder="Direct link to image" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Drive URL (Optional)</label>
                <input value={formData.driveUrl || ''} onChange={e => setFormData({...formData, driveUrl: e.target.value})} className="glass-input w-full" placeholder="Google Drive link" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Caption</label>
                <textarea value={formData.caption || ''} onChange={e => setFormData({...formData, caption: e.target.value})} className="glass-input w-full h-24" placeholder="Memory details..."></textarea>
              </div>
            </>
          )}

          {activeTab === 'notices' && (
            <>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Notice Title</label>
                <input required value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} className="glass-input w-full" placeholder="Important Announcement" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Content</label>
                <textarea required value={formData.content || ''} onChange={e => setFormData({...formData, content: e.target.value})} className="glass-input w-full h-32 py-4" placeholder="Notice details..."></textarea>
              </div>
            </>
          )}

          <div className="pt-6 flex gap-3">
             <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary flex-1 h-12">Cancel</button>
             <button type="submit" disabled={loading} className="btn-primary flex-[2] h-12">
               {loading ? 'Saving...' : 'Save Changes'}
             </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title={`Delete ${activeTab === 'people' ? 'Batchmate' : activeTab === 'fund' ? 'Transaction' : activeTab.slice(0, -1)}`}
        itemType={activeTab.slice(0, -1)}
        itemName={deleteTarget?.name || deleteTarget?.title || deleteTarget?.subject}
        message={`This will permanently remove this ${activeTab === 'users' ? 'user account' : 'entry'} from the database. This action cannot be undone.`}
        isLoading={isDeleting}
      />
    </div>
  );
}
