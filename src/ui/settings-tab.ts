import { App, Notice, PluginSettingTab, Setting } from 'obsidian';
import type SbeYougilePlugin from '../main';
import { PASSWORD_SECRET_ID } from '../services/auth';

export class YouGileSettingsTab extends PluginSettingTab {
  private plugin: SbeYougilePlugin;

  constructor(app: App, plugin: SbeYougilePlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl('h2', { text: 'SBE YouGile' });
    containerEl.createEl('p', {
      cls: 'tn-muted',
      text: 'Центральный сервис авторизации YouGile для всех плагинов системы SBE. API-ключ и пароль хранятся защищённо (secretStorage Obsidian).',
    });

    new Setting(containerEl)
      .setName('Логин')
      .setDesc('Логин пользователя YouGile.')
      .addText(text => text
        .setPlaceholder('user@company.ru')
        .setValue(this.plugin.settings.login)
        .onChange(async (value) => {
          this.plugin.settings.login = value.trim();
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Пароль')
      .setDesc('Секрет хранится защищённо. Пустое поле — без изменений.')
      .addText(text => {
        text.inputEl.type = 'password';
        text.setPlaceholder('••••••••');
        text.onChange((value) => {
          if (!value) return;
          this.plugin.saveSecret(PASSWORD_SECRET_ID, value);
        });
        return text;
      });

    new Setting(containerEl)
      .setName('ID компании')
      .setDesc('UUID рабочего пространства YouGile (например, e6255265-7f76-4c8e-af38-607114d00703).')
      .addText(text => text
        .setPlaceholder('xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx')
        .setValue(this.plugin.settings.companyId)
        .onChange(async (value) => {
          this.plugin.settings.companyId = value.trim();
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Состояние')
      .setDesc('Текущий статус сервиса.')
      .addText(text => {
        text.setValue(this.describeStatus());
        text.setDisabled(true);
        text.inputEl.addClass('tn-muted');
        return text;
      })
      .addButton(btn => btn
        .setButtonText('Обновить')
        .onClick(() => {
          this.display();
        }));

    new Setting(containerEl)
      .setName('Авторизация')
      .setDesc('Получение API-ключа YouGile по логину, паролю и ID компании.')
      .addButton(btn => {
        btn.setButtonText('Получить ключ');
        btn.setCta();
        btn.onClick(async () => {
          btn.buttonEl.disabled = true;
          try {
            await this.plugin.auth.authenticate();
            new Notice('SBE YouGile: API ключ получен и сохранён защищённо');
            this.display();
          } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            new Notice(`SBE YouGile: не удалось получить ключ — ${message}`);
          } finally {
            btn.buttonEl.disabled = false;
          }
        });
        return btn;
      });
  }

  private describeStatus(): string {
    const status = this.plugin.auth.getStatus();
    if (status.authenticated) {
      return `Авторизован (${status.login ?? '?'}, компания ${status.companyId ?? '?'})`;
    }
    return 'API-ключ не получен';
  }
}