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
    }
}
