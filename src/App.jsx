import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PEXELS_API_KEY = import.meta.env.VITE_PEXELS_API_KEY || '';

// Stop words: articles, prepositions, conjunctions, pronouns, adverbs, auxiliary verbs
const STOP_WORDS = new Set([
  'a', 'an', 'the',
  'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'about',
  'into', 'over', 'after', 'under', 'between', 'out', 'against', 'during',
  'without', 'before', 'around', 'among', 'through', 'above', 'below',
  'along', 'across', 'behind', 'beyond', 'near', 'upon', 'within',
  'and', 'but', 'or', 'nor', 'for', 'yet', 'so', 'if', 'then', 'else',
  'when', 'while', 'although', 'because', 'since', 'unless', 'until',
  'whether', 'though', 'than', 'that', 'once',
  'i', 'me', 'my', 'mine', 'myself',
  'you', 'your', 'yours', 'yourself',
  'he', 'him', 'his', 'himself',
  'she', 'her', 'hers', 'herself',
  'it', 'its', 'itself',
  'we', 'us', 'our', 'ours', 'ourselves',
  'they', 'them', 'their', 'theirs', 'themselves',
  'who', 'whom', 'whose', 'which', 'what', 'this', 'that', 'these', 'those',
  'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'having',
  'do', 'does', 'did',
  'will', 'would', 'shall', 'should',
  'can', 'could', 'may', 'might', 'must',
  'not', 'no', 'very', 'just', 'also', 'too', 'only', 'even',
  'now', 'here', 'there', 'where', 'how', 'why',
  'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other',
  'some', 'any', 'such', 'as',
  'yes', 'well', 'oh', 'ok', 'like',
]);

function isConceptWord(word) {
  const clean = word.replace(/[^a-zA-Z]/g, '').toLowerCase();
  if (!clean || clean.length < 2) return false;
  return !STOP_WORDS.has(clean);
}

// Simple debounce hook
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

// Image cache to avoid refetching the same word
const imageCache = new Map();

function WordNode({ word }) {
  const [imageUrl, setImageUrl] = useState(() => {
    const clean = word.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    return imageCache.get(clean) || null;
  });
  const debouncedWord = useDebounce(word, 400);
  const isConcept = isConceptWord(word);

  useEffect(() => {
    if (!isConcept) {
      setImageUrl(null);
      return;
    }

    const cleanWord = debouncedWord.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    if (!cleanWord) {
      setImageUrl(null);
      return;
    }

    // Check cache first
    if (imageCache.has(cleanWord)) {
      setImageUrl(imageCache.get(cleanWord));
      return;
    }

    let isMounted = true;

    async function fetchImage() {
      if (!PEXELS_API_KEY) return;
      try {
        const res = await fetch(
          'https://api.pexels.com/v1/search?query=' + encodeURIComponent(cleanWord) + '&per_page=1',
          { headers: { Authorization: PEXELS_API_KEY } }
        );
        const data = await res.json();
        if (isMounted && data.photos && data.photos.length > 0) {
          const url = data.photos[0].src.medium;
          imageCache.set(cleanWord, url);
          setImageUrl(url);
        } else if (isMounted) {
          setImageUrl(null);
        }
      } catch (err) {
        console.error('Pexels fetch error:', err);
      }
    }

    fetchImage();
    return () => { isMounted = false; };
  }, [debouncedWord, isConcept]);

  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      <span
        style={{
          position: 'relative',
          zIndex: 2,
          color: imageUrl ? '#fff' : '#000',
          transition: 'color 0.2s ease',
        }}
      >
        {word}
      </span>
      <AnimatePresence>
        {imageUrl && (
          <motion.img
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            src={imageUrl}
            alt={word}
            style={{
              position: 'absolute',
              top: '4%',
              left: '-4px',
              width: 'calc(100% + 8px)',
              height: '92%',
              objectFit: 'cover',
              zIndex: 1,
              pointerEvents: 'none',
              borderRadius: '2px',
            }}
          />
        )}
      </AnimatePresence>
    </span>
  );
}

// Tokenize text into words and whitespace segments
const SPLIT_RE = /(\s+)/;

function tokenize(text) {
  return text.split(SPLIT_RE);
}

function WritingInterface() {
  const [text, setText] = useState('');
  const textareaRef = useRef(null);

  // Auto-focus on mount
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const handleChange = useCallback((e) => {
    setText(e.target.value);
  }, []);

  const handleContainerClick = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const tokens = tokenize(text);

  return (
    <div
      className="writing-container"
      onClick={handleContainerClick}
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '80vh',
        cursor: 'text',
      }}
    >
      {/* Hidden textarea for reliable text input */}
      <textarea
        ref={textareaRef}
        value={text}
        onChange={handleChange}
        spellCheck={false}
        autoComplete="off"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          fontSize: '48px',
          fontFamily: 'Inter, sans-serif',
          fontWeight: 600,
          lineHeight: '2.4',
          textAlign: 'left',
          zIndex: 10,
          outline: 'none',
          border: 'none',
          resize: 'none',
          background: 'transparent',
          color: 'transparent',
          caretColor: 'black',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          letterSpacing: '-0.02em',
          padding: 0,
          margin: 0,
          overflow: 'hidden',
        }}
      />

      {/* Visual render layer */}
      <div
        className="visual-render"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          fontSize: '48px',
          fontFamily: 'Inter, sans-serif',
          fontWeight: 600,
          lineHeight: '2.4',
          textAlign: 'left',
          zIndex: 5,
          pointerEvents: 'none',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          letterSpacing: '-0.02em',
        }}
      >
        {tokens.map((token, index) => {
          if (SPLIT_RE.test(token)) {
            if (token.includes('\n')) {
              return (
                <span key={index}>
                  {token.split('\n').map((part, i, arr) =>
                    i === arr.length - 1 ? (part || null) : <br key={i} />
                  )}
                </span>
              );
            }
            return <span key={index}>{token}</span>;
          }
          return <WordNode key={index} word={token} />;
        })}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '80px 60px' }}>
      <WritingInterface />
    </div>
  );
}
