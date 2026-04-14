import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  RotateCcw,
  Loader2,
  AlertCircle,
  MoreVertical,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { paymentApi } from '../../services/api';
import { format } from 'date-fns';

const Refunds = () => {
  const [refunds, setRefunds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [targetPaymentId, setTargetPaymentId] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchRefunds = async () => {
    try {
      setLoading(true);
      // Backend doesn't have a list refunds for all payments endpoint currently
      // but we can list all payments and filter those that are refunded for now
      // or just show an empty list if we want to be strict.
      // For the demo, we'll fetch all payments and filter refunded status.
      const res = await paymentApi.list();
      setRefunds(res.data.filter((p: any) => p.status === 'refunded'));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRefunds();
  }, []);

  const handleInitiateRefund = async () => {
    if (!targetPaymentId) return;
    try {
      setProcessing(true);
      await paymentApi.refund(targetPaymentId, parseFloat(refundAmount) || 0);
      setTargetPaymentId('');
      setRefundAmount('');
      fetchRefunds();
      alert("Refund processed successfully!");
    } catch (error) {
      console.error(error);
      alert("Failed to process refund. Ensure payment ID is valid and in 'success' status.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Refunds</h1>
        <p className="text-muted-foreground">Manage and track your customer refunds.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Initiate Refund Card */}
        <div className="md:col-span-1 border rounded-xl bg-white p-6 shadow-sm h-fit space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <RotateCcw size={18} className="text-primary" />
            <h3 className="font-semibold">Initiate Refund</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase flex gap-1 items-center">
                Payment ID <AlertCircle size={10} />
              </label>
              <input 
                placeholder="pay_..." 
                value={targetPaymentId}
                onChange={(e) => setTargetPaymentId(e.target.value)}
                className="w-full mt-1 bg-slate-50 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase flex gap-1 items-center">
                Amount to refund (Optional)
              </label>
              <input 
                type="number"
                placeholder="Full amount by default" 
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                className="w-full mt-1 bg-slate-50 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <button 
              onClick={handleInitiateRefund}
              disabled={processing || !targetPaymentId}
              className="w-full bg-black text-white py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {processing && <Loader2 className="animate-spin" size={16} />}
              Process Refund
            </button>
          </div>
        </div>

        {/* Refunds History Table */}
        <div className="md:col-span-2 bg-white border rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b bg-slate-50/50 flex justify-between items-center">
            <h3 className="font-semibold text-sm">Recently Refunded</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
              <input 
                placeholder="Search refunds..." 
                className="pl-8 pr-3 py-1.5 border rounded-lg text-xs bg-white w-48"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-x-auto min-h-[300px]">
            {loading ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <Loader2 className="animate-spin" size={24} />
              </div>
            ) : refunds.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/30 border-b">
                    <th className="px-6 py-3 text-[10px] font-bold text-muted-foreground uppercase">Payment ID</th>
                    <th className="px-6 py-3 text-[10px] font-bold text-muted-foreground uppercase">Amount</th>
                    <th className="px-6 py-3 text-[10px] font-bold text-muted-foreground uppercase">Status</th>
                    <th className="px-6 py-3 text-[10px] font-bold text-muted-foreground uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-slate-700">
                  {refunds.map((r) => (
                    <tr key={r.id} className="text-sm hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs">{r.id}</td>
                      <td className="px-6 py-4 font-bold">₹{r.amount.toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-100 uppercase">
                          Refunded
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground text-xs">
                        {format(new Date(r.updated_at), 'MMM d, yyyy')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground text-sm gap-2">
                <AlertCircle size={24} />
                <p>No processed refunds found.</p>
              </div>
            )}
          </div>

          <div className="p-4 border-t bg-slate-50/50 flex justify-end">
             <div className="flex gap-1">
                <button className="p-1 border bg-white rounded hover:bg-slate-50 disabled:opacity-50" disabled><ChevronLeft size={14} /></button>
                <button className="p-1 border bg-white rounded hover:bg-slate-50 disabled:opacity-50" disabled><ChevronRight size={14} /></button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Refunds;
