import { useRef, useState, useCallback, useEffect } from 'react';

const CLIP_DURATION = 12000; // 12 seconds per clip
const FRAME_RATE = 25;

export default function useClipRecorder({ videoRef, selectedFaceBox, onClipReady }) {
  const [isRecording, setIsRecording] = useState(false);
  const canvasRef = useRef(document.createElement('canvas'));
  const intervalRef = useRef(null);
  const recorderRef = useRef(null);
  const clipTimerRef = useRef(null);
  const isRecordingRef = useRef(false);
  const faceBoxRef = useRef(selectedFaceBox);
  const onClipReadyRef = useRef(onClipReady);

  // Keep refs in sync with latest props
  useEffect(() => {
    faceBoxRef.current = selectedFaceBox;
  }, [selectedFaceBox]);

  useEffect(() => {
    onClipReadyRef.current = onClipReady;
  }, [onClipReady]);

  const stopCurrentClip = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (clipTimerRef.current) {
      clearTimeout(clipTimerRef.current);
      clipTimerRef.current = null;
    }
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
      recorderRef.current = null;
    }
  }, []);

  const startClipRecording = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Determine initial crop region — use selected face or full frame
    const box = faceBoxRef.current;
    let fallbackSx = 0,
      fallbackSy = 0,
      fallbackSw = video.videoWidth,
      fallbackSh = video.videoHeight;

    if (box) {
      const padX = box.width * 0.3;
      const padY = box.height * 0.3;
      fallbackSx = Math.max(0, box.x - padX);
      fallbackSy = Math.max(0, box.y - padY);
      fallbackSw = Math.min(video.videoWidth - fallbackSx, box.width + padX * 2);
      fallbackSh = Math.min(video.videoHeight - fallbackSy, box.height + padY * 2);
    }

    // Output at a reasonable size
    const outW = 320;
    const outH = Math.round((fallbackSh / fallbackSw) * outW);
    canvas.width = outW;
    canvas.height = outH;

    const stream = canvas.captureStream(FRAME_RATE);
    const recorder = new MediaRecorder(stream, {
      mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm',
      videoBitsPerSecond: 500000,
    });

    const chunks = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      if (chunks.length > 0) {
        const blob = new Blob(chunks, { type: 'video/webm' });
        onClipReadyRef.current(blob);
      }
    };

    // Draw frames to canvas at specified rate, reading live face position from ref
    intervalRef.current = setInterval(() => {
      const v = videoRef.current;
      if (!v || v.readyState < 2) return;

      const currentBox = faceBoxRef.current;
      let sx, sy, sw, sh;
      if (currentBox) {
        const px = currentBox.width * 0.3;
        const py = currentBox.height * 0.3;
        sx = Math.max(0, currentBox.x - px);
        sy = Math.max(0, currentBox.y - py);
        sw = Math.min(v.videoWidth - sx, currentBox.width + px * 2);
        sh = Math.min(v.videoHeight - sy, currentBox.height + py * 2);
      } else {
        sx = fallbackSx;
        sy = fallbackSy;
        sw = fallbackSw;
        sh = fallbackSh;
      }

      ctx.drawImage(v, sx, sy, sw, sh, 0, 0, outW, outH);
    }, 1000 / FRAME_RATE);

    recorder.start();
    recorderRef.current = recorder;

    // Stop after CLIP_DURATION and start a new clip
    clipTimerRef.current = setTimeout(() => {
      stopCurrentClip();
      if (isRecordingRef.current) {
        startClipRecording();
      }
    }, CLIP_DURATION);
  }, [videoRef, stopCurrentClip]);

  const startRecording = useCallback(() => {
    setIsRecording(true);
    isRecordingRef.current = true;
    startClipRecording();
  }, [startClipRecording]);

  const stopRecording = useCallback(() => {
    setIsRecording(false);
    isRecordingRef.current = false;
    stopCurrentClip();
  }, [stopCurrentClip]);

  useEffect(() => {
    return () => {
      isRecordingRef.current = false;
      stopCurrentClip();
    };
  }, [stopCurrentClip]);

  return { isRecording, startRecording, stopRecording };
}
