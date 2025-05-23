import { useEffect, useState } from "react"

export default function DisplayTime(){
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => {
            setTime(new Date());
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const timeBlock = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).split(' ')[0];
    const amPm = time.toLocaleTimeString([], { hour12: true }).slice(-2).toLocaleUpperCase();
    const day = time.toLocaleDateString([], {weekday: 'short'});

    return(
        <div
        style={{
            gridArea: 'time',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            height: '100%',
            width: '100%',
            boxSizing: 'border-box',
        }}
        >
            <div style={{display: 'flex', alignItems: 'flex-start', color: '#1E1E1E'}}>
                <p style={{fontFamily: 'Gabarito', fontSize: '65px', fontWeight: '700', margin: 0, lineHeight: 1, maxWidth: '175px'}}>{timeBlock}</p>
                <div style={{display: 'flex', flexDirection: 'column',  marginLeft: '5px', height: '60px'}}>
                    <p style={{fontFamily: 'Gabarito', fontSize: '30px', fontWeight: '600', margin: 0, lineHeight: 1}}>{day}</p>
                    <p style={{fontFamily: 'Gabarito', fontSize: '28px', fontWeight: '600', margin: 0, lineHeight: 1}}>{amPm}</p>
                </div>
            </div>
        </div>
    )
}