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
        this.cameras.main.setBackgroundColor(0x0f4c1f);

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

        this.cursors = this.input.keyboard.createCursorKeys();
        this.WASD = this.input.keyboard.addKeys('W,A,S,D');

        this.scoreA = 0;
        this.scoreB = 0;
        this.scoreText = this.add.text(960, 40, '0 - 0', { fontSize: '32px', color: '#fff' }).setOrigin(0.5);

        this.resetBall = () => resetBall(this);

        // this.input.on('pointerdown', () => {
        //     this.ball.applyImpulse({ x: Phaser.Math.Between(-200, 200), y: Phaser.Math.Between(-150, 150) }, true);
        //     this.input.on('pointerdown', () => {
        //     console.log("Click detectado");
        //     console.log("this.ball:", this.ball);
        //     console.log("Ball translation:", this.ball.translation?.());
        //     console.log("Ball type:", typeof this.ball);
        //     console.log("Has applyImpulse:", !!this.ball.applyImpulse);

        // });    });
        
        



    }

    update() {
        if (!this.world) return;
        
        this.world.step();

        // --- Sincronizar objetos visuales con cuerpos físicos ---
        this.world.forEachRigidBody((body) => {
            const userData = body.userData;
            if (userData && userData.setPosition) {
                const t = body.translation();
                userData.setPosition(t.x, t.y);
            }
            this.input.on('pointerdown', () => {
                if (!this.ball) return;
                this.ball.wakeUp();
                
                const forceScale = 10000;

                const impulse = new this.RAPIER.Vector2(forceScale, forceScale);

                this.ball.applyImpulse(impulse, true);
            });
        });


        checkGoal(this);

        let dyA = 0, dyB = 0;
        if (this.WASD.W.isDown) dyA = -23;
        else if (this.WASD.S.isDown) dyA = 23;
        if (this.cursors.up.isDown) dyB = -23;
        else if (this.cursors.down.isDown) dyB = 23;

        this.teams.r.forEach(rod => moveRod(this, rod, dyA));
        this.teams.a.forEach(rod => moveRod(this, rod, dyB));

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
