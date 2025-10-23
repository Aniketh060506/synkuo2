import { useState, useEffect } from 'react';
import SplashParticleField from './SplashParticleField';
import { Zap, ArrowUp, Sparkles } from 'lucide-react';
import './SplashScreen.css';

export default function SplashScreen({ onComplete }) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleClick = () => {
    setIsAnimating(true);
    // Trigger app load immediately to remove gap; keep a tiny delay for click feedback
    setTimeout(() => {
      onComplete();
    }, 100);
  };

  return (
    <div className={`splash-screen ${isAnimating ? 'tearing' : ''}`}>
      {!isAnimating && <SplashParticleField active={!isAnimating} />}
      {/* Background effects removed for a clean surface */}

      {/* Top Half */}
      <div className="splash-half splash-top">
        <div className="splash-content">
          {/* Clean content: logo + title + CTA only */}
          {/* Logo - Top */}
          <div className="splash-logo-section">
            <div className="logo-glow"></div>
            <Zap className="splash-logo" />
          </div>

          {/* Title - Center */}
          <div className="splash-title-section">
            <h1 className="splash-title">
              <span className="title-word">SynkUp</span>
            </h1>
            
            <p className="splash-subtitle">
              <Sparkles className="subtitle-icon" />
              Your Ultimate Productivity Workspace
              <Sparkles className="subtitle-icon" />
            </p>
          </div>

          {/* Button - Bottom */}
          <div className="splash-button-section">
            <button 
              className="splash-button"
              onClick={handleClick}
            >
              <div className="button-glow"></div>
              <span className="button-text">Let's Dive In</span>
              <ArrowUp className="button-arrow" />
            </button>
            
            <p className="splash-hint">Click to enter</p>
          </div>
        </div>
      </div>

      {/* Bottom Half */}
      <div className="splash-half splash-bottom">
        <div className="splash-content">
          {/* Background removed */}
        </div>
      </div>
    </div>
  );
}
