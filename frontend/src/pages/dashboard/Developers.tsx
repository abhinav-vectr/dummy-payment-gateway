import React, { useState, useEffect } from 'react';
import { 
  Key, 
  Copy, 
  Check, 
  RefreshCcw, 
  Eye, 
  EyeOff,
  Code2,
  Terminal,
  AlertCircle,
  Loader2,
  Trash2,
  Plus,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { merchantApi, setAuthKeys } from '../../services/api';

const ApiKeyRow = ({ label, value, isSecret = false }: { label: string, value: string, isSecret?: boolean }) => {
  const [show, setShow] = useState(!isSecret);
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!value) return null;

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-muted-foreground uppercase">{label}</label>
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-slate-50 border rounded-lg px-4 py-2.5 font-mono text-sm flex items-center justify-between group">
          <span className="truncate">
            {show ? value : '•'.repeat(value.length > 20 ? 20 : value.length)}
          </span>
          <div className="flex items-center gap-2">
            {isSecret && (
              <button onClick={() => setShow(!show)} className="p-1 hover:bg-slate-200 rounded transition-colors text-slate-400 hover:text-slate-600">
                {show ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            )}
            <button onClick={copyToClipboard} className="p-1 hover:bg-slate-200 rounded transition-colors text-slate-400 hover:text-slate-600">
              {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Developers = () => {
  const [merchant, setMerchant] = useState<any>(null);
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rotating, setRotating] = useState(false);
  const [showWebhookForm, setShowWebhookForm] = useState(false);
  const [newWebhookUrl, setNewWebhookUrl] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [mRes, wRes] = await Promise.all([
        merchantApi.getMe(),
        merchantApi.listWebhooks()
      ]);
      setMerchant(mRes.data);
      setWebhooks(wRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRotateKeys = async () => {
    if (!window.confirm("Are you sure? Old keys will stop working immediately.")) return;
    try {
      setRotating(true);
      const res = await merchantApi.rotateKeys();
      setAuthKeys(res.data.public_key, res.data.secret_key);
      await fetchData();
    } catch (err) {
      alert("Failed to rotate keys");
    } finally {
      setRotating(false);
    }
  };

  const handleAddWebhook = async () => {
    if (!newWebhookUrl) return;
    try {
      await merchantApi.createWebhook({ url: newWebhookUrl });
      setNewWebhookUrl('');
      setShowWebhookForm(false);
      await fetchData();
    } catch (err) {
      alert("Failed to add webhook");
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    if (!window.confirm("Delete this webhook endpoint?")) return;
    try {
      await merchantApi.deleteWebhook(id);
      await fetchData();
    } catch (err) {
      alert("Failed to delete webhook");
    }
  };

  const keys = merchant?.api_keys?.[0] || {};
  const backendBaseUrl = window.location.origin.replace('5173', '8000'); // Dynamic guess

  return (
    <div className="space-y-8 max-w-4xl pb-20">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Developers</h1>
        <p className="text-muted-foreground">Manage your API keys and webhooks for integration.</p>
      </div>

      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Key size={20} className="text-muted-foreground" />
            <h3 className="font-semibold">API Keys</h3>
            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold uppercase tracking-wide ml-2">
              {keys.mode === 'test' ? 'Test Mode' : 'Live Mode'}
            </span>
          </div>
          <button 
            onClick={handleRotateKeys}
            disabled={rotating}
            className="text-sm font-medium flex items-center gap-2 text-rose-600 hover:text-rose-700 transition-colors disabled:opacity-50"
          >
            {rotating ? <Loader2 className="animate-spin" size={14} /> : <RefreshCcw size={14} />} 
            Roll keys
          </button>
        </div>
        <div className="p-6 space-y-6 min-h-[150px] relative">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="animate-spin" />
            </div>
          ) : (
            <>
              <ApiKeyRow label="Public Key" value={keys.public_key} />
              <ApiKeyRow label="Secret Key" value={keys.secret_key} isSecret={true} />
            </>
          )}
          
          <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 flex gap-3">
            <AlertCircle className="text-amber-500 shrink-0" size={18} />
            <p className="text-xs text-amber-800 leading-relaxed font-medium">
              These keys are for testing purposes only. Do not use them in production systems. 
              Always keep your secret key confidential and never expose it on the client side.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white border rounded-xl shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Code2 size={20} className="text-muted-foreground" />
            <h3 className="font-semibold">Quick Integration</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Use the sample payload to test your payment integration.
          </p>
          <div className="bg-slate-900 rounded-lg p-4 text-[11px] font-mono text-slate-300 overflow-x-auto">
            <pre>{`curl --request POST \\
  --url ${backendBaseUrl}/v1/payments \\
  --header 'X-Secret-Key: ${keys.secret_key || 'pg_test_sec_...'}' \\
  --data '{
    "amount": 100,
    "currency": "INR",
    "description": "Test payment"
  }'`}</pre>
          </div>
          <div className="pt-2">
            <a href="#" className="text-xs text-primary font-bold flex items-center gap-1 hover:underline">
              View API Documentation <ArrowRight size={12} />
            </a>
          </div>
        </div>

        <div className="bg-white border rounded-xl shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Terminal size={20} className="text-muted-foreground" />
              <h3 className="font-semibold">Webhook URLs</h3>
            </div>
            <button 
              onClick={() => setShowWebhookForm(!showWebhookForm)}
              className="p-1 hover:bg-slate-100 rounded-lg text-primary transition-colors"
            >
              <Plus size={18} />
            </button>
          </div>
          
          <AnimatePresence>
            {showWebhookForm && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="p-3 border rounded-xl bg-slate-50 space-y-3 mb-4">
                  <input 
                    placeholder="https://your-api.com/webhooks"
                    value={newWebhookUrl}
                    onChange={(e) => setNewWebhookUrl(e.target.value)}
                    className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  />
                  <div className="flex gap-2">
                    <button 
                      onClick={handleAddWebhook}
                      className="flex-1 py-2 bg-black text-white text-xs font-bold rounded-lg"
                    >
                      Save Endpoint
                    </button>
                    <button 
                      onClick={() => setShowWebhookForm(false)}
                      className="px-4 py-2 bg-white border text-xs font-bold rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-3">
            {webhooks.length > 0 ? webhooks.map((wh) => (
              <div key={wh.id} className="group border rounded-xl p-3 flex items-center justify-between hover:border-slate-300 transition-all">
                <div className="flex-1 min-w-0 pr-3">
                  <p className="text-xs font-mono font-medium truncate text-slate-700">{wh.url}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider font-bold">
                    {wh.events.length} events • {wh.id}
                  </p>
                </div>
                <button 
                  onClick={() => handleDeleteWebhook(wh.id)}
                  className="p-2 text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )) : (
              <div className="py-8 text-center border-2 border-dashed rounded-2xl">
                <p className="text-xs text-muted-foreground">No webhooks configured yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Developers;
