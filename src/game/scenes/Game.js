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
        const BALL_RADIUS = 28;
        const circle = this.add.circle(x, y, BALL_RADIUS, 0xffffff);
        const bodyDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(x, y);
        bodyDesc.setUserData(circle);
        const body = this.world.createRigidBody(bodyDesc);
        const collider = RAPIER.ColliderDesc.ball(BALL_RADIUS);
        collider.setRestitution(0.96);

        // Activa CCD para la pelota
        //collider.setCcdEnabled(true);

        this.world.createCollider(collider, body);
        return body;
    }

    createRod(x, count, color) {
        const group = [];
        const PLAYER_WIDTH = 40;
        const PLAYER_HEIGHT = 70;
        const fieldHeight = 1080;
        const totalHeight = (count - 1) * 150; // separación entre jugadores
        const startY = (fieldHeight / 2) - (totalHeight / 2);

        for (let i = 0; i < count; i++) {
            const y = startY + i * 150;
            const rect = this.add.rectangle(x, y, PLAYER_WIDTH, PLAYER_HEIGHT, color);
            const bodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(x, y);
            bodyDesc.setUserData(rect);
            const body = this.world.createRigidBody(bodyDesc);
            const collider = RAPIER.ColliderDesc.cuboid(
                PLAYER_WIDTH / 2, PLAYER_HEIGHT / 2
            );
            //collider.setCcdEnabled(true); // <--- agrega esto
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

        // --- VISUAL: dibujar el arco ---
        const visualWidth = 60;   // más ancho para que se note
        const visualHeight = 200;
        const color = x < 960 ? 0x00aaff : 0xff5555; // azul izquierda, rojo derecha
        const goalRect = this.add.rectangle(x, y, visualWidth, visualHeight)
            .setStrokeStyle(6, color, 1)
            .setFillStyle(color, 0.1); // leve transparencia

        body.userData = goalRect;
        
        //const debugZone = this.add.rectangle(x, y, 120, 220, 0xff0000, 0.2);
        //debugZone.setStrokeStyle(2, 0xffffff);

        return body;
            

    }


    update() {
        if (!this.world) return;
        this.world.step();

        // Detección de gol SOLO dentro del área del arco
        this.checkGoal();

        // Actualizar posición de objetos
        this.world.bodies.forEach((body) => {
            const gameObject = body.userData;
            if (gameObject) {
                const pos = body.translation();
                gameObject.x = pos.x;
                gameObject.y = pos.y;
            }
        });

        // Movimiento básico de todas las barras del equipo Rojo (A) y Azul (B)
        let dyA = 0;
        let dyB = 0;

        if (this.WASD.W.isDown) dyA = -23;
        else if (this.WASD.S.isDown) dyA = 23;

        if (this.cursors.up.isDown) dyB = -23;
        else if (this.cursors.down.isDown) dyB = 23;

        // Mueve todas las barras de cada equipo
        for (const rod of this.teams.r) {
            this.moveRod(rod, dyA);
        }
        for (const rod of this.teams.a) {
            this.moveRod(rod, dyB);
        }

        // Patear (todas las barras de cada equipo)
        if (Phaser.Input.Keyboard.JustDown(this.WASD.A)) {
            for (const rod of this.teams.r) this.kickRod(rod, -1);
        }
        if (Phaser.Input.Keyboard.JustDown(this.WASD.D)) {
            for (const rod of this.teams.r) this.kickRod(rod, 1);
        }
        if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
            for (const rod of this.teams.a) this.kickRod(rod, -1);
        }
        if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
            for (const rod of this.teams.a) this.kickRod(rod, 1);
        }
    }

    checkGoal() {
        const ballPos = this.ball.translation();
        const goalHeight = 200; // Debe coincidir con el alto visual del arco

        // --- Gol IZQUIERDO (azul anota) ---
        if (
            ballPos.x < 100 &&
            ballPos.y > this.goalLeft.translation().y - goalHeight / 2 &&
            ballPos.y < this.goalLeft.translation().y + goalHeight / 2
        ) {
            this.handleGoal('a');
        }

        // --- Gol DERECHO (rojo anota) ---
        else if (
            ballPos.x > 1820 &&
            ballPos.y > this.goalRight.translation().y - goalHeight / 2 &&
            ballPos.y < this.goalRight.translation().y + goalHeight / 2
        ) {
            this.handleGoal('r');
        }
    }

    // Mueve la "barra" tomando como referencia al jugador central
    moveRod(team, dy) {
        if (!team || team.length === 0) return;

        const PLAYER_HEIGHT = 70;
        const margin = 60;
        const fieldHeight = 1080;

        // Obtén las posiciones Y actuales de todos los jugadores de la barra
        const ys = team.map(body => body.translation().y);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);

        // Calcula el centro real de la barra
        const centerY = (minY + maxY) / 2;

        // Calcula el alto real de la barra (de centro a centro) + medio jugador arriba y abajo
        const halfBarHeight = ((maxY - minY) / 2) + (PLAYER_HEIGHT / 2);

        // Límites corregidos
        const topLimit = margin + halfBarHeight;
        const bottomLimit = fieldHeight - margin - halfBarHeight;

        // Nuevo centro Y limitado
        const newCenterY = Phaser.Math.Clamp(centerY + dy, topLimit, bottomLimit);
        const deltaY = newCenterY - centerY;

        // Mueve todos los jugadores de la barra
        for (let i = 0; i < team.length; i++) {
            const body = team[i];
            const pos = body.translation();
            body.setNextKinematicTranslation({ x: pos.x, y: pos.y + deltaY });
        }
    }

    // Patada: aplica un impulso a la pelota si está cerca del centro de la barra
    kickRod(team, dir) {
    const KICK_DISTANCE = 55;   // cuánto avanza la patada
    const KICK_DURATION = 210;   // duración total en ms

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
    handleGoal(team) {
        if (this.goalScored) return;
        this.goalScored = true;

        if (team === 'r') this.scoreA++;
        else this.scoreB++;

        this.scoreText.setText(`${this.scoreA} - ${this.scoreB}`);

        // 💥 Flash visual
        const flash = this.add.rectangle(960, 540, 1920, 1080, 0xffffff)
            .setAlpha(0);
        this.tweens.add({
            targets: flash,
            alpha: { from: 0, to: 0.8 },
            duration: 150,
            yoyo: true,
            onComplete: () => flash.destroy()
        });

        // 🟡 Texto "GOL!"
        const text = this.add.text(960, 540, '¡GOL!', {
            fontSize: '120px',
            color: '#fff',
            fontStyle: 'bold'
        }).setOrigin(0.5).setScale(0);

        this.tweens.add({
            targets: text,
            scale: { from: 0, to: 1.2 },
            alpha: { from: 0, to: 1 },
            duration: 300,
            ease: 'Back.Out',
            yoyo: true,
            hold: 300,
            onComplete: () => text.destroy()
        });

        // ⚙️ Reinicia la pelota después de delay
        this.time.delayedCall(1500, () => {
            this.resetBall();
            this.goalScored = false;
        });
    }


    resetBall() {
        const body = this.ball;
        body.setTranslation({ x: 960, y: 540 }, true);
        body.setLinvel({ x: 0, y: 0 }, true);
        body.setAngvel(0, true);
    }


}
