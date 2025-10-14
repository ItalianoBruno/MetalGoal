export function createBall(scene, x, y) {
    const RAPIER = scene.RAPIER;
    const BALL_RADIUS = 28;

    // Círculo visual
    const circle = scene.add.circle(x, y, BALL_RADIUS, 0xffffff);

    // Cuerpo dinámico físico
    const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(x, y)
        .setLinearDamping(0.3)       // añade leve rozamiento
        .setAngularDamping(0.5);     // evita giros eternos

    const body = scene.world.createRigidBody(bodyDesc);

    // Asignamos el círculo visual como userData (para sincronizar)
    body.userData = circle;

    // Collider físico (esfera)
    const colliderDesc = RAPIER.ColliderDesc.ball(BALL_RADIUS)
        .setRestitution(0.96)
        .setFriction(0.5);           // un poco de fricción

    scene.world.createCollider(colliderDesc, body);

    // Impulso inicial
    body.applyImpulse({ 
        x: Phaser.Math.Between(-400, 400), 
        y: Phaser.Math.Between(-200, 200) 
    }, true);

    // Devolvemos el cuerpo
    return body;
}


export function resetBall(scene) {
    const body = scene.ball;
    body.setTranslation({ x: 960, y: 540 }, true);
    body.setLinvel({ x: 0, y: 0 }, true);
    body.setAngvel(0, true);
}
