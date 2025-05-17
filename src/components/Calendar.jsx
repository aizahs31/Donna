import { useState } from 'react';
import styles from './Calendar.module.css';

const Calendar = () => {
  const [activeTab, setActiveTab] = useState('Today');
  
  return (
    <div className={styles.calendarContainer}>
      <h2 className={styles.title}>Calendar</h2>
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
        {['9', '10', '11', '12', '1', '2', '3', '4', '5'].map((date, index) => (
          <div key={index} className={styles.dayColumn}>
            {['3'].includes(date) && (
              <div className={styles.event}>Project review<br />meeting</div>
            )}
            <div className={styles.dateLabel}>{date}</div>
          </div>
        ))}
      </div>
    </div>
  );
};


export default Calendar;