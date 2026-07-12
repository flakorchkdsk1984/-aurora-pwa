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
  { emoji: '🦄', name: 'unicornio mágico' },
  { emoji: '🦖', name: 'dinosaurio verde' },
  { emoji: '🎈', name: 'globo de colores' },
  { emoji: '🍦', name: 'helado dulce' },
  { emoji: '🚀', name: 'cohete espacial' },
  { emoji: '🧸', name: 'osito de felpa' },
  { emoji: '🎨', name: 'paleta de pintura' },
  { emoji: '🐱', name: 'gatito tierno' },
  { emoji: '🍓', name: 'frutilla jugosa' },
  { emoji: '🐬', name: 'delfín saltarín' },
  { emoji: '👑', name: 'corona real' },
  { emoji: '🍩', name: 'dona sabrosa' }
];

export default function App() {
  const [activeModule, setActiveModule] = useState('home'); 
  const [settings, setSettings] = useState({
    autoAdapt: true,
    speechRate: 0.75, 
    overloadReduction: false
  });
  const [showParentGate, setShowParentGate] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  // Gamification: Sticker Book & Shaking Gift Box states
  const [stickers, setStickers] = useState([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [copitoSpeech, setCopitoSpeech] = useState('¡Hola! Toca un dibujo grande para empezar.');
  
  // Gift Box Opening Minigame
  const [showGiftBox, setShowGiftBox] = useState(false);
  const [isBoxOpening, setIsBoxOpening] = useState(false);
  const [pendingSticker, setPendingSticker] = useState(null);
  const [revealedSticker, setRevealedSticker] = useState(null);

  // Digital Illiteracy Help States
  const [showHomeFinger, setShowHomeFinger] = useState(false);
  const idleTimer = useRef(null);

  useEffect(() => {
    const setup = async () => {
      try {
        await initDB();
        const autoAdapt = await getSetting('autoAdapt', true);
        const speechRate = await getSetting('speechRate', 0.75);
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

    if (activeModule === 'home' && !showGiftBox) {
      idleTimer.current = setTimeout(() => {
        setShowHomeFinger(true);
        speak('¿Sigues ahí? Presiona el primer botón azul para aprender a mover el mouse.', settings.speechRate);
        
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

  // Triggered when any game is completed
  const handleEarnSticker = () => {
    const randomSticker = STICKER_POOL[Math.floor(Math.random() * STICKER_POOL.length)];
    setPendingSticker(randomSticker);
    
    // Launch the Gift Box opening modal
    setShowGiftBox(true);
    setIsBoxOpening(false);
    setRevealedSticker(null);
    
    speak('¡Sorpresa! ¡Tienes un regalo! Toca la caja de regalo para abrirla.', settings.speechRate);
  };

  // Open the box when clicked
  const openGiftBox = async () => {
    if (isBoxOpening) return;
    setIsBoxOpening(true);
    speak('¡Abriendo!', settings.speechRate);

    // After 1.5 seconds of shaking, reveal the sticker!
    setTimeout(async () => {
      setRevealedSticker(pendingSticker);
      setShowConfetti(true);
      
      const updatedStickers = [...stickers, pendingSticker];
      setStickers(updatedStickers);
      
      try {
        await saveSetting('stickers', updatedStickers);
      } catch (e) {
        console.error(e);
      }

      speak(`¡Felicitaciones! Ganaste un ${pendingSticker.name} de regalo.`, settings.speechRate);
      setCopitoSpeech(`¡Ganaste un ${pendingSticker.name}!`);

      // Close the award screen after 4 seconds
      setTimeout(() => {
        setShowGiftBox(false);
        setShowConfetti(false);
        setPendingSticker(null);
        setRevealedSticker(null);
        setIsBoxOpening(false);
      }, 4500);

    }, 1500);
  };

  const clickSticker = (sticker) => {
    speak(`Tu calcomanía de ${sticker.name}`, settings.speechRate);
    setCopitoSpeech(`¡Ese es un ${sticker.name}!`);
  };

  return (
    <div 
      className={`app-shell ${settings.overloadReduction ? 'reduce-motion' : ''}`}
      onClick={resetIdleTimer}
    >
      <CelebrationConfetti active={showConfetti} />

      {isOffline && (
        <div className="offline-banner">
          <span>📶 Estás jugando sin Internet (Funciona offline)</span>
        </div>
      )}

      {/* Interactive Gift Box Opening Screen */}
      {showGiftBox && (
        <div className="gift-box-overlay">
          <div className="gift-box-container">
            {!revealedSticker ? (
              <button 
                className={`gift-box-element ${isBoxOpening ? 'shaking-box' : 'bounce-box'}`}
                onClick={openGiftBox}
                aria-label="Abrir caja de regalo"
              >
                🎁
                <div className="gift-prompt-label">¡Toca la caja!</div>
              </button>
            ) : (
              <div className="gift-reveal-card anim-bounce">
                <span className="gift-reveal-emoji">{revealedSticker.emoji}</span>
                <h2>¡Ganaste un Premio!</h2>
                <p>Conseguiste un {revealedSticker.name}</p>
              </div>
            )}
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
