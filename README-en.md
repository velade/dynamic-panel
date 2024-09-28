[繁體中文](README.md) | [简体中文](README-cn.md) 

# Dynamic Top Panel

Inspired by the floating panel design in KDE Plasma 6, this extension presents a translucent floating bar effect when there are no windows nearby, and switches to a solid panel style when windows approach. It supports Gnome's dark and light mode switching and allowing you to set custom colors for each mode.

## Floating Mode
![Floating Mode](readme_images/transparent.png)
When there are no windows near the Top-Panel, it will enter floating mode, which only has a translucent effect without blurring. Currently, if you want a blur effect, it's recommended to use Blur-my-shell's static pipeline for the panel. Blur-my-shell's dynamic mode doesn't support rounded corners, which is an issue with Blur-my-shell itself.

### Blur-my-shell Settings
![Blur-my-shell Settings](readme_images/bms_settings1.png)

Use the static mode because the dynamic mode doesn't support rounded corners.

![Blur-my-shell Pipeline Settings](readme_images/bms_settings2.png)

Remember to add the "Corner" effect to the corresponding pipeline and adjust the radius according to the rounded corners you set in my extension.

### Preview with Blur-my-shell
![Blurred Floating Effect](readme_images/blur.png)

## Solid Mode
![Solid Mode](readme_images/solid.png)
When any window is close enough (almost touching) to the top panel, the top panel will become a solid panel (similar to the default in Gnome, but it can applys custom colors to it). This allows for better integration with maximized windows, eliminating the "background leakage" phenomenon often seen with themes that keep the panel floating.

# Installation
### 1. Install from Gnome Extensions site (Recommended)
Extension link: [https://extensions.gnome.org/extension/7284/dynamic-panel/](https://extensions.gnome.org/extension/7284/dynamic-panel/)

### 2. Install from GitHub (Not Recommended)
**Not recommended: The Main branch might be under development for the next version, so it might not work properly yet.**

1. Choose the latest Tag or your desired version, clone or download the Zip to your computer, or you should go to Releases to download.
2. Extract all files to `~/.local/share/gnome-shell/extensions/dynamic-panel@velhlkj.com/`
    * Create the directory if it doesn't exist.
    * Make sure not to nest the files! `extension.js` should be directly in `dynamic-panel@velhlkj.com`, not in `dynamic-panel@velhlkj.com/dynamic-panel/`.
    * The path is fixed, including `dynamic-panel@velhlkj.com`. **Do not change the directory name**, otherwise the extension will not be displayed in the list and will not work. This is because Gnome require extensions's directory name to be consistent with the uuid specified in `metadata.json`.
3. Restart Gnome (Alt-F2, type `r`, and press Enter) or just log out and back in.
4. Enable the extension in Gnome Extensions.

# About Performance
Due to Gnome's own css and gjs limitations, CSS3 transition animations are ineffective for most properties! The `requestAnimationFrame` function for animation frame alignment is also unavailable. Therefore, I have to use a fixed frame interval loop for frame-by-frame animation to achieve smooth movement, resizing, and rounded corner animations. This may have some performance impact **during the animation process**. However, there is **no performance impact in a static state**.

# About Translations
* Except for Simplified Chinese, Traditional Chinese (Taiwan), and English, which are maintained by the me (Velade), other translations are mainly from contributors.
* As I don't understand other languages, when translations other than the above-mentioned languages have entries added/changed, I will use Gemini AI for translation and supplementation/modification instead of leaving them blank. However, the accuracy of the translation and whether it's the most appropriate choice cannot be guaranteed.

# Translation Contributors (in no particular order)
* [Aleksandr Shamaraev](https://github.com/AlexanderShad) - Russian
* [Amerey](https://github.com/Amereyeu) - Czech

# Special Thanks (in no particular order)
* **Thanks to Gonzague/Paul Fauchon's Transparent Top Bar (Adjustable transparency) extension for the idea. The implementation of window proximity detection in this extension heavily references this extension.**

* **Thanks to Google Gemini for its assistance in researching and learning Gjs.**