import { useEffect, useRef, useState, useCallback } from 'react';
import * as faceapi from 'face-api.js';

export default function useFaceDetection(videoRef) {
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faces, setFaces] = useState([]);
  const [selectedFaceIndex, setSelectedFaceIndex] = useState(null);
  const detectIntervalRef = useRef(null);

  useEffect(() => {
    async function loadModels() {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
        setModelsLoaded(true);
      } catch (err) {
        console.error('Failed to load face detection models:', err);
      }
    }
    loadModels();
  }, []);

  const startDetection = useCallback(() => {
    if (!modelsLoaded || !videoRef.current) return;

    if (detectIntervalRef.current) {
      clearInterval(detectIntervalRef.current);
    }

    detectIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || videoRef.current.readyState < 2) return;

      try {
        const detections = await faceapi.detectAllFaces(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions({
            inputSize: 320,
            scoreThreshold: 0.5,
          })
        );

        const videoEl = videoRef.current;
        if (!videoEl) return;

        const displaySize = {
          width: videoEl.videoWidth,
          height: videoEl.videoHeight,
        };

        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        setFaces(resizedDetections.map((d) => d.box));
      } catch {
        // Silently skip detection errors
      }
    }, 300);
  }, [modelsLoaded, videoRef]);

  const stopDetection = useCallback(() => {
    if (detectIntervalRef.current) {
      clearInterval(detectIntervalRef.current);
      detectIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopDetection();
  }, [stopDetection]);

  const selectFace = useCallback((index) => {
    setSelectedFaceIndex(index);
  }, []);

  const selectedFaceBox = selectedFaceIndex !== null ? faces[selectedFaceIndex] : null;

  return {
    modelsLoaded,
    faces,
    selectedFaceIndex,
    selectedFaceBox,
    selectFace,
    startDetection,
    stopDetection,
  };
}
