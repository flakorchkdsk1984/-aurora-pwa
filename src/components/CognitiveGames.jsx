import React, { useState, useEffect } from 'react';
import { speak } from './TTSHelper';
import { saveLog } from '../db';

export default function CognitiveGames({ settings, onBack, onEarnSticker }) {
  const [subGame, setSubGame] = useState('menu'); // 'menu', 'classification', 'memory', 'sequences'
  const [isCelebrated, setIsCelebrated] = useState(false);
  const [celebrationText, setCelebrationText] = useState('');
  
  // Game 1: Classification States
  const [classItem, setClassItem] = useState({ emoji: '', type: '' });
  const [classScore, setClassScore] = useState(0);

  // Game 2: Memory States
  const [cards, setCards] = useState([]);
  const [flippedIndices, setFlippedIndices] = useState([]);
  const [matchedIndices, setMatchedIndices] = useState([]);

  // Game 3: Sequences States
  const [seqItems, setSeqItems] = useState([]);
  const [seqStep, setSeqStep] = useState(0); // Which step are we on?
  const [seqCompleted, setSeqCompleted] = useState([]);

  const startTime = Date.now();

  useEffect(() => {
    if (subGame === 'classification') {
      initClassification();
    } else if (subGame === 'memory') {
      initMemory();
    } else if (subGame === 'sequences') {
      initSequence();
    }
  }, [subGame]);

  const speakHelp = () => {
    if (subGame === 'classification') {
      speak(`¿El ${classItem.name} es un animal o es un vehículo?`, settings.speechRate);
    } else if (subGame === 'memory') {
      speak('Encuentra las parejas de cartas iguales', settings.speechRate);
    } else if (subGame === 'sequences') {
      speak('Presiona en orden los pasos para ordenar la mochila', settings.speechRate);
    }
  };

  const handleGameComplete = async (activityName, message) => {
    setIsCelebrated(true);
    setCelebrationText(message);
    speak(message, settings.speechRate);

    await saveLog({
      module: 'cognitive',
      activity: activityName,
      success: true,
      durationMs: Date.now() - startTime
    });

    if (onEarnSticker) {
      onEarnSticker();
    }

    setTimeout(() => {
      setIsCelebrated(false);
      if (subGame === 'classification') {
        initClassification();
      } else if (subGame === 'memory') {
        initMemory();
      } else if (subGame === 'sequences') {
        initSequence();
      }
    }, 4000);
  };

  // --- 1. CLASSIFICATION ---
  const classificationPool = [
    { emoji: '🐶', type: 'animal', name: 'perrito' },
    { emoji: '🐱', type: 'animal', name: 'gatito' },
    { emoji: '🐮', type: 'animal', name: 'torito' },
    { emoji: '🦁', type: 'animal', name: 'leoncito' },
    { emoji: '🐸', type: 'animal', name: 'sapito' },
    { emoji: '🚗', type: 'vehicle', name: 'auto' },
    { emoji: '🚌', type: 'vehicle', name: 'autobús' },
    { emoji: '🚒', type: 'vehicle', name: 'carro de bomberos' },
    { emoji: '🚂', type: 'vehicle', name: 'tren' },
    { emoji: '✈️', type: 'vehicle', name: 'avión' }
  ];

  const initClassification = () => {
    const item = classificationPool[Math.floor(Math.random() * classificationPool.length)];
    setClassItem(item);
    speak(`¿El ${item.name} es un animal o un vehículo?`, settings.speechRate);
  };

  const handleClassify = (chosenType) => {
    if (isCelebrated) return;
    if (chosenType === classItem.type) {
      setClassScore(s => s + 1);
      handleGameComplete('Clasificación', `¡Excelente! El ${classItem.name} es un ${chosenType === 'animal' ? 'animal' : 'vehículo'}.`);
    } else {
      speak('Inténtalo de nuevo. Piensa si se mueve solo o lo maneja una persona.', settings.speechRate);
    }
  };

  // --- 2. MEMORY GAME (4 Cards - 2 Pairs) ---
  const memoryPool = ['🐶', '🐱', '🦁', '🐵', '🐼', '🐸'];

  const initMemory = () => {
    // Choose 2 random symbols
    const symbols = [];
    while(symbols.length < 2) {
      const sym = memoryPool[Math.floor(Math.random() * memoryPool.length)];
      if(!symbols.includes(sym)) symbols.push(sym);
    }
    // Duplicate and shuffle
    const paired = [...symbols, ...symbols].sort(() => Math.random() - 0.5);
    setCards(paired.map((emoji, index) => ({ id: index, emoji, isFlipped: false })));
    setFlippedIndices([]);
    setMatchedIndices([]);
    speak('Busca los pares. Presiona una carta.', settings.speechRate);
  };

  const handleCardClick = (index) => {
    if (isCelebrated || flippedIndices.includes(index) || matchedIndices.includes(index) || flippedIndices.length >= 2) return;

    const nextFlipped = [...flippedIndices, index];
    setFlippedIndices(nextFlipped);

    speak('Voltear', settings.speechRate);

    if (nextFlipped.length === 2) {
      const firstCard = cards[nextFlipped[0]];
      const secondCard = cards[nextFlipped[1]];

      if (firstCard.emoji === secondCard.emoji) {
        // Match!
        const nextMatched = [...matchedIndices, nextFlipped[0], nextFlipped[1]];
        setMatchedIndices(nextMatched);
        setFlippedIndices([]);

        if (nextMatched.length === cards.length) {
          handleGameComplete('Memoria Visual', '¡Encontraste todos los pares! ¡Qué buena memoria!');
        } else {
          speak('¡Excelente, encontraste un par!', settings.speechRate);
        }
      } else {
        // No match, flip back
        setTimeout(() => {
          setFlippedIndices([]);
        }, 1500);
      }
    }
  };

  // --- 3. SEQUENCES (Backpack prep) ---
  const sequencePool = [
    { step: 1, emoji: '🎒', label: '1. Mochila', voice: 'Primero, la mochila' },
    { step: 2, emoji: '📚', label: '2. Libros', voice: 'Después, los libros' },
    { step: 3, emoji: '✏️', label: '3. Estuche', voice: 'Al final, el estuche' }
  ];

  const initSequence = () => {
    // Shuffle steps visual order
    const shuffled = [...sequencePool].sort(() => Math.random() - 0.5);
    setSeqItems(shuffled);
    setSeqStep(1);
    setSeqCompleted([]);
    speak('Armemos la mochila. ¿Qué se necesita primero?', settings.speechRate);
  };

  const handleSequenceClick = (item) => {
    if (isCelebrated || seqCompleted.includes(item.step)) return;

    if (item.step === seqStep) {
      setSeqCompleted(prev => [...prev, item.step]);
      speak(item.voice, settings.speechRate);
      
      if (seqStep === 3) {
        handleGameComplete('Secuencias', '¡Listo! Mochila armada y lista para la escuela.');
      } else {
        setSeqStep(step => step + 1);
      }
    } else {
      speak('Ese no es el paso correcto. Recuerda lo que va antes.', settings.speechRate);
    }
  };

  return (
    <div className={`game-container module-cognitive ${settings.overloadReduction ? 'overload-safe' : ''}`}>
      <header className="game-header">
        {subGame === 'menu' ? (
          <button className="back-btn" onClick={onBack}>🏠 Inicio</button>
        ) : (
          <button className="back-btn" onClick={() => setSubGame('menu')}>⬅️ Salir al Menú</button>
        )}
        <div className="title-area">
          <h2>Juegos Cognitivos</h2>
        </div>
      </header>

      {subGame === 'menu' && (
        <div className="games-menu-grid">
          <button className="menu-game-card classification-card" onClick={() => setSubGame('classification')}>
            <span className="game-card-icon">🦁 / 🚗</span>
            <h3>Clasificar Categorías</h3>
            <p>Separar animales de vehículos</p>
          </button>

          <button className="menu-game-card memory-card" onClick={() => setSubGame('memory')}>
            <span className="game-card-icon">🎴</span>
            <h3>Memoria Visual</h3>
            <p>Emparejar 4 cartas (2 pares)</p>
          </button>

          <button className="menu-game-card sequences-card" onClick={() => setSubGame('sequences')}>
            <span className="game-card-icon">🎒 ➡️ 📚</span>
            <h3>Secuencia Lógica</h3>
            <p>Aprender los pasos para armar la mochila</p>
          </button>
        </div>
      )}

      {subGame !== 'menu' && (
        <div className="cognitive-game-workspace">
          {isCelebrated && (
            <div className="celebration-overlay">
              <div className="reward-emojis">🎉 🏆 🌟 🐱</div>
              <div className="celebration-msg">{celebrationText}</div>
            </div>
          )}

          {/* 1. CLASSIFICATION VIEW */}
          {subGame === 'classification' && !isCelebrated && (
            <div className="classification-game-layout">
              <div className="classify-center-zone">
                <div className="classify-target-emoji anim-bounce">
                  {classItem.emoji}
                </div>
                <div className="classify-target-label">{classItem.name}</div>
              </div>

              <div className="classify-options-row">
                <button className="classify-bucket-btn animal-bucket" onClick={() => handleClassify('animal')}>
                  🦁 Animales
                </button>
                <button className="classify-bucket-btn vehicle-bucket" onClick={() => handleClassify('vehicle')}>
                  🚗 Vehículos
                </button>
              </div>
            </div>
          )}

          {/* 2. MEMORY VIEW */}
          {subGame === 'memory' && !isCelebrated && (
            <div className="memory-game-layout">
              <div className="memory-cards-grid">
                {cards.map((card, idx) => {
                  const isFlipped = flippedIndices.includes(idx) || matchedIndices.includes(idx);
                  return (
                    <button
                      key={card.id}
                      className={`memory-card-element ${isFlipped ? 'flipped' : ''}`}
                      onClick={() => handleCardClick(idx)}
                    >
                      <div className="card-face card-back">❓</div>
                      <div className="card-face card-front">{card.emoji}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. SEQUENCES VIEW */}
          {subGame === 'sequences' && !isCelebrated && (
            <div className="sequences-game-layout">
              <div className="sequence-slots-row">
                <div className={`sequence-slot ${seqStep > 1 ? 'filled' : 'active'}`}>
                  {seqCompleted.includes(1) ? '🎒' : '1'}
                </div>
                <div className="sequence-slot-arrow">➡️</div>
                <div className={`sequence-slot ${seqStep > 2 ? 'filled' : seqStep === 2 ? 'active' : 'locked'}`}>
                  {seqCompleted.includes(2) ? '📚' : '2'}
                </div>
                <div className="sequence-slot-arrow">➡️</div>
                <div className={`sequence-slot ${seqStep > 3 ? 'filled' : seqStep === 3 ? 'active' : 'locked'}`}>
                  {seqCompleted.includes(3) ? '✏️' : '3'}
                </div>
              </div>

              <p className="sequence-instruction">Presiona el siguiente objeto para guardar:</p>

              <div className="sequence-items-options">
                {seqItems.map((item) => {
                  const isDone = seqCompleted.includes(item.step);
                  return (
                    <button
                      key={item.step}
                      className={`sequence-item-btn ${isDone ? 'done' : ''}`}
                      onClick={() => handleSequenceClick(item)}
                      disabled={isDone}
                    >
                      <span className="seq-emoji">{item.emoji}</span>
                      <span className="seq-lbl">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {subGame !== 'menu' && (
        <footer className="game-footer">
          <button className="audio-repeat-btn" onClick={speakHelp}>
            🔊 ¿Qué tengo que hacer?
          </button>
        </footer>
      )}
    </div>
  );
}
