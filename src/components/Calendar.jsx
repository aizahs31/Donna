import styles from './Calendar.module.css';

const Calendar = () => {
  return (
    <div className={styles.calendarContainer}>
      <h2 className={styles.title}>Calendar</h2>
      <div className={styles.tabs}>
        <button className={styles.tab}>Today</button>
        <button className={styles.tab}>This week</button>
        <button className={styles.tab}>This month</button>
      </div>
      <div className={styles.grid}>
        {['9', '10', '11', '12', '1', '2', '3', '4', '5'].map((date, index) => (
          <div key={index} className={styles.dayColumn}>
            {['3'].includes(date) ? (
              <div className={styles.event}>Project review<br />meeting</div>
            ) : null}
            <div className={styles.dateLabel}>{date}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Calendar;
