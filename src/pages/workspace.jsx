import StartTimer from '../components/Pomodoro';
import ShowSpotify from '../components/Spotify';
import Task from '../components/Task';
import DisplayTime from '../components/Time';
import Calendar from '../components/Calendar';
import Donna from '../components/Donna';

const Workspace = () => {
  return (
    <div
      className="workspace-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: '1.3fr 1.55fr 1.1fr',
        gridTemplateRows: '0.25fr 0.7fr 0.8fr 1fr 1fr 1fr',
        columnGap: '20px',
        rowGap: '20px',
        height: '100vh',
        padding: '20px',
        boxSizing: 'border-box',
        gridTemplateAreas: `
          "timer task time"
          "timer task donna"
          "spotify task donna"
          "calendar calendar donna"
          "calendar calendar donna"
          "calendar calendar donna"
        `,
      }}
    >
      
      <div
        style={{
          backgroundColor: '#FEF9F1',
          border: '2px solid #CDCDCD',
          borderRadius: '10px',
          padding: '1rem',
          gridArea: 'timer',
          width: '100%',
          height: '100%',
          boxSizing: 'border-box',
        }}
      >
        <StartTimer />
      </div>

      <div
        style={{
          gridArea: 'spotify',
          width: '100%',
          height: '100%',
          boxSizing: 'border-box',
        }}
      >
        <ShowSpotify />
      </div>
      
      <div
        style={{
          gridArea: 'task',
          overflowY: 'auto',
          width: '100%',
          height: '100%',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#FEF9F1',
          border: '2px solid #CDCDCD',
          borderRadius: '10px',
          padding: '1rem',
        }}
      >
        <Task />
      </div>

      <div
        className="hide-on-mobile"
        style={{
          gridArea: 'time',
          width: '100%',
          height: '100%',
          boxSizing: 'border-box',
        }}
      >
        <DisplayTime />
      </div>

      <div
        style={{
          gridArea: 'calendar',
          width: '100%',
          height: '100%',
          maxHeight: '100%',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Calendar />
      </div>

      <div
        className="hide-on-mobile"
        style={{
          gridArea: 'donna',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          width: '100%',
          boxSizing: 'border-box',
          justifyContent: 'flex-start',
        }}
      >
        <Donna />
      </div>
    </div>
  );
};

export default Workspace;