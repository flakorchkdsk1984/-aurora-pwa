import React, { useEffect, useRef } from 'react';

export default function CelebrationConfetti({ active }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    // Resize canvas to fill screen
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#ff007f', '#ffb703', '#fb8500', '#0284c7', '#22c55e', '#a855f7'];
    const emojis = ['🌟', '✨', '🎈', '🎉', '🍎', '🐱', '🐶', '💖'];
    const particles = [];

    // Create particles
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * -canvas.height - 20, // Start above the screen
        size: Math.random() * 8 + 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        emoji: Math.random() > 0.6 ? emojis[Math.floor(Math.random() * emojis.length)] : null,
        speedX: Math.random() * 4 - 2,
        speedY: Math.random() * 3 + 4,
        rotation: Math.random() * 360,
        rotationSpeed: Math.random() * 4 - 2
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.rotation += p.rotationSpeed;

        // If it falls off bottom, wrap to top
        if (p.y > canvas.height) {
          p.y = -20;
          p.x = Math.random() * canvas.width;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);

        if (p.emoji) {
          ctx.font = '24px serif';
          ctx.fillText(p.emoji, -12, 12);
        } else {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Stop after 4 seconds
    const timer = setTimeout(() => {
      cancelAnimationFrame(animationFrameId);
    }, 4500);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, [active]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 9999
      }}
    />
  );
}
