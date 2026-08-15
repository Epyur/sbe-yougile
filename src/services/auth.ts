import type SbeYougilePlugin from '../main';

export const PASSWORD_SECRET_ID = 'sbe-yougile-password';
export const API_KEY_SECRET_ID = 'sbe-yougile-apikey';

export class YouGileAuthService {
  private plugin: SbeYougilePlugin;

  constructor(plugin: SbeYougilePlugin) {
    this.plugin = plugin;
  }

  getStatus(): { authenticated: boolean; companyId?: string; login?: string } {
    const secretName = this.plugin.settings.apiKeySecret;
    const authenticated = secretName.length > 0 && this.plugin.getSecretValue(secretName) !== null;
    return {
      authenticated,
      companyId: this.plugin.settings.companyId || undefined,
      login: this.plugin.settings.login || undefined,
    };
  }

  async authenticate(): Promise<void> {
    const { login, companyId } = this.plugin.settings;
    const password = this.plugin.getSecretValue(PASSWORD_SECRET_ID);
    if (!login || !password || !companyId) {
      throw new Error('Заполните логин, пароль и ID компании в настройках');
    }
    const key = await this.plugin.client.auth(login, password, companyId);
    this.plugin.saveSecret(API_KEY_SECRET_ID, key);
    this.plugin.settings.apiKeySecret = API_KEY_SECRET_ID;
    await this.plugin.saveSettings();
  }
}