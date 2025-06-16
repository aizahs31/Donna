import React, { useState, useEffect, useRef, useCallback } from "react";

export default function Starfield({
  minSpeed = 10,
  maxSpeed = 30,
  minDelay = 1200,
  maxDelay = 4200,
  starColor = "#ffffff",
  trailColor = "#ffffff",
  starWidth = 10,
  starHeight = 1,
  starDensity = 0.00015,
  allStarsTwinkle = true,
  twinkleProbability = 0.7,
  minTwinkleSpeed = 0.5,
  maxTwinkleSpeed = 1,
}) {
  const [shootingStar, setShootingStar] = useState(null);
  const [stars, setStars] = useState([]);
  const canvasRef = useRef(null);
  const starsRef = useRef([]);
  const requestRef = useRef();

  const getRandomStartPoint = () => {
    const side = Math.floor(Math.random() * 4);
    const offset = Math.random() * window.innerWidth;

    switch (side) {
      case 0: return { x: offset, y: 0, angle: 45 };
      case 1: return { x: window.innerWidth, y: offset, angle: 135 };
      case 2: return { x: offset, y: window.innerHeight, angle: 225 };
      case 3: return { x: 0, y: offset, angle: 315 };
      default: return { x: 0, y: 0, angle: 45 };
    }
  };

  const generateStars = useCallback((width, height) => {
    const area = width * height;
    const numStars = Math.floor(area * starDensity);
    return Array.from({ length: numStars }, () => {
      const shouldTwinkle = allStarsTwinkle || Math.random() < twinkleProbability;
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1 + 0.5,
        opacity: Math.random() * 0.5 + 0.5,
        twinkleSpeed: shouldTwinkle ? minTwinkleSpeed + Math.random() * (maxTwinkleSpeed - minTwinkleSpeed) : null,
      };
    });
  }, [starDensity, allStarsTwinkle, twinkleProbability, minTwinkleSpeed, maxTwinkleSpeed]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const updateStars = () => {
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = width;
      canvas.height = height;
      setStars(generateStars(width, height));
    };

    updateStars();

    const resizeObserver = new ResizeObserver(updateStars);
    resizeObserver.observe(canvas); // use cached `canvas`

    return () => {
      resizeObserver.unobserve(canvas); // ✅ use cached value
    };
  }, [generateStars]);


  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach((star) => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.fill();

        if (star.twinkleSpeed !== null) {
          star.opacity = 0.5 + Math.abs(Math.sin((Date.now() * 0.001) / star.twinkleSpeed) * 0.5);
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [stars]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = window.innerWidth;
    let h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;

    const numStars = Math.floor(w * h * starDensity);
    starsRef.current = [];
    for (let i = 0; i < numStars; i++) {
      starsRef.current.push({
        x: Math.random() * w - w / 2,
        y: Math.random() * h - h / 2,
        radius: Math.random() * 0.05 + 0.5,
        opacity: Math.random() * 0.5 + 0.5,
        twinkleSpeed: null,
      });
    }

    let animationFrameId;

    const draw = () => {
      if (!canvas || !ctx) return;

      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, w, h);
      ctx.save();
      ctx.translate(w / 2, h / 2);

      starsRef.current.forEach((star) => {
        star.x -= 0.2;
        if (star.x <= -w / 2) star.x = w / 2;

        const k = w / star.x;
        const px = star.x * k + w / 2;
        const py = star.y * k + h / 2;

        if (px >= 0 && px < w && py >= 0 && py < h) {
          const size = (1 - star.x / w) * 5;
          const shade = parseInt(((1 - star.x / w) * 255).toString());
          ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade})`;
          ctx.beginPath();
          ctx.arc(px - w / 2, py - h / 2, size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      ctx.restore();
      animationFrameId = requestAnimationFrame(draw);
      requestRef.current = animationFrameId;
    };

    draw();

    const handleResize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      if (canvas) {
        canvas.width = w;
        canvas.height = h;
        const newNumStars = Math.floor(w * h * starDensity);
        starsRef.current = [];
        for (let i = 0; i < newNumStars; i++) {
          starsRef.current.push({
            x: Math.random() * w - w / 2,
            y: Math.random() * h - h / 2,
            radius: Math.random() * 1 + 0.5,
            opacity: Math.random() * 0.5 + 0.5,
            twinkleSpeed: null,
          });
        }
      }
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [starDensity]);

  useEffect(() => {
    const createStar = () => {
      const { x, y, angle } = getRandomStartPoint();
      const newStar = {
        id: Date.now(),
        x,
        y,
        angle,
        scale: 1,
        speed: Math.random() * (maxSpeed - minSpeed) + minSpeed,
        distance: 0,
      };
      setShootingStar(newStar);

      const delay = Math.random() * (maxDelay - minDelay) + minDelay;
      setTimeout(createStar, delay);
    };

    createStar();
  }, [minSpeed, maxSpeed, minDelay, maxDelay]);

  useEffect(() => {
    const moveStar = () => {
      if (shootingStar) {
        setShootingStar((prev) => {
          if (!prev) return null;

          const newX = prev.x + prev.speed * Math.cos((prev.angle * Math.PI) / 180);
          const newY = prev.y + prev.speed * Math.sin((prev.angle * Math.PI) / 180);
          const newDistance = prev.distance + prev.speed;
          const newScale = 1 + newDistance / 100;

          if (
            newX < -20 ||
            newX > window.innerWidth + 20 ||
            newY < -20 ||
            newY > window.innerHeight + 20
          ) {
            return null;
          }

          return {
            ...prev,
            x: newX,
            y: newY,
            distance: newDistance,
            scale: newScale,
          };
        });
      }
    };

    const animationFrame = requestAnimationFrame(moveStar);
    return () => cancelAnimationFrame(animationFrame);
  }, [shootingStar]);

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          zIndex: -2,
        }}
      />
      <svg
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          pointerEvents: "none",
        }}
      >
        {shootingStar && (
          <rect
            key={shootingStar.id}
            x={shootingStar.x}
            y={shootingStar.y}
            width={starWidth * shootingStar.scale}
            height={starHeight}
            fill="url(#gradient)"
            transform={`rotate(${shootingStar.angle}, ${
              shootingStar.x + (starWidth * shootingStar.scale) / 2
            }, ${shootingStar.y + starHeight / 2})`}
          />
        )}
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: trailColor, stopOpacity: 0 }} />
            <stop offset="100%" style={{ stopColor: starColor, stopOpacity: 1 }} />
          </linearGradient>
        </defs>
      </svg>
    </>
  );
}
