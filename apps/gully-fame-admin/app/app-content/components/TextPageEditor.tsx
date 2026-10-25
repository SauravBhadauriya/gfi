'use client';

import { useEffect, useState } from 'react';
import { Save, RotateCcw } from 'lucide-react';
import type { ApiResponse } from '@/lib/apiTypes';

interface Props {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  /** where users see this text in the app */
  shownIn: string;
  /** the text bundled inside the app, shown to users when this page is empty */
  defaultText: string;
  /** key the backend returns the text under when it sends an object instead of a string */
  contentKey: string;
  load: () => Promise<ApiResponse<any>>;
  save: (text: string) => Promise<ApiResponse<any>>;
}

export default function TextPageEditor({ title, icon: Icon, shownIn, defaultText, contentKey, load, save }: Props) {
  const [text, setText] = useState('');
  const [saved, setSaved] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    (async () => {
      const r = await load();
      setLoading(false);
      // The backend answers 400 "Settings not found" until something has been saved once.
      const raw = r.success ? r.data : '';
      const value = typeof raw === 'string' ? raw : raw?.[contentKey] || raw?.content || '';
      setText(value);
      setSaved(value);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    setLoading(true);
    setMessage(null);
    const r = await save(text);
    setLoading(false);
    if (r.success) {
      setSaved(text);
      setMessage({ ok: true, text: text.trim() ? `${title} updated. The app shows it right away.` : `${title} cleared. The app shows its built-in text.` });
    } else {
      setMessage({ ok: false, text: r.message || 'Failed to update.' });
    }
  };

  const dirty = text !== saved;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center space-x-2">
        <Icon className="h-5 w-5 text-primary-600" />
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      </div>
      <p className="text-xs text-gray-500">
        {shownIn} {defaultText ? 'Leave this empty to show the text that is built into the app.' : ''} Use lines starting with &quot;• &quot; for bullet points.
      </p>
      <textarea
        rows={20}
        className="w-full rounded-lg border border-gray-300 p-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all resize-y"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={defaultText ? 'Empty: users see the built-in text. Click "Load app default" to start from it.' : 'Write the text users will see...'}
        disabled={loading}
      />
      {message && (
        <div className={`rounded-lg border px-3 py-2 text-xs ${message.ok ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {defaultText ? (
          <button
            type="button"
            onClick={() => setText(defaultText)}
            disabled={loading}
            className="flex items-center space-x-2 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Load app default</span>
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={!dirty || loading}
          className="flex items-center space-x-2 rounded-lg bg-primary-600 px-6 py-3 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="h-4 w-4" />
          <span>{loading ? 'Saving...' : 'Save'}</span>
        </button>
      </div>
    </div>
  );
}
