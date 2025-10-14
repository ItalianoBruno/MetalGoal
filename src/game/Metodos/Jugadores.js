export function createRod(scene, x, count, color) {
    const RAPIER = scene.RAPIER;
    const group = [];
    const PLAYER_WIDTH = 40;
    const PLAYER_HEIGHT = 70;
    const fieldHeight = 1080;
    const totalHeight = (count - 1) * 150;
    const startY = (fieldHeight / 2) - (totalHeight / 2);

    for (let i = 0; i < count; i++) {
        const y = startY + i * 150;
        const rect = scene.add.rectangle(x, y, PLAYER_WIDTH, PLAYER_HEIGHT, color);
        const bodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(x, y);
        bodyDesc.setUserData(rect);
        const body = scene.world.createRigidBody(bodyDesc);
        const collider = RAPIER.ColliderDesc.cuboid(PLAYER_WIDTH / 2, PLAYER_HEIGHT / 2);
        scene.world.createCollider(collider, body);
        group.push(body);
    }
    return group;
}

export function moveRod(scene, team, dy) {
    if (!team || team.length === 0) return;
    const PLAYER_HEIGHT = 70;
    const margin = 60;
    const fieldHeight = 1080;

    const ys = team.map(body => body.translation().y);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const centerY = (minY + maxY) / 2;
    const halfBarHeight = ((maxY - minY) / 2) + (PLAYER_HEIGHT / 2);

    const topLimit = margin + halfBarHeight;
    const bottomLimit = fieldHeight - margin - halfBarHeight;
    const newCenterY = Phaser.Math.Clamp(centerY + dy, topLimit, bottomLimit);
    const deltaY = newCenterY - centerY;

    for (let body of team) {
        const pos = body.translation();
        body.setNextKinematicTranslation({ x: pos.x, y: pos.y + deltaY });
    }
}

export function kickRod(scene, team, dir) {
    const KICK_DISTANCE = 65;
    const KICK_DURATION = 270;

    for (const player of team) {
        if (player.isKicking) continue;
        player.isKicking = true;
        const pos = player.translation();

        if (!player.originalPos) player.originalPos = { x: pos.x };
        const x = player.originalPos.x;
        const y = pos.y;
        const forwardX = x + dir * KICK_DISTANCE;

        scene.tweens.addCounter({
            from: 0, to: 1, duration: KICK_DURATION, ease: 'Sine.easeInOut',
            onUpdate: (tween) => {
                const progress = tween.getValue();
                const newX = progress < 0.5
                    ? Phaser.Math.Linear(x, forwardX, progress * 2)
                    : Phaser.Math.Linear(forwardX, x, (progress - 0.5) * 2);
                player.setNextKinematicTranslation({ x: newX, y });
            },
            onComplete: () => {
                player.setNextKinematicTranslation({ x, y });
                player.isKicking = false;
            }
        });
    }
}
