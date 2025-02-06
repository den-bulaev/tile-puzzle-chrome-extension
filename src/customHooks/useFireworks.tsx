export const useFireworks = (
  fireworkCanvasRef: React.MutableRefObject<HTMLCanvasElement | null>
): {
  launchFireworks: () => void;
  stopFireworks: () => void;
} | null => {
  let animationFrame: number | null = null;
  let timer: number | null = null;

  if (!fireworkCanvasRef.current) {
    return null;
  }

  const ctx = fireworkCanvasRef.current.getContext("2d");

  if (!ctx) {
    return null;
  }

  type Particle = {
    x: number;
    y: number;
    color: string;
    size: number;
    speedX: number;
    speedY: number;
    alpha: number;
  };

  const particles: Particle[] = [];

  function createFirework(x: number, y: number) {
    const colors = ["red", "blue", "yellow", "green", "purple", "orange"];
    const numParticles = 50;

    for (let i = 0; i < numParticles; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 2;
      particles.push({
        x,
        y,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 2,
        speedX: Math.cos(angle) * speed,
        speedY: Math.sin(angle) * speed,
        alpha: 1,
      });
    }
  }

  function animate() {
    ctx!.fillStyle = "rgba(0, 0, 0, 0.2)";
    ctx!.fillRect(
      0,
      0,
      fireworkCanvasRef.current!.width,
      fireworkCanvasRef.current!.height
    );

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.speedX;
      p.y += p.speedY;
      p.alpha -= 0.02;

      ctx!.globalAlpha = p.alpha;
      ctx!.beginPath();
      ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx!.fillStyle = p.color;
      ctx!.fill();

      if (p.alpha <= 0) particles.splice(i, 1);
    }

    animationFrame = requestAnimationFrame(animate);
  }

  function randomFirework() {
    if (timer) {
      clearTimeout(timer);
    }

    createFirework(
      Math.random() * fireworkCanvasRef.current!.width,
      Math.random() * fireworkCanvasRef.current!.height
    );
    timer = setTimeout(randomFirework, Math.random() * 1000);
  }

  const launchFireworks = () => {
    animate();
    randomFirework();
    fireworkCanvasRef.current!.style.visibility = "visible";
    fireworkCanvasRef.current!.style.zIndex = "1";
  };

  const stopFireworks = () => {
    if (!animationFrame) {
      return;
    }

    cancelAnimationFrame(animationFrame);
    animationFrame = null;

    fireworkCanvasRef.current!.style.visibility = "hidden";
    fireworkCanvasRef.current!.style.zIndex = "-1";
    ctx.clearRect(
      0,
      0,
      +fireworkCanvasRef.current!.style.width,
      +fireworkCanvasRef.current!.style.height
    );
  };

  return {
    launchFireworks,
    stopFireworks,
  };
};
