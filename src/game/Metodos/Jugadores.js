// --- Jugadores.js ---
export function createRod(scene, x, count, color) {
    const RAPIER = scene.RAPIER;
    const group = [];
    const PLAYER_WIDTH = 40;
    const PLAYER_HEIGHT = 70;
    const fieldHeight = 1080;
    const totalHeight = (count - 1) * 150;
    const startY = (fieldHeight / 2) - (totalHeight / 2);

    // 🔹 Detectar equipo según color (para usar los sprites correctos)

    for (let i = 0; i < count; i++) {
        const y = startY + i * 150;

        // --- HITBOX invisible (sigue manejando la física) ---
        const rect = scene.add.rectangle(x, y, PLAYER_WIDTH, PLAYER_HEIGHT, color)
            .setAlpha(0); // invisible pero activa físicamente

        // --- Crear cuerpo físico ---
        const bodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(x, y);
        bodyDesc.setUserData(rect);
        const body = scene.world.createRigidBody(bodyDesc);
        const collider = RAPIER.ColliderDesc.cuboid(PLAYER_WIDTH / 2, PLAYER_HEIGHT / 2);
        scene.world.createCollider(collider, body);

        // const rect = scene.add.rectangle(x, y, PLAYER_WIDTH, PLAYER_HEIGHT, color);

        // --- Detectar si es el arquero (jugador único en su barra) ---
        const isGoalkeeper = (count === 1);

        // --- Determinar el equipo por color o key ---
        const teamKey = color === 0xff0000 ? 'r' : 'a';

        // --- Seleccionar sprite según equipo y si es arquero ---
        let spriteKey;
        if (teamKey === 'r') {
            spriteKey = isGoalkeeper ? 'PJ1a' : 'PJ1';
        } else {
            spriteKey = isGoalkeeper ? 'PJ2a' : 'PJ2';
        }

        // --- Ajustes visuales (offset y escala) ---
        const offsets = {
            PJ1:  { x: 0,  y: 12 },
            PJ1a: { x: 0,  y: 10 },
            PJ2:  { x: 0,  y: 12 },
            PJ2a: { x: 0,  y: 10 }
        };

        // --- Crear sprite y aplicar offset ---
        const sprite = scene.add.sprite(
            x + offsets[spriteKey].x,
            y + offsets[spriteKey].y,
            spriteKey
        )
        .setOrigin(0.5,0.5)   // anclado a los pies
        .setScale(0.9)       // ajustá tamaño
        .setDepth(-5);

        // --- Guardar sprite dentro del body para futuras animaciones ---
        body.sprite = sprite;


        // 🔹 Guardamos todo dentro del body
        body.originalPos = { x, y };
        body.isKicking = false;
        body._nextY = y;
        body.sprite = sprite;  // asociar sprite visual al cuerpo
        body.team = teamKey;   // 'r' o 'a'

        group.push(body);
    }

    return group;
}

// =======================================================================
// === moveRod: Movimiento Vertical (Y) INDEPENDIENTE de la Patada (X) ===
// =======================================================================
export function moveRod(scene, team, dy) {
    if (!team || team.length === 0) return;

    const PLAYER_HEIGHT = 70;
    const fieldHeight = 1080;

    const ys = team.map(body => body.translation().y);
    const centerY = ys.reduce((a, b) => a + b) / ys.length;

    let topLimit, bottomLimit;

    // --- Detectar si es barra de arquero ---
    const isGoalkeeperRod = team.length === 1 &&
        (team[0].originalPos.x < 300 || team[0].originalPos.x > 1620);

    if (isGoalkeeperRod) {
        // --- Mantener límites del arco ---
        const GOAL_WALL_THICKNESS = 20;
        const GOAL_HEIGHT = PLAYER_HEIGHT * 5;
        const GOAL_OPENING_TOP_Y = fieldHeight / 2 - GOAL_HEIGHT / 2;
        const GOAL_OPENING_BOTTOM_Y = fieldHeight / 2 + GOAL_HEIGHT / 2;

        topLimit = GOAL_OPENING_TOP_Y + GOAL_WALL_THICKNESS / 2 + PLAYER_HEIGHT / 2;
        bottomLimit = GOAL_OPENING_BOTTOM_Y - GOAL_WALL_THICKNESS / 2 - PLAYER_HEIGHT / 2;
    } else {
        // --- Barras normales (permitir casi hasta el borde del campo) ---
        const visibleMargin = 50; // margen mínimo para no salirse visualmente
        const halfBarHeight = team.length * 150 / 2;

        topLimit = visibleMargin + halfBarHeight - PLAYER_HEIGHT / 2;
        bottomLimit = fieldHeight - visibleMargin - halfBarHeight + PLAYER_HEIGHT / 2;
    }

    // --- Movimiento vertical clamped ---
    const newCenterY = Phaser.Math.Clamp(centerY + dy, topLimit, bottomLimit);
    const deltaY = newCenterY - centerY;

    for (let body of team) {
        const pos = body.translation();
        body._nextY = pos.y + deltaY;

        // 🔹 Aplicar movimiento físico
        body.setNextKinematicTranslation({ x: pos.x, y: body._nextY });

        // 🔹 Sincronizar sprite visual
        if (body.sprite) {
            body.sprite.setPosition(pos.x, body._nextY);
        }
    }
}


