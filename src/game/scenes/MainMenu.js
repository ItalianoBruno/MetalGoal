import { Scene } from 'phaser';

export class MainMenu extends Scene
{
    constructor ()
    {
        super('MainMenu');
    }

    create ()
    {
        // Obtén el tamaño real del canvas
        const width = this.sys.game.config.width;
        const height = this.sys.game.config.height;

        // Centra el fondo y el logo (ajusta si tienes imágenes grandes)
        this.add.image(width / 2, height / 2, 'background').setDisplaySize(width, height);
        this.add.image(width / 2, height / 2 - 140, 'logo');

        this.add.text(width / 2, height / 2 - 220, 'Main Menu', {
            fontFamily: 'Arial Black', fontSize: 48, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5);

        // Botón VS
        const vsButton = this.add.text(width / 2, height / 2, 'VS', {
            fontFamily: 'Arial', fontSize: 48, color: '#00ff00', backgroundColor: '#222'
        }).setOrigin(0.5).setPadding(32).setInteractive({ useHandCursor: true });

        vsButton.on('pointerdown', () => {
            this.scene.start('Game');
        });

        // Botón Bot
        const botButton = this.add.text(width / 2, height / 2 + 100, 'Bot', {
            fontFamily: 'Arial', fontSize: 48, color: '#00aaff', backgroundColor: '#222'
        }).setOrigin(0.5).setPadding(32).setInteractive({ useHandCursor: true });

        botButton.on('pointerdown', () => {
            this.scene.start('PVE');
        });
        
        // MainMenu.js (dentro de create())
        // ... [Tu código actual de botones (vsButton, pveButton) y listeners] ...

        this.buttons = [vsButton, botButton];
        this.selectedButtonIndex = 0; // Empieza en 'VS'
        this.buttons[this.selectedButtonIndex].setStyle({ backgroundColor: '#555' }); // Resalta el inicial

        // Variables de tiempo para evitar selección múltiple
        this.lastInputTime = 0;
        this.inputDelay = 150;

        // Conectar el gamepad al inicio (Phaser lo gestiona automáticamente)
        this.input.gamepad.once('connected', () => {
            console.log('Gamepad 1 conectado.');
        });
    }
    // MainMenu.js (Añade este nuevo método)
    update(time) {
    const pad = this.input.gamepad.getPad(0);
    if (!pad) return;

    // Evita cambios demasiado rápidos
    if (time - this.lastInputTime < this.inputDelay) return;

    let move = 0;

    // --- D-Pad (arriba/abajo) ---
    if (pad.buttons[12]?.pressed) move = -1; 
    else if (pad.buttons[13]?.pressed) move = 1;

    // --- Joystick izquierdo (eje Y) ---
    const axisY = pad.axes.length > 1 ? pad.axes[1].getValue() : 0;
    if (move === 0) {
        if (axisY < -0.5) move = -1;
        else if (axisY > 0.5) move = 1;
    }

    // --- Mover selección ---
    if (move !== 0) {
        // Quita el color del botón anterior
        this.buttons[this.selectedButtonIndex].setStyle({ backgroundColor: '#222' });

        // Cambia el índice, asegurando que sea circular
        this.selectedButtonIndex = Phaser.Math.Wrap(
            this.selectedButtonIndex + move,
            0,
            this.buttons.length
        );

        // Resalta el nuevo botón
        this.buttons[this.selectedButtonIndex].setStyle({ backgroundColor: '#555' });

        console.log(`[Menu] Selección: ${this.buttons[this.selectedButtonIndex].text}`);
        this.lastInputTime = time;
    }

    // --- Confirmar selección (botón X o A) ---
    if (pad.buttons[0]?.pressed) {
        this.lastInputTime = time;
        const selected = this.buttons[this.selectedButtonIndex].text;

        console.log(`[Menu] Seleccionado: ${selected}`);
        if (selected === 'VS') this.scene.start('Tutorial');
        else if (selected === 'Bot') this.scene.start('PVE');
    }
}

}
