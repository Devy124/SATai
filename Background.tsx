import React, { useEffect, useRef } from 'react';

const Background: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false }); // Optimize for no alpha channel on base
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    
    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const particles: { x: number; y: number; r: number; opacity: number; vy: number; vx: number }[] = [];
    const particleCount = width < 768 ? 40 : 80; // Reduce count on mobile

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.5 + 0.1,
        vy: -0.1 - Math.random() * 0.3, // Constant slow upward drift
        vx: (Math.random() - 0.5) * 0.2
      });
    }

    let animationFrameId: number;

    const animate = () => {
      // Use a distinct clear color based on theme preference would be complex here, 
      // so we rely on CSS for the base background color and clear rect transparently.
      ctx.clearRect(0, 0, width, height);
      
      particles.forEach(p => {
        p.y += p.vy;
        p.x += p.vx;
        
        // Wrap around
        if (p.y < -10) p.y = height + 10;
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        // White particles, opacity handled via fillStyle
        // We assume dark mode is dominant for the 'space' feel, but this works in light mode as subtle dust.
        ctx.fillStyle = `rgba(150, 160, 200, ${p.opacity})`; 
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Deep Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-blue-50 dark:from-[#0f172a] dark:via-[#0b0f19] dark:to-[#050507] transition-colors duration-500" />

        {/* Floating Orb 1 */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-400/20 dark:bg-blue-600/10 blur-[100px] animate-pulse-slow" />
        
        {/* Floating Orb 2 */}
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-purple-400/20 dark:bg-indigo-600/10 blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }} />

        {/* Planet Graphic */}
        <div className="absolute top-[15%] right-[5%] md:right-[10%] w-32 h-32 md:w-48 md:h-48 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-400 dark:from-blue-900 dark:to-slate-800 shadow-[0_0_50px_rgba(59,130,246,0.3)] opacity-80 animate-float">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-transparent to-black/40" />
        </div>
        
        {/* Canvas for Particles */}
        <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  );
};

export default Background;