import React, { useState, useEffect } from 'react';
import { speak } from './TTSHelper';
import { saveLog } from '../db';

export default function PrevocationalTraining({ settings, onBack, onEarnSticker }) {
  const [subGame, setSubGame] = useState('menu'); // 'menu', 'sorting', 'matching', 'simulation'
  const [isCelebrated, setIsCelebrated] = useState(false);
  const [celebrationText, setCelebrationText] = useState('');
  
  // Game 1: Sorting states
  const [sortItem, setSortItem] = useState({ emoji: '', category: '', label: '' });

  // Game 2: Matching states (Control Visual)
  const [matchSet, setMatchSet] = useState({ left: [], right: [], areEqual: true });

  // Game 3: Simulation states (Etiquetado / Inspección)
  const [simItems, setSimItems] = useState([]);
  const [completedSimCount, setCompletedSimCount] = useState(0);

  const startTime = Date.now();

  useEffect(() => {
    if (subGame === 'sorting') {
      initSorting();
    } else if (subGame === 'matching') {
      initMatching();
    } else if (subGame === 'simulation') {
      initSimulation();
    }
  }, [subGame]);

  const speakHelp = () => {
    if (subGame === 'sorting') {
      speak(`Guarda la foto de ${sortItem.label} en la carpeta correcta`, settings.speechRate);
    } else if (subGame === 'matching') {
      speak('Mira las dos cajas. ¿Tienen la misma cantidad de paquetes? Presiona Sí o No', settings.speechRate);
    } else if (subGame === 'simulation') {
      speak('Inspección de calidad. Presiona y marca solo las cajas que tienen el visto verde', settings.speechRate);
    }
  };

  const handleGameComplete = async (activityName, message) => {
    setIsCelebrated(true);
    setCelebrationText(message);
    speak(message, settings.speechRate);

    await saveLog({
      module: 'prevocational',
      activity: activityName,
      success: true,
      durationMs: Date.now() - startTime
    });

    if (onEarnSticker) {
      onEarnSticker();
    }

    setTimeout(() => {
      setIsCelebrated(false);
      if (subGame === 'sorting') {
        initSorting();
      } else if (subGame === 'matching') {
        initMatching();
      } else if (subGame === 'simulation') {
        initSimulation();
      }
    }, 4000);
  };

  // --- 1. DIGITAL SORTING ---
  const sortingPool = [
    { emoji: '🦁', category: 'animales', label: 'león' },
    { emoji: '🐶', category: 'animales', label: 'perro' },
    { emoji: '🐱', category: 'animales', label: 'gato' },
    { emoji: '🍕', category: 'comida', label: 'pizza' },
    { emoji: '🍎', category: 'comida', label: 'manzana' },
    { emoji: '🍰', category: 'comida', label: 'pastel' },
    { emoji: '🏖️', category: 'vacaciones', label: 'playa' },
    { emoji: '⛺', category: 'vacaciones', label: 'acampar' },
    { emoji: '✈️', category: 'vacaciones', label: 'avión' }
  ];

  const initSorting = () => {
    const item = sortingPool[Math.floor(Math.random() * sortingPool.length)];
    setSortItem(item);
    speak(`Clasificación digital: guarda el ${item.label} en su carpeta.`, settings.speechRate);
  };

  const handleSort = (category) => {
    if (isCelebrated) return;
    if (category === sortItem.category) {
      handleGameComplete('Clasificación Digital', `¡Excelente! El ${sortItem.label} va en la carpeta de ${category === 'animales' ? 'Animales' : category === 'comida' ? 'Comida' : 'Vacaciones'}.`);
    } else {
      speak('Esa no es la carpeta correcta. Mira bien el dibujo.', settings.speechRate);
    }
  };

  // --- 2. VISUAL QUALITY CONTROL ---
  const initMatching = () => {
    const areEqual = Math.random() > 0.5;
    const countA = Math.floor(Math.random() * 3) + 1; // 1, 2, or 3
    const countB = areEqual ? countA : countA === 3 ? 2 : countA + 1;

    const left = Array(countA).fill('📦');
    const right = Array(countB).fill('📦');

    setMatchSet({ left, right, areEqual: countA === countB });
    speak('Control de calidad: ¿las dos bandejas son iguales?', settings.speechRate);
  };

  const handleMatchAnswer = (answer) => {
    if (isCelebrated) return;
    if (answer === matchSet.areEqual) {
      handleGameComplete('Control Visual', '¡Increíble! Buen ojo para los detalles.');
    } else {
      speak('¡Fíjate bien! Cuenta las cajas en cada lado.', settings.speechRate);
    }
  };

  // --- 3. REPETITIVE SIMULATION (Package Inspection) ---
  const initSimulation = () => {
    // Generate 4 inspection items (either good 📦✅ or bad 📦❌)
    const items = [];
    for (let i = 0; i < 4; i++) {
      const isGood = Math.random() > 0.5;
      items.push({
        id: i,
        emoji: '📦',
        status: isGood ? 'good' : 'broken',
        statusEmoji: isGood ? '✅' : '❌',
        checked: false
      });
    }
    setSimItems(items);
    setCompletedSimCount(0);
    speak('Revisión de stock. Selecciona solo las cajas que están en buen estado.', settings.speechRate);
  };

  const handleSimToggle = (id) => {
    setSimItems(prev => prev.map(item => {
      if (item.id === id) {
        const nextState = !item.checked;
        speak(item.status === 'good' ? 'Caja buena' : '¡Cuidado! Esta caja está rota', settings.speechRate);
        return { ...item, checked: nextState };
      }
      return item;
    }));
  };

  const handleVerifySimulation = () => {
    // Check if the user selected ALL good items and NO bad items
    const errors = simItems.filter(item => {
      if (item.status === 'good' && !item.checked) return true; // Missed a good one
      if (item.status === 'broken' && item.checked) return true; // Selected a bad one
      return false;
    });

    if (errors.length === 0) {
      handleGameComplete('Tareas Repetitivas', '¡Excelente trabajo de auditoría! Todos los paquetes revisados.');
    } else {
      speak('Aún quedan errores. Recuerda: solo marcar las cajas con ticket verde y dejar vacías las del aspa roja.', settings.speechRate);
    }
  };

  return (
    <div className={`game-container module-prevocational ${settings.overloadReduction ? 'overload-safe' : ''}`}>
      <header className="game-header">
        {subGame === 'menu' ? (
          <button className="back-btn" onClick={onBack}>🏠 Inicio</button>
        ) : (
          <button className="back-btn" onClick={() => setSubGame('menu')}>⬅️ Salir al Menú</button>
        )}
        <div className="title-area">
          <h2>Simulación Prelaboral</h2>
        </div>
      </header>

      {subGame === 'menu' && (
        <div className="games-menu-grid">
          <button className="menu-game-card sorting-card" onClick={() => setSubGame('sorting')}>
            <span className="game-card-icon">📁 🐱</span>
            <h3>Clasificación Digital</h3>
            <p>Ordenar imágenes en carpetas</p>
          </button>

          <button className="menu-game-card matching-card" onClick={() => setSubGame('matching')}>
            <span className="game-card-icon">📦 ⚖️ 📦</span>
            <h3>Control de Calidad</h3>
            <p>Comparar bandejas y contar elementos</p>
          </button>

          <button className="menu-game-card sim-card" onClick={() => setSubGame('simulation')}>
            <span className="game-card-icon">📋 ✅</span>
            <h3>Inspección y Revisión</h3>
            <p>Verificar listas y descartar rotos</p>
          </button>
        </div>
      )}

      {subGame !== 'menu' && (
        <div className="prevocational-game-workspace">
          {isCelebrated && (
            <div className="celebration-overlay">
              <div className="reward-emojis">💼 🌟 🏆 👏</div>
              <div className="celebration-msg">{celebrationText}</div>
            </div>
          )}

          {/* 1. DIGITAL SORTING VIEW */}
          {subGame === 'sorting' && !isCelebrated && (
            <div className="sorting-game-layout">
              <div className="sorting-source-item anim-bounce">
                <span className="source-emoji">{sortItem.emoji}</span>
                <span className="source-label">{sortItem.label}</span>
              </div>

              <div className="folders-grid">
                <button className="folder-btn f-animals" onClick={() => handleSort('animales')}>
                  📁
                  <span>Fotos Animales</span>
                </button>
                <button className="folder-btn f-food" onClick={() => handleSort('comida')}>
                  📁
                  <span>Fotos Comida</span>
                </button>
                <button className="folder-btn f-vacation" onClick={() => handleSort('vacaciones')}>
                  📁
                  <span>Fotos Vacaciones</span>
                </button>
              </div>
            </div>
          )}

          {/* 2. MATCHING (QUALITY CONTROL) VIEW */}
          {subGame === 'matching' && !isCelebrated && (
            <div className="matching-game-layout">
              <div className="matching-comparison-panels">
                <div className="panel-comparison left-panel">
                  <h4>Bandeja A</h4>
                  <div className="boxes-container">
                    {matchSet.left.map((emoji, idx) => (
                      <span key={idx} className="box-item">📦</span>
                    ))}
                  </div>
                </div>

                <div className="panel-comparison right-panel">
                  <h4>Bandeja B</h4>
                  <div className="boxes-container">
                    {matchSet.right.map((emoji, idx) => (
                      <span key={idx} className="box-item">📦</span>
                    ))}
                  </div>
                </div>
              </div>

              <p className="matching-prompt-text">¿Son iguales las bandejas A y B?</p>

              <div className="matching-options-row">
                <button className="match-btn btn-yes" onClick={() => handleMatchAnswer(true)}>
                  ✅ SÍ, son iguales
                </button>
                <button className="match-btn btn-no" onClick={() => handleMatchAnswer(false)}>
                  ❌ NO, son diferentes
                </button>
              </div>
            </div>
          )}

          {/* 3. SIMULATION (INSPECTION) VIEW */}
          {subGame === 'simulation' && !isCelebrated && (
            <div className="simulation-game-layout">
              <h3>Hoja de Control: Selecciona las cajas BUENAS</h3>
              <div className="inspection-list">
                {simItems.map((item) => (
                  <button
                    key={item.id}
                    className={`inspection-row-card ${item.checked ? 'selected' : ''}`}
                    onClick={() => handleSimToggle(item.id)}
                  >
                    <span className="inspected-item">{item.emoji} Caja {item.id + 1}</span>
                    <div className="inspected-status-indicators">
                      <span className="status-label">{item.statusEmoji}</span>
                      <div className={`checkbox-indicator ${item.checked ? 'checked' : ''}`}></div>
                    </div>
                  </button>
                ))}
              </div>

              <button className="verify-inspection-btn" onClick={handleVerifySimulation}>
                ✔️ Enviar Reporte de Calidad
              </button>
            </div>
          )}
        </div>
      )}

      {subGame !== 'menu' && (
        <footer className="game-footer">
          <button className="audio-repeat-btn" onClick={speakHelp}>
            🔊 ¿Qué debo hacer?
          </button>
        </footer>
      )}
    </div>
  );
}
