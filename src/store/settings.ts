export interface WorkflowConfig { url: string; apiKey?: string; isDefault?: boolean }
export interface AppSettings { workflowUrl?: string; workflows?: WorkflowConfig[] }

const SETTINGS_KEY = 'app-settings';

export function getAppSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return {};
    const obj = JSON.parse(raw);
    const base = (typeof obj === 'object' && obj) ? obj as AppSettings : {};
    // 兼容旧版：只有 workflowUrl 时迁移为 workflows
    if (!base.workflows && base.workflowUrl) {
      return { workflows: [{ url: base.workflowUrl, isDefault: true }] } as AppSettings;
    }
    return base;
  } catch {
    return {};
  }
}

export function setAppSettings(patch: AppSettings): AppSettings {
  const current = getAppSettings();
  const next = { ...current, ...patch } as AppSettings;
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(next)); } catch {}
  return next;
}

export function getWorkflowConfigs(): WorkflowConfig[] {
  const s = getAppSettings();
  return s.workflows || [];
}



