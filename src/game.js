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
    HIT_STUN_DURATION: 20,
    HIT_STUN_KNOCKBACK: 8,
    CLASH_KNOCKBACK: 10,
    
    // Gun (DISABLED for now)
    GUN_ENABLED: false,
    BULLET_SPEED: 10,
    BULLET_COUNT: 3,
    GUN_COOLDOWN: 20,
    
    // AI
    AI_REACTION_TIME: 15,
    AI_AGGRESSION: 0.5,
    AI_WANDER_CHANCE: 0.3,
    AI_IDLE_TIME: 60,
    
    // Game
    KILLS_TO_WIN: 5,
    RESPAWN_TIME: 60,
    
    // Hit Stop
    HIT_STOP_DURATION: 18, // ~0.3 seconds at 60fps
    CLASH_HIT_STOP_DURATION: 9, // ~0.15 seconds at 60fps
    
    // Multi-enemy
    ENEMY_COUNT: 3,
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
    blood: '#c00',
    bloodLight: '#f33',
};

// =============================================================================
// SPRITES & ASSETS
// =============================================================================

const ASSETS = {
    loaded: false,
    background: null,
    tiles: null,
};

function loadAssets() {
    let loadCount = 0;
    const totalAssets = 2;
    
    function onLoad() {
        loadCount++;
        if (loadCount >= totalAssets) {
            ASSETS.loaded = true;
            console.log('All assets loaded!');
        }
    }
    
    ASSETS.background = new Image();
    ASSETS.background.onload = onLoad;
    ASSETS.background.onerror = onLoad; // Continue even if fails
    ASSETS.background.src = 'assets/bg-dojo.png';
    
    ASSETS.tiles = new Image();
    ASSETS.tiles.onload = onLoad;
    ASSETS.tiles.onerror = onLoad;
    ASSETS.tiles.src = 'assets/tiles-wood.png';
}

// =============================================================================
// SOUND SYSTEM
// =============================================================================

const AUDIO = {
    ctx: null,
    initialized: false,
    music: null,
    musicGain: null,
    muted: false,
    volume: 0.5,
};

function initAudio() {
    if (AUDIO.initialized) return;
    AUDIO.ctx = new (window.AudioContext || window.webkitAudioContext)();
    AUDIO.initialized = true;
    
    // Start background music
    startBackgroundMusic();
}

function startBackgroundMusic() {
    if (AUDIO.music) return; // Already playing
    
    AUDIO.music = new Audio('assets/music-bg.mp3');
    AUDIO.music.loop = true;
    AUDIO.music.volume = AUDIO.muted ? 0 : AUDIO.volume;
    
    // Play (may be blocked by autoplay policy, but we init on keypress so should be fine)
    AUDIO.music.play().catch(e => {
        console.log('Music autoplay blocked, will start on interaction');
    });
}

function setMusicVolume(vol) {
    AUDIO.volume = Math.max(0, Math.min(1, vol));
    if (AUDIO.music && !AUDIO.muted) {
        AUDIO.music.volume = AUDIO.volume;
    }
    // Update slider
    document.getElementById('volume-slider').value = AUDIO.volume * 100;
}

function toggleMute() {
    AUDIO.muted = !AUDIO.muted;
    if (AUDIO.music) {
        AUDIO.music.volume = AUDIO.muted ? 0 : AUDIO.volume;
    }
    // Update button
    document.getElementById('mute-btn').textContent = AUDIO.muted ? '🔇' : '🔊';
}

// Setup audio controls
function setupAudioControls() {
    const muteBtn = document.getElementById('mute-btn');
    const volumeSlider = document.getElementById('volume-slider');
    
    muteBtn.addEventListener('click', () => {
        // Initialize audio if not yet (first interaction)
        if (!AUDIO.initialized) initAudio();
        toggleMute();
    });
    
    volumeSlider.addEventListener('input', (e) => {
        // Initialize audio if not yet
        if (!AUDIO.initialized) initAudio();
        setMusicVolume(e.target.value / 100);
    });
    
    // Set initial slider value
    volumeSlider.value = AUDIO.volume * 100;
}

