/**
 * GOD SLASH - Samurai Gunn-style arena fighter
 * Single player vs AI
 */

// =============================================================================
// CONFIGURATION
// =============================================================================

const CONFIG = {
    // Canvas (internal resolution - pixel art scale)
    WIDTH: 384,
    HEIGHT: 216,
    
    // Physics
    GRAVITY: 0.6,
    FRICTION: 0.85,
    
    // Player
    PLAYER_SPEED: 3,
    PLAYER_JUMP: -10,
    PLAYER_WALL_SLIDE: 2,
    PLAYER_WALL_JUMP_X: 6,
    PLAYER_WALL_JUMP_Y: -9,
    PLAYER_DASH_SPEED: 12,
    PLAYER_DASH_DURATION: 8,
    PLAYER_DASH_COOLDOWN: 30,
    PLAYER_FAST_FALL: 8,
    
    // Combat
    SWORD_RANGE: 24,
    SWORD_ARC: Math.PI * 0.6,
    SWORD_DURATION: 8,
    SWORD_COOLDOWN: 15,
    BULLET_SPEED: 10,
    BULLET_COUNT: 3,
    GUN_COOLDOWN: 20,
    
    // AI
    AI_REACTION_TIME: 10,
    AI_AGGRESSION: 0.7,
    
    // Game
    KILLS_TO_WIN: 5,
    RESPAWN_TIME: 60,
};

// =============================================================================
// COLORS (Pixel art palette)
// =============================================================================

const COLORS = {
    bg: '#16213e',
    platform: '#1a1a2e',
    platformLight: '#2a2a4e',
    player1: '#4af',
    player2: '#f44',
    sword: '#fff',
    bullet: '#ff0',
    particle: '#fff',
};

// =============================================================================
// INPUT
// =============================================================================

const keys = {};
const keysJustPressed = {};

window.addEventListener('keydown', e => {
    if (!keys[e.code]) keysJustPressed[e.code] = true;
    keys[e.code] = true;
});
window.addEventListener('keyup', e => keys[e.code] = false);

function clearJustPressed() {
    for (const k in keysJustPressed) delete keysJustPressed[k];
}

// =============================================================================
// GAME STATE
// =============================================================================

const state = {
    players: [],
    bullets: [],
    particles: [],
    slashEffects: [],
    platforms: [],
    screenShake: 0,
    roundKills: [0, 0],
    round: 1,
    paused: false,
    message: '',
    messageTimer: 0,
};

// =============================================================================
// STAGE
// =============================================================================

function createStage() {
    const W = CONFIG.WIDTH;
    const H = CONFIG.HEIGHT;
    
    state.platforms = [
        // Ground
        { x: 0, y: H - 16, w: W, h: 16 },
        
        // Left wall
        { x: 0, y: 0, w: 16, h: H - 16 },
        
        // Right wall
        { x: W - 16, y: 0, w: 16, h: H - 16 },
        
        // Floating platforms
        { x: 60, y: H - 70, w: 60, h: 8 },
        { x: W - 120, y: H - 70, w: 60, h: 8 },
        { x: W/2 - 40, y: H - 110, w: 80, h: 8 },
        
        // Upper platforms
        { x: 30, y: H - 150, w: 50, h: 8 },
        { x: W - 80, y: H - 150, w: 50, h: 8 },
    ];
}

// =============================================================================
// PLAYER CLASS
// =============================================================================

