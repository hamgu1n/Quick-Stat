import { Popover, Switch } from "radix-ui";
import { Settings } from "lucide-react";
import { useSettingsStore } from "@/store/settingsStore";

/**
 * Gear button in the site nav that opens a small settings panel.
 * Radix Popover handles open/close, click-outside, Escape, and focus;
 * Radix Switch is an accessible on/off toggle (role="switch").
 */
export function SettingsMenu() {
  const showAdvanced = useSettingsStore((s) => s.showAdvanced);
  const setShowAdvanced = useSettingsStore((s) => s.setShowAdvanced);
  const hideQuizScores = useSettingsStore((s) => s.hideQuizScores);
  const setHideQuizScores = useSettingsStore((s) => s.setHideQuizScores);

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button type="button" className="settings-trigger" aria-label="Settings">
          <Settings size={18} aria-hidden="true" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content className="settings-panel" align="end" sideOffset={8}>
          <h2 className="settings-panel__title">Settings</h2>
          <div className="settings-row">
            <label htmlFor="show-advanced" className="settings-row__label">
              <span>Show advanced topics</span>
              <span className="settings-row__hint">
                Material that goes beyond the intro course, like testing a
                correlation or regression leverage.
              </span>
            </label>
            <Switch.Root
              id="show-advanced"
              className="settings-switch"
              checked={showAdvanced}
              onCheckedChange={setShowAdvanced}
            >
              <Switch.Thumb className="settings-switch__thumb" />
            </Switch.Root>
          </div>
          <div className="settings-row">
            <label htmlFor="hide-quiz-scores" className="settings-row__label">
              <span>Hide quiz scores</span>
              <span className="settings-row__hint">
                Don't show saved Section Review scores. They're still saved,
                so you can turn this back off any time.
              </span>
            </label>
            <Switch.Root
              id="hide-quiz-scores"
              className="settings-switch"
              checked={hideQuizScores}
              onCheckedChange={setHideQuizScores}
            >
              <Switch.Thumb className="settings-switch__thumb" />
            </Switch.Root>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
