import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Wallet, ArrowDownCircle, ArrowUpCircle, Info, DollarSign, Calendar, Clock, User, Trash2, Edit2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getPermissions } from '@/lib/permissions';
import { doc, deleteDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';
import { ConfirmModal } from '@/components/ConfirmModal';

interface FundRecord {
  id: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
  note: string;
  addedBy: string;
}

export default function BatchFund() {
  const { profile } = useAuth();
  const { canManageShared } = getPermissions(profile);
  const [funds, setFunds] = useState<FundRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FundRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'classFund'), orderBy('date', 'desc')), 
      (s) => {
        setFunds(s.docs.map(d => ({ id: d.id, ...d.data() })) as any);
        setLoading(false);
      },
      (error) => {
        console.error("SNAPSHOT ERROR", {
          path: "classFund",
          code: error.code,
          message: error.message,
          uid: profile?.uid,
          role: profile?.role,
          status: profile?.status
        });
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [profile]);

  const totalIncome = funds.filter(f => f.type === 'income').reduce((sum, f) => sum + f.amount, 0);
  const totalExpense = funds.filter(f => f.type === 'expense').reduce((sum, f) => sum + f.amount, 0);
  const balance = totalIncome - totalExpense;

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Batch<span className="gradient-text">Fund</span></h1>
          <p className="text-gray-400">Transparent oversight of batch class funds and expenses.</p>
        </div>
      </div>

      {/* Summary Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="glass-card p-8 bg-gradient-to-br from-purple-600/20 to-blue-600/20 relative overflow-hidden group border-purple-500/20">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
             <Wallet size={80} />
          </div>
          <p className="text-xs font-bold text-purple-400 uppercase tracking-[0.2em] mb-4">Current Balance</p>
          <h3 className="text-4xl font-extrabold text-white flex items-center gap-2">
            <span className="text-2xl text-purple-400 opacity-50">$</span>{balance.toLocaleString()}
          </h3>
        </div>
        <div className="glass-card p-8 relative overflow-hidden border-green-500/10">
          <p className="text-xs font-bold text-green-500 opacity-70 uppercase tracking-[0.2em] mb-4">Total Collected</p>
          <h3 className="text-3xl font-extrabold text-white flex items-center gap-2">
            <ArrowUpCircle className="text-green-500" size={24} /> {totalIncome.toLocaleString()}
          </h3>
        </div>
        <div className="glass-card p-8 relative overflow-hidden border-red-500/10">
          <p className="text-xs font-bold text-red-500 opacity-70 uppercase tracking-[0.2em] mb-4">Total Spent</p>
          <h3 className="text-3xl font-extrabold text-white flex items-center gap-2">
            <ArrowDownCircle className="text-red-500" size={24} /> {totalExpense.toLocaleString()}
          </h3>
        </div>
      </section>

      {/* Transaction List */}
      <section className="space-y-6">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest px-4">Transaction History</h3>
        
        {loading ? (
          <div className="space-y-4">
             {[1,2,3,4,5].map(i => <div key={i} className="glass-card h-20 animate-pulse bg-white/5"></div>)}
          </div>
        ) : funds.length > 0 ? (
          <div className="glass-card overflow-hidden border-white/5">
            <div className="hidden lg:grid lg:grid-cols-5 p-4 border-b border-white/10 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] bg-white/5">
               <span>Date</span>
               <span className="col-span-2">Description</span>
               <span>In/Out</span>
               <span className="text-right">Manage</span>
            </div>
            <div className="divide-y divide-white/5">
              {funds.map((fund, idx) => (
                <div key={fund.id} className="lg:grid lg:grid-cols-5 items-center p-6 lg:p-4 hover:bg-white/5 transition-all">
                  <div className="mb-2 lg:mb-0">
                    <p className="text-xs font-bold text-white flex items-center gap-2">
                      <Calendar size={14} className="text-gray-500" /> {fund.date}
                    </p>
                  </div>
                  <div className="lg:col-span-2 mb-4 lg:mb-0">
                    <h4 className="text-sm font-bold text-white">{fund.title}</h4>
                    {fund.note && <p className="text-[10px] text-gray-500 mt-1 italic">{fund.note}</p>}
                  </div>
                  <div className="mb-4 lg:mb-0">
                     <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-extrabold ${fund.type === 'income' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        {fund.type === 'income' ? <ArrowUpCircle size={14} /> : <ArrowDownCircle size={14} />}
                        <span className="opacity-50">$</span>{fund.amount.toLocaleString()}
                     </div>
                  </div>
                  <div className="flex items-center lg:justify-end gap-3 text-[10px] text-gray-500 font-bold uppercase tracking-widest group">
                     <span className="flex items-center gap-1.5"><User size={12} className="text-purple-400 opacity-70" /> {fund.addedBy}</span>
                     {canManageShared && (
                       <div className="flex gap-1 ml-2">
                         <button 
                           onClick={() => {
                             setDeleteTarget(fund);
                             setIsDeleteModalOpen(true);
                           }}
                           className="p-1.5 rounded-lg bg-white/5 text-red-400 hover:bg-red-400/20 transition-all"
                         >
                           <Trash2 size={12} />
                         </button>
                       </div>
                     )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="glass-card p-24 text-center border-dashed border-white/10">
            <Info className="text-gray-700 mb-4 mx-auto" size={48} />
             <p className="text-gray-500 font-bold uppercase tracking-widest">No transactions recorded</p>
          </div>
        )}
      </section>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          setIsDeleting(true);
          try {
            await deleteDoc(doc(db, 'classFund', deleteTarget.id));
            setIsDeleteModalOpen(false);
            setDeleteTarget(null);
          } catch (err: any) {
             handleFirestoreError(err, OperationType.DELETE, `classFund/${deleteTarget.id}`);
          } finally {
            setIsDeleting(false);
          }
        }}
        title="Delete Transaction"
        itemType="Transaction"
        itemName={deleteTarget?.title}
        message="This will permanently delete this record from the class fund history. Only do this if the entry was incorrect."
        isLoading={isDeleting}
      />
    </div>
  );
}
