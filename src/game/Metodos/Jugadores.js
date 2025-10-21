// --- Jugadores.js ---
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

        // Inicializaciones útiles
        body.originalPos = { x, y };
        body.isKicking = false; // Indica si el jugador está fuera de su posición X base
        body._nextY = y;        // Guarda la posición Y deseada (independiente de la patada)

        group.push(body);
    }
    return group;
}

// =======================================================================
// === moveRod: Movimiento Vertical (Y) INDEPENDIENTE de la Patada (X) ===
// =======================================================================
// --- Jugadores.js (función moveRod modificada) ---

export function moveRod(scene, team, dy) {
    if (!team || team.length === 0) return;
    const PLAYER_HEIGHT = 70;
    const margin = 60; 
    const fieldHeight = 1080;

    const ys = team.map(body => body.translation().y);
    const centerY = ys.reduce((a, b) => a + b) / ys.length;

    let topLimit, bottomLimit;
    
    // Identificación de la barra del arquero (un solo jugador y posición cercana al arco)
    const isGoalkeeperRod = team.length === 1 && 
        (team[0].originalPos.x < 300 || team[0].originalPos.x > 1620); 

    if (isGoalkeeperRod) {
        // Límites para el Arquero: Colisión con los bordes del arco
        // Basado en Limites.js: goalHeight = 350, thickness = 20.
        const GOAL_WALL_THICKNESS = 20;
        const GOAL_HEIGHT = PLAYER_HEIGHT * 5; 
        const GOAL_OPENING_TOP_Y = fieldHeight / 2 - GOAL_HEIGHT / 2; // 365
        const GOAL_OPENING_BOTTOM_Y = fieldHeight / 2 + GOAL_HEIGHT / 2; // 715
        
        // topLimit: Borde interior superior (365 + 10 = 375) + mitad de altura del jugador (35) = 410
        topLimit = GOAL_OPENING_TOP_Y + GOAL_WALL_THICKNESS / 2 + PLAYER_HEIGHT / 2; 
        // bottomLimit: Borde interior inferior (715 - 10 = 705) - mitad de altura del jugador (35) = 670
        bottomLimit = GOAL_OPENING_BOTTOM_Y - GOAL_WALL_THICKNESS / 2 - PLAYER_HEIGHT / 2;
        
    } else {
        // Lógica original para el resto de las barras
        const halfBarHeight = team.length * 150 / 2;

        topLimit = margin + halfBarHeight;
        bottomLimit = fieldHeight - margin - halfBarHeight;
    }

    const newCenterY = Phaser.Math.Clamp(centerY + dy, topLimit, bottomLimit);
    const deltaY = newCenterY - centerY;

    for (let body of team) {
        const pos = body.translation();
        // Se asume que `_nextY` se utiliza para la coordinación con la patada.
        body._nextY = pos.y + deltaY;
        body.setNextKinematicTranslation({ x: pos.x, y: body._nextY });
    }
}

// =======================================================================
// === kickRod: Manejo de Patada Sostenida y Retorno (Movimiento X) ======
// =======================================================================
export function kickRod(scene, player, dir, isHolding) {
    // 'player' es un único RigidBody
    const KICK_DISTANCE = 65;
    const ADVANCE_SPEED = 20;
    const baseX = player.originalPos.x;
    
    const pos = player.translation();
    const currentX = pos.x;

    // Obtener la Y deseada que calculó moveRod (o usar la Y actual si no existe _nextY)
    // CORRECCIÓN AQUÍ: Uso 'pos.y' en lugar de la variable 'currentX'
    const useY = (player._nextY !== undefined) ? player._nextY : pos.y; 

    // =======================================================================
    // A. LÓGICA DE AVANCE / SOSTENIMIENTO (Si se mantiene el botón)
    // =======================================================================
    if (isHolding && dir !== 0) {
        const forwardX = baseX + dir * KICK_DISTANCE;
        const distToTarget = forwardX - currentX;
        
        player.isKicking = true; // Establecer el estado de patada

        // Mover hacia adelante
        if (Math.abs(distToTarget) > 1) { // Si no estamos en posición final
            const moveX = Math.sign(distToTarget) * ADVANCE_SPEED;
            let newX = currentX + moveX;
            
            // Clamping para evitar que se pase del objetivo (forwardX)
            const finalX = (Math.sign(distToTarget) > 0) 
                ? Math.min(newX, forwardX) 
                : Math.max(newX, forwardX);
                
            player.setNextKinematicTranslation({ x: finalX, y: useY });
        } else {
            // Ya está en posición: Sostener la posición
            player.setNextKinematicTranslation({ x: forwardX, y: useY });
        }
    } 
    // =======================================================================
    // B. LÓGICA DE RETORNO (Si el botón se suelta)
    // =======================================================================
    else {
        // Solo retornar si el jugador está fuera de su posición base
        if (!player.isKicking) return; 

        const distToBase = baseX - currentX;

        // Mover hacia la base
        if (Math.abs(distToBase) > 1) { // Si no estamos en posición base
            const moveX = Math.sign(distToBase) * ADVANCE_SPEED;
            let newX = currentX + moveX;

            // Clamping para evitar que se pase del objetivo (baseX)
            const finalX = (Math.sign(distToBase) > 0)
                ? Math.min(newX, baseX)
                : Math.max(newX, baseX);
            
            player.setNextKinematicTranslation({ x: finalX, y: useY });
            
        } else {
            // Ya está en posición base: Terminar el estado de patada
            player.setNextKinematicTranslation({ x: baseX, y: useY });
            player.isKicking = false;
        }
    }
}