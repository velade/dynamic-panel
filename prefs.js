import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import Gdk from 'gi://Gdk';
import { ExtensionPreferences, gettext as _ } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        let settings = window._settings = this.getSettings();

        const page = new Adw.PreferencesPage();

        const gCommon = new Adw.PreferencesGroup({ title: _("通用設定") });

        // 檢測方式
        let cDetection = new Gtk.ComboBoxText();
        cDetection.append_text(_("靠近"));
        cDetection.append_text(_("僅最大化"));
        cDetection.connect('changed', (sw) => {
            let newVal = sw.get_active();
            if (newVal == settings.get_int('detection-mode')) return;
            settings.set_int('detection-mode', newVal);
        })
        cDetection.set_active(settings.get_int('detection-mode'));
        let rowDetection = new Adw.ActionRow({ title: _('檢測方式') });
        rowDetection.add_suffix(cDetection);
        gCommon.add(rowDetection);

        // 動畫時長
        let spSpeed = new Gtk.SpinButton({
            adjustment: new Gtk.Adjustment({
                lower: 0,
                upper: 9999,
                step_increment: 1
            }),
            climb_rate: 0.5,
            digits: 0
        });
        spSpeed.connect('value-changed', (sw) => {
            let newVal = sw.get_value();
            if (newVal == settings.get_int('duration')) return;
            settings.set_int('duration', newVal);
        });

        spSpeed.set_value(settings.get_int('duration'))

        let rowSpeed = new Adw.ActionRow({ title: _('動畫時長 (ms)') });
        rowSpeed.add_suffix(spSpeed);
        gCommon.add(rowSpeed);

        // 透明度應用在選單
        let sTransMenu = new Gtk.Switch({
            valign: Gtk.Align.CENTER,
        });
        sTransMenu.connect('state-set', (sw, state) => {
            if (state == settings.get_boolean('transparent-menus')) return;
            settings.set_boolean('transparent-menus', state);
            if (state) {
                rowTransMenuKeepAlpha.sensitive = true;
            } else {
                rowTransMenuKeepAlpha.sensitive = false;
            }
        })
        sTransMenu.set_active(settings.get_boolean('transparent-menus'));
        let rowTransMenu = new Adw.ActionRow({ title: _('應用面板樣式到面板選單') });
        rowTransMenu.add_suffix(sTransMenu);
        gCommon.add(rowTransMenu);

        // 實體模式保持透明度
        let sTransMenuKeepAlpha = new Gtk.Switch({
            valign: Gtk.Align.CENTER,
        });
        sTransMenuKeepAlpha.connect('state-set', (sw, state) => {
            if (state == settings.get_boolean('transparent-menus-keep-alpha')) return;
            settings.set_boolean('transparent-menus-keep-alpha', state);
        })
        sTransMenuKeepAlpha.set_active(settings.get_boolean('transparent-menus-keep-alpha'));
        let rowTransMenuKeepAlpha = new Adw.ActionRow({ title: _('    實體模式保持透明度') });
        rowTransMenuKeepAlpha.add_suffix(sTransMenuKeepAlpha);
        gCommon.add(rowTransMenuKeepAlpha);

        // 自訂顏色
        // -- 暗黑模式顏色設定
        let cDBGColor = new Gtk.ColorButton();
        cDBGColor.set_use_alpha(false);
        cDBGColor.connect('color-set', () => {
            let newColor = cDBGColor.get_rgba();
            settings.set_string('dark-bg-color', newColor.to_string());
        });
        let cDFGColor = new Gtk.ColorButton();
        cDFGColor.set_use_alpha(false);
        cDFGColor.connect('color-set', () => {
            let newColor = cDFGColor.get_rgba();
            settings.set_string('dark-fg-color', newColor.to_string());
        });

        // -- 明亮模式顏色設定
        let cLBGColor = new Gtk.ColorButton();
        cLBGColor.set_use_alpha(false);
        cLBGColor.connect('color-set', () => {
            let newColor = cLBGColor.get_rgba();
            settings.set_string('light-bg-color', newColor.to_string());
        });
        let cLFGColor = new Gtk.ColorButton();
        cLFGColor.set_use_alpha(false);
        cLFGColor.connect('color-set', () => {
            let newColor = cLFGColor.get_rgba();
            settings.set_string('light-fg-color', newColor.to_string());
        });

        // -- 顏色初始值
        let rgba = new Gdk.RGBA();

        rgba.parse(settings.get_string('dark-bg-color'));
        cDBGColor.set_rgba(rgba);

        rgba.parse(settings.get_string('dark-fg-color'));
        cDFGColor.set_rgba(rgba);

        rgba.parse(settings.get_string('light-bg-color'));
        cLBGColor.set_rgba(rgba);

        rgba.parse(settings.get_string('light-fg-color'));
        cLFGColor.set_rgba(rgba);

        let rowColors = new Adw.ExpanderRow({ title: _('自訂顏色') });
        let rowDColors = new Adw.ExpanderRow({ title: _('暗黑模式') });
        let rowDBGColor = new Adw.ActionRow({ title: _('背景色') });
        rowDBGColor.add_suffix(cDBGColor);
        let rowDFGColor = new Adw.ActionRow({ title: _('前景色') });
        rowDFGColor.add_suffix(cDFGColor);
        rowDColors.add_row(rowDBGColor);
        rowDColors.add_row(rowDFGColor);
        let rowLColors = new Adw.ExpanderRow({ title: _('明亮模式') });
        let rowLBGColor = new Adw.ActionRow({ title: _('背景色') });
        rowLBGColor.add_suffix(cLBGColor);
        let rowLFGColor = new Adw.ActionRow({ title: _('前景色') });
        rowLFGColor.add_suffix(cLFGColor);
        rowLColors.add_row(rowLBGColor);
        rowLColors.add_row(rowLFGColor);
        rowColors.add_row(rowDColors);
        rowColors.add_row(rowLColors);
        gCommon.add(rowColors)

        const gFloating = new Adw.PreferencesGroup({ title: _("懸浮模式") });

        // 背景模式
        let cBackgroundMode = new Gtk.ComboBoxText();
        cBackgroundMode.append_text(_("整體"));
        cBackgroundMode.append_text(_("區域"));
        cBackgroundMode.connect('changed', (sw) => {
            let newVal = sw.get_active();
            if (newVal == settings.get_int('background-mode')) return;
            settings.set_int('background-mode', newVal);
        })
        cBackgroundMode.set_active(settings.get_int('background-mode'));
        let rowBackgroundMode = new Adw.ActionRow({ title: _('背景模式') });
        rowBackgroundMode.add_suffix(cBackgroundMode);
        gFloating.add(rowBackgroundMode);

        // 對齊方式
        let cAlign = new Gtk.ComboBoxText()
        cAlign.append_text(_("左側"))
        cAlign.append_text(_("居中"))
        cAlign.append_text(_("右側"))
        cAlign.connect('changed', (sw) => {
            let newVal = sw.get_active()
            if (newVal == settings.get_int('float-align')) return
            settings.set_int('float-align', newVal)
            if (newVal == 1) {
                rowSMargin.sensitive = false;
            } else {
                rowSMargin.sensitive = true;
            }
        })
        cAlign.set_active(settings.get_int('float-align'))
        let rowAlign = new Adw.ActionRow({ title: _('對齊方式') });
        rowAlign.add_suffix(cAlign);
        gFloating.add(rowAlign);

        // 自動長度
        let sAutoWidth = new Gtk.Switch({
            valign: Gtk.Align.CENTER,
        });
        sAutoWidth.connect('state-set', (sw, state) => {
            if (state == settings.get_boolean('auto-width')) return;
            settings.set_boolean('auto-width', state);
            if (state) {
                rowWidth.sensitive = false;
            } else {
                rowWidth.sensitive = true;
            }
        })
        sAutoWidth.set_active(settings.get_boolean('auto-width'));
        let rowAutoWidth = new Adw.ActionRow({ title: _('自動長度') });
        rowAutoWidth.add_suffix(sAutoWidth);
        gFloating.add(rowAutoWidth);

        // 寬度控制條
        let sWidth = new Gtk.Scale({
            orientation: Gtk.Orientation.HORIZONTAL,
            hexpand: true,
            digits: 0,
            adjustment: new Gtk.Adjustment({ lower: 1, upper: 100, step_increment: 1 }),
            draw_value: true,
            value_pos: Gtk.PositionType.RIGHT,
            round_digits: 0
        })
        sWidth.connect('value-changed', (sw) => {
            let newVal = sw.get_value()
            if (newVal == settings.get_int('float-width')) return
            settings.set_int('float-width', newVal)
        })
        sWidth.set_value(settings.get_int('float-width'))
        let rowWidth = new Adw.ActionRow({ title: _('面板長度 (%)') });
        rowWidth.add_suffix(sWidth);
        gFloating.add(rowWidth);

        // 圓角控制條
        let sRadius = new Gtk.Scale({
            orientation: Gtk.Orientation.HORIZONTAL,
            hexpand: true,
            digits: 0,
            adjustment: new Gtk.Adjustment({ lower: 1, upper: 100, step_increment: 1 }),
            draw_value: true,
            value_pos: Gtk.PositionType.RIGHT,
            round_digits: 0
        })
        sRadius.connect('value-changed', (sw) => {
            let newVal = sw.get_value()
            if (newVal == settings.get_int('radius-times')) return
            settings.set_int('radius-times', newVal)
        })
        sRadius.set_value(settings.get_int('radius-times'))
        let rowRadius = new Adw.ActionRow({ title: _('面板圓角 (%)') });
        rowRadius.add_suffix(sRadius);
        gFloating.add(rowRadius);

        // 不透明度控制條
        let sTransparent = new Gtk.Scale({
            orientation: Gtk.Orientation.HORIZONTAL,
            hexpand: true,
            digits: 0,
            adjustment: new Gtk.Adjustment({ lower: 0, upper: 100, step_increment: 1 }),
            draw_value: true,
            value_pos: Gtk.PositionType.RIGHT,
            round_digits: 0
        })
        sTransparent.connect('value-changed', (sw) => {
            let newVal = sw.get_value()
            if (newVal == settings.get_int('transparent')) return
            settings.set_int('transparent', newVal)
        })
        sTransparent.set_value(settings.get_int('transparent'))
        let rowTransparent = new Adw.ActionRow({ title: _('不透明度 (%)') });
        rowTransparent.add_suffix(sTransparent);
        gFloating.add(rowTransparent);

        // 頂部邊距
        let spTMargin = new Gtk.SpinButton({
            adjustment: new Gtk.Adjustment({
                lower: 0,
                upper: 100,
                step_increment: 1
            }),
            climb_rate: 0.5,
            digits: 0
        });
        spTMargin.connect('value-changed', (sw) => {
            let newVal = sw.get_value();
            if (newVal == settings.get_int('top-margin')) return
            settings.set_int('top-margin', newVal)
        });
        spTMargin.set_value(settings.get_int('top-margin'))
        let rowTMargin = new Adw.ActionRow({ title: _('頂部邊距 (px)') });
        rowTMargin.add_suffix(spTMargin);
        gFloating.add(rowTMargin);

        // 側面邊距
        let spSMargin = new Gtk.SpinButton({
            adjustment: new Gtk.Adjustment({
                lower: 0,
                upper: 100,
                step_increment: 1
            }),
            climb_rate: 0.5,
            digits: 0
        });
        spSMargin.connect('value-changed', (sw) => {
            let newVal = sw.get_value();
            if (newVal == settings.get_int('side-margin')) return
            settings.set_int('side-margin', newVal)
        });
        spSMargin.set_value(settings.get_int('side-margin'))
        let rowSMargin = new Adw.ActionRow({ title: _('側面邊距 (px)') });
        rowSMargin.add_suffix(spSMargin);
        gFloating.add(rowSMargin);

        const gSolid = new Adw.PreferencesGroup({ title: _("實體模式") });

        // 實體類型
        let cSolidType = new Gtk.ComboBoxText();
        cSolidType.append_text(_("停靠"));
        cSolidType.append_text(_("隱藏"));
        cSolidType.connect('changed', (sw) => {
            let newVal = sw.get_active();
            if (newVal == settings.get_int('solid-type')) return;
            settings.set_int('solid-type', newVal);
        })
        cSolidType.set_active(settings.get_int('solid-type'));
        let rowSolidType = new Adw.ActionRow({ title: _('實體類型') });
        rowSolidType.add_suffix(cSolidType);
        gSolid.add(rowSolidType);

        // 顏色在靜態模式生效設定
        let sUseInStatic = new Gtk.Switch({
            valign: Gtk.Align.CENTER,
        });
        sUseInStatic.connect('state-set', (sw, state) => {
            if (state == settings.get_boolean('colors-use-in-static')) return;
            settings.set_boolean('colors-use-in-static', state);
        })
        sUseInStatic.set_active(settings.get_boolean('colors-use-in-static'))
        let rowColorsUseInStatic = new Adw.ActionRow({ title: _('應用自訂顏色') });
        rowColorsUseInStatic.add_suffix(sUseInStatic);
        gSolid.add(rowColorsUseInStatic);

        // 設定關聯選項
        if (settings.get_boolean('transparent-menus')) {
            rowTransMenuKeepAlpha.sensitive = true;
        } else {
            rowTransMenuKeepAlpha.sensitive = false;
        }
        if (settings.get_int('float-align') == 1) {
            rowSMargin.sensitive = false;
        } else {
            rowSMargin.sensitive = true;
        }
        if (settings.get_boolean('auto-width')) {
            rowWidth.sensitive = false;
        } else {
            rowWidth.sensitive = true;
        }

        // 向頁面添加組
        page.add(gCommon)
        page.add(gFloating)
        page.add(gSolid)

        // 向窗口添加頁面
        window.add(page)
    }
}