// Metallic clash sound - sword on sword
function playClashSound() {
    if (!AUDIO.ctx) initAudio();
    const ctx = AUDIO.ctx;
    const now = ctx.currentTime;
    
    // High metallic ring
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1200, now);
    osc1.frequency.exponentialRampToValueAtTime(800, now + 0.15);
    gain1.gain.setValueAtTime(0.4, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    osc1.connect(gain1).connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.2);
    
    // Harsh impact layer
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(400, now);
    osc2.frequency.exponentialRampToValueAtTime(100, now + 0.08);
    gain2.gain.setValueAtTime(0.2, now);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    osc2.connect(gain2).connect(ctx.destination);
    osc2.start(now);
    osc2.stop(now + 0.1);
    
    // Noise burst for impact
    const bufferSize = ctx.sampleRate * 0.05;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const noise = ctx.createBufferSource();
    const noiseGain = ctx.createGain();
    noise.buffer = buffer;
    noiseGain.gain.setValueAtTime(0.15, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
    noise.connect(noiseGain).connect(ctx.destination);
    noise.start(now);
}

// Death sound - dramatic slice
function playDeathSound() {
    if (!AUDIO.ctx) initAudio();
    const ctx = AUDIO.ctx;
    const now = ctx.currentTime;
    
    // Low thud
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(80, now);
    osc1.frequency.exponentialRampToValueAtTime(40, now + 0.3);
    gain1.gain.setValueAtTime(0.5, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    osc1.connect(gain1).connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.3);
    
    // Slice whoosh
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(600, now);
    osc2.frequency.exponentialRampToValueAtTime(150, now + 0.15);
    gain2.gain.setValueAtTime(0.15, now);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    osc2.connect(gain2).connect(ctx.destination);
    osc2.start(now);
    osc2.stop(now + 0.15);
}

// =============================================================================
// PIXEL ART DRAWING FUNCTIONS
// =============================================================================

// Draw blue samurai (player)
function drawSamurai(ctx, x, y, w, h, facing, frame, stunned) {
    ctx.save();
    
    const centerX = x + w / 2;
    
    // Flip if facing left
    if (facing === -1) {
        ctx.translate(centerX, 0);
        ctx.scale(-1, 1);
        ctx.translate(-centerX, 0);
    }
    
    // Colors
    const blue = stunned ? '#fff' : '#2563eb';
    const darkBlue = stunned ? '#ccc' : '#1d4ed8';
    const skin = stunned ? '#fcc' : '#fcd5b8';
    const white = '#fff';
    
    // Animation offsets
    let legOffset = 0;
    let armOffset = 0;
    let bodyBob = 0;
    
    if (frame === 'run') {
        legOffset = Math.sin(Date.now() * 0.02) * 3;
        bodyBob = Math.abs(Math.sin(Date.now() * 0.02)) * 1;
    } else if (frame === 'jump') {
        legOffset = 2;
    }
    
    const bx = Math.floor(x);
    const by = Math.floor(y - bodyBob);
    
    // Helmet (kabuto)
    ctx.fillStyle = darkBlue;
    ctx.fillRect(bx + 2, by, w - 4, 6);
    ctx.fillRect(bx + 4, by - 2, w - 8, 3); // Helmet crest
    
    // Face
    ctx.fillStyle = skin;
    ctx.fillRect(bx + 4, by + 6, w - 8, 5);
    
    // Eyes
    ctx.fillStyle = '#000';
    ctx.fillRect(bx + 6, by + 7, 2, 2);
    
    // Body armor
    ctx.fillStyle = blue;
    ctx.fillRect(bx + 3, by + 11, w - 6, 8);
    ctx.fillStyle = darkBlue;
    ctx.fillRect(bx + 3, by + 11, w - 6, 2); // Shoulder
    
    // Legs
    ctx.fillStyle = darkBlue;
    ctx.fillRect(bx + 4, by + 19, 4, 6 + legOffset);
    ctx.fillRect(bx + w - 8, by + 19, 4, 6 - legOffset);
    
    // Sword on back (when not slashing)
    if (frame !== 'slash') {
        ctx.fillStyle = '#888';
        ctx.fillRect(bx + w - 4, by + 8, 2, 12);
        ctx.fillStyle = '#654321';
        ctx.fillRect(bx + w - 4, by + 8, 2, 3);
    }
    
    ctx.restore();
}

