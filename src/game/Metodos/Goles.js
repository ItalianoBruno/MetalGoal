import { resetBall } from '../Metodos/Pelota.js';
export function createGoal(scene, x, y) {
    const RAPIER = scene.RAPIER;
    const PLAYER_HEIGHT = 70;
    const goalHeight = PLAYER_HEIGHT * 5;
    const goalWidth = 120;
    const color = x < 960 ? 0x00aaff : 0xff5555;

    const goalRect = scene.add.rectangle(x, y, goalWidth * 1.5, goalHeight)
        .setStrokeStyle(6, color, 1)
        .setFillStyle(color, 0.1)
        .setDepth(-1);

    const triggerX = x < 960 ? 35 : 1920 - 35;
    const desc = RAPIER.RigidBodyDesc.fixed().setTranslation(triggerX, y);
    const body = scene.world.createRigidBody(desc);
    const collider = RAPIER.ColliderDesc.cuboid(10, goalHeight / 2);
    collider.setSensor(true);
    collider.setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);
    scene.world.createCollider(collider, body);
    body.userData = goalRect;
    return body;
}

// --- Goles.js (funciones checkGoal y handleGoal modificadas) ---

// Se omite createGoal ya que no fue modificada.

export function checkGoal(scene) {
    const ballPos = scene.ball.translation();
    
    // Altura y posición Y de la apertura real del arco (PLAYER_HEIGHT * 5 = 350)
    const GOAL_HEIGHT = 70 * 5; 
    const HALF_GOAL_HEIGHT = GOAL_HEIGHT / 2; // 175
    const GOAL_Y = 540; 
    
    // X de la línea de gol (asumiendo el borde interior de los postes en x=25 y x=1895)
    const GOAL_LEFT_X_LINE = 65;
    const GOAL_RIGHT_X_LINE = 1920 - 65; 
    
    // Rango Y del arco: [365, 715]
    const GOAL_TOP_Y = GOAL_Y - HALF_GOAL_HEIGHT; 
    const GOAL_BOTTOM_Y = GOAL_Y + HALF_GOAL_HEIGHT; 

    // Arco Izquierdo (Gol al equipo 'a')
    if (ballPos.x < GOAL_LEFT_X_LINE && 
        ballPos.y > GOAL_TOP_Y && 
        ballPos.y < GOAL_BOTTOM_Y) { 
        handleGoal(scene, 'a'); // 'a' concedió el gol
    } 
    // Arco Derecho (Gol al equipo 'r')
    else if (ballPos.x > GOAL_RIGHT_X_LINE && 
        ballPos.y > GOAL_TOP_Y && 
        ballPos.y < GOAL_BOTTOM_Y) {
        handleGoal(scene, 'r'); // 'r' concedió el gol
    }
}

export function handleGoal(scene, team) {
    if (scene.goalScored) return;
    scene.goalScored = true;

    if (team === 'r') scene.scoreA++;
    else scene.scoreB++;

    scene.scoreText.setText(`${scene.scoreA} - ${scene.scoreB}`);

    const flash = scene.add.rectangle(960, 540, 1920, 1080, 0xffffff).setAlpha(0);
    scene.tweens.add({ targets: flash, alpha: { from: 0, to: 0.8 }, duration: 150, yoyo: true, onComplete: () => flash.destroy() });

    const text = scene.add.text(960, 540, '¡GOL!', {
        fontFamily: 'Arial Black', fontSize: 100, color: '#ffffff',
        stroke: '#000000', strokeThickness: 12,
        align: 'center'
    }).setOrigin(0.5).setScale(0);

    scene.tweens.add({
        targets: text,
        scale: { from: 0, to: 1.2 },
        alpha: { from: 0, to: 1 },
        duration: 300,
        ease: 'Back.Out',
        yoyo: true,
        hold: 300,
        onComplete: () => text.destroy()
    });

    // ⚙️ Reinicia la pelota después de delay, pasando el equipo que concedió el gol
    scene.time.delayedCall(1500, () => {
        // Se asume que `resetBall` es la función importada de Pelota.js
        resetBall(scene, team); 
        scene.goalScored = false;
    });
}
