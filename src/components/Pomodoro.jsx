import { useState, useEffect } from "react";
import styles from './Pomodoro.module.css';

export default function StartTimer({ sessionTime = 25, shortBreak = 5, longBreak = 15}) {
    const [activeButton, setActiveButton] = useState('session');
    const [mode, setMode] = useState('session');
    const [seconds, setSeconds] = useState(sessionTime * 60);
    const [isRunning, setIsRunning] = useState(false);
    const [completedSessions, setCompletedSessions] = useState(0);

    useEffect(() => {
        const newTime =
            activeButton === 'session' ? sessionTime :
            activeButton === 'shortBreak' ? shortBreak :
            longBreak;

        setMode(activeButton);
        setSeconds(newTime * 60);
        setIsRunning(false);
    }, [activeButton, sessionTime, shortBreak, longBreak]);

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
        const newTime =
            activeButton === 'session' ? sessionTime :
            activeButton === 'shortBreak' ? shortBreak :
            longBreak;

        setSeconds(newTime * 60);
        setIsRunning(false);
    };

    const formatTime = () => {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    };

    return (
        <div className={styles.pomodoro}>
            <button
                onClick={() => setActiveButton('session')}
                className={`${styles.button} ${styles.session} ${activeButton === 'session' ? styles.active : ''}`}
            >
                Session
            </button>

            <button
                onClick={() => setActiveButton('shortBreak')}
                className={`${styles.button} ${styles.short} ${activeButton === 'shortBreak' ? styles.active : ''}`}
            >
                Short break
            </button>

            <button
                onClick={() => setActiveButton('longBreak')}
                className={`${styles.button} ${styles.long} ${activeButton === 'longBreak' ? styles.active : ''}`}
            >
                Long break
            </button>

            <div className={styles.progress}>
                {Array.from({ length: 4 }).map((_, i) => (
                    <div
                        key={i}
                        className={`${styles.circle} ${i < completedSessions ? styles.filled : ''}`}
                    />
                ))}
            </div>

            <p className={styles.time}>{formatTime()}</p>

            <div className={styles.control}>
                <button onClick={() => setIsRunning(true)} disabled={isRunning} className={styles.start}>
                    Start
                </button>

                <button className={styles.reset} onClick={reset}>
                    <svg width="35" height="35" viewBox="0 0 35 35" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M17.172 2.78677e-05C21.7522 0.00825256 25.9107 1.81312 28.9809 4.74719L31.4493 2.27875C32.4944 1.2338 34.2811 1.97388 34.2811 3.4517V12.7172C34.2811 13.6333 33.5384 14.376 32.6223 14.376H23.3568C21.879 14.376 21.1389 12.5893 22.1839 11.5442L25.0694 8.65869C22.9362 6.66133 20.176 5.55494 17.2435 5.52964C10.8574 5.47449 5.47439 10.6426 5.52962 17.2406C5.58201 23.4998 10.6564 28.7519 17.1405 28.7519C19.983 28.7519 22.6695 27.7374 24.7867 25.8797C25.1145 25.5921 25.6095 25.6096 25.9179 25.918L28.6592 28.6592C28.9959 28.9959 28.9792 29.5449 28.6259 29.8641C25.5865 32.6094 21.5588 34.2811 17.1405 34.2811C7.67412 34.2811 6.91155e-05 26.607 4.64284e-10 17.1407C-6.91146e-05 7.68513 7.71641 -0.0169053 17.172 2.78677e-05Z" fill="#1E1E1E" />
                    </svg>
                </button>

                <button className={styles.edit}>
                    <svg width="34" height="34" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21.6356 6.72187L26.7315 12.281L6.81139 32.6643L0.325775 33.5908L1.25229 27.1052L21.6356 6.72187ZM24.4986 3.94232L28.4409 0L34 5.5591L30.0577 9.50142L24.4986 3.94232Z" fill="#1E1E1E" />
                    </svg>
                </button>
            </div>
        </div>
    );
}


// import { useState, useEffect } from "react"
// import styles from './Pomodoro.module.css';

// export default function StartTimer({sessionTime = 25, shortBreak = 5, longBreak = 10, mode = 'session'}){
//     const [activeButton, setActive] = useState('session');
//     let completedSessions = 2;

//     const [mode, setMode] = useState('session') 
//     const[seconds, setSeconds] = useState(countDownTime * 60);
//     const [isRunning, setIsRunning] = useState(false);
    

