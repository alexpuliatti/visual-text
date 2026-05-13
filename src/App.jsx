import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const PEXELS_API_KEY = import.meta.env.VITE_PEXELS_API_KEY || '';

// Stop words: articles, prepositions, conjunctions, pronouns, adverbs, auxiliary verbs
// Only "concept words" (nouns, main verbs, adjectives) should get images
const STOP_WORDS = new Set([
  // Articles
  'a', 'an', 'the',
  // Prepositions
  'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'about',
  'into', 'over', 'after', 'under', 'between', 'out', 'against', 'during',
  'without', 'before', 'around', 'among', 'through', 'above', 'below',
  'along', 'across', 'behind', 'beyond', 'near', 'upon', 'within',
  // Conjunctions
  'and', 'but', 'or', 'nor', 'for', 'yet', 'so', 'if', 'then', 'else',
  'when', 'while', 'although', 'because', 'since', 'unless', 'until',
  'whether', 'though', 'than', 'that', 'once',
  // Pronouns
  'i', 'me', 'my', 'mine', 'myself',
  'you', 'your', 'yours', 'yourself',
  'he', 'him', 'his', 'himself',
  'she', 'her', 'hers', 'herself',
  'it', 'its', 'itself',
  'we', 'us', 'our', 'ours', 'ourselves',
  'they', 'them', 'their', 'theirs', 'themselves',
  'who', 'whom', 'whose', 'which', 'what', 'this', 'that', 'these', 'those',
  // Auxiliary / modal verbs
  'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'having',
  'do', 'does', 'did',
  'will', 'would', 'shall', 'should',
  'can', 'could', 'may', 'might', 'must',
  // Common adverbs
  'not', 'no', 'very', 'just', 'also', 'too', 'only', 'even',
  'now', 'here', 'there', 'where', 'how', 'why',
  'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other',
  'some', 'any', 'such', 'as',
  // Other function words
  'yes', 'well', 'oh', 'ok', 'like',
]);

function isConceptWord(word) {
  const clean = word.replace(/[^a-zA-Z]/g, '').toLowerCase();
  if (!clean || clean.length < 2) return false;
  return !STOP_WORDS.has(clean);
}

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const WordNode = ({ word }) => {
  const [imageUrl, setImageUrl] = useState(null);
  const debouncedWord = useDebounce(word, 400);
  const isConcept = isConceptWord(word);

  useEffect(() => {
    if (!isConcept) {
      setImageUrl(null);
      return;
    }

    const cleanWord = debouncedWord.replace(/[^a-zA-Z0-9]/g, '');
    if (!cleanWord) {
      setImageUrl(null);
      return;
    }

    let isMounted = true;

    const fetchImage = async () => {
      if (!PEXELS_API_KEY) return;
      try {
        const response = await axios.get(
          `https://api.pexels.com/v1/search?query=${encodeURIComponent(cleanWord)}&per_page=1`,
          { headers: { Authorization: PEXELS_API_KEY } }
        );

        if (isMounted && response.data.photos && response.data.photos.length > 0) {
          setImageUrl(response.data.photos[0].src.medium);
        } else if (isMounted) {
          setImageUrl(null);
        }
      } catch (error) {
        console.error('Error fetching image:', error);
      }
    };

    fetchImage();

    return () => {
      isMounted = false;
    };
  }, [debouncedWord, isConcept]);

  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      {/* Text layer */}
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

      {/* Image layer behind the text */}
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
};

const WritingInterface = () => {
  const [text, setText] = useState('');
  const contentEditableRef = useRef(null);

  // Auto-focus on mount so user can start typing immediately
  useEffect(() => {
    if (contentEditableRef.current) {
      contentEditableRef.current.focus();
    }
  }, []);

  const handleInput = (e) => {
    setText(e.target.innerText || '');
  };

  const handleContainerClick = () => {
    if (contentEditableRef.current) {
      contentEditableRef.current.focus();
    }
  };

  const tokens = text.split(/(\s+)/);

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
      {/* Invisible contentEditable for typing */}
      <div
        ref={contentEditableRef}
        contentEditable
        onInput={handleInput}
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
          color: 'transparent',
          caretColor: 'black',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          letterSpacing: '-0.02em',
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
          if (/^\s+$/.test(token)) {
            if (token.includes('\n')) {
              return (
                <span key={index}>
                  {token.split('\n').map((_, i, arr) =>
                    i === arr.length - 1 ? null : <br key={i} />
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
};

export default function App() {
  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '80px 60px' }}>
      <WritingInterface />
    </div>
  );
}