class Player {
    constructor(x, y, isAI = false, color = COLORS.player1) {
        this.x = x;
        this.y = y;
        this.spawnX = x;
        this.spawnY = y;
        this.w = 12;
        this.h = 20;
        this.vx = 0;
        this.vy = 0;
        this.facing = 1; // 1 = right, -1 = left
        this.color = color;
        this.isAI = isAI;
        
        // State flags
        this.grounded = false;
        this.wallSliding = false;
        this.wallDir = 0;
        this.canDoubleJump = true;
        
        // Dash
        this.dashing = false;
        this.dashTimer = 0;
        this.dashCooldown = 0;
        this.dashDir = 1;
        
        // Combat
        this.slashing = false;
        this.slashTimer = 0;
        this.slashCooldown = 0;
        this.bullets = CONFIG.BULLET_COUNT;
        this.gunCooldown = 0;
        
        // Health
        this.alive = true;
        this.respawnTimer = 0;
        
        // AI state
        this.aiTarget = null;
        this.aiDecisionTimer = 0;
        this.aiAction = 'idle';
    }
    
    update() {
        if (!this.alive) {
            this.respawnTimer--;
            if (this.respawnTimer <= 0) this.respawn();
            return;
        }
        
        // Cooldowns
        if (this.dashCooldown > 0) this.dashCooldown--;
        if (this.slashCooldown > 0) this.slashCooldown--;
        if (this.gunCooldown > 0) this.gunCooldown--;
        
        // Handle input
        if (this.isAI) {
            this.updateAI();
        } else {
            this.handleInput();
        }
        
        // Physics
        this.applyPhysics();
        
        // Update slash
        if (this.slashing) {
            this.slashTimer--;
            if (this.slashTimer <= 0) this.slashing = false;
        }
        
        // Update dash
        if (this.dashing) {
            this.dashTimer--;
            if (this.dashTimer <= 0) this.dashing = false;
        }
    }
    
    handleInput() {
        // Horizontal movement
        if (keys['ArrowLeft'] || keys['KeyA']) {
            this.vx = -CONFIG.PLAYER_SPEED;
            this.facing = -1;
        } else if (keys['ArrowRight'] || keys['KeyD']) {
            this.vx = CONFIG.PLAYER_SPEED;
            this.facing = 1;
        }
        
        // Jump
        if (keysJustPressed['ArrowUp'] || keysJustPressed['KeyW'] || keysJustPressed['Space']) {
            if (this.grounded) {
                this.vy = CONFIG.PLAYER_JUMP;
                this.grounded = false;
                this.canDoubleJump = true;
            } else if (this.wallSliding) {
                // Wall jump
                this.vx = CONFIG.PLAYER_WALL_JUMP_X * -this.wallDir;
                this.vy = CONFIG.PLAYER_WALL_JUMP_Y;
                this.wallSliding = false;
                this.facing = -this.wallDir;
            } else if (this.canDoubleJump) {
                this.vy = CONFIG.PLAYER_JUMP * 0.85;
                this.canDoubleJump = false;
            }
        }
        
        // Fast fall
        if ((keys['ArrowDown'] || keys['KeyS']) && !this.grounded) {
            this.vy = Math.max(this.vy, CONFIG.PLAYER_FAST_FALL);
        }
        
        // Dash
        if ((keysJustPressed['ShiftLeft'] || keysJustPressed['ShiftRight']) && this.dashCooldown <= 0) {
            this.dash();
        }
        
        // Sword slash
        if ((keysJustPressed['KeyZ'] || keysJustPressed['KeyJ']) && this.slashCooldown <= 0) {
            this.slash();
        }
        
        // Shoot
        if ((keysJustPressed['KeyX'] || keysJustPressed['KeyK']) && this.bullets > 0 && this.gunCooldown <= 0) {
            this.shoot();
        }
    }
    
