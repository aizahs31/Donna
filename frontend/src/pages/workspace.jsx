import Donna from '../components/Donna';
import StartTimer from '../components/Pomodoro';
import ShowSpotify from '../components/Spotify';
import Task from '../components/Task';
import DisplayTime from '../components/Time';
import Calendar from '../components/Calendar';
import ThemeToggle from '../components/ThemeToggle';
import { useState, useRef, useEffect } from 'react';
import { useWorkspaceTheme } from '../context/ThemeContext'; // changed import
import styles from './workspace.module.css';

// Theme options separated by light/dark
const LIGHT_THEMES = [
  { key: 'cherry', label: 'Cherry', className: 'cherry-theme' },
  { key: 'blue', label: 'Blue', className: 'blue-theme' },
];
const DARK_THEMES = [
  { key: 'dark', label: 'Dark', className: 'dark-theme' },
  { key: 'night', label: 'Night', className: 'night-theme' },
];

const ALL_THEMES = [...LIGHT_THEMES, ...DARK_THEMES];

const getThemeObj = (key) => ALL_THEMES.find(t => t.key === key);

const Workspace = () => {
  // Remove selectedTheme and pendingTheme state, use ThemeContext instead
  const { theme, setTheme, toggleTheme } = useWorkspaceTheme(); // changed hook
  const [pendingTheme, setPendingTheme] = useState(theme);
  const [showDonna, setShowDonna] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const calendarRef = useRef(null);

  // Keep pendingTheme in sync with theme when theme changes or settings panel closes
  useEffect(() => {
    if (!showSettings) setPendingTheme(theme);
  }, [theme, showSettings]);

  // Preview theme when pendingTheme changes (but don't persist)
  useEffect(() => {
    document.body.classList.remove(...ALL_THEMES.map(t => t.className));
    document.body.classList.add(getThemeObj(pendingTheme).className);
  }, [pendingTheme, showSettings]);

  // When settings panel closes, revert preview to selected theme
  useEffect(() => {
    if (!showSettings) {
      document.body.classList.remove(...ALL_THEMES.map(t => t.className));
      document.body.classList.add(getThemeObj(theme).className);
      setPendingTheme(theme);
    }
  }, [showSettings, theme]);

  const openSettings = () => setShowSettings(true);
  const closeSettings = () => setShowSettings(false);

  const handleApplyTheme = () => {
    setTheme(pendingTheme);
    setShowSettings(false);
  };

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
          <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <DisplayTime />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px'}}>
              <ThemeToggle
                theme={theme}
                onToggle={() => {
                  // Toggle between cherry (light) and night (dark)
                  toggleTheme();
                }}
              />
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-accent-dark)',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  padding: 0,
                }}
                onClick={openSettings}
                aria-label="Configure theme"
              >
                configure
              </button>
            </div>
        </div>
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
      {/* Settings Panel */}
      {showSettings && (
        <div className={styles.settingsPanelOverlay}>
          <div
            className={styles.settingsPanel}
            style={{
              display: 'flex',
              flexDirection: 'column',
              height: '93vh',
              minHeight: 0,
            }}
          >
            <button
              className={styles.settingsCloseBtn}
              onClick={closeSettings}
              aria-label="Close settings"
            >✕</button>
            <h3 className={styles.settingsTitle} style={{ textAlign: 'center' }}>Choose Theme</h3>
            <div
              className={styles.themeOptions}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                paddingBottom: '20px',
                overflowY: 'auto',
                flex: 1,
                minHeight: 0,
              }}
            >
              <div>
                <div style={{marginBottom: 12, fontWeight: 600, color: 'var(--color-text-main)', textAlign: 'center'}}>Light Themes</div>
                <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
                  {LIGHT_THEMES.map(opt => (
                    <button
                      key={opt.key}
                      type="button"
                      className={styles.themeOptionBtn + (pendingTheme === opt.key ? ' ' + styles.themeOptionBtnActive : '')}
                      onClick={() => setPendingTheme(opt.key)}
                      style={{
                        border: pendingTheme === opt.key
                          ? (opt.key === 'cherry'
                              ? '2px solid #D53169'
                              : opt.key === 'blue'
                              ? '2px solid #3196d5'
                              : '2px solid #CDCDCD')
                          : (opt.key === 'cherry'
                              ? '2px solid #FFD8DF'
                              : opt.key === 'blue'
                              ? '2px solid #d8fdff'
                              : '2px solid #CDCDCD'),
                        background: opt.key === 'cherry'
                          ? '#FFD8DF'
                          : opt.key === 'blue'
                          ? '#d8fdff'
                          : '#E3EBFF',
                        color: opt.key === 'cherry'
                          ? '#D53169'
                          : opt.key === 'blue'
                          ? '#3196d5'
                          : '#1E1E1E',
                        borderRadius: 12,
                        padding: '12px 18px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        boxShadow: pendingTheme === opt.key ? '0 2px 8px rgba(243, 115, 115, 0.07)' : 'none',
                        outline: 'none',
                        transition: 'all 0.2s',
                        width: '100%',
                        textAlign: 'center'
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{marginBottom: 12, fontWeight: 600, color: 'var(--color-text-main)', textAlign: 'center'}}>Dark Themes</div>
                <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
                  {DARK_THEMES.map(opt => (
                    <button
                      key={opt.key}
                      type="button"
                      className={styles.themeOptionBtn + (pendingTheme === opt.key ? ' ' + styles.themeOptionBtnActive : '')}
                      onClick={() => setPendingTheme(opt.key)}
                      style={{
                        border: pendingTheme === opt.key
                          ? (opt.key === 'dark'
                              ? '2px solid #c4c4c4'
                              : opt.key === 'night'
                              ? '2px solid #6f5896'
                              : '2px solid #404040')
                          : (opt.key === 'dark'
                              ? '2px solid #303030'
                              : opt.key === 'night'
                              ? '2px solid #3d214c'
                              : '2px solid #404040'),
                        background: opt.key === 'dark'
                          ? '#1F1F1F'
                          : opt.key === 'night'
                          ? '#3d214c'
                          : '#1F1F1F',
                        color: opt.key === 'dark'
                          ? '#efefef'
                          : opt.key === 'night'
                          ? '#eeecf4'
                          : '#efefef',
                        borderRadius: 12,
                        padding: '12px 18px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        boxShadow: pendingTheme === opt.key ? '0 2px 8px rgba(187, 154, 247, 0.1)' : 'none',
                        outline: 'none',
                        transition: 'all 0.2s',
                        width: '100%',
                        textAlign: 'center'
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ 
              borderTop: '2px solid var(--color-border)',
              marginTop: 'auto',
              flexShrink: 0,
            }}>
              <button
                className={styles.applyThemeBtn}
                onClick={handleApplyTheme}
                disabled={pendingTheme === theme}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'var(--color-border-dark)',
                  color: 'var(--color-text-light)',
                  fontWeight: 600,
                  cursor: pendingTheme === theme ? 'not-allowed' : 'pointer',
                  opacity: pendingTheme === theme ? 0.5 : 1,
                  transition: 'all 0.2s'
                }}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Workspace;