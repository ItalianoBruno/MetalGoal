// Jugadores.js
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

        // inicializaciones útiles
        body.originalPos = { x: x, y: y };
        body.isKicking = false;
        body.isHeldKick = false;
        body._nextY = y;

        group.push(body);
    }
    return group;
}

export function moveRod(scene, team, dy) {
    if (!team || team.length === 0) return;
    const PLAYER_HEIGHT = 70;
    const margin = 60;
    const fieldHeight = 1080;

    // calculamos centro de la barra en Y (centro "real")
    const ys = team.map(body => body.translation().y);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const centerY = (minY + maxY) / 2;
    const halfBarHeight = ((maxY - minY) / 2) + (PLAYER_HEIGHT / 2);

    const topLimit = margin + halfBarHeight;
    const bottomLimit = fieldHeight - margin - halfBarHeight;
    const newCenterY = Phaser.Math.Clamp(centerY + dy, topLimit, bottomLimit);
    const deltaY = newCenterY - centerY;

    // aplicamos el delta a cada jugador, pero **guardamos** el nextY en body._nextY
    for (let body of team) {
        const pos = body.translation();
        const nextY = pos.y + deltaY;
        body._nextY = nextY; // guardamos la Y objetivo para que otros procesos la reutilicen
        // IMPORTANTE: aquí dejamos la X igual (no la modificamos) — kick/hold ajustará X después
        body.setNextKinematicTranslation({ x: pos.x, y: nextY });
    }
}

/* ------------------------------------------------------------------
   kickRod(scene, team, dir)
   - team: array de bodies (la "barra")
   - dir: -1 izquierda, 1 derecha
   - realiza la patada corta (animación ida/vuelta)
   - NO se llama cada frame (solo en JustDown)
   ------------------------------------------------------------------ */
export function kickRod(scene, team, dir) {
    const KICK_DISTANCE = 65;
    const KICK_DURATION = 2000; // ida y vuelta más rápido

    for (const player of team) {
        // seguridad: player debe ser un RigidBody
        if (!player || typeof player.translation !== 'function') continue;

        // Si está en hold (pos adelantada), no ejecutamos la animación corta
        if (player.isHeldKick) continue;

        if (player.isKicking) continue; // evita solapamientos
        player.isKicking = true;

        const pos = player.translation();
        if (!player.originalPos) player.originalPos = { x: pos.x, y: pos.y };

        const baseX = player.originalPos.x;
        const forwardX = baseX + dir * KICK_DISTANCE;

        scene.tweens.addCounter({
            from: 0,
            to: 1,
            duration: KICK_DURATION,
            ease: 'Sine.easeInOut',
            onUpdate: () => {
                const progress = this ? this.getValue() : arguments[0].getValue();
                // obtiene la Y preferida: si moveRod guardó _nextY, úsala, sino usa translation().y
                const curY = (player._nextY !== undefined) ? player._nextY : player.translation().y;
                const newX = progress < 0.5
                    ? Phaser.Math.Linear(baseX, forwardX, progress * 2)
                    : Phaser.Math.Linear(forwardX, baseX, (progress - 0.5) * 2);

                player.setNextKinematicTranslation({ x: newX, y: curY });
            },
            onComplete: () => {
                // asegurar que vuelva exactamente a baseX pero manteniendo la Y "pendiente"
                const curY = (player._nextY !== undefined) ? player._nextY : player.translation().y;
                player.setNextKinematicTranslation({ x: player.originalPos.x, y: curY });
                player.isKicking = false;
            }
        });
    }
}


export function holdKick(scene, team, dir, hold) {
    const HOLD_DIST = 72;
    const RETURN_DURATION = 170; // rápido pero visible

    for (const player of team) {
        if (!player || typeof player.translation !== 'function') continue;

        const pos = player.translation();
        if (!player.originalPos) player.originalPos = { x: pos.x, y: pos.y };

        const baseX = player.originalPos.x;
        const targetX = baseX + dir * HOLD_DIST;
        const curY = (player._nextY !== undefined) ? player._nextY : pos.y;

        if (hold) {
            // cancelar tween de retorno si existiera
            if (player._returnTween) {
                player._returnTween.stop();
                player._returnTween = null;
            }
            // Adelanta y marca estado hold (mantiene la Y que moveRod dejó en _nextY)
            player.setNextKinematicTranslation({ x: targetX, y: curY });
            player.isHeldKick = true;
            // Nota: no marcamos isKicking porque no es la animación corta
        } else {
            // si estaba en hold y ahora soltas: iniciar retorno suave al baseX
            if (player.isHeldKick) {
                // evita crear múltiples tweens
                if (player._returnTween) continue;

                const startX = player.translation().x;
                player._returnTween = scene.tweens.addCounter({
                    from: 0,
                    to: 1,
                    duration: RETURN_DURATION,
                    ease: 'Sine.easeOut',
                    onUpdate: (tween) => {
                        const p = tween.getValue();
                        const newX = Phaser.Math.Linear(startX, baseX, p);
                        const useY = (player._nextY !== undefined) ? player._nextY : player.translation().y;
                        player.setNextKinematicTranslation({ x: newX, y: useY });
                    },
                    onComplete: () => {
                        player.isHeldKick = false;
                        player._returnTween = null;
                        // asegurar que quede exactamente en baseX
                        const finalY = (player._nextY !== undefined) ? player._nextY : player.translation().y;
                        player.setNextKinematicTranslation({ x: baseX, y: finalY });
                    }
                });
            }
            // si no estaba en hold, no hacemos nada (evitamos patadas repetidas)
        }
    }
}