    updateAI() {
        const target = state.players.find(p => p !== this && p.alive);
        if (!target) return;
        
        this.aiDecisionTimer--;
        if (this.aiDecisionTimer <= 0) {
            this.aiDecisionTimer = CONFIG.AI_REACTION_TIME + Math.random() * 10;
            this.makeAIDecision(target);
        }
        
        // Execute current action
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Face target
        this.facing = dx > 0 ? 1 : -1;
        
        switch (this.aiAction) {
            case 'chase':
                this.vx = Math.sign(dx) * CONFIG.PLAYER_SPEED;
                // Jump if target is above or at edge
                if ((dy < -30 || !this.grounded) && this.grounded) {
                    this.vy = CONFIG.PLAYER_JUMP;
                }
                break;
                
            case 'attack_sword':
                if (dist < CONFIG.SWORD_RANGE && this.slashCooldown <= 0) {
                    this.slash();
                } else {
                    this.vx = Math.sign(dx) * CONFIG.PLAYER_SPEED;
                }
                break;
                
            case 'attack_gun':
                if (this.bullets > 0 && this.gunCooldown <= 0 && Math.abs(dy) < 30) {
                    this.shoot();
                }
                break;
                
            case 'retreat':
                this.vx = -Math.sign(dx) * CONFIG.PLAYER_SPEED;
                if (this.grounded && Math.random() < 0.1) {
                    this.vy = CONFIG.PLAYER_JUMP;
                }
                break;
                
            case 'dodge':
                if (this.dashCooldown <= 0) {
                    this.dashDir = -Math.sign(dx);
                    this.dash();
                }
                break;
        }
        
        // Wall jump if sliding
        if (this.wallSliding && Math.random() < 0.3) {
            this.vx = CONFIG.PLAYER_WALL_JUMP_X * -this.wallDir;
            this.vy = CONFIG.PLAYER_WALL_JUMP_Y;
            this.wallSliding = false;
        }
        
        // React to incoming bullets
        for (const bullet of state.bullets) {
            if (bullet.owner === this) continue;
            const bDist = Math.sqrt((bullet.x - this.x) ** 2 + (bullet.y - this.y) ** 2);
            if (bDist < 50 && Math.random() < 0.5) {
                // Try to slash deflect
                if (this.slashCooldown <= 0) this.slash();
                else if (this.dashCooldown <= 0) {
                    this.dashDir = Math.random() < 0.5 ? 1 : -1;
                    this.dash();
                }
            }
        }
    }
    
    makeAIDecision(target) {
        const dx = target.x - this.x;
        const dist = Math.abs(dx);
        
        if (dist < CONFIG.SWORD_RANGE * 1.5) {
            // Close range - sword or dodge
            this.aiAction = Math.random() < CONFIG.AI_AGGRESSION ? 'attack_sword' : 'dodge';
        } else if (dist < 100 && this.bullets > 0) {
            // Medium range - shoot
            this.aiAction = Math.random() < CONFIG.AI_AGGRESSION ? 'attack_gun' : 'chase';
        } else {
            // Far - chase or shoot
            this.aiAction = this.bullets > 0 && Math.random() < 0.3 ? 'attack_gun' : 'chase';
        }
    }
    
    dash() {
        this.dashing = true;
        this.dashTimer = CONFIG.PLAYER_DASH_DURATION;
        this.dashCooldown = CONFIG.PLAYER_DASH_COOLDOWN;
        this.dashDir = this.facing;
        this.vx = this.dashDir * CONFIG.PLAYER_DASH_SPEED;
        this.vy = 0;
        spawnParticles(this.x, this.y + this.h/2, 5, this.color);
    }
    
    slash() {
        this.slashing = true;
        this.slashTimer = CONFIG.SWORD_DURATION;
        this.slashCooldown = CONFIG.SWORD_COOLDOWN;
        
        // Add slash effect
        state.slashEffects.push({
            x: this.x + this.w/2,
            y: this.y + this.h/2,
            dir: this.facing,
            timer: CONFIG.SWORD_DURATION,
            owner: this,
        });
        
        // Check for hits
        this.checkSlashHits();
    }
    
