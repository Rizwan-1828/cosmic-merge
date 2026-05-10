import { useRef, useEffect } from 'react';

const NightSkyCanvas = ({ onComplete }) => {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Resize handler
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    
    // Background Stars
    const stars = [];
    const numStars = 400;
    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        radius: Math.random() * 1.5,
        alpha: Math.random(),
        twinkleSpeed: Math.random() * 0.02 + 0.005
      });
    }

    // Constellation Points (Heart)
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2 - 50; // offset a bit higher to leave room for text
    const scale = Math.min(window.innerWidth, window.innerHeight) / 4;
    
    // Heart parametric equation points
    const constellationPoints = [];
    const numPoints = 12;
    for (let i = 0; i < numPoints; i++) {
      const t = (i * 2 * Math.PI) / numPoints;
      // Inverted Y because canvas Y goes down
      const x = centerX + scale * 0.05 * (16 * Math.pow(Math.sin(t), 3));
      const y = centerY - scale * 0.05 * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
      
      constellationPoints.push({
        id: i,
        x,
        y,
        radius: 5
      });
    }

    let connections = []; // {from: id, to: id}
    let isDrawing = false;
    let currentLine = null; // {startX, startY, endX, endY}
    let lastPointId = null;
    let completed = false;
    
    // Event listeners
    const getPointerPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    };

    const getHoveredPoint = (x, y) => {
      return constellationPoints.find(p => {
        const dx = p.x - x;
        const dy = p.y - y;
        return Math.sqrt(dx * dx + dy * dy) < 25; // generous hit radius
      });
    };

    const handlePointerDown = (e) => {
      if (completed) return;
      const pos = getPointerPos(e);
      const clickedPoint = getHoveredPoint(pos.x, pos.y);
      
      if (clickedPoint) {
        isDrawing = true;
        lastPointId = clickedPoint.id;
        currentLine = { startX: clickedPoint.x, startY: clickedPoint.y, endX: pos.x, endY: pos.y };
      }
    };

    const handlePointerMove = (e) => {
      if (completed) return;
      const pos = getPointerPos(e);
      
      if (isDrawing) {
        currentLine.endX = pos.x;
        currentLine.endY = pos.y;
        
        const hoveredPoint = getHoveredPoint(pos.x, pos.y);
        if (hoveredPoint && hoveredPoint.id !== lastPointId) {
          // Check if connection already exists
          const exists = connections.some(c => 
            (c.from === lastPointId && c.to === hoveredPoint.id) || 
            (c.to === lastPointId && c.from === hoveredPoint.id)
          );
          
          if (!exists) {
            connections.push({ from: lastPointId, to: hoveredPoint.id });
            lastPointId = hoveredPoint.id;
            currentLine = { startX: hoveredPoint.x, startY: hoveredPoint.y, endX: pos.x, endY: pos.y };
            
            // Completion logic: User just needs to connect at least 10 lines
            if (connections.length >= numPoints - 1) {
              completed = true;
              isDrawing = false;
              currentLine = null;
              onComplete();
            }
          }
        }
      }
    };

    const handlePointerUp = () => {
      isDrawing = false;
      currentLine = null;
    };

    canvas.addEventListener('mousedown', handlePointerDown);
    canvas.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    canvas.addEventListener('touchstart', handlePointerDown, {passive: false});
    canvas.addEventListener('touchmove', handlePointerMove, {passive: false});
    window.addEventListener('touchend', handlePointerUp);

    // Animation Loop
    let animationFrameId;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw background stars
      stars.forEach(star => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, 2 * Math.PI);
        star.alpha += star.twinkleSpeed;
        if (star.alpha > 1 || star.alpha < 0.2) star.twinkleSpeed = -star.twinkleSpeed;
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.abs(star.alpha)})`;
        ctx.fill();
      });

      // Draw connections
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 2;
      connections.forEach(conn => {
        const p1 = constellationPoints.find(p => p.id === conn.from);
        const p2 = constellationPoints.find(p => p.id === conn.to);
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
      });
      ctx.stroke();

      // Draw current dragging line
      if (isDrawing && currentLine) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.moveTo(currentLine.startX, currentLine.startY);
        ctx.lineTo(currentLine.endX, currentLine.endY);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Draw constellation points
      constellationPoints.forEach(point => {
        // Glow effect
        ctx.beginPath();
        ctx.arc(point.x, point.y, point.radius * 3, 0, 2 * Math.PI);
        ctx.fillStyle = completed ? 'rgba(255, 105, 180, 0.3)' : 'rgba(100, 200, 255, 0.2)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(point.x, point.y, point.radius, 0, 2 * Math.PI);
        ctx.fillStyle = completed ? '#ff69b4' : '#fff'; // Pink when done
        ctx.shadowBlur = 10;
        ctx.shadowColor = completed ? '#ff69b4' : '#fff';
        ctx.fill();
        ctx.shadowBlur = 0; // reset
      });

      animationFrameId = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('mousedown', handlePointerDown);
      canvas.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      canvas.removeEventListener('touchstart', handlePointerDown);
      canvas.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
      cancelAnimationFrame(animationFrameId);
    };
  }, [onComplete]);

  return (
    <canvas 
      ref={canvasRef} 
      style={{ display: 'block', width: '100%', height: '100%', touchAction: 'none' }}
    />
  );
};

export default NightSkyCanvas;
