export function debugDraw(scene) {
    const RAPIER = scene.RAPIER;
    if (!scene.debugGraphics) {
        scene.debugGraphics = scene.add.graphics().setDepth(1000);
    }
    scene.debugGraphics.clear();
    scene.debugGraphics.lineStyle(1, 0xffff00, 0.7);

    scene.world.forEachRigidBody((body) => {
        scene.world.forEachCollider((collider) => {
            if (collider.parent() && collider.parent().handle === body.handle) {
                const shape = collider.shape;
                const pos = body.translation();
                if (shape.type === RAPIER.ShapeType.Ball)
                    scene.debugGraphics.strokeCircle(pos.x, pos.y, shape.radius);
                else if (shape.type === RAPIER.ShapeType.Cuboid) {
                    const hw = shape.halfExtents.x;
                    const hh = shape.halfExtents.y;
                    scene.debugGraphics.strokeRect(pos.x - hw, pos.y - hh, hw * 2, hh * 2);
                }
            }
        });
    });
}