    checkSlashHits() {
        const cx = this.x + this.w/2 + this.facing * 10;
        const cy = this.y + this.h/2;
        
        // Hit other players
        for (const other of state.players) {
            if (other === this || !other.alive) continue;
            if (other.dashing) continue; // Dash i-frames
            
            const dist = Math.sqrt((other.x + other.w/2 - cx) ** 2 + (other.y + other.h/2 - cy) ** 2);
            if (dist < CONFIG.SWORD_RANGE) {
                other.die();
                const idx = state.players.indexOf(this);
                state.roundKills[idx]++;
                updateUI();
                checkWin();
            }
        }
        
        // Deflect bullets
        for (let i = state.bullets.length - 1; i >= 0; i--) {
            const b = state.bullets[i];
            if (b.owner === this) continue;
            
            const dist = Math.sqrt((b.x - cx) ** 2 + (b.y - cy) ** 2);
            if (dist < CONFIG.SWORD_RANGE) {
                // Reflect bullet
                b.vx = -b.vx * 1.2;
                b.vy = (Math.random() - 0.5) * 2;
                b.owner = this;
                spawnParticles(b.x, b.y, 8, COLORS.bullet);
                state.screenShake = 5;
            }
        }
    }
    
    shoot() {
        this.bullets--;
        this.gunCooldown = CONFIG.GUN_COOLDOWN;
        
        state.bullets.push({
            x: this.x + this.w/2 + this.facing * 10,
            y: this.y + this.h/2,
            vx: this.facing * CONFIG.BULLET_SPEED,
            vy: 0,
            owner: this,
        });
        
        state.screenShake = 3;
        updateUI();
    }
    
    applyPhysics() {
        // Gravity (reduced if wall sliding)
        if (!this.dashing) {
            if (this.wallSliding) {
                this.vy = Math.min(this.vy + CONFIG.GRAVITY * 0.2, CONFIG.PLAYER_WALL_SLIDE);
            } else {
                this.vy += CONFIG.GRAVITY;
            }
        }
        
        // Apply velocity
        this.x += this.vx;
        this.y += this.vy;
        
        // Friction (only when not dashing)
        if (!this.dashing && this.grounded) {
            this.vx *= CONFIG.FRICTION;
        }
        
        // Collision with platforms
        this.grounded = false;
        this.wallSliding = false;
        this.wallDir = 0;
        
        for (const p of state.platforms) {
            if (this.collides(p)) {
                // Resolve collision
                const overlapX = Math.min(this.x + this.w - p.x, p.x + p.w - this.x);
                const overlapY = Math.min(this.y + this.h - p.y, p.y + p.h - this.y);
                
                if (overlapX < overlapY) {
                    // Horizontal collision (wall)
                    if (this.x < p.x) {
                        this.x = p.x - this.w;
                        this.wallDir = 1;
                    } else {
                        this.x = p.x + p.w;
                        this.wallDir = -1;
                    }
                    this.vx = 0;
                    if (!this.grounded && this.vy > 0) {
                        this.wallSliding = true;
                    }
                } else {
                    // Vertical collision
                    if (this.y < p.y) {
                        this.y = p.y - this.h;
                        this.grounded = true;
                        this.canDoubleJump = true;
                    } else {
                        this.y = p.y + p.h;
                    }
                    this.vy = 0;
                }
            }
        }
        
        // Keep in bounds
        this.x = Math.max(0, Math.min(CONFIG.WIDTH - this.w, this.x));
    }
    
    collides(rect) {
        return this.x < rect.x + rect.w &&
               this.x + this.w > rect.x &&
               this.y < rect.y + rect.h &&
               this.y + this.h > rect.y;
    }
    
    die() {
        this.alive = false;
        this.respawnTimer = CONFIG.RESPAWN_TIME;
        spawnParticles(this.x + this.w/2, this.y + this.h/2, 20, this.color);
        state.screenShake = 10;
    }
    
    respawn() {
        this.alive = true;
        this.x = this.spawnX;
        this.y = this.spawnY;
        this.vx = 0;
        this.vy = 0;
        this.bullets = CONFIG.BULLET_COUNT;
        this.dashing = false;
        this.slashing = false;
        updateUI();
    }
    
