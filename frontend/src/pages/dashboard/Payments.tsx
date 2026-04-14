import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  MoreVertical, 
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  CreditCard,
  Building2,
  Smartphone,
  X,
  Plus,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { paymentApi } from '../../services/api';
import { format } from 'date-fns';

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    failed: 'bg-rose-50 text-rose-700 border-rose-100',
    pending: 'bg-amber-50 text-amber-700 border-amber-100',
    created: 'bg-slate-50 text-slate-700 border-slate-100',
    refunded: 'bg-purple-50 text-purple-700 border-purple-100',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || styles.pending}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const MethodIcon = ({ method }: { method: string }) => {
  if (method === 'card') return <CreditCard size={14} className="text-slate-400" />;
  if (method === 'upi') return <Smartphone size={14} className="text-slate-400" />;
  return <Building2 size={14} className="text-slate-400" />;
};

const CreatePaymentModal = ({ isOpen, onClose, onSuccess }: any) => {
  const [amount, setAmount] = useState('1.00');
  const [desc, setDesc] = useState('Test Payment');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    try {
      setLoading(true);
      const res = await paymentApi.create({
        amount: parseFloat(amount),
        currency: 'INR',
        description: desc
      });
      onSuccess(res.data.id);
      onClose();
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.detail || error.message || "Unknown error";
      alert(`Failed to create payment: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-lg">Create New Payment</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase">Amount (INR)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">₹</span>
              <input 
                type="number" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-50 border rounded-xl pl-8 pr-4 py-3 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="0.00"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase">Description</label>
            <input 
              type="text" 
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full bg-slate-50 border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="What is this for?"
            />
          </div>
          
          <button 
            onClick={handleCreate}
            disabled={loading}
            className="w-full bg-black text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
            Create Payment
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const Payments = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await paymentApi.list();
      setPayments(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleSuccess = (id: string) => {
    fetchPayments();
    window.open(`/checkout/${id}`, '_blank');
  };

  const exportToCSV = () => {
    if (filteredPayments.length === 0) return;
    
    const headers = ['Payment ID', 'Amount', 'Currency', 'Status', 'Method', 'Description', 'Created At'];
    const rows = filteredPayments.map(p => [
      p.id,
      p.amount,
      p.currency,
      p.status,
      p.method || 'N/A',
      p.description || '',
      format(new Date(p.created_at), 'yyyy-MM-dd HH:mm:ss')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `novapay_export_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredPayments = payments.filter(p => 
    p.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
          <p className="text-muted-foreground">List of all transactions made through your gateway.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium bg-white hover:bg-slate-50 transition-colors"
          >
            <Download size={16} /> Export
          </button>
          <button 
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus size={16} /> New Payment
          </button>
        </div>
      </div>

      <CreatePaymentModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        onSuccess={handleSuccess} 
      />

      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        {/* Filters bar */}
        <div className="p-4 border-b flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <input 
                type="text" 
                placeholder="Search by ID or description..." 
                className="w-full bg-white border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="p-2 border bg-white rounded-lg hover:bg-slate-50 transition-colors">
              <Filter size={16} />
            </button>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Showing {filteredPayments.length} results</span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto min-h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
              <Loader2 className="animate-spin mb-4" size={32} />
              <p>Loading payments...</p>
            </div>
          ) : filteredPayments.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b">
                  <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Payment ID</th>
                  <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Method</th>
                  <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</th>
                  <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="divide-y text-slate-700">
                {filteredPayments.map((payment) => (
                  <tr 
                    key={payment.id} 
                    className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                    onClick={() => window.open(`/checkout/${payment.id}`, '_blank')}
                  >
                    <td className="px-6 py-4">
                      <span className="text-sm font-mono font-medium flex items-center gap-1">
                        {payment.id}
                        <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" />
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold">₹{payment.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={payment.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm">
                        <MethodIcon method={payment.method || 'pending'} />
                        <span className="capitalize">{payment.method || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-muted-foreground truncate max-w-[150px] inline-block">
                        {payment.description || 'No description'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {format(new Date(payment.created_at), 'MMM d, HH:mm')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-1 hover:bg-slate-200 rounded text-slate-400 transition-colors">
                        <MoreVertical size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
              <p>No payments found.</p>
            </div>
          )}
        </div>

        {/* Pagination mock */}
        <div className="p-4 border-t flex items-center justify-between bg-slate-50/50">
          <div className="flex gap-2">
            <button className="p-2 border bg-white rounded-lg disabled:opacity-50" disabled>
              <ChevronLeft size={16} />
            </button>
            <button className="p-2 border bg-white rounded-lg hover:bg-slate-50">
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="text-xs text-muted-foreground">
            {filteredPayments.length} transactions total
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payments;
