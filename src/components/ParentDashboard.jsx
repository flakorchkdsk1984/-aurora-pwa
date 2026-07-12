import React, { useState, useEffect } from 'react';
import { getLogs, clearAllLogs, getSetting, saveSetting } from '../db';

export default function ParentDashboard({ onClose, onSettingsChange }) {
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('summary');
  const [autoAdapt, setAutoAdapt] = useState(true);
  const [speechRate, setSpeechRate] = useState(0.85);
  const [overloadReduction, setOverloadReduction] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    loadLogsAndSettings();
  }, []);

  const loadLogsAndSettings = async () => {
    try {
      const dbLogs = await getLogs();
      setLogs(dbLogs.reverse()); // Show newest first
      
      const savedAutoAdapt = await getSetting('autoAdapt', true);
      const savedSpeechRate = await getSetting('speechRate', 0.85);
      const savedOverload = await getSetting('overloadReduction', false);

      setAutoAdapt(savedAutoAdapt);
      setSpeechRate(savedSpeechRate);
      setOverloadReduction(savedOverload);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveSettings = async () => {
    try {
      await saveSetting('autoAdapt', autoAdapt);
      await saveSetting('speechRate', speechRate);
      await saveSetting('overloadReduction', overloadReduction);
      
      onSettingsChange({
        autoAdapt,
        speechRate,
        overloadReduction
      });

      setStatusMessage('¡Configuración guardada con éxito!');
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (e) {
      console.error(e);
      setStatusMessage('Error al guardar configuración.');
    }
  };

  const handleClearLogs = async () => {
    if (window.confirm('¿Estás seguro de que deseas restablecer todo el progreso de Aurora? Esta acción no se puede deshacer.')) {
      try {
        await clearAllLogs();
        setLogs([]);
        setStatusMessage('Progreso restablecido correctamente.');
        setTimeout(() => setStatusMessage(''), 3000);
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Metrics computation
  const getMetrics = () => {
    const totalSessions = logs.length;
    if (totalSessions === 0) {
      return {
        mouseProgress: 0,
        commCount: 0,
        routinesProgress: 0,
        cognitiveProgress: 0,
        prevocationalProgress: 0,
        avgAccuracy: 0,
        favorites: 'Ninguna aún'
      };
    }

    const modules = {
      mouse: logs.filter(l => l.module === 'mouse'),
      comm: logs.filter(l => l.module === 'communication'),
      routines: logs.filter(l => l.module === 'routines'),
      cognitive: logs.filter(l => l.module === 'cognitive'),
      prevocational: logs.filter(l => l.module === 'prevocational')
    };

    // Calculate averages & rates
    const getSuccessRate = (arr) => {
      if (arr.length === 0) return 0;
      const successCount = arr.filter(l => l.success).length;
      return Math.round((successCount / arr.length) * 100);
    };

    // Favorites finder
    const counts = {};
    logs.forEach(l => {
      counts[l.activity] = (counts[l.activity] || 0) + 1;
    });
    let favoriteAct = 'Ninguna aún';
    let maxCount = 0;
    Object.entries(counts).forEach(([act, count]) => {
      if (count > maxCount) {
        maxCount = count;
        favoriteAct = act;
      }
    });

    const allSuccessCount = logs.filter(l => l.success).length;
    const avgAccuracy = Math.round((allSuccessCount / totalSessions) * 100);

    return {
      mouseProgress: getSuccessRate(modules.mouse) || (modules.mouse.length > 0 ? 50 : 0),
      commCount: modules.comm.length,
      routinesProgress: getSuccessRate(modules.routines) || (modules.routines.length > 0 ? 50 : 0),
      cognitiveProgress: getSuccessRate(modules.cognitive) || (modules.cognitive.length > 0 ? 50 : 0),
      prevocationalProgress: getSuccessRate(modules.prevocational) || (modules.prevocational.length > 0 ? 50 : 0),
      avgAccuracy,
      favoriteAct,
      totalSessions,
      moduleCounts: {
        mouse: modules.mouse.length,
        comm: modules.comm.length,
        routines: modules.routines.length,
        cognitive: modules.cognitive.length,
        prevocational: modules.prevocational.length
      }
    };
  };

  const metrics = getMetrics();

  // Export session data
  const exportToCSV = () => {
    if (logs.length === 0) return;
    const headers = 'Fecha,Modulo,Actividad,Nivel,Exitoso,Errores,Ayudas,Tiempo(ms)\n';
    const rows = logs.map(l => 
      `"${new Date(l.timestamp).toLocaleDateString()}",` +
      `"${l.module}",` +
      `"${l.activity}",` +
      `"${l.level || ''}",` +
      `"${l.success ? 'Sí' : 'No'}",` +
      `"${l.errorCount || 0}",` +
      `"${l.helpsCount || 0}",` +
      `"${l.durationMs || 0}"`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `progreso_aurora_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="logo-section">
          <span className="logo-emoji">📈</span>
          <div>
            <h1>Panel de Control</h1>
            <p>Seguimiento de habilidades de Aurora</p>
          </div>
        </div>
        <button className="back-to-app-btn" onClick={onClose}>
          ⬅️ Volver a la App
        </button>
      </header>

      <div className="dashboard-content">
        <aside className="dashboard-sidebar">
          <button 
            className={`sidebar-tab ${activeTab === 'summary' ? 'active' : ''}`}
            onClick={() => setActiveTab('summary')}
          >
            📊 Resumen de Avance
          </button>
          <button 
            className={`sidebar-tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            🕒 Historial Detallado
          </button>
          <button 
            className={`sidebar-tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            ⚙️ Ajustes del Sistema
          </button>
        </aside>

        <main className="dashboard-main-area">
          {statusMessage && <div className="status-banner">{statusMessage}</div>}

          {activeTab === 'summary' && (
            <div className="summary-tab-content">
              <h2>Monitoreo General del Desarrollo</h2>
              
              <div className="metrics-cards-grid">
                <div className="metric-card">
                  <h3>Sesiones Totales</h3>
                  <div className="metric-value">{metrics.totalSessions || 0}</div>
                  <p>Prácticas completadas</p>
                </div>
                <div className="metric-card">
                  <h3>Precisión Global</h3>
                  <div className="metric-value">{metrics.avgAccuracy}%</div>
                  <p>Tasa de acierto directo</p>
                </div>
                <div className="metric-card">
                  <h3>Actividad Favorita</h3>
                  <div className="metric-value favorite-value">{metrics.favoriteAct}</div>
                  <p>Más practicada por Aurora</p>
                </div>
              </div>

              <div className="dashboard-section-card">
                <h3>Progreso Estimado por Área</h3>
                <div className="progress-bars-container">
                  <div className="progress-row">
                    <span className="progress-label">🖱️ Control de Mouse</span>
                    <div className="progress-bar-outer">
                      <div className="progress-bar-inner" style={{ width: `${metrics.mouseProgress}%` }}></div>
                    </div>
                    <span className="progress-percentage">{metrics.mouseProgress}%</span>
                  </div>

                  <div className="progress-row">
                    <span className="progress-label">💬 Comunicación</span>
                    <div className="progress-bar-outer">
                      <div className="progress-bar-inner" style={{ width: `${metrics.commCount > 0 ? Math.min(100, metrics.commCount * 10) : 0}%`, backgroundColor: '#ffb703' }}></div>
                    </div>
                    <span className="progress-percentage">{metrics.commCount > 0 ? Math.min(100, metrics.commCount * 10) : 0}%</span>
                  </div>

                  <div className="progress-row">
                    <span className="progress-label">📅 Rutinas Diarias</span>
                    <div className="progress-bar-outer">
                      <div className="progress-bar-inner" style={{ width: `${metrics.routinesProgress}%`, backgroundColor: '#fb8500' }}></div>
                    </div>
                    <span className="progress-percentage">{metrics.routinesProgress}%</span>
                  </div>

                  <div className="progress-row">
                    <span className="progress-label">🧠 Juegos Cognitivos</span>
                    <div className="progress-bar-outer">
                      <div className="progress-bar-inner" style={{ width: `${metrics.cognitiveProgress}%`, backgroundColor: '#4361ee' }}></div>
                    </div>
                    <span className="progress-percentage">{metrics.cognitiveProgress}%</span>
                  </div>

                  <div className="progress-row">
                    <span className="progress-label">💼 Tareas Prelaborales</span>
                    <div className="progress-bar-outer">
                      <div className="progress-bar-inner" style={{ width: `${metrics.prevocationalProgress}%`, backgroundColor: '#7209b7' }}></div>
                    </div>
                    <span className="progress-percentage">{metrics.prevocationalProgress}%</span>
                  </div>
                </div>
              </div>

              <div className="dashboard-section-card">
                <h3>Análisis de Actividad (Distribución)</h3>
                {logs.length > 0 ? (
                  <div className="chart-wrapper">
                    <svg viewBox="0 0 400 200" className="simple-svg-bar-chart">
                      {/* Bar graph representing module usage count */}
                      <g transform="translate(40, 20)">
                        {/* Grid lines */}
                        <line x1="0" y1="0" x2="320" y2="0" stroke="#eee" />
                        <line x1="0" y1="50" x2="320" y2="50" stroke="#eee" />
                        <line x1="0" y1="100" x2="320" y2="100" stroke="#eee" />
                        <line x1="0" y1="150" x2="320" y2="150" stroke="#eee" />

                        {/* Bars */}
                        {Object.entries(metrics.moduleCounts).map(([mod, count], index) => {
                          const maxCount = Math.max(...Object.values(metrics.moduleCounts), 1);
                          const barHeight = (count / maxCount) * 150;
                          const barWidth = 40;
                          const xPos = index * 60 + 20;
                          const yPos = 150 - barHeight;

                          const colors = ['#8ecae6', '#ffb703', '#fb8500', '#4361ee', '#7209b7'];
                          const labels = ['Mouse', 'Com.', 'Rutinas', 'Cogn.', 'Prelab.'];

                          return (
                            <g key={mod}>
                              <rect 
                                x={xPos} 
                                y={yPos} 
                                width={barWidth} 
                                height={barHeight} 
                                fill={colors[index]} 
                                rx="4"
                              />
                              <text x={xPos + barWidth / 2} y="170" textAnchor="middle" fontSize="10" fill="#666">
                                {labels[index]}
                              </text>
                              <text x={xPos + barWidth / 2} y={yPos - 5} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#333">
                                {count}
                              </text>
                            </g>
                          );
                        })}
                        {/* Base Line */}
                        <line x1="0" y1="150" x2="320" y2="150" stroke="#ccc" strokeWidth="2" />
                      </g>
                    </svg>
                  </div>
                ) : (
                  <p className="no-data">No hay suficientes datos de juego para mostrar el gráfico. Realiza algunas actividades para registrar logs.</p>
                )}
              </div>

              <div className="dashboard-section-card recommendations">
                <h3>💡 Recomendaciones de Aurora Assistant</h3>
                <div className="recommendations-box">
                  {logs.length === 0 ? (
                    <p>Comienza a jugar con Aurora para que la IA genere recomendaciones personalizadas basadas en su ritmo.</p>
                  ) : (
                    <ul>
                      {metrics.mouseProgress < 50 && (
                        <li>⚠️ El control de mouse presenta dificultades. Practiquen el <strong>Nivel 1 ("Busca la estrella")</strong> para mejorar la coordinación mano-ojo.</li>
                      )}
                      {metrics.mouseProgress >= 80 && metrics.moduleCounts.mouse > 5 && (
                        <li>🌟 ¡Aurora domina muy bien el cursor del mouse! Se recomienda pasar al <strong>Módulo 4: Secuencias</strong> y <strong>Clasificación</strong> para expandir habilidades cognitivas.</li>
                      )}
                      {metrics.commCount < 5 && (
                        <li>💬 Se sugiere motivar a Aurora a utilizar el <strong>Módulo de Comunicación Visual</strong> de forma regular en el día a día para expresar necesidades.</li>
                      )}
                      {metrics.routinesProgress > 70 && (
                        <li>📅 Las rutinas "Primero/Después" muestran alta tasa de finalización. Agrega una nueva rutina diaria en su vida real para fomentar más autonomía.</li>
                      )}
                      <li>📈 Continúen reforzando el aprendizaje adaptativo. El sistema está reduciendo la velocidad/dificultad automáticamente si detecta fatiga.</li>
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="history-tab-content">
              <div className="history-header-actions">
                <h2>Historial de Actividades Registradas</h2>
                <div className="action-buttons">
                  <button className="export-btn" onClick={exportToCSV} disabled={logs.length === 0}>
                    📥 Exportar CSV
                  </button>
                  <button className="clear-btn" onClick={handleClearLogs} disabled={logs.length === 0}>
                    🗑️ Restablecer Historial
                  </button>
                </div>
              </div>

              {logs.length === 0 ? (
                <div className="no-data-card">
                  <p>Aún no hay actividades guardadas.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="logs-table">
                    <thead>
                      <tr>
                        <th>Fecha y Hora</th>
                        <th>Módulo</th>
                        <th>Actividad</th>
                        <th>Nivel / Dificultad</th>
                        <th>Resultado</th>
                        <th>Errores</th>
                        <th>Ayudas</th>
                        <th>Tiempo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => (
                        <tr key={log.id}>
                          <td>{new Date(log.timestamp).toLocaleString('es-CL')}</td>
                          <td>
                            <span className={`badge badge-${log.module}`}>
                              {log.module}
                            </span>
                          </td>
                          <td>{log.activity}</td>
                          <td>{log.level || 'Único'}</td>
                          <td>
                            <span className={`result-indicator ${log.success ? 'success' : 'fail'}`}>
                              {log.success ? '✅ Completado' : '❌ Inconcluso'}
                            </span>
                          </td>
                          <td>{log.errorCount || 0}</td>
                          <td>{log.helpsCount || 0}</td>
                          <td>{((log.durationMs || 0) / 1000).toFixed(1)}s</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="settings-tab-content">
              <h2>Configuración y Ajustes de Adaptación</h2>
              <p className="settings-intro">Modifica el comportamiento global de la app para que se ajuste exactamente al ritmo y capacidades sensoriales de Aurora.</p>

              <div className="settings-card-group">
                <h3>🧠 Inteligencia Artificial Adaptativa</h3>
                <div className="setting-row">
                  <div className="setting-description">
                    <label htmlFor="auto-adapt">Ajuste automático de dificultad</label>
                    <p>Permite al Aurora Assistant aumentar o reducir la dificultad de las actividades dependiendo de los aciertos y errores consecutivos.</p>
                  </div>
                  <label className="toggle-switch">
                    <input 
                      id="auto-adapt"
                      type="checkbox" 
                      checked={autoAdapt}
                      onChange={(e) => setAutoAdapt(e.target.checked)}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>
              </div>

              <div className="settings-card-group">
                <h3>🗣️ Voz y Sintetizador (TTS)</h3>
                <div className="setting-row">
                  <div className="setting-description">
                    <label htmlFor="speech-rate">Velocidad del habla (Spanish TTS): {speechRate.toFixed(2)}x</label>
                    <p>Ajusta el ritmo de la locución en pictogramas e instrucciones para facilitar el procesamiento auditivo.</p>
                  </div>
                  <input 
                    id="speech-rate"
                    type="range" 
                    min="0.5" 
                    max="1.2" 
                    step="0.05"
                    value={speechRate}
                    onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                    className="slider-range"
                  />
                </div>
              </div>

              <div className="settings-card-group">
                <h3>🎨 Preferencias de Estímulo Sensorial</h3>
                <div className="setting-row">
                  <div className="setting-description">
                    <label htmlFor="overload-reduction">Modo Reducción de Sobrecarga Visual</label>
                    <p>Desactiva animaciones de fondo, destellos de estrellas y partículas de celebración para evitar sobreestimulación sensorial.</p>
                  </div>
                  <label className="toggle-switch">
                    <input 
                      id="overload-reduction"
                      type="checkbox" 
                      checked={overloadReduction}
                      onChange={(e) => setOverloadReduction(e.target.checked)}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>
              </div>

              <div className="settings-actions">
                <button className="save-settings-btn" onClick={handleSaveSettings}>
                  💾 Guardar Cambios
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
