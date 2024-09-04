import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        let settings = window._settings = this.getSettings();

        const page = new Adw.PreferencesPage();

        const gAppearance = new Adw.PreferencesGroup({ title: "外觀設定" });

        let grid = new Gtk.Grid();
        grid.set_column_spacing(10);
        grid.set_row_spacing(10);
        // 圓角控制條
        let lRadius = new Gtk.Label({ label: '', use_markup: true, width_chars: 5 })
        function updateRadiusLabel(val) { lRadius.set_markup(`面板圓角:\n<small>${val}%</small>`) }
        let sRadius = new Gtk.Scale({
            orientation: Gtk.Orientation.HORIZONTAL,
            hexpand: true,
            digits: 0,
            adjustment: new Gtk.Adjustment({ lower: 1, upper: 100, step_increment: 1 }),
            value_pos: Gtk.PositionType.RIGHT,
            round_digits: 0
        })
        sRadius.connect('value-changed', (sw) => {
            let newVal = sw.get_value()
            if (newVal == settings.get_int('radius-times')) return
            settings.set_int('radius-times', newVal)
            updateRadiusLabel(newVal);
        })
        // 寬度控制條
        let lWidth = new Gtk.Label({ label: '', use_markup: true, width_chars: 5 })
        function updateWidthLabel(val) { lWidth.set_markup(`浮動長度:\n<small>${val}%</small>`) }
        let sWidth = new Gtk.Scale({
            orientation: Gtk.Orientation.HORIZONTAL,
            hexpand: true,
            digits: 0,
            adjustment: new Gtk.Adjustment({ lower: 1, upper: 100, step_increment: 1 }),
            value_pos: Gtk.PositionType.RIGHT,
            round_digits: 0
        })
        sWidth.connect('value-changed', (sw) => {
            let newVal = sw.get_value()
            if (newVal == settings.get_int('float-width')) return
            settings.set_int('float-width', newVal)
            updateWidthLabel(newVal);
        })

        // 基礎邊距
        let lMargin = new Gtk.Label({ label: '', use_markup: true, width_chars: 5 })
        lMargin.set_markup(`基礎邊距:\n(px)`)
        let spMargin = new Gtk.SpinButton({
            adjustment: new Gtk.Adjustment({
                lower: 0,
                upper: 100,
                step_increment: 1
            }),
            climb_rate: 0.5,
            digits: 2
        });
        spMargin.connect('value-changed', (sw) => {
            let newVal = sw.get_value();
            if (newVal == settings.get_int('base-margin')) return
            settings.set_int('base-margin', newVal)
        });

        // 對齊方式
        let lAlign = new Gtk.Label({ label: '', use_markup: true, width_chars: 5 })
        lAlign.set_markup(`對齊方式:`)
        let cAlign = new Gtk.ComboBoxText()
        cAlign.append_text("左側")
        cAlign.append_text("居中")
        cAlign.append_text("右側")
        cAlign.connect('changed', (sw) => {
            let newVal = sw.get_active()
            if (newVal == settings.get_int('float-align')) return
            settings.set_int('float-align', newVal)
        })


        updateRadiusLabel(settings.get_int('radius-times'))
        sRadius.set_value(settings.get_int('radius-times'))

        updateWidthLabel(settings.get_int('float-width'))
        sWidth.set_value(settings.get_int('float-width'))

        cAlign.set_active(settings.get_int('float-align'))

        spMargin.set_value(settings.get_int('base-margin'))

        grid.attach(lRadius, 0, 0, 1, 1);
        grid.attach(sRadius, 1, 0, 1, 1);

        grid.attach(lWidth, 0, 1, 1, 1);
        grid.attach(sWidth, 1, 1, 1, 1);

        grid.attach(lMargin, 0, 2, 1, 1);
        grid.attach(spMargin, 1, 2, 1, 1);

        grid.attach(lAlign, 0, 3, 1, 1);
        grid.attach(cAlign, 1, 3, 1, 1);

        gAppearance.add(grid)

        page.add(gAppearance)
        window.add(page)
    }
}