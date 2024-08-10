import Meta from 'gi://Meta';
import St from 'gi://St';
import GLib from 'gi://GLib';

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

        this._actorSignalIds.set(Main.overview, [
            Main.overview.connect('showing', this._updatePanelStyle.bind(this)),
            Main.overview.connect('hiding', this._updatePanelStyle.bind(this)),
            Main.overview.connect('hidden', this._updatePanelStyle.bind(this))
        ]);

        this._actorSignalIds.set(Main.sessionMode, [
            Main.sessionMode.connect('updated', this._updatePanelStyle.bind(this))
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

        if (this._delayedTimeoutId != null) {
            GLib.Source.remove(this._delayedTimeoutId);
        }
        this._delayedTimeoutId = null;

        this._setPanelStyle(false);
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
        this._delayedTimeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 100, () => {
            this._updatePanelStyle();
            this._delayedTimeoutId = null;
            return GLib.SOURCE_REMOVE;
        });
    }

    _updatePanelStyle() {
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
            return verticalPosition < (Main.panel.get_height() + 22) * scale;
        });

        this._setPanelStyle(!isNearEnough);
    }

    _setPanelStyle(float) {
        if (float && !Main.panel.has_style_class_name(this.dynamicPanelClass)) {
            Main.panel.add_style_class_name(this.dynamicPanelClass);
            let _step = 0;
            if (this._ani) clearInterval(this._ani);
            this._ani = setInterval(() => {
                for (let s = 0; s <= 5; s++) {
                    Main.panel.remove_style_class_name(this.dynamicPanelClass + "-margin" + s);
                }
                Main.panel.add_style_class_name(this.dynamicPanelClass + "-margin" + _step);
                _step++;
                if (_step > 5) {
                    clearInterval(this._ani);
                    this._ani = null;
                }
            }, 16);
        } else if (!float && Main.panel.has_style_class_name(this.dynamicPanelClass)) {
            Main.panel.remove_style_class_name(this.dynamicPanelClass);
            let _step = 5;
            if (this._ani) clearInterval(this._ani);
            this._ani = setInterval(() => {
                for (let s = 5; s >= 0; s--) {
                    Main.panel.remove_style_class_name(this.dynamicPanelClass + "-margin" + s);
                }
                Main.panel.add_style_class_name(this.dynamicPanelClass + "-margin" + _step);
                _step--;
                if (_step < 0) {
                    clearInterval(this._ani);
                    this._ani = null;
                }
            }, 16);
        }
        setTimeout(()=>{
            this._fixRaiuds();
        },0)
    }
    
    _fixRaiuds() {
        const scale = St.ThemeContext.get_for_stage(global.stage).scale_factor;
        const panelHeight = Main.panel.get_height() * scale;
        setTimeout(()=>{
            if (!Main.panel.has_style_class_name(this.dynamicPanelClass)) {
                Main.panel.set_style(`border-radius: 0;`);
            } else {
                Main.panel.set_style(`border-radius: ${panelHeight / 2}px;`);
            }
        },1)
    }
}
