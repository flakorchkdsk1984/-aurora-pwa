import React, { useState, useEffect } from 'react';
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

const COPITO_PHRASES = [
  '¡Hola Aurora! ¡Me alegra mucho verte!',
  '¡Lo estás haciendo súper bien, sigue adelante!',
  '¡Qué inteligente eres! Me encanta jugar contigo.',
  '¿Vamos a ganar otra calcomanía para tu álbum?',
  '¡Eres genial, Aurora!',
  '¡Tómate tu tiempo, lo estás haciendo fantástico!'
];

export default function App() {
  const [activeModule, setActiveModule] = useState('home'); 
  const [settings, setSettings] = useState({
    autoAdapt: true,
    speechRate: 0.85,
    overloadReduction: false
  });
  const [showParentGate, setShowParentGate] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  // Gamification States
  const [stickers, setStickers] = useState([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [copitoSpeech, setCopitoSpeech] = useState('¡Hola Aurora! ¿A qué jugamos hoy?');
  const [lastEarnedSticker, setLastEarnedSticker] = useState(null);

  useEffect(() => {
    const setup = async () => {
      try {
        await initDB();
        const autoAdapt = await getSetting('autoAdapt', true);
        const speechRate = await getSetting('speechRate', 0.85);
        const overloadReduction = await getSetting('overloadReduction', false);
        setSettings({ autoAdapt, speechRate, overloadReduction });

        // Load stickers
        const savedStickers = await getSetting('stickers', []);
        setStickers(savedStickers);
      } catch (e) {
        console.error('Failed to init app:', e);
      }
    };
    setup();

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Warm-up greeting for Aurora
    speak('¡Hola Aurora! Qué lindo verte hoy. ¿A qué quieres jugar?', 0.85);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleModuleChange = (mod) => {
    setActiveModule(mod);
    setCopitoSpeech('¡Diviértete mucho!');
    
    if (mod === 'mouse') {
      speak('Vamos a entrenar el mouse', settings.speechRate);
    } else if (mod === 'comm') {
      speak('Abriendo tablero de comunicación', settings.speechRate);
    } else if (mod === 'routines') {
      speak('Rutinas diarias. ¿Qué hacemos primero y después?', settings.speechRate);
    } else if (mod === 'cognitive') {
      speak('Vamos a jugar y pensar', settings.speechRate);
    } else if (mod === 'prevocational') {
      speak('Habilidades de oficina', settings.speechRate);
    } else if (mod === 'home') {
      speak('Volver a la pantalla principal', settings.speechRate);
      setCopitoSpeech('¡Bien hecho! Mira tu colección.');
    }
  };

  const handleParentGateSuccess = () => {
    setShowParentGate(false);
    setActiveModule('dashboard');
  };

  // Gamification: Earn sticker trigger
  const handleEarnSticker = async () => {
    // Pick a random sticker
    const randomSticker = STICKER_POOL[Math.floor(Math.random() * STICKER_POOL.length)];
    
    // Add sticker (allow duplicates or collect unique)
    const updatedStickers = [...stickers, randomSticker];
    setStickers(updatedStickers);
    setLastEarnedSticker(randomSticker);
    
    try {
      await saveSetting('stickers', updatedStickers);
    } catch (e) {
      console.error(e);
    }

    // Trigger celebration effects
    setShowConfetti(true);
    setCopitoSpeech(`¡Ganaste un ${randomSticker.name}!`);
    
    setTimeout(() => {
      speak(`¡Espectacular! Ganaste una calcomanía de ${randomSticker.name} para tu colección.`, settings.speechRate);
    }, 1500);

    // Reset confetti after animation
    setTimeout(() => {
      setShowConfetti(false);
      setLastEarnedSticker(null);
    }, 4500);
  };

  const clickSticker = (sticker) => {
    speak(`Tu calcomanía de ${sticker.name}`, settings.speechRate);
    setCopitoSpeech(`¡Ese es un ${sticker.name}!`);
  };

  const clickCopito = () => {
    const phrase = COPITO_PHRASES[Math.floor(Math.random() * COPITO_PHRASES.length)];
    setCopitoSpeech(phrase);
    speak(phrase, settings.speechRate);
  };

  return (
    <div className={`app-shell ${settings.overloadReduction ? 'reduce-motion' : ''}`}>
      {/* High-performance Confetti Particle System */}
      <CelebrationConfetti active={showConfetti} />

      {/* Offline Alert Bar */}
      {isOffline && (
        <div className="offline-banner">
          <span>📶 Estás jugando sin Internet (Modo Offline activo)</span>
        </div>
      )}

      {/* Award Visual Banner Overlay */}
      {lastEarnedSticker && (
        <div className="sticker-award-overlay">
          <div className="sticker-award-card anim-bounce">
            <span className="award-emoji">{lastEarnedSticker.emoji}</span>
            <h2>¡Calcomanía Ganada!</h2>
            <p>Conseguiste un {lastEarnedSticker.name}</p>
          </div>
        </div>
      )}

      {activeModule === 'home' && (
        <div className="home-dashboard">
          <header className="home-header">
            <div className="welcome-text">
              <span className="star-icon anim-spin">⭐</span>
              <h1>¡Hola Aurora!</h1>
              <p>Elige una actividad para empezar a jugar y aprender</p>
            </div>
            
            <button className="parent-zone-btn" onClick={() => setShowParentGate(true)}>
              🔒 Área Padres
            </button>
          </header>

          {/* Gobi / Copito Interactive Character */}
          <div className="assistant-character-bubble">
            <button className="avatar-btn" onClick={clickCopito} aria-label="Hablar con Copito">
              🐼
            </button>
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
              <div className="card-visual">🖱️</div>
              <h2>Mover y Click</h2>
              <p>Entrenamiento de Mouse</p>
            </button>

            <button 
              className="module-card card-comm" 
              onClick={() => handleModuleChange('comm')}
            >
              <div className="card-visual">💬</div>
              <h2>Comunicación</h2>
              <p>Pictogramas y Habla</p>
            </button>

            <button 
              className="module-card card-routines" 
              onClick={() => handleModuleChange('routines')}
            >
              <div className="card-visual">📅</div>
              <h2>Primero / Después</h2>
              <p>Rutinas diarias</p>
            </button>

            <button 
              className="module-card card-cognitive" 
              onClick={() => handleModuleChange('cognitive')}
            >
              <div className="card-visual">🧠</div>
              <h2>Juegos</h2>
              <p>Memoria y Clasificación</p>
            </button>

            <button 
              className="module-card card-prevocational" 
              onClick={() => handleModuleChange('prevocational')}
            >
              <div className="card-visual">💼</div>
              <h2>Trabajo Digital</h2>
              <p>Destrezas del computador</p>
            </button>
          </main>

          {/* Sticker Album Shelf (Gamification) */}
          <section className="sticker-shelf-section">
            <h2>🏆 Tu Álbum de Calcomanías ({stickers.length})</h2>
            <div className="sticker-shelf-display">
              {stickers.length === 0 ? (
                <p className="no-stickers-msg">¡Completa actividades para ganar divertidas calcomanías! 🦄🎈🦖</p>
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
            <p>Aurora Agent PWA • Diseñado con cariño para el aprendizaje autónomo</p>
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
