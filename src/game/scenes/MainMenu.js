import { Scene } from 'phaser';
import { initAuth, loginWithGoogle } from '../Metodos/firebase.js';
import { translate } from '../Metodos/i18n.js';
import { detectLanguage } from '../Metodos/lang.js';
import { saveUserLang, loadUserLang } from '../Metodos/langService.js';

export class MainMenu extends Scene {
  constructor() {
    super('MainMenu');
  }

  async create() {
    const width = this.sys.game.config.width;
    const height = this.sys.game.config.height;

    // Firebase Auth
    try {
      await initAuth();
      console.log("Jugador autenticado en Firebase");
    } catch (e) {
      console.error("Error autenticando jugador:", e);
    }

    // Idioma

    let lang = await loadUserLang();
    if (!lang) {
      lang = detectLanguage();
      await saveUserLang(lang);
    }
    this.lang = lang;
    console.log("Idioma activo:", this.lang);

    // Fondo y logo

    this.add.image(width / 2, height / 2, 'background')
      .setDisplaySize(width, height);
    this.add.image(width / 2, height / 2 - 140, 'logo');

    // Textos traducidos

    this.title = this.add.text(width / 2, height / 2 - 220, "Menú Principal", {
      fontFamily: 'Arial Black',
      fontSize: 48,
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 8,
      align: 'center'
    }).setOrigin(0.5);

    // Botón idioma

    const langBtn = this.add.text(180, 65, '🌐', { fontSize: 64 })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    langBtn.on('pointerdown', async () => {
      this.lang = this.lang === 'es' ? 'en' : 'es';
      await saveUserLang(this.lang);
      console.log("Idioma cambiado a:", this.lang);
      this.scene.restart();
    });

    // Login con Google

    const googleBtn = this.add.image(60, 65, 'google')
      .setOrigin(0.5)
      .setScale(0.2)
      .setInteractive({ useHandCursor: true });

    googleBtn.on('pointerdown', async () => {
      try {
        await loginWithGoogle();
        console.log("Login con Google exitoso");
      } catch (e) {
        console.error("Error login Google", e);
      }
    });

    googleBtn.on('pointerover', () => googleBtn.setTint(0xdddddd));
    googleBtn.on('pointerout', () => googleBtn.clearTint());

    // Botones del menú

    const vsButton = this.add.text(width / 2, height / 2, "VS", {
      fontFamily: 'Arial',
      fontSize: 48,
      color: '#00ff00',
      backgroundColor: '#3d3d3dff'
    }).setOrigin(0.5).setPadding(32).setInteractive();

    vsButton.on('pointerdown', () => this.scene.start('Game'));
    vsButton.on('pointerover', () => vsButton.setTint(0xdddddd));
    vsButton.on('pointerout', () => vsButton.clearTint());

    const botButton = this.add.text(width / 2, height / 2 + 120, "BOT", {
      fontFamily: 'Arial',
      fontSize: 48,
      color: '#00aaff',
      backgroundColor: '#3d3d3dff'
    }).setOrigin(0.5).setPadding(32).setInteractive();

    botButton.on('pointerdown', () => this.scene.start('PVE'));
    botButton.on('pointerover', () => botButton.setTint(0xdddddd));
    botButton.on('pointerout', () => botButton.clearTint());

    // Gamepad (Mando)
    this.buttons = [vsButton, botButton];
    this.selectedButtonIndex = 0;
    this.buttons[0].setStyle({ backgroundColor: '#555' });

    this.lastInputTime = 0;
    this.inputDelay = 150;

    this.input.gamepad.once('connected', () => {
      console.log('Gamepad conectado');
    });
  }

  update(time) {
    const pad = this.input.gamepad.getPad(0);
    if (!pad) return;
    if (time - this.lastInputTime < this.inputDelay) return;

    let move = 0;

    if (pad.buttons[12]?.pressed) move = -1;
    else if (pad.buttons[13]?.pressed) move = 1;

    const axisY = pad.axes[1]?.getValue() ?? 0;
    if (move === 0) {
      if (axisY < -0.5) move = -1;
      else if (axisY > 0.5) move = 1;
    }

    if (move !== 0) {
      this.buttons[this.selectedButtonIndex]
        .setStyle({ backgroundColor: '#222' });

      this.selectedButtonIndex = Phaser.Math.Wrap(
        this.selectedButtonIndex + move,
        0,
        this.buttons.length
      );

      this.buttons[this.selectedButtonIndex]
        .setStyle({ backgroundColor: '#555' });

      this.lastInputTime = time;
    }

    if (pad.buttons[0]?.pressed) {
      const selected = this.buttons[this.selectedButtonIndex].text;
      this.lastInputTime = time;

      if (selected === 'VS') this.scene.start('Tutorial');
      else this.scene.start('PVE');
    }
  }
}
