// src/App.jsx
import React, { useState, useEffect } from "react";
import GlobalCanvas from "./components/GlobalCanvas";

export default function App() {
  const periods = [
    {
      id: "2023-present",
      model: "/biz_shaded.glb",
      logo: "/bizMagnetsLogo_shaded.glb",
      title: "2023 - Present",
      year: "2023",
    },
    {
      id: "2021-2023",
      model: "/ideassion_shaded.glb",
      logo: "/ideassionLogo_shaded.glb",
      title: "2021 - 2023",
      year: "2021",
    },
    {
      id: "2019-2021",
      model: "/royal_shaded.glb",
      logo: "/reLogo_shaded.glb",
      title: "2019 - 2021",
      year: "2019",
      hasParticles: true,
    },
    {
      id: "2018",
      title: "2018",
      year: "2018",
      isSunset: true,
    },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  // simple keyboard navigation
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowDown") setCurrentIndex((i) => Math.min(periods.length - 1, i + 1));
      if (e.key === "ArrowUp") setCurrentIndex((i) => Math.max(0, i - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="app">
      <GlobalCanvas currentIndex={currentIndex} periods={periods} />
      <div className="timeline-indicator">
        {periods.map((p, i) => (
          <div
            key={p.id}
            className={`dot ${i === currentIndex ? "active" : ""}`}
            onClick={() => setCurrentIndex(i)}
          >
            <span className="year">{p.year}</span>
          </div>
        ))}
      </div>

      <main className="sections-wrapper">
        <div
          className="sections-container"
          style={{
            transform: `translateY(-${currentIndex * 100}vh)`,
            transition: "transform 1.2s cubic-bezier(.25,.1,.25,1)",
          }}
        >
          {periods.map((p, i) => (
            <section className="section" key={p.id} data-index={i}>
              <div className="section-inner">
                <h1>{p.title}</h1>
                <p>{p.isSunset ? "Cinematic sunset with ocean and god-rays." : p.title}</p>
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
