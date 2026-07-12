import React, { useState, useEffect } from 'react';
import { getSetting, initDB } from './db';
import { speak } from './components/TTSHelper';
import MouseTraining from './components/MouseTraining';
import VisualCommunication from './components/VisualCommunication';
import DailyRoutines from './components/DailyRoutines';
import CognitiveGames from './components/CognitiveGames';
import PrevocationalTraining from './components/PrevocationalTraining';
import ParentGate from './components/ParentGate';
import ParentDashboard from './components/ParentDashboard';

export default function App() {
  const [activeModule, setActiveModule] = useState('home'); // 'home', 'mouse', 'comm', 'routines', 'cognitive', 'prevocational', 'dashboard'
  const [settings, setSettings] = useState({
    autoAdapt: true,
    speechRate: 0.85,
    overloadReduction: false
  });
  const [showParentGate, setShowParentGate] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    // Initialize DB & load settings
    const setup = async () => {
      try {
        await initDB();
        const autoAdapt = await getSetting('autoAdapt', true);
        const speechRate = await getSetting('speechRate', 0.85);
        const overloadReduction = await getSetting('overloadReduction', false);
        setSettings({ autoAdapt, speechRate, overloadReduction });
      } catch (e) {
        console.error('Failed to init settings:', e);
      }
    };
    setup();

    // Listen for online/offline events
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
    
    // Play verbal response when changing modules
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
    }
  };

  const handleParentGateSuccess = () => {
    setShowParentGate(false);
    setActiveModule('dashboard');
  };

  return (
    <div className={`app-shell ${settings.overloadReduction ? 'reduce-motion' : ''}`}>
      {/* Offline Alert Bar */}
      {isOffline && (
        <div className="offline-banner">
          <span>📶 Estás jugando sin Internet (Modo Offline activo)</span>
        </div>
      )}

      {activeModule === 'home' && (
        <div className="home-dashboard">
          <header className="home-header">
            <div className="welcome-text">
              <span className="star-icon anim-spin">⭐</span>
              <h1>¡Hola Aurora!</h1>
              <p>Elige una actividad para empezar a aprender</p>
            </div>
            
            <button className="parent-zone-btn" onClick={() => setShowParentGate(true)}>
              🔒 Área Padres
            </button>
          </header>

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

          <footer className="home-footer">
            <p>Aurora Agent PWA • Diseñado con cariño para el aprendizaje autónomo</p>
          </footer>
        </div>
      )}

      {activeModule === 'mouse' && (
        <MouseTraining 
          settings={settings} 
          onBack={() => handleModuleChange('home')} 
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
        />
      )}

      {activeModule === 'cognitive' && (
        <CognitiveGames 
          settings={settings} 
          onBack={() => handleModuleChange('home')} 
        />
      )}

      {activeModule === 'prevocational' && (
        <PrevocationalTraining 
          settings={settings} 
          onBack={() => handleModuleChange('home')} 
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
