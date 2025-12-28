import React, { useState, useEffect, useRef, useCallback } from "react";
import api from "../services/api";

const WORDS = [
    "the", "be", "of", "and", "a", "to", "in", "he", "have", "it", "that", "for", "they", "i", "with", "as", "not", "on", "she", "at", "by", "this", "we", "you", "do", "but", "from", "or", "which", "one", "would", "all", "will", "there", "say", "who", "make", "when", "can", "more", "if", "no", "man", "out", "other", "so", "what", "time", "up", "go", "about", "than", "into", "could", "state", "only", "new", "year", "some", "take", "come", "these", "know", "see", "use", "get", "like", "then", "first", "any", "work", "now", "may", "such", "give", "over", "think", "most", "even", "find", "day", "also", "after", "way", "many", "must", "look", "before", "great", "back", "through", "long", "where", "much", "should", "well", "people", "down", "own", "just", "because", "good", "each", "those", "feel", "seem", "how", "high", "too", "place", "little", "world", "very", "still", "nation", "hand", "old", "life", "tell", "write", "become", "here", "show", "house", "both", "between", "need", "mean", "call", "develop", "under", "last", "right", "move", "thing", "general", "school", "never", "same", "another", "begin", "while", "number", "part", "turn", "real", "leave", "might", "want", "point", "form", "off", "child", "few", "small", "since", "against", "ask", "late", "home", "interest", "large", "person", "end", "open", "public", "follow", "during", "present", "without", "again", "hold", "govern", "around", "possible", "head", "consider", "word", "program", "problem", "however", "lead", "system", "set", "order", "eye", "plan", "run", "keep", "face", "fact", "group", "play", "stand", "increase", "early", "course", "change", "help", "line"
];

