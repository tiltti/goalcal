'use client'

import { useEffect, useRef } from 'react'

// 8-bit pixel art sprites (each row is a line of pixels, 1 = filled)
const ALIEN_SPRITE = [
  [0,0,1,0,0,0,0,0,1,0,0],
  [0,0,0,1,0,0,0,1,0,0,0],
  [0,0,1,1,1,1,1,1,1,0,0],
  [0,1,1,0,1,1,1,0,1,1,0],
  [1,1,1,1,1,1,1,1,1,1,1],
  [1,0,1,1,1,1,1,1,1,0,1],
  [1,0,1,0,0,0,0,0,1,0,1],
  [0,0,0,1,1,0,1,1,0,0,0],
]

const SHIP_SPRITE = [
  [0,0,0,0,1,0,0,0,0],
  [0,0,0,1,1,1,0,0,0],
  [0,0,0,1,1,1,0,0,0],
  [0,1,1,1,1,1,1,1,0],
  [1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1],
]

interface Bullet {
  x: number
  y: number
  speed: number
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  size: number
}

export function SpaceInvaders() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // Game state
    const pixelSize = 4
    let alienX = canvas.width / 2
    let alienY = 60
    let alienDir = 1
    let alienSpeed = 1.5
    let alienVisible = true
    let alienRespawnTime = 0

    let shipX = canvas.width / 2
    const shipY = canvas.height - 100

    const bullets: Bullet[] = []
    const particles: Particle[] = []
    let lastShot = 0
    const shotInterval = 800

    // Alien hitbox
    const alienWidth = ALIEN_SPRITE[0].length * pixelSize
    const alienHeight = ALIEN_SPRITE.length * pixelSize

    // Draw sprite
    const drawSprite = (sprite: number[][], x: number, y: number, color: string, size: number) => {
      ctx.fillStyle = color
      const spriteWidth = sprite[0].length * size
      const startX = x - spriteWidth / 2

      for (let row = 0; row < sprite.length; row++) {
        for (let col = 0; col < sprite[row].length; col++) {
          if (sprite[row][col]) {
            ctx.fillRect(startX + col * size, y + row * size, size, size)
          }
        }
      }
    }

    // Create explosion particles
    const createExplosion = (x: number, y: number) => {
      for (let i = 0; i < 20; i++) {
        const angle = (Math.PI * 2 * i) / 20 + Math.random() * 0.5
        const speed = 2 + Math.random() * 3
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          size: 2 + Math.random() * 4
        })
      }
    }

    // Animation loop
    let animationId: number
    const animate = (timestamp: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Check if alien should respawn
      if (!alienVisible && timestamp > alienRespawnTime) {
        alienVisible = true
        alienX = Math.random() * (canvas.width - 100) + 50
      }

      // Move alien side to side
      if (alienVisible) {
        alienX += alienDir * alienSpeed
        if (alienX > canvas.width - 50 || alienX < 50) {
          alienDir *= -1
        }
      }

      // Ship follows alien slowly
      const shipTargetX = alienX + Math.sin(timestamp / 1000) * 30
      shipX += (shipTargetX - shipX) * 0.02

      // Shoot bullets periodically
      if (timestamp - lastShot > shotInterval) {
        bullets.push({
          x: shipX,
          y: shipY - 20,
          speed: 5
        })
        lastShot = timestamp
      }

      // Update and draw bullets
      for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].y -= bullets[i].speed

        // Remove bullets that are off screen
        if (bullets[i].y < 0) {
          bullets.splice(i, 1)
          continue
        }

        // Check collision with alien
        if (alienVisible) {
          const bulletX = bullets[i].x
          const bulletY = bullets[i].y
          const alienLeft = alienX - alienWidth / 2
          const alienRight = alienX + alienWidth / 2
          const alienTop = alienY
          const alienBottom = alienY + alienHeight

          if (bulletX > alienLeft && bulletX < alienRight &&
              bulletY > alienTop && bulletY < alienBottom) {
            // Hit!
            createExplosion(alienX, alienY + alienHeight / 2)
            alienVisible = false
            alienRespawnTime = timestamp + 2000 // Respawn after 2 seconds
            bullets.splice(i, 1)
            continue
          }
        }

        // Draw bullet (8-bit style)
        ctx.fillStyle = '#22c55e'
        ctx.fillRect(bullets[i].x - 2, bullets[i].y, 4, 12)
        ctx.fillStyle = '#4ade80'
        ctx.fillRect(bullets[i].x - 1, bullets[i].y + 2, 2, 8)
      }

      // Update and draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.1 // gravity
        p.life -= 0.02

        if (p.life <= 0) {
          particles.splice(i, 1)
          continue
        }

        // Draw particle
        ctx.fillStyle = `rgba(239, 68, 68, ${p.life * 0.5})`
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size)
      }

      // Draw alien (green tint)
      if (alienVisible) {
        drawSprite(ALIEN_SPRITE, alienX, alienY, 'rgba(34, 197, 94, 0.3)', pixelSize)
      }

      // Draw ship (emerald)
      drawSprite(SHIP_SPRITE, shipX, shipY, 'rgba(16, 185, 129, 0.25)', pixelSize)

      animationId = requestAnimationFrame(animate)
    }

    animationId = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.6 }}
    />
  )
}
