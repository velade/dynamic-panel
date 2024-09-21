import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import { ExtensionPreferences, gettext as _ } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        let settings = window._settings = this.getSettings();

        const page = new Adw.PreferencesPage();

        const gAppearance = new Adw.PreferencesGroup({ title: _("外觀設定") });

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

        // 透明度應用在選單
        let sTransMenu = new Gtk.Switch({
            valign: Gtk.Align.CENTER,
        });
        sTransMenu.connect('state-set', (sw, state) => {
            if (state == settings.get_boolean('transparent-menus')) return
            settings.set_boolean('transparent-menus', state)
        })

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
            }else {
                rowSMargin.sensitive = true;
            }
        })

        sTransparent.set_value(settings.get_int('transparent'))
        sRadius.set_value(settings.get_int('radius-times'))
        sWidth.set_value(settings.get_int('float-width'))
        cAlign.set_active(settings.get_int('float-align'))
        spTMargin.set_value(settings.get_int('top-margin'))
        spSMargin.set_value(settings.get_int('side-margin'))
        sTransMenu.set_active(settings.get_boolean('transparent-menus'))

        // 使用 Adw.ActionRow 來組織每個設置項
        let rowTransparent = new Adw.ActionRow({ title: _('不透明度 (%)') });
        rowTransparent.add_suffix(sTransparent);
        gAppearance.add(rowTransparent);

        let rowTransMenu = new Adw.ActionRow({ title: _('選單透明') });
        rowTransMenu.add_suffix(sTransMenu);
        gAppearance.add(rowTransMenu);

        let rowRadius = new Adw.ActionRow({ title: _('面板圓角 (%)') });
        rowRadius.add_suffix(sRadius);
        gAppearance.add(rowRadius);

        let rowWidth = new Adw.ActionRow({ title: _('浮動長度 (%)') });
        rowWidth.add_suffix(sWidth);
        gAppearance.add(rowWidth);

        let rowTMargin = new Adw.ActionRow({ title: _('頂部邊距 (px)') });
        rowTMargin.add_suffix(spTMargin);
        gAppearance.add(rowTMargin);

        
        let rowSMargin = new Adw.ActionRow({ title: _('側面邊距 (px)') });
        rowSMargin.add_suffix(spSMargin);
        gAppearance.add(rowSMargin);
        
        if (settings.get_int('float-align') == 1) {
            rowSMargin.sensitive = false;
        }else {
            rowSMargin.sensitive = true;
        }
        
        let rowAlign = new Adw.ActionRow({ title: _('對齊方式') });
        rowAlign.add_suffix(cAlign);
        gAppearance.add(rowAlign);

        // 動畫設定
        const gAnime = new Adw.PreferencesGroup({ title: _("動畫設定") });

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
            if (newVal == settings.get_int('duration')) return
            settings.set_int('duration', newVal)
        });

        spSpeed.set_value(settings.get_int('duration'))

        let rowSpeed = new Adw.ActionRow({ title: _('動畫時長 (ms)') });
        rowSpeed.add_suffix(spSpeed);
        gAnime.add(rowSpeed)
        page.add(gAppearance)
        page.add(gAnime)

        window.add(page)
    }
}