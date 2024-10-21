import Gio from 'gi://Gio';
import GLib from "gi://GLib";
import St from "gi://St";
import Clutter from "gi://Clutter";

import Colors from './colors.js'
import Func from './func.js'

import * as PointerWatcher from 'resource:///org/gnome/shell/ui/pointerWatcher.js';
import * as Main from "resource:///org/gnome/shell/ui/main.js";

export default class Panel {
    constructor (settings, accessibility) {
        this.floatingPanelClass = "dynamic-panel";
        this.fgcolor = null;
        this.bgcolor = null;
        this._settings = settings;
        this._accessibility = accessibility;
        this._panelHiddenConnect = null;
        this._squeezeCount = 0;
        this._setBgDelay = null;
        this._updateBgDelay = null;
        this._radiusAnimation = null;

    }
    // 更新顏色設定
    updateColorSettings() {
        [this.bgcolor, this.fgcolor] = Colors.getCustomColor(this._settings);

        if (this._settings.get_boolean("auto-background")) {
            const wallpaperSettings = new Gio.Settings({ schema_id: 'org.gnome.desktop.background' });
            const wallpaperUri = wallpaperSettings.get_string('picture-uri');
            const imagePath = wallpaperUri.replace(/^file:\/\//, "");
            const modifier = Func.isDarkMode() ? "dark" : "light";
            const autoBGC = Colors.getThemeColor(imagePath, modifier);
            this.bgcolor = [autoBGC, autoBGC];
        }

        if (this._settings.get_boolean("blur")) {
            let file = Gio.File.new_for_path('/tmp/vel-dynamic-panel-blurred-bg.jpg');
            const colorSet = Func.isDarkMode() ? "dark" : "light";
            if (file.query_exists(null)) {
                const mixed = Colors.colorMix({ r: this.bgcolor[colorSet].r, g: this.bgcolor[colorSet].g, b: this.bgcolor[colorSet].b, a: this._settings.get_int("transparent") / 100 });
                mixed.savev('/tmp/vel-dynamic-panel-mixed-bg.jpg', 'jpeg', [], []);
            }
        }
    }

    // 更新模糊背景
    updateBlurredBG() {
        if (this._settings.get_boolean("blur")) {
            const wallpaperSettings = new Gio.Settings({ schema_id: 'org.gnome.desktop.background' });
            const wallpaperUri = wallpaperSettings.get_string('picture-uri');
            const imagePath = wallpaperUri.replace(/^file:\/\//, "");
            const colorSet = Func.isDarkMode() ? "dark" : "light";
            const blurred = Colors.gaussianBlur(this._settings, imagePath, 30);
            blurred.savev('/tmp/vel-dynamic-panel-blurred-bg.jpg', 'jpeg', [], []);
            const mixed = Colors.colorMix({ r: this.bgcolor[colorSet].r, g: this.bgcolor[colorSet].g, b: this.bgcolor[colorSet].b, a: this._settings.get_int("transparent") / 100 });
            mixed.savev('/tmp/vel-dynamic-panel-mixed-bg.jpg', 'jpeg', [], []);
        }
    }

    // 設定面板背景
    setBackground(floating) {
        GLib.Source.remove(this._setBgDelay);
        this._setBgDelay = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 10, () => {
            const _transparent = this._settings.get_int("transparent") / 100;
            const colorSet = Func.isDarkMode() ? "dark" : "light";
            Func.updateStyle(Main.panel, "transition", `${this._settings.get_int("duration")}ms`);
            let bg_areas = [Main.panel];
            if (this._settings.get_int('background-mode') === 1) {
                Func.updateStyle(Main.panel, "background-color", `rgba(0, 0, 0, 0)`);
                Func.updateStyle(Main.panel, "background-image", "");
                Func.updateStyle(Main.panel, "background-size", "");
                Func.updateStyle(Main.panel, "background-position", "");
                bg_areas = [Main.panel._leftBox, Main.panel._centerBox, Main.panel._rightBox];
                const scale = St.ThemeContext.get_for_stage(global.stage).scale_factor;
                const panelHeight = Main.panel.get_height() / 2 * (this._settings.get_int("radius-times") / 100) * scale;
                for (const bg_area of bg_areas) {
                    Func.updateStyle(bg_area, "border-radius", `${panelHeight}px`);
                }
            }

            if (Main.panel.has_style_pseudo_class("overview")) {
                Main.panel.remove_style_class_name(this.floatingPanelClass);
                for (const bg_area of bg_areas) {
                    Func.updateStyle(bg_area, "background-color", `rgba(0, 0, 0, 0)`);
                    Func.updateStyle(bg_area, "background-image", "");
                }
            } else if (floating) {
                Main.panel.add_style_class_name(this.floatingPanelClass);
                if (this._settings.get_boolean("blur")) {
                    const scale = St.ThemeContext.get_for_stage(global.stage).scale_factor;
                    const panelHeight = Main.panel.get_height();
                    const maxHeight = (this._settings.get_int("top-margin") + panelHeight + 5) * scale;
                    if (this._settings.get_int('background-mode') === 1) {
                        for (const bg_area of bg_areas) {
                            Func.updateStyle(bg_area, "background-image", "url(/tmp/vel-dynamic-panel-mixed-bg.jpg)");
                            Func.updateStyle(bg_area, "background-size", `${Main.layoutManager.primaryMonitor.width}px ${maxHeight + 20}px`);
                            Func.updateStyle(bg_area, "background-position", `-${Main.layoutManager.panelBox.translation_x + bg_area.x}px -${Main.layoutManager.panelBox.translation_y + bg_area.y + 20}px`);
                        }
                    } else {
                        for (const bg_area of bg_areas) {
                            Func.updateStyle(bg_area, "background-image", "url(/tmp/vel-dynamic-panel-mixed-bg.jpg)");
                            Func.updateStyle(bg_area, "background-size", `${Main.layoutManager.primaryMonitor.width}px ${maxHeight + 20}px`);
                            Func.updateStyle(bg_area, "background-position", `-${Main.layoutManager.panelBox.translation_x}px -${Main.layoutManager.panelBox.translation_y + 20}px`);
                        }
                    }
                } else {
                    Func.updateStyle(Main.panel, "background-image", "");
                    Func.updateStyle(Main.panel, "background-size", "");
                    Func.updateStyle(Main.panel, "background-position", "");
                    for (const bg_area of [Main.panel._leftBox, Main.panel._centerBox, Main.panel._rightBox]) {
                        Func.updateStyle(bg_area, "background-image", "");
                        Func.updateStyle(bg_area, "background-size", "");
                        Func.updateStyle(bg_area, "background-position", "");
                    }
                    for (const bg_area of bg_areas) {
                        Func.updateStyle(bg_area, "background-color", `rgba(${this.bgcolor[colorSet].r}, ${this.bgcolor[colorSet].g}, ${this.bgcolor[colorSet].b}, ${_transparent})`);
                    }
                }
            } else if (this._settings.get_int("solid-type") == 1) {
                Main.panel.remove_style_class_name(this.floatingPanelClass);
                Func.updateStyle(Main.panel, "background-image", "");
                for (const bg_area of bg_areas) {
                    Func.updateStyle(bg_area, "background-color", `rgba(${this.bgcolor[colorSet].r}, ${this.bgcolor[colorSet].g}, ${this.bgcolor[colorSet].b}, ${_transparent})`);
                }
            } else if (this._settings.get_boolean("colors-use-in-static")) {
                Main.panel.remove_style_class_name(this.floatingPanelClass);
                Func.updateStyle(Main.panel, "background-image", "");
                for (const bg_area of bg_areas) {
                    bg_area.set_style("");
                }
                Func.updateStyle(Main.panel, "background-color", `rgba(${this.bgcolor[colorSet].r}, ${this.bgcolor[colorSet].g}, ${this.bgcolor[colorSet].b}, 1)`);
            } else {
                for (const bg_area of bg_areas) {
                    bg_area.set_style("");
                }
                Main.panel.remove_style_class_name(this.floatingPanelClass);
                Main.panel.set_style("");
            }
        })
    }

    // 設定面板前景
    setForeground(floating) {
        const colorSet = Func.isDarkMode() ? "dark" : "light";
        const _panelButtons = Object.values(Main.panel.statusArea);
        if (floating || this._settings.get_boolean("colors-use-in-static")) {
            for (const element of _panelButtons) {
                Func.updateStyle(element, "color", `rgb(${this.fgcolor[colorSet].r}, ${this.fgcolor[colorSet].g}, ${this.fgcolor[colorSet].b})`);
            }
            for (const dot of Main.panel.statusArea.activities.first_child.get_children()) {
                Func.updateStyle(dot._dot, "background-color", `rgb(${this.fgcolor[colorSet].r}, ${this.fgcolor[colorSet].g}, ${this.fgcolor[colorSet].b})`);
            }
        } else {
            for (const element of _panelButtons) {
                element.set_style("");
            }
            for (const dot of Main.panel.statusArea.activities.first_child.get_children()) {
                dot._dot.set_style("");
            }
        }
    }

    // 清除自動隱藏相關影響
    clearPeekEffect() {
        PointerWatcher.getPointerWatcher()._removeWatch(this._panelHiddenConnect);
        this._panelHiddenConnect = null;
        Main.panel.remove_style_class_name("peeking");
        Main.panel._leftBox.visible = true;
        Main.panel._centerBox.visible = true;
        Main.panel._rightBox.visible = true;
    }

    // 設定面板大小和位址
    setAllocation(floating) {
        const scale = St.ThemeContext.get_for_stage(global.stage).scale_factor;
        const duration = this._settings.get_int("duration");
        const screenWidth = Main.layoutManager.primaryMonitor.width;
        if (floating) {
            this.clearPeekEffect();

            const align = this._settings.get_int("float-align");
            const topMargin = this._settings.get_int("top-margin");
            const sideMargin = this._settings.get_int("side-margin");
            const minWidth = Main.panel._leftBox.get_preferred_width(0)[1] + Main.panel._centerBox.get_preferred_width(0)[1] + Main.panel._rightBox.get_preferred_width(0)[1] + 20;
            const floating_width = (this._settings.get_boolean('auto-width')) ? minWidth : Math.max(screenWidth * (this._settings.get_int("float-width") / 100), minWidth);
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
            if (this._settings.get_boolean("blur")) {
                GLib.Source.remove(this._updateBgDelay);
                const startTime = new Date().getTime();
                const duration = this._settings.get_int("duration");
                this._updateBgDelay = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 16, () => {
                    const currentTime = new Date().getTime();
                    this.setBackground(floating);
                    if (currentTime - startTime <= duration) {
                        return true;
                    }
                })
            }
        } else if (this._settings.get_int('solid-type') === 0) {
            this.clearPeekEffect();

            Main.layoutManager.panelBox.ease({
                translation_y: 0,
                translation_x: 0,
                width: screenWidth,
                duration: duration,
                mode: Clutter.AnimationMode.EASE_OUT_SINE
            })
            if (this._settings.get_boolean("blur")) {
                GLib.Source.remove(this._updateBgDelay);
                const startTime = new Date().getTime();
                const duration = this._settings.get_int("duration");
                this._updateBgDelay = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 16, () => {
                    const currentTime = new Date().getTime();
                    this.setBackground(floating);
                    if (currentTime - startTime <= duration) {
                        return true;
                    }
                })
            }
        } else {
            if (!this._panelHiddenConnect) {
                Main.layoutManager.panelBox.ease({
                    translation_y: -Main.panel.get_height(),
                    translation_x: screenWidth * 0.01 / 2,
                    width: screenWidth * 0.99,
                    duration: duration,
                    mode: Clutter.AnimationMode.EASE_OUT_SINE
                })
                this._panelHiddenConnect = PointerWatcher.getPointerWatcher().addWatch(100, (x, y) => {
                    if (y > Main.panel.get_height() + 1 && Main.panel.has_style_class_name("peeking")) {
                        Main.panel.remove_style_class_name("peeking");
                        Main.layoutManager.panelBox.ease({
                            translation_y: -Main.panel.get_height(),
                            duration: duration,
                            mode: Clutter.AnimationMode.EASE_IN_SINE
                        })
                        this._squeezeCount = 0;
                    } else if (y == 0 && this._squeezeCount <= 2) {
                        this._squeezeCount++;
                    } else if (this._squeezeCount > 2 && !Main.panel.has_style_class_name("peeking")) {
                        if (this._settings.get_int("background-mode") == 1) {
                            if (x < screenWidth * 0.33) {
                                Main.panel._leftBox.visible = true;
                                Main.panel._centerBox.visible = false;
                                Main.panel._rightBox.visible = false;
                            } else if (x < screenWidth * 0.66) {
                                Main.panel._leftBox.visible = false;
                                Main.panel._centerBox.visible = true;
                                Main.panel._rightBox.visible = false;
                            } else {
                                Main.panel._leftBox.visible = false;
                                Main.panel._centerBox.visible = false;
                                Main.panel._rightBox.visible = true;
                            }
                        } else {
                            Main.panel._leftBox.visible = true;
                            Main.panel._centerBox.visible = true;
                            Main.panel._rightBox.visible = true;
                        }
                        Main.panel.add_style_class_name("peeking");
                        Main.layoutManager.panelBox.ease({
                            translation_y: 1,
                            duration: duration,
                            mode: Clutter.AnimationMode.EASE_OUT_SINE
                        })
                        this.setBackground();
                        this.setRadius();
                    }
                })
            }
        }
    }

    // 設定面板圓角
    setRadius(floating) {
        const startTime = new Date().getTime();
        const duration = this._settings.get_int("duration");
        const scale = St.ThemeContext.get_for_stage(global.stage).scale_factor;
        const panelHeight = Main.panel.get_height() / 2 * (this._settings.get_int("radius-times") / 100) * scale;

        GLib.Source.remove(this._radiusAnimation);
        let progress = 0;
        this._radiusAnimation = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 16, () => {
            let currentTime = new Date().getTime();
            let elapsedTime = currentTime - startTime;
            progress = Math.min(elapsedTime / duration, 1);
            let currentValue;
            if (floating || this._settings.get_int("solid-type") == 1) {
                currentValue = progress;
            } else {
                currentValue = 1 - progress;
            }

            Func.updateStyle(Main.panel, `border-radius`, `${panelHeight * currentValue}px`);

            if (progress < 1) {
                return true;
            }
        })
    }

    // 清除面板樣式
    clear() {
        // 背景&基本前景
        Main.panel.remove_style_class_name(this.floatingPanelClass);
        Main.panel.set_style("");
        Main.panel._leftBox.set_style("");
        Main.panel._centerBox.set_style("");
        Main.panel._rightBox.set_style("");
        // 前景
        for (const element of Object.values(Main.panel.statusArea)) {
            if (element) {
                element.set_style("");
            }
        }
        for (const dot of Main.panel.statusArea.activities.first_child.get_children()) {
            dot._dot.set_style("");
        }

        // 清除自動隱藏功能產生的影響
        this.clearPeekEffect();

        // 清除面板動畫
        GLib.Source.remove(this._radiusAnimation);
        GLib.Source.remove(this._setBgDelay);
        GLib.Source.remove(this._updateBgDelay);
        this._radiusAnimation = null;
        this._setBgDelay = null;
        this._updateBgDelay = null;
    }
}