// Draw red oni demon (enemy)
function drawOni(ctx, x, y, w, h, facing, frame, stunned) {
    ctx.save();
    
    const centerX = x + w / 2;
    
    if (facing === -1) {
        ctx.translate(centerX, 0);
        ctx.scale(-1, 1);
        ctx.translate(-centerX, 0);
    }
    
    // Colors
    const red = stunned ? '#fff' : '#dc2626';
    const darkRed = stunned ? '#ccc' : '#991b1b';
    const yellow = stunned ? '#ffc' : '#fbbf24';
    
    let legOffset = 0;
    let bodyBob = 0;
    
    if (frame === 'run') {
        legOffset = Math.sin(Date.now() * 0.02) * 3;
        bodyBob = Math.abs(Math.sin(Date.now() * 0.02)) * 1;
    }
    
    const bx = Math.floor(x);
    const by = Math.floor(y - bodyBob);
    
    // Horns
    ctx.fillStyle = '#888';
    ctx.fillRect(bx + 2, by - 4, 3, 5);
    ctx.fillRect(bx + w - 5, by - 4, 3, 5);
    
    // Head
    ctx.fillStyle = red;
    ctx.fillRect(bx + 3, by, w - 6, 8);
    
    // Eyes (yellow glowing)
    ctx.fillStyle = yellow;
    ctx.fillRect(bx + 5, by + 3, 3, 2);
    ctx.fillRect(bx + w - 8, by + 3, 3, 2);
    
    // Fangs
    ctx.fillStyle = '#fff';
    ctx.fillRect(bx + 6, by + 7, 2, 2);
    ctx.fillRect(bx + w - 8, by + 7, 2, 2);
    
    // Body
    ctx.fillStyle = red;
    ctx.fillRect(bx + 2, by + 10, w - 4, 9);
    ctx.fillStyle = darkRed;
    ctx.fillRect(bx + 4, by + 12, w - 8, 2); // Chest shadow
    
    // Legs
    ctx.fillStyle = darkRed;
    ctx.fillRect(bx + 3, by + 19, 5, 6 + legOffset);
    ctx.fillRect(bx + w - 8, by + 19, 5, 6 - legOffset);
    
    // Tail
    ctx.fillStyle = red;
    ctx.fillRect(bx + w - 2, by + 15, 4, 3);
    ctx.fillRect(bx + w + 1, by + 17, 3, 2);
    
    ctx.restore();
}

// Draw crescent moon slash effect
function drawSlashCrescent(ctx, x, y, facing, progress) {
    ctx.save();
    ctx.translate(x, y);
    
    const alpha = 1 - progress * 0.7;
    const scale = 0.5 + progress * 0.8;
    
    ctx.scale(scale * facing, scale);
    ctx.globalAlpha = alpha;
    
    // Crescent moon slash
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 10;
    
    ctx.beginPath();
    ctx.arc(0, 0, 20, -Math.PI * 0.7, Math.PI * 0.3, false);
    ctx.stroke();
    
    // Inner bright line
    ctx.strokeStyle = '#aef';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 18, -Math.PI * 0.6, Math.PI * 0.2, false);
    ctx.stroke();
    
    ctx.restore();
}

// =============================================================================
// INPUT
// =============================================================================

const keys = {};
const keysJustPressed = {};

