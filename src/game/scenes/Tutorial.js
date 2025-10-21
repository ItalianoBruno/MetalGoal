import { Scene } from 'phaser';

export class Tutorial extends Scene
{
    constructor () {
        super('Tutorial');
    }

    create () {
        this.cameras.main.setBackgroundColor(0x333333);
        const width = this.sys.game.config.width;
        const height = this.sys.game.config.height;

        // Título del Tutorial
        this.add.text(width / 2, 100, 'TUTORIAL - CONTROLES', { 
            fontFamily: 'Arial Black', fontSize: 60, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
        }).setOrigin(0.42);

        // Texto de Controles
        const controlsText = `
        --- Controles de Mando---
        Movimiento: ⬆️/⬇️ o L3
        Patada Izq: L2
        Patada Der: R2

        Si la pelota queda atascada
        ¡Hace clic en el campo!

        Para reiniciar el juego, apretá la barra espaciadora

        --- PARA COMENZAR ---
        MANTÉN presionado X en AMBOS MANDOS por 2 segundos.
        (O presiona ESPACIO en el teclado)
        `;

        this.add.text(width / 2, height / 2, controlsText, {
            fontFamily: 'Arial', fontSize: 32, color: '#ffffff',
            align: 'center', lineHeight: 45
        }).setOrigin(0.5);

        // Variables de estado
        this.player1Ready = false;
        this.player2Ready = false;
        this.readyDuration = 2000; // 2 segundos
        this.readyText = this.add.text(width / 2, height - 100, 'Esperando a los jugadores...', { 
            fontFamily: 'Arial Black', fontSize: 40, color: '#FFD700' 
        }).setOrigin(0.5);

        // Eventos de teclado para iniciar (opcional, por si no hay mandos)
        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.start('Game');
        });
    }

    update(time, delta) {
        const pads = this.input.gamepad.gamepads.filter(p => p && p.connected);
        
        // 1. Detección de 'Ready'
        const p1Pad = pads[0];
        const p2Pad = pads[1]; 
        
        // Player 1: Chequear botón A/X (index 0)
        this.player1Ready = p1Pad && p1Pad.buttons[0]?.pressed;

        // Player 2: Chequear botón A/X (index 0) si hay un segundo mando
        this.player2Ready = p2Pad && p2Pad.buttons[0]?.pressed;

        // 2. Gestión de estado
        if (this.player1Ready && this.player2Ready) {
            this.readyText.setText('LISTOS! MANTENIENDO POR ' + ((this.readyDuration - this.readyTimer) / 1000).toFixed(1) + 's');
            this.readyTimer += delta;

            if (this.readyTimer >= this.readyDuration) {
                this.scene.start('Game');
            }
        } else {
            this.readyText.setText('Esperando a los jugadores...');
            this.readyTimer = 0; // Reiniciar el contador si alguien lo suelta
        }

        // Si solo hay un mando, el juego se puede iniciar con solo el P1, o con la barra espaciadora.
        if (pads.length === 1 && this.player1Ready && this.readyTimer >= this.readyDuration) {
             this.scene.start('Game');
        } else if (pads.length < 2 && this.player1Ready) {
            this.readyText.setText('Esperando Player 2...');
        }
    }
}
