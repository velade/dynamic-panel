import Meta from 'gi://Meta';
import St from 'gi://St';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import Clutter from 'gi://Clutter';

import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

export default class DynamicPanelExtension extends Extension {
    constructor(metadata) {
        super(metadata);
        this.dynamicPanelClass = 'dynamic-panel';
        this._actorSignalIds = null;
        this._windowSignalIds = null;
        this._delayedTimeoutId = null;
        this._ani = null;
    }

    enable() {
        this._actorSignalIds = new Map();
        this._windowSignalIds = new Map();

        this._settings = this.getSettings();
        this._settings.connect('changed::radius-times', this._updatePanelStyleForce.bind(this))
        this._settings.connect('changed::float-width', this._updatePanelStyleForce.bind(this))
        this._settings.connect('changed::float-align', this._updatePanelStyleForce.bind(this))
        this._settings.connect('changed::base-margin', this._updatePanelStyleForce.bind(this))

        this._actorSignalIds.set(Main.overview, [
            Main.overview.connect('showing', this._updatePanelStyle.bind(this)),
            Main.overview.connect('hidden', this._updatePanelStyle.bind(this))
        ]);

        for (const metaWindowActor of global.get_window_actors()) {
            this._onWindowActorAdded(metaWindowActor.get_parent(), metaWindowActor);
        }

        this._actorSignalIds.set(global.window_group, [
            global.window_group.connect('child-added', this._onWindowActorAdded.bind(this)),
            global.window_group.connect('child-removed', this._onWindowActorRemoved.bind(this))
        ]);

        this._actorSignalIds.set(global.window_manager, [
            global.window_manager.connect('switch-workspace', this._updatePanelStyleDelayed.bind(this))
        ]);

        let settings = new Gio.Settings({ schema: 'org.gnome.desktop.interface' });
        this._actorSignalIds.set(settings, [
            settings.connect('changed::color-scheme', this._updatePanelTheme.bind(this))
        ])

        this._updatePanelTheme();
        this._updatePanelStyle();
    }

    disable() {
        for (const actorSignalIds of [this._actorSignalIds, this._windowSignalIds]) {
            for (const [actor, signalIds] of actorSignalIds) {
                for (const signalId of signalIds) {
                    actor.disconnect(signalId);
                }
            }
        }
        this._actorSignalIds = null;
        this._windowSignalIds = null;
        this._settings = null;

        if (this._delayedTimeoutId != null) {
            GLib.Source.remove(this._delayedTimeoutId);
        }
        this._delayedTimeoutId = null;

        // 設定為false，恢復到默認樣式，帶動畫用以優雅退場。
        this._setPanelStyle(false, true);

        // 二次清理確保附加的內容被清除
        Main.panel.set_style(``);
        Main.panel.remove_style_class_name("dark");
        Main.panel.remove_style_class_name(this.dynamicPanelClass);
        clearInterval(this._ani);
        this._ani = null;
    }

    _onWindowActorAdded(container, metaWindowActor) {
        this._windowSignalIds.set(metaWindowActor, [
            metaWindowActor.connect('notify::allocation', this._updatePanelStyle.bind(this)),
            metaWindowActor.connect('notify::visible', this._updatePanelStyle.bind(this))
        ]);
    }

    _onWindowActorRemoved(container, metaWindowActor) {
        for (const signalId of this._windowSignalIds.get(metaWindowActor)) {
            metaWindowActor.disconnect(signalId);
        }
        this._windowSignalIds.delete(metaWindowActor);
        this._updatePanelStyle();
    }

