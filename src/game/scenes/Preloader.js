import { Scene } from 'phaser';

export class Preloader extends Scene {
    constructor() {
        super('Preloader');
    }

    init() {
        // Fondo simple de carga
        this.add.rectangle(960, 540, 1920, 1080, 0x000000);

        // Texto y barra de carga
        this.add.text(960, 450, 'Cargando...', { fontSize: '28px', color: '#ffffff' }).setOrigin(0.5);

        this.add.rectangle(960, 540, 468, 32).setStrokeStyle(1, 0xffffff);
        const bar = this.add.rectangle(730, 540, 4, 28, 0xffffff);

        // Actualiza el ancho de la barra
        this.load.on('progress', (progress) => {
            bar.width = 4 + (460 * progress);
        });
    }

    preload() {
        // Carpeta donde están los assets
        this.load.setPath('assets');

        // ==== IMÁGENES ====
        this.load.image('logo', 'logo.png');
        this.load.image('menuCarteles', 'menu carteles.png');
        this.load.image('menu2', 'menu2.png');
        this.load.image('bg', 'bg.png');
        this.load.image('cancha', 'cancha1.jpg');
        this.load.image('Cancha', 'Cancha.png');
        this.load.image('Barra', 'Barra.png');
        this.load.image('PJ1', 'PJ1.png');
        this.load.image('PJ1a', 'PJ1a.png');
        this.load.image('PJ2', 'PJ2.png');
        this.load.image('PJ2a', 'PJ2a.png');
    }

    create() {
        // Pequeño fade para que no corte abruptamente
        this.cameras.main.fadeIn(500, 0, 0, 0);

        // Pasar a la escena del menú principal
        this.scene.start('MainMenu');
    }
}
