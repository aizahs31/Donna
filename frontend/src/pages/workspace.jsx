import Donna from '../components/Donna';
import StartTimer from '../components/Pomodoro';
import ShowSpotify from '../components/Spotify';
import Task from '../components/Task';
import DisplayTime from '../components/Time';
import Calendar from '../components/Calendar';
import { useState, useRef } from 'react';
import styles from './workspace.module.css';

const Workspace = () => {
  const [showDonna, setShowDonna] = useState(false);
  const calendarRef = useRef(null);

  return (
    <div className={styles.workspaceGrid}>
      <div className={styles.timerArea}>
        <StartTimer />
      </div>
      <div className={styles.spotifyArea}>
        <ShowSpotify />
      </div>
      <div className={styles.taskArea}>
        <Task />
      </div>
      <div className={styles.timeArea}>
        <DisplayTime />
      </div>
      <div className={styles.calendarArea}>
        <Calendar ref={calendarRef} />
      </div>
      <div className={styles.donnaArea + ' ' + (showDonna ? styles.donnaVisible : '')}>
        <Donna calendarRef={calendarRef} />
      </div>
      <button
        className={styles.donnaFab}
        onClick={() => setShowDonna((v) => !v)}
        aria-label="Open Donna"
      >
        <span style={{fontSize: 24}}>💬</span>
      </button>
    </div>
  );
};

export default Workspace;