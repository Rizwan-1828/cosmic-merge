import Matter from 'matter-js';

const TIERS = [
  { radius: 15, color: '#ffb3ba', score: 2 },   // Pastel Pink
  { radius: 25, color: '#ffdfba', score: 4 },   // Pastel Orange
  { radius: 35, color: '#ffffba', score: 8 },   // Pastel Yellow
  { radius: 45, color: '#baffc9', score: 16 },  // Pastel Green
  { radius: 60, color: '#bae1ff', score: 32 },  // Pastel Blue
  { radius: 80, color: '#d4a5a5', score: 64 },  // Dusty Rose
  { radius: 100, color: '#9b5de5', score: 128 },// Purple
  { radius: 130, color: '#ffffff', score: 256 },// White
];

export const GAME_WIDTH = 400; 
export const GAME_HEIGHT = 700; 

export class GameEngine {
  constructor(canvasElement, onScoreUpdate, onGameOver, onMerge, onWhiteOrb) {
    this.canvas = canvasElement;
    this.onScoreUpdate = onScoreUpdate;
    this.onGameOver = onGameOver;
    this.onMerge = onMerge;
    this.onWhiteOrb = onWhiteOrb;
    this.score = 0;
    this.isGameOver = false;

    // Setup Matter.js
    this.engine = Matter.Engine.create();
    this.render = Matter.Render.create({
      canvas: this.canvas,
      engine: this.engine,
      options: {
        width: GAME_WIDTH,
        height: GAME_HEIGHT,
        wireframes: false,
        background: 'transparent',
      }
    });

    this.runner = Matter.Runner.create();
    
    // Create boundaries
    const wallOptions = { isStatic: true, render: { fillStyle: 'rgba(255, 255, 255, 0.1)' } };
    // Make ground visible and raise it so orbs don't fall off the screen
    const ground = Matter.Bodies.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 10, GAME_WIDTH, 40, {
      isStatic: true,
      render: { fillStyle: 'rgba(255, 255, 255, 0.2)' }
    });
    const leftWall = Matter.Bodies.rectangle(-25, GAME_HEIGHT / 2, 50, GAME_HEIGHT * 2, wallOptions);
    const rightWall = Matter.Bodies.rectangle(GAME_WIDTH + 25, GAME_HEIGHT / 2, 50, GAME_HEIGHT * 2, wallOptions);
    
    // Visual line for game over
    const lineY = 120;
    this.dangerLine = Matter.Bodies.rectangle(GAME_WIDTH / 2, lineY, GAME_WIDTH, 4, {
      isStatic: true,
      isSensor: true,
      render: { fillStyle: 'rgba(255, 105, 180, 0.5)' } // Cute pink danger line
    });

    Matter.World.add(this.engine.world, [ground, leftWall, rightWall, this.dangerLine]);

    // Collision Logic (Merging)
    Matter.Events.on(this.engine, 'collisionStart', this.handleCollisions.bind(this));
    
    // Game Over Logic (Check every tick)
    Matter.Events.on(this.engine, 'afterUpdate', this.checkGameOver.bind(this));

    this.start();
  }

  start() {
    Matter.Render.run(this.render);
    Matter.Runner.run(this.runner, this.engine);
  }

  stop() {
    Matter.Render.stop(this.render);
    Matter.Runner.stop(this.runner);
    Matter.Engine.clear(this.engine);
  }

  checkGameOver() {
    if (this.isGameOver) return;
    
    const bodies = Matter.Composite.allBodies(this.engine.world);
    const now = Date.now();
    
    for (let body of bodies) {
      if (body.label === 'Orb') {
        if (now - body.createdAt > 1500) {
          if (body.position.y - body.circleRadius < 120 && body.speed < 1) {
            this.triggerGameOver();
            break;
          }
        }
      }
    }
  }

  handleCollisions(event) {
    if (this.isGameOver) return;

    const pairs = event.pairs;
    const bodiesToRemove = [];
    const bodiesToAdd = [];

    pairs.forEach(pair => {
      const bodyA = pair.bodyA;
      const bodyB = pair.bodyB;

      if (bodyA.label === 'Orb' && bodyB.label === 'Orb') {
        if (bodyA.tier === bodyB.tier && bodyA.tier < TIERS.length - 1) {
          if (!bodiesToRemove.includes(bodyA) && !bodiesToRemove.includes(bodyB)) {
            bodiesToRemove.push(bodyA, bodyB);

            const nextTier = bodyA.tier + 1;
            this.score += TIERS[nextTier].score;
            this.onScoreUpdate(this.score);

            const midX = (bodyA.position.x + bodyB.position.x) / 2;
            const midY = (bodyA.position.y + bodyB.position.y) / 2;

            if (this.onMerge) this.onMerge(midX, midY, nextTier);
            if (nextTier === TIERS.length - 1 && this.onWhiteOrb) {
              this.onWhiteOrb();
            }

            const newOrb = this.createOrb(midX, midY, nextTier);
            bodiesToAdd.push(newOrb);
          }
        }
      }
    });

    if (bodiesToRemove.length > 0) {
      Matter.World.remove(this.engine.world, bodiesToRemove);
      Matter.World.add(this.engine.world, bodiesToAdd);
    }
  }

  createOrb(x, y, tierIndex) {
    const tier = TIERS[tierIndex];
    const safeX = Math.max(tier.radius, Math.min(GAME_WIDTH - tier.radius, x));
    
    return Matter.Bodies.circle(safeX, y, tier.radius, {
      label: 'Orb',
      tier: tierIndex,
      createdAt: Date.now(), 
      restitution: 0.45, // Bouncier for cute effect!
      friction: 0.05, // Slippery so they fall into place
      density: 0.001 * (tierIndex + 1), 
      render: {
        fillStyle: tier.color,
        strokeStyle: tierIndex === TIERS.length - 1 ? '#ff69b4' : '#ffffff', // Pink stroke for white orb
        lineWidth: tierIndex === TIERS.length - 1 ? 4 : 2
      }
    });
  }

  dropOrb(x, tierIndex) {
    if (this.isGameOver) return;
    const tier = TIERS[tierIndex];
    const safeX = Math.max(tier.radius, Math.min(GAME_WIDTH - tier.radius, x));
    const orb = this.createOrb(safeX, 30, tierIndex);
    Matter.World.add(this.engine.world, orb);
  }

  triggerGameOver() {
    this.isGameOver = true;
    this.onGameOver(this.score);
  }
}

export { TIERS };
