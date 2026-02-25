import { useEffect, useRef } from 'react';

export default function CameraView({
  videoRef,
  faces,
  selectedFaceIndex,
  onSelectFace,
  isRecording,
}) {
  const containerRef = useRef(null);

  // Compute scaling from video coordinates to display coordinates
  function getScale() {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return { sx: 1, sy: 1 };
    const displayW = container.clientWidth;
    const displayH = container.clientHeight;
    const videoW = video.videoWidth || 1;
    const videoH = video.videoHeight || 1;
    return { sx: displayW / videoW, sy: displayH / videoH };
  }

  function handleClick(e) {
    if (faces.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const { sx, sy } = getScale();

    // Find which face was clicked
    for (let i = 0; i < faces.length; i++) {
      const box = faces[i];
      const dx = box.x * sx;
      const dy = box.y * sy;
      const dw = box.width * sx;
      const dh = box.height * sy;
      if (clickX >= dx && clickX <= dx + dw && clickY >= dy && clickY <= dy + dh) {
        onSelectFace(i);
        return;
      }
    }
  }

  const { sx, sy } = (() => {
    if (!videoRef.current || !containerRef.current) return { sx: 1, sy: 1 };
    return getScale();
  })();

  return (
    <div ref={containerRef} className="camera-container" onClick={handleClick}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="camera-video"
      />
      {/* Face overlays */}
      <FaceOverlays
        faces={faces}
        selectedFaceIndex={selectedFaceIndex}
        isRecording={isRecording}
        containerRef={containerRef}
        videoRef={videoRef}
      />
    </div>
  );
}

function FaceOverlays({ faces, selectedFaceIndex, isRecording, containerRef, videoRef }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const video = videoRef.current;
    if (!canvas || !container || !video) return;

    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const videoW = video.videoWidth || 1;
    const videoH = video.videoHeight || 1;
    const sx = canvas.width / videoW;
    const sy = canvas.height / videoH;

    faces.forEach((box, i) => {
      const x = box.x * sx;
      const y = box.y * sy;
      const w = box.width * sx;
      const h = box.height * sy;

      const isSelected = i === selectedFaceIndex;

      if (isSelected && isRecording) {
        // Pulsing ring for selected face while recording
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)';
        ctx.lineWidth = 3;
        ctx.setLineDash([]);
        const cx = x + w / 2;
        const cy = y + h / 2;
        const r = Math.max(w, h) / 2 + 8;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();

        // Inner glow
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
        ctx.stroke();
      } else if (isSelected) {
        // Static highlight for selected face
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.7)';
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        roundRect(ctx, x - 4, y - 4, w + 8, h + 8, 8);
        ctx.stroke();
      } else {
        // Tap-to-select indicator for unselected faces
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 4]);
        roundRect(ctx, x - 2, y - 2, w + 4, h + 4, 6);
        ctx.stroke();
      }
    });

    ctx.setLineDash([]);
  }, [faces, selectedFaceIndex, isRecording, containerRef, videoRef]);

  return <canvas ref={canvasRef} className="face-overlay-canvas" />;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
