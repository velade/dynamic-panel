import Meta from "gi://Meta";
import St from "gi://St";
import Gio from "gi://Gio";

import * as Main from "resource:///org/gnome/shell/ui/main.js";

export default class Func {
    constructor() {

    }
    // 是否為暗黑模式
    static isDarkMode() {
        let settings = new Gio.Settings({ schema: "org.gnome.desktop.interface" });
        return settings.get_string("color-scheme") === "prefer-dark";
    }

    // 是否應用懸浮模式
    static isFloating(settings) {
        const activeWorkspace = global.workspace_manager.get_active_workspace();
        const scale = St.ThemeContext.get_for_stage(global.stage).scale_factor;

        const isNearEnough = activeWorkspace.list_windows().some(metaWindow => {
            if (settings.get_int('detection-mode') === 1) { // 窗口檢測模式為「僅限最大化」
                return metaWindow.is_on_primary_monitor()
                    && metaWindow.showing_on_its_workspace()
                    && !metaWindow.is_hidden()
                    && metaWindow.get_window_type() !== Meta.WindowType.DESKTOP
                    && !metaWindow.skip_taskbar
                    && (metaWindow.is_maximized() == 3 || metaWindow.is_maximized() == 2); // 3＝完全最大化，2＝垂直最大化，對Panel來說只需要判定這兩個狀態，而無須判定橫向最大化的變化
            } else { // 窗口檢測模式為「靠近」
                // 獲取主顯示器的位址
                let geometry = global.display.get_monitor_geometry(global.display.get_primary_monitor());

                const verticalPosition = metaWindow.get_frame_rect().y - geometry.y;

                return metaWindow.is_on_primary_monitor()
                    && metaWindow.showing_on_its_workspace()
                    && !metaWindow.is_hidden()
                    && metaWindow.get_window_type() !== Meta.WindowType.DESKTOP
                    && !metaWindow.skip_taskbar
                    && verticalPosition < (settings.get_int("top-margin") + Main.layoutManager.panelBox.get_height() + 5) * scale;
            }
        });

        return !isNearEnough;
    }

    // 獲取現有樣式
    static getStyle(obj) {
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
    static updateStyle(obj, prop, value) {
        // 獲取現有樣式
        const propertiesAndValues = Func.getStyle(obj);
        // 更新新樣式並設定回
        let newStyle = [];
        propertiesAndValues[prop] = value;
        if (value == "") {
            delete propertiesAndValues[prop];
        }
        for (const property in propertiesAndValues) {
            const value = propertiesAndValues[property];
            newStyle.push(`${property}: ${value};`);
        }
        newStyle = newStyle.join(" ");
        obj.set_style(newStyle);
    }
}
