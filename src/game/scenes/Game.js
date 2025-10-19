import RAPIER from '@dimforge/rapier2d-compat';
import { Scene } from 'phaser';
import { createBoundaries } from '../Metodos/Limites.js';
import { createBall, resetBall } from '../Metodos/Pelota.js';
import { createRod, moveRod, kickRod } from '../Metodos/Jugadores.js';
import { createGoal, checkGoal } from '../Metodos/Goles.js';
import { debugDraw } from '../Metodos/Debug.js';

export class Game extends Scene {
    constructor() { super('Game'); }

    async create() {
        this.RAPIER = RAPIER;
        await RAPIER.init();
        this.world = new RAPIER.World(new RAPIER.Vector2(0, 0));
        // this.cameras.main.setBackgroundColor(0x0f4c1f);

        createBoundaries(this);
        this.add.image(960, 540, 'cancha')
        .setOrigin(0.5)
        .setDisplaySize(1920, 1080)
        .setDepth(-10);

        const rods = [
            { count: 1, color: 0xff0000, key: 'r', offsetX: 100 },
            { count: 2, color: 0xff0000, key: 'r', offsetX: 350 },
            { count: 3, color: 0x0000ff, key: 'a' },
            { count: 5, color: 0xff0000, key: 'r' },
            { count: 5, color: 0x0000ff, key: 'a' },
            { count: 3, color: 0xff0000, key: 'r' },
            { count: 2, color: 0x0000ff, key: 'a', offsetX: 1570 },
            { count: 1, color: 0x0000ff, key: 'a', offsetX: 1820 },
        ];

        const fieldWidth = 1920, margin = 120, usableWidth = fieldWidth - margin * 2;
        const rodSpacing = usableWidth / (rods.length - 1);
        this.teams = { r: [], a: [] };

        rods.forEach((rod, i) => {
            const x = (rod.offsetX !== undefined) ? rod.offsetX : margin + i * rodSpacing;
            const group = createRod(this, x, rod.count, rod.color);
            this.teams[rod.key].push(group);
        });

        this.ball = createBall(this, 960, 540);
        // console.log("Pelota creada:", this.ball);

        this.goalLeft = createGoal(this, 60, 540);
        this.goalRight = createGoal(this, 1860, 540);

        // controles KeyBoard
        this.cursors = this.input.keyboard.createCursorKeys();
        this.WASD = this.input.keyboard.addKeys('W,A,S,D');

        // Controles Gamepad
        this.input.gamepad.once('connected', (pad) => {
            console.log('Mando conectado:', pad.id);
            this.pad = pad;
        });


        this.scoreA = 0;
        this.scoreB = 0;
        this.scoreText = this.add.text(960, 40, '0 - 0', { fontSize: '32px', color: '#fff' }).setOrigin(0.5);

        this.resetBall = () => resetBall(this);   
        
    }

    // Game.js (Fragmento del método update)

    update() {
        if (!this.world) return;
        
        this.world.step();

        // 1. Sincronización de cuerpos (NO TOCAR, ESTÁ BIEN)
        this.world.forEachRigidBody((body) => {
            const userData = body.userData;
            if (userData && userData.setPosition) {
                const t = body.translation();
                userData.setPosition(t.x, t.y);
            }
            this.input.on('pointerdown', (pointer) => {
                if (!this.ball) return;

                this.ball.wakeUp();

                const ballPos = this.ball.translation();
                const dx = pointer.x - ballPos.x;
                const dy = pointer.y - ballPos.y;
                const length = Math.sqrt(dx * dx + dy * dy) || 1; // evitar /0

                const forceScale = 50; // ajustá la fuerza a gusto

                const impulse = new this.RAPIER.Vector2(
                    (dx / length) * forceScale,
                    (dy / length) * forceScale
                );

                this.ball.applyImpulse(impulse, true);
            });
        });

        checkGoal(this);

        // -------------------------------------------------------------
        // --- 2. CÁLCULO DE VELOCIDADES FINALES (Unificación de Input) ---
        // -------------------------------------------------------------
        
        let dyA = 0; // Velocidad final para Equipo 'r' (Player 1)
        let dyB = 0; // Velocidad final para Equipo 'a' (Player 2)
        const MAX_SPEED = 23; // Velocidad del teclado

        // Inicializar con Teclado
        if (this.WASD.W.isDown) dyA = -MAX_SPEED;
        else if (this.WASD.S.isDown) dyA = MAX_SPEED;

        if (this.cursors.up.isDown) dyB = -MAX_SPEED;
        else if (this.cursors.down.isDown) dyB = MAX_SPEED;

        // Procesar Gamepad (Sobrescribe las velocidades del teclado si hay input)
        const pads = this.input.gamepad.gamepads.filter(p => p && p.connected);

        pads.forEach((pad, i) => {
            if (!pad) return;

            // Eje vertical del stick izquierdo. Usamos un umbral de 0.2
            const axisY = pad.axes.length > 1 ? pad.axes[1].getValue() : 0;
            
            // D-Pad (Cruceta)
            const dpadUp = pad.buttons[12]?.pressed || false;
            const dpadDown = pad.buttons[13]?.pressed || false;

            let dyGamepad = 0; 

            // Prioridad al D-Pad o Stick
            if (dpadUp) dyGamepad = -MAX_SPEED;
            else if (dpadDown) dyGamepad = MAX_SPEED;
            // La velocidad se limita a MAX_SPEED para coherencia
            else if (Math.abs(axisY) > 0.2) dyGamepad = axisY * MAX_SPEED; 
            
            // Asignación de EQUIPO y aplicación de patada
            if (Math.abs(dyGamepad) > 0.1) {
                if (i === 0) dyA = dyGamepad; // Mando 1 mueve al Equipo 'r'
                else if (i === 1) dyB = dyGamepad; // Mando 2 mueve al Equipo 'a'
            }

            // Patadas (L2/R2) - Sigue funcionando, solo reubicado
            if (pad.buttons[6]?.pressed) {
                if (i === 0) this.teams.r.forEach(rod => kickRod(this, rod, -1));
                else this.teams.a.forEach(rod => kickRod(this, rod, -1));
            }
            if (pad.buttons[7]?.pressed) {
                if (i === 0) this.teams.r.forEach(rod => kickRod(this, rod, 1));
                else this.teams.a.forEach(rod => kickRod(this, rod, 1));
            }
        });

        // -------------------------------------------------------------
        // --- 3. APLICAR MOVIMIENTO VERTICAL (Llamada Final Única) ---
        // -------------------------------------------------------------
        this.teams.r.forEach(rod => moveRod(this, rod, dyA));
        this.teams.a.forEach(rod => moveRod(this, rod, dyB));

        // -------------------------------------------------------------
        // --- 4. PATADAS DE TECLADO ---
        // -------------------------------------------------------------

        if (Phaser.Input.Keyboard.JustDown(this.WASD.A))
            this.teams.r.forEach(rod => kickRod(this, rod, -1));
        if (Phaser.Input.Keyboard.JustDown(this.WASD.D))
            this.teams.r.forEach(rod => kickRod(this, rod, 1));
        if (Phaser.Input.Keyboard.JustDown(this.cursors.left))
            this.teams.a.forEach(rod => kickRod(this, rod, -1));
        if (Phaser.Input.Keyboard.JustDown(this.cursors.right))
            this.teams.a.forEach(rod => kickRod(this, rod, 1));

        debugDraw(this);
    }
}
