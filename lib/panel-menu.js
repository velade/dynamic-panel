import Func from './func.js'

import * as Main from "resource:///org/gnome/shell/ui/main.js";

export default class PanelMenu {
    constructor(settings, panelClass) {
        this._settings = settings;
        this.floatingPanelMenuClass = "floating-menu";
        this._panel = panelClass;
    }
    // 設定面板選單樣式
    setStyle(floating) {
        const _transparent = this._settings.get_int("transparent") / 100;
        const colorSet = Func.isDarkMode() ? "dark" : "light";
        let panelMenus = [];
        for (const panelButton of Object.values(Main.panel.statusArea)) {
            if (panelButton.menu && panelButton.menu.actor && panelButton.menu.box) panelMenus.push(panelButton.menu);
        }
        if (this._settings.get_boolean("transparent-menus")) { // 總開關：是否對面板選單應用樣式
            // Background
            if (floating || (this._settings.get_boolean("transparent-menus-keep-alpha") && this._settings.get_boolean("colors-use-in-static")) || this._settings.get_int("solid-type") == 1) { // 浮動 或 保持透明度的同時將顏色應用到實體模式 或 實體模式為自動隱藏
                for (const pmenu of panelMenus) {
                    pmenu.actor.add_style_class_name(this.floatingPanelMenuClass);
                    Func.updateStyle(pmenu.box, "background-color", `rgba(${this._panel.bgcolor[colorSet].r}, ${this._panel.bgcolor[colorSet].g}, ${this._panel.bgcolor[colorSet].b}, ${_transparent})`);
                }
            } else if (this._settings.get_boolean("transparent-menus-keep-alpha")) { // 實體模式 未應用自訂顏色 但保持透明度
                for (const pmenu of panelMenus) {
                    pmenu.actor.add_style_class_name(this.floatingPanelMenuClass);
                    if (Func.isDarkMode()) {
                        Func.updateStyle(pmenu.box, "background-color", `rgba(53, 53, 53, ${_transparent})`);
                    } else {
                        Func.updateStyle(pmenu.box, "background-color", `rgba(245, 245, 245, ${_transparent})`);
                    }
                }
            } else if (this._settings.get_boolean("colors-use-in-static")) { // 實體模式 不保持透明度 但應用自訂顏色
                for (const pmenu of panelMenus) {
                    pmenu.actor.add_style_class_name(this.floatingPanelMenuClass);
                    Func.updateStyle(pmenu.box, "background-color", `rgba(${this._panel.bgcolor[colorSet].r}, ${this._panel.bgcolor[colorSet].g}, ${this._panel.bgcolor[colorSet].b}, 1)`);
                }
            } else { // 實體模式 不保持透明度 不應用自訂顏色
                for (const pmenu of panelMenus) {
                    pmenu.actor.add_style_class_name(this.floatingPanelMenuClass);
                    pmenu.box.set_style("");
                }
            }
            // Foreground 
            if (floating || this._settings.get_boolean("colors-use-in-static") || this._settings.get_int("solid-type") == 1) {
                // 普通選單
                for (const pmenu of panelMenus) {
                    Func.updateStyle(pmenu.box, "color", `rgb(${this._panel.fgcolor[colorSet].r}, ${this._panel.fgcolor[colorSet].g}, ${this._panel.fgcolor[colorSet].b})`);
                }
                // 日曆
                const dateMenu = Main.panel.statusArea.dateMenu;
                let fgcolor_rgb = "";
                fgcolor_rgb = `${this._panel.fgcolor[colorSet].r}, ${this._panel.fgcolor[colorSet].g}, ${this._panel.fgcolor[colorSet].b}`;
                Func.updateStyle(dateMenu._date, "color", `rgba(${fgcolor_rgb}, 0.6)`);
                for (const item of dateMenu._calendar.get_children()) {
                    if (item?.has_style_class_name("calendar-day-heading")) {
                        Func.updateStyle(item, "color", `rgba(${fgcolor_rgb}, 0.6)`);
                    }
                }
                Func.updateStyle(dateMenu._calendar._backButton, "color", `rgb(${fgcolor_rgb})`);
                Func.updateStyle(dateMenu._calendar._monthLabel, "color", `rgb(${fgcolor_rgb})`);
                Func.updateStyle(dateMenu._calendar._forwardButton, "color", `rgb(${fgcolor_rgb})`);
            } else {
                // 普通選單
                for (const pmenu of panelMenus) {
                    pmenu.box.set_style("");
                }
                // 日曆
                const dateMenu = Main.panel.statusArea.dateMenu;
                dateMenu._date.set_style("");
                for (const item of [...dateMenu._calendar.get_children(), ...dateMenu._calendar._topBox.get_children()]) {
                    item.set_style("");
                }
            }
        } else { // 未應用樣式 清除樣式
            // 普通選單
            for (const pmenu of panelMenus) {
                pmenu.actor.remove_style_class_name(this.floatingPanelMenuClass);
                pmenu.box.set_style("");
            }
            // 日曆
            const dateMenu = Main.panel.statusArea.dateMenu;
            dateMenu._date.set_style("");
            for (const item of [...dateMenu._calendar.get_children(), ...dateMenu._calendar._topBox.get_children()]) {
                item.set_style("");
            }
        }
    }
    // -- 清除面板選單樣式
    clear() {
        let panelMenus = [];
        for (const panelButton of Object.values(Main.panel.statusArea)) {
            if (panelButton.menu && panelButton.menu.actor && panelButton.menu.box) panelMenus.push(panelButton.menu);
        }
        for (const pmenu of panelMenus) {
            pmenu.actor.remove_style_class_name(this.floatingPanelMenuClass);
            pmenu.box.set_style("");
        }
        // -- -- 日曆
        const dateMenu = Main.panel.statusArea.dateMenu;
        dateMenu._date.set_style("");
        for (const item of [...dateMenu._calendar.get_children(), ...dateMenu._calendar._topBox.get_children()]) {
            item.set_style("");
        }
    }
}