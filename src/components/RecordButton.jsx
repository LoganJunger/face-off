export default function RecordButton({ isRecording, onStart, onStop, disabled }) {
  return (
    <button
      className={`record-btn ${isRecording ? 'recording' : ''}`}
      onClick={isRecording ? onStop : onStart}
      disabled={disabled}
      title={isRecording ? 'Stop recording' : 'Start recording'}
    >
      <span className="record-dot" />
      {isRecording ? 'Stop' : 'Record'}
    </button>
  );
}