// =======================================================================
// === kickRod: Manejo de Patada Sostenida y Retorno (Movimiento X) ======
// =======================================================================
export function kickRod(scene, player, dir, isHolding) {
    const KICK_DISTANCE = 65;
    const ADVANCE_SPEED = 20;
    const baseX = player.originalPos.x;

    const pos = player.translation();
    const currentX = pos.x;
    const useY = (player._nextY !== undefined) ? player._nextY : pos.y;

    // --- Detectar si es arquero ---
    const isGoalkeeper = player.originalPos &&
        (player.originalPos.x < 300 || player.originalPos.x > 1620);

    // --- Determinar el prefix (nombre base del sprite) ---
    let prefix;
    if (player.team === 'r') prefix = isGoalkeeper ? 'PJ1a' : 'PJ1';
    else prefix = isGoalkeeper ? 'PJ2a' : 'PJ2';

    // --- Definir offsets por dirección ---
    const baseOffset = 0;  // posición neutral
    const kickOffset = -37; // cuánto se mueve visualmente al patear

    // ===================================================================
    // --- A. Mientras se mantiene el botón (patada activa) ---
    // ===================================================================
    if (isHolding && dir !== 0) {
        const forwardX = baseX + dir * KICK_DISTANCE;
        const distToTarget = forwardX - currentX;

        player.isKicking = true;

        // Movimiento físico
        if (Math.abs(distToTarget) > 1) {
            const moveX = Math.sign(distToTarget) * ADVANCE_SPEED;
            let newX = currentX + moveX;
            const finalX = (Math.sign(distToTarget) > 0)
                ? Math.min(newX, forwardX)
                : Math.max(newX, forwardX);

            player.setNextKinematicTranslation({ x: finalX, y: useY });
            if (player.sprite) player.sprite.setPosition(finalX, useY);
        } else {
            player.setNextKinematicTranslation({ x: forwardX, y: useY });
            if (player.sprite) player.sprite.setPosition(forwardX, useY);
        }

        // 🔹 Determinar el sprite correcto según dirección
        const kickKey = `${prefix}p${dir > 0 ? '1' : '2'}`;

        // 🔹 Cambiar sprite inmediatamente si cambió de dirección o no tenía sprite asignado
        if (player.sprite && player._currentKickDir !== dir) {
            player.sprite.setTexture(kickKey);
            player._currentKickDir = dir;
        }

        // 🔹 Aplicar offset visual según dirección
        if (player.sprite) {
            player.sprite.x = pos.x + (dir * kickOffset);
        }
    }

    // ===================================================================
    // --- B. Si suelta el botón: volver al estado idle ---
    // ===================================================================
    else {
        if (!player.isKicking) return;

        const distToBase = baseX - currentX;

        if (Math.abs(distToBase) > 1) {
            const moveX = Math.sign(distToBase) * ADVANCE_SPEED;
            let newX = currentX + moveX;
            const finalX = (Math.sign(distToBase) > 0)
                ? Math.min(newX, baseX)
                : Math.max(newX, baseX);

            player.setNextKinematicTranslation({ x: finalX, y: useY });
            if (player.sprite) player.sprite.setPosition(finalX, useY);
        } else {
            player.setNextKinematicTranslation({ x: baseX, y: useY });
            if (player.sprite) player.sprite.setPosition(baseX, useY);

            // 🔹 Resetear estados visuales
            player.isKicking = false;
            player._currentKickDir = 0;

            if (player.sprite) {
                player.sprite.setTexture(prefix);
                player.sprite.x = pos.x + baseOffset;
            }
        }
    }
}



