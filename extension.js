import GLib from "gi://GLib";
import Gio from "gi://Gio";

import Accessibility from "./lib/accessibility.js";
import Func from "./lib/func.js";
import Panel from "./lib/panel.js";
import PanelMenu from "./lib/panel-menu.js";

import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";
import * as Main from "resource:///org/gnome/shell/ui/main.js";

export default class DynamicPanelExtension extends Extension {
    constructor(metadata) {
        super(metadata);
        this._actorSignalIds = null;
        this._windowSignalIds = null;
        this._delayedTimeoutId = null;

        this._accessibility = null;
        this._panel = null;
        this._panelMenu = null;
    }

    enable() {
        this._settings = this.getSettings();
        // 初始化角色和窗口數組
        this._actorSignalIds = new Map();
        this._windowSignalIds = new Map();

        this._accessibility = new Accessibility(this._settings);
        this._panel = new Panel(this._settings, this._accessibility);
        this._panelMenu = new PanelMenu(this._settings, this._panel);
        
        // 讀取設定並開始監控變化
        this._actorSignalIds.set(this._settings, [
            this._settings.connect("changed::transparent", () => { this._updatePanelSingleStyle("bg-changed") }),
            this._settings.connect("changed::transparent-menus", () => { this._updatePanelSingleStyle("transparent-menus") }),
            this._settings.connect("changed::transparent-menus-keep-alpha", () => { this._updatePanelSingleStyle("transparent-menus") }),
            this._settings.connect("changed::radius-times", () => { this._updatePanelSingleStyle("radius-times") }),
            this._settings.connect("changed::float-width", () => { this._updatePanelSingleStyle("allocation-changed") }),
            this._settings.connect("changed::float-align", () => { this._updatePanelSingleStyle("allocation-changed") }),
            this._settings.connect("changed::top-margin", () => { this._updatePanelSingleStyle("allocation-changed") }),
            this._settings.connect("changed::side-margin", () => { this._updatePanelSingleStyle("allocation-changed") }),
            this._settings.connect("changed::auto-width", () => { this._updatePanelSingleStyle("allocation-changed") }),
            this._settings.connect("changed::solid-type", () => { this._updatePanelSingleStyle("allocation-changed") }),
            this._settings.connect("changed::dark-bg-color", () => { this._updatePanelSingleStyle("color-changed") }),
            this._settings.connect("changed::dark-fg-color", () => { this._updatePanelSingleStyle("color-changed") }),
            this._settings.connect("changed::light-bg-color", () => { this._updatePanelSingleStyle("color-changed") }),
            this._settings.connect("changed::light-fg-color", () => { this._updatePanelSingleStyle("color-changed") }),
            this._settings.connect("changed::auto-background", () => { this._updatePanelSingleStyle("color-changed") }),
            this._settings.connect("changed::colors-use-in-static", () => { this._updatePanelSingleStyle("bg-changed") }),
            this._settings.connect("changed::background-mode", () => { this._updatePanelSingleStyle("bg-changed") }),
            this._settings.connect("changed::blur", () => { this._updatePanelSingleStyle("wallpaper-changed") }),
            this._settings.connect("changed::addon-trigger-left", () => { this._updatePanelSingleStyle("trigger-changed") }),
            this._settings.connect("changed::addon-trigger-center", () => { this._updatePanelSingleStyle("trigger-changed") }),
            this._settings.connect("changed::addon-trigger-right", () => { this._updatePanelSingleStyle("trigger-changed") })
        ])

        // 監控總覽界面顯示狀態
        this._actorSignalIds.set(Main.overview, [
            Main.overview.connect("showing", this._updatePanelStyle.bind(this)),
            Main.overview.connect("hidden", this._updatePanelStyle.bind(this))
        ]);

        // 將當前已有窗口加入監控
        for (const metaWindowActor of global.get_window_actors()) {
            this._onWindowActorAdded(metaWindowActor.get_parent(), metaWindowActor);
        }

        // 監控窗口增加和移除
        this._actorSignalIds.set(global.window_group, [
            global.window_group.connect("child-added", this._onWindowActorAdded.bind(this)),
            global.window_group.connect("child-removed", this._onWindowActorRemoved.bind(this))
        ]);

        // 監控工作區切換
        this._actorSignalIds.set(global.window_manager, [
            global.window_manager.connect("switch-workspace", this._updatePanelStyleDelayed.bind(this))
        ]);

        // 監控系統暗黑模式變化
        const settings = new Gio.Settings({ schema: "org.gnome.desktop.interface" });
        this._actorSignalIds.set(settings, [
            settings.connect("changed::color-scheme", () => { this._updatePanelSingleStyle("color-changed") })
        ])
        const bgsettings = new Gio.Settings({ schema_id: 'org.gnome.desktop.background' });
        this._actorSignalIds.set(bgsettings, [
            bgsettings.connect('changed::picture-uri', () => { this._updatePanelSingleStyle("wallpaper-changed") })
        ])

        // 更新顏色設定
        this._panel.updateColorSettings();

        // 更新模糊背景
        this._panel.updateBlurredBG();

        // 首次應用主題和樣式
        this._updatePanelStyle();
    }

