import St from "gi://St";

import * as Main from "resource:///org/gnome/shell/ui/main.js";

class AddonTrigger {
    constructor(settings) {
        this._addonTriggers = {};
        this._settings = settings;
    }
    clear() {
        for (const trigger of Object.values(this._addonTriggers)) {
            trigger.destroy();
        }
        this._addonTriggers = {};
    }
    // 設定附加觸發區域
    setAddonTriggers(floating) {
        // 清理現有觸發區域
        this.clear();
        if (floating) {
            // Activities
            let h = this._settings.get_int("top-margin");
            if (this._settings.get_boolean("addon-trigger-left")) {
                let activities = Main.panel.statusArea.activities;
                let w = Main.panel._leftBox.get_preferred_width(0)[1] + 20;
                let overlay = this._addonTriggers["Activities"] = new St.Bin({
                    style_class: "vel-dp-addon-trigger-left",
                    opacity: 1,
                    reactive: true,
                    x: 0,
                    y: 0,
                    width: w,
                    height: h
                });

                Main.uiGroup.add_child(overlay);

                overlay.connect('button-press-event', () => {
                    activities.menu.open()
                });
            }
            // Date Menu
            if (this._settings.get_boolean("addon-trigger-center")) {
                let dateMenu = Main.panel.statusArea.dateMenu;
                let w = Main.panel._centerBox.get_preferred_width(0)[1] + 20;
                let x = (Main.layoutManager.primaryMonitor.width - w) / 2;
                let overlay = this._addonTriggers["dateMenu"] = new St.Bin({
                    style_class: "vel-dp-addon-trigger-center",
                    opacity: 1,
                    reactive: true,
                    x: x,
                    y: 0,
                    width: w,
                    height: h
                });

                Main.uiGroup.add_child(overlay);

                overlay.connect('button-press-event', () => {
                    dateMenu.menu.open()
                });
            }
            // Quick Settings
            if (this._settings.get_boolean("addon-trigger-right")) {
                let quickSettings = Main.panel.statusArea.quickSettings;
                let w = Main.panel._rightBox.get_preferred_width(0)[1] + 20;
                let overlay = this._addonTriggers["quickSettings"] = new St.Bin({
                    style_class: "vel",
                    opacity: 1,
                    reactive: true,
                    x: Main.layoutManager.primaryMonitor.width - w,
                    y: 0,
                    width: w,
                    height: h
                });

                Main.uiGroup.add_child(overlay);

                overlay.connect('button-press-event', () => {
                    quickSettings.menu.open()
                });
            }
        }
    }
}

export default class Accessibility {
    constructor(settings) {
        this.mods = {};

        // AddonTrigger
        this.AddonTrigger = this.mods["AddonTrigger"]  = new AddonTrigger(settings);
    }
    clear() {
        Object.values(this.mods).forEach(mod => mod.clear());
    }
}