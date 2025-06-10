import { useEffect, useState, useRef } from "react";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import ScrollReveal from '../components/ScrollReveal';
// import Footer from "../components/Footer"


export default function Landing() {
  const [loading, setLoading] = useState(true);
  const [showAfterLoad, setShowAfterLoad] = useState(false);
  const [flowers, setFlowers] = useState([]);
  const flowerId = useRef(0);
  const logoRef = useRef(null);
  const containerRef = useRef(null);

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
          size: Math.random() * 12 + 42,
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

  // Add controlled scroll behavior
  // useEffect(() => {
  //   const container = containerRef.current;
  //   if (!container) return;

  //   const handleWheel = (e) => {
  //     e.preventDefault();
  //     const scrollAmount = 1000;
  //     const direction = Math.sign(e.deltaY);
  //     container.scrollBy({
  //       top: direction * scrollAmount,
  //       behavior: 'smooth'
  //     });
  //   };

  //   container.addEventListener('wheel', handleWheel, { passive: false });
  //   return () => container.removeEventListener('wheel', handleWheel);
  // }, []);

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
            {/* Upper branch background - now fixed at the top */}
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
                zIndex: 1,
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
                    src="images/donnatext.png"
                    alt="Donna"
                    style={styles.donnaTextImg}
                  />
                  <p style={styles.assistantText}>
                    Your personal assistant
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
                        rest: { color: 'var(--color-text-main)' },
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
                </motion.div>
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
              overflow: "hidden"
            }}
          >
            <div
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
            >
              <ScrollReveal
                scrollContainerRef={containerRef}
                containerClassName="scroll-reveal-custom"
                textClassName="scroll-reveal-text-custom"
              >
                Donna is your all-in-one personal workspace, powered by an intelligent AI assistant. It helps you stay organized and productive by handling tasks like scheduling meetings, setting reminders, taking notes, and more. Whether you're managing your day or planning ahead, Donna acts as your smart companion — always ready to assist.
              </ScrollReveal>
            </div>
          </div>
        </>
      )}
      <style>{`
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
      `}</style>
      {/* <Footer /> */}
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
  }
};