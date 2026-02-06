/**
 * Animation System - Modular and Fast
 * 
 * This module handles all visual feedback animations.
 * Designed for easy overhaul later - all timing/styling in one place.
 * 
 * SPEEDRUN-FRIENDLY: All animations are very fast (50-150ms)
 * to not slow down gameplay.
 */

// ============================================
// TIMING CONFIGURATION (tweak these for feel)
// ============================================

export const ANIMATION_TIMING = {
    // Damage feedback
    DAMAGE_FLASH_MS: 100,           // How long unit flashes red
    DAMAGE_NUMBER_MS: 200,          // How long floating number visible

    // Multi-hit attacks
    MULTI_HIT_DELAY_MS: 80,         // Delay between hits (fast!)

    // AoE/targeting
    TARGET_HIGHLIGHT_MS: 100,       // Pre-damage highlight pulse

    // Status effects
    STATUS_POP_MS: 100,             // Status icon pop animation

    // Block/buff gain
    BUFF_FLASH_MS: 100,             // Self-buff indicator

    // Card animations
    CARD_DRAW_MS: 100,              // Card sliding in
    CARD_EXHAUST_MS: 100,           // Card fading out

    // Combat interaction
    ATTACK_BUMP_MS: 150,             // Unit bumps forward
    SHAKE_MS: 150,                   // Unit shakes when hit
} as const;

// ============================================
// CSS CLASS NAMES (applied/removed by React)
// ============================================

export const ANIMATION_CLASSES = {
    // Damage
    damageFlash: 'anim-damage-flash',
    damageNumber: 'anim-damage-number',

    // Targeting
    targetHighlight: 'anim-target-highlight',

    // Status
    statusPop: 'anim-status-pop',

    // Buffs
    buffGain: 'anim-buff-gain',
    blockGain: 'anim-block-gain',

    // Cards
    cardDraw: 'anim-card-draw',
    cardExhaust: 'anim-card-exhaust',

    // Combat
    attackBumpRight: 'anim-attack-bump-right',
    attackBumpLeft: 'anim-attack-bump-left',
    shake: 'anim-shake',
} as const;

// ============================================
// ANIMATION EVENTS (returned from game logic)
// ============================================

export type AnimationEventType =
    | 'damage'
    | 'block'
    | 'status_apply'
    | 'buff_gain'
    | 'card_draw'
    | 'card_exhaust'
    | 'multi_hit'
    | 'aoe_damage';

export interface AnimationEvent {
    type: AnimationEventType;
    targetId: string;           // Unit or card ID
    value?: number;             // Damage/block amount
    statusType?: string;        // For status_apply
    delay?: number;             // For staggered multi-hit
    color?: 'damage' | 'block' | 'buff' | 'debuff';
}

// ============================================
// ANIMATION STATE TRACKING
// ============================================

export interface UnitAnimationState {
    isDamageFlashing: boolean;
    isTargetHighlighted: boolean;
    floatingNumbers: FloatingNumber[];
    statusPops: string[];       // Status keys that are popping
}

export interface FloatingNumber {
    id: string;
    value: number;
    color: 'damage' | 'block' | 'buff' | 'heal';
    startTime: number;
}

// ============================================
// ANIMATION HELPERS
// ============================================

/**
 * Generate staggered delays for multi-hit attacks
 */
export function getMultiHitDelays(hitCount: number): number[] {
    const delays: number[] = [];
    for (let i = 0; i < hitCount; i++) {
        delays.push(i * ANIMATION_TIMING.MULTI_HIT_DELAY_MS);
    }
    return delays;
}

/**
 * Create a floating damage/block number
 */
