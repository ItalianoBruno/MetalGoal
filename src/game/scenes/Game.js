import RAPIER from '@dimforge/rapier2d-compat';
import { Scene } from 'phaser';

export class Game extends Scene {
    constructor() {
        super('Game');
    }

    async create() {
        // Inicializar Rapier
        await RAPIER.init();
        this.world = new RAPIER.World(new RAPIER.Vector2(0, 0));

        this.cameras.main.setBackgroundColor(0x0f4c1f);

        // Bordes del campo (ajusta a 1920x1080)
        this.createBoundaries();

        // Disposición clásica de metegol
        // [cantidad, color, nombre]
        const rods = [
            { count: 1, color: 0xff0000, key: 'r' }, // 1r
            { count: 2, color: 0xff0000, key: 'r' }, // 2r
            { count: 3, color: 0x0000ff, key: 'a' }, // 3a
            { count: 5, color: 0xff0000, key: 'r' }, // 5r
            { count: 5, color: 0x0000ff, key: 'a' }, // 5a
            { count: 3, color: 0xff0000, key: 'r' }, // 3r
            { count: 2, color: 0x0000ff, key: 'a' }, // 2a
            { count: 1, color: 0x0000ff, key: 'a' }, // 1a
        ];

        // Calcula posiciones X equidistantes
        const fieldWidth = 1920;
        const margin = 120;
        const usableWidth = fieldWidth - margin * 2;
        const rodSpacing = usableWidth / (rods.length - 1);

        this.teams = { r: [], a: [] };

        rods.forEach((rod, i) => {
            const x = margin + i * rodSpacing;
            const group = this.createRod(x, rod.count, rod.color);
            this.teams[rod.key].push(group);
        });

        // Pelota centrada
        this.ball = this.createBall(960, 540);
        this.ball.setLinvel(new RAPIER.Vector2(-200, 50), true);

        // Arcos
        this.goalLeft = this.createGoal(60, 540);
        this.goalRight = this.createGoal(1860, 540);

        // Configurar inputs
        this.cursors = this.input.keyboard.createCursorKeys();
        this.WASD = this.input.keyboard.addKeys('W,A,S,D');

        // Marcadores (centrado arriba)
        this.scoreA = 0;
        this.scoreB = 0;
        this.scoreText = this.add.text(960, 40, '0 - 0', { fontSize: '32px', color: '#fff' }).setOrigin(0.5);
    }

    createBoundaries() {
        const thickness = 20;
        const width = 1920;
        const height = 1080;
        const walls = [
            { x: width / 2, y: thickness / 2, w: width, h: thickness }, // arriba
            { x: width / 2, y: height - thickness / 2, w: width, h: thickness }, // abajo
            { x: thickness / 2, y: height / 2, w: thickness, h: height }, // izquierda
            { x: width - thickness / 2, y: height / 2, w: thickness, h: height } // derecha
        ];

        for (let wall of walls) {
            const desc = RAPIER.RigidBodyDesc.fixed().setTranslation(wall.x, wall.y);
            const body = this.world.createRigidBody(desc);
            const collider = RAPIER.ColliderDesc.cuboid(wall.w / 2, wall.h / 2);
            this.world.createCollider(collider, body);
        }
    }

    createBall(x, y) {
        const BALL_RADIUS = 28; // antes 18, ahora más grande
        const circle = this.add.circle(x, y, BALL_RADIUS, 0xffffff);
        const bodyDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(x, y);
        bodyDesc.setUserData(circle);
        const body = this.world.createRigidBody(bodyDesc);
        const collider = RAPIER.ColliderDesc.ball(BALL_RADIUS);
        collider.setRestitution(0.96); // rebote
        //collider.setFriction(0.2);    // rozamiento (nuevo)
        //collider.setDensity(0.55);     // opcional, afecta masa/inercia
        this.world.createCollider(collider, body);
        return body;
    }

    createRod(x, count, color) {
        const group = [];
        for (let i = 0; i < count; i++) {
            const PLAYER_WIDTH = 40;   // antes 25, ahora más ancho
            const PLAYER_HEIGHT = 70;  // antes 40, ahora más alto
            const y = 200 + i * 150;
            const rect = this.add.rectangle(x, y, PLAYER_WIDTH, PLAYER_HEIGHT, color);
            const bodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(x, y);
            bodyDesc.setUserData(rect);
            const body = this.world.createRigidBody(bodyDesc);
            const collider = RAPIER.ColliderDesc.cuboid(
                PLAYER_WIDTH / 2, PLAYER_HEIGHT / 2
            );
            this.world.createCollider(collider, body);
            group.push(body);
        }
        return group;
    }

