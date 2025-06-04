import { useState, useEffect } from 'react';
import styles from './Calendar.module.css';

const Calendar = () => {
  const [activeTab, setActiveTab] = useState('Today');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEventPopup, setShowEventPopup] = useState(false);
  const [eventForm, setEventForm] = useState({
    summary: '',
    start: '',
    end: '',
    repeat: 'none',
    notification: 10,
  });
  const [eventLoading, setEventLoading] = useState(false);
  const [eventError, setEventError] = useState(null);

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

  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line
  }, [activeTab]);

  const formatEventTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleEventFormChange = (e) => {
    const { name, value } = e.target;
    setEventForm((prev) => ({ ...prev, [name]: value }));
  };

  // Ensure eventForm.start and end are full ISO strings
  const handleEventSubmit = async (e) => {
    e.preventDefault();
    setEventLoading(true);
    setEventError(null);
    try {
      // Convert date and time fields to ISO string
      const startDate = eventForm.start ? eventForm.start.split('T')[0] : '';
      const startTime = eventForm.start ? eventForm.start.split('T')[1] : '';
      const endDate = eventForm.end ? eventForm.end.split('T')[0] : '';
      const endTime = eventForm.end ? eventForm.end.split('T')[1] : '';
      const startISO = startDate && startTime ? new Date(`${startDate}T${startTime}`).toISOString() : '';
      const endISO = endDate && endTime ? new Date(`${endDate}T${endTime}`).toISOString() : '';
      const res = await fetch('http://localhost:3000/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: eventForm.summary,
          start: startISO,
          end: endISO,
          repeat: eventForm.repeat,
          notification: eventForm.notification,
        }),
      });
      if (!res.ok) throw new Error('Failed to create event');
      setShowEventPopup(false);
      setEventForm({ summary: '', start: '', end: '', repeat: 'none', notification: 10 });
      fetchEvents();
    } catch (err) {
      setEventError(err.message);
    } finally {
      setEventLoading(false);
    }
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
        <button
          onClick={() => setShowEventPopup(true)}
          className={styles.setEventButton}
        >
          Set Event
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
        ) : filterEvents(events).length === 0 ? (
          <div className={styles.message}>No events found</div>
        ) : (
          filterEvents(events).map((event, index) => (
            <div key={index} className={styles.event}>
              <div className={styles.eventTime}>
                {formatEventTime(event.start.dateTime || event.start.date)}
              </div>
              <div className={styles.eventTitle}>{event.summary}</div>
            </div>
          ))
        )}
      </div>
      {showEventPopup && (
        <div className={styles.eventPopupOverlay}>
          <div className={styles.eventPopupModal}>
            <h3>Add Event</h3>
            <form onSubmit={handleEventSubmit} className={styles.eventForm}>
              <label>
                Event Name
                <input name="summary" value={eventForm.summary} onChange={handleEventFormChange} required />
              </label>
              <label>
                Start Date & Time
                <div className={styles.dateTimeRow}>
                  <input
                    name="startDate"
                    type="date"
                    value={eventForm.start ? eventForm.start.split('T')[0] : ''}
                    onChange={e => {
                      setEventForm(prev => ({
                        ...prev,
                        start: e.target.value
                          ? e.target.value + (prev.start ? prev.start.slice(10) : 'T00:00')
                          : '',
                      }));
                    }}
                    className={styles.dateInput}
                  />
                  <input
                    name="startTime"
                    type="time"
                    value={eventForm.start ? eventForm.start.split('T')[1] || '' : ''}
                    onChange={e => {
                      setEventForm(prev => ({
                        ...prev,
                        start: prev.start.split('T')[0] + 'T' + e.target.value,
                      }));
                    }}
                    className={styles.timeInput}
                  />
                </div>
              </label>
              <label>
                End Date & Time
                <div className={styles.dateTimeRow}>
                  <input
                    name="endDate"
                    type="date"
                    value={eventForm.end ? eventForm.end.split('T')[0] : ''}
                    onChange={e => {
                      setEventForm(prev => ({
                        ...prev,
                        end: e.target.value
                          ? e.target.value + (prev.end ? prev.end.slice(10) : 'T00:00')
                          : '',
                      }));
                    }}
                    className={styles.dateInput}
                  />
                  <input
                    name="endTime"
                    type="time"
                    value={eventForm.end ? eventForm.end.split('T')[1] || '' : ''}
                    onChange={e => {
                      setEventForm(prev => ({
                        ...prev,
                        end: prev.end.split('T')[0] + 'T' + e.target.value,
                      }));
                    }}
                    className={styles.timeInput}
                  />
                </div>
              </label>
              <label>
                Repeat
                <select name="repeat" value={eventForm.repeat} onChange={handleEventFormChange}>
                  <option value="none">None</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </label>
              <label>
                Notification (minutes before)
                <input name="notification" type="number" min="0" value={eventForm.notification} onChange={handleEventFormChange} />
              </label>
              <div className={styles.eventFormButtons}>
                <button type="button" onClick={() => setShowEventPopup(false)} className={styles.cancelBtn}>Cancel</button>
                <button type="submit" disabled={eventLoading} className={styles.applyBtn}>Add</button>
              </div>
              {eventError && <div className={styles.message}>Error: {eventError}</div>}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;