import RAPIER from '@dimforge/rapier2d-compat';
import { Scene } from 'phaser';
import { createBoundaries } from '../Metodos/Limites.js';
import { createBall, resetBall } from '../Metodos/Pelota.js';
import { createRod, moveRod, kickRod, holdKick } from '../Metodos/Jugadores.js';
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

    // Sincronización
    this.world.forEachRigidBody((body) => {
        const userData = body.userData;
        if (userData && userData.setPosition) {
            const t = body.translation();
            userData.setPosition(t.x, t.y);
        }
    });

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

    checkGoal(this);

    // ===== INPUT VERTICAL =====
    let dyA = 0, dyB = 0;
    const MAX_SPEED = 20;

    if (this.WASD.W.isDown) dyA = -MAX_SPEED;
    else if (this.WASD.S.isDown) dyA = MAX_SPEED;
    if (this.cursors.up.isDown) dyB = -MAX_SPEED;
    else if (this.cursors.down.isDown) dyB = MAX_SPEED;

    // Gamepads
    const pads = this.input.gamepad.gamepads.filter(p => p && p.connected);
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

    // ===== MOVIMIENTO =====
    const redPlayers = this.teams.r.flat();
    const bluePlayers = this.teams.a.flat();
    this.teams.r.forEach(rod => moveRod(this, rod, dyA));
    this.teams.a.forEach(rod => moveRod(this, rod, dyB));

    // ===== PATADAS (Teclado) =====
    const redHoldLeft = this.WASD.A.isDown;
    const redHoldRight = this.WASD.D.isDown;
    const blueHoldLeft = this.cursors.left.isDown;
    const blueHoldRight = this.cursors.right.isDown;

    redPlayers.forEach(player => {
        if (redHoldLeft) holdKick(this, [player], -1, true);
        else if (redHoldRight) holdKick(this, [player], 1, true);
        else holdKick(this, [player], 0, false);
    });

    bluePlayers.forEach(player => {
        if (blueHoldLeft) holdKick(this, [player], -1, true);
        else if (blueHoldRight) holdKick(this, [player], 1, true);
        else holdKick(this, [player], 0, false);
    });

    if (Phaser.Input.Keyboard.JustDown(this.WASD.A))
        redPlayers.forEach(player => kickRod(this, [player], -1));
    if (Phaser.Input.Keyboard.JustDown(this.WASD.D))
        redPlayers.forEach(player => kickRod(this, [player], 1));
    if (Phaser.Input.Keyboard.JustDown(this.cursors.left))
        bluePlayers.forEach(player => kickRod(this, [player], -1));
    if (Phaser.Input.Keyboard.JustDown(this.cursors.right))
        bluePlayers.forEach(player => kickRod(this, [player], 1));

    // ===== PATADAS (MANDO) =====
    pads.forEach((pad, i) => {
        const team = i === 0 ? redPlayers : bluePlayers;

        const leftHeld = !!pad.buttons[6]?.pressed;
        const rightHeld = !!pad.buttons[7]?.pressed;

        team.forEach(player => {
            if (leftHeld) holdKick(this, [player], -1, true);
            else if (rightHeld) holdKick(this, [player], 1, true);
            else holdKick(this, [player], 0, false);
        });

        if (!pad._prevButtons) pad._prevButtons = [];
        const prev6 = !!pad._prevButtons[6];
        const prev7 = !!pad._prevButtons[7];

        if (pad.buttons[6]?.pressed && !prev6)
            team.forEach(player => kickRod(this, [player], -1));
        if (pad.buttons[7]?.pressed && !prev7)
            team.forEach(player => kickRod(this, [player], 1));

        pad._prevButtons[6] = leftHeld;
        pad._prevButtons[7] = rightHeld;
    });

    debugDraw(this);
}

}
