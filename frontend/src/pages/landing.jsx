import { useEffect, useState, useRef } from "react";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";

export default function Landing() {
  const [loading, setLoading] = useState(true);
  const [showAfterLoad, setShowAfterLoad] = useState(false);
  const [flowers, setFlowers] = useState([]);
  const flowerId = useRef(0);

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
      const flowerTypes = ["flower1.png", "flower2.png", "flower3.png"];
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

  return (
    <div>
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
            {/* Upper branch background - now with fade-in animation */}
            <motion.img
              src="images/upper.png"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2, ease: [0.77, 0, 0.18, 1] }}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "500px",
                maxWidth: "50vw",
                maxHeight: "50vh",
                height: "auto",
                zIndex: 0,
                pointerEvents: "none",
                userSelect: "none"
              }}
              alt=""
            />
            {/* Animated falling flowers */}
            <div style={{
              position: "fixed",
              left: 0,
              top: 0,
              width: "100vw",
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
            {/* Popup animation only for logo and button */}
            <motion.div
              className="after-load"
              initial={{ opacity: 0, y: 80 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 80 }}
              transition={{ duration: 1, ease: [0.77, 0, 0.18, 1] }}
              style={styles.afterLoad}
            >
              <div className="logo" style={styles.logo}>
                <img
                  src="images/donnatext.png"
                  alt="Donna"
                  style={styles.donnaTextImg}
                />
                <p style={styles.assistantText}>
                  Your personal assistant
                </p>
              </div>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <motion.button
                  onClick={() => window.location.href = 'http://localhost:3000/auth'}
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
                      rest: { color: '#1E1E1E' },
                      hover: { color: '#FEF9F1' }
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
                <style>{`
                  .connect-btn-anim {
                    position: relative;
                    overflow: hidden;
                    display: inline-flex;
                    align-items: center;
                  }
                  .connect-btn-anim .btn-bg {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                    height: 100%;
                    background: #1E1E1E;
                    border-radius: 50px;
                    z-index: 1;
                    pointer-events: none;
                    transform-origin: left center;
                    transition: transform 0.45s cubic-bezier(.77,0,.18,1);
                  }
                  .connect-btn-anim .btn-text {
                    position: relative;
                    z-index: 2;
                    color: #1E1E1E;
                    transition: color 0.2s;
                  }
                  .connect-btn-anim:hover .btn-bg {
                    transform: scaleX(1);
                  }
                  .connect-btn-anim:hover .btn-text {
                    color: #FEF9F1;
                  }
                `}</style>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
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
    pointerEvents: 'auto'
  },
  upperBranch: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 'min(318px, 50vw, 50vh)',
    maxWidth: '50vw',
    maxHeight: '50vh',
    height: 'auto',
    zIndex: 2,
  },
  lowerBranch: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 'min(318px, 50vw, 50vh)',
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
    position: 'fixed',
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
    color: '#1E1E1E',
  },
  connectButton: {
    backgroundColor: '#FFD8DF',
    border: '2px solid #1E1E1E',
    borderRadius: '50px',
    padding: '15px 30px',
    fontSize: '1.25rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    color: '#1E1E1E',
    position: 'relative',
    overflow: 'hidden',
    display: 'inline-flex',
    alignItems: 'center',
    outline: 'none',
    boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
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
    background: '#1E1E1E',
    borderRadius: '50px',
    zIndex: 1,
    pointerEvents: 'none',
    transformOrigin: 'left center',
    scaleX: 0,
    transition: 'scaleX 0.45s cubic-bezier(.77,0,.18,1)'
  }
};