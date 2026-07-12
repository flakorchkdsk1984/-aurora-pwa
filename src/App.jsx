import React, { useState, useEffect, useRef } from 'react';
import { getSetting, saveSetting, initDB } from './db';
import { speak } from './components/TTSHelper';
import MouseTraining from './components/MouseTraining';
import VisualCommunication from './components/VisualCommunication';
import DailyRoutines from './components/DailyRoutines';
import CognitiveGames from './components/CognitiveGames';
import PrevocationalTraining from './components/PrevocationalTraining';
import ParentGate from './components/ParentGate';
import ParentDashboard from './components/ParentDashboard';
import CelebrationConfetti from './components/CelebrationConfetti';

const STICKER_POOL = [
  { emoji: '🦄', name: 'unicornio' },
  { emoji: '🦖', name: 'dinosaurio' },
  { emoji: '🎈', name: 'globo' },
  { emoji: '🍦', name: 'helado' },
  { emoji: '🚀', name: 'cohete' },
  { emoji: '🧸', name: 'osito' },
  { emoji: '🎨', name: 'paleta de pintura' },
  { emoji: '🐱', name: 'gatito' },
  { emoji: '🍓', name: 'frutilla' },
  { emoji: '🐬', name: 'delfín' },
  { emoji: '👑', name: 'corona' },
  { emoji: '🍩', name: 'dona' }
];

