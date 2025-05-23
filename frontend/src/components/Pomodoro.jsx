import { useState, useEffect, useCallback } from "react";

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
            <div className="timer-content">
                <div className="button-group">
                    <button
                        onClick={() => setActiveButton('session')}
                        className={`timer-button ${activeButton === 'session' ? 'active' : ''}`}
                    >
                        Session
                    </button>

                    <button
                        onClick={() => setActiveButton('shortBreak')}
                        className={`timer-button short-break-btn ${activeButton === 'shortBreak' ? 'active' : ''}`}
                    >
                        Short Break
                    </button>

                    <button
                        onClick={() => setActiveButton('longBreak')}
                        className={`timer-button long-break-btn ${activeButton === 'longBreak' ? 'active' : ''}`}
                    >
                        Long Break
                    </button>
                </div>

                <div className={`progress ${justCompleted ? 'completed' : ''}`}>
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div
                            key={i}
                            className={`circle ${i < completedSessions ? 'filled' : ''}`}
                        />
                    ))}
                </div>

                <div className="time-row">
                    <div className="time-display">{formatTime()}</div>
                    <div className="control-buttons">
                        <button
                            onClick={() => setIsRunning(prev => !prev)}
                            className="start-btn"
                        >
                            {isRunning ? 'Pause' : 'Start'}
                        </button>

                        <button className="icon-btn" onClick={reset}>
                            <svg width="30" height="30" viewBox="0 0 35 35" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M17.172 2.78677e-05C21.7522 0.00825256 25.9107 1.81312 28.9809 4.74719L31.4493 2.27875C32.4944 1.2338 34.2811 1.97388 34.2811 3.4517V12.7172C34.2811 13.6333 33.5384 14.376 32.6223 14.376H23.3568C21.879 14.376 21.1389 12.5893 22.1839 11.5442L25.0694 8.65869C22.9362 6.66133 20.176 5.55494 17.2435 5.52964C10.8574 5.47449 5.47439 10.6426 5.52962 17.2406C5.58201 23.4998 10.6564 28.7519 17.1405 28.7519C19.983 28.7519 22.6695 27.7374 24.7867 25.8797C25.1145 25.5921 25.6095 25.6096 25.9179 25.918L28.6592 28.6592C28.9959 28.9959 28.9792 29.5449 28.6259 29.8641C25.5865 32.6094 21.5588 34.2811 17.1405 34.2811C7.67412 34.2811 6.91155e-05 26.607 4.64284e-10 17.1407C-6.91146e-05 7.68513 7.71641 -0.0169053 17.172 2.78677e-05Z" fill="#1E1E1E" />
                            </svg>
                        </button>

                        <button className="icon-btn" onClick={handleEditOpen}>
                            <svg width="30" height="30" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M21.6356 6.72187L26.7315 12.281L6.81139 32.6643L0.325775 33.5908L1.25229 27.1052L21.6356 6.72187ZM24.4986 3.94232L28.4409 0L34 5.5591L30.0577 9.50142L24.4986 3.94232Z" fill="#1E1E1E" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {showEditPopup && (
                <div className="edit-overlay">
                    <div className="edit-modal">
                        <h3>Edit Times</h3>
                        
                        <div className="input-group">
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

                        <div className="modal-buttons">
                            <button onClick={handleEditCancel} className="cancel-btn">
                                Cancel
                            </button>
                            <button onClick={handleEditSubmit} className="apply-btn">
                                Apply
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`

                .timer-content {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    // gap: 15px;
                    height: 100%;
                }

                .button-group {
                    display: flex;
                    gap: 8px;
                    justify-content: center;
                    flex-wrap: nowrap;
                    overflow-x: auto;
                    white-space: nowrap;
                    margin-bottom: 18px;
                }

                .timer-button {
                    border-radius: 20px;
                    border: 2px solid #1E1E1E;
                    font-family: 'Gabarito', Arial, sans-serif;
                    font-weight: 500;
                    color: #1E1E1E;
                    transition: all 0.2s ease, padding 0.2s cubic-bezier(0.4,0,0.2,1);
                    padding: 6px 15px;
                    font-size: 14px;
                    cursor: pointer;
                    background-color: #FFD8DF;
                    min-width: 60px;
                    white-space: nowrap;
                }

                .timer-button:focus {
                    outline: none;
                }

                .timer-button:hover {
                    transform: translateY(-1px);
                }

                .timer-button.active {
                    background-color: #1E1E1E;
                    color: #FEF9F1;
                }

                .short-break-btn {
                    padding-left: 25px;
                    padding-right: 25px;
                    transition: padding 0.2s cubic-bezier(0.4,0,0.2,1);
                }
                .long-break-btn {
                    padding-left: 27px;
                    padding-right: 27px;
                    transition: padding 0.2s cubic-bezier(0.4,0,0.2,1);
                }
                .timer-button {
                    /* Responsive padding for all timer buttons */
                }
                @media (max-width: 900px) {
                    .timer-button {
                        padding-left: 10px;
                        padding-right: 10px;
                    }
                    .short-break-btn {
                        padding-left: 15px;
                        padding-right: 15px;
                    }
                    .long-break-btn {
                        padding-left: 17px;
                        padding-right: 17px;
                    }
                }
                @media (max-width: 700px) {
                    .timer-button {
                        padding-left: 8px;
                        padding-right: 8px;
                    }
                    .short-break-btn {
                        padding-left: 10px;
                        padding-right: 10px;
                    }
                    .long-break-btn {
                        padding-left: 10px;
                        padding-right: 10px;
                    }
                }
                @media (max-width: 480px) {
                    .timer-button {
                        padding-left: 6px;
                        padding-right: 6px;
                    }
                }

                .progress {
                    display: flex;
                    justify-content: center;
                    gap: 6px;
                    transition: all 0.3s ease;
                    margin-bottom: 10px;
                }

                .progress.completed {
                    animation: completedPulse 0.5s ease-in-out;
                }

                @keyframes completedPulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                    100% { transform: scale(1); }
                }

                .circle {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    border: 2px solid #1E1E1E;
                    background-color: #747474;
                    transition: all 0.3s ease;
                }

                .circle.filled {
                    background-color: #FFD8DF;
                }

                .progress.completed .circle.filled {
                    background-color: #FF69B4;
                    border-color: #FF69B4;
                    box-shadow: 0 0 8px rgba(255, 105, 180, 0.5);
                }

                .time-row {
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    justify-content: center;
                    width: 100%;
                    gap: 24px;
                }

                .time-display {
                    font-family: 'Gabarito', Arial, sans-serif;
                    font-size: 2.8rem;
                    font-weight: 700;
                    color: #1E1E1E;
                    text-align: center;
                    margin: 5px 0;
                    flex-grow: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-width: 120px;
                }

                .control-buttons {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    justify-content: flex-end;
                }

                .start-btn {
                    border-radius: 20px;
                    padding: 8px 20px;
                    background-color: #1E1E1E;
                    color: #FEF9F1;
                    border: none;
                    font-family: 'Gabarito', Arial, sans-serif;
                    font-weight: 500;
                    font-size: 16px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .start-btn:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                }

                .icon-btn {
                    padding: 4px;
                    margin: 0;
                    background-color: transparent;
                    border: none;
                    display: flex;
                    align-items: center;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    border-radius: 50%;
                }

                .icon-btn:hover {
                    transform: scale(1.1);
                    background-color: rgba(30, 30, 30, 0.1);
                }

                .edit-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 15px;
                    z-index: 10;
                }

                .edit-modal {
                    background-color: #FEF9F1;
                    padding: 20px;
                    border-radius: 15px;
                    border: 2px solid #1E1E1E;
                    width: 90%;
                    max-width: 300px;
                    animation: modalSlide 0.3s ease;
                }

                @keyframes modalSlide {
                    from {
                        opacity: 0;
                        transform: scale(0.9);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }

                .edit-modal h3 {
                    font-family: 'Gabarito', Arial, sans-serif;
                    font-size: 1.2rem;
                    font-weight: 700;
                    color: #1E1E1E;
                    margin: 0 0 15px 0;
                    text-align: center;
                }

                .input-group {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    margin-bottom: 15px;
                }

                .input-group label {
                    font-family: 'Gabarito', Arial, sans-serif;
                    font-weight: 500;
                    color: #1E1E1E;
                    font-size: 14px;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .input-group input {
                    border-radius: 10px;
                    border: 2px solid #1E1E1E;
                    padding: 8px 12px;
                    font-family: 'Gabarito', Arial, sans-serif;
                    font-size: 14px;
                    background-color: #FFD8DF;
                    color: #1E1E1E;
                    transition: all 0.2s ease;
                }

                .input-group input:focus {
                    outline: none;
                    background-color: #FEF9F1;
                    box-shadow: 0 0 0 2px rgba(30, 30, 30, 0.1);
                }

                .modal-buttons {
                    display: flex;
                    gap: 10px;
                    justify-content: center;
                }

                .modal-buttons button {
                    border-radius: 15px;
                    border: 2px solid #1E1E1E;
                    padding: 6px 15px;
                    font-family: 'Gabarito', Arial, sans-serif;
                    font-weight: 500;
                    font-size: 14px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .cancel-btn {
                    background-color: #747474;
                    color: #FEF9F1;
                }

                .apply-btn {
                    background-color: #1E1E1E;
                    color: #FEF9F1;
                }

                .modal-buttons button:hover {
                    transform: translateY(-1px);
                }

                @media (max-width: 480px) {
                    .timer-container {
                        padding: 10px;
                    }

                    .time-display {
                        font-size: 1.8rem;
                    }

                    .timer-button {
                        padding: 4px 10px;
                        font-size: 12px;
                        min-width: 50px;
                    }

                    .control-buttons {
                        gap: 8px;
                    }

                    .start-btn {
                        padding: 6px 15px;
                        font-size: 14px;
                    }

                    .time-row {
                        flex-direction: column;
                        gap: 10px;
                    }
                    .time-display {
                        font-size: 2rem;
                        min-width: 0;
                    }
                }
            `}</style>
        </div>
    );
}