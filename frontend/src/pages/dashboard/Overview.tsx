import React, { useEffect, useState } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  TrendingUp, 
  CreditCard, 
  CheckCircle2, 
  XCircle,
  Clock,
  RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';
import { merchantApi, paymentApi } from '../../services/api';
import { format } from 'date-fns';

const MetricCard = ({ title, value, change, trend, icon: Icon, loading }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white p-6 rounded-xl border shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
  >
    {loading && (
      <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center z-10">
        <RefreshCw className="animate-spin text-muted-foreground" size={20} />
      </div>
    )}
    <div className="flex justify-between items-start mb-4">
      <div className="p-2 bg-secondary rounded-lg">
        <Icon size={20} className="text-primary" />
      </div>
      {trend && (
        <span className={`text-xs font-medium flex items-center gap-1 ${trend === 'up' ? 'text-emerald-600' : 'text-rose-600'}`}>
          {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {change}
        </span>
      )}
    </div>
    <div>
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <h3 className="text-2xl font-bold tracking-tight mt-1">{value}</h3>
    </div>
  </motion.div>
);

const Overview = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [metricsRes, paymentsRes] = await Promise.all([
        merchantApi.getMetrics(),
        paymentApi.list()
      ]);
      setMetrics(metricsRes.data);
      setPayments(paymentsRes.data.slice(0, 5));
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(val);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
          <p className="text-muted-foreground">Welcome back. Here's what's happening today.</p>
        </div>
        <button 
          onClick={fetchData} 
          className="p-2 border rounded-lg hover:bg-slate-50 transition-colors"
          disabled={loading}
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Total Volume" 
          value={metrics ? formatCurrency(metrics.total_volume) : '₹0.00'} 
          change="Real-time" 
          trend="up" 
          icon={TrendingUp} 
          loading={loading}
        />
        <MetricCard 
          title="Successful" 
          value={metrics ? metrics.success_count : '0'} 
          icon={CheckCircle2} 
          loading={loading}
        />
        <MetricCard 
          title="Failed" 
          value={metrics ? metrics.failed_count : '0'} 
          icon={XCircle} 
          loading={loading}
        />
        <MetricCard 
          title="Total Transactions" 
          value={metrics ? metrics.total_transactions : '0'} 
          icon={Clock} 
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white border rounded-xl overflow-hidden shadow-sm">
          <div className="p-6 border-b flex justify-between items-center">
            <h3 className="font-semibold">Recent Transactions</h3>
            <button className="text-sm text-accent font-medium hover:underline">View all</button>
          </div>
          <div className="divide-y">
            {payments.length > 0 ? payments.map((p) => (
              <div key={p.id} className="p-4 hover:bg-secondary/30 transition-colors flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                    <CreditCard size={18} className="text-slate-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{p.id}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.method || 'Not started'} • {format(new Date(p.created_at), 'HH:mm • MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{formatCurrency(p.amount)}</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                    p.status === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                    p.status === 'failed' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                    'bg-amber-50 text-amber-700 border-amber-100'
                  }`}>
                    {p.status}
                  </span>
                </div>
              </div>
            )) : (
              <div className="p-12 text-center text-muted-foreground text-sm">
                No transactions yet. Click "New Payment" to get started.
              </div>
            )}
          </div>
        </div>


        <div className="bg-white border rounded-xl shadow-sm p-6">
          <h3 className="font-semibold mb-6">Payment Methods</h3>
          <div className="space-y-4">
            {(() => {
              const distribution = { card: 0, upi: 0, netbanking: 0 };
              payments.forEach(p => {
                if (p.method && distribution[p.method as keyof typeof distribution] !== undefined) {
                  distribution[p.method as keyof typeof distribution]++;
                }
              });
              const total = Object.values(distribution).reduce((a, b) => a + b, 0) || 1;
              return [
                { label: 'Card', value: `${((distribution.card / total) * 100).toFixed(0)}%`, color: 'bg-indigo-500', count: distribution.card },
                { label: 'UPI', value: `${((distribution.upi / total) * 100).toFixed(0)}%`, color: 'bg-emerald-500', count: distribution.upi },
                { label: 'Netbanking', value: `${((distribution.netbanking / total) * 100).toFixed(0)}%`, color: 'bg-amber-500', count: distribution.netbanking },
              ].map((method) => (
                <div key={method.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{method.label}</span>
                    <span className="font-medium">{method.value}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${method.color} transition-all duration-1000`} style={{ width: method.value }} />
                  </div>
                </div>
              ));
            })()}
          </div>
          
          <div className="mt-8 p-4 bg-slate-50 rounded-lg border border-dashed text-center">
            <p className="text-xs text-muted-foreground">
              Average success rate
            </p>
            <h4 className="text-lg font-bold text-emerald-600">
              {metrics?.total_transactions ? ((metrics.success_count / metrics.total_transactions) * 100).toFixed(1) : '100'}%
            </h4>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