export default function App() {
  const [activeModule, setActiveModule] = useState('home'); 
  const [settings, setSettings] = useState({
    autoAdapt: true,
    speechRate: 0.75, // Slower default speed for beginners
    overloadReduction: false
  });
  const [showParentGate, setShowParentGate] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  // Gamification & Accessibility States
  const [stickers, setStickers] = useState([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [copitoSpeech, setCopitoSpeech] = useState('¡Hola! Toca un dibujo grande para empezar.');
  const [lastEarnedSticker, setLastEarnedSticker] = useState(null);
  
  // Digital Illiteracy Help States
  const [showHomeFinger, setShowHomeFinger] = useState(false);
  const idleTimer = useRef(null);

  useEffect(() => {
    const setup = async () => {
      try {
        await initDB();
        const autoAdapt = await getSetting('autoAdapt', true);
        const speechRate = await getSetting('speechRate', 0.75); // Slow down speech
        const overloadReduction = await getSetting('overloadReduction', false);
        setSettings({ autoAdapt, speechRate, overloadReduction });

        const savedStickers = await getSetting('stickers', []);
        setStickers(savedStickers);
      } catch (e) {
        console.error(e);
      }
    };
    setup();

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial greeting loop
    speakGreeting();
    resetIdleTimer();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearTimeout(idleTimer.current);
    };
  }, [activeModule]);

  const speakGreeting = () => {
    speak('¡Hola! Presiona uno de los dibujos grandes con tu dedo o el mouse para empezar a jugar.', settings.speechRate);
  };

  const resetIdleTimer = () => {
    clearTimeout(idleTimer.current);
    setShowHomeFinger(false);

    if (activeModule === 'home') {
      idleTimer.current = setTimeout(() => {
        // Show visual finger helper and repeat voice instructions if user is idle for 8s
        setShowHomeFinger(true);
        speak('¿Sigues ahí? Presiona el primer botón azul para aprender a mover el mouse.', settings.speechRate);
        
        // Loop prompt every 12 seconds if they stay idle
        idleTimer.current = setInterval(() => {
          speak('Toca el dibujo que tiene la flecha amarilla encima.', settings.speechRate);
        }, 12000);
      }, 8000);
    }
  };

  const handleModuleChange = (mod) => {
    setActiveModule(mod);
    clearTimeout(idleTimer.current);
    
    if (mod === 'mouse') {
      speak('Vamos a jugar con el mouse. Mueve la manito.', settings.speechRate);
    } else if (mod === 'comm') {
      speak('Abriendo tablero de comunicación. Toca los dibujos para hablar.', settings.speechRate);
    } else if (mod === 'routines') {
      speak('Rutinas. ¿Qué hacemos primero y qué hacemos después?', settings.speechRate);
    } else if (mod === 'cognitive') {
      speak('Vamos a jugar y pensar con cartas y dibujos.', settings.speechRate);
    } else if (mod === 'prevocational') {
      speak('Vamos a aprender trabajos en el computador.', settings.speechRate);
    } else if (mod === 'home') {
      speak('Volviste al inicio. Elige otro dibujo.', settings.speechRate);
      setCopitoSpeech('¡Muy bien hecho! Mira tu premio abajo.');
    }
  };

  const handleParentGateSuccess = () => {
    setShowParentGate(false);
    setActiveModule('dashboard');
  };

  const handleEarnSticker = async () => {
    const randomSticker = STICKER_POOL[Math.floor(Math.random() * STICKER_POOL.length)];
    const updatedStickers = [...stickers, randomSticker];
    setStickers(updatedStickers);
    setLastEarnedSticker(randomSticker);
    
    try {
      await saveSetting('stickers', updatedStickers);
    } catch (e) {
      console.error(e);
    }

    setShowConfetti(true);
    setCopitoSpeech(`¡Ganaste un ${randomSticker.name}!`);
    
    setTimeout(() => {
      speak(`¡Qué feliz estoy! Ganaste una calcomanía de ${randomSticker.name}.`, settings.speechRate);
    }, 1500);

    setTimeout(() => {
      setShowConfetti(false);
      setLastEarnedSticker(null);
    }, 4500);
  };

  const clickSticker = (sticker) => {
    speak(`Esta es tu calcomanía de ${sticker.name}`, settings.speechRate);
    setCopitoSpeech(`¡Ese es un ${sticker.name}!`);
  };

  return (
    <div 
      className={`app-shell ${settings.overloadReduction ? 'reduce-motion' : ''}`}
      onClick={resetIdleTimer} // Any click resets the help prompt timer
    >
      <CelebrationConfetti active={showConfetti} />

      {isOffline && (
        <div className="offline-banner">
          <span>📶 Estás jugando sin Internet (Funciona offline)</span>
        </div>
      )}

      {lastEarnedSticker && (
        <div className="sticker-award-overlay">
          <div className="sticker-award-card anim-bounce">
            <span className="award-emoji">{lastEarnedSticker.emoji}</span>
            <h2>¡Ganaste un premio!</h2>
            <p>¡Buen trabajo!</p>
          </div>
        </div>
      )}

      {activeModule === 'home' && (
        <div className="home-dashboard">
          <header className="home-header">
            <div className="welcome-text">
              <span className="star-icon anim-spin">⭐</span>
              <h1>¡Hola Aurora!</h1>
              <p>Presiona el juego que más te guste</p>
            </div>
            
            <button className="parent-zone-btn" onClick={() => setShowParentGate(true)}>
              🔒 Solo Padres
            </button>
          </header>

          <div className="assistant-character-bubble">
            <span className="avatar-btn">🐼</span>
            <div className="bubble-text">
              <p>{copitoSpeech}</p>
              <div className="bubble-tail"></div>
            </div>
          </div>

          <main className="modules-grid">
            <button 
              className="module-card card-mouse" 
              onClick={() => handleModuleChange('mouse')}
            >
              {showHomeFinger && <div className="illiteracy-finger-guide">👇</div>}
              <div className="card-visual">🖱️</div>
              <h2>1. Usar el Mouse</h2>
              <p>Mueve el ratón y haz click</p>
            </button>

            <button 
              className="module-card card-comm" 
              onClick={() => handleModuleChange('comm')}
            >
              <div className="card-visual">💬</div>
              <h2>2. Hablar con Dibujos</h2>
              <p>Presiona para escuchar la voz</p>
            </button>

            <button 
              className="module-card card-routines" 
              onClick={() => handleModuleChange('routines')}
            >
              <div className="card-visual">📅</div>
              <h2>3. Primero / Después</h2>
              <p>Aprende tus tareas diarias</p>
            </button>

            <button 
              className="module-card card-cognitive" 
              onClick={() => handleModuleChange('cognitive')}
            >
              <div className="card-visual">🧠</div>
              <h2>4. Juegos de Pensar</h2>
              <p>Cartas de memoria y clasificar</p>
            </button>

            <button 
              className="module-card card-prevocational" 
              onClick={() => handleModuleChange('prevocational')}
            >
              <div className="card-visual">💼</div>
              <h2>5. Trabajo en Computador</h2>
              <p>Aprende tareas de oficina</p>
            </button>
          </main>

          <section className="sticker-shelf-section">
            <h2>🏆 Tus Premios ({stickers.length})</h2>
            <div className="sticker-shelf-display">
              {stickers.length === 0 ? (
                <p className="no-stickers-msg">¡Juega para ganar premios aquí! 🦄🎈🦖</p>
              ) : (
                <div className="stickers-row">
                  {stickers.map((st, idx) => (
                    <button 
                      key={idx} 
                      className="shelf-sticker-btn anim-bounce"
                      onClick={() => clickSticker(st)}
                      style={{ animationDelay: `${idx * 0.1}s` }}
                    >
                      {st.emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>

          <footer className="home-footer">
            <p>Diseñado con cariño para Aurora</p>
          </footer>
        </div>
      )}

      {activeModule === 'mouse' && (
        <MouseTraining 
          settings={settings} 
          onBack={() => handleModuleChange('home')}
          onEarnSticker={handleEarnSticker}
        />
      )}

      {activeModule === 'comm' && (
        <VisualCommunication 
          settings={settings} 
          onBack={() => handleModuleChange('home')} 
        />
      )}

      {activeModule === 'routines' && (
        <DailyRoutines 
          settings={settings} 
          onBack={() => handleModuleChange('home')}
          onEarnSticker={handleEarnSticker}
        />
      )}

      {activeModule === 'cognitive' && (
        <CognitiveGames 
          settings={settings} 
          onBack={() => handleModuleChange('home')}
          onEarnSticker={handleEarnSticker}
        />
      )}

      {activeModule === 'prevocational' && (
        <PrevocationalTraining 
          settings={settings} 
          onBack={() => handleModuleChange('home')}
          onEarnSticker={handleEarnSticker}
        />
      )}

      {activeModule === 'dashboard' && (
        <ParentDashboard 
          onClose={() => handleModuleChange('home')} 
          onSettingsChange={(newSettings) => setSettings(newSettings)}
        />
      )}

      {showParentGate && (
        <ParentGate 
          onSuccess={handleParentGateSuccess} 
          onCancel={() => setShowParentGate(false)} 
        />
      )}
    </div>
  );
}
