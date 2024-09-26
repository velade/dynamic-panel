[繁體中文](README.md) | [English](README-en.md) 
# 动态顶部面板
灵感来源于KDE Plasma6 的悬浮面板的设计，在附近没有窗口时呈现半透明悬浮条效果，而当窗口靠近时则呈现实色面板的样式。支援gnome的暗色模式和亮色模式切换。可针对暗色和亮色模式分别设定自订颜色。

## 悬浮模式
![悬浮模式](readme_images/transparent.png)
当topbar附近没有窗口时，会呈现悬浮模式，悬浮模式仅仅有半透明效果，没有模糊效果，目前如果想要模糊效果，建议搭配Blur my shell对于面板的静态pipeline使用。 Blur my shell动态模式会没有圆角，这是Blur my shell的问题。
### Blur my shell 设定
![Blur my shell 设定](readme_images/bms_settings1.png)

使用静态效果，因为动态效果不支援圆角

![Blur my shell Pipeline 设定](readme_images/bms_settings2.png)

记得在对应的Pipeline中添加「角落(Corner)」效果，并设定半径到最大（数值超出并不会有影响，最多就是完全变成胶囊）
### 搭配Blur my shell使用的效果
![带模糊的悬浮效果](readme_images/blur.png)

## 停靠模式/实体模式
![停靠模式](readme_images/solid.png)
当有任何窗口足够靠近（几乎接触）Topbar时，Topbar将会变为gnome默认的不透明的停靠栏，与最大化窗口可以更好的融合，而不像主题一样始终悬浮会有「漏光」的现象。

# 安装扩展
### 1. 从Gnome Extensions安装
扩展链接：[https://extensions.gnome.org/extension/7284/dynamic-panel/](https://extensions.gnome.org/extension/7284/dynamic-panel/)
### 2. 从GitHub安装
从GitHub Clone或下载Zip到本地，解压缩所有文件到`~/.local/share/gnome-shell/extensions/dynamic-panel@velhlkj.com/`目录不存在则自行创建即可。注意不要套娃！ extension.js应该直接在`dynamic-panel@velhlkj.com`中，而不是在`dynamic-panel@velhlkj.com/dynamic-panel/`中。

目录是固定的，包括`dynamic-panel@velhlkj.com`也是，**不可以更改目录名**，否则扩展将不会显示在列表中，也无法生效。这是由于gnome扩展要求目录名与metadata.json中指定的uuid保持一致的原因。

# 关于性能
由于gnome自身的css和gjs的缘故，CSS3的transition补间动画居然对大部分属性都是无效的！而requestAnimationFrame这个动画帧对齐函数也无法使用。因此不得不使用固定帧间隔的循环做逐帧动画来实现平滑移动、大小改变和圆角动画，因此在**动画过程中**性能上会有一定影响。但在**静止状态下不存在性能影响**。

# 特别鸣谢
**感谢transparent-top-bar的思路，因为刚刚接触gjs，所以窗口靠近判定的实现灵感基本来源于transparent-top-bar的源码。没有这个代码的思路作为参考，此扩展将难以实现**

**感谢Google Gemini在研究过程中提供的帮助**