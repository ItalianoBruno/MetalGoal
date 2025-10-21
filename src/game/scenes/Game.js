import RAPIER from '@dimforge/rapier2d-compat';
import { Scene } from 'phaser';
import { createBoundaries } from '../Metodos/Limites.js';
import { createBall, resetBall } from '../Metodos/Pelota.js';
import { createRod, moveRod, kickRod} from '../Metodos/Jugadores.js';
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
        
        this.scoreA = 0;
        this.scoreB = 0;
        this.scoreText = this.add.text(960, 100, '0 - 0', {
            fontFamily: 'Arial Black', fontSize: 80, color: '#ffffff',
            stroke: '#000000', strokeThickness: 12,
            align: 'center'
        }).setOrigin(0.5).setDepth(10);
        
        this.goalScored = false;
        
        // NUEVO: Inicializar el contador para la pelota quieta
        this.lastBallMoveTime = this.time.now;

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

    // Game.js (Método update corregido)

// Game.js (Método update completo)

// Game.js (Método update completo y corregido)

// --- Game.js (método update completo) ---

update(time, delta) {
    if (!this.world) return;
    
    // 1. Declarar pads AHORA para que la lógica de Gamepad funcione
    const pads = this.input.gamepad.gamepads.filter(p => p && p.connected);

    // 2. Ejecución de la simulación de física
    this.world.step();

    // --- Sincronización ---
    // NOTA: Esta iteración es correcta, ya que forEachRigidBody recorre todos los cuerpos creados.
    this.world.forEachRigidBody((body) => {
        const userData = body.userData;
        if (userData && userData.setPosition) {
            const t = body.translation();
            userData.setPosition(t.x, t.y);
        }
    });

    // -------------------------------------------------------------
    // === 2.5. REACTIVACIÓN DE LA PELOTA QUIETA (1.5 segundos) ======
    // -------------------------------------------------------------
    if (this.ball && !this.goalScored) {
        const ballVel = this.ball.linvel();
        // Usamos el cuadrado de la magnitud para evitar cálculos de raíz cuadrada (más eficiente)
        const speedSq = ballVel.x * ballVel.x + ballVel.y * ballVel.y;
        const MIN_MOVE_SPEED_SQ = 10 * 10; // Mínima velocidad (ej: 10px/s)

        if (speedSq > MIN_MOVE_SPEED_SQ) {
            // Pelota en movimiento: actualizar el tiempo de último movimiento
            this.lastBallMoveTime = time;
        } else {
            // Pelota quieta: verificar el tiempo transcurrido
            const timeStopped = time - this.lastBallMoveTime;
            const TIMEOUT = 1500; // 2 segundos
            
            if (timeStopped > TIMEOUT) {
                // Aplicar un impulso aleatorio
                const pushStrength = 3000; // Fuerza del impulso
                const angle = Phaser.Math.Between(0, 360); // Ángulo aleatorio en grados
                const velX = Math.cos(angle * Phaser.Math.DEG_TO_RAD) * pushStrength;
                const velY = Math.sin(angle * Phaser.Math.DEG_TO_RAD) * pushStrength;
                
                this.ball.wakeUp(); // Asegurarse de que el cuerpo dinámico esté activo
               // Game.js:136 (Código Corregido)
                this.ball.applyImpulse(new this.RAPIER.Vector2(velX, velY), true);
                
                // Reiniciar el contador de tiempo de movimiento
                this.lastBallMoveTime = time; 
                console.log("Pelota quieta detectada. Aplicando impulso aleatorio.");
            }
        }
    }
    // -------------------------------------------------------------


    // --- Clic con mouse (debe ser refactorizado fuera de update, pero lo dejo) ---
    // NOTA: Mover la creación de este evento (this.input.on) a `create()` para que no se ejecute 60 veces por segundo. 
    // Si lo dejas aquí, está creando ~60 eventos por segundo, lo cual es ineficiente.
    /*
    this.input.on('pointerdown', (pointer) => {
        if (!this.ball) return;
        this.ball.wakeUp();
        const ballPos = this.ball.translation();
        const dx = pointer.x - ballPos.x;
        const dy = pointer.y - ballPos.y;
        const length = Math.sqrt(dx * dx + dy * dy) || 1;
        const forceScale = 500;
        const impulse = new this.RAPIER.Vector2(
            (dx / length) * forceScale,
            (dy / length) * forceScale
        );
        this.ball.applyImpulse(impulse, true);
    });
    */

    checkGoal(this);

    
    // ===========================================================
    // === 3. MOVIMIENTO VERTICAL (Teclado + Gamepad) ============
    // ===========================================================
    let dyA = 0, dyB = 0;
    const MAX_SPEED = 20;

    // Teclado
    if (this.WASD.W.isDown) dyA = -MAX_SPEED;
    else if (this.WASD.S.isDown) dyA = MAX_SPEED;

    if (this.cursors.up.isDown) dyB = -MAX_SPEED;
    else if (this.cursors.down.isDown) dyB = MAX_SPEED;

    // Gamepad (se usa la variable pads definida al inicio)
    pads.forEach((pad, i) => {
        const axisY = pad.axes.length > 1 ? pad.axes[1].getValue() : 0;
        const dpadUp = pad.buttons[12]?.pressed;
        const dpadDown = pad.buttons[13]?.pressed;
        let dyGamepad = 0;

        if (dpadUp) dyGamepad = -MAX_SPEED;
        else if (dpadDown) dyGamepad = MAX_SPEED;
        else if (Math.abs(axisY) > 0.2) dyGamepad = axisY * MAX_SPEED;

        if (Math.abs(dyGamepad) > 0.1) {
            if (i === 0) dyA = dyGamepad;
            else if (i === 1) dyB = dyGamepad;
        }
    });

    // APLICAR MOVIMIENTO: Iterar sobre CADA BARRA (rodGroup)
    this.teams.r.forEach(rodGroup => moveRod(this, rodGroup, dyA)); 
    this.teams.a.forEach(rodGroup => moveRod(this, rodGroup, dyB));

    // ===========================================================
    // === 4. PATADAS (KickRod Unificado) ========================
    // ===========================================================

    // --- A. TECLADO ---
    // Iterar sobre CADA BARRA, y luego sobre CADA JUGADOR (player)
    this.teams.r.forEach(rodGroup => {
        rodGroup.forEach(player => {
            const kickOut = this.WASD.A.isDown;
            const kickIn = this.WASD.D.isDown;
            const dir = kickIn ? 1 : (kickOut ? -1 : 0);
            const isHolding = kickOut || kickIn;

            kickRod(this, player, dir, isHolding);
        });
    });
    this.teams.a.forEach(rodGroup => {
        rodGroup.forEach(player => {
            const kickOut = this.cursors.left.isDown;
            const kickIn = this.cursors.right.isDown;
            const dir = kickIn ? 1 : (kickOut ? -1 : 0);
            const isHolding = kickOut || kickIn;

            kickRod(this, player, dir, isHolding);
        });
    });

    // --- B. GAMEPAD ---
    pads.forEach((pad, i) => {
        if (!pad) return;

        const leftHeld = !!pad.buttons[6]?.pressed;
        const rightHeld = !!pad.buttons[7]?.pressed;

        const teamRods = (i === 0) ? this.teams.r : this.teams.a;

        const dir = rightHeld ? 1 : (leftHeld ? -1 : 0);
        const isHolding = leftHeld || rightHeld;

        // Iterar sobre CADA BARRA, y luego sobre CADA JUGADOR
        teamRods.forEach(rodGroup => {
            rodGroup.forEach(player => {
                kickRod(this, player, dir, isHolding);
            });
        });

        // Guardar el estado actual de los botones para la próxima iteración (Detección de JustDown)
        pad._prevButtons = pad.buttons.map(b => b?.pressed);
    });

    // ===========================================================
    debugDraw(this);
}


}