    disable() {
        // 根據角色和窗口數組移除監控
        for (const actorSignalIds of [this._actorSignalIds, this._windowSignalIds]) {
            for (const [actor, signalIds] of actorSignalIds) {
                for (const signalId of signalIds) {
                    actor.disconnect(signalId);
                }
            }
        }

        // 設定為false，恢復到默認樣式，帶動畫用以優雅退場。（此時所有附加內容就應該已經被清除了）
        this._updatePanelStyle(true, false);

        // -- 清除面板樣式
        this._panel.clear();
        this._panel = null;

        // -- 清除面板選單樣式
        this._panelMenu.clear();
        this._panelMenu = null;

        // -- 清除無障礙功能
        this._accessibility.clear();
        this._accessibility = null;

        // 二次清理確保附加的內容被清除

        // -- 清除動畫計時器
        GLib.Source.remove(this._delayedTimeoutId);

        // -- 清除基本變量
        this._actorSignalIds = null;
        this._windowSignalIds = null;
        this._delayedTimeoutId = null;
        this._settings = null;
    }

    // 窗口添加事件
    _onWindowActorAdded(container, metaWindowActor) {
        this._windowSignalIds.set(metaWindowActor, [
            metaWindowActor.connect("notify::allocation", this._updatePanelStyle.bind(this)),
            metaWindowActor.connect("notify::visible", this._updatePanelStyle.bind(this))
        ]);
    }

    // 窗口被移除事件
    _onWindowActorRemoved(container, metaWindowActor) {
        for (const signalId of this._windowSignalIds.get(metaWindowActor)) {
            metaWindowActor.disconnect(signalId);
        }
        this._windowSignalIds.delete(metaWindowActor);
        this._updatePanelStyle();
    }

    // 切換worksapce時延遲判定
    _updatePanelStyleDelayed() {
        GLib.Source.remove(this._delayedTimeoutId);
        this._delayedTimeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 100, () => {
            this._updatePanelStyle();
            this._delayedTimeoutId = null;
            return GLib.SOURCE_REMOVE;
        });
    }

    // 更新單獨樣式
    _updatePanelSingleStyle(propname) {
        const floating = Func.isFloating(this._settings);
        const bg_areas = [Main.panel._leftBox, Main.panel._centerBox, Main.panel._rightBox];
        switch (propname) {
            case "color-changed":
            case "wallpaper-changed":
            case "bg-changed":
                for (const bg_area of bg_areas) {
                    bg_area.set_style("");
                }
                this._panel.updateColorSettings();
                this._panel.setBackground(floating);
                this._panel.setForeground(floating);
                this._panelMenu.setStyle(floating);

                if (propname === "wallpaper-changed") {
                    this._panel.updateBlurredBG();
                }
                break;
            case "transparent-menus":
                this._panelMenu.setStyle(floating);
                break;
            case "radius-times":
                this._panel.setRadius(floating);
                break;
            case "allocation-changed":
                this._panel.setAllocation(floating);
                this._accessibility.AddonTrigger.setAddonTriggers(floating);
                break;
            case "trigger-changed":
                this._accessibility.AddonTrigger.setAddonTriggers(floating);
                break;
        }
    }

    // 更新樣式
    _updatePanelStyle(forceUpdate = false, forceFloating = null) {
        if (typeof forceUpdate != "boolean") forceUpdate = false;
        if (Main.panel.has_style_pseudo_class("overview")) {
            this._panel.setBackground(false);
            this._panel.setForeground(false);
            this._panelMenu.setStyle(false);
            this._panel.setAllocation(false);
            this._panel.setRadius(false);
            this._accessibility.AddonTrigger.setAddonTriggers(false);
            return;
        }
        if (!Main.layoutManager.primaryMonitor) {
            return;
        }

        const floating = Func.isFloating(this._settings); // 獲取是否應該懸浮

        if (
            (floating && !Main.panel.has_style_class_name(this._panel.floatingPanelClass)) || // 應該懸浮但未懸浮
            (!floating && Main.panel.has_style_class_name(this._panel.floatingPanelClass))// 不應該懸浮但懸浮
        ) {
            this._panel.clearPeekEffect();
            this._panel.setBackground(floating);
            this._panel.setForeground(floating);
            this._panelMenu.setStyle(floating);
            this._panel.setAllocation(floating);
            this._panel.setRadius(floating);
            this._accessibility.AddonTrigger.setAddonTriggers(floating);
        } else if (forceUpdate) {
            if (forceFloating === null) forceFloating = floating;
            this._panel.clearPeekEffect();
            this._panel.setBackground(forceFloating);
            this._panel.setForeground(forceFloating);
            this._panelMenu.setStyle(forceFloating);
            this._panel.setAllocation(forceFloating);
            this._panel.setRadius(forceFloating);
            this._accessibility.AddonTrigger.setAddonTriggers(forceFloating);
        }
    }
}