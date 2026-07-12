import React, { useState } from 'react';
import { speak } from './TTSHelper';
import { saveLog } from '../db';

const ROUTINE_TEMPLATES = [
  {
    id: 1,
    name: '☀️ Rutina de Mañana',
    first: { emoji: '🪥', label: 'Lavarse dientes', voice: 'Primero, lavar los dientes' },
    after: { emoji: '🎮', label: 'Jugar un juego', voice: 'Después, jugar un juego' }
  },
  {
    id: 2,
    name: '🍽️ Rutina de Almuerzo',
    first: { emoji: '🍽️', label: 'Almorzar comida', voice: 'Primero, comer el almuerzo' },
    after: { emoji: '🎨', label: 'Dibujar o pintar', voice: 'Después, dibujar o pintar' }
  },
  {
    id: 3,
    name: '👕 Rutina de Vestirse',
    first: { emoji: '👕', label: 'Ponerse ropa', voice: 'Primero, vestirse' },
    after: { emoji: '🚶', label: 'Paseo al parque', voice: 'Después, ir a pasear al parque' }
  },
  {
    id: 4,
    name: '✏️ Rutina de Estudio',
    first: { emoji: '🎒', label: 'Hacer tareas', voice: 'Primero, ordenar y hacer tareas' },
    after: { emoji: '📺', label: 'Ver monitos', voice: 'Después, ver televisión' }
  }
];

export default function DailyRoutines({ settings, onBack }) {
  const [selectedRoutine, setSelectedRoutine] = useState(ROUTINE_TEMPLATES[0]);
  const [firstDone, setFirstDone] = useState(false);
  const [afterDone, setAfterDone] = useState(false);
  const [isCelebrated, setIsCelebrated] = useState(false);
  const [startTime] = useState(Date.now());

  const handleRoutineSelect = (routine) => {
    setSelectedRoutine(routine);
    setFirstDone(false);
    setAfterDone(false);
    setIsCelebrated(false);
    
    // Announce routine
    speak(`Vamos a seguir la rutina: ${routine.name}. Primero, ${routine.first.label}. Después, ${routine.after.label}.`, settings.speechRate);
  };

  const handleFirstClick = () => {
    if (firstDone) return;
    setFirstDone(true);
    speak(`¡Muy bien! Completaste: ${selectedRoutine.first.label}. Ahora toca: ${selectedRoutine.after.label}.`, settings.speechRate);
  };

  const handleAfterClick = async () => {
    if (!firstDone || afterDone) return;
    setAfterDone(true);
    setIsCelebrated(true);
    
    speak('¡Fantástico! Rutina completada. ¡Buen trabajo!', settings.speechRate);

    // Save progress
    await saveLog({
      module: 'routines',
      activity: `Rutina: ${selectedRoutine.name}`,
      success: true,
      durationMs: Date.now() - startTime
    });
  };

  const speakActiveStep = () => {
    if (!firstDone) {
      speak(selectedRoutine.first.voice, settings.speechRate);
    } else if (!afterDone) {
      speak(selectedRoutine.after.voice, settings.speechRate);
    } else {
      speak('¡Felicidades! Terminaste toda tu rutina.', settings.speechRate);
    }
  };

  return (
    <div className={`game-container module-routines ${settings.overloadReduction ? 'overload-safe' : ''}`}>
      <header className="game-header">
        <button className="back-btn" onClick={onBack}>🏠 Inicio</button>
        <div className="title-area">
          <h2>Rutinas Diarias: Primero / Después</h2>
        </div>
      </header>

      {/* Routine Selector Carousel */}
      <div className="routine-selector-row">
        {ROUTINE_TEMPLATES.map((routine) => (
          <button
            key={routine.id}
            className={`routine-select-card ${selectedRoutine.id === routine.id ? 'active' : ''}`}
            onClick={() => handleRoutineSelect(routine)}
          >
            {routine.name}
          </button>
        ))}
      </div>

      {/* Interactive Board */}
      <div className="routine-board-layout">
        {isCelebrated && (
          <div className="celebration-overlay">
            <div className="reward-emojis">🏆 🎉 🌟 👍</div>
            <div className="celebration-msg">¡Terminaste tu rutina!</div>
            <button className="reset-routine-btn" onClick={() => handleRoutineSelect(selectedRoutine)}>
              🔄 Repetir Rutina
            </button>
          </div>
        )}

        {/* Primero (First) Panel */}
        <div className={`routine-step-panel first-panel ${firstDone ? 'completed' : 'active'}`}>
          <div className="panel-badge">1. PRIMERO</div>
          <div className="step-content">
            <span className="step-emoji">{selectedRoutine.first.emoji}</span>
            <span className="step-label">{selectedRoutine.first.label}</span>
          </div>
          <button 
            className={`step-action-btn ${firstDone ? 'checked' : ''}`}
            onClick={handleFirstClick}
            disabled={firstDone}
          >
            {firstDone ? '✅ ¡Listo!' : '🎯 Marcar como Listo'}
          </button>
        </div>

        <div className="routine-arrow-connector">
          <span>➡️</span>
        </div>

        {/* Después (Then) Panel */}
        <div className={`routine-step-panel after-panel ${afterDone ? 'completed' : firstDone ? 'active' : 'locked'}`}>
          <div className="panel-badge">2. DESPUÉS</div>
          <div className="step-content">
            <span className="step-emoji">{selectedRoutine.after.emoji}</span>
            <span className="step-label">{selectedRoutine.after.label}</span>
          </div>
          <button 
            className={`step-action-btn ${afterDone ? 'checked' : ''}`}
            onClick={handleAfterClick}
            disabled={!firstDone || afterDone}
          >
            {afterDone ? '✅ ¡Listo!' : firstDone ? '🎯 Marcar como Listo' : '🔒 Esperando Primero'}
          </button>
        </div>
      </div>

      <footer className="game-footer">
        <p className="instruction-text">
          💡 Presiona el botón verde para completar cada paso de tu rutina. ¡Primero haces uno, luego haces el otro!
        </p>
        <button className="audio-repeat-btn" onClick={speakActiveStep}>
          🔊 Escuchar instrucción
        </button>
      </footer>
    </div>
  );
}
