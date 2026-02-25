import { useEffect, useRef } from 'react';

export default function TranscriptPanel({ transcripts, isProcessing, onClear }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcripts]);

  return (
    <div className="transcript-panel">
      <div className="transcript-header">
        <span className="transcript-title">Transcript</span>
        {transcripts.length > 0 && (
          <button className="clear-btn" onClick={onClear}>
            Clear
          </button>
        )}
      </div>

      <div className="transcript-scroll" ref={scrollRef}>
        {transcripts.length === 0 && !isProcessing && (
          <p className="transcript-placeholder">
            Tap a face and start recording to begin lip reading...
          </p>
        )}

        {transcripts.map((t, i) => (
          <p key={i} className="transcript-text fade-in">
            {t}
          </p>
        ))}

        {isProcessing && <ProcessingIndicator />}
      </div>
    </div>
  );
}

function ProcessingIndicator() {
  return (
    <div className="processing-indicator">
      <div className="waveform">
        <span className="wave-bar" style={{ animationDelay: '0s' }} />
        <span className="wave-bar" style={{ animationDelay: '0.1s' }} />
        <span className="wave-bar" style={{ animationDelay: '0.2s' }} />
        <span className="wave-bar" style={{ animationDelay: '0.3s' }} />
        <span className="wave-bar" style={{ animationDelay: '0.4s' }} />
      </div>
      <span className="processing-text">Reading lips...</span>
    </div>
  );
}
