import React, { useState } from 'react';
import { speak } from './TTSHelper';
import { saveLog } from '../db';

const CATEGORIES = {
  needs: {
    label: '🚨 Necesidades',
    color: '#e63946',
    items: [
      { emoji: '🍎', label: 'Comer', voice: 'Quiero comer, por favor', color: '#ffeaec' },
      { emoji: '💧', label: 'Agua', voice: 'Tengo sed, quiero agua', color: '#e8f1f5' },
      { emoji: '🚽', label: 'Baño', voice: 'Necesito ir al baño', color: '#f0f3e8' },
      { emoji: '😴', label: 'Descansar', voice: 'Tengo sueño, quiero descansar', color: '#f5eef7' },
      { emoji: '🆘', label: 'Ayuda', voice: 'Por favor, necesito ayuda', color: '#ffeae6' }
    ]
  },
  feelings: {
    label: '😊 Sentir',
    color: '#ffb703',
    items: [
      { emoji: '😊', label: 'Feliz', voice: 'Me siento feliz', color: '#fff9db' },
      { emoji: '😢', label: 'Triste', voice: 'Me siento triste', color: '#eef3ff' },
      { emoji: '🥱', label: 'Cansada', voice: 'Estoy cansada', color: '#f4f3f7' },
      { emoji: '😡', label: 'Enojada', voice: 'Estoy enojada', color: '#ffebeb' },
      { emoji: '🫂', label: 'Abrazo', voice: 'Quiero un abrazo', color: '#fff0f5' }
    ]
  },
  activities: {
    label: '🎮 Actividades',
    color: '#4361ee',
    items: [
      { emoji: '🎮', label: 'Jugar', voice: 'Quiero jugar', color: '#ebf2ff' },
      { emoji: '🚶', label: 'Salir', voice: 'Quiero salir a pasear', color: '#ebfaf0' },
      { emoji: '🎨', label: 'Pintar', voice: 'Quiero dibujar o pintar', color: '#fff2e6' },
      { emoji: '📺', label: 'Ver Tele', voice: 'Quiero ver televisión', color: '#f3e8ff' },
      { emoji: '🎵', label: 'Música', voice: 'Quiero escuchar música', color: '#fff0f3' }
    ]
  }
};

export default function VisualCommunication({ settings, onBack }) {
  const [activeCategory, setActiveTab] = useState('needs');
  const [sentence, setSentence] = useState([]);
  const [pulseItem, setPulseItem] = useState(null);

  const handleCardClick = async (item) => {
    setPulseItem(item.label);
    setTimeout(() => setPulseItem(null), 600);

    // Add to current sentence building
    if (sentence.length < 3) {
      setSentence(prev => [...prev, item]);
    }

    // Play Voice output
    speak(item.voice, settings.speechRate);

    // Save interaction log
    await saveLog({
      module: 'communication',
      activity: `Pictograma: ${item.label}`,
      success: true,
      durationMs: 0
    });
  };

  const handleSpeakSentence = () => {
    if (sentence.length === 0) return;
    const voiceText = sentence.map(item => item.label).join(' ');
    speak(`Quiero ${voiceText}`, settings.speechRate);
  };

  const handleClearSentence = () => {
    setSentence([]);
  };

  return (
    <div className={`game-container module-comm ${settings.overloadReduction ? 'overload-safe' : ''}`}>
      <header className="game-header">
        <button className="back-btn" onClick={onBack}>🏠 Inicio</button>
        <div className="title-area">
          <h2>Comunicación por Pictogramas</h2>
        </div>
      </header>

      {/* Sentence Builder Bar (High Quality AAC experience) */}
      <div className="sentence-bar-container">
        <div className="sentence-bar-display">
          {sentence.length === 0 ? (
            <span className="sentence-placeholder">Pulsa los pictogramas abajo para hablar...</span>
          ) : (
            <div className="sentence-chips">
              <span className="phrase-starter">Quiero:</span>
              {sentence.map((item, idx) => (
                <div key={idx} className="sentence-chip anim-bounce" style={{ backgroundColor: item.color }}>
                  <span className="chip-emoji">{item.emoji}</span>
                  <span className="chip-label">{item.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="sentence-bar-actions">
          <button className="speak-sentence-btn" onClick={handleSpeakSentence} disabled={sentence.length === 0}>
            🗣️ Hablar
          </button>
          <button className="clear-sentence-btn" onClick={handleClearSentence} disabled={sentence.length === 0}>
            ✕ Borrar
          </button>
        </div>
      </div>

      {/* Categories Navigator */}
      <div className="comm-categories">
        {Object.entries(CATEGORIES).map(([key, cat]) => (
          <button
            key={key}
            className={`comm-category-tab ${activeCategory === key ? 'active' : ''}`}
            style={{ '--cat-color': cat.color }}
            onClick={() => setActiveTab(key)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Pictograms Grid */}
      <div className="pictograms-grid">
        {CATEGORIES[activeCategory].items.map((item) => (
          <button
            key={item.label}
            className={`pictogram-card ${pulseItem === item.label ? 'pulse-active' : ''}`}
            style={{ backgroundColor: item.color }}
            onClick={() => handleCardClick(item)}
          >
            <span className="pictogram-emoji">{item.emoji}</span>
            <span className="pictogram-label">{item.label}</span>
          </button>
        ))}
      </div>

      <footer className="game-footer">
        <p className="instruction-text">
          💡 Presiona cualquier tarjeta para escucharla. Puedes juntar hasta 3 tarjetas en la barra superior.
        </p>
      </footer>
    </div>
  );
}
