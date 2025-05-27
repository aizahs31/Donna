import { useState, useEffect, useCallback } from "react";
import styles from "./Pomodoro.module.css";

export default function StartTimer({ sessionTime = 25, shortBreak = 5, longBreak = 15 }) {
    const [activeButton, setActiveButton] = useState('session');
    const [mode, setMode] = useState('session');
    const [isRunning, setIsRunning] = useState(false);
    const [completedSessions, setCompletedSessions] = useState(0);
    const [showEditPopup, setShowEditPopup] = useState(false);
    const [justCompleted, setJustCompleted] = useState(false);
    
    // Custom time values (these are the actual values being used)
    const [customSession, setCustomSession] = useState(sessionTime);
    const [customShort, setCustomShort] = useState(shortBreak);
    const [customLong, setCustomLong] = useState(longBreak);
    
    // Temporary values for the edit form
    const [tempSession, setTempSession] = useState(sessionTime);
    const [tempShort, setTempShort] = useState(shortBreak);
    const [tempLong, setTempLong] = useState(longBreak);
    
    const [seconds, setSeconds] = useState(sessionTime * 60);

    // Get current time based on active mode
    const getCurrentTime = useCallback(() => {
        switch(activeButton) {
            case 'session': return customSession;
            case 'shortBreak': return customShort;
            case 'longBreak': return customLong;
            default: return customSession;
        }
    }, [activeButton, customSession, customShort, customLong]);

    useEffect(() => {
        const newTime = getCurrentTime();
        setMode(activeButton);
        setSeconds(newTime * 60);
        setIsRunning(false);
        setJustCompleted(false);
    }, [activeButton, customSession, customShort, customLong, getCurrentTime]);

    useEffect(() => {
        let timer;

        if (isRunning && seconds > 0) {
            timer = setInterval(() => {
                setSeconds((prev) => prev - 1);
            }, 1000);
        }

        if (seconds === 0 && isRunning) {
            setIsRunning(false);

            if (mode === 'session') {
                const newCompleted = completedSessions + 1;
                setCompletedSessions(newCompleted);
                setJustCompleted(true);
                
                // Clear the pink indication after 2 seconds
                setTimeout(() => setJustCompleted(false), 2000);

                if (newCompleted % 4 === 0) {
                    setActiveButton('longBreak');
                } else {
                    setActiveButton('shortBreak');
                }

            } else if (mode === 'shortBreak') {
                setActiveButton('session');

            } else if (mode === 'longBreak') {
                setCompletedSessions(0);
                setActiveButton('session');
            }
        }

        return () => clearInterval(timer);
    }, [isRunning, seconds, mode, completedSessions]);

    const reset = () => {
        const newTime = getCurrentTime();
        setSeconds(newTime * 60);
        setIsRunning(false);
        setJustCompleted(false);
    };

    const formatTime = () => {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    };

    const handleEditSubmit = () => {
        // Apply the temporary values to the actual custom values
        setCustomSession(tempSession);
        setCustomShort(tempShort);
        setCustomLong(tempLong);
        
        // Update current timer if not running
        if (!isRunning) {
            const newTime = activeButton === 'session' ? tempSession :
                           activeButton === 'shortBreak' ? tempShort : tempLong;
            setSeconds(newTime * 60);
        }
        
        setShowEditPopup(false);
    };

    const handleEditCancel = () => {
        // Reset temporary values to current custom values
        setTempSession(customSession);
        setTempShort(customShort);
        setTempLong(customLong);
        setShowEditPopup(false);
    };

    const handleEditOpen = () => {
        // Set temporary values to current custom values when opening
        setTempSession(customSession);
        setTempShort(customShort);
        setTempLong(customLong);
        setShowEditPopup(true);
    };

    return (
        <div>
            <div className={styles.timerContent}>
                <div className={styles.buttonGroup}>
                    <button
                        onClick={() => setActiveButton('session')}
                        className={`${styles.timerButton} ${activeButton === 'session' ? styles.active : ''}`}
                    >
                        Session
                    </button>

                    <button
                        onClick={() => setActiveButton('shortBreak')}
                        className={`${styles.timerButton} ${styles.shortBreakBtn} ${activeButton === 'shortBreak' ? styles.active : ''}`}
                    >
                        Short Break
                    </button>

                    <button
                        onClick={() => setActiveButton('longBreak')}
                        className={`${styles.timerButton} ${styles.longBreakBtn} ${activeButton === 'longBreak' ? styles.active : ''}`}
                    >
                        Long Break
                    </button>
                </div>

                <div className={`${styles.progress} ${justCompleted ? styles.completed : ''}`}>
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div
                            key={i}
                            className={`${styles.circle} ${i < completedSessions ? styles.filled : ''}`}
                        />
                    ))}
                </div>

                <div className={styles.timeRow}>
                    <div className={styles.timeDisplay}>{formatTime()}</div>
                    <div className={styles.controlButtons}>
                        <button
                            onClick={() => setIsRunning(prev => !prev)}
                            className={styles.startBtn}
                        >
                            {isRunning ? 'Pause' : 'Start'}
                        </button>

                        <button className={styles.iconBtn} onClick={reset}>
                            <svg width="30" height="30" viewBox="0 0 35 35" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M17.172 2.78677e-05C21.7522 0.00825256 25.9107 1.81312 28.9809 4.74719L31.4493 2.27875C32.4944 1.2338 34.2811 1.97388 34.2811 3.4517V12.7172C34.2811 13.6333 33.5384 14.376 32.6223 14.376H23.3568C21.879 14.376 21.1389 12.5893 22.1839 11.5442L25.0694 8.65869C22.9362 6.66133 20.176 5.55494 17.2435 5.52964C10.8574 5.47449 5.47439 10.6426 5.52962 17.2406C5.58201 23.4998 10.6564 28.7519 17.1405 28.7519C19.983 28.7519 22.6695 27.7374 24.7867 25.8797C25.1145 25.5921 25.6095 25.6096 25.9179 25.918L28.6592 28.6592C28.9959 28.9959 28.9792 29.5449 28.6259 29.8641C25.5865 32.6094 21.5588 34.2811 17.1405 34.2811C7.67412 34.2811 6.91155e-05 26.607 4.64284e-10 17.1407C-6.91146e-05 7.68513 7.71641 -0.0169053 17.172 2.78677e-05Z" fill="#1E1E1E" />
                            </svg>
                        </button>

                        <button className={styles.iconBtn} onClick={handleEditOpen}>
                            <svg width="30" height="30" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M21.6356 6.72187L26.7315 12.281L6.81139 32.6643L0.325775 33.5908L1.25229 27.1052L21.6356 6.72187ZM24.4986 3.94232L28.4409 0L34 5.5591L30.0577 9.50142L24.4986 3.94232Z" fill="#1E1E1E" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {showEditPopup && (
                <div className={styles.editOverlay}>
                    <div className={styles.editModal}>
                        <h3>Edit Times</h3>
                        
                        <div className={styles.inputGroup}>
                            <label>
                                Session:
                                <input
                                    type="number"
                                    min="0"
                                    max="120"
                                    value={tempSession}
                                    onChange={e => setTempSession(Math.max(1, Number(e.target.value)))}
                                />
                            </label>

                            <label>
                                Short Break:
                                <input
                                    type="number"
                                    min="0"
                                    max="60"
                                    value={tempShort}
                                    onChange={e => setTempShort(Math.max(1, Number(e.target.value)))}
                                />
                            </label>

                            <label>
                                Long Break:
                                <input
                                    type="number"
                                    min="0"
                                    max="120"
                                    value={tempLong}
                                    onChange={e => setTempLong(Math.max(1, Number(e.target.value)))}
                                />
                            </label>
                        </div>

                        <div className={styles.modalButtons}>
                            <button onClick={handleEditCancel} className={styles.cancelBtn}>
                                Cancel
                            </button>
                            <button onClick={handleEditSubmit} className={styles.applyBtn}>
                                Apply
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}