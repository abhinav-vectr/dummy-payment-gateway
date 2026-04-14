import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  CreditCard as CardIcon, 
  Smartphone, 
  Building2, 
  ShieldCheck, 
  ArrowLeft,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  ExternalLink,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { paymentApi } from '../../services/api';
import { clsx } from 'clsx';

const Step = ({ children, title, onBack }: { children: React.ReactNode, title?: string, onBack?: () => void }) => (
  <motion.div 
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="space-y-6"
  >
    <div className="flex items-center gap-4">
      {onBack && (
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft size={18} />
        </button>
      )}
      {title && <h2 className="text-xl font-bold">{title}</h2>}
    </div>
    {children}
  </motion.div>
);

const CardPreview = ({ number, name, expiry, cvv, type, focused }: any) => {
  const isCvvFocused = focused === 'cvv';
  return (
    <div className="w-full max-w-[320px] mx-auto h-[190px] mb-8" style={{ perspective: '1000px' }}>
      <motion.div 
        animate={{ rotateY: isCvvFocused ? 180 : 0 }}
        transition={{ duration: 0.6, type: 'spring', damping: 20, stiffness: 100 }}
        className="relative w-full h-full"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front */}
        <div 
          className="absolute inset-0 w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-black rounded-2xl p-6 text-white shadow-2xl flex flex-col justify-between"
          style={{ 
            backfaceVisibility: 'hidden', 
            WebkitBackfaceVisibility: 'hidden',
            zIndex: 2,
            transform: 'rotateY(0deg)'
          }}
        >
          <div className="absolute top-0 right-0 p-4 font-black italic opacity-10 text-4xl pointer-events-none">NovaPay</div>
          <div className="flex justify-between items-start">
            <div className="w-12 h-9 bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 rounded-md shadow-inner flex items-center justify-center">
                <div className="w-full h-px bg-black/10 scale-y-150 rotate-45" />
            </div>
            <div className="text-xl font-black italic tracking-tighter">
                {type === 'visa' ? 'VISA' : type === 'mastercard' ? 'MC' : 'PAY'}
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="text-xl font-mono tracking-[0.2em] drop-shadow-lg text-center">
              {number.padEnd(16, '•').match(/.{1,4}/g)?.join(' ') || '•••• •••• •••• ••••'}
            </div>
            <div className="flex justify-between uppercase">
              <div className="space-y-0.5">
                <div className="text-[7px] opacity-50 font-black tracking-[0.2em]">Card Holder</div>
                <div className="text-[10px] font-bold truncate max-w-[170px] tracking-wider">{name || 'Abhinav Pentani'}</div>
              </div>
              <div className="space-y-0.5 text-right">
                <div className="text-[7px] opacity-50 font-black tracking-[0.2em]">Expires</div>
                <div className="text-[10px] font-bold tracking-wider">{expiry || 'MM/YY'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Back */}
        <div 
          className="absolute inset-0 w-full h-full bg-gradient-to-br from-slate-800 to-slate-950 rounded-2xl py-6 text-white shadow-2xl flex flex-col justify-between"
          style={{ 
            backfaceVisibility: 'hidden', 
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            zIndex: 1
          }}
        >
          <div className="w-full h-12 bg-black opacity-90 mb-4" />
          <div className="px-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 h-10 bg-slate-300 rounded flex items-center justify-end px-4">
                <div className="text-lg font-mono font-black text-slate-900 bg-white/80 px-2 rounded">{cvv || '•••'}</div>
              </div>
              <div className="text-[9px] opacity-60 w-16 leading-tight font-black uppercase tracking-tighter">SECURE CODE</div>
            </div>
            <div className="border-t border-white/5 pt-4">
                <p className="text-[7px] opacity-30 leading-tight text-center uppercase tracking-widest px-2">
                  This is a digital simulation. Not for real transactions. Secured by NovaPay Advanced Encryption.
                </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const banks = [
  { id: 'sbi', name: 'State Bank of India', color: 'bg-blue-600' },
  { id: 'hdfc', name: 'HDFC Bank', color: 'bg-indigo-900' },
  { id: 'icici', name: 'ICICI Bank', color: 'bg-orange-600' },
  { id: 'axis', name: 'Axis Bank', color: 'bg-rose-900' },
  { id: 'kotak', name: 'Kotak Mahindra Bank', color: 'bg-rose-600' },
];

const Checkout = () => {
  const { paymentId } = useParams();
  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<'methods' | 'details' | 'processing' | 'vpa_collect' | 'bank_redirect' | 'result'>('methods');
  const [method, setMethod] = useState<'card' | 'upi' | 'netbanking' | null>(null);
  const [status, setStatus] = useState<'success' | 'failed' | null>(null);
  
  // Card States
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [focused, setFocused] = useState<string | null>(null);

  // UPI State
  const [vpa, setVpa] = useState('');
  const [vpaError, setVpaError] = useState('');

  // Netbanking State
  const [selectedBank, setSelectedBank] = useState<any>(null);

  useEffect(() => {
    if (paymentId) {
      paymentApi.get(paymentId)
        .then(res => {
          setPayment(res.data);
          if (res.data.status === 'success' || res.data.status === 'failed') {
            setStep('result');
            setStatus(res.data.status);
          }
        })
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [paymentId]);

  const handlePayment = async (forcedStatus?: 'success' | 'failed') => {
    setStep('processing');
    
    // Simulate delay
    const delay = payment?.merchant?.settings?.collect_upi_delay || 3;
    await new Promise(r => setTimeout(r, delay * 1000));

    try {
      let finalStatus = forcedStatus || (Math.random() > 0.1 ? 'success' : 'failed');
      
      // Override based on rules if UPI
      if (method === 'upi') {
        if (vpa.includes('success@paysim')) finalStatus = 'success';
        if (vpa.includes('fail@paysim')) finalStatus = 'failed';
      }

      const res = await paymentApi.attempt(paymentId!, {
        method: method || 'card',
        status: finalStatus
      });
      
      setStatus(res.data.status === 'success' ? 'success' : 'failed');
      setStep('result');
    } catch (error) {
      setStatus('failed');
      setStep('result');
    }
  };

  const validateVpa = () => {
    if (!vpa.includes('@')) {
      setVpaError('Enter a valid UPI ID (e.g. name@okaxis)');
      return;
    }
    setStep('vpa_collect');
    handlePayment();
  };

  const detectCardType = (num: string) => {
    if (num.startsWith('4')) return 'visa';
    if (/^(5[1-5]|2[2-7])/.test(num)) return 'mastercard';
    return 'card';
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-primary" size={48} /></div>;
  if (!payment) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-center p-4"><div><h2 className="text-2xl font-bold mb-2">Invalid Link</h2><p className="text-muted-foreground">This payment link is invalid.</p></div></div>;

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 selection:bg-black selection:text-white">
      <div className="fixed top-0 inset-x-0 h-10 bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold uppercase tracking-widest z-50">
        <AlertCircle size={14} className="mr-2" />
        Test Mode Sandbox — No real money involved
      </div>

      <div className="max-w-[900px] w-full grid grid-cols-1 md:grid-cols-5 bg-white rounded-3xl shadow-2xl overflow-hidden mt-10 border border-slate-200">
        {/* Sidebar Summary */}
        <div className="md:col-span-2 bg-[#0a0a0b] p-8 text-white flex flex-col">
          <div className="mb-auto">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-black font-black italic">NP</div>
              <h3 className="text-xl font-bold tracking-tight">NovaPay</h3>
            </div>
            
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Merchant</p>
            <h3 className="text-lg font-bold mb-8">Demo Merchant Ltd.</h3>
            
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Description</p>
            <p className="text-slate-300 mb-8 font-medium leading-relaxed">{payment.description || 'Untitled Order'}</p>
          </div>

          <div className="bg-white/5 rounded-2xl p-6 border border-white/10 backdrop-blur-sm">
            <div className="flex justify-between items-end mb-4">
              <div>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Payable Amount</p>
                <h2 className="text-3xl font-bold tracking-tighter">{formatCurrency(payment.amount)}</h2>
              </div>
              <p className="text-slate-500 text-xs font-bold uppercase">INR</p>
            </div>
            <div className="pt-4 border-t border-white/10 flex items-center gap-2 text-slate-500 text-[9px] uppercase font-bold tracking-widest">
              <ShieldCheck size={14} className="text-emerald-500" />
              End-to-end encrypted
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="md:col-span-3 p-10 bg-white relative">
          <AnimatePresence mode="wait">
            {step === 'methods' && (
              <Step title="Payment Methods">
                <div className="space-y-4">
                  {[
                    { id: 'card', icon: CardIcon, label: 'Card', sub: 'Debit, Credit, Corporate', color: 'text-blue-500' },
                    { id: 'upi', icon: Smartphone, label: 'UPI', sub: 'GPay, PhonePe, Paytm', color: 'text-emerald-500' },
                    { id: 'netbanking', icon: Building2, label: 'Net Banking', sub: 'All Indian Banks supported', color: 'text-amber-500' },
                  ].map((m) => (
                    <button 
                      key={m.id}
                      onClick={() => { setMethod(m.id as any); setStep('details'); }}
                      className="w-full flex items-center justify-between p-5 border-2 border-slate-100 rounded-2xl hover:border-black hover:shadow-lg transition-all group"
                    >
                      <div className="flex items-center gap-5">
                        <div className={clsx("p-3 bg-slate-50 rounded-xl group-hover:bg-black group-hover:text-white transition-colors", m.color)}>
                          <m.icon size={24} />
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-slate-900">{m.label}</p>
                          <p className="text-xs text-slate-500">{m.sub}</p>
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-slate-300 group-hover:text-black group-hover:translate-x-1 transition-all" />
                    </button>
                  ))}
                </div>
              </Step>
            )}

            {step === 'details' && method === 'card' && (
              <Step title="Credit / Debit Card" onBack={() => setStep('methods')}>
                <CardPreview 
                  number={cardNumber} 
                  name={cardName} 
                  expiry={expiry} 
                  cvv={cvv} 
                  type={detectCardType(cardNumber)}
                  focused={focused}
                />
                <div className="space-y-5">
                   <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Card Number</label>
                    <input 
                      type="text" 
                      placeholder="0000 0000 0000 0000" 
                      maxLength={16}
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ''))}
                      className="w-full p-4 border-2 border-slate-100 rounded-xl focus:border-black focus:outline-none transition-colors font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Expiry Date</label>
                      <input 
                        type="text" 
                        placeholder="MM/YY"
                        maxLength={5}
                        value={expiry}
                        onChange={(e) => setExpiry(e.target.value)}
                        className="w-full p-4 border-2 border-slate-100 rounded-xl focus:border-black focus:outline-none transition-colors font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">CVV</label>
                      <input 
                        type="password" 
                        placeholder="•••"
                        maxLength={3}
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value)}
                        onFocus={() => setFocused('cvv')}
                        onBlur={() => setFocused(null)}
                        className="w-full p-4 border-2 border-slate-100 rounded-xl focus:border-black focus:outline-none transition-colors font-mono"
                      />
                    </div>
                  </div>
                  <button 
                    onClick={() => handlePayment()}
                    className="w-full bg-black text-white p-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-colors shadow-xl"
                  >
                    Pay {formatCurrency(payment.amount)}
                  </button>
                </div>
              </Step>
            )}

            {step === 'details' && method === 'upi' && (
              <Step title="Scan or Pay with UPI" onBack={() => setStep('methods')}>
                <div className="space-y-8">
                  <div className="flex flex-col items-center">
                     <div className="w-48 h-48 bg-slate-50 border-2 border-slate-100 rounded-3xl flex items-center justify-center p-6 mb-4">
                        <div className="w-full h-full bg-[url('https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=novapay_demo_intent')] bg-cover opacity-80" />
                     </div>
                     <p className="text-xs text-slate-500 font-medium">Scan QR to pay instantly</p>
                  </div>
                  
                  <div className="relative">
                    <div className="absolute inset-x-0 top-1/2 h-px bg-slate-100 -z-10" />
                    <span className="bg-white px-4 mx-auto block w-fit text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">OR USE VPA</span>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                       <input 
                        type="text" 
                        placeholder="username@bank"
                        value={vpa}
                        onChange={(e) => { setVpa(e.target.value); setVpaError(''); }}
                        className="w-full p-4 border-2 border-slate-100 rounded-2xl focus:border-black focus:outline-none transition-colors"
                      />
                      {vpaError && <p className="text-rose-500 text-[10px] font-bold px-1">{vpaError}</p>}
                    </div>
                    <button 
                      onClick={validateVpa}
                      className="w-full bg-black text-white p-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl"
                    >
                      Verify & Pay
                    </button>
                  </div>
                </div>
              </Step>
            )}

            {step === 'details' && method === 'netbanking' && (
              <Step title="Select Your Bank" onBack={() => setStep('methods')}>
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  <div className="relative mb-4">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input type="text" placeholder="Search major banks..." className="w-full bg-slate-50 border-none rounded-xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-black" />
                  </div>
                  {banks.map((bank) => (
                    <button 
                      key={bank.id}
                      onClick={() => { setSelectedBank(bank); setStep('bank_redirect'); }}
                      className="w-full flex items-center justify-between p-4 border-2 border-slate-100 rounded-2xl hover:border-black transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className={clsx("w-10 h-10 rounded-lg flex items-center justify-center text-white font-black text-xs", bank.color)}>
                          {bank.name.charAt(0)}
                        </div>
                        <span className="font-bold text-slate-700">{bank.name}</span>
                      </div>
                      <ExternalLink size={16} className="text-slate-300 group-hover:text-black" />
                    </button>
                  ))}
                </div>
              </Step>
            )}

            {step === 'vpa_collect' && (
              <div className="h-full flex flex-col items-center justify-center py-10 text-center animate-pulse">
                 <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-8">
                    <Smartphone size={48} />
                 </div>
                 <h2 className="text-2xl font-extrabold mb-2 tracking-tight">Collect Request Sent</h2>
                 <p className="text-slate-500 text-sm max-w-[250px] mx-auto leading-relaxed">
                   Accept the payment request in your <span className="font-bold text-slate-900">UPI App</span> to complete the transaction.
                 </p>
                 <div className="mt-12 flex flex-col items-center gap-2">
                    <div className="w-full max-w-[200px] h-1 bg-slate-100 rounded-full overflow-hidden">
                       <motion.div 
                        initial={{ x: '-100%' }}
                        animate={{ x: '100%' }}
                        transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                        className="h-full w-1/3 bg-emerald-500"
                       />
                    </div>
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Waiting for authorization</span>
                 </div>
              </div>
            )}

            {step === 'bank_redirect' && (
               <div className="h-full flex flex-col items-center justify-center py-10 text-center">
                  <div className={clsx("w-20 h-20 rounded-2xl flex items-center justify-center text-white text-3xl font-black mb-8 shadow-xl", selectedBank?.color)}>
                    {selectedBank?.name.charAt(0)}
                  </div>
                  <h2 className="text-xl font-extrabold mb-6">Redirecting to {selectedBank?.name}</h2>
                  <div className="p-6 bg-slate-50 border rounded-2xl w-full max-w-xs space-y-4">
                     <p className="text-xs text-slate-500 italic">This is a simulated bank authorization page. Click below to mimic a successful login.</p>
                     <button 
                      onClick={() => handlePayment('success')}
                      className="w-full bg-blue-600 text-white p-3 rounded-xl font-bold text-sm"
                     >
                        Login & Authorize
                     </button>
                     <button 
                       onClick={() => handlePayment('failed')}
                       className="w-full bg-white border text-rose-600 p-3 rounded-xl font-bold text-sm"
                     >
                        Cancel Transaction
                     </button>
                  </div>
               </div>
            )}

            {step === 'processing' && (
              <div className="h-full flex flex-col items-center justify-center py-20 text-center">
                <motion.div 
                  animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="mb-8 p-6 bg-slate-50 rounded-full text-black"
                >
                  <Loader2 size={48} />
                </motion.div>
                <h2 className="text-2xl font-black tracking-tight mb-2">Verifying Transaction</h2>
                <p className="text-slate-500 text-sm">Our systems are communicating securely with your bank...</p>
              </div>
            )}

            {step === 'result' && (
              <div className="h-full flex flex-col items-center justify-center py-10 text-center">
                <motion.div 
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className={status === 'success' ? 'text-emerald-500 mb-8' : 'text-rose-500 mb-8'}
                >
                  {status === 'success' ? <CheckCircle2 size={100} /> : <XCircle size={100} />}
                </motion.div>
                <h2 className="text-3xl font-black tracking-tight mb-3">
                  {status === 'success' ? 'Payment Securely Received' : 'Payment Failed'}
                </h2>
                <p className="text-slate-500 text-sm mb-12 max-w-[280px] mx-auto leading-relaxed">
                  {status === 'success' 
                    ? `Transaction ID: ${paymentId}. You will be redirected back to the merchant dashboard.` 
                    : 'The transaction was declined by your bank or timed out. No funds were debited.'}
                </p>
                <div className="flex gap-4 w-full px-4">
                  {status === 'failed' && (
                     <button 
                        onClick={() => setStep('methods')}
                        className="flex-1 bg-black text-white p-5 rounded-2xl font-black uppercase text-xs tracking-widest"
                      >
                        Try Again
                      </button>
                  )}
                  <button 
                    onClick={() => window.location.href = '/'}
                    className={clsx(
                      "flex-1 p-5 rounded-2xl font-black uppercase text-xs tracking-widest",
                      status === 'success' ? "bg-emerald-600 text-white shadow-lg shadow-emerald-100" : "bg-white border text-slate-400"
                    )}
                  >
                    Close Window
                  </button>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="fixed bottom-8 text-center text-slate-400 text-[10px] uppercase font-black tracking-[0.4em] opacity-40">
        PCI-DSS COMPLIANT • SSL SECURED • NOVAPAY 
      </div>
    </div>
  );
};

export default Checkout;