    createGoal(x, y) {
        const goal = { x, y, w: 10, h: 100 };
        const desc = RAPIER.RigidBodyDesc.fixed().setTranslation(x, y);
        const body = this.world.createRigidBody(desc);
        const collider = RAPIER.ColliderDesc.cuboid(goal.w / 2, goal.h / 2);
        this.world.createCollider(collider, body);
        return body;
    }

    update() {
        if (!this.world) return;
        this.world.step();

        // Actualizar posición de objetos
        this.world.bodies.forEach((body) => {
            const gameObject = body.userData;
            if (gameObject) {
                const pos = body.translation();
                gameObject.x = pos.x;
                gameObject.y = pos.y;
            }
        });

        // Movimiento básico de varas
        let dyA = 0;
        let dyB = 0;

        if (this.WASD.W.isDown) dyA = -23;
        else if (this.WASD.S.isDown) dyA = 23;

        if (this.cursors.up.isDown) dyB = -23;
        else if (this.cursors.down.isDown) dyB = 23;

        this.moveRod(this.teamA, dyA);
        this.moveRod(this.teamB, dyB);

        // Patear (una sola vez al presionar)
        if (Phaser.Input.Keyboard.JustDown(this.WASD.A)) {
            this.kickRod(this.teamA, -1);
        }
        if (Phaser.Input.Keyboard.JustDown(this.WASD.D)) {
            this.kickRod(this.teamA, 1);
        }
        if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
            this.kickRod(this.teamB, -1);
        }
        if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
            this.kickRod(this.teamB, 1);
        }
    }

    // Mueve la "barra" tomando como referencia al jugador central
    moveRod(team, dy) {
        if (!team || team.length === 0) return;

        // índice del jugador central
        const centerIndex = Math.floor(team.length / 2);
        const centerBody = team[centerIndex];
        const posCenter = centerBody.translation();

        // calculamos el alto total del equipo (distancia entre el primero y el último)
        const firstY = team[0].translation().y;
        const lastY = team[team.length - 1].translation().y;
        const halfHeight = (lastY - firstY) / 2;

        // límites considerando la altura total de la barra
        const topLimit = 30 + halfHeight;
        const bottomLimit = 745 - halfHeight;

        // nueva posición del centro
        const newCenterY = Phaser.Math.Clamp(posCenter.y + dy, topLimit, bottomLimit);
        const deltaY = newCenterY - posCenter.y;

        // mover todos los jugadores el mismo delta
        for (const body of team) {
            const pos = body.translation();
            body.setNextKinematicTranslation({ x: pos.x, y: pos.y + deltaY });
        }
    }

    // Patada: aplica un impulso a la pelota si está cerca del centro de la barra
    kickRod(team, dir) {
    const KICK_DISTANCE = 35;   // cuánto avanza la patada
    const KICK_DURATION = 180;   // duración total en ms

    for (const player of team) {
        if (player.isKicking) continue;
        player.isKicking = true;

        // Obtenemos la posición actual
        const pos = player.translation();

        // Guardamos solo la X original (horizontal)
        if (!player.originalPos) {
            player.originalPos = { x: pos.x };
        }

        const x = player.originalPos.x;
        const y = pos.y; // la Y actual (se actualiza cada patada)
        const forwardX = x + dir * KICK_DISTANCE;

        this.tweens.addCounter({
            from: 0,
            to: 1,
            duration: KICK_DURATION,
            ease: 'Sine.easeInOut',
            onUpdate: (tween) => {
                const progress = tween.getValue();
                const newX =
                    progress < 0.5
                        ? Phaser.Math.Linear(x, forwardX, progress * 2)
                        : Phaser.Math.Linear(forwardX, x, (progress - 0.5) * 2);

                player.setNextKinematicTranslation({ x: newX, y });
                //const obj = player.userData;
                //if (obj) obj.rotation = Math.sin(progress * Math.PI) * 0.25;
            },
            onComplete: () => {
                // Vuelve exactamente a su eje X y su Y actual
                player.setNextKinematicTranslation({ x, y });
                const obj = player.userData;
                if (obj) obj.rotation = 0;
                player.isKicking = false;
            }
        });
    }
}


}
