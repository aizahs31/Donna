import { useState, useEffect, useCallback, forwardRef,useImperativeHandle } from 'react';
import styles from './Calendar.module.css';
import { USER_TIME_ZONE } from '../config';
import { apiFetch, authReady, isConnected, startLogin, logout, AUTH_CHANGED_EVENT } from '../utils/session';

const AUTH_ERROR_MESSAGES = {
  access_denied: 'Google access was declined.',
  state_mismatch: 'That sign-in link did not start here. Please connect again.',
};

// Local-time [start, end] window for a tab, matching filterEvents below.
const getRangeBounds = (tab, now = new Date()) => {
  const start = new Date(now);
  const end = new Date(now);
  if (tab === 'This week') {
    start.setDate(now.getDate() - now.getDay());
    end.setTime(start.getTime());
    end.setDate(start.getDate() + 6);
  } else if (tab === 'This month') {
    start.setDate(1);
    end.setMonth(now.getMonth() + 1, 0);
  }
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return { timeMin: start.toISOString(), timeMax: end.toISOString() };
};

const Calendar = forwardRef((props, ref) => {
  const [activeTab, setActiveTab] = useState('Today');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(isConnected);
  const [authError, setAuthError] = useState(null);

  const getRangeParam = (tab) => {
    switch (tab) {
      case 'This week':
        return 'week';
      case 'This month':
        return 'month';
      default:
        return 'today';
    }
  };

  const fetchEvents = useCallback(async () => {
    const range = getRangeParam(activeTab);
    setLoading(true);
    try {
      // Finish a pending Google sign-in redirect before the first request
      await authReady;
      if (!isConnected()) {
        setConnected(false);
        setEvents([]);
        setError(null);
        return;
      }
      setConnected(true);
      const { timeMin, timeMax } = getRangeBounds(activeTab);
      const params = new URLSearchParams({ range, timeMin, timeMax, timeZone: USER_TIME_ZONE });
      const response = await apiFetch(`/events?${params}`);
      if (response.status === 401) {
        setConnected(false);
        setEvents([]);
        setError(null);
        return;
      }
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      const data = await response.json();
      setEvents(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useImperativeHandle(ref, () => ({
    reloadEvents: fetchEvents
  }), [fetchEvents]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Show why a sign-in failed, if it did
  useEffect(() => {
    authReady.then(result => {
      if (result.status === 'error') {
        setAuthError(AUTH_ERROR_MESSAGES[result.error] || 'Could not connect Google Calendar. Please try again.');
      }
    });
  }, []);

  // Re-fetch when this browser connects or disconnects (e.g. session expired via Donna)
  useEffect(() => {
    const onAuthChanged = () => {
      setConnected(isConnected());
      fetchEvents();
    };
    window.addEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
  }, [fetchEvents]);

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const filterEvents = (events) => {
    const now = new Date();

    if (activeTab === 'Today') {
      return events.filter(event => {
        const start = new Date(event.start.dateTime || event.start.date);
        return start.toDateString() === now.toDateString();
      });
    }

    if (activeTab === 'This week') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      return events.filter(event => {
        const start = new Date(event.start.dateTime || event.start.date);
        return start >= startOfWeek && start <= endOfWeek;
      });
    }

    if (activeTab === 'This month') {
      const year = now.getFullYear();
      const month = now.getMonth();
      return events.filter(event => {
        const start = new Date(event.start.dateTime || event.start.date);
        return start.getFullYear() === year && start.getMonth() === month;
      });
    }

    return events;
  };

  return (
    <div className={styles.calendarContainer}>
      <div className={styles.headerRow}>
        <h2 className={styles.title}>Calendar</h2>
      </div>

      <div className={styles.tabs}>
        {['Today', 'This week', 'This month'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
          >
            {tab}
          </button>
        ))}
        {connected && (
          <>
            <button className={styles.refreshButton} onClick={() => fetchEvents()}>Refresh</button>
            <button className={styles.refreshButton} onClick={() => logout()} title="Disconnect Google Calendar">Disconnect</button>
          </>
        )}

      </div>

      <div className={styles.grid}>
        {!connected && !loading ? (
          <div className={styles.message}>
            {authError && <div style={{ marginBottom: '0.5rem' }}>{authError}</div>}
            <button className={styles.refreshButton} onClick={startLogin}>Connect Google Calendar</button>
          </div>
        ) : loading ? (
          <div className={styles.message}>Loading events...</div>
        ) : error ? (
          <div className={styles.message}>Error: {error}</div>
        ) : filterEvents(events).length === 0 ? (
          <div className={styles.message}>No events found</div>
        ) : (
          filterEvents(events).map((event, index) => (
            <div key={event.id || index} className={styles.event}>
              <div className={styles.eventHeader}>
                <div className={styles.eventTitle}>{event.summary}</div>
                <div className={styles.eventDate}>
                  {formatDate(event.start.dateTime || event.start.date)}
                </div>
              </div>
              <div className={styles.eventTime}>
                {formatTime(event.start.dateTime || event.start.date)} - {formatTime(event.end.dateTime || event.end.date)}
              </div>
              {event.description && (
                <div className={styles.eventDescription}>{event.description}</div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
});

export default Calendar;