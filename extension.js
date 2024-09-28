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
        this.bgcolor = [];
        this.fgcolor = [];
        this.ani = null;
        this.ani2 = null;
        this._panelButtons = [];
    }

    enable() {
        // 初始化角色和窗口數組
        this._actorSignalIds = new Map();
        this._windowSignalIds = new Map();

        this._animations = new Map();

        this._panelButtons = [];

        // 讀取設定並開始監控變化
        this._settings = this.getSettings();
        this._actorSignalIds.set(this._settings, [
            this._settings.connect("changed::transparent", () => { this._updatePanelSingleStyle("bg-changed") }),
            this._settings.connect("changed::transparent-menus", () => { this._updatePanelSingleStyle("transparent-menus") }),
            this._settings.connect("changed::radius-times", () => { this._updatePanelSingleStyle("radius-times") }),
            this._settings.connect("changed::float-width", () => { this._updatePanelSingleStyle("allocation-changed") }),
            this._settings.connect("changed::float-align", () => { this._updatePanelSingleStyle("allocation-changed") }),
            this._settings.connect("changed::top-margin", () => { this._updatePanelSingleStyle("allocation-changed") }),
            this._settings.connect("changed::side-margin", () => { this._updatePanelSingleStyle("allocation-changed") }),
            this._settings.connect("changed::dark-bg-color", () => { this._updatePanelSingleStyle("color-changed") }),
            this._settings.connect("changed::dark-fg-color", () => { this._updatePanelSingleStyle("color-changed") }),
            this._settings.connect("changed::light-bg-color", () => { this._updatePanelSingleStyle("color-changed") }),
            this._settings.connect("changed::light-fg-color", () => { this._updatePanelSingleStyle("color-changed") }),
            this._settings.connect("changed::colors-use-in-static", () => { this._updatePanelSingleStyle("bg-changed") })
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
            settings.connect("changed::color-scheme", () => { this._updatePanelSingleStyle("bg-changed") })
        ])

        // 監控Panel內容變化
        this._actorSignalIds.set(Main.panel, [
            Main.panel._leftBox.connect("child-added", this._updatePanelButtons.bind(this)),
            Main.panel._leftBox.connect("child-removed", this._updatePanelButtons.bind(this)),
            Main.panel._centerBox.connect("child-added", this._updatePanelButtons.bind(this)),
            Main.panel._centerBox.connect("child-removed", this._updatePanelButtons.bind(this)),
            Main.panel._rightBox.connect("child-added", this._updatePanelButtons.bind(this)),
            Main.panel._rightBox.connect("child-removed", this._updatePanelButtons.bind(this))
        ]);

        // 更新顏色設定
        this._updateColorSettings();

        // 更新panelButtons
        this._updatePanelButtons();

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

        // 二次清理確保附加的內容被清除

        // -- 清除動畫計時器
        GLib.Source.remove(this._delayedTimeoutId);
        GLib.Source.remove(this._ani);
        GLib.Source.remove(this._ani2);

        // -- 清除基本變量
        this._actorSignalIds = null;
        this._windowSignalIds = null;
        this._delayedTimeoutId = null;
        this._settings = null;
        this.bgcolor = null;
        this.fgcolor = null;
        this.ani = null;
        this.ani2 = null;

        // -- 清除面板樣式
        Main.panel.remove_style_class_name(this.floatingPanelClass);
        Main.panel.set_style("");

        // -- 清除面板前景色
        for (const element of this._panelButtons) {
            if (element) {
                element.set_style("");
            }
        }
        for (const dot of Main.panel._leftBox.get_children()[0].get_children()[0].get_children()[0].get_children()) {
            dot._dot.set_style("");
        }
        this._panelButtons = null;

        // -- 清除面板選單樣式
        for (const pmenu of Main.uiGroup.get_children()) {
            if (!!pmenu.has_style_class_name &&
                pmenu.has_style_class_name("panel-menu")
            ) {
                pmenu.remove_style_class_name(this.floatingPanelMenuClass);
                pmenu._delegate.box.set_style("");
            }
        }

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

    // 更新顏色設定
    _updateColorSettings() {
        let D_BGC = this._settings.get_string('dark-bg-color');
        let D_FGC = this._settings.get_string('dark-fg-color');
        let L_BGC = this._settings.get_string('light-bg-color');
        let L_FGC = this._settings.get_string('light-fg-color');
        D_BGC = D_BGC.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
        D_FGC = D_FGC.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
        L_BGC = L_BGC.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
        L_FGC = L_FGC.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
        this.bgcolor = [[D_BGC[1], D_BGC[2], D_BGC[3]], [L_BGC[1], L_BGC[2], L_BGC[3]]];
        this.fgcolor = [[D_FGC[1], D_FGC[2], D_FGC[3]], [L_FGC[1], L_FGC[2], L_FGC[3]]];
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

    // 獲取現有樣式
    _getStyle(obj) {
        const style = obj.get_style();
        const propertiesAndValues = new Object();
        if (style) {
            const regex = /\s*([^:;]+)\s*:\s*([^;]+)\s*;?/g;
            const matches = style.matchAll(regex);
            for (const match of matches) {
                const property = match[1].trim();
                const value = match[2].trim();
                propertiesAndValues[property] = value;
            }
            return propertiesAndValues;
        }
        return {};
    }
    // 更新單個樣式
    _updateStyle(obj, prop, value) {
        // 獲取現有樣式
        const propertiesAndValues = this._getStyle(obj);
        // 更新新樣式並設定回
        let newStyle = [];
        propertiesAndValues[prop] = value;
        for (const property in propertiesAndValues) {
            const value = propertiesAndValues[property];
            newStyle.push(`${property}: ${value};`);
        }
        newStyle = newStyle.join(" ");
        obj.set_style(newStyle);
    }

    // 更新面板按鈕列表
    _updatePanelButtons() {
        for (const box of [Main.panel._leftBox, Main.panel._centerBox, Main.panel._rightBox]) {
            for (const child0 of box.get_children()) {
                if (!child0.get_children) continue;
                for (const child1 of child0.get_children()) {
                    if (child1.has_style_class_name && child1.has_style_class_name("panel-button")) {
                        this._panelButtons.push(child1);
                    }
                }
            }
        }
    }

    // 更新單獨樣式
    _updatePanelSingleStyle(propname) {
        const floating = this._isFloating();
        switch (propname) {
            case "color-changed":
                this._updateColorSettings();
                this._setPanelBackground(floating);
                this._setPanelForeground(floating);
                break;
            case "bg-changed":
                this._setPanelBackground(floating);
                this._setPanelForeground(floating);
                this._setPanelMenuStyle(floating);
                break;
            case "transparent-menus":
                this._setPanelMenuStyle(floating);
                break;
            case "radius-times":
                this._setPanelRadius(floating);
                break;
            case "allocation-changed":
                this._setPanelAllocation(floating);
                break;
        }
    }

    // 更新樣式
    _updatePanelStyle(forceUpdate = false, forceFloating = null) {
        if (typeof forceUpdate != "boolean") forceUpdate = false;
        if (Main.panel.has_style_pseudo_class("overview")) {
            this._setPanelBackground(false);
            this._setPanelForeground(false);
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
            this._setPanelBackground(floating);
            this._setPanelForeground(floating);
            this._setPanelMenuStyle(floating);
            this._setPanelAllocation(floating);
            this._setPanelRadius(floating);
        } else if (forceUpdate) {
            if (forceFloating === null) forceFloating = floating;
            this._setPanelBackground(forceFloating);
            this._setPanelForeground(forceFloating);
            this._setPanelMenuStyle(forceFloating);
            this._setPanelAllocation(forceFloating);
            this._setPanelRadius(forceFloating);
        }
    }

    // 設定面板背景
    _setPanelBackground(floating) {
        this.ani2 = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 10, () => {
            const _transparent = this._settings.get_int("transparent") / 100;

            if (Main.panel.has_style_pseudo_class("overview")) {
                Main.panel.remove_style_class_name(this.floatingPanelClass);
                this._updateStyle(Main.panel, "background-color", `rgba(0, 0, 0, 0)`);
            } else if (floating) {
                Main.panel.add_style_class_name(this.floatingPanelClass);
                if (this._isDarkMode()) {
                    this._updateStyle(Main.panel, "background-color", `rgba(${this.bgcolor[0][0]}, ${this.bgcolor[0][1]}, ${this.bgcolor[0][2]}, ${_transparent})`);
                } else {
                    this._updateStyle(Main.panel, "background-color", `rgba(${this.bgcolor[1][0]}, ${this.bgcolor[1][1]}, ${this.bgcolor[1][2]}, ${_transparent})`);
                }
            } else if (this._settings.get_boolean("colors-use-in-static")) {
                Main.panel.remove_style_class_name(this.floatingPanelClass);
                if (this._isDarkMode()) {
                    this._updateStyle(Main.panel, "background-color", `rgba(${this.bgcolor[0][0]}, ${this.bgcolor[0][1]}, ${this.bgcolor[0][2]}, 1)`);
                } else {
                    this._updateStyle(Main.panel, "background-color", `rgba(${this.bgcolor[1][0]}, ${this.bgcolor[1][1]}, ${this.bgcolor[1][2]}, 1)`);
                }
            } else {
                Main.panel.remove_style_class_name(this.floatingPanelClass);
                Main.panel.set_style("");
            }
        })
    }

    // 設定面板前景
    _setPanelForeground(floating) {
        const colorSet = this._isDarkMode() ? 0 : 1;

        if (floating || this._settings.get_boolean("colors-use-in-static")) {
            for (const element of this._panelButtons) {
                this._updateStyle(element, "color", `rgb(${this.fgcolor[colorSet][0]}, ${this.fgcolor[colorSet][1]}, ${this.fgcolor[colorSet][2]})`);
            }
            for (const dot of Main.panel._leftBox.get_children()[0].get_children()[0].get_children()[0].get_children()) {
                this._updateStyle(dot._dot, "background-color", `rgb(${this.fgcolor[colorSet][0]}, ${this.fgcolor[colorSet][1]}, ${this.fgcolor[colorSet][2]})`);
            }
        } else {
            for (const element of this._panelButtons) {
                element.set_style("");
            }
            for (const dot of Main.panel._leftBox.get_children()[0].get_children()[0].get_children()[0].get_children()) {
                dot._dot.set_style("");
            }
        }
    }

    // 設定面板選單樣式
    _setPanelMenuStyle(floating) {
        const _transparent = this._settings.get_int("transparent") / 100;
        if (this._settings.get_boolean("transparent-menus") && floating) {
            for (const pmenu of Main.uiGroup.get_children()) {
                if (!!pmenu.has_style_class_name &&
                    pmenu.has_style_class_name("panel-menu")
                ) {

                    pmenu.add_style_class_name(this.floatingPanelMenuClass);
                    if (this._isDarkMode()) {
                        this._updateStyle(pmenu._delegate.box, "background-color", `rgba(${this.bgcolor[0][0]}, ${this.bgcolor[0][1]}, ${this.bgcolor[0][2]}, ${_transparent})`);
                    } else {
                        this._updateStyle(pmenu._delegate.box, "background-color", `rgba(${this.bgcolor[1][0]}, ${this.bgcolor[1][1]}, ${this.bgcolor[1][2]}, ${_transparent})`);
                    }
                }
            }
        } else if (this._settings.get_boolean("colors-use-in-static")) {
            for (const pmenu of Main.uiGroup.get_children()) {
                if (!!pmenu.has_style_class_name &&
                    pmenu.has_style_class_name("panel-menu")
                ) {
                    if (this._isDarkMode()) {
                        this._updateStyle(pmenu._delegate.box, "background-color", `rgba(${this.bgcolor[0][0]}, ${this.bgcolor[0][1]}, ${this.bgcolor[0][2]}, 1)`);
                        this._updateStyle(pmenu._delegate.box, "color", `rgb(${this.fgcolor[0][0]}, ${this.fgcolor[0][1]}, ${this.fgcolor[0][2]})`);
                    } else {
                        this._updateStyle(pmenu._delegate.box, "background-color", `rgba(${this.bgcolor[1][0]}, ${this.bgcolor[1][1]}, ${this.bgcolor[1][2]}, 1)`);
                        this._updateStyle(pmenu._delegate.box, "color", `rgb(${this.fgcolor[1][0]}, ${this.fgcolor[1][1]}, ${this.fgcolor[1][2]})`);
                    }
                }
            }
        } else {
            for (const pmenu of Main.uiGroup.get_children()) {
                if (!!pmenu.has_style_class_name &&
                    pmenu.has_style_class_name("panel-menu")
                ) {
                    pmenu._delegate.box.set_style("");
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

        GLib.Source.remove(this._ani);
        let progress = 0;
        this._ani = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 16, () => {
            let currentTime = new Date().getTime();
            let elapsedTime = currentTime - startTime;
            progress = Math.min(elapsedTime / duration, 1);
            let currentValue;
            if (floating) {
                currentValue = progress;
            } else {
                currentValue = 1 - progress;
            }

            this._updateStyle(Main.panel, `border-radius`, `${panelHeight * currentValue}px`);

            if (progress < 1) {
                return true;
            }
        })
    }
}
