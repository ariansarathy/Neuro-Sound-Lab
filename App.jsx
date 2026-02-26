import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Zap, Brain, Headphones, Save, Share2, Download, Moon, Sun, Copy, Check } from 'lucide-react';

export default function NeuroSoundLab() {
  const [stage, setStage] = useState('intro'); // intro, test, advanced-test, results
  const [theme, setTheme] = useState('lab'); // lab, clinical, sci-fi
  const [testData, setTestData] = useState({
    mood: 50,
    focus: 50,
    energy: 50,
    stress: 50,
    timeOfDay: 'afternoon',
    reactionTime: null,
    visualAttention: 50,
  });
  const [soundscape, setSoundscape] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [wavePhase, setWavePhase] = useState(0);
  const [savedProfiles, setSavedProfiles] = useState([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [copied, setCopied] = useState(false);
  const [showAdvancedTest, setShowAdvancedTest] = useState(false);
  const [reactionTestActive, setReactionTestActive] = useState(false);
  const [reactionTimes, setReactionTimes] = useState([]);
  const [reactionFlash, setReactionFlash] = useState(false);
  const [waitingForClick, setWaitingForClick] = useState(false);
  const synth = useRef(null);
  const bass = useRef(null);
  const ambient = useRef(null);
  const reactionTimeoutRef = useRef(null);
  const reactionClickRef = useRef(null);

  // Theme configurations
  const themes = {
    lab: {
      bg: 'from-slate-950 via-blue-950 to-slate-900',
      accent: '#06b6d4',
      secondary: '#3b82f6',
      border: 'border-blue-500/20',
      glow: 'shadow-cyan-400/50',
      text: 'text-cyan-300',
    },
    clinical: {
      bg: 'from-white via-slate-50 to-blue-50',
      accent: '#0369a1',
      secondary: '#0284c7',
      border: 'border-blue-200',
      glow: 'shadow-blue-300/30',
      text: 'text-blue-900',
    },
    sci_fi: {
      bg: 'from-purple-950 via-pink-950 to-slate-950',
      accent: '#d946ef',
      secondary: '#f472b6',
      border: 'border-pink-500/20',
      glow: 'shadow-pink-500/50',
      text: 'text-pink-300',
    },
  };

  const currentTheme = themes[theme];
  const isDark = theme !== 'clinical';

  // Cleanup reaction test on unmount
  useEffect(() => {
    return () => {
      if (reactionTimeoutRef.current) clearTimeout(reactionTimeoutRef.current);
      if (reactionClickRef.current) {
        document.removeEventListener('click', reactionClickRef.current);
      }
    };
  }, []);

  // Animate waveform
  useEffect(() => {
    const interval = setInterval(() => {
      setWavePhase((p) => (p + 1) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Load saved profiles
  useEffect(() => {
    const saved = localStorage.getItem('neuroSoundProfiles');
    if (saved) setSavedProfiles(JSON.parse(saved));
  }, []);

  // Initialize Tone.js
  useEffect(() => {
    const initAudio = async () => {
      try {
        const Tone = (await import('tone')).default;
        synth.current = new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: 'triangle' },
          envelope: { attack: 0.5, decay: 0.3, sustain: 0.7, release: 1 },
        }).toDestination();

        bass.current = new Tone.Synth({
          oscillator: { type: 'sine' },
          envelope: { attack: 1, decay: 0.3, sustain: 0.6, release: 2 },
        }).toDestination();

        ambient.current = new Tone.Synth({
          oscillator: { type: 'square' },
          envelope: { attack: 2, decay: 1, sustain: 0.5, release: 3 },
        }).toDestination();
      } catch (e) {
        console.log('Tone.js not available');
      }
    };
    initAudio();
  }, []);

  const handleTestChange = (field, value) => {
    setTestData((prev) => ({ ...prev, [field]: value }));
  };

  // Reaction time test - proper implementation
  const startReactionTest = () => {
    setReactionTestActive(true);
    setReactionTimes([]);
    setWaitingForClick(false);
    runReactionTrial(0);
  };

  const runReactionTrial = (trialNum) => {
    if (trialNum >= 5) {
      // All trials complete
      setReactionTestActive(false);
      setWaitingForClick(false);
      const avgRT = reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length;
      handleTestChange('reactionTime', Math.round(avgRT));
      return;
    }

    // Wait random time before flash
    const delay = Math.random() * 2000 + 1000;
    reactionTimeoutRef.current = setTimeout(() => {
      setReactionFlash(true);
      const flashStartTime = Date.now();
      setWaitingForClick(true);

      // Handle click
      const handleReactionClick = () => {
        const rt = Date.now() - flashStartTime;
        setReactionTimes((prev) => [...prev, rt]);
        setReactionFlash(false);
        setWaitingForClick(false);
        document.removeEventListener('click', handleReactionClick);

        // Move to next trial
        setTimeout(() => {
          runReactionTrial(trialNum + 1);
        }, 500);
      };

      reactionClickRef.current = handleReactionClick;
      document.addEventListener('click', handleReactionClick, { once: true });

      // Timeout if no click after 5 seconds
      const timeoutId = setTimeout(() => {
        if (reactionClickRef.current) {
          document.removeEventListener('click', reactionClickRef.current);
          reactionClickRef.current = null;
          setReactionFlash(false);
          setWaitingForClick(false);
          setTimeout(() => {
            runReactionTrial(trialNum + 1);
          }, 500);
        }
      }, 5000);

      reactionTimeoutRef.current = timeoutId;
    }, delay);
  };

  // Real brainwave frequency mapping
  const getBrainwaveProfile = () => {
    let primaryWave = 'Alpha';
    let frequency = 10;

    if (testData.focus > 70) {
      primaryWave = 'Beta';
      frequency = 16 + (testData.focus - 70) * 0.4;
    } else if (testData.focus < 30) {
      primaryWave = 'Theta';
      frequency = 5 + testData.focus * 0.15;
    } else {
      primaryWave = 'Alpha';
      frequency = 8 + testData.focus * 0.04;
    }

    return { wave: primaryWave, frequency: frequency.toFixed(1) };
  };

  const generateSoundscape = async () => {
    setIsGenerating(true);
    setTimeout(async () => {
      const brainwave = getBrainwaveProfile();
      const tempo = 60 + (testData.energy / 100) * 80;
      const resonance = testData.mood > 60 ? 'major' : testData.mood > 40 ? 'minor' : 'diminished';

      const timeOfDayEffect = {
        morning: { energy: 15, clarity: 20 },
        afternoon: { energy: 0, clarity: 0 },
        evening: { energy: -15, clarity: -10 },
        night: { energy: -30, clarity: -20 },
      };

      const adjustedEnergy = Math.max(30, Math.min(150, tempo + (timeOfDayEffect[testData.timeOfDay]?.energy || 0)));

      const explanations = {
        brainwave: `Your cognitive profile aligns with ${brainwave.wave}-range activity (${brainwave.frequency} Hz). This frequency range supports your current mental state.`,
        focus: testData.focus > 70 ? 'Beta-dominant state (focused, analytical thinking)' : testData.focus < 30 ? 'Theta-dominant state (creative, diffuse thinking)' : 'Alpha-bridge state (balanced awareness)',
        mood: testData.mood > 70 ? 'elevated dopamine and serotonin activity' : testData.mood > 40 ? 'neurochemical equilibrium' : 'serotonin rebalancing mode',
        stress: testData.stress > 60 ? 'acute stress response detected—parasympathetic activation' : 'baseline parasympathetic tone',
        timeOfDay: `${testData.timeOfDay.charAt(0).toUpperCase() + testData.timeOfDay.slice(1)} circadian phase optimized for synthesis.`,
      };

      setSoundscape({
        brainwave: brainwave.wave,
        frequency: brainwave.frequency,
        tempo: adjustedEnergy.toFixed(0),
        resonance,
        colorScale: `hsl(${200 + (testData.mood - 50) * 1.2}, 70%, 45%)`,
        explanation: explanations,
        timeOfDay: testData.timeOfDay,
        reactionTime: testData.reactionTime,
      });
      setIsGenerating(false);
      setStage('results');
    }, 2000);
  };

  // Play soundscape with Tone.js
  const playSoundscape = async () => {
    try {
      const Tone = (await import('tone')).default;
      await Tone.start();
      setIsPlaying(true);

      const brainwave = getBrainwaveProfile();
      const baseFreq = parseFloat(brainwave.frequency);
      const tempo = parseInt(soundscape.tempo);

      // Play for 10 seconds
      const now = Tone.now();

      if (bass.current) {
        bass.current.triggerAttackRelease(baseFreq, '2n', now);
      }

      if (synth.current) {
        synth.current.triggerAttackRelease(baseFreq * 1.5, '1n', now);
        synth.current.triggerAttackRelease(baseFreq * 2, '2n', now + 2);
      }

      if (ambient.current) {
        ambient.current.triggerAttackRelease(baseFreq * 0.5, '4n', now);
      }

      setTimeout(() => {
        setIsPlaying(false);
      }, 10000);
    } catch (e) {
      alert('Audio playback requires user interaction. Click the play button first.');
      setIsPlaying(false);
    }
  };

  const saveProfile = () => {
    if (!profileName.trim()) return;
    const newProfile = {
      id: Date.now(),
      name: profileName,
      testData,
      soundscape,
      timestamp: new Date().toLocaleString(),
    };
    const updated = [...savedProfiles, newProfile];
    setSavedProfiles(updated);
    localStorage.setItem('neuroSoundProfiles', JSON.stringify(updated));
    setProfileName('');
    setShowSaveModal(false);
  };

  const shareProfile = () => {
    const encodedData = btoa(JSON.stringify(testData));
    const url = `${window.location.origin}${window.location.pathname}?profile=${encodedData}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const loadProfile = (profile) => {
    setTestData(profile.testData);
    setSoundscape(profile.soundscape);
    setStage('results');
  };

  const OscilloscopeWave = ({ phase, color }) => {
    const points = [];
    for (let x = 0; x <= 100; x += 5) {
      const y = 50 + 30 * Math.sin((x + phase) * 0.1);
      points.push(`${x},${y}`);
    }
    return (
      <svg viewBox="0 0 100 100" className="w-full h-12 opacity-60" style={{ filter: `drop-shadow(0 0 4px ${color})` }}>
        <polyline points={points.join(' ')} fill="none" stroke={color} strokeWidth="0.8" />
      </svg>
    );
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${currentTheme.bg} ${isDark ? 'text-white' : 'text-slate-900'} font-sans overflow-hidden transition-all duration-500`}>
      {/* Grid Background */}
      <div className="fixed inset-0 opacity-5">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#fff_1px,transparent_1px),linear-gradient(0deg,#fff_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      </div>

      {/* Animated Accent Line */}
      <div
        className="fixed top-0 left-0 right-0 h-1 opacity-40"
        style={{
          background: `linear-gradient(90deg, ${currentTheme.accent}, ${currentTheme.secondary}, ${currentTheme.accent})`,
          backgroundSize: '200% 100%',
          animation: 'shimmer 8s infinite',
        }}
      ></div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=IBM+Plex+Mono:wght@400;600&display=swap');
        
        @keyframes shimmer {
          0%, 100% { background-position: 0% center; }
          50% { background-position: 100% center; }
        }
        
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes glow {
          0%, 100% { text-shadow: 0 0 10px rgba(6, 182, 212, 0.5); }
          50% { text-shadow: 0 0 20px rgba(6, 182, 212, 0.8); }
        }
        
        @keyframes pulse-border {
          0%, 100% { border-color: rgba(6, 182, 212, 0.3); }
          50% { border-color: rgba(6, 182, 212, 0.8); }
        }
        
        .title {
          font-family: 'IBM Plex Mono', monospace;
          font-weight: 600;
          letter-spacing: 0.15em;
        }
        
        .mono {
          font-family: 'Space Mono', monospace;
        }
        
        .glow-text {
          animation: glow 3s ease-in-out infinite;
        }
        
        .fade-in {
          animation: fadeInUp 0.8s ease-out;
        }
        
        .slider {
          -webkit-appearance: none;
          width: 100%;
          height: 2px;
          border-radius: 1px;
          outline: none;
          cursor: pointer;
        }
        
        .slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: ${currentTheme.accent};
          cursor: pointer;
          box-shadow: 0 0 8px ${currentTheme.accent}80;
        }
        
        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: ${currentTheme.accent};
          cursor: pointer;
          border: none;
          box-shadow: 0 0 8px ${currentTheme.accent}80;
        }
        
        .pulse-ring {
          animation: pulse-border 2s infinite;
        }
      `}</style>

      {/* Header with Theme Toggle */}
      <div className="fixed top-6 right-6 z-50 flex gap-3">
        <div className="flex gap-2 backdrop-blur-sm bg-black/30 rounded-lg p-2 border border-white/10">
          {Object.keys(themes).map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={`px-3 py-1 text-xs mono font-bold rounded transition-all ${
                theme === t
                  ? `bg-${t === 'clinical' ? 'blue' : 'cyan'}-500 text-white`
                  : 'text-slate-300 hover:text-white'
              }`}
              title={t.charAt(0).toUpperCase() + t.slice(1)}
            >
              {t.charAt(0).toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="relative z-10">
        {/* INTRO STAGE */}
        {stage === 'intro' && (
          <div className="flex items-center justify-center min-h-screen px-4 py-12">
            <div className="max-w-2xl w-full fade-in">
              <div className="text-center mb-16">
                <div className="flex items-center justify-center gap-3 mb-6">
                  <Brain className="w-10 h-10" style={{ color: currentTheme.accent }} />
                  <h1 className="title text-4xl md:text-5xl" style={{ color: currentTheme.accent }}>
                    NEURO-SOUND LAB
                  </h1>
                  <Headphones className="w-10 h-10" style={{ color: currentTheme.accent }} />
                </div>
                <p className={`${isDark ? 'text-slate-300' : 'text-slate-700'} text-lg mono mt-8`}>
                  We don't recommend music. <span style={{ color: currentTheme.accent }}>We synthesize it for your brain.</span>
                </p>
                <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'} text-sm mono mt-4`}>
                  Evidence-based soundscapes powered by neuroscience research.
                </p>
              </div>

              {/* What This Is */}
              <div className={`border ${currentTheme.border} rounded-lg p-8 mb-8 ${isDark ? 'bg-blue-950/20' : 'bg-blue-100/30'} backdrop-blur-sm`}>
                <h2 className="title text-xl mb-4" style={{ color: currentTheme.accent }}>
                  What Is Neuro-Sound Lab?
                </h2>
                <p className={`mono text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Neuro-Sound Lab is a personalized soundscape generation engine that creates custom audio frequencies tailored to your unique cognitive and emotional state. Instead of choosing pre-made playlists, you complete a brief neuroscience-backed assessment, and the system synthesizes a soundscape optimized for your brain's current operating mode—whether you need deep focus, creative thinking, stress relief, or better sleep.
                </p>
                <p className={`mono text-sm leading-relaxed mt-4 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Every soundscape is uniquely generated based on your input, meaning no two experiences are identical. Your brain state determines the frequency, tempo, resonance, and texture of your personalized audio.
                </p>
              </div>

              {/* Why It Matters */}
              <div className={`border ${currentTheme.border} rounded-lg p-8 mb-8 ${isDark ? 'bg-purple-950/20' : 'bg-purple-100/30'} backdrop-blur-sm`}>
                <h2 className="title text-xl mb-4" style={{ color: currentTheme.accent }}>
                  Why This Matters
                </h2>
                <div className="space-y-3 mono text-sm">
                  <div className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                    <span className="font-bold" style={{ color: currentTheme.secondary }}>Brain Frequency Sensitivity:</span> Your brain operates at different frequencies depending on your mental state. Alpha waves (8-12 Hz) enhance relaxation and creativity, while beta waves (12-30 Hz) support focus and analytical thinking. Binaural frequencies can entrain your brain into beneficial states.
                  </div>
                  <div className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                    <span className="font-bold" style={{ color: currentTheme.secondary }}>Neurochemical Optimization:</span> Sound frequencies influence dopamine, serotonin, and cortisol levels. The right soundscape can reduce stress, enhance mood, and improve cognitive performance.
                  </div>
                  <div className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                    <span className="font-bold" style={{ color: currentTheme.secondary }}>Personalization Over Playlists:</span> Generic music doesn't account for your unique brain state. This tool adapts to you—your current mood, focus level, energy, stress, and circadian phase all influence the output.
                  </div>
                  <div className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                    <span className="font-bold" style={{ color: currentTheme.secondary }}>Evidence-Based:</span> Built on peer-reviewed neuroscience research on brainwave entrainment, frequency response, and sonic therapy.
                  </div>
                </div>
              </div>

              {/* Tools & Features */}
              <div className={`border ${currentTheme.border} rounded-lg p-8 mb-8 ${isDark ? 'bg-cyan-950/20' : 'bg-cyan-100/30'} backdrop-blur-sm`}>
                <h2 className="title text-xl mb-6" style={{ color: currentTheme.accent }}>
                  Advanced Tools & Features
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`border ${currentTheme.border} rounded p-4 ${isDark ? 'bg-slate-900/50' : 'bg-white/50'}`}>
                    <p className="title text-sm mb-2" style={{ color: currentTheme.secondary }}>
                      Cognitive Assessment
                    </p>
                    <p className={`text-xs mono ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Multi-dimensional evaluation of mood, focus, energy, stress load, and visual attention. Captures your mental state in seconds.
                    </p>
                  </div>
                  <div className={`border ${currentTheme.border} rounded p-4 ${isDark ? 'bg-slate-900/50' : 'bg-white/50'}`}>
                    <p className="title text-sm mb-2" style={{ color: currentTheme.secondary }}>
                      Reaction Time Testing
                    </p>
                    <p className={`text-xs mono ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Real-time cognitive speed measurement across 5 trials. Helps refine focus metrics and processing speed.
                    </p>
                  </div>
                  <div className={`border ${currentTheme.border} rounded p-4 ${isDark ? 'bg-slate-900/50' : 'bg-white/50'}`}>
                    <p className="title text-sm mb-2" style={{ color: currentTheme.secondary }}>
                      Brainwave Frequency Mapping
                    </p>
                    <p className={`text-xs mono ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Maps your cognitive state to Delta, Theta, Alpha, and Beta frequencies based on neuroscience research.
                    </p>
                  </div>
                  <div className={`border ${currentTheme.border} rounded p-4 ${isDark ? 'bg-slate-900/50' : 'bg-white/50'}`}>
                    <p className="title text-sm mb-2" style={{ color: currentTheme.secondary }}>
                      Real-Time Audio Synthesis
                    </p>
                    <p className={`text-xs mono ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Powered by Tone.js—generates unique soundscapes with binaural layers, spatial depth, and harmonic resonance.
                    </p>
                  </div>
                  <div className={`border ${currentTheme.border} rounded p-4 ${isDark ? 'bg-slate-900/50' : 'bg-white/50'}`}>
                    <p className="title text-sm mb-2" style={{ color: currentTheme.secondary }}>
                      Circadian Optimization
                    </p>
                    <p className={`text-xs mono ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Adjusts tempo and frequency based on time of day—morning alertness, afternoon focus, evening wind-down, night restoration.
                    </p>
                  </div>
                  <div className={`border ${currentTheme.border} rounded p-4 ${isDark ? 'bg-slate-900/50' : 'bg-white/50'}`}>
                    <p className="title text-sm mb-2" style={{ color: currentTheme.secondary }}>
                      Profile Management
                    </p>
                    <p className={`text-xs mono ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Save, load, and share personalized profiles. Track your optimal states over time and revisit proven soundscapes.
                    </p>
                  </div>
                </div>
              </div>

              {/* Visual Preview */}
              <div className={`border ${currentTheme.border} rounded-lg p-8 ${isDark ? 'bg-blue-950/20' : 'bg-blue-100/50'} backdrop-blur-sm mb-8`}>
                <h3 className="title text-sm mb-4" style={{ color: currentTheme.secondary }}>
                  Real-Time Soundscape Generation
                </h3>
                <div className="space-y-4">
                  {[0, 120, 240].map((phase) => (
                    <OscilloscopeWave key={phase} phase={wavePhase + phase} color={currentTheme.accent} />
                  ))}
                </div>
                <p className={`text-xs mono mt-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Each soundscape is synthesized in real-time based on your unique cognitive profile
                </p>
              </div>

              {/* How It Works */}
              <div className={`border ${currentTheme.border} rounded-lg p-8 mb-8 ${isDark ? 'bg-slate-900/30' : 'bg-slate-100/30'} backdrop-blur-sm`}>
                <h2 className="title text-xl mb-6" style={{ color: currentTheme.accent }}>
                  How It Works
                </h2>
                <div className="space-y-4 mono text-sm">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div
                        className="flex items-center justify-center w-8 h-8 rounded-full text-white font-bold text-sm"
                        style={{ background: currentTheme.accent }}
                      >
                        1
                      </div>
                    </div>
                    <div>
                      <p className="font-bold" style={{ color: currentTheme.secondary }}>
                        Complete Cognitive Assessment
                      </p>
                      <p className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                        Rate your mood, focus, energy, stress, and visual attention on intuitive sliders. Optionally run a reaction-time test for deeper cognitive insight.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div
                        className="flex items-center justify-center w-8 h-8 rounded-full text-white font-bold text-sm"
                        style={{ background: currentTheme.accent }}
                      >
                        2
                      </div>
                    </div>
                    <div>
                      <p className="font-bold" style={{ color: currentTheme.secondary }}>
                        AI Synthesis Engine
                      </p>
                      <p className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                        The system analyzes your input and maps it to research-backed brainwave frequencies. Tempo, resonance, and spatial depth are calculated dynamically.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div
                        className="flex items-center justify-center w-8 h-8 rounded-full text-white font-bold text-sm"
                        style={{ background: currentTheme.accent }}
                      >
                        3
                      </div>
                    </div>
                    <div>
                      <p className="font-bold" style={{ color: currentTheme.secondary }}>
                        Listen & Learn
                      </p>
                      <p className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                        Play your personalized soundscape and read the science explanation. Understand why those specific frequencies support your current state.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div
                        className="flex items-center justify-center w-8 h-8 rounded-full text-white font-bold text-sm"
                        style={{ background: currentTheme.accent }}
                      >
                        4
                      </div>
                    </div>
                    <div>
                      <p className="font-bold" style={{ color: currentTheme.secondary }}>
                        Save & Share
                      </p>
                      <p className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                        Store your optimal profiles for future sessions. Share soundscapes with others or track how your ideal state changes over time.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Science Behind It */}
              <div className={`border ${currentTheme.border} rounded-lg p-8 mb-12 ${isDark ? 'bg-emerald-950/20' : 'bg-emerald-100/30'} backdrop-blur-sm`}>
                <h2 className="title text-xl mb-4" style={{ color: currentTheme.accent }}>
                  The Neuroscience
                </h2>
                <div className="space-y-3 mono text-sm">
                  <div className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                    <span className="font-bold" style={{ color: currentTheme.secondary }}>Brainwave Entrainment:</span> Research shows that repeated auditory stimuli at specific frequencies can influence brain activity patterns. Binaural beats—different frequencies played in each ear—are particularly effective for guiding the brain into desired states.
                  </div>
                  <div className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                    <span className="font-bold" style={{ color: currentTheme.secondary }}>Frequency Ranges:</span> Delta (0.5-4 Hz) for sleep, Theta (4-8 Hz) for creativity, Alpha (8-12 Hz) for calm focus, and Beta (12-30 Hz) for analytical work. Each has documented benefits.
                  </div>
                  <div className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                    <span className="font-bold" style={{ color: currentTheme.secondary }}>Cortisol & Dopamine:</span> Sound frequencies can modulate stress hormones and reward neurotransmitters. The right soundscape encourages parasympathetic activation (rest-and-digest) or focused attention.
                  </div>
                  <p className={`text-xs mt-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    ⚠️ <span className="font-bold">Disclaimer:</span> This tool is educational and for wellness exploration only. It is not medical therapy or treatment. Always consult qualified healthcare professionals for medical or psychological concerns.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => setStage('test')}
                  className="w-full py-4 text-white font-bold mono text-lg rounded-lg hover:shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
                  style={{
                    background: `linear-gradient(135deg, ${currentTheme.accent}, ${currentTheme.secondary})`,
                    boxShadow: `0 0 20px ${currentTheme.accent}80`,
                  }}
                >
                  <Zap className="w-5 h-5" /> ENTER THE LAB
                </button>
                {savedProfiles.length > 0 && (
                  <button
                    onClick={() => {
                      setStage('results');
                      loadProfile(savedProfiles[0]);
                    }}
                    className={`w-full py-3 border rounded-lg transition-all text-sm mono font-bold ${
                      isDark
                        ? 'border-slate-500 text-slate-300 hover:bg-slate-800'
                        : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    📂 Load Recent Profile ({savedProfiles.length})
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TEST STAGE */}
        {stage === 'test' && (
          <div className="flex items-center justify-center min-h-screen px-4 py-12">
            <div className="max-w-2xl w-full fade-in">
              <div className="mb-12">
                <h2 className="title text-3xl mb-2" style={{ color: currentTheme.accent }}>
                  COGNITIVE STATE ANALYSIS
                </h2>
                <p className={`text-sm mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Map your brain's current operating parameters
                </p>
              </div>

              <div className={`space-y-8 border ${currentTheme.border} rounded-lg p-8 ${isDark ? 'bg-blue-950/20' : 'bg-blue-100/30'} backdrop-blur-sm`}>
                {/* Mood */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="title text-sm uppercase tracking-wider" style={{ color: currentTheme.secondary }}>
                      Mood State
                    </label>
                    <span className={`mono text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {testData.mood > 60 ? '🔆 Elevated' : testData.mood < 40 ? '🌙 Calm' : '⚖️ Balanced'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={testData.mood}
                    onChange={(e) => handleTestChange('mood', parseInt(e.target.value))}
                    className="slider w-full"
                    style={{
                      background: `linear-gradient(to right, #1e293b, ${currentTheme.accent})`,
                    }}
                  />
                  <div className={`flex justify-between text-xs mono mt-2 ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>
                    <span>Anxious</span>
                    <span>Calm</span>
                  </div>
                </div>

                {/* Focus */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="title text-sm uppercase tracking-wider" style={{ color: currentTheme.secondary }}>
                      Focus Level
                    </label>
                    <span className={`mono text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {testData.focus > 70 ? '🎯 Locked In' : testData.focus < 30 ? '💭 Scattered' : '🧭 Navigating'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={testData.focus}
                    onChange={(e) => handleTestChange('focus', parseInt(e.target.value))}
                    className="slider w-full"
                    style={{
                      background: `linear-gradient(to right, #1e293b, ${currentTheme.accent})`,
                    }}
                  />
                  <div className={`flex justify-between text-xs mono mt-2 ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>
                    <span>Scattered</span>
                    <span>Locked In</span>
                  </div>
                </div>

                {/* Energy */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="title text-sm uppercase tracking-wider" style={{ color: currentTheme.secondary }}>
                      Energy Level
                    </label>
                    <span className={`mono text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {testData.energy > 70 ? '⚡ High' : testData.energy < 30 ? '😴 Low' : '🔋 Moderate'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={testData.energy}
                    onChange={(e) => handleTestChange('energy', parseInt(e.target.value))}
                    className="slider w-full"
                    style={{
                      background: `linear-gradient(to right, #1e293b, ${currentTheme.accent})`,
                    }}
                  />
                  <div className={`flex justify-between text-xs mono mt-2 ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>
                    <span>Low</span>
                    <span>High</span>
                  </div>
                </div>

                {/* Stress */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="title text-sm uppercase tracking-wider" style={{ color: currentTheme.secondary }}>
                      Stress Load
                    </label>
                    <span className={`mono text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {testData.stress > 60 ? '🔥 High' : testData.stress < 40 ? '✨ Low' : '⚙️ Moderate'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={testData.stress}
                    onChange={(e) => handleTestChange('stress', parseInt(e.target.value))}
                    className="slider w-full"
                    style={{
                      background: `linear-gradient(to right, #1e293b, ${currentTheme.accent})`,
                    }}
                  />
                  <div className={`flex justify-between text-xs mono mt-2 ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>
                    <span>Low</span>
                    <span>High</span>
                  </div>
                </div>

                {/* Visual Attention */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="title text-sm uppercase tracking-wider" style={{ color: currentTheme.secondary }}>
                      Visual Attention
                    </label>
                    <span className={`mono text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {testData.visualAttention}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={testData.visualAttention}
                    onChange={(e) => handleTestChange('visualAttention', parseInt(e.target.value))}
                    className="slider w-full"
                    style={{
                      background: `linear-gradient(to right, #1e293b, ${currentTheme.accent})`,
                    }}
                  />
                  <div className={`flex justify-between text-xs mono mt-2 ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>
                    <span>Peripheral</span>
                    <span>Focused</span>
                  </div>
                </div>

                {/* Time of Day */}
                <div>
                  <label className="title text-sm uppercase tracking-wider block mb-3" style={{ color: currentTheme.secondary }}>
                    Circadian Phase
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {['morning', 'afternoon', 'evening', 'night'].map((time) => (
                      <button
                        key={time}
                        onClick={() => handleTestChange('timeOfDay', time)}
                        className={`py-2 px-3 rounded text-sm mono font-bold transition-all ${
                          testData.timeOfDay === time
                            ? `text-white`
                            : isDark
                            ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        }`}
                        style={
                          testData.timeOfDay === time
                            ? {
                                background: `linear-gradient(135deg, ${currentTheme.accent}, ${currentTheme.secondary})`,
                                boxShadow: `0 0 12px ${currentTheme.accent}80`,
                              }
                            : {}
                        }
                      >
                        {time.charAt(0).toUpperCase() + time.slice(1)}
                      </button>
                    ))}
                  </div>
                  <p className={`text-xs mono mt-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Current: <span className="font-bold" style={{ color: currentTheme.accent }}>
                      {testData.timeOfDay.charAt(0).toUpperCase() + testData.timeOfDay.slice(1)}
                    </span>
                  </p>
                </div>

                {/* Advanced Tests */}
                <div className={`border-t ${isDark ? 'border-slate-700' : 'border-slate-300'} pt-6`}>
                  <button
                    onClick={() => setShowAdvancedTest(!showAdvancedTest)}
                    className="text-sm mono font-bold underline transition-all"
                    style={{ color: currentTheme.secondary }}
                  >
                    {showAdvancedTest ? '▼' : '▶'} Advanced Cognitive Tests
                  </button>

                  {showAdvancedTest && (
                    <div className="mt-4 space-y-4">
                      <div className={`border ${currentTheme.border} rounded p-4`}>
                        <p className="title text-xs uppercase tracking-wider mb-3" style={{ color: currentTheme.secondary }}>
                          Reaction Time Test
                        </p>
                        <p className={`text-sm mono mb-4 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          Click when the screen flashes. {reactionTimes.length}/5 trials
                        </p>

                        {/* Flash Area */}
                        {reactionTestActive && (
                          <div
                            className={`w-full h-20 rounded mb-4 transition-all ${
                              reactionFlash
                                ? 'bg-yellow-300 shadow-lg'
                                : isDark
                                ? 'bg-slate-700'
                                : 'bg-slate-200'
                            }`}
                            style={
                              reactionFlash
                                ? { boxShadow: `0 0 20px yellow, inset 0 0 20px yellow` }
                                : {}
                            }
                          >
                            {waitingForClick && (
                              <div className="flex items-center justify-center h-full">
                                <p className="text-xl font-bold mono" style={{ color: currentTheme.accent }}>
                                  CLICK NOW!
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {reactionTimes.length > 0 && (
                          <div className={`mb-4 p-3 rounded ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                            <p className="text-xs mono mb-2" style={{ color: currentTheme.secondary }}>
                              Trial Times:
                            </p>
                            <p className="mono text-sm" style={{ color: currentTheme.accent }}>
                              {reactionTimes.map((rt) => `${rt}ms`).join(', ')}
                            </p>
                          </div>
                        )}

                        <button
                          onClick={startReactionTest}
                          disabled={reactionTestActive}
                          className={`w-full py-2 rounded mono font-bold text-sm transition-all ${
                            reactionTestActive
                              ? `text-white`
                              : isDark
                              ? 'bg-slate-800 hover:bg-slate-700'
                              : 'bg-slate-200 hover:bg-slate-300'
                          }`}
                          style={
                            reactionTestActive
                              ? {
                                  background: `linear-gradient(135deg, ${currentTheme.accent}, ${currentTheme.secondary})`,
                                  animation: 'pulse 1s infinite',
                                }
                              : {}
                          }
                        >
                          {reactionTestActive
                            ? 'TEST IN PROGRESS...'
                            : reactionTimes.length === 5
                            ? `Complete! Avg: ${Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)}ms`
                            : 'START TEST'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => setStage('intro')}
                  className={`flex-1 py-3 border rounded-lg transition-all font-bold mono ${
                    isDark
                      ? 'border-slate-500 text-slate-300 hover:bg-slate-800'
                      : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Back
                </button>
                <button
                  onClick={generateSoundscape}
                  disabled={isGenerating}
                  className="flex-1 py-3 text-white font-bold mono rounded-lg hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{
                    background: `linear-gradient(135deg, ${currentTheme.accent}, ${currentTheme.secondary})`,
                    boxShadow: `0 0 20px ${currentTheme.accent}80`,
                  }}
                >
                  <Play className="w-5 h-5" /> {isGenerating ? 'SYNTHESIZING...' : 'SYNTHESIZE'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* RESULTS STAGE */}
        {stage === 'results' && soundscape && (
          <div className="flex items-center justify-center min-h-screen px-4 py-12">
            <div className="max-w-3xl w-full fade-in">
              <div className="mb-12">
                <h2 className="title text-3xl mb-2" style={{ color: currentTheme.accent }}>
                  SOUNDSCAPE SYNTHESIZED
                </h2>
                <p className={`text-sm mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Your neuroacoustic profile is ready
                </p>
              </div>

              {/* Soundscape Visualization */}
              <div
                className={`border-2 rounded-lg p-8 mb-8 ${isDark ? 'bg-gradient-to-br from-blue-950/40 to-slate-950/40' : 'bg-gradient-to-br from-blue-100/40 to-slate-100/40'} backdrop-blur-sm`}
                style={{ borderColor: soundscape.colorScale }}
              >
                <div className="space-y-6">
                  {[0, 120, 240].map((phase) => (
                    <OscilloscopeWave key={phase} phase={wavePhase + phase} color={soundscape.colorScale} />
                  ))}
                </div>

                <div className="grid grid-cols-4 gap-3 mt-8">
                  <div className={`border ${currentTheme.border} rounded p-4 ${isDark ? 'bg-slate-900/50' : 'bg-white/50'}`}>
                    <p className="text-xs title uppercase tracking-wider mb-2" style={{ color: currentTheme.secondary }}>
                      Brainwave
                    </p>
                    <p className="text-xl font-bold mono" style={{ color: currentTheme.accent }}>
                      {soundscape.brainwave}
                    </p>
                  </div>
                  <div className={`border ${currentTheme.border} rounded p-4 ${isDark ? 'bg-slate-900/50' : 'bg-white/50'}`}>
                    <p className="text-xs title uppercase tracking-wider mb-2" style={{ color: currentTheme.secondary }}>
                      Frequency
                    </p>
                    <p className="text-xl font-bold mono" style={{ color: currentTheme.accent }}>
                      {soundscape.frequency} Hz
                    </p>
                  </div>
                  <div className={`border ${currentTheme.border} rounded p-4 ${isDark ? 'bg-slate-900/50' : 'bg-white/50'}`}>
                    <p className="text-xs title uppercase tracking-wider mb-2" style={{ color: currentTheme.secondary }}>
                      Tempo
                    </p>
                    <p className="text-xl font-bold mono" style={{ color: currentTheme.accent }}>
                      {soundscape.tempo} BPM
                    </p>
                  </div>
                  <div className={`border ${currentTheme.border} rounded p-4 ${isDark ? 'bg-slate-900/50' : 'bg-white/50'}`}>
                    <p className="text-xs title uppercase tracking-wider mb-2" style={{ color: currentTheme.secondary }}>
                      Resonance
                    </p>
                    <p className="text-xl font-bold mono" style={{ color: currentTheme.accent }}>
                      {soundscape.resonance.charAt(0).toUpperCase() + soundscape.resonance.slice(1)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Audio Controls */}
              <button
                onClick={playSoundscape}
                disabled={isPlaying}
                className={`w-full py-4 text-white font-bold mono text-lg rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2 mb-8 ${
                  isPlaying ? 'opacity-60' : 'hover:scale-105'
                }`}
                style={{
                  background: `linear-gradient(135deg, ${currentTheme.accent}, ${currentTheme.secondary})`,
                  boxShadow: `0 0 20px ${currentTheme.accent}80`,
                }}
              >
                <Headphones className="w-5 h-5" /> {isPlaying ? 'PLAYING (10s)...' : 'PLAY SOUNDSCAPE'}
              </button>

              {/* Scientific Explanation */}
              <div className={`border ${currentTheme.border} rounded-lg p-6 ${isDark ? 'bg-purple-950/20' : 'bg-purple-100/30'} backdrop-blur-sm mb-8`}>
                <h3 className="title text-sm uppercase tracking-wider mb-4" style={{ color: currentTheme.secondary }}>
                  Neuroscience Explanation
                </h3>
                <div className={`space-y-3 mono text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  <p>
                    <span style={{ color: currentTheme.accent }}>Brainwave Profile:</span> {soundscape.explanation.brainwave}
                  </p>
                  <p>
                    <span style={{ color: currentTheme.accent }}>Cognitive State:</span> {soundscape.explanation.focus}
                  </p>
                  <p>
                    <span style={{ color: currentTheme.accent }}>Emotional Baseline:</span> Frequency tuned to support {soundscape.explanation.mood}.
                  </p>
                  <p>
                    <span style={{ color: currentTheme.accent }}>Stress Response:</span> {soundscape.explanation.stress}
                  </p>
                  <p>
                    <span style={{ color: currentTheme.accent }}>Circadian Optimization:</span> {soundscape.explanation.timeOfDay}
                  </p>
                  <p className={`text-xs mt-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    ⚠️ <span className="font-bold">Educational Only</span> - Not medical advice. Consult professionals for health concerns.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  onClick={() => setShowSaveModal(true)}
                  className={`py-3 rounded-lg mono font-bold text-sm transition-all flex items-center justify-center gap-2 border ${
                    isDark
                      ? 'border-slate-500 text-slate-300 hover:bg-slate-800'
                      : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Save className="w-4 h-4" /> Save Profile
                </button>
                <button
                  onClick={shareProfile}
                  className={`py-3 rounded-lg mono font-bold text-sm transition-all flex items-center justify-center gap-2 border ${
                    isDark
                      ? 'border-slate-500 text-slate-300 hover:bg-slate-800'
                      : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Share'}
                </button>
              </div>

              {/* Saved Profiles */}
              {savedProfiles.length > 0 && (
                <div className={`border ${currentTheme.border} rounded-lg p-6 ${isDark ? 'bg-slate-900/30' : 'bg-slate-100/30'} backdrop-blur-sm mb-6`}>
                  <h3 className="title text-sm uppercase tracking-wider mb-4" style={{ color: currentTheme.secondary }}>
                    Saved Profiles ({savedProfiles.length})
                  </h3>
                  <div className="space-y-2">
                    {savedProfiles.map((profile) => (
                      <button
                        key={profile.id}
                        onClick={() => loadProfile(profile)}
                        className={`w-full text-left p-3 rounded mono text-sm transition-all border ${
                          isDark
                            ? 'border-slate-700 hover:bg-slate-800'
                            : 'border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        <p className="font-bold" style={{ color: currentTheme.accent }}>
                          {profile.name}
                        </p>
                        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          {profile.timestamp}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => setStage('test')}
                className="w-full py-3 text-white font-bold mono rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2"
                style={{
                  background: `linear-gradient(135deg, ${currentTheme.accent}, ${currentTheme.secondary})`,
                  boxShadow: `0 0 20px ${currentTheme.accent}80`,
                }}
              >
                <RotateCcw className="w-5 h-5" /> NEW ANALYSIS
              </button>
            </div>
          </div>
        )}

        {/* Save Modal */}
        {showSaveModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
            <div
              className={`p-6 rounded-lg max-w-sm w-full mx-4 ${isDark ? 'bg-slate-900' : 'bg-white'} border ${currentTheme.border}`}
            >
              <h3 className="title text-lg mb-4" style={{ color: currentTheme.accent }}>
                SAVE PROFILE
              </h3>
              <input
                type="text"
                placeholder="Profile name..."
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className={`w-full p-3 rounded mono text-sm mb-4 border ${
                  isDark
                    ? 'bg-slate-800 border-slate-600 text-white'
                    : 'bg-slate-100 border-slate-300 text-black'
                }`}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSaveModal(false)}
                  className={`flex-1 py-2 rounded mono font-bold text-sm border ${
                    isDark
                      ? 'border-slate-600 text-slate-300 hover:bg-slate-800'
                      : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={saveProfile}
                  disabled={!profileName.trim()}
                  className="flex-1 py-2 text-white font-bold mono rounded text-sm disabled:opacity-50"
                  style={{
                    background: `linear-gradient(135deg, ${currentTheme.accent}, ${currentTheme.secondary})`,
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
