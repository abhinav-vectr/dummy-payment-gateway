import React, { useEffect, useState } from 'react';
import { User, Bell, Shield, Wallet, Loader2, Save } from 'lucide-react';
import { merchantApi } from '../../services/api';
import { clsx } from 'clsx';

const Toggle = ({ enabled, onChange, loading }: { enabled: boolean, onChange: (val: boolean) => void, loading?: boolean }) => (
  <button 
    onClick={() => !loading && onChange(!enabled)}
    disabled={loading}
    className={clsx(
      "w-11 h-6 rounded-full relative transition-colors duration-200 focus:outline-none",
      enabled ? "bg-emerald-500" : "bg-slate-200",
      loading && "opacity-50 cursor-not-allowed"
    )}
  >
    <div className={clsx(
      "absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-200",
      enabled ? "right-1" : "left-1"
    )} />
  </button>
);

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [merchant, setMerchant] = useState<any>(null);
  const [settings, setSettings] = useState<any>({
    simulation_mode: true,
    notify_success: true,
    notify_failure: false,
    collect_upi_delay: 3
  });

  useEffect(() => {
    merchantApi.getMe()
      .then(res => {
        setMerchant(res.data);
        setSettings(res.data.settings);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const updateSettings = async (newSettings: any) => {
    try {
      setSaving(true);
      const res = await merchantApi.updateSettings(newSettings);
      setSettings(res.data);
    } catch (err) {
      alert("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (key: string, val: boolean) => {
    const next = { ...settings, [key]: val };
    setSettings(next);
    updateSettings(next);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage your account and gateway preferences.</p>
        </div>
        {saving && (
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground animate-pulse">
            <Loader2 size={12} className="animate-spin" /> Saving changes...
          </div>
        )}
      </div>

      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        <div className="p-6 border-b flex items-center gap-2 bg-slate-50/50">
          <User size={18} className="text-muted-foreground" />
          <h3 className="font-semibold text-sm">Account Information</h3>
        </div>
        <div className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Business Name</label>
              <input value={merchant?.name} disabled className="w-full bg-slate-50 border rounded-lg px-4 py-2 text-sm text-slate-500 cursor-not-allowed" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Email Address</label>
              <input value={merchant?.email} disabled className="w-full bg-slate-50 border rounded-lg px-4 py-2 text-sm text-slate-500 cursor-not-allowed" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
          <div className="p-6 border-b flex items-center gap-2 bg-slate-50/50">
            <Shield size={18} className="text-muted-foreground" />
            <h3 className="font-semibold text-sm">Gateway Simulation</h3>
          </div>
          <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold">Simulation Mode</p>
                <p className="text-xs text-muted-foreground">Force successful payments for testing.</p>
              </div>
              <Toggle 
                enabled={settings.simulation_mode} 
                onChange={(val) => handleToggle('simulation_mode', val)} 
                loading={saving}
              />
            </div>
            
            <div className="space-y-3 pt-4 border-t">
               <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">UPI Delay (seconds)</label>
               <input 
                type="range" 
                min="1" max="10" 
                value={settings.collect_upi_delay} 
                onChange={(e) => handleToggle('collect_upi_delay', parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-black" 
              />
               <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                  <span>Instant</span>
                  <span className="font-bold text-black">{settings.collect_upi_delay}s delay</span>
                  <span>Delayed</span>
               </div>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
          <div className="p-6 border-b flex items-center gap-2 bg-slate-50/50">
            <Bell size={18} className="text-muted-foreground" />
            <h3 className="font-semibold text-sm">Webhook Notifications</h3>
          </div>
          <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold">Notify on Success</p>
                <p className="text-xs text-muted-foreground">Send webhooks for successful payments.</p>
              </div>
              <Toggle 
                enabled={settings.notify_success} 
                onChange={(val) => handleToggle('notify_success', val)} 
                loading={saving}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold">Notify on Failure</p>
                <p className="text-xs text-muted-foreground">Send webhooks for failed payment attempts.</p>
              </div>
              <Toggle 
                enabled={settings.notify_failure} 
                onChange={(val) => handleToggle('notify_failure', val)} 
                loading={saving}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
