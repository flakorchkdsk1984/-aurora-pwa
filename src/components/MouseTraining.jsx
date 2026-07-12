import React, { useState, useEffect, useRef } from 'react';
import { speak } from './TTSHelper';
import { saveLog } from '../db';

export default function MouseTraining({ settings, onBack, onEarnSticker }) {
  const [level, setLevel] = useState(1);
  const [starPosition, setStarPosition] = useState({ top: '50%', left: '50%' });
  const [currentAnimal, setCurrentAnimal] = useState({ emoji: '🐶', name: 'perrito' });
  const [animalPosition, setAnimalPosition] = useState({ top: '50%', left: '50%' });
  const [fruit, setFruit] = useState({ emoji: '🍎', name: 'manzana' });
  const [isCelebrated, setIsCelebrated] = useState(false);
  const [celebrationText, setCelebrationText] = useState('');
  
  // Game states & metrics tracking
  const [score, setScore] = useState(0);
  const [consecutiveHits, setConsecutiveHits] = useState(0);
  const [consecutiveMisses, setConsecutiveMisses] = useState(0);
  const [helpsCount, setHelpsCount] = useState(0);
  const [showHelper, setShowHelper] = useState(false);
  
  const startTime = useRef(Date.now());
  const errorCount = useRef(0);
  const containerRef = useRef(null);

  // Level setup/change
  useEffect(() => {
    resetActivity();
    speakInstructions();
  }, [level]);

  // Periodic check for slow response (triggers helper arrow/size increase)
  useEffect(() => {
    const timer = setInterval(() => {
      const duration = (Date.now() - startTime.current) / 1000;
      if (duration > 10 && !isCelebrated) {
        // Show visual prompt/helper if taking more than 10 seconds
        setShowHelper(true);
        setHelpsCount(prev => prev + 1);
        speakPrompt();
      }
    }, 10000);

    return () => clearInterval(timer);
  }, [level, isCelebrated, starPosition, animalPosition]);

  const speakInstructions = () => {
    if (level === 1) {
      speak('Mueve la manito para buscar la estrella', settings.speechRate);
    } else if (level === 2) {
      speak(`Presiona el ${currentAnimal.name}`, settings.speechRate);
    } else if (level === 3) {
      speak(`Lleva la ${fruit.name} dentro de la caja`, settings.speechRate);
    }
  };

  const speakPrompt = () => {
    if (level === 1) {
      speak('Busca la estrella brillante en la pantalla', settings.speechRate);
    } else if (level === 2) {
      speak(`¿Dónde está el ${currentAnimal.name}? Presiónalo`, settings.speechRate);
    } else if (level === 3) {
      speak(`Arrastra la ${fruit.name} hacia la caja marrón`, settings.speechRate);
    }
  };

  const resetActivity = () => {
    startTime.current = Date.now();
    errorCount.current = 0;
    setShowHelper(false);
    setIsCelebrated(false);

    if (level === 1) {
      // Random coordinates between 15% and 85% to ensure it fits screen
      const top = `${Math.floor(Math.random() * 60) + 20}%`;
      const left = `${Math.floor(Math.random() * 70) + 15}%`;
      setStarPosition({ top, left });
    } else if (level === 2) {
      const animals = [
        { emoji: '🐶', name: 'perrito', sound: 'guau guau' },
        { emoji: '🐱', name: 'gatito', sound: 'miau miau' },
        { emoji: '🦁', name: 'leoncito', sound: 'grr grr' },
        { emoji: '🐮', name: 'torito', sound: 'muu muu' },
        { emoji: '🐷', name: 'chanchito', sound: 'oink oink' },
        { emoji: '🐸', name: 'sapito', sound: 'croac croac' }
      ];
      const randomAnimal = animals[Math.floor(Math.random() * animals.length)];
      setCurrentAnimal(randomAnimal);

      const top = `${Math.floor(Math.random() * 60) + 20}%`;
      const left = `${Math.floor(Math.random() * 70) + 15}%`;
      setAnimalPosition({ top, left });
    } else if (level === 3) {
      const fruits = [
        { emoji: '🍎', name: 'manzana' },
        { emoji: '🍌', name: 'plátano' },
        { emoji: '🍓', name: 'frutilla' },
        { emoji: '🍊', name: 'naranja' },
        { emoji: '🍇', name: 'uva' }
      ];
      setFruit(fruits[Math.floor(Math.random() * fruits.length)]);
    }
  };

  // Adaptive difficulty logic
  const handleScore = async (success) => {
    const duration = Date.now() - startTime.current;
    
    // Log performance metrics to DB
    await saveLog({
      module: 'mouse',
      activity: level === 1 ? 'Busca estrella' : level === 2 ? 'Presiona animal' : 'Arrastrar fruta',
      level: `Nivel ${level}`,
      success,
      errorCount: errorCount.current,
      helpsCount,
      durationMs: duration
    });

    if (success) {
      setConsecutiveHits(h => {
        const next = h + 1;
        // AI logic: If 10 consecutive hits and not on max level, propose to level up
        if (settings.autoAdapt && next >= 10 && level < 3) {
          setTimeout(() => {
            speak('¡Lo estás haciendo genial! Subamos de nivel.', settings.speechRate);
            setLevel(l => l + 1);
          }, 2000);
          return 0;
        }
        return next;
      });
      setConsecutiveMisses(0);
    } else {
      setConsecutiveMisses(m => {
        const next = m + 1;
        // AI logic: If 5 consecutive fails, reduce level
        if (settings.autoAdapt && next >= 5 && level > 1) {
          setTimeout(() => {
            speak('Hagamos una actividad más sencilla.', settings.speechRate);
            setLevel(l => l - 1);
          }, 2000);
          return 0;
        }
        return next;
      });
      setConsecutiveHits(0);
    }
  };

  const handleLevelComplete = (soundMsg, speechMsg) => {
    setIsCelebrated(true);
    setCelebrationText(speechMsg);
    
    if (soundMsg) {
      speak(soundMsg, settings.speechRate, 1.2);
    }
    
    setTimeout(() => {
      speak(speechMsg, settings.speechRate, 1.1);
    }, 1200);

    handleScore(true);

    if (onEarnSticker) {
      onEarnSticker();
    }

    setTimeout(() => {
      resetActivity();
    }, 4000);
  };

  const handleStarHover = () => {
    if (isCelebrated) return;
    handleLevelComplete('¡Bling!', '¡Excelente! Encontraste la estrella.');
  };

  const handleAnimalClick = () => {
    if (isCelebrated) return;
    handleLevelComplete(currentAnimal.sound, `¡Genial! Hiciste click en el ${currentAnimal.name}.`);
  };

  const handleMissClick = (e) => {
    // Check if user clicked on background instead of target
    if (e.target.classList.contains('training-area') && !isCelebrated) {
      errorCount.current += 1;
      // Alert feedback
      speak('Inténtalo de nuevo', settings.speechRate);
    }
  };

  // Drag and Drop using custom pointer tracking (great for tablets)
  const fruitRef = useRef(null);
  const boxRef = useRef(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [fruitOffset, setFruitOffset] = useState({ x: 0, y: 0 });

  const onPointerDown = (e) => {
    if (isCelebrated) return;
    e.preventDefault();
    const rect = fruitRef.current.getBoundingClientRect();
    setIsDragging(true);
    setFruitOffset({
      x: e.clientX - rect.left - rect.width / 2,
      y: e.clientY - rect.top - rect.height / 2
    });
  };

  const onPointerMove = (e) => {
    if (!isDragging || isCelebrated) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - containerRect.left - fruitOffset.x;
    const y = e.clientY - containerRect.top - fruitOffset.y;

    // Check collision with the box
    const boxRect = boxRef.current.getBoundingClientRect();
    const fruitRect = fruitRef.current.getBoundingClientRect();

    const isColliding = !(
      fruitRect.right < boxRect.left ||
      fruitRect.left > boxRect.right ||
      fruitRect.bottom < boxRect.top ||
      fruitRect.top > boxRect.bottom
    );

    if (isColliding) {
      setIsDragging(false);
      handleLevelComplete('¡Plop!', `¡Maravilloso! Pusiste la ${fruit.name} en la caja.`);
      setDragPos({ x: 0, y: 0 });
    } else {
      setDragPos({ x, y });
    }
  };

  const onPointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    // Reset position if dropped outside box
    setDragPos({ x: 0, y: 0 });
    errorCount.current += 1;
  };

  return (
    <div className={`game-container module-mouse ${settings.overloadReduction ? 'overload-safe' : ''}`}>
      <header className="game-header">
        <button className="back-btn" onClick={onBack}>🏠 Inicio</button>
        <div className="title-area">
          <h2>Entrenamiento de Mouse</h2>
          <div className="level-indicators">
            <button className={`lvl-tab ${level === 1 ? 'active' : ''}`} onClick={() => setLevel(1)}>Nivel 1</button>
            <button className={`lvl-tab ${level === 2 ? 'active' : ''}`} onClick={() => setLevel(2)}>Nivel 2</button>
            <button className={`lvl-tab ${level === 3 ? 'active' : ''}`} onClick={() => setLevel(3)}>Nivel 3</button>
          </div>
        </div>
        <div className="consecutive-counter">
          ⭐ Aciertos: {consecutiveHits}/10
        </div>
      </header>

      <div 
        className="training-area" 
        onClick={handleMissClick}
        ref={containerRef}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {isCelebrated && (
          <div className="celebration-overlay">
            <div className="reward-emojis">🎉 🌟 👏 🏆</div>
            <div className="celebration-msg">{celebrationText}</div>
          </div>
        )}

        {level === 1 && !isCelebrated && (
          <div 
            className={`target-star ${showHelper ? 'target-helper' : ''}`}
            style={{ 
              top: starPosition.top, 
              left: starPosition.left,
              transform: showHelper ? 'translate(-50%, -50%) scale(1.5)' : 'translate(-50%, -50%)' 
            }}
            onMouseEnter={handleStarHover}
            onTouchStart={handleStarHover}
          >
            ⭐
            {showHelper && <div className="blink-arrow">👈 ¡Aquí!</div>}
          </div>
        )}

        {level === 2 && !isCelebrated && (
          <div 
            className={`target-animal ${showHelper ? 'target-helper' : ''}`}
            style={{ 
              top: animalPosition.top, 
              left: animalPosition.left,
              transform: showHelper ? 'translate(-50%, -50%) scale(1.5)' : 'translate(-50%, -50%)' 
            }}
            onClick={handleAnimalClick}
          >
            {currentAnimal.emoji}
            {showHelper && <div className="blink-arrow">👈 Haz Click</div>}
          </div>
        )}

        {level === 3 && !isCelebrated && (
          <div className="drag-activity-layout">
            <div 
              ref={fruitRef}
              className={`drag-item ${isDragging ? 'dragging' : ''} ${showHelper ? 'target-helper' : ''}`}
              style={{
                transform: `translate(${dragPos.x}px, ${dragPos.y}px) ${showHelper ? 'scale(1.3)' : ''}`,
                touchAction: 'none'
              }}
              onPointerDown={onPointerDown}
            >
              {fruit.emoji}
              <div className="drag-item-label">{fruit.name}</div>
            </div>

            <div className="arrow-flow-indicator">
              <span>➡️</span>
              <span>➡️</span>
              <span>➡️</span>
            </div>

            <div 
              ref={boxRef}
              className="drop-target-box"
            >
              📦
              <div className="drop-box-label">Caja</div>
            </div>
          </div>
        )}
      </div>

      <footer className="game-footer">
        <p className="instruction-text">
          {level === 1 && "💡 Pasa la flecha del mouse por encima de la estrella."}
          {level === 2 && `💡 Presiona (haz click) en el ${currentAnimal.name}.`}
          {level === 3 && `💡 Mantén presionado y arrastra la ${fruit.name} hasta la caja.`}
        </p>
        <button className="audio-repeat-btn" onClick={speakInstructions}>
          🔊 Escuchar instrucción de nuevo
        </button>
      </footer>
    </div>
  );
}
