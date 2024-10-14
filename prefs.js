import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import Gdk from 'gi://Gdk';
import Gio from 'gi://Gio';
import { ExtensionPreferences, gettext as _ } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        let settings = window._settings = this.getSettings();

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
        let rowTransMenuKeepAlpha = new Adw.ActionRow({ title: "    " + _('實體模式保持透明度') });
        rowTransMenuKeepAlpha.add_suffix(sTransMenuKeepAlpha);
        gCommon.add(rowTransMenuKeepAlpha);

        // 自訂顏色
        // 自動獲取顏色開關
        let sAutoBG = new Gtk.Switch({
            valign: Gtk.Align.CENTER,
        });
        sAutoBG.connect('state-set', (sw, state) => {
            if (state == settings.get_boolean('auto-background')) return;
            settings.set_boolean('auto-background', state);
            if (state) {
                rowDBGColor.visible = false;
                rowLBGColor.visible = false;
            } else {
                rowDBGColor.visible = true;
                rowLBGColor.visible = true;
            }
        })
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

        sAutoBG.set_active(settings.get_boolean("auto-background"));

        let rowColors = new Adw.ExpanderRow({ title: _('自訂顏色') });
        let rowAutoBG = new Adw.ActionRow({ title: _("多彩"), subtitle: _("自動從桌布取得顏色") });
        rowAutoBG.add_suffix(sAutoBG);
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
        rowColors.add_row(rowAutoBG);
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

        // 模糊開關
        let sBlur = new Gtk.Switch({
            valign: Gtk.Align.CENTER,
        });
        sBlur.connect('state-set', (sw, state) => {
            if (state == settings.get_boolean('blur')) return;
            settings.set_boolean('blur', state);
        })
        sBlur.set_active(settings.get_boolean('blur'));
        let rowBlur = new Adw.ActionRow({ title: _('模糊效果') });
        rowBlur.add_suffix(sBlur);
        gFloating.add(rowBlur);

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

        const gAccessibility = new Adw.PreferencesGroup({ title: _("無障礙設定") });
        // 盲點補丁
        let rowTriggers = new Adw.ExpanderRow({ title: _('盲點補丁'), subtitle: _("為懸浮模式添加額外點擊區域，以恢復絕對邊角的點擊能力") });
        rowTriggers.expanded = true;
        // -- Left
        let sAddonTriggerL = new Gtk.Switch({
            valign: Gtk.Align.CENTER,
        });
        sAddonTriggerL.connect('state-set', (sw, state) => {
            if (state == settings.get_boolean('addon-trigger-left')) return;
            settings.set_boolean('addon-trigger-left', state);
        })
        sAddonTriggerL.set_active(settings.get_boolean('addon-trigger-left'))
        let rowAddonTriggerL = new Adw.ActionRow({ title: _('總覽（左）') });
        rowAddonTriggerL.add_suffix(sAddonTriggerL);
        rowTriggers.add_row(rowAddonTriggerL);

        // -- Center
        let sAddonTriggerC = new Gtk.Switch({
            valign: Gtk.Align.CENTER,
        });
        sAddonTriggerC.connect('state-set', (sw, state) => {
            if (state == settings.get_boolean('addon-trigger-center')) return;
            settings.set_boolean('addon-trigger-center', state);
        })
        sAddonTriggerC.set_active(settings.get_boolean('addon-trigger-center'))
        let rowAddonTriggerC = new Adw.ActionRow({ title: _('通知中心（中）') });
        rowAddonTriggerC.add_suffix(sAddonTriggerC);
        rowTriggers.add_row(rowAddonTriggerC);

        // -- Right
        let sAddonTriggerR = new Gtk.Switch({
            valign: Gtk.Align.CENTER,
        });
        sAddonTriggerR.connect('state-set', (sw, state) => {
            if (state == settings.get_boolean('addon-trigger-right')) return;
            settings.set_boolean('addon-trigger-right', state);
        })
        sAddonTriggerR.set_active(settings.get_boolean('addon-trigger-right'))
        let rowAddonTriggerR = new Adw.ActionRow({ title: _('快速設定（右）') });
        rowAddonTriggerR.add_suffix(sAddonTriggerR);
        rowTriggers.add_row(rowAddonTriggerR);

        gAccessibility.add(rowTriggers);

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

        if (settings.get_boolean('auto-background')) {
            rowDBGColor.visible = false;
            rowLBGColor.visible = false;
        } else {
            rowDBGColor.visible = true;
            rowLBGColor.visible = true;
        }

        // 追加自定義圖標
        const iconTheme = Gtk.IconTheme.get_for_display(Gdk.Display.get_default());
        if (!iconTheme.get_search_path().includes(this.path + "/icons")) {
            iconTheme.add_search_path(this.path + "/icons");
        }

        // 向頁面添加組
        const pageCommon = new Adw.PreferencesPage({ name: "common", title: _("通用設定"), iconName: `dp-panel-generic-symbolic` });
        pageCommon.add(gCommon);
        const pageFloating = new Adw.PreferencesPage({ name: "common", title: _("懸浮模式"), iconName: `dp-panel-floating-symbolic` });
        pageFloating.add(gFloating);
        const pageSolid = new Adw.PreferencesPage({ name: "common", title: _("實體模式"), iconName: `dp-panel-solid-symbolic` });
        pageSolid.add(gSolid);
        const pageAccessibility = new Adw.PreferencesPage({ name: "common", title: _("無障礙設定"), iconName: `dp-panel-accessibility-symbolic` });
        pageAccessibility.add(gAccessibility);

        // 向窗口添加頁面
        window.set_search_enabled(true);
        window.set_default_size(640, 640);
        window.add(pageCommon);
        window.add(pageFloating);
        window.add(pageSolid);
        window.add(pageAccessibility);
    }
}