    _updatePanelStyleDelayed() {
        GLib.timeout_clear(this._delayedTimeoutId);
        this._delayedTimeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 100, () => {
            this._updatePanelStyle();
            this._delayedTimeoutId = null;
            return GLib.SOURCE_REMOVE;
        });
    }
    _isDarkMode() {
        let settings = new Gio.Settings({ schema: 'org.gnome.desktop.interface' });
        return settings.get_string('color-scheme') === 'prefer-dark';
    }
    _updatePanelTheme() {
        if (this._isDarkMode()) {
            Main.panel.add_style_class_name("dark");
        } else {
            Main.panel.remove_style_class_name("dark");
        }
    }

    _updatePanelStyleForce() {
        this._updatePanelStyle(true);
    }

    _updatePanelStyle(force = false) {
        if(typeof force != "boolean") force = false;
        if (Main.panel.has_style_pseudo_class("overview")) {
            this._setPanelStyle(false);
            return;
        }
        if (!Main.layoutManager.primaryMonitor) {
            return;
        }

        const workspaceManager = global.workspace_manager;
        const activeWorkspace = workspaceManager.get_active_workspace();
        const windows = activeWorkspace.list_windows().filter(metaWindow => {
            return metaWindow.is_on_primary_monitor()
                && metaWindow.showing_on_its_workspace()
                && !metaWindow.is_hidden()
                && metaWindow.get_window_type() !== Meta.WindowType.DESKTOP
                && !metaWindow.skip_taskbar;
        });

        const scale = St.ThemeContext.get_for_stage(global.stage).scale_factor;
        const isNearEnough = windows.some(metaWindow => {
            const verticalPosition = metaWindow.get_frame_rect().y;
            return verticalPosition < Main.layoutManager.panelBox.get_height() + 10 * scale;
        });

        this._setPanelStyle(!isNearEnough, force);
    }

    _setPanelStyle(float, forceUpdate = false) {
        if (float && (!Main.panel.has_style_class_name(this.dynamicPanelClass) || forceUpdate)) {
            this._floatAni(true, forceUpdate);
            Main.panel.add_style_class_name(this.dynamicPanelClass);
        } else if (!float && (Main.panel.has_style_class_name(this.dynamicPanelClass) || forceUpdate)) {
            this._floatAni(false, forceUpdate);
            Main.panel.remove_style_class_name(this.dynamicPanelClass);
        }
    }

    _floatAni(float, forceUpdate = false) {
        const startTime = new Date().getTime();
        let progress = 0;
        const duration = 250;
        const scale = St.ThemeContext.get_for_stage(global.stage).scale_factor;
        const panelHeight = Main.panel.get_height() / 2 * (this._settings.get_int("radius-times") / 100) * scale;
        if (float) {
            let align = this._settings.get_int("float-align");
            let baseMargin = this._settings.get_int("base-margin");
            let x = 0;
            switch (align) {
                case 0:
                    x = baseMargin;
                    break;
                case 1:
                    x = Main.uiGroup.width * (1 - (this._settings.get_int("float-width") / 100)) / 2;
                    break;
                case 2:
                    x = Main.uiGroup.width * (1 - (this._settings.get_int("float-width") / 100)) - baseMargin;
                    break
            }
            Main.layoutManager.panelBox.ease({
                translation_y: baseMargin * scale,
                translation_x: x * scale,
                width: Main.uiGroup.width * (this._settings.get_int("float-width") / 100),
                duration: duration,
                mode: Clutter.AnimationMode.EASE_OUT_QUAD
            })
        } else {
            Main.layoutManager.panelBox.ease({
                translation_y: 0,
                translation_x: 0,
                width: Main.uiGroup.width,
                duration: duration,
                mode: Clutter.AnimationMode.EASE_IN_QUAD
            })
        }
        if (this._ani) clearInterval(this._ani);
        this._ani = setInterval(() => {
            let currentTime = new Date().getTime();
            let elapsedTime = currentTime - startTime;
            progress = Math.min(elapsedTime / duration, 1);
            let currentValue;
            if (float) {
                currentValue = progress;
            } else {
                currentValue = 1 - progress;
            }

            Main.panel.set_style(`border-radius: ${panelHeight * currentValue}px;`);

            if (progress >= 1) {
                clearInterval(this._ani);
                this._ani = null;
            }
        }, 16.7)
    }
}