//     useEffect(() => {
//         let timer;
//         if(isRunning && seconds > 0){
//             timer = setInterval(() => {
//                 setSeconds((prev) => prev - 1); 
//             }, 1000);
//         }

//         if(seconds == 0) setIsRunning(false);

//         // Check this as well () => {}??
//         return () => clearInterval(timer);
//     }, [isRunning, seconds]);

//     const reset = () => {
//         setSeconds(countDownTime * 60);
//         setIsRunning(false);
//     }

//     const formatTime = () => {
//         // String() and toString() are same same but different
//         const mins = Math.floor(seconds/60).toString().padStart(2,0);
//         const secs = (seconds%60).toString().padStart(2, 0);
//         return `${mins}:${secs}`;
//     }


//     return(
//         <div className={styles.pomodoro}>
//             <button
//                 onClick={() => setActive('session')}
//                 className={`${styles.button} ${styles.session} ${activeButton === 'session' ? styles.active : ''}`}
//             >
//                 Session
//             </button>

//             <button
//                 onClick={() => setActive('shortBreak')}
//                 className={`${styles.button} ${styles.short} ${activeButton === 'shortBreak' ? styles.active : ''}`}
//             >
//                 Short break
//             </button>

//             <button
//                 onClick={() => setActive('longBreak')}
//                 className={`${styles.button} ${styles.long} ${activeButton === 'longBreak' ? styles.active : ''}`}
//             >
//                 Long break
//             </button>

//             <div className={styles.progress}>
//                 {/* Check this out */}
//                 {Array.from({ length: 4 }).map((_, i) => (
//                     <div
//                     key={i}
//                     className={`${styles.circle} ${i < completedSessions ? styles.filled : ''}`}
//                     />
//                 ))}
//             </div>

//             <p className={styles.time}>25:00</p>
//             <div className={styles.control}>
//                 <button className={styles.start}>Start</button>
//                 <button className={styles.reset}>
//                     <svg width="35" height="35" viewBox="0 0 35 35" fill="none" xmlns="http://www.w3.org/2000/svg">
//                         <path d="M17.172 2.78677e-05C21.7522 0.00825256 25.9107 1.81312 28.9809 4.74719L31.4493 2.27875C32.4944 1.2338 34.2811 1.97388 34.2811 3.4517V12.7172C34.2811 13.6333 33.5384 14.376 32.6223 14.376H23.3568C21.879 14.376 21.1389 12.5893 22.1839 11.5442L25.0694 8.65869C22.9362 6.66133 20.176 5.55494 17.2435 5.52964C10.8574 5.47449 5.47439 10.6426 5.52962 17.2406C5.58201 23.4998 10.6564 28.7519 17.1405 28.7519C19.983 28.7519 22.6695 27.7374 24.7867 25.8797C25.1145 25.5921 25.6095 25.6096 25.9179 25.918L28.6592 28.6592C28.9959 28.9959 28.9792 29.5449 28.6259 29.8641C25.5865 32.6094 21.5588 34.2811 17.1405 34.2811C7.67412 34.2811 6.91155e-05 26.607 4.64284e-10 17.1407C-6.91146e-05 7.68513 7.71641 -0.0169053 17.172 2.78677e-05Z" fill="#1E1E1E"/>
//                     </svg>

//                 </button>
//                 <button className={styles.edit}>
//                     <svg width="34" height="34" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
//                         <path d="M21.6356 6.72187L26.7315 12.281L6.81139 32.6643L0.325775 33.5908L1.25229 27.1052L21.6356 6.72187ZM24.4986 3.94232L28.4409 0L34 5.5591L30.0577 9.50142L24.4986 3.94232Z" fill="#1E1E1E"/>
//                     </svg>

//                 </button>
//             </div>
//         </div>
//     )
// }


// //     return(
// //         <div>
// //             <button onClick={() => mode='session'}>Session</button>
// //             <button onClick={() => mode='shortBreak'}>Short break</button>
// //             <button onClick={() => mode='longBreak'}>Long break</button>
// //             <p style = {{fontFamily: 'Gabarito', fontWeight: '700', fontSize: '60px', color: '#1E1E1E'}}>{formatTime()}</p>
// //             {/* <button onClick={isRunning(true)}>Start</button> */}
// //             <button onClick={() => setIsRunning(true)} disabled={isRunning}>Start</button>
// //             <button onClick={() => reset()}>Reset</button>
// //         </div>
// //     )
// // }