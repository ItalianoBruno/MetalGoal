// src/game/Metodos/Pelota.js
export function createBall(scene, x, y) {
    const RAPIER = scene.RAPIER;
    const BALL_RADIUS = 28;

    // visual
    const circle = scene.add.circle(x, y, BALL_RADIUS, 0xffffff);

    // cuerpo dinámico
    const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(x, y)
        .setLinearDamping(0.3)
        .setAngularDamping(0.5);

    const body = scene.world.createRigidBody(bodyDesc);
    body.userData = circle; // para sincronizar visuals

    const colliderDesc = RAPIER.ColliderDesc.ball(BALL_RADIUS)
        .setRestitution(0.96)
        .setFriction(0.5);

    scene.world.createCollider(colliderDesc, body);

    // velocidad inicial fiable (usa RAPIER.Vector2)
    const initialVel = new RAPIER.Vector2(
        Phaser.Math.Between(-400, 400),
        Phaser.Math.Between(-200, 200)
    );
    body.setLinvel(initialVel, true);

    return body;
}

export function resetBall(scene) {
    const body = scene.ball;
    body.setTranslation({ x: 960, y: 540 }, true);
    body.setLinvel({ x: 0, y: 0 }, true);
    body.setAngvel(0, true);
}