    draw(ctx) {
        if (!this.alive) return;
        
        ctx.save();
        
        // Flash when dashing
        if (this.dashing && Math.floor(this.dashTimer / 2) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }
        
        // Body
        ctx.fillStyle = this.color;
        ctx.fillRect(Math.floor(this.x), Math.floor(this.y), this.w, this.h);
        
        // Eyes (facing direction)
        ctx.fillStyle = '#fff';
        const eyeX = this.x + this.w/2 + this.facing * 2;
        ctx.fillRect(Math.floor(eyeX), Math.floor(this.y + 4), 2, 2);
        
        // Draw sword when slashing
        if (this.slashing) {
            ctx.fillStyle = COLORS.sword;
            const swordX = this.x + this.w/2 + this.facing * 12;
            const swordY = this.y + this.h/2 - 2;
            ctx.fillRect(Math.floor(swordX), Math.floor(swordY), this.facing * 14, 4);
        }
        
        ctx.restore();
    }
}

// =============================================================================
// PARTICLES
// =============================================================================

function spawnParticles(x, y, count, color) {
    for (let i = 0; i < count; i++) {
        state.particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            life: 20 + Math.random() * 20,
            color,
            size: 2 + Math.random() * 2,
        });
    }
}

function updateParticles() {
    for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.2;
        p.life--;
        if (p.life <= 0) state.particles.splice(i, 1);
    }
}

function drawParticles(ctx) {
    for (const p of state.particles) {
        ctx.globalAlpha = p.life / 40;
        ctx.fillStyle = p.color;
        ctx.fillRect(Math.floor(p.x), Math.floor(p.y), Math.floor(p.size), Math.floor(p.size));
    }
    ctx.globalAlpha = 1;
}

// =============================================================================
// BULLETS
// =============================================================================

function updateBullets() {
    for (let i = state.bullets.length - 1; i >= 0; i--) {
        const b = state.bullets[i];
        b.x += b.vx;
        b.y += b.vy;
        
        // Check collision with players
        for (const player of state.players) {
            if (player === b.owner || !player.alive) continue;
            if (player.dashing) continue; // Dash i-frames
            
            if (b.x > player.x && b.x < player.x + player.w &&
                b.y > player.y && b.y < player.y + player.h) {
                player.die();
                const idx = state.players.indexOf(b.owner);
                state.roundKills[idx]++;
                updateUI();
                checkWin();
                state.bullets.splice(i, 1);
                break;
            }
        }
        
        // Check collision with platforms
        for (const p of state.platforms) {
            if (b.x > p.x && b.x < p.x + p.w && b.y > p.y && b.y < p.y + p.h) {
                spawnParticles(b.x, b.y, 5, COLORS.bullet);
                state.bullets.splice(i, 1);
                break;
            }
        }
        
        // Remove if out of bounds
        if (b.x < 0 || b.x > CONFIG.WIDTH || b.y < 0 || b.y > CONFIG.HEIGHT) {
            state.bullets.splice(i, 1);
        }
    }
}

function drawBullets(ctx) {
    ctx.fillStyle = COLORS.bullet;
    for (const b of state.bullets) {
        ctx.fillRect(Math.floor(b.x) - 2, Math.floor(b.y) - 2, 4, 4);
        // Trail
        ctx.globalAlpha = 0.5;
        ctx.fillRect(Math.floor(b.x - b.vx) - 1, Math.floor(b.y) - 1, 2, 2);
        ctx.globalAlpha = 1;
    }
}

// =============================================================================
// SLASH EFFECTS
// =============================================================================

function updateSlashEffects() {
    for (let i = state.slashEffects.length - 1; i >= 0; i--) {
        state.slashEffects[i].timer--;
        if (state.slashEffects[i].timer <= 0) {
            state.slashEffects.splice(i, 1);
        }
    }
}

