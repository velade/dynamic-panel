import Meta from "gi://Meta";
import St from "gi://St";
import GLib from "gi://GLib";
import Gio from "gi://Gio";
import Clutter from "gi://Clutter";

import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";
import * as Main from "resource:///org/gnome/shell/ui/main.js";

export default class DynamicPanelExtension extends Extension {
    constructor(metadata) {
        super(metadata);
        this.floatingPanelClass = "dynamic-panel";
        this.floatingPanelMenuClass = "floating-menu";
        this._actorSignalIds = null;
        this._windowSignalIds = null;
        this._delayedTimeoutId = null;
        this._ani = null;
    }

    enable() {
        // 初始化角色和窗口數組
        this._actorSignalIds = new Map();
        this._windowSignalIds = new Map();

        // 讀取設定並開始監控變化
        this._settings = this.getSettings();
        this._actorSignalIds.set(this._settings, [
            this._settings.connect("changed::transparent", () => { this._updatePanelSingleStyle("transparent") }),
            this._settings.connect("changed::transparent-menus", () => { this._updatePanelSingleStyle("transparent-menus") }),
            this._settings.connect("changed::radius-times", () => { this._updatePanelSingleStyle("radius-times") }),
            this._settings.connect("changed::float-width", () => { this._updatePanelSingleStyle("float-width") }),
            this._settings.connect("changed::float-align", () => { this._updatePanelSingleStyle("float-align") }),
            this._settings.connect("changed::top-margin", () => { this._updatePanelSingleStyle("top-margin") }),
            this._settings.connect("changed::side-margin", () => { this._updatePanelSingleStyle("side-margin") })
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
        let settings = new Gio.Settings({ schema: "org.gnome.desktop.interface" });
        this._actorSignalIds.set(settings, [
            settings.connect("changed::color-scheme", this._updatePanelTheme.bind(this))
        ])

        // 首次應用主題和樣式
        this._updatePanelTheme();
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

        // 清除延遲計時器
        if (this._delayedTimeoutId != null) {
            GLib.Source.remove(this._delayedTimeoutId);
        }

        // 設定為false，恢復到默認樣式，帶動畫用以優雅退場。（此時所有附加內容就應該已經被清除了）
        this._updatePanelStyle(true, false);

        // 二次清理確保附加的內容被清除

        // -- 清除基本變量
        this._actorSignalIds = null;
        this._windowSignalIds = null;
        this._delayedTimeoutId = null;
        this._settings = null;

        // -- 清除面板樣式
        Main.panel.set_style("");
        Main.panel.remove_style_class_name("dark");
        Main.panel.remove_style_class_name(this.floatingPanelClass);
        for (let index = 0; index <= 100; index++) {
            Main.panel.remove_style_class_name(`${this.floatingPanelClass}-${index}`);
        }

        // -- 清除面板選單樣式
        for (const pmenu of Main.uiGroup.get_children()) {
            if (!!pmenu.has_style_class_name &&
                pmenu.has_style_class_name("panel-menu")
            ) {
                for (let index = 0; index <= 100; index++) {
                    pmenu.remove_style_class_name(`${this.floatingPanelMenuClass}-${index}`);
                }
                pmenu.remove_style_class_name("dark");
            }
        }

        // -- 清除動畫計時器
        clearInterval(this._ani);
        this._ani = null;
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
        GLib.timeout_clear(this._delayedTimeoutId);
        this._delayedTimeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 100, () => {
            this._updatePanelStyle();
            this._delayedTimeoutId = null;
            return GLib.SOURCE_REMOVE;
        });
    }

    // 是否為暗黑模式
    _isDarkMode() {
        let settings = new Gio.Settings({ schema: "org.gnome.desktop.interface" });
        return settings.get_string("color-scheme") === "prefer-dark";
    }

    // 是否應用懸浮模式
    _isFloating() {
        const activeWorkspace = global.workspace_manager.get_active_workspace();

        const isNearEnough = activeWorkspace.list_windows().some(metaWindow => {
            const scale = St.ThemeContext.get_for_stage(global.stage).scale_factor;
            const verticalPosition = metaWindow.get_frame_rect().y;
            return metaWindow.is_on_primary_monitor()
                && metaWindow.showing_on_its_workspace()
                && !metaWindow.is_hidden()
                && metaWindow.get_window_type() !== Meta.WindowType.DESKTOP
                && !metaWindow.skip_taskbar
                && verticalPosition < (this._settings.get_int("top-margin") + Main.layoutManager.panelBox.get_height() + 5) * scale;
        });

        return !isNearEnough;
    }

    // 更新panel和panel-menu的主題（是否為暗黑模式）
    _updatePanelTheme() {
        if (this._isDarkMode()) {
            Main.panel.add_style_class_name("dark");
            for (const pmenu of Main.uiGroup.get_children()) {
                if (!!pmenu.has_style_class_name &&
                    pmenu.has_style_class_name("panel-menu")
                ) {
                    pmenu.add_style_class_name("dark")
                }
            }
        } else {
            Main.panel.remove_style_class_name("dark");
            for (const pmenu of Main.uiGroup.get_children()) {
                if (!!pmenu.has_style_class_name &&
                    pmenu.has_style_class_name("panel-menu")
                ) {
                    pmenu.remove_style_class_name("dark")
                }
            }
        }
    }

    // 更新單獨樣式
    _updatePanelSingleStyle(propname) {
        const floating = this._isFloating();
        switch (propname) {
            case "transparent":
                this._setPanelTransparent(floating);
                break;
            case "transparent-menus":
                this._setPanelMenuStyle(floating);
                break;
            case "radius-times":
                this._setPanelRadius(floating);
                break;
            case "float-width":
            case "float-align":
            case "top-margin":
            case "side-margin":
                this._setPanelAllocation(floating);
                break;
        }
    }

    // 更新樣式
    _updatePanelStyle(forceUpdate = false, forceFloating = null) {
        if (typeof forceUpdate != "boolean") forceUpdate = false;
        if (Main.panel.has_style_pseudo_class("overview")) {
            this._setPanelTransparent(false);
            this._setPanelMenuStyle(false);
            this._setPanelAllocation(false);
            this._setPanelRadius(false);
            return;
        }
        if (!Main.layoutManager.primaryMonitor) {
            return;
        }

        const floating = this._isFloating(); // 獲取是否應該懸浮

        if (
            (floating && !Main.panel.has_style_class_name(this.floatingPanelClass)) || // 應該懸浮但未懸浮
            (!floating && Main.panel.has_style_class_name(this.floatingPanelClass))// 不應該懸浮但懸浮
        ) {
            this._setPanelTransparent(floating);
            this._setPanelMenuStyle(floating);
            this._setPanelAllocation(floating);
            this._setPanelRadius(floating);
        } else if (forceUpdate) {
            if (forceFloating === null) forceFloating = this._isFloating();
            this._setPanelTransparent(forceFloating);
            this._setPanelMenuStyle(forceFloating);
            this._setPanelAllocation(forceFloating);
            this._setPanelRadius(forceFloating);
        }
    }

    // 設定面板透明度
    _setPanelTransparent(floating) {
        if (floating) {
            Main.panel.add_style_class_name(this.floatingPanelClass);
            Main.panel.add_style_class_name(`${this.floatingPanelClass}-${this._settings.get_int("transparent")}`);
            for (let i = 0; i <= 100; i++) {
                if (i == this._settings.get_int("transparent")) continue;
                Main.panel.remove_style_class_name(`${this.floatingPanelClass}-${i}`);
            }
        } else {
            for (let i = 0; i <= 100; i++) {
                Main.panel.remove_style_class_name(`${this.floatingPanelClass}-${i}`);
            }
            Main.panel.remove_style_class_name(this.floatingPanelClass);
        }
    }

    // 設定面板選單樣式
    _setPanelMenuStyle(floating) {
        if (this._settings.get_boolean("transparent-menus") && floating) {
            for (const pmenu of Main.uiGroup.get_children()) {
                if (!!pmenu.has_style_class_name &&
                    pmenu.has_style_class_name("panel-menu")
                ) {
                    pmenu.add_style_class_name(`${this.floatingPanelMenuClass}-${this._settings.get_int("transparent")}`);
                    for (let index = 0; index <= 100; index++) {
                        if (index == this._settings.get_int("transparent")) continue;
                        pmenu.remove_style_class_name(`${this.floatingPanelMenuClass}-${index}`);
                    }
                }
            }
        } else {
            for (const pmenu of Main.uiGroup.get_children()) {
                if (!!pmenu.has_style_class_name &&
                    pmenu.has_style_class_name("panel-menu")
                ) {
                    for (let index = 0; index <= 100; index++) {
                        pmenu.remove_style_class_name(`${this.floatingPanelMenuClass}-${index}`);
                    }
                }
            }
        }
    }

    // 設定面板大小和位址
    _setPanelAllocation(floating) {
        const scale = St.ThemeContext.get_for_stage(global.stage).scale_factor;
        const duration = this._settings.get_int("duration");
        const screenWidth = Main.layoutManager.primaryMonitor.width;
        if (floating) {
            const align = this._settings.get_int("float-align");
            const topMargin = this._settings.get_int("top-margin");
            const sideMargin = this._settings.get_int("side-margin");
            const floating_width = screenWidth * (this._settings.get_int("float-width") / 100);
            let x = 0;
            switch (align) {
                case 0:
                    x = sideMargin * scale;
                    break;
                case 1:
                    x = (screenWidth - floating_width) / 2;
                    break;
                case 2:
                    x = (screenWidth - floating_width) - (sideMargin * scale);
                    break
            }
            Main.layoutManager.panelBox.ease({
                translation_y: topMargin * scale,
                translation_x: x,
                width: floating_width,
                duration: duration,
                mode: Clutter.AnimationMode.EASE_OUT_SINE
            })
        } else {
            Main.layoutManager.panelBox.ease({
                translation_y: 0,
                translation_x: 0,
                width: screenWidth,
                duration: duration,
                mode: Clutter.AnimationMode.EASE_OUT_SINE
            })
        }
    }

    // 設定面板圓角
    _setPanelRadius(floating) {
        const startTime = new Date().getTime();
        const duration = this._settings.get_int("duration");
        const scale = St.ThemeContext.get_for_stage(global.stage).scale_factor;
        const panelHeight = Main.panel.get_height() / 2 * (this._settings.get_int("radius-times") / 100) * scale;

        if (this._ani) clearInterval(this._ani);
        let progress = 0;
        this._ani = setInterval(() => {
            let currentTime = new Date().getTime();
            let elapsedTime = currentTime - startTime;
            progress = Math.min(elapsedTime / duration, 1);
            let currentValue;
            if (floating) {
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
