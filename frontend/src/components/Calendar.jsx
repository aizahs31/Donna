import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import styles from './Calendar.module.css';

const Calendar = forwardRef((props, ref) => {
  const [activeTab, setActiveTab] = useState('Today');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch events with range filter
  const fetchEvents = async () => {
    try {
      let range = 'today';
      if (activeTab === 'Today') range = 'today';
      else if (activeTab === 'This week') range = 'week';
      else if (activeTab === 'This month') range = 'month';
      const response = await fetch(`http://localhost:3000/events?range=${range}`);
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      const data = await response.json();
      setEvents(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    reloadEvents: fetchEvents
  }));

  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line
  }, [activeTab]);

  // Set up polling for events
  useEffect(() => {
    const pollInterval = setInterval(fetchEvents, 30000); // Poll every 30 seconds
    return () => clearInterval(pollInterval);
  }, []);

  const formatEventTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatEventDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString([], { 
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  // Filter events based on activeTab
  const filterEvents = (events) => {
    const now = new Date();
    if (activeTab === 'Today') {
      return events.filter(event => {
        const start = new Date(event.start.dateTime || event.start.date);
        return start.toDateString() === now.toDateString();
      });
    } else if (activeTab === 'This week') {
      // Get start and end of current week (Sunday to Saturday)
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0,0,0,0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23,59,59,999);
      return events.filter(event => {
        const start = new Date(event.start.dateTime || event.start.date);
        return start >= startOfWeek && start <= endOfWeek;
      });
    } else if (activeTab === 'This month') {
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
      </div>
      <div className={styles.grid}>
        {loading ? (
          <div className={styles.message}>Loading events...</div>
        ) : error ? (
          <div className={styles.message}>Error: {error}</div>
        ) : filterEvents(events).length === 0 ? (
          <div className={styles.message}>No events found</div>
        ) : (
          filterEvents(events).map((event, index) => (
            <div key={index} className={styles.event}>
              <div className={styles.eventHeader}>
                <div className={styles.eventTitle}>{event.summary}</div>
                <div className={styles.eventDate}>
                  {formatEventDate(event.start.dateTime || event.start.date)}
                </div>
              </div>
              <div className={styles.eventTime}>
                {formatEventTime(event.start.dateTime || event.start.date)} - {formatEventTime(event.end.dateTime || event.end.date)}
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