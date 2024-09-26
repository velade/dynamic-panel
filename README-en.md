[繁體中文](README.md) | [简体中文](README-cn.md) 

# Dynamic Top Panel

Inspired by the floating panel design in KDE Plasma 6, this extension presents a translucent floating bar effect when there are no windows nearby, and switches to a solid panel style when windows approach. It supports both dark and light modes in GNOME. Custom colors can be set separately for dark and light modes.

## Floating Mode

![Floating Mode](readme_images/transparent.png)

When there are no windows near the top bar, it enters floating mode. In this mode, it only has a translucent effect without any blur. If you desire a blur effect for now, it's recommended to use Blur my shell's static pipeline for the panel. Blur my shell's dynamic mode doesn't support rounded corners, which is an issue with Blur my shell itself.

### Blur my shell Settings

![Blur my shell settings](readme_images/bms_settings1.png)

Use the static effect because the dynamic effect doesn't support rounded corners.

![Blur my shell Pipeline settings](readme_images/bms_settings2.png)

Remember to add the "Corner" effect to the corresponding pipeline and set the radius to the maximum (exceeding the value won't have any impact, it will just make it fully rounded).

### Effect when used with Blur my shell

![Effect when used with Blur my shell](readme_images/blur.png)

## Docked/Solid Mode

![Solid Mode](readme_images/solid.png)

When any window gets close enough (almost touching) to the top bar, it will transform into GNOME's default opaque docked bar. This allows for better integration with maximized windows, avoiding the "light leakage" phenomenon often seen with themes that keep the top bar floating.

# Installing the Extension

### 1. Install from Gnome Extensions

Extension link: [https://extensions.gnome.org/extension/7284/dynamic-panel/](https://extensions.gnome.org/extension/7284/dynamic-panel/)

### 2. Install from GitHub

Clone or download the zip from GitHub to your local machine. Extract all files to the `~/.local/share/gnome-shell/extensions/dynamic-panel@velhlkj.com/` directory (create it if it doesn't exist). Make sure not to nest the files! `extension.js` should be directly within `dynamic-panel@velhlkj.com/`, not inside `dynamic-panel@velhlkj.com/dynamic-panel/`.

The directory structure is fixed, including `dynamic-panel@velhlkj.com`. **Do not change the directory name**, or the extension will not appear in the list and will not take effect. This is because GNOME extensions require the directory name to be consistent with the UUID specified in `metadata.json`.

# About Performance

Due to limitations in GNOME's CSS and GJS, CSS3 transition animations are surprisingly ineffective for most properties! Also, the `requestAnimationFrame` function for animation frame synchronization is not available. Therefore, we have to use a fixed frame interval loop to achieve smooth movement, resizing, and rounded corner animations. This may have some performance impact **during animations**, but there is **no performance impact in a static state**.

# Special Thanks

**Thanks to the transparent-top-bar extension for its inspiration. As I'm new to GJS, the implementation of window proximity detection was largely based on the source code of transparent-top-bar. Without this code as a reference, this extension would have been difficult to achieve.**

**Thanks to Google Gemini for its assistance during the research process.**