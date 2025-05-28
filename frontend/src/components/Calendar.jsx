import { useState, useEffect } from 'react';
import styles from './Calendar.module.css';

const Calendar = () => {
  const [activeTab, setActiveTab] = useState('Today');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch('http://localhost:3000/events');
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

    fetchEvents();
  }, []);

  const formatEventTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <div className={styles.calendarContainer}>
      <div className={styles.headerRow}>
        <h2 className={styles.title}>Calendar</h2>
        <button 
          onClick={() => window.location.href = 'http://localhost:3000/auth'}
          className={styles.connectButton}
        >
          Connect Calendar
        </button>
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
        ) : events.length === 0 ? (
          <div className={styles.message}>No events found</div>
        ) : (
          events.map((event, index) => (
            <div key={index} className={styles.event}>
              <div className={styles.eventTime}>
                {formatEventTime(event.start.dateTime || event.start.date)}
              </div>
              <div className={styles.eventTitle}>{event.summary}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Calendar;