import { useState, useCallback, useRef } from 'react';
import CameraView from './components/CameraView';
import TranscriptPanel from './components/TranscriptPanel';
import RecordButton from './components/RecordButton';
import useCamera from './hooks/useCamera';
import useFaceDetection from './hooks/useFaceDetection';
import useClipRecorder from './hooks/useClipRecorder';
import './App.css';

export default function App() {
  const { videoRef, cameraReady, error } = useCamera();
  const {
    modelsLoaded,
    faces,
    selectedFaceIndex,
    selectedFaceBox,
    selectFace,
    startDetection,
    stopDetection,
  } = useFaceDetection(videoRef);

  const [transcripts, setTranscripts] = useState([]);
  const [pendingClips, setPendingClips] = useState(0);
  const clipOrderRef = useRef(0);
  const pendingResultsRef = useRef(new Map());
  const nextDisplayIndexRef = useRef(0);

  // Flush any results that are ready in order
  const flushResults = useCallback(() => {
    const pending = pendingResultsRef.current;
    while (pending.has(nextDisplayIndexRef.current)) {
      const text = pending.get(nextDisplayIndexRef.current);
      pending.delete(nextDisplayIndexRef.current);
      if (text) {
        setTranscripts((prev) => [...prev, text]);
      }
      nextDisplayIndexRef.current += 1;
    }
  }, []);

  // Convert blob to base64 data URI
  const blobToDataUri = useCallback((blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }, []);

  // Poll a prediction until it completes or fails
  const pollPrediction = useCallback(async (predictionId) => {
    const maxAttempts = 60; // ~5 minutes at 5s intervals
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((r) => setTimeout(r, 5000));
      const res = await fetch(`/api/prediction/${predictionId}`);
      if (!res.ok) throw new Error('Poll failed');
      const data = await res.json();
      if (data.status === 'succeeded') return data.transcript;
      if (data.status === 'failed') throw new Error('Prediction failed');
    }
    throw new Error('Prediction timed out');
  }, []);

  const handleClipReady = useCallback(
    async (blob) => {
      const clipIndex = clipOrderRef.current;
      clipOrderRef.current += 1;
      setPendingClips((n) => n + 1);

      try {
        // Convert video blob to base64 data URI
        const dataUri = await blobToDataUri(blob);

        // Start async prediction
        const res = await fetch('/api/transcribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ video: dataUri }),
        });

        if (!res.ok) throw new Error('API error');

        const { id } = await res.json();

        // Poll until result is ready
        const transcript = await pollPrediction(id);
        const text =
          typeof transcript === 'string'
            ? transcript
            : JSON.stringify(transcript);

        pendingResultsRef.current.set(clipIndex, text.trim() || null);
      } catch {
        // Skip failed clips silently
        pendingResultsRef.current.set(clipIndex, null);
      } finally {
        setPendingClips((n) => n - 1);
        flushResults();
      }
    },
    [flushResults, blobToDataUri, pollPrediction]
  );

  const { isRecording, startRecording, stopRecording } = useClipRecorder({
    videoRef,
    selectedFaceBox,
    onClipReady: handleClipReady,
  });

  // Start face detection once camera is ready
  const detectionStarted = useRef(false);
  if (cameraReady && modelsLoaded && !detectionStarted.current) {
    detectionStarted.current = true;
    startDetection();
  }

  const handleRecord = () => {
    startRecording();
  };

  const handleStop = () => {
    stopRecording();
  };

  const handleClear = () => {
    setTranscripts([]);
    clipOrderRef.current = 0;
    pendingResultsRef.current.clear();
    nextDisplayIndexRef.current = 0;
  };

  const canRecord = cameraReady && modelsLoaded && selectedFaceIndex !== null;

  if (error) {
    return (
      <div className="app">
        <div className="error-screen">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Face Off</h1>
        <span className="subtitle">Lip Reading AI</span>
      </header>

      <main className="app-main">
        <CameraView
          videoRef={videoRef}
          faces={faces}
          selectedFaceIndex={selectedFaceIndex}
          onSelectFace={selectFace}
          isRecording={isRecording}
        />

        <div className="controls">
          {!cameraReady || !modelsLoaded ? (
            <p className="status-text">Loading camera and face detection...</p>
          ) : selectedFaceIndex === null ? (
            <p className="status-text">Tap a face to select it</p>
          ) : null}

          <RecordButton
            isRecording={isRecording}
            onStart={handleRecord}
            onStop={handleStop}
            disabled={!canRecord}
          />
        </div>

        <TranscriptPanel
          transcripts={transcripts}
          isProcessing={isRecording || pendingClips > 0}
          onClear={handleClear}
        />
      </main>
    </div>
  );
}