const TypingTest = () => {
    // Game Config
    const [mode, setMode] = useState("time"); // 'time' or 'custom'
    const [duration, setDuration] = useState(30);
    const [timeLeft, setTimeLeft] = useState(30);
    const [isActive, setIsActive] = useState(false);

    // Custom Text State
    const [showCustomModal, setShowCustomModal] = useState(false);
    const [customTexts, setCustomTexts] = useState([]);
    const [newCustomText, setNewCustomText] = useState("");
    const [selectedCustomText, setSelectedCustomText] = useState(null);

    // Game State
    const [words, setWords] = useState([]);
    const [wordIndex, setWordIndex] = useState(0); // Index of current word
    const [currInput, setCurrInput] = useState(""); // Current typing of the active word

    // Stats State
    const [correctChars, setCorrectChars] = useState(0);
    const [incorrectChars, setIncorrectChars] = useState(0);
    const [history, setHistory] = useState({});

    const [results, setResults] = useState(null);
    const inputRef = useRef(null);
    const [startTime, setStartTime] = useState(null);

    // Use refs to track character counts without causing effect re-runs
    const correctCharsRef = useRef(0);
    const incorrectCharsRef = useRef(0);

    // Update refs whenever state changes
    useEffect(() => {
        correctCharsRef.current = correctChars;
        incorrectCharsRef.current = incorrectChars;
    }, [correctChars, incorrectChars]);

    const generateWords = useCallback(() => {
        if (mode === 'custom' && selectedCustomText) {
            setWords(selectedCustomText.split(/\s+/));
        } else {
            let newWords = [];
            for (let i = 0; i < 150; i++) {
                newWords.push(WORDS[Math.floor(Math.random() * WORDS.length)]);
            }
            setWords(newWords);
        }

        setWordIndex(0);
        setCurrInput("");
        setHistory({});
        setCorrectChars(0);
        setIncorrectChars(0);
    }, [mode, selectedCustomText]);

    useEffect(() => {
        generateWords();
    }, [generateWords]);

    useEffect(() => {
        if (mode === 'time') {
            setTimeLeft(duration);
        } else {
            setTimeLeft(0); // Count up
        }
    }, [duration, mode]);

    const saveResult = async (data) => {
        try {
            await api.post("/tests/save", data);
        } catch (err) {
            console.error("Failed to save result", err);
        }
    };

    const finishTest = useCallback(() => {
        setIsActive(false);

        let timeElapsed;
        if (mode === 'time') {
            // If timeLeft is 0 or 1, the timer expired naturally, so use full duration
            timeElapsed = (timeLeft <= 1) ? duration : (duration - timeLeft);
        } else {
            timeElapsed = timeLeft;
        }

        if (timeElapsed === 0) timeElapsed = 1; // Prevent div by zero

        // Use refs to get current values
        const currentCorrectChars = correctCharsRef.current;
        const currentIncorrectChars = incorrectCharsRef.current;

        const wpm = Math.round((currentCorrectChars / 5) / (timeElapsed / 60));
        const rawWpm = Math.round(((currentCorrectChars + currentIncorrectChars) / 5) / (timeElapsed / 60));
        const accuracy = (currentCorrectChars + currentIncorrectChars) > 0 ? Math.round((currentCorrectChars / (currentCorrectChars + currentIncorrectChars)) * 100) : 0;

        const resultData = {
            wpm,
            rawWpm,
            accuracy,
            duration: timeElapsed,
            correctChars: currentCorrectChars,
            incorrectChars: currentIncorrectChars
        };

        setResults(resultData);
        saveResult(resultData);
    }, [mode, duration, timeLeft]); // Removed correctChars and incorrectChars from dependencies

    useEffect(() => {
        let interval = null;
        if (isActive) {
            setStartTime(Date.now());
            interval = setInterval(() => {
                if (mode === 'time') {
                    setTimeLeft(curr => {
                        if (curr <= 1) {
                            finishTest();
                            return 0;
                        }
                        return curr - 1;
                    });
                } else {
                    setTimeLeft(curr => curr + 1);
                }
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isActive, mode, finishTest]);

    const fetchCustomTexts = async () => {
        try {
            const res = await api.get("/custom-texts");
            setCustomTexts(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddCustomText = async () => {
        if (!newCustomText.trim()) return;
        try {
            await api.post("/custom-texts", { content: newCustomText, isPublic: false });
            setNewCustomText("");
            fetchCustomTexts();
        } catch (err) {
            console.error(err);
        }
    };

    const selectCustomText = (text) => {
        setSelectedCustomText(text.content);
        setMode('custom');
        setShowCustomModal(false);
        // Duration irrelevant for custom text, but we use it for stats if needed.
        // Actually for custom text, duration is dynamic.
        setDuration(0);
    };

    const getLiveWpm = () => {
        let timeElapsed;
        if (mode === 'time') {
            timeElapsed = duration - timeLeft;
        } else {
            timeElapsed = timeLeft;
        }

        if (timeElapsed === 0) return 0;
        const wpm = Math.round((correctChars / 5) / (timeElapsed / 60));
        return wpm < 0 || !isFinite(wpm) ? 0 : wpm;
    };

    const getLiveAccuracy = () => {
        const total = correctChars + incorrectChars;
        if (total === 0) return 0;
        return Math.round((correctChars / total) * 100);
    };

    const startTest = () => {
        setIsActive(true);
        if (inputRef.current) inputRef.current.focus();
    };

    const resetTest = () => {
        setIsActive(false);
        if (mode === 'time') setTimeLeft(duration);
        else setTimeLeft(0);

        setResults(null);
        generateWords();
        setTimeout(() => inputRef.current?.focus(), 100);
    };

    const handleKeyDown = (e) => {
        if (!isActive && ((mode === 'time' && timeLeft > 0) || mode === 'custom') && e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
            startTest();
        }

        if (!isActive && mode === 'time' && timeLeft === 0) return;
        if (results) return; // finished

        // Space -> Next Word
        if (e.key === " ") {
            e.preventDefault();
            if (currInput.trim() === "") return;

            const targetWord = words[wordIndex];
            const isCorrect = currInput === targetWord;

            setHistory(prev => ({
                ...prev,
                [wordIndex]: isCorrect ? 'correct' : 'incorrect'
            }));

            // Check end of custom text
            if (mode === 'custom' && wordIndex === words.length - 1) {
                finishTest();
                return;
            }

            setWordIndex(prev => prev + 1);
            setCurrInput("");
            return;
        }

        // Backspace
        if (e.key === "Backspace") {
            return;
        }
    };

    const handleChange = (e) => {
        if (!isActive && mode === 'time' && timeLeft === 0) return;
        if (results) return;

        const val = e.target.value;
        const oldVal = currInput;

        if (val.includes(" ")) return;

        setCurrInput(val);

        if (val.length > oldVal.length) {
            const charIndex = val.length - 1;
            const targetWord = words[wordIndex];

            if (charIndex < targetWord.length) {
                if (val[charIndex] === targetWord[charIndex]) {
                    setCorrectChars(prev => prev + 1);
                } else {
                    setIncorrectChars(prev => prev + 1);
                }
            } else {
                setIncorrectChars(prev => prev + 1);
            }

            // Auto finish custom text if last word matches perfectly and we are at end
            if (mode === 'custom' && wordIndex === words.length - 1) {
                if (val === targetWord) {
                    finishTest();
                }
            }
        }
    };

    const renderWord = (word, index) => {
        const isCurrent = index === wordIndex;

        if (index < wordIndex) {
            const status = history[index];
            return <span key={index} className={`word ${status}`}>{word} </span>;
        }

        if (isCurrent) {
            return (
                <span key={index} className="word active">
                    {word.split('').map((char, i) => {
                        let className = "";
                        if (i < currInput.length) {
                            className = currInput[i] === char ? "correct" : "incorrect";
                        }
                        return (
                            <span key={i} style={{ position: 'relative' }}>
                                <span className={className}>{char}</span>
                                {/* Show cursor after this character if it's the last typed one */}
                                {i === currInput.length - 1 && (
                                    <span className="typing-cursor" style={{
                                        position: 'absolute',
                                        animation: 'blink 1s infinite',
                                        marginLeft: '2px',
                                        fontWeight: 'bold',
                                        color: 'var(--primary-cyan)'
                                    }}>|</span>
                                )}
                            </span>
                        );
                    })}
                    {/* Show cursor at the beginning if nothing is typed yet */}
                    {currInput.length === 0 && (
                        <span className="typing-cursor" style={{
                            animation: 'blink 1s infinite',
                            fontWeight: 'bold',
                            color: 'var(--primary-cyan)',
                            marginRight: '2px'
                        }}>|</span>
                    )}
                    {/* Extra characters typed beyond the word */}
                    {currInput.length > word.length && (
                        currInput.slice(word.length).split('').map((char, i) => (
                            <span key={`extra-${i}`} className="incorrect extra">{char}</span>
                        ))
                    )}
                    <span> </span>
                </span>
            );
        }

        return <span key={index} className="word">{word} </span>;
    };

    return (
        <div className="typeroo-test" style={{ maxWidth: '1400px', margin: '0 auto', width: '95%' }}>

            {/* Custom Text Modal */}
            {showCustomModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div style={{ background: 'var(--bg-dark-secondary)', padding: '2rem', borderRadius: '8px', maxWidth: '600px', width: '90%' }}>
                        <h3 style={{ marginBottom: '1rem', color: 'var(--text-main)' }}>Custom Text</h3>

                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Add New Text</label>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <textarea
                                    value={newCustomText}
                                    onChange={(e) => setNewCustomText(e.target.value)}
                                    placeholder="Paste your text here..."
                                    style={{ flex: 1, height: '80px', background: 'var(--bg-dark)', border: '1px solid var(--text-muted)', color: 'var(--text-main)', padding: '0.5rem' }}
                                />
                                <button onClick={handleAddCustomText} className="btn btn-primary">Add</button>
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Select Text</label>
                            <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {customTexts.map(text => (
                                    <div
                                        key={text.id}
                                        onClick={() => selectCustomText(text)}
                                        style={{
                                            padding: '0.5rem', background: 'var(--bg-dark)', cursor: 'pointer',
                                            border: '1px solid var(--text-muted)', borderRadius: '4px',
                                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                                        }}
                                    >
                                        {text.content.substring(0, 50)}...
                                    </div>
                                ))}
                                {customTexts.length === 0 && <div style={{ color: 'var(--text-muted)' }}>No saved texts.</div>}
                            </div>
                        </div>

                        <button onClick={() => setShowCustomModal(false)} className="btn" style={{ marginTop: '2rem', width: '100%', border: '1px solid var(--text-muted)' }}>Close</button>
                    </div>
                </div>
            )}

            {results ? (
                <div className="results-card" style={{ textAlign: 'center', background: 'var(--bg-dark-secondary)', padding: '2rem', borderRadius: '8px' }}>
                    <h2 className="text-cyan" style={{ fontSize: '2rem', marginBottom: '1rem' }}>Test Complete!</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                        <div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>WPM</div>
                            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--primary-cyan)' }}>{results.wpm}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Acc</div>
                            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--primary-cyan)' }}>{results.accuracy}%</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Raw</div>
                            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>{results.rawWpm}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Characters</div>
                            <div style={{ fontSize: '1.2rem', color: 'var(--text-main)', marginTop: '0.5rem' }}>{results.correctChars}/{results.incorrectChars}</div>
                        </div>
                    </div>
                    <button onClick={resetTest} className="btn btn-primary" style={{ fontSize: '1.2rem', padding: '0.8rem 2rem' }}>Try Again</button>
                </div>
            ) : (
                <>
                    {/* Header Stats */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', alignItems: 'flex-end' }}>
                        <div style={{ display: 'flex', gap: '2rem' }}>
                            <div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{mode === 'custom' ? 'Time' : 'Time Left'}</div>
                                <div style={{ color: 'var(--primary-cyan)', fontSize: '1.5rem', fontWeight: 'bold' }}>{timeLeft}s</div>
                            </div>
                            <div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>WPM</div>
                                <div style={{ color: 'var(--text-main)', fontSize: '1.5rem', fontWeight: 'bold' }}>{getLiveWpm()}</div>
                            </div>
                            <div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Acc</div>
                                <div style={{ color: 'var(--text-main)', fontSize: '1.5rem', fontWeight: 'bold' }}>{getLiveAccuracy()}%</div>
                            </div>
                        </div>

                        <div className="modes" style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-dark-secondary)', padding: '0.5rem', borderRadius: '4px' }}>
                            {[10, 30, 60].map(d => (
                                <button
                                    key={d}
                                    onClick={() => { setMode('time'); setDuration(d); resetTest(); }}
                                    className={(mode === 'time' && duration === d) ? "text-cyan" : ""}
                                    style={{
                                        color: (mode === 'time' && duration === d) ? 'var(--primary-cyan)' : 'var(--text-muted)',
                                        fontWeight: (mode === 'time' && duration === d) ? 'bold' : 'normal',
                                        padding: '0 0.5rem'
                                    }}
                                >
                                    {d}s
                                </button>
                            ))}
                            <button
                                onClick={() => { fetchCustomTexts(); setShowCustomModal(true); }}
                                className={mode === 'custom' ? "text-cyan" : ""}
                                style={{
                                    color: mode === 'custom' ? 'var(--primary-cyan)' : 'var(--text-muted)',
                                    fontWeight: mode === 'custom' ? 'bold' : 'normal',
                                    padding: '0 0.5rem',
                                    borderLeft: '1px solid var(--text-muted)',
                                    marginLeft: '0.5rem'
                                }}
                            >
                                Custom
                            </button>
                        </div>
                    </div>

                    {/* Typing Area - Monkeytype Style */}
                    <div
                        className="typing-area-container"
                        onClick={() => inputRef.current?.focus()}
                        style={{
                            position: 'relative',
                            outline: 'none',
                            height: '180px',
                            overflow: 'hidden',
                            marginBottom: '2rem'
                        }}
                    >
                        <input
                            ref={inputRef}
                            type="text"
                            value={currInput}
                            onKeyDown={handleKeyDown}
                            onChange={handleChange}
                            style={{ position: 'absolute', opacity: 0, top: 0, left: 0, pointerEvents: 'none' }}
                            autoFocus
                        />

                        <div
                            className="words-display"
                            style={{
                                fontSize: '1.8rem',
                                lineHeight: '3rem',
                                fontFamily: '"Roboto Mono", monospace',
                                userSelect: 'none',
                                color: 'var(--text-muted)',
                                transition: 'transform 0.2s ease-out',
                                transform: `translateY(-${Math.floor(wordIndex / 15) * 3}rem)`
                            }}
                        >
                            {words.map((word, i) => {
                                const isCurrent = i === wordIndex;
                                const isPast = i < wordIndex;

                                return (
                                    <span
                                        key={i}
                                        style={{
                                            display: 'inline-block',
                                            marginRight: '0.6rem',
                                            marginBottom: '0.5rem',
                                            opacity: isPast ? 0.4 : 1,
                                            color: isPast
                                                ? (history[i] === 'correct' ? 'var(--text-main)' : 'var(--error)')
                                                : isCurrent
                                                    ? 'var(--text-main)'
                                                    : 'var(--text-muted)'
                                        }}
                                    >
                                        {word.split('').map((char, charIndex) => {
                                            if (!isCurrent) {
                                                return <span key={charIndex}>{char}</span>;
                                            }

                                            const isTyped = charIndex < currInput.length;
                                            const isCorrect = isTyped && currInput[charIndex] === char;
                                            const isIncorrect = isTyped && currInput[charIndex] !== char;

                                            return (
                                                <span
                                                    key={charIndex}
                                                    style={{
                                                        position: 'relative',
                                                        color: isCorrect
                                                            ? 'var(--primary-cyan)'
                                                            : isIncorrect
                                                                ? 'var(--error)'
                                                                : 'inherit'
                                                    }}
                                                >
                                                    {char}
                                                    {/* Cursor indicator */}
                                                    {charIndex === currInput.length && (
                                                        <span
                                                            style={{
                                                                position: 'absolute',
                                                                left: '0',
                                                                top: '0',
                                                                bottom: '0',
                                                                width: '2px',
                                                                backgroundColor: 'var(--primary-cyan)',
                                                                animation: 'blink 1s infinite'
                                                            }}
                                                        />
                                                    )}
                                                </span>
                                            );
                                        })}
                                        {/* Extra characters */}
                                        {isCurrent && currInput.length > word.length && (
                                            currInput.slice(word.length).split('').map((char, i) => (
                                                <span key={`extra-${i}`} style={{ color: 'var(--error)', textDecoration: 'underline' }}>
                                                    {char}
                                                </span>
                                            ))
                                        )}
                                    </span>
                                );
                            })}
                        </div>

                        <div style={{ textAlign: 'center', marginTop: '3rem' }}>
                            <button onClick={resetTest} className="btn btn-ghost" title="Restart Test">
                                <span style={{ fontSize: '1.5rem', transform: 'rotate(90deg)', display: 'inline-block' }}>&#x21bb;</span>
                            </button>
                        </div>
                    </div>
                </>
            )}

            <style>{`
                .word { margin-right: 0.2rem; display: inline-block; border-radius: 4px; padding: 0.1rem; }
                .word.correct { color: var(--text-main); }
                .word.incorrect { text-decoration: underline; text-decoration-color: var(--error); }
                .word.active { background-color: rgba(255,255,255,0.05); }
                
                span.correct { color: var(--text-main); }
                span.incorrect { color: var(--error); }
                span.extra { color: var(--error); opacity: 0.7; }
                
                .caret-placeholder {
                    display: inline-block;
                    width: 2px;
                    height: 1.2em;
                    background-color: var(--primary-cyan);
                    vertical-align: middle;
                    animation: blink 1s infinite;
                    margin-left: -1px;
                }
                
                @keyframes blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0; }
                }
            `}</style>
        </div>
    );
};

export default TypingTest;
