'use client';

import { useEffect, useState } from 'react';
import { Mail, Save } from 'lucide-react';
import { getContactUs, updateContactUs } from '@/lib/contentLibraryApi';
import defaults from '@/lib/appDefaultContent.json';

const inputCls =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500';

export default function ContactUs() {
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    (async () => {
      const r = await getContactUs();
      setLoading(false);
      if (r.success && r.data) {
        setEmail(r.data.email);
        setWhatsapp(r.data.whatsapp);
      } else if (!r.success) {
        setMessage({ ok: false, text: r.message || 'Failed to load contact details.' });
      }
    })();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    const r = await updateContactUs({ email: email.trim(), whatsapp: whatsapp.trim() });
    setLoading(false);
    setMessage(r.success ? { ok: true, text: 'Saved. The app uses these on Help & Support.' } : { ok: false, text: r.message || 'Failed to update.' });
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center space-x-2">
        <Mail className="h-5 w-5 text-primary-600" />
        <h2 className="text-lg font-semibold text-gray-900">Help & Support Contact</h2>
      </div>
      <p className="text-xs text-gray-500">
        Shown on the app&apos;s Help & Support screen as the &quot;Email Us&quot; and &quot;WhatsApp Chat&quot; buttons. Empty fields fall back to the
        app defaults ({defaults.contact.email}, {defaults.contact.whatsapp}).
      </p>
      <label className="block text-xs text-gray-600">
        Support email
        <input className={`${inputCls} mt-1`} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={defaults.contact.email} disabled={loading} />
      </label>
      <label className="block text-xs text-gray-600">
        WhatsApp number (with country code)
        <input className={`${inputCls} mt-1`} value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder={defaults.contact.whatsapp} disabled={loading} />
      </label>
      {message && (
        <div className={`rounded-lg border px-3 py-2 text-xs ${message.ok ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}
      <div className="flex justify-end">
        <button type="button" onClick={handleSave} disabled={loading} className="flex items-center space-x-2 rounded-lg bg-primary-600 px-6 py-3 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60">
          <Save className="h-4 w-4" />
          <span>{loading ? 'Saving...' : 'Save'}</span>
        </button>
      </div>
    </div>
  );
}
