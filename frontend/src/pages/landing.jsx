import { useEffect, useState, useRef } from "react";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import ScrollReveal from '../components/ScrollReveal';
import Footer from '../components/Footer';
import Stars from '../components/Stars';
import ThemeToggle from '../components/ThemeToggle';

export default function Landing() {
  const [loading, setLoading] = useState(true);
  const [showAfterLoad, setShowAfterLoad] = useState(false);
  const [flowers, setFlowers] = useState([]);
  const [theme, setTheme] = useState('cherry');
  const flowerId = useRef(0);
  const logoRef = useRef(null);
  const containerRef = useRef(null);
  const aboutSectionRef = useRef(null); // Add ref for About section

  // Use Framer Motion's useScroll with the custom container
  const { scrollY } = useScroll({ container: containerRef });
  const logoOpacity = useTransform(scrollY, [0, 300], [1, 0]);
  const logoScale = useTransform(scrollY, [0, 300], [1, 0.8]);
  const logoY = useTransform(scrollY, [0, 300], [0, 50]);
  const logoFilter = useTransform(scrollY, [0, 300], ["blur(0px)", "blur(10px)"]);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!loading) {
      const t2 = setTimeout(() => setShowAfterLoad(true), 1000);
      return () => clearTimeout(t2);
    }
  }, [loading]);

  useEffect(() => {
    if (!showAfterLoad) return;
    const interval = setInterval(() => {
      const flowerTypes = ["flower1.png", "flower2.png", "flower3.png", "flower4.png", "flower5.png", "flower6.png"];
      setFlowers((prev) => [
        ...prev,
        {
          id: flowerId.current++,
          left: Math.random() * 92 + 2, // 2vw to 94vw
          size: Math.random() * 32 + 32, // 32px to 64px
          duration: Math.random() * 2 + 4, // 4s to 6s
          delay: Math.random() * 2, // 0-2s
          rotate: Math.random() > 0.5 ? 1 : -1,
          type: flowerTypes[Math.floor(Math.random() * flowerTypes.length)]
        }
      ]);
    }, 700);
    return () => clearInterval(interval);
  }, [showAfterLoad]);

  useEffect(() => {
    if (!showAfterLoad) return;
    if (flowers.length > 30) {
      setFlowers((prev) => prev.slice(-30));
    }
  }, [flowers, showAfterLoad]);

  // Ensure correct theme on landing page
  useEffect(() => {
    document.body.classList.remove('cherry-theme', 'night-theme');
    document.body.classList.add(theme === 'night' ? 'night-theme' : 'cherry-theme');
  }, [theme]);

  // Only toggle between 'cherry' and 'night'
  const toggleTheme = () => setTheme(theme === 'night' ? 'cherry' : 'night');

  return (
    <div
      ref={containerRef}
      style={{
        overflowX: "hidden",
        overflowY: "scroll",
        height: "100vh",
        position: "fixed",
        width: "100%",
        top: 0,
        left: 0,
        scrollBehavior: "smooth"
      }}
      className="smooth-scroll"
    >
      <AnimatePresence>
        {loading && (
          <motion.div
            className="loading-page"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: [0.77, 0, 0.18, 1] }}
            style={styles.loadingPage}
          >
            <img
              src="images/upper.png"
              style={styles.upperBranch}
              alt=""
            />
            <img
              src="images/lower.png"
              style={styles.lowerBranch}
              alt=""
            />
            <div
              className="landing-container"
              style={styles.landingContainer}
            >
              <img
                src="images/donna.png"
                alt="Donna"
                style={styles.donnaImg}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showAfterLoad && (
          <>
            {/* Upper branch background - only shown in cherry theme */}
            {theme === 'cherry' && (
              <motion.img
                src="images/right.png"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, ease: [0.77, 0, 0.18, 1] }}
                style={{
                  position: "fixed",
                  top: 0,
                  right: -90,
                  width: 'min(1000px, 80vw)',
                  maxWidth: '60vw',
                  maxHeight: '60vh',
                  height: 'auto',
                  zIndex: -1,
                  pointerEvents: "none",
                  userSelect: "none"
                }}
                alt=""
              />
            )}
            {/* Animated falling flowers - only in cherry theme */}
            {theme === 'cherry' && (
              <div style={{
                position: "fixed",
                left: 0,
                top: 0,
                width: "100%",
                height: "100vh",
                pointerEvents: "none",
                zIndex: 0,
                overflow: "hidden"
              }}>
                {flowers.map(flower => (
                  <motion.img
                    key={flower.id}
                    src={`images/${flower.type}`}
                    alt=""
                    initial={{
                      y: -flower.size,
                      x: 0,
                      opacity: 0.7,
                      rotate: 0,
                    }}
                    animate={{
                      y: "100vh",
                      opacity: [0.7, 1, 0.7],
                      rotate: flower.rotate * 60,
                    }}
                    transition={{
                      duration: flower.duration,
                      delay: flower.delay,
                      ease: [0.45, 0, 0.55, 1]
                    }}
                    style={{
                      position: "absolute",
                      left: `${flower.left}vw`,
                      width: flower.size,
                      height: flower.size,
                      pointerEvents: "none",
                      zIndex: 0,
                      filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.08))"
                    }}
                    onAnimationComplete={() => {
                      setFlowers(prev => prev.filter(f => f.id !== flower.id));
                    }}
                  />
                ))}
              </div>
            )}
            {/* Logo and button now scroll with the page, with animation */}
            <motion.div
              ref={logoRef}
              className="after-load"
              initial={{ opacity: 0, y: 80 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 80 }}
              transition={{ duration: 1, ease: [0.2, 0.3, 0.2, 1] }}
              style={{
                ...styles.afterLoad,
                position: "relative",
                top: undefined,
                left: undefined,
                height: "100vh",
                width: "100%",
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
                <motion.div 
                  className="logo" 
                  style={{
                    ...styles.logo,
                    opacity: logoOpacity,
                    scale: logoScale,
                    y: logoY,
                    filter: logoFilter
                  }}
                >
                  <img
                    src={theme === 'night' ? "images/donnatext-night.png" : "images/donnatext.png"}
                    alt="Donna"
                    style={styles.donnaTextImg}
                  />
                  <p style={styles.assistantText}>
                    Your personal workspace
                  </p>
                </motion.div>
                <motion.div
                  style={{
                    opacity: logoOpacity,
                    scale: logoScale,
                    y: logoY,
                    filter: logoFilter
                  }}
                >
                  <motion.button
                    onClick={() => window.location.href = 'https://donna-1677.onrender.com/auth'}
                    style={styles.connectButton}
                    whileHover="hover"
                    initial="rest"
                    animate="rest"
                    variants={{
                      rest: { scale: 1 },
                      hover: { scale: 1.06 }
                    }}
                  >
                    <motion.span
                      style={styles.buttonTextWrapper}
                      variants={{
                        rest: { color: 'var(--color-text-main)' },
                        hover: { color: 'var(--color-text-light)' }
                      }}
                      transition={{ duration: 0.25 }}
                    >
                      <span style={styles.buttonText}>Continue with Google</span>
                    </motion.span>
                    <motion.span
                      style={styles.buttonBg}
                      variants={{
                        rest: { scaleX: 0 },
                        hover: { scaleX: 1 }
                      }}
                      transition={{ duration: 0.45, ease: [0.77, 0, 0.18, 1] }}
                    />
                  </motion.button>
                </motion.div>
                {/* Remove scroll indicator from logo area */}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {showAfterLoad && (
        <>
          <div
            style={{
              position: "relative",
              minHeight: "100vh",
              width: "100%",
              overflow: "hidden",
              paddingBottom: "200px"
            }}
          >
            <motion.div
              ref={aboutSectionRef}
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 8vw",
                boxSizing: "border-box"
              }}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
              viewport={{ root: containerRef }}
            >
              <div style={styles.aboutContainer}>
                <motion.div
                  style={styles.aboutHeader}
                  initial={{ y: 50, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  viewport={{ root: containerRef }}
                >
                  <h2 style={styles.aboutTitle}>Meet Donna</h2>
                </motion.div>

                <motion.div
                  style={{
                    ...styles.aboutContent,
                    alignItems: "center"
                  }}
                  initial={{ y: 30, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  viewport={{ root: containerRef }}
                >
                  <div style={{
                    ...styles.featureGrid,
                    gap: '2.2rem', // increased gap for more spacing
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    justifyItems: 'center',
                    alignItems: 'center',
                    margin: '0 auto',
                    maxWidth: 900 // allow more space for the grid
                  }}>
                    {/* Cards: smaller, closer, centered */}
                    <motion.div
                      style={{ ...styles.featureCard, padding: '0.9rem', minWidth: 0, maxWidth: 230, height: 160, margin: "0 auto" }}
                      whileHover={{ scale: 1.04, y: -2 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <div style={{...styles.featureIcon, fontSize: '1.9rem', marginBottom: '0.4rem'}}>🤖</div>
                      <h3 style={{...styles.featureTitle, fontSize: '1.12rem', margin: '0 0 0.4rem 0'}}>AI Chat Assistant</h3>
                      <p style={{...styles.featureText, fontSize: '0.95rem'}}>Talk to Donna naturally to manage tasks and calendar events with Gemini 2.0 AI</p>
                    </motion.div>
                    <motion.div
                      style={{ ...styles.featureCard, padding: '0.9rem', minWidth: 0, maxWidth: 230, height: 160, margin: "0 auto" }}
                      whileHover={{ scale: 1.04, y: -2 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <div style={{...styles.featureIcon, fontSize: '1.9rem', marginBottom: '0.4rem'}}>📅</div>
                      <h3 style={{...styles.featureTitle, fontSize: '1.12rem', margin: '0 0 0.4rem 0'}}>Google Calendar Sync</h3>
                      <p style={{...styles.featureText, fontSize: '0.95rem'}}>Create, modify, and delete calendar events seamlessly with Google Calendar integration</p>
                    </motion.div>
                    <motion.div
                      style={{ ...styles.featureCard, padding: '0.9rem', minWidth: 0, maxWidth: 230, height: 160, margin: "0 auto" }}
                      whileHover={{ scale: 1.04, y: -2 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <div style={{...styles.featureIcon, fontSize: '1.9rem', marginBottom: '0.4rem'}}>✅</div>
                      <h3 style={{...styles.featureTitle, fontSize: '1.12rem', margin: '0 0 0.4rem 0'}}>Smart Task Manager</h3>
                      <p style={{...styles.featureText, fontSize: '0.95rem'}}>Voice and drag-and-drop task control with persistent storage across sessions</p>
                    </motion.div>
                    <motion.div
                      style={{ ...styles.featureCard, padding: '0.9rem', minWidth: 0, maxWidth: 230, height: 160, margin: "0 auto" }}
                      whileHover={{ scale: 1.04, y: -2 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <div style={{...styles.featureIcon, fontSize: '1.9rem', marginBottom: '0.4rem'}}>🎯</div>
                      <h3 style={{...styles.featureTitle, fontSize: '1.12rem', margin: '0 0 0.4rem 0'}}>Focus Tools</h3>
                      <p style={{...styles.featureText, fontSize: '0.95rem'}}>Built-in Pomodoro timer with break suggestions and daily productivity summaries</p>
                    </motion.div>
                    <motion.div
                      style={{ ...styles.featureCard, padding: '0.9rem', minWidth: 0, maxWidth: 230, height: 160, margin: "0 auto" }}
                      whileHover={{ scale: 1.04, y: -2 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <div style={{...styles.featureIcon, fontSize: '1.9rem', marginBottom: '0.4rem'}}>🎵</div>
                      <h3 style={{...styles.featureTitle, fontSize: '1.12rem', margin: '0 0 0.4rem 0'}}>Ambient Workspace</h3>
                      <p style={{...styles.featureText, fontSize: '0.95rem'}}>Optional Spotify music integration for the perfect study atmosphere</p>
                    </motion.div>
                    <motion.div
                      style={{ ...styles.featureCard, padding: '0.9rem', minWidth: 0, maxWidth: 230, height: 160, margin: "0 auto" }}
                      whileHover={{ scale: 1.04, y: -2 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <div style={{...styles.featureIcon, fontSize: '1.9rem', marginBottom: '0.4rem'}}>💬</div>
                      <h3 style={{...styles.featureTitle, fontSize: '1.12rem', margin: '0 0 0.4rem 0'}}>Natural Language</h3>
                      <p style={{...styles.featureText, fontSize: '0.95rem'}}>Simply tell Donna what you need - no complex interfaces or learning curves</p>
                    </motion.div>
                  </div>

                  <motion.div
                    style={styles.mainDescription}
                    initial={{ y: 20, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    viewport={{ root: containerRef }}
                  >
                    <p style={styles.descriptionText}>
                      Donna is your intelligent AI productivity assistant that combines task management, calendar integration, and focus tools 
                      in one clean interface. Powered by Gemini 2.0, Donna understands natural language and helps you stay organized 
                      with Google Calendar sync, smart task management, Pomodoro timers, and ambient music — all designed to boost your productivity.
                    </p>
                  </motion.div>

                </motion.div>
              </div>
            </motion.div>
          </div>
          {/* Stars animation only in night mode, after loading */}
          {theme === 'night' && <Stars />}
          
          {/* Footer at the bottom with proper spacing */}
          <div style={{ position: "relative", width: "100%", marginTop: "auto" }}>
            <Footer
              theme={theme}
              toggleTheme={toggleTheme}
              ThemeToggle={ThemeToggle}
            />
          </div>
          {/* "Scroll to learn more" fixed at bottom of page */}
          <ScrollIndicator containerRef={containerRef} aboutSectionRef={aboutSectionRef} fixedBottom />
        </>
      )}
      {/* Add theme background CSS */}
      <style>{`
        body.cherry-theme {
          background: #E3EBFF !important;
          transition: background 0.5s cubic-bezier(0.4,0,0.2,1);
        }
        body.night-theme {
          background: #181a24 !important;
          transition: background 0.5s cubic-bezier(0.4,0,0.2,1);
        }
        .scroll-reveal-custom {
          width: 100%;
          margin: 0;
        }
        .scroll-reveal-text-custom {
          font-size: clamp(1rem, 3vw, 2.2rem);
          line-height: 1.5;
          margin: 0;
          padding: 0;
          word-break: break-word;
        }
        .scroll-to-learn-more:active,
        .scroll-to-learn-more:focus {
          color: var(--color-accent, #e07a5f);
          outline: none;
        }
        .scroll-to-learn-more:hover {
          color: var(--color-accent, #e07a5f);
        }
        .caret-down {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-top: 0.1em;
          height: 22px;
        }
        .caret-down svg path {
          transition: stroke 0.2s;
        }
        .scroll-to-learn-more:hover .caret-down svg path,
        .scroll-to-learn-more:focus .caret-down svg path {
          stroke: var(--color-accent, #e07a5f);
        }
        .caret-down svg {
          animation: caret-bounce 1.2s infinite;
        }
        @keyframes caret-bounce {
          0%, 100% { transform: translateY(0);}
          50% { transform: translateY(7px);}
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translate(-50%, 30px);}
          to { opacity: 0.92; transform: translate(-50%, 0);}
        }
      `}</style>
    </div>
  );
}

// ScrollIndicator component
function ScrollIndicator({ containerRef, aboutSectionRef, fixedBottom }) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    function onScroll() {
      if (!containerRef.current || !aboutSectionRef.current) return;
      const container = containerRef.current;
      const aboutRect = aboutSectionRef.current.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      // Hide indicator if about section is visible in viewport
      setShow(!(aboutRect.top < containerRect.bottom - 200));
    }
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }
    return () => {
      if (container) container.removeEventListener('scroll', onScroll);
    };
  }, [containerRef, aboutSectionRef]);

  if (!show) return null;
  return (
    <div
      style={{
        position: fixedBottom ? "fixed" : "relative",
        left: fixedBottom ? "50%" : undefined,
        bottom: fixedBottom ? "40px" : undefined,
        transform: fixedBottom ? "translateX(-50%)" : undefined,
        marginTop: fixedBottom ? undefined : "2.2rem",
        background: "none",
        color: "var(--color-text-main, #222)",
        padding: 0,
        borderRadius: 0,
        boxShadow: "none",
        fontSize: "1.05rem",
        fontWeight: 500,
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "0.1em",
        border: "none",
        opacity: 0.98,
        userSelect: "none",
        outline: "none",
        zIndex: 100
      }}
      onClick={() => {
        if (aboutSectionRef.current) {
          aboutSectionRef.current.scrollIntoView({ behavior: "smooth" });
        }
      }}
      className="scroll-to-learn-more"
      title="Scroll to learn more"
      tabIndex={0}
      onKeyDown={e => { if (e.key === "Enter" || e.key === " ") {
        if (aboutSectionRef.current) {
          aboutSectionRef.current.scrollIntoView({ behavior: "smooth" });
        }
      }}}
    >
      <span style={{
        letterSpacing: "0.01em",
        fontWeight: 500,
        fontSize: "1em",
        background: "none",
        padding: 0,
        margin: 0,
        color: "var(--color-text-main, #222)"
      }}>Scroll to learn more</span>
      {/* Minimal caret (^) animated */}
      <span className="caret-down" aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path d="M6 10L11 15L16 10" stroke="var(--color-accent, #e07a5f)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </span>
    </div>
  );
}

const styles = {
  loadingPage: {
    position: 'fixed',
    width: '100vw',
    height: '100vh',
    top: 0,
    left: 0,
    zIndex: 10,
  },
  upperBranch: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 'min(400px, 50vw, 50vh)',
    maxWidth: '50vw',
    maxHeight: '50vh',
    height: 'auto',
    zIndex: 2,
  },
  lowerBranch: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 'min(400px, 50vw, 50vh)',
    maxWidth: '50vw',
    maxHeight: '50vh',
    height: 'auto',
    zIndex: 2,
  },
  landingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    width: '100vw',
    position: 'relative',
    zIndex: 3
  },
  donnaImg: {
    width: 'min(320px, 100vw, 100vh)',
    maxWidth: '100vw',
    maxHeight: '100vh',
    height: 'auto'
  },
  afterLoad: {
    pointerEvents: 'auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100vw',
    height: '100vh',
    margin: 0,
    padding: 0,
    position: 'relative',
    top: 0,
    left: 0,
  },
  logo: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  donnaTextImg: {
    width: 'min(320px, 100vw, 100vh)',
    maxWidth: '100vw',
    maxHeight: '100vh',
    height: 'auto'
  },
  assistantText: {
    fontFamily: '"Cedarville Cursive", cursive',
    fontSize: '2rem',
    marginTop: 0,
    color: 'var(--color-text-main)',
  },
  connectButton: {
    backgroundColor: 'var(--color-accent)',
    border: '2px solid var(--color-border-dark)',
    borderRadius: '50px',
    padding: '10px 22px',
    fontSize: '1.25rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    color: 'var(--color-text-main)',
    position: 'relative',
    overflow: 'hidden',
    display: 'inline-flex',
    alignItems: 'center',
    outline: 'none',
    boxShadow: 'var(--color-shadow-accent)',
    userSelect: 'none'
  },
  buttonTextWrapper: {
    display: 'inline-flex',
    alignItems: 'center',
    position: 'relative',
    zIndex: 2,
  },
  buttonText: {
    position: 'relative',
    zIndex: 2,
    fontWeight: 500,
    fontSize: '1.25rem',
    color: 'inherit',
    transition: 'color 0.2s'
  },
  buttonBg: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
    background: 'var(--color-text-main)',
    borderRadius: '50px',
    zIndex: 1,
    pointerEvents: 'none',
    transformOrigin: 'left center',
    scaleX: 0,
    transition: 'scaleX 0.45s cubic-bezier(.77,0,.18,1)'
  },
  // Enhanced about section styles with 6 features
  aboutContainer: {
    maxWidth: '1200px',
    width: '100%',
    padding: '0 2rem',
    textAlign: 'center',
  },
  aboutHeader: {
    marginBottom: '3rem',
  },
  aboutTitle: {
    fontSize: 'clamp(2.5rem, 5vw, 4rem)',
    fontWeight: '700',
    margin: 0,
    marginBottom: '1rem',
    color: 'var(--color-text-main)',
  },
  aboutContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
    alignItems: 'center'
  },
  featureGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '2.2rem', // increased gap for more spacing
    marginBottom: '2rem',
    justifyItems: 'center',
    alignItems: 'center',
    margin: '0 auto',
    maxWidth: 900 // allow more space for the grid
  },
  featureCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    border: '1px solid var(--color-border-light, rgba(255, 255, 255, 0.2))',
    borderRadius: '20px',
    padding: '1.1rem', // more padding for airiness
    textAlign: 'center',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer',
    minWidth: 0,
    maxWidth: 230,
    height: 160,
    margin: "0 auto"
  },
  featureIcon: {
    fontSize: '1.9rem', // slightly larger
    marginBottom: '0.4rem',
    display: 'block',
  },
  featureTitle: {
    fontSize: '1.12rem', // slightly larger
    fontWeight: '600',
    margin: '0 0 0.4rem 0',
    color: 'var(--color-text-main)',
  },
  featureText: {
    fontSize: '0.95rem', // slightly larger
    color: 'var(--color-text-secondary, var(--color-text-main))',
    lineHeight: '1.5',
    margin: 0,
    opacity: 0.8,
  },
  mainDescription: {
    maxWidth: '800px',
    margin: '0 auto',
  },
  descriptionText: {
    fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)',
    lineHeight: '1.7',
    color: 'var(--color-text-main)',
    margin: 0,
    opacity: 0.9,
  },
};