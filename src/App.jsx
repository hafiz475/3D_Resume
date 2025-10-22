// App.jsx (stricter burst prevention to handle vigorous scrolls without skipping)
import React, {
  useState,
  Suspense,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import Timeline from "./components/Timeline";
import LogoBadge from "./components/LogoBadge";
// import './App.css';

export default function App() {
  const periods = [
    {
      id: "2023-present",
      model: "/biz_shaded.glb", // Your human model—stays as-is
      logo: "/bizMagnetsLogo_shaded.glb", // New: Company logo
      title: "2023 - Present",
      content:
        "Senior Developer at DEF Ltd. Leading interactive web experiences with React and WebGL.",
      bgColor: "three-black",
      year: "2023",
    },
    {
      id: "2021-2023",
      model: "/ideassion_shaded.glb", // Human
      logo: "/ideassionLogo_shaded.glb", // Company logo
      title: "2021 - 2023",
      content:
        "Mid-Level Developer at XYZ Inc. Specialized in 3D visualizations with Three.js.",
      bgColor: "white-bg",
      year: "2021",
    },
    {
      id: "2019-2021",
      model: "/royal_shaded.glb", // Human (update path if it's re_shaded.glb)
      logo: "/reLogo_shaded.glb", // Company logo
      title: "2019 - 2021",
      content:
        "Junior Developer at ABC Corp. Worked on front-end projects using React and JavaScript.",
      bgColor: "white-bg",
      year: "2019",
    },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const sectionsWrapperRef = useRef(null);
  const isScrollingRef = useRef(false);
  const lastScrollTimeRef = useRef(0); // Track time of last scroll action
  const scrollDeltaRef = useRef(0); // Accumulate delta for vigorous scrolls

  // Observer fallback (for keyboard, etc.)
  useEffect(() => {
    const options = {
      root: null,
      rootMargin: "0px",
      threshold: 0.8,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !isScrollingRef.current) {
          const sectionIndex = parseInt(entry.target.dataset.index, 10);
          if (!isNaN(sectionIndex)) setCurrentIndex(sectionIndex);
        }
      });
    }, options);

    // Observe immediately
    const sections = document.querySelectorAll(".section");
    sections.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  // Wheel handler: accumulate delta, stricter burst prevention
  const handleWheel = useCallback(
    (e) => {
      e.preventDefault();
      const now = Date.now();
      const timeSinceLast = now - lastScrollTimeRef.current;

      // Ignore if still locked (animation running)
      if (isScrollingRef.current) return;

      // Treat any delta beyond a small threshold as a "gesture"
      const direction = e.deltaY > 30 ? 1 : e.deltaY < -30 ? -1 : 0;
      if (direction === 0) return;

      const newIndex = Math.max(
        0,
        Math.min(periods.length - 1, currentIndex + direction)
      );

      if (newIndex !== currentIndex) {
        isScrollingRef.current = true;
        lastScrollTimeRef.current = now;
        setCurrentIndex(newIndex);

        // Lock scroll until section transition finishes
        setTimeout(() => {
          isScrollingRef.current = false;
        }, 1200); // matches your transition duration
      }
    },
    [currentIndex, periods.length]
  );
  useEffect(() => {
    // Global capture: Listen on window to avoid canvas interference
    window.addEventListener("wheel", handleWheel, { passive: false });

    return () => window.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  // Timeline click handler
  const goToSection = useCallback(
    (index) => {
      if (isScrollingRef.current || index === currentIndex) return;
      isScrollingRef.current = true;
      lastScrollTimeRef.current = Date.now();
      scrollDeltaRef.current = 0;
      setCurrentIndex(index);
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 1200);
    },
    [currentIndex]
  );

  // Apply background class based on current section
  useEffect(() => {
    document.body.className = periods[currentIndex].bgColor;
  }, [currentIndex, periods]);

  return (
    <div className="app">
      <div className="timeline-indicator">
        <div className="timeline-line"></div>
        {periods.map((period, index) => (
          <div
            key={period.id}
            className={`timeline-dot ${index === currentIndex ? "active" : ""}`}
            onClick={() => goToSection(index)}
          >
            <span className="timeline-year">{period.year}</span>
          </div>
        ))}
      </div>

      <main className="sections-wrapper" ref={sectionsWrapperRef}>
        <div
          className="sections-container"
          style={{
            transform: `translateY(-${currentIndex * 100}vh)`,
            transition: "transform 1.2s cubic-bezier(0.25, 0.1, 0.25, 1)", // 1.2s ease-out: handles vigorous with extra buffer
          }}
        >
          {periods.map((period, index) => (
            <section key={period.id} className="section" data-index={index}>
              <div className="section-content">
                <div className="canvas-container">
                  {/* Main human model Canvas—unchanged */}
                  <Canvas shadows camera={{ position: [0, 0, 4], fov: 50 }}>
                    <Suspense fallback={null}>
                      {index === 0 ? (
                        <>
                          <color attach="background" args={["#000"]} />
                          <ambientLight intensity={0.25} />
                          <spotLight
                            position={[0, 6, 2]}
                            angle={0.55}
                            penumbra={0.5}
                            intensity={2.2}
                            castShadow
                            shadow-mapSize={[2048, 2048]}
                          />
                          <directionalLight
                            position={[3, 4, 5]}
                            intensity={0.6}
                          />
                          <Timeline modelUrl={period.model} noLights />
                          <ContactShadows
                            position={[0, -1, 0]}
                            opacity={0.5}
                            scale={10}
                            blur={2.8}
                            far={4}
                          />
                        </>
                      ) : (
                        <>
                          <Timeline modelUrl={period.model} />
                          <ContactShadows
                            position={[0, -1, 0]}
                            opacity={0.4}
                            scale={10}
                            blur={2.8}
                            far={4}
                          />
                        </>
                      )}
                    </Suspense>
                  </Canvas>
                </div>

                <div className="text-content">
                  {/* New: Logo badge above title */}
                  <div className="logo-badge">
                    <Canvas
                      camera={{ position: [0, 0, 3], fov: 75 }} // Closer camera: 3 instead of 5 for tighter crop
                      style={{
                        height: "100px", // Up from 80px
                        width: "150px", // Up from 120px
                        margin: "0 auto 1rem",
                        borderRadius: "8px",
                        overflow: "hidden",
                      }}
                    >
                      <Suspense
                        fallback={
                          <mesh>
                            <sphereGeometry args={[0.5, 8, 6]} />
                            <meshStandardMaterial color="#646cff" />
                          </mesh>
                        }
                      >
                        <LogoBadge modelUrl={period.logo} />
                      </Suspense>
                    </Canvas>
                  </div>
                  <h2>{period.title}</h2>
                  <p>{period.content}</p>
                </div>
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
