// src/game/Metodos/Pelota.js
export function createBall(scene, x, y) {
    const RAPIER = scene.RAPIER;
    const BALL_RADIUS = 30;

    // visual
    const circle = scene.add.circle(x, y, BALL_RADIUS, 0xffffff);

    // cuerpo dinámico
    const bodyDesc = RAPIER.RigidBodyDesc.dynamic(BALL_RADIUS)
        .setTranslation(x, y)
        .setLinearDamping(0.3)
        .setAngularDamping(0.5);

    const body = scene.world.createRigidBody(bodyDesc);
    body.userData = circle; // para sincronizar visuals

    const colliderDesc = RAPIER.ColliderDesc.ball(BALL_RADIUS)
        .setRestitution(0.9)
        .setFriction(0.5);

    scene.world.createCollider(colliderDesc, body);

    // velocidad inicial fiable (usa RAPIER.Vector2)
    const initialVel =  new RAPIER.Vector2(
         Phaser.Math.Between(-400, 400),
         Phaser.Math.Between(-200, 200)
     );
    body.setLinvel(initialVel, true);

    return body;
}
// --- Pelota.js (función resetBall modificada) ---

export function resetBall(scene, teamConceded) { // Ahora acepta el equipo que concedió
    const body = scene.ball;
    body.setTranslation({ x: 960, y: 540 }, true);
    body.setAngvel(0, true);
    
    // Si no hay equipo que concedió (ej: inicio de partido), la velocidad es cero.
    body.setLinvel({ x: 0, y: 0 }, true); 

    // Nuevo: Añadir un movimiento inicial en dirección al equipo que anotó
    if (teamConceded) {
        const INITIAL_SPEED = 300; // Velocidad inicial moderada
        let dirX = 0;
        
        // Si el gol fue contra 'r' (rojo), el movimiento es hacia la izquierda (negativo)
        // Si el gol fue contra 'a' (azul), el movimiento es hacia la derecha (positivo)
        if (teamConceded === 'r') { 
            dirX = -INITIAL_SPEED; // Hacia la izquierda (arco rojo)
        } else if (teamConceded === 'a') {
            dirX = INITIAL_SPEED; // Hacia la derecha (arco azul)
        }

        const initialVel = new scene.RAPIER.Vector2(dirX, 0); 
        body.setLinvel(initialVel, true);
    }
}