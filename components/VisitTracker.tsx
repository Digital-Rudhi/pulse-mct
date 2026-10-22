'use client';

import { useEffect, useRef } from 'react';

const VISITOR_ID_KEY = 'pulse_mct_visitor_id';
const ENGAGEMENT_MS = 3000;

function getOrCreateVisitorId(): string {
  let id = localStorage.getItem(VISITOR_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(VISITOR_ID_KEY, id);
  }
  return id;
}

// Silent, invisible component — logs one "visit" per page load once the
// user has been on the page 3+ seconds AND performed at least one
// interaction (mouse move, click, keypress, or scroll).
export default function VisitTracker() {
  const loggedRef = useRef(false);
  const interactedRef = useRef(false);
  const timeElapsedRef = useRef(false);

  useEffect(() => {
    const maybeLog = () => {
      if (loggedRef.current) return;
      if (interactedRef.current && timeElapsedRef.current) {
        loggedRef.current = true;
        const visitorId = getOrCreateVisitorId();
        fetch('/api/track-visit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ visitorId }),
          keepalive: true,
        }).catch(() => {});
      }
    };

    const onInteract = () => {
      interactedRef.current = true;
      maybeLog();
    };

    window.addEventListener('mousemove', onInteract);
    window.addEventListener('click', onInteract);
    window.addEventListener('keydown', onInteract);
    window.addEventListener('scroll', onInteract);

    const timer = setTimeout(() => {
      timeElapsedRef.current = true;
      maybeLog();
    }, ENGAGEMENT_MS);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('mousemove', onInteract);
      window.removeEventListener('click', onInteract);
      window.removeEventListener('keydown', onInteract);
      window.removeEventListener('scroll', onInteract);
    };
  }, []);

  return null;
}