export function createFloatingNumber(value: number, color: FloatingNumber['color']): FloatingNumber {
    return {
        id: `float_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        value,
        color,
        startTime: Date.now(),
    };
}

/**
 * Check if a floating number should still be visible
 */
export function isFloatingNumberVisible(num: FloatingNumber): boolean {
    return Date.now() - num.startTime < ANIMATION_TIMING.DAMAGE_NUMBER_MS;
}

/**
 * Create animation events for a multi-hit attack
 */
export function createMultiHitEvents(targetId: string, damages: number[]): AnimationEvent[] {
    return damages.map((dmg, i) => ({
        type: 'damage' as const,
        targetId,
        value: dmg,
        delay: i * ANIMATION_TIMING.MULTI_HIT_DELAY_MS,
        color: 'damage' as const,
    }));
}

/**
 * Create animation events for AoE attack
 */
export function createAoEEvents(targetIds: string[], damage: number): AnimationEvent[] {
    return targetIds.map(id => ({
        type: 'aoe_damage' as const,
        targetId: id,
        value: damage,
        color: 'damage' as const,
    }));
}

// ============================================
// CSS KEYFRAMES (inject into document once)
// ============================================

const ANIMATION_CSS = `
/* Animation System CSS - Speedrun-friendly fast timings */

@keyframes damage-flash {
    0% { filter: brightness(1); }
    50% { filter: brightness(2) saturate(2) hue-rotate(-20deg); }
    100% { filter: brightness(1); }
}

@keyframes target-highlight {
    0% { box-shadow: 0 0 0 0 rgba(255, 100, 100, 0.8); }
    50% { box-shadow: 0 0 20px 5px rgba(255, 100, 100, 0.6); }
    100% { box-shadow: 0 0 0 0 rgba(255, 100, 100, 0); }
}

@keyframes status-pop {
    0% { transform: scale(1); }
    50% { transform: scale(1.4); }
    100% { transform: scale(1); }
}

@keyframes float-up {
    0% { opacity: 1; transform: translateY(0); }
    100% { opacity: 0; transform: translateY(-30px); }
}

@keyframes buff-flash {
    0% { filter: brightness(1); }
    50% { filter: brightness(1.5) saturate(1.5); }
    100% { filter: brightness(1); }
}

@keyframes block-gain {
    0% { transform: scale(1); filter: brightness(1); }
    50% { transform: scale(1.2); filter: brightness(1.5) hue-rotate(180deg); }
    100% { transform: scale(1); filter: brightness(1); }
}

@keyframes bump-right {
    0% { transform: translateX(0) scale(1); }
    10% { transform: translateX(-10px) scale(0.95); } /* Windup */
    40% { transform: translateX(60px) scale(1.1); } /* Impact */
    100% { transform: translateX(0) scale(1); }
}

@keyframes bump-left {
    0% { transform: translateX(0) scale(1); }
    10% { transform: translateX(10px) scale(0.95); } /* Windup */
    40% { transform: translateX(-60px) scale(1.1); } /* Impact */
    100% { transform: translateX(0) scale(1); }
}

@keyframes shake {
    0% { transform: translate(0, 0) rotate(0deg); }
    10% { transform: translate(-8px, -8px) rotate(-3deg); }
    30% { transform: translate(8px, 6px) rotate(3deg); }
    50% { transform: translate(-6px, 4px) rotate(-2deg); }
    70% { transform: translate(4px, -4px) rotate(1deg); }
    90% { transform: translate(-2px, 2px) rotate(0deg); }
    100% { transform: translate(0, 0) rotate(0deg); }
}

@keyframes screen-shake {
    0% { transform: translate(0, 0); }
    10% { transform: translate(-4px, -4px); }
    30% { transform: translate(4px, 2px); }
    50% { transform: translate(-2px, 4px); }
    70% { transform: translate(2px, -2px); }
    90% { transform: translate(-1px, 1px); }
    100% { transform: translate(0, 0); }
}


@keyframes card-draw {
    0% { transform: translateY(100px) scale(0.5); opacity: 0; }
    100% { transform: translateY(0) scale(1); opacity: 1; }
}

@keyframes card-exhaust {
    0% { transform: scale(1); opacity: 1; filter: sepia(0) brightness(1); }
    100% { transform: scale(1.2) translateY(-50px); opacity: 0; filter: sepia(1) brightness(0.5); }
}

/* Applied classes */
.anim-attack-bump-right {
    animation: bump-right 200ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.anim-attack-bump-left {
    animation: bump-left 200ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.anim-shake {
    animation: shake 250ms cubic-bezier(0.36, 0.07, 0.19, 0.97);
}

.anim-screen-shake {
    animation: screen-shake 200ms ease-out;
}


.anim-card-draw {
    animation: card-draw 300ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.anim-card-exhaust {
    animation: card-exhaust 300ms ease-in forwards;
}

.${ANIMATION_CLASSES.damageFlash} {
    animation: damage-flash ${ANIMATION_TIMING.DAMAGE_FLASH_MS}ms ease-out;
}

.${ANIMATION_CLASSES.targetHighlight} {
    animation: target-highlight ${ANIMATION_TIMING.TARGET_HIGHLIGHT_MS}ms ease-out;
}

.${ANIMATION_CLASSES.statusPop} {
    animation: status-pop ${ANIMATION_TIMING.STATUS_POP_MS}ms ease-out;
}

.${ANIMATION_CLASSES.buffGain} {
    animation: buff-flash ${ANIMATION_TIMING.BUFF_FLASH_MS}ms ease-out;
}

.${ANIMATION_CLASSES.blockGain} {
    animation: block-gain ${ANIMATION_TIMING.BUFF_FLASH_MS}ms ease-out;
}

/* Floating damage number */
.floating-number {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    font-family: monospace;
    font-weight: bold;
    font-size: 1.25rem;
    text-shadow: 0 0 4px black, 0 0 2px black;
    pointer-events: none;
    z-index: 100;
    animation: float-up ${ANIMATION_TIMING.DAMAGE_NUMBER_MS}ms ease-out forwards;
}

.floating-number.damage { color: #ff6b6b; }
.floating-number.block { color: #4ecdc4; }
.floating-number.buff { color: #ffe66d; }
.floating-number.heal { color: #95e77e; }
`;

let cssInjected = false;

/**
 * Inject animation CSS into document head (call once at app startup)
 */
export function injectAnimationCSS(): void {
    if (cssInjected) return;

    const style = document.createElement('style');
    style.id = 'game-animations';
    style.textContent = ANIMATION_CSS;
    document.head.appendChild(style);
    cssInjected = true;
}

// ============================================
// REACT HOOKS HELPERS
// ============================================

/**
 * Trigger a damage flash animation on a unit
 * Returns a cleanup function to remove the class
 */
export function triggerDamageFlash(element: HTMLElement | null): (() => void) | null {
    if (!element) return null;

    element.classList.add(ANIMATION_CLASSES.damageFlash);

    const cleanup = () => {
        element.classList.remove(ANIMATION_CLASSES.damageFlash);
    };

    setTimeout(cleanup, ANIMATION_TIMING.DAMAGE_FLASH_MS);
    return cleanup;
}

/**
 * Trigger a target highlight animation
 */
export function triggerTargetHighlight(element: HTMLElement | null): (() => void) | null {
    if (!element) return null;

    element.classList.add(ANIMATION_CLASSES.targetHighlight);

    const cleanup = () => {
        element.classList.remove(ANIMATION_CLASSES.targetHighlight);
    };

    setTimeout(cleanup, ANIMATION_TIMING.TARGET_HIGHLIGHT_MS);
    return cleanup;
}

/**
 * Trigger status icon pop animation
 */
export function triggerStatusPop(element: HTMLElement | null): (() => void) | null {
    if (!element) return null;

    element.classList.add(ANIMATION_CLASSES.statusPop);

    const cleanup = () => {
        element.classList.remove(ANIMATION_CLASSES.statusPop);
    };

    setTimeout(cleanup, ANIMATION_TIMING.STATUS_POP_MS);
    return cleanup;
}

/**
 * Trigger an attack bump animation (right)
 */
export function triggerBumpRight(element: HTMLElement | null): (() => void) | null {
    if (!element) return null;
    element.classList.add(ANIMATION_CLASSES.attackBumpRight);
    const cleanup = () => element.classList.remove(ANIMATION_CLASSES.attackBumpRight);
    setTimeout(cleanup, ANIMATION_TIMING.ATTACK_BUMP_MS);
    return cleanup;
}

/**
 * Trigger an attack bump animation (left)
 */
export function triggerBumpLeft(element: HTMLElement | null): (() => void) | null {
    if (!element) return null;
    element.classList.add(ANIMATION_CLASSES.attackBumpLeft);
    const cleanup = () => element.classList.remove(ANIMATION_CLASSES.attackBumpLeft);
    setTimeout(cleanup, ANIMATION_TIMING.ATTACK_BUMP_MS);
    return cleanup;
}

/**
 * Trigger a shake animation
 */
export function triggerShake(element: HTMLElement | null): (() => void) | null {
    if (!element) return null;
    element.classList.remove(ANIMATION_CLASSES.shake);
    void element.offsetWidth; // Force reflow
    element.classList.add(ANIMATION_CLASSES.shake);
    const cleanup = () => element.classList.remove(ANIMATION_CLASSES.shake);
    setTimeout(cleanup, ANIMATION_TIMING.SHAKE_MS);
    return cleanup;
}

export function triggerScreenShake(element: HTMLElement | null): (() => void) | null {
    if (!element) return null;
    element.classList.remove('anim-screen-shake');
    void element.offsetWidth; // Force reflow
    element.classList.add('anim-screen-shake');
    const cleanup = () => element.classList.remove('anim-screen-shake');
    setTimeout(cleanup, 200);
    return cleanup;
}