function drawSlashEffects(ctx) {
    for (const s of state.slashEffects) {
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.strokeStyle = COLORS.sword;
        ctx.lineWidth = 2;
        ctx.globalAlpha = s.timer / CONFIG.SWORD_DURATION;
        ctx.beginPath();
        ctx.arc(0, 0, CONFIG.SWORD_RANGE, -CONFIG.SWORD_ARC/2 * s.dir, CONFIG.SWORD_ARC/2 * s.dir);
        ctx.stroke();
        ctx.restore();
    }
}

// =============================================================================
// UI
// =============================================================================

function updateUI() {
    document.getElementById('p1-kills').textContent = state.roundKills[0];
    document.getElementById('p2-kills').textContent = state.roundKills[1];
    
    const p1 = state.players[0];
    const p2 = state.players[1];
    
    document.getElementById('p1-bullets').textContent = '●'.repeat(p1?.bullets || 0) + '○'.repeat(CONFIG.BULLET_COUNT - (p1?.bullets || 0));
    document.getElementById('p2-bullets').textContent = '●'.repeat(p2?.bullets || 0) + '○'.repeat(CONFIG.BULLET_COUNT - (p2?.bullets || 0));
    document.getElementById('round-info').textContent = `ROUND ${state.round}`;
}

function showMessage(text, duration = 120) {
    state.message = text;
    state.messageTimer = duration;
    document.getElementById('message').textContent = text;
    document.getElementById('message').classList.remove('hidden');
}

function hideMessage() {
    document.getElementById('message').classList.add('hidden');
}

function checkWin() {
    for (let i = 0; i < 2; i++) {
        if (state.roundKills[i] >= CONFIG.KILLS_TO_WIN) {
            const winner = i === 0 ? 'PLAYER' : 'AI';
            showMessage(`${winner} WINS!`, 180);
            setTimeout(() => {
                state.roundKills = [0, 0];
                state.round++;
                resetRound();
            }, 3000);
        }
    }
}

function resetRound() {
    state.bullets = [];
    state.particles = [];
    for (const p of state.players) {
        p.respawn();
    }
    updateUI();
    hideMessage();
}

// =============================================================================
// MAIN LOOP
// =============================================================================

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

canvas.width = CONFIG.WIDTH;
canvas.height = CONFIG.HEIGHT;

function init() {
    createStage();
    
    // Create players
    state.players = [
        new Player(60, CONFIG.HEIGHT - 60, false, COLORS.player1),
        new Player(CONFIG.WIDTH - 80, CONFIG.HEIGHT - 60, true, COLORS.player2),
    ];
    
    updateUI();
    showMessage('FIGHT!', 60);
}

function update() {
    if (state.messageTimer > 0) {
        state.messageTimer--;
        if (state.messageTimer <= 0) hideMessage();
    }
    
    // Update players
    for (const p of state.players) p.update();
    
    // Update bullets and effects
    updateBullets();
    updateParticles();
    updateSlashEffects();
    
    // Screen shake decay
    if (state.screenShake > 0) state.screenShake *= 0.9;
    
    clearJustPressed();
}

function draw() {
    ctx.save();
    
    // Screen shake
    if (state.screenShake > 0.5) {
        ctx.translate(
            (Math.random() - 0.5) * state.screenShake,
            (Math.random() - 0.5) * state.screenShake
        );
    }
    
    // Clear
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
    
    // Draw platforms
    for (const p of state.platforms) {
        ctx.fillStyle = COLORS.platform;
        ctx.fillRect(p.x, p.y, p.w, p.h);
        // Top highlight
        ctx.fillStyle = COLORS.platformLight;
        ctx.fillRect(p.x, p.y, p.w, 2);
    }
    
    // Draw effects
    drawSlashEffects(ctx);
    drawBullets(ctx);
    drawParticles(ctx);
    
    // Draw players
    for (const p of state.players) p.draw(ctx);
    
    ctx.restore();
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

init();
gameLoop();
