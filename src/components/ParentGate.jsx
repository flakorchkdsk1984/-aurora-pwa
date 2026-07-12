import React, { useState, useEffect } from 'react';

export default function ParentGate({ onSuccess, onCancel }) {
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    // Generate simple addition that requires basic reading/math
    setNum1(Math.floor(Math.random() * 8) + 2);
    setNum2(Math.floor(Math.random() * 7) + 2);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const parsedAnswer = parseInt(answer, 10);
    if (parsedAnswer === num1 + num2) {
      onSuccess();
    } else {
      setError(true);
      setAnswer('');
      // Reset error message after a short delay
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="parent-gate-overlay">
      <div className="parent-gate-card">
        <button className="close-btn" onClick={onCancel}>✕</button>
        <div className="gate-header">
          <span className="gate-icon">🔒</span>
          <h2>Control Parental</h2>
          <p>Esta sección es solo para padres o terapeutas.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="gate-form">
          <label htmlFor="math-problem">
            Por favor resuelve la siguiente operación para ingresar:
          </label>
          <div className="math-question">
            <span>{num1}</span>
            <span>+</span>
            <span>{num2}</span>
            <span>=</span>
            <input
              id="math-problem"
              type="number"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="?"
              autoFocus
              required
            />
          </div>
          
          {error && <p className="gate-error">Respuesta incorrecta. Inténtalo de nuevo.</p>}
          
          <button type="submit" className="gate-submit-btn">
            Verificar e Ingresar
          </button>
        </form>
      </div>
    </div>
  );
}
