'use client';

import React, { useEffect, useState } from 'react';

const MISSING_KEY_REGEX = /\b[a-z0-9]+(?:\.[a-z0-9_]+)+\b/gi;

export default function I18nReporter() {
  const [enabled, setEnabled] = useState(() => {
    try { return localStorage.getItem('comspace.reportI18nMissing') === 'true'; } catch(e) { return false; }
  });
  const devEnabled = process.env.NEXT_PUBLIC_DEBUG_I18N === 'true';

  useEffect(() => {
    if (!devEnabled || !enabled) return;

    function scanAndReport() {
      try {
        const text = document.body.innerText || '';
        const matches = Array.from(new Set((text.match(MISSING_KEY_REGEX) || []).map(s => s.trim())));
        if (matches.length === 0) return;

        const locale = (location.pathname.split('/').filter(Boolean)[0] || 'en');
        const payload = {
          locale,
          keys: matches,
          url: location.href,
          userAgent: navigator.userAgent,
          source: 'client'
        };

        fetch('/__debug/missing-translations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).catch(err => console.warn('[i18n reporter] failed to post', err));
      } catch (e) {
        // ignore
      }
    }

    // Run once on mount and then on DOM changes (simple observer)
    scanAndReport();
    const obs = new MutationObserver(() => scanAndReport());
    obs.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => obs.disconnect();
  }, [enabled, devEnabled]);

  function toggle() {
    try { localStorage.setItem('comspace.reportI18nMissing', (!enabled).toString()); } catch(e){}
    setEnabled(!enabled);
  }

  if (!devEnabled) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-white border rounded p-2 text-sm shadow-sm z-50">
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={enabled} onChange={toggle} />
        <span>Report missing translations (dev only)</span>
      </label>
    </div>
  );
}