window.addEventListener('keydown', e => {
    if (!keys[e.code]) keysJustPressed[e.code] = true;
    keys[e.code] = true;
    // Initialize audio on first keypress (browser autoplay policy)
    if (!AUDIO.initialized) initAudio();
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
    hitStopTimer: 0, // Characters freeze but particles continue
    isClashHitStop: false, // Whether hit stop is from clash (vs death)
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
        this.w = 16;
        this.h = 26;
        this.vx = 0;
        this.vy = 0;
        this.facing = 1; // 1 = right, -1 = left
        this.color = color;
        this.isAI = isAI;
        this.currentFrame = 'idle';
        
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
        
        // Hit stun
        this.stunned = false;
        this.stunTimer = 0;
        
        // Hit stop death pending
        this.pendingDeath = false;
        this.pendingKnockbackX = 0;
        this.pendingKnockbackY = 0;
        this.killer = null;
        
        // Clash knockback pending
        this.pendingClash = false;
        this.pendingClashKnockbackX = 0;
        this.pendingClashKnockbackY = 0;
        
        // AI state
        this.aiTarget = null;
        this.aiDecisionTimer = 0;
        this.aiAction = 'idle';
        this.aiWanderDir = 1;
        this.aiIdleTimer = 0;
        this.aiPatrolTarget = null;
    }
    
    update() {
        if (!this.alive) {
            this.respawnTimer--;
            if (this.respawnTimer <= 0) this.respawn();
            return;
        }
        
        // Update stun
        if (this.stunned) {
            this.stunTimer--;
            if (this.stunTimer <= 0) {
                this.stunned = false;
            }
            // Still apply physics when stunned, but no control
            this.applyPhysics();
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
        
        // Shoot (DISABLED)
        // if (CONFIG.GUN_ENABLED && (keysJustPressed['KeyX'] || keysJustPressed['KeyK']) && this.bullets > 0 && this.gunCooldown <= 0) {
        //     this.shoot();
        // }
    }
    
    updateAI() {
        // AI always targets the human player (index 0)
        const target = state.players[0];
        if (!target || !target.alive) {
            // No target - wander
            this.aiWander();
            return;
        }
        
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        this.aiDecisionTimer--;
        if (this.aiDecisionTimer <= 0) {
            this.aiDecisionTimer = CONFIG.AI_REACTION_TIME + Math.random() * 15;
            this.makeAIDecision(target, dist);
        }
        
        // Execute current action
        switch (this.aiAction) {
            case 'idle':
                // Stand still, maybe face player
                this.aiIdleTimer--;
                if (this.aiIdleTimer <= 0) {
                    this.aiAction = Math.random() < 0.5 ? 'wander' : 'chase';
                }
                if (dist < 80) this.facing = dx > 0 ? 1 : -1;
                break;
                
            case 'wander':
                // Move in current wander direction
                this.vx = this.aiWanderDir * CONFIG.PLAYER_SPEED * 0.6;
                this.facing = this.aiWanderDir;
                
                // Change direction at walls or randomly
                if (this.x < 30 || this.wallDir === -1) this.aiWanderDir = 1;
                else if (this.x > CONFIG.WIDTH - 30 || this.wallDir === 1) this.aiWanderDir = -1;
                else if (Math.random() < 0.02) this.aiWanderDir *= -1;
                
                // Random jump while wandering
                if (this.grounded && Math.random() < 0.03) {
                    this.vy = CONFIG.PLAYER_JUMP * 0.8;
                }
                break;
                
            case 'chase':
                this.vx = Math.sign(dx) * CONFIG.PLAYER_SPEED;
                this.facing = dx > 0 ? 1 : -1;
                
                // Jump if target is above
                if (dy < -40 && this.grounded) {
                    this.vy = CONFIG.PLAYER_JUMP;
                }
                // Jump gaps
                if (this.grounded && Math.random() < 0.05) {
                    this.vy = CONFIG.PLAYER_JUMP * 0.9;
                }
                break;
                
            case 'attack':
                this.facing = dx > 0 ? 1 : -1;
                if (dist < CONFIG.SWORD_RANGE * 1.2 && this.slashCooldown <= 0) {
                    this.slash();
                    this.aiAction = 'retreat'; // Back off after attack
                    this.aiDecisionTimer = 20;
                } else if (dist < CONFIG.SWORD_RANGE * 2) {
                    // Close in for attack
                    this.vx = Math.sign(dx) * CONFIG.PLAYER_SPEED;
                }
                break;
                
            case 'retreat':
                this.vx = -Math.sign(dx) * CONFIG.PLAYER_SPEED;
                this.facing = dx > 0 ? 1 : -1; // Still face player
                if (this.grounded && Math.random() < 0.15) {
                    this.vy = CONFIG.PLAYER_JUMP * 0.7;
                }
                break;
                
            case 'dodge':
                if (this.dashCooldown <= 0) {
                    this.dashDir = Math.random() < 0.5 ? 1 : -1;
                    this.dash();
                    this.aiAction = 'idle';
                    this.aiIdleTimer = 20;
                }
                break;
        }
        
        // Wall jump if sliding
        if (this.wallSliding && Math.random() < 0.4) {
            this.vx = CONFIG.PLAYER_WALL_JUMP_X * -this.wallDir;
            this.vy = CONFIG.PLAYER_WALL_JUMP_Y;
            this.wallSliding = false;
        }
    }
    
    aiWander() {
        this.vx = this.aiWanderDir * CONFIG.PLAYER_SPEED * 0.5;
        this.facing = this.aiWanderDir;
        if (this.x < 30) this.aiWanderDir = 1;
        else if (this.x > CONFIG.WIDTH - 30) this.aiWanderDir = -1;
        else if (Math.random() < 0.01) this.aiWanderDir *= -1;
        if (this.grounded && Math.random() < 0.02) this.vy = CONFIG.PLAYER_JUMP * 0.7;
    }
    
    makeAIDecision(target, dist) {
        const dx = target.x - this.x;
        const rand = Math.random();
        
        if (dist < CONFIG.SWORD_RANGE * 1.5) {
            // Close range - attack or dodge
            if (rand < CONFIG.AI_AGGRESSION) {
                this.aiAction = 'attack';
            } else {
                this.aiAction = 'dodge';
            }
        } else if (dist < 100) {
            // Medium range - approach or wander
            if (rand < CONFIG.AI_AGGRESSION) {
                this.aiAction = 'chase';
            } else if (rand < 0.7) {
                this.aiAction = 'wander';
            } else {
                this.aiAction = 'idle';
                this.aiIdleTimer = CONFIG.AI_IDLE_TIME;
            }
        } else {
            // Far - wander or chase
            if (rand < CONFIG.AI_WANDER_CHANCE) {
                this.aiAction = 'wander';
            } else if (rand < 0.6) {
                this.aiAction = 'chase';
            } else {
                this.aiAction = 'idle';
                this.aiIdleTimer = CONFIG.AI_IDLE_TIME * 0.5;
            }
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
            
            const otherCx = other.x + other.w/2;
            const otherCy = other.y + other.h/2;
            const dist = Math.sqrt((otherCx - cx) ** 2 + (otherCy - cy) ** 2);
            
            if (dist < CONFIG.SWORD_RANGE) {
                // Check for CLASH - both players slashing
                if (other.slashing) {
                    // Clash! Store pending knockback for after hit stop
                    const knockDir = this.x < other.x ? -1 : 1;
                    this.pendingClashKnockbackX = knockDir * CONFIG.CLASH_KNOCKBACK;
                    this.pendingClashKnockbackY = -5;
                    other.pendingClashKnockbackX = -knockDir * CONFIG.CLASH_KNOCKBACK;
                    other.pendingClashKnockbackY = -5;
                    this.pendingClash = true;
                    other.pendingClash = true;
                    
                    // Clash particles - slick radial spark burst
                    const clashX = (this.x + other.x) / 2 + 8;
                    const clashY = (this.y + other.y) / 2 + 10;
                    spawnClashParticles(clashX, clashY);
                    
                    // Trigger hit stop for clash
                    state.hitStopTimer = CONFIG.CLASH_HIT_STOP_DURATION;
                    state.isClashHitStop = true;
                    
                    state.screenShake = 15;
                    
                    // Play clash sound
                    playClashSound();
                    
                    // Cancel both slashes
                    this.slashing = false;
                    other.slashing = false;
                    this.slashCooldown = CONFIG.SWORD_COOLDOWN;
                    other.slashCooldown = CONFIG.SWORD_COOLDOWN;
                } else {
                    // Hit! Apply hit stop, blood, then kill
                    const hitX = otherCx;
                    const hitY = otherCy;
                    
                    // Blood particles
                    spawnBloodParticles(hitX, hitY, 25, this.facing);
                    
                    // Store knockback for after hit stop
                    other.pendingKnockbackX = this.facing * CONFIG.HIT_STUN_KNOCKBACK;
                    other.pendingKnockbackY = -3;
                    other.pendingDeath = true;
                    other.killer = this;
                    
                    // Trigger hit stop - freeze characters
                    state.hitStopTimer = CONFIG.HIT_STOP_DURATION;
                    
                    state.screenShake = 10;
                }
            }
        }
        
        // Deflect bullets (DISABLED when gun is disabled)
        if (CONFIG.GUN_ENABLED) {
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
        playDeathSound();
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
        
        // Determine current animation frame
        if (this.slashing) {
            this.currentFrame = 'slash';
        } else if (this.stunned) {
            this.currentFrame = 'idle';
        } else if (!this.grounded) {
            this.currentFrame = 'jump';
        } else if (Math.abs(this.vx) > 0.5) {
            this.currentFrame = 'run';
        } else {
            this.currentFrame = 'idle';
        }
        
        // Draw character using procedural pixel art
        if (this.isAI) {
            drawOni(ctx, this.x, this.y, this.w, this.h, this.facing, this.currentFrame, this.stunned);
        } else {
            drawSamurai(ctx, this.x, this.y, this.w, this.h, this.facing, this.currentFrame, this.stunned);
        }
        
        // Draw crescent slash effect when slashing
        if (this.slashing) {
            const slashProgress = 1 - (this.slashTimer / CONFIG.SWORD_DURATION);
            const slashX = this.x + this.w/2 + this.facing * 20;
            const slashY = this.y + this.h/2;
            drawSlashCrescent(ctx, slashX, slashY, this.facing, slashProgress);
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

function spawnBloodParticles(x, y, count, direction) {
    for (let i = 0; i < count; i++) {
        // Blood sprays in hit direction
        const speed = 3 + Math.random() * 6;
        const angle = (direction > 0 ? 0 : Math.PI) + (Math.random() - 0.5) * 1.2;
        state.particles.push({
            x: x + (Math.random() - 0.5) * 8,
            y: y + (Math.random() - 0.5) * 8,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - Math.random() * 3,
            life: 30 + Math.random() * 30,
            color: Math.random() < 0.7 ? COLORS.blood : COLORS.bloodLight,
            size: 2 + Math.random() * 3,
            gravity: 0.3, // Blood falls faster
        });
    }
}

// Radial spark burst for sword clash
function spawnClashParticles(x, y) {
    // Bright center flash
    state.particles.push({
        x, y,
        vx: 0, vy: 0,
        life: 12,
        color: '#fff',
        size: 16,
        isFlash: true,
    });
    
    // Radial sparks shooting outward
    const sparkCount = 20;
    for (let i = 0; i < sparkCount; i++) {
        const angle = (i / sparkCount) * Math.PI * 2;
        const speed = 5 + Math.random() * 5;
        state.particles.push({
            x: x + (Math.random() - 0.5) * 4,
            y: y + (Math.random() - 0.5) * 4,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 15 + Math.random() * 10,
            color: Math.random() < 0.5 ? '#fff' : '#ffee88',
            size: 2 + Math.random() * 2,
            gravity: 0.1,
            trail: true,
        });
    }
    
    // Extra bright yellow sparks
    for (let i = 0; i < 10; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 3 + Math.random() * 8;
        state.particles.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 2,
            life: 20 + Math.random() * 15,
            color: '#fbbf24',
            size: 3,
            gravity: 0.25,
        });
    }
}

function updateParticles() {
    for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity || 0.2; // Use custom gravity if set
        p.vx *= 0.99; // Slight air resistance
        p.life--;
        if (p.life <= 0) state.particles.splice(i, 1);
    }
}

function drawParticles(ctx) {
    for (const p of state.particles) {
        ctx.globalAlpha = p.life / 40;
        ctx.fillStyle = p.color;
        
        if (p.isFlash) {
            // Bright center flash - draw as circle with glow
            ctx.save();
            ctx.globalAlpha = p.life / 12;
            ctx.shadowColor = '#fff';
            ctx.shadowBlur = 20;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * (p.life / 12), 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        } else if (p.trail) {
            // Spark with trail
            ctx.fillRect(Math.floor(p.x), Math.floor(p.y), Math.floor(p.size), Math.floor(p.size));
            ctx.globalAlpha *= 0.5;
            ctx.fillRect(Math.floor(p.x - p.vx * 0.5), Math.floor(p.y - p.vy * 0.5), Math.floor(p.size * 0.7), Math.floor(p.size * 0.7));
        } else {
            ctx.fillRect(Math.floor(p.x), Math.floor(p.y), Math.floor(p.size), Math.floor(p.size));
        }
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
        const progress = 1 - (s.timer / CONFIG.SWORD_DURATION);
        drawSlashCrescent(ctx, s.x, s.y, s.dir, progress);
    }
}

// =============================================================================
// UI
// =============================================================================

function updateUI() {
    document.getElementById('p1-kills').textContent = state.roundKills[0];
    document.getElementById('p2-kills').textContent = state.roundKills[1];
    document.getElementById('round-info').textContent = `ROUND ${state.round}`;
    
    // Bullet UI (only if gun enabled)
    if (CONFIG.GUN_ENABLED) {
        const p1 = state.players[0];
        const p2 = state.players[1];
        const p1Bullets = document.getElementById('p1-bullets');
        const p2Bullets = document.getElementById('p2-bullets');
        if (p1Bullets) p1Bullets.textContent = '●'.repeat(p1?.bullets || 0) + '○'.repeat(CONFIG.BULLET_COUNT - (p1?.bullets || 0));
        if (p2Bullets) p2Bullets.textContent = '●'.repeat(p2?.bullets || 0) + '○'.repeat(CONFIG.BULLET_COUNT - (p2?.bullets || 0));
    }
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
    // Load sprite assets
    loadAssets();
    
    // Setup audio controls
    setupAudioControls();
    
    createStage();
    
    // Create player
    state.players = [
        new Player(60, CONFIG.HEIGHT - 60, false, COLORS.player1),
    ];
    
    // Spawn multiple enemies at different positions
    const enemySpawns = [
        { x: CONFIG.WIDTH - 80, y: CONFIG.HEIGHT - 60 },
        { x: CONFIG.WIDTH / 2, y: CONFIG.HEIGHT - 130 },
        { x: 80, y: CONFIG.HEIGHT - 170 },
    ];
    
    for (let i = 0; i < CONFIG.ENEMY_COUNT; i++) {
        const spawn = enemySpawns[i % enemySpawns.length];
        state.players.push(new Player(spawn.x, spawn.y, true, COLORS.player2));
    }
    
    updateUI();
    showMessage('FIGHT!', 60);
}

function update() {
    if (state.messageTimer > 0) {
        state.messageTimer--;
        if (state.messageTimer <= 0) hideMessage();
    }
    
    // Hit stop - freeze characters but keep particles going
    if (state.hitStopTimer > 0) {
        state.hitStopTimer--;
        
        // Only update particles and effects during hit stop (dramatic freeze)
        updateParticles();
        updateSlashEffects();
        
        // When hit stop ends, apply pending deaths or clash knockbacks
        if (state.hitStopTimer <= 0) {
            // Handle clash knockbacks
            if (state.isClashHitStop) {
                for (const p of state.players) {
                    if (p.pendingClash) {
                        p.vx = p.pendingClashKnockbackX;
                        p.vy = p.pendingClashKnockbackY;
                        p.pendingClash = false;
                        p.pendingClashKnockbackX = 0;
                        p.pendingClashKnockbackY = 0;
                    }
                }
                state.isClashHitStop = false;
            }
            
            // Handle deaths
            for (const p of state.players) {
                if (p.pendingDeath) {
                    // Apply knockback then die
                    p.vx = p.pendingKnockbackX;
                    p.vy = p.pendingKnockbackY;
                    p.pendingDeath = false;
                    p.die();
                    
                    // Credit the kill - player is idx 0, all AI share idx 1
                    if (p.killer) {
                        const killerIdx = p.killer.isAI ? 1 : 0;
                        state.roundKills[killerIdx]++;
                        p.killer = null;
                    }
                    updateUI();
                    checkWin();
                }
            }
        }
        
        clearJustPressed();
        return; // Skip normal updates during hit stop
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
    
    // Draw background
    if (ASSETS.loaded && ASSETS.background && ASSETS.background.complete) {
        ctx.drawImage(ASSETS.background, 0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
        // Darken slightly for contrast
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
    } else {
        // Fallback solid color
        ctx.fillStyle = COLORS.bg;
        ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
    }
    
    // Draw platforms with wood texture or fallback
    for (const p of state.platforms) {
        if (ASSETS.loaded && ASSETS.tiles && ASSETS.tiles.complete) {
            // Tile the wood texture across platform
            const pattern = ctx.createPattern(ASSETS.tiles, 'repeat');
            ctx.fillStyle = pattern;
            ctx.fillRect(p.x, p.y, p.w, p.h);
            // Dark edge for depth
            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.fillRect(p.x, p.y + p.h - 2, p.w, 2);
            // Top highlight
            ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.fillRect(p.x, p.y, p.w, 2);
        } else {
            // Fallback solid platform
            ctx.fillStyle = COLORS.platform;
            ctx.fillRect(p.x, p.y, p.w, p.h);
            ctx.fillStyle = COLORS.platformLight;
            ctx.fillRect(p.x, p.y, p.w, 2);
        }
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
