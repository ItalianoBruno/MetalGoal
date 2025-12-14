import RAPIER from '@dimforge/rapier2d-compat';
import { Scene } from 'phaser';
import { createBoundaries } from '../Metodos/Limites.js';
import { createBall, resetBall } from '../Metodos/Pelota.js';
import { createRod, moveRod, kickRod } from '../Metodos/Jugadores.js';
import { createGoal, checkGoal } from '../Metodos/Goles.js';
import { debugDraw } from '../Metodos/Debug.js';

export class PVE extends Scene {
    constructor() { super('PVE'); }

    async create() {
        this.RAPIER = RAPIER;
        await RAPIER.init();
        this.world = new RAPIER.World(new RAPIER.Vector2(0, 0));

        createBoundaries(this);
        this.add.image(960, 540, 'cancha')
            .setOrigin(0.5)
            .setDisplaySize(1920, 1080)
            .setDepth(-10);

        // --- CONFIGURACIÓN DE EQUIPOS ---
        const rods = [
            { count: 1, color: 0xff0000, key: 'r', offsetX: 100 },   // arquero jugador
            { count: 2, color: 0xff0000, key: 'r', offsetX: 350 },
            { count: 3, color: 0x0000ff, key: 'a' },                 // IA
            { count: 5, color: 0xff0000, key: 'r' },
            { count: 5, color: 0x0000ff, key: 'a' },
            { count: 3, color: 0xff0000, key: 'r' },
            { count: 2, color: 0x0000ff, key: 'a', offsetX: 1570 },
            { count: 1, color: 0x0000ff, key: 'a', offsetX: 1820 },  // arquero IA
        ];

        const fieldWidth = 1920, margin = 120, usableWidth = fieldWidth - margin * 2;
        const rodSpacing = usableWidth / (rods.length - 1);
        this.teams = { r: [], a: [] };

        rods.forEach((rod, i) => {
            const x = (rod.offsetX !== undefined) ? rod.offsetX : margin + i * rodSpacing;
            const group = createRod(this, x, rod.count, rod.color, rod.key);
            this.teams[rod.key].push(group);
        });

        this.ball = createBall(this, 960, 540);
        this.goalLeft = createGoal(this, 60, 540);
        this.goalRight = createGoal(this, 1860, 540);

        this.scoreA = 0;
        this.scoreB = 0;
        this.scoreText = this.add.text(960, 100, '0 - 0', {
            fontFamily: 'Arial Black', fontSize: 80, color: '#ffffff',
            stroke: '#000000', strokeThickness: 12, align: 'center'
        }).setOrigin(0.5).setDepth(10);

        this.goalScored = false;
        this.lastBallMoveTime = this.time.now;

        // --- INPUTS ---
        this.cursors = this.input.keyboard.createCursorKeys();
        this.WASD = this.input.keyboard.addKeys('W,A,S,D');
        this.input.gamepad.once('connected', pad => this.pad = pad);
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // --- TEXTO "MACHACÁ" ---
        this.mashText = this.add.text(960, 200, "¡Machacá X o Espacio para darle vida a la pelota!", {
            fontSize: "36px", fontFamily: "Arial Black", color: "#ffcc00",
            stroke: "#000000", strokeThickness: 6
        }).setOrigin(0.5).setDepth(100).setVisible(false);

        this.tweens.add({
            targets: this.mashText,
            y: 180,
            duration: 600,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut"
        });

        // --- Volver al tutorial ---
        this.input.keyboard.on('keydown-R', () => this.scene.start('Tutorial'));
        this.input.gamepad.on('down', (pad, index) => {
            if (index === 9) this.scene.start('Tutorial');
        });
    }

