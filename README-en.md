[繁體中文](README.md) | [简体中文](README-cn.md) 

# Dynamic Top Panel

Originally inspired by the floating panel design in KDE Plasma 6, it presents a translucent floating bar effect when there are no windows nearby, and a solid panel style when windows are close. It supports Gnome's dark and light mode switching. You can set custom colors for dark and light modes respectively. And there are more settings!

## Floating Mode
![Floating Mode](readme_images/transparent.png)
![Floating Mode](readme_images/transparent_area.png)
![Floating Mode](readme_images/transparent_auto_width.png)
![Floating Mode](readme_images/transparent_color.png)
When there are no windows near the top panel, it will be in floating mode.

**You can combine various styles as you like, but improper combinations may not produce good visual effects.**

Floating mode has a translucent effect and a built-in simple blur effect. if you want a more advanced and more controllable blur effect, it is recommended to use Blur my shell's static pipeline for the panel. Blur my shell's dynamic mode will not have rounded corners, which is a problem with Blur my shell.
### Blur my shell Settings
![Blur my shell Settings](readme_images/bms_settings1.png)

Use static effects because dynamic effects do not support rounded corners

![Blur my shell Pipeline Settings](readme_images/bms_settings2.png)

Remember to add the "Corner" effect to the corresponding Pipeline and adjust it according to the rounded corners you set in this extension.
### Effect when used with Blur my shell
![Floating effect with blur](readme_images/blur.png)

## Solid Mode
![Solid Mode](readme_images/solid.png)
When any window is close enough (almost touching) to the top panel, the top panel will become an opaque dock (same as the default in Gnome, but you can apply custom colors to it), which can better blend with maximized windows, unlike themes that are always floating and have a "light leakage" phenomenon.

# Install the Extension
### 1. Install from Gnome Extensions (Recommended)
Extension link: [https://extensions.gnome.org/extension/7284/dynamic-panel/](https://extensions.gnome.org/extension/7284/dynamic-panel/)
### 2. Install from GitHub (Not Recommended)
**Not recommended: The Main branch may be in the process of developing the next version, so it may not work properly**

1. Select Tag to the latest or desired version, Clone or download Zip to local, or you should go to Release to download
1. Unzip all files to `~/.local/share/gnome-shell/extensions/dynamic-panel@velhlkj.com/`
    * If the directory does not exist, create it yourself.
    * Be careful not to nest! extension.js should be directly in `dynamic-panel@velhlkj.com`, not in `dynamic-panel@velhlkj.com/dynamic-panel/`.
    * The path is fixed, including `dynamic-panel@velhlkj.com`, and **the directory name cannot be changed**, otherwise the extension will not be displayed in the list and will not take effect. This is because Gnome extensions require the directory name to be consistent with the uuid specified in metadata.json.
1. Restart Gnome (Alt-F2, type r, and press Enter) or log out and log back in
1. Enable the extension in Gnome Extensions

# About Performance
Due to Gnome's own css and gjs, CSS3's transition tweening animation is actually invalid for most properties! And the requestAnimationFrame animation frame alignment function cannot be used either. Therefore, it is necessary to use a fixed frame interval loop to do frame-by-frame animation to achieve smooth movement, size change, rounded corner animation, etc., so there will be a certain impact on performance **during the animation process**. But there is **no performance impact in a static state**.

# About Translation
* Except for Simplified Chinese, Traditional Chinese (Taiwan), and English maintained by the author (Velade), other translations mainly come from other contributors.
* Because I don't understand other languages at all, when translations other than the above languages have entries added/changed, the author will use Gemini AI to translate and supplement/modify instead of leaving them blank. However, the accuracy of the translation and whether it is the most appropriate choice cannot be guaranteed.

# Translation Contributors (in no particular order)
* [Aleksandr Shamaraev](https://github.com/AlexanderShad) - Russian
* [Amerey](https://github.com/Amereyeu) - Czech
* [Ritam Saha](https://github.com/astro-ray) - English(India)

# Special Thanks (in no particular order)
* **Thanks to Gonzague/Paul Fauchon's Transparent Top Bar (Adjustable transparency) for the idea, the implementation of window proximity detection largely refers to this extension**

* **Thanks to Google Gemini for the help provided in the research and learning of Gjs**