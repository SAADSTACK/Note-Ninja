
import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  stream: MediaStream | null;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ stream }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!stream || !canvasRef.current) return;

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    
    // Increase fftSize for a more detailed waveform
    analyser.fftSize = 2048;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    source.connect(analyser);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      
      // Get time domain data for the waveform (amplitude over time)
      analyser.getByteTimeDomainData(dataArray);

      const width = canvas.width;
      const height = canvas.height;
      
      // Standard clear for light background
      ctx.clearRect(0, 0, width, height);

      // Setup styling
      ctx.lineWidth = 4;
      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, '#6366f1'); // Indigo
      gradient.addColorStop(0.5, '#a855f7'); // Purple
      gradient.addColorStop(1, '#6366f1'); // Indigo
      
      ctx.strokeStyle = gradient;
      ctx.shadowBlur = 10;
      ctx.shadowColor = 'rgba(99, 102, 241, 0.2)';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();

      const sliceWidth = width * 1.0 / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        // Map 0-255 to -1 to 1
        const v = dataArray[i] / 128.0;
        const y = v * height / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();

      // Mirror effect with subtle light colors
      ctx.globalAlpha = 0.15;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = height - (v * height / 2);

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      audioContext.close();
    };
  }, [stream]);

  return (
    <div className="relative w-full flex items-center justify-center py-6">
      <div className="absolute inset-0 bg-indigo-100/30 blur-3xl rounded-full"></div>
      <canvas 
        ref={canvasRef} 
        width={800} 
        height={200} 
        className="relative w-full h-48 drop-shadow-xl"
      />
    </div>
  );
};
