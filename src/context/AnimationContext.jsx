import React, { createContext, useContext, useState, useEffect } from 'react';

const AnimationContext = createContext();

export function AnimationProvider({ children }) {
  const [hasPlayedIntro, setHasPlayedIntro] = useState(false);

  useEffect(() => {
    // Check if it's already played in this session to prevent re-playing on route changes
    const played = sessionStorage.getItem('revlabs_intro_played');
    if (played) {
      setHasPlayedIntro(true);
    }
  }, []);

  const markIntroPlayed = () => {
    sessionStorage.setItem('revlabs_intro_played', 'true');
    setHasPlayedIntro(true);
  };

  return (
    <AnimationContext.Provider value={{ hasPlayedIntro, markIntroPlayed }}>
      {children}
    </AnimationContext.Provider>
  );
}

export function useAnimation() {
  return useContext(AnimationContext);
}
