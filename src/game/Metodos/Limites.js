export function createBoundaries(scene) {
    const RAPIER = scene.RAPIER;
    const thickness = 20;
    const width = 1920;
    const height = 1080;
    const PLAYER_HEIGHT = 70;
    const goalHeight = PLAYER_HEIGHT * 5;
    const goalWidth = 100;
    const goalY = 540;
    const goalInnerXLeft = 25;
    const goalInnerXRight = width - 25;

    const walls = [
        { x: width / 2, y: thickness / 2, w: width, h: thickness },
        { x: width / 2, y: height - thickness / 2, w: width, h: thickness },
        { x: thickness / 2, y: (goalY - goalHeight / 2) / 2, w: thickness, h: goalY - goalHeight / 2 },
        { x: thickness / 2, y: (height + goalY + goalHeight / 2) / 2, w: thickness, h: height - (goalY + goalHeight / 2) },
        { x: width - thickness / 2, y: (goalY - goalHeight / 2) / 2, w: thickness, h: goalY - goalHeight / 2 },
        { x: width - thickness / 2, y: (height + goalY + goalHeight / 2) / 2, w: thickness, h: height - (goalY + goalHeight / 2) },
    ];

    const goalWalls = [
        { x: goalInnerXLeft + goalWidth / 2, y: goalY - goalHeight / 2, w: goalWidth, h: thickness },
        { x: goalInnerXLeft + goalWidth / 2, y: goalY + goalHeight / 2, w: goalWidth, h: thickness },
        { x: goalInnerXLeft, y: goalY, w: thickness, h: goalHeight + thickness * 2 },
        { x: goalInnerXRight - goalWidth / 2, y: goalY - goalHeight / 2, w: goalWidth, h: thickness },
        { x: goalInnerXRight - goalWidth / 2, y: goalY + goalHeight / 2, w: goalWidth, h: thickness },
        { x: goalInnerXRight, y: goalY, w: thickness, h: goalHeight + thickness * 2 },
    ];

    const allWalls = [...walls, ...goalWalls];
    for (let wall of allWalls) {
        if (wall.h <= 0) continue;
        const desc = RAPIER.RigidBodyDesc.fixed().setTranslation(wall.x, wall.y);
        const body = scene.world.createRigidBody(desc);
        const collider = RAPIER.ColliderDesc.cuboid(wall.w / 2, wall.h / 2);
        collider.setRestitution(0.5);
        collider.setFriction(0.3);
        scene.world.createCollider(collider, body);
    }
}
