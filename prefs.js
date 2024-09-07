import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        let settings = window._settings = this.getSettings();

        const page = new Adw.PreferencesPage();

        const gAppearance = new Adw.PreferencesGroup({ title: "外觀設定" });

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

        // 基礎邊距
        let spMargin = new Gtk.SpinButton({
            adjustment: new Gtk.Adjustment({
                lower: 0,
                upper: 100,
                step_increment: 1
            }),
            climb_rate: 0.5,
            digits: 0
        });
        spMargin.connect('value-changed', (sw) => {
            let newVal = sw.get_value();
            if (newVal == settings.get_int('base-margin')) return
            settings.set_int('base-margin', newVal)
        });

        // 對齊方式
        let cAlign = new Gtk.ComboBoxText()
        cAlign.append_text("左側")
        cAlign.append_text("居中")
        cAlign.append_text("右側")
        cAlign.connect('changed', (sw) => {
            let newVal = sw.get_active()
            if (newVal == settings.get_int('float-align')) return
            settings.set_int('float-align', newVal)
        })

        sTransparent.set_value(settings.get_int('transparent'))
        sRadius.set_value(settings.get_int('radius-times'))
        sWidth.set_value(settings.get_int('float-width'))
        cAlign.set_active(settings.get_int('float-align'))
        spMargin.set_value(settings.get_int('base-margin'))
        sTransMenu.set_active(settings.get_boolean('transparent-menus'))

        // 使用 Adw.ActionRow 來組織每個設置項
        let rowTransparent = new Adw.ActionRow({ title: '不透明度 (%)' });
        rowTransparent.add_suffix(sTransparent);
        gAppearance.add(rowTransparent);

        let rowTransMenu = new Adw.ActionRow({ title: '選單透明' });
        rowTransMenu.add_suffix(sTransMenu);
        gAppearance.add(rowTransMenu);

        let rowRadius = new Adw.ActionRow({ title: '面板圓角 (%)' });
        rowRadius.add_suffix(sRadius);
        gAppearance.add(rowRadius);

        let rowWidth = new Adw.ActionRow({ title: '浮動長度 (%)' });
        rowWidth.add_suffix(sWidth);
        gAppearance.add(rowWidth);

        let rowMargin = new Adw.ActionRow({ title: '基礎邊距 (px)' });
        rowMargin.add_suffix(spMargin);
        gAppearance.add(rowMargin);

        let rowAlign = new Adw.ActionRow({ title: '對齊方式' });
        rowAlign.add_suffix(cAlign);
        gAppearance.add(rowAlign);

        // 動畫設定
        const gAnime = new Adw.PreferencesGroup({ title: "動畫設定" });

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

        let rowSpeed = new Adw.ActionRow({ title: '動畫時長 (ms)' });
        rowSpeed.add_suffix(spSpeed);
        gAnime.add(rowSpeed)
        page.add(gAppearance)
        page.add(gAnime)

        window.add(page)
    }
}