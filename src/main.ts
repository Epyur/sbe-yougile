import { Plugin } from 'obsidian';
import { YouGileClient } from './api/client';
import { YouGileAuthService, API_KEY_SECRET_ID } from './services/auth';
import { YouGileSettingsTab } from './ui/settings-tab';
import { publishService, unpublishService } from '../../sbe-core/src/bridge';
import { errorMessage } from '../../sbe-core/src/utils/errors';
import type { SbeYougileApi } from '../../sbe-core/src/types';
import type { CreateTaskPayload } from './types/yougile';

export interface SbeYougileSettings {
  login: string;
  companyId: string;
  apiKeySecret: string;
}

const DEFAULT_SETTINGS: SbeYougileSettings = {
  login: '',
  companyId: '',
  apiKeySecret: '',
};

export default class SbeYougilePlugin extends Plugin {
  settings!: SbeYougileSettings;
  client!: YouGileClient;
  auth!: YouGileAuthService;

  async onload(): Promise<void> {
    await this.loadSettings();
    this.client = new YouGileClient();
    this.auth = new YouGileAuthService(this);

    const apiKey = this.getSecretValue(this.settings.apiKeySecret);
    if (apiKey) {
      this.client.setApiKey(apiKey);
    }

    this.addSettingTab(new YouGileSettingsTab(this.app, this));

    publishService<SbeYougileApi>('sbe-yougile', this.buildApi(), {
      version: this.manifest.version,
      name: this.manifest.name,
    });
  }

  onunload(): void {
    unpublishService('sbe-yougile');
  }

  async loadSettings(): Promise<void> {
    const data = (await this.loadData() as Partial<SbeYougileSettings>) || {};
    this.settings = Object.assign({}, DEFAULT_SETTINGS, data);
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  getSecretValue(secretName: string): string | null {
    if (!secretName) return null;
    try {
      return this.app.secretStorage?.getSecret(secretName) ?? null;
    } catch (e: unknown) {
      console.error('SBE YouGile: не удалось прочитать секрет:', errorMessage(e));
      return null;
    }
  }

  saveSecret(secretName: string, value: string): void {
    try {
      this.app.secretStorage?.setSecret(secretName, value);
    } catch (e: unknown) {
      console.error('SBE YouGile: не удалось сохранить секрет:', errorMessage(e));
    }
  }

  private buildApi(): SbeYougileApi {
    const client = this.client;
    return {
      getStatus: () => this.auth.getStatus(),
      authenticate: () => this.auth.authenticate(),
      client: {
        getProjects: () => client.getProjects(),
        getBoards: () => client.getBoards(),
        getColumns: (boardId?: string) => client.getColumns(boardId),
        getColumnById: (id: string) => client.getColumnById(id),
        getUsers: () => client.getUsers(),
        getTasks: () => client.getTasks(),
        getTaskById: (id: string) => client.getTaskById(id),
        createTask: (payload: unknown) => client.createTask(payload as CreateTaskPayload),
        updateTask: (id: string, patch: unknown) => client.updateTask(id, patch as Record<string, unknown>),
        getGroupChats: () => client.getGroupChats(),
        getChatMessages: (chatId: string) => client.getMessages(chatId),
        sendChatMessage: (chatId: string, text: string) => client.sendMessage(chatId, text),
        getTaskChatSubscribers: (taskId: string) => client.getTaskChatSubscribers(taskId),
        uploadFile: async (file: { name: string; data: ArrayBuffer }) => {
          const result = await client.uploadFile(file.data, file.name);
          return result.fullUrl;
        },
      },
    };
  }
}

export { API_KEY_SECRET_ID };