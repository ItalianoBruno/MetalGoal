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

export function checkGoal(scene) {
    const ballPos = scene.ball.translation();
    const goalHeight = 200;
    if (ballPos.x < 100 &&
        ballPos.y > scene.goalLeft.translation().y - goalHeight &&
        ballPos.y < scene.goalLeft.translation().y + goalHeight) {
        handleGoal(scene, 'a');
    } else if (ballPos.x > 1820 &&
        ballPos.y > scene.goalRight.translation().y - goalHeight &&
        ballPos.y < scene.goalRight.translation().y + goalHeight) {
        handleGoal(scene, 'r');
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
        fontSize: '120px', color: '#fff', fontStyle: 'bold'
    }).setOrigin(0.5).setScale(0);

    scene.tweens.add({
        targets: text, scale: { from: 0, to: 1.2 }, alpha: { from: 0, to: 1 },
        duration: 300, ease: 'Back.Out', yoyo: true, hold: 300, onComplete: () => text.destroy()
    });

    scene.time.delayedCall(1500, () => {
        scene.goalScored = false;
        scene.resetBall(scene);
    });
}