    update(time, delta) {
        if (!this.world) return;
        const pads = this.input.gamepad.gamepads.filter(p => p && p.connected);
        this.world.step();

        // --- Sincronización visual ---
        this.world.forEachRigidBody((body) => {
            const userData = body.userData;
            if (userData && userData.setPosition) {
                const t = body.translation();
                userData.setPosition(t.x, t.y);
            }
        });

        // =============================
        // === MACHACAR LA PELOTA ===
        // =============================
        if (!this.ballMashCount) this.ballMashCount = 0;
        if (!this.mashActive) this.mashActive = false;

        const MASH_LIMIT = 20;
        const pushStrength = 850_900;

        // Teclado
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            this.ballMashCount++;
        }

        // Gamepad
        pads.forEach(pad => {
            if (pad.buttons[0]?.pressed && !pad._prevXPressed) {
                this.ballMashCount++;
            }
            pad._prevXPressed = pad.buttons[0]?.pressed;
        });

        const vel = this.ball.linvel();
        const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y);
        const TIMEOUT = 100;
        if (!this.lastBallMoveTime) this.lastBallMoveTime = 0;

        if (speed > 0.1) {
            this.lastBallMoveTime = time;
            this.mashText.setVisible(false);
            this.mashActive = false;
        } else if (time - this.lastBallMoveTime > TIMEOUT && !this.mashActive) {
            this.mashText.setVisible(true);
            this.mashActive = true;
        }

        if (this.ballMashCount >= MASH_LIMIT) {
            const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
            const velX = Math.cos(angle) * pushStrength;
            const velY = Math.sin(angle) * pushStrength;
            this.ball.wakeUp();
            this.ball.applyImpulse(new this.RAPIER.Vector2(velX, velY), true);
            this.lastBallMoveTime = time;
            this.ballMashCount = 0;
            this.mashText.setVisible(false);
            this.mashActive = false;
        }

        // =============================
        // === MOVIMIENTO Y PATADAS ===
        // =============================
        let dyA = 0;
        const MAX_SPEED = 20;

        // Jugador (rojo)
        if (this.WASD.W.isDown) dyA = -MAX_SPEED;
        else if (this.WASD.S.isDown) dyA = MAX_SPEED;

        this.teams.r.forEach(rodGroup => moveRod(this, rodGroup, dyA));

        // --- PATADAS jugador ---
        this.teams.r.forEach(rodGroup => {
            rodGroup.forEach(player => {
                const kickOut = this.WASD.A.isDown;
                const kickIn = this.WASD.D.isDown;
                const dir = kickIn ? 1 : (kickOut ? -1 : 0);
                const isHolding = kickOut || kickIn;
                kickRod(this, player, dir, isHolding);
            });
        });

        // =============================
        // === IA DEL EQUIPO AZUL ===
        // =============================
        this.aiControl(time);

        checkGoal(this);
        // debugDraw(this); // opcional
    }

    aiControl(time) {
        const ballPos = this.ball.translation();

        // Mover la barra azul más cercana al balón
        let closestRod = null;
        let minDist = Infinity;
        for (const rodGroup of this.teams.a) {
            const centerIndex = Math.floor(rodGroup.length / 2);
            const player = rodGroup[centerIndex];
            const pos = player.translation();
            const dist = Math.abs(pos.x - ballPos.x);
            if (dist < minDist) {
                minDist = dist;
                closestRod = rodGroup;
            }
        }

        if (closestRod) {
            // Seguir pelota en Y
            const centerIndex = Math.floor(closestRod.length / 2);
            const player = closestRod[centerIndex];
            const pos = player.translation();
            const dy = ballPos.y - pos.y;
            const speed = Phaser.Math.Clamp(dy, -18, 18);
            moveRod(this, closestRod, speed);

            // Patear automáticamente si está cerca
            const dx = Math.abs(pos.x - ballPos.x);
            const dyBall = Math.abs(pos.y - ballPos.y);
            if (dx < 90 && dyBall < 100) {
                closestRod.forEach(p => kickRod(this, p, -1, true)); // patea hacia la izquierda
            }
        }
    }
}
