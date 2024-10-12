[English](README-en.md) | [简体中文](README-cn.md) 

# 動態頂部面板

最初靈感來源於 KDE Plasma 6 的懸浮面板的設計，在附近沒有視窗時呈現半透明懸浮條效果，而當視窗靠近時則呈現實色面板的樣式。支援 Gnome 的暗色模式和亮色模式切換。可針對暗色和亮色模式分別設定自訂顏色。還有更多設定！

## 懸浮模式
![懸浮模式](readme_images/transparent.png)
![懸浮模式](readme_images/transparent_area.png)
![懸浮模式](readme_images/transparent_auto_width.png)
![懸浮模式](readme_images/transparent_color.png)
當頂部面板附近沒有視窗時，會呈現懸浮模式。

**你可以任意組合各種樣式，但不恰當的組合可能不會帶來好的視覺效果。**

懸浮模式有半透明效果，內建簡易模糊效果，如果想要更高級和細緻的模糊效果，建議搭配 Blur my shell 對於面板的靜態 pipeline 使用。Blur my shell 動態模式會沒有圓角，這是 Blur my shell 的問題。
### Blur my shell 設定
![Blur my shell 設定](readme_images/bms_settings1.png)

使用靜態效果，因為動態效果不支援圓角

![Blur my shell Pipeline 設定](readme_images/bms_settings2.png)

記得在對應的 Pipeline 中添加「角落 (Corner)」效果，並根據你在此擴充功能中設定的圓角進行調整
### 搭配 Blur my shell 使用的效果
![帶模糊的懸浮效果](readme_images/blur.png)

## 實體模式
![實體模式](readme_images/solid.png)
當有任何視窗足夠靠近（幾乎接觸）頂部面板時，頂部面板將會變為不透明的停靠欄（和 Gnome 默認的一樣，但你可以對其應用自訂顏色），與最大化視窗可以更好的融合，而不像主題一樣始終懸浮會有「漏光」的現象。

# 安裝擴充功能
### 1. 從 Gnome Extensions 安裝（推薦）
擴充功能連結：[https://extensions.gnome.org/extension/7284/dynamic-panel/](https://extensions.gnome.org/extension/7284/dynamic-panel/)
### 2. 從 GitHub 安裝（不建議）
**不建議：Main 分支中可能處於正在開發下個版本的階段，因此可能無法正常使用**

1. 選擇 Tag 到最新或你想要的版本 Clone 或下載 Zip 到本地，或者你應該去 Release 下載
1. 解壓縮所有檔案到 `~/.local/share/gnome-shell/extensions/dynamic-panel@velhlkj.com/`
    * 目錄不存在則自行創建即可。
    * 注意不要套娃！extension.js 應該直接在 `dynamic-panel@velhlkj.com` 中，而不是在 `dynamic-panel@velhlkj.com/dynamic-panel/` 中。
    * 路徑是固定的，包括 `dynamic-panel@velhlkj.com` 也是，**不可以更改目錄名**，否則擴充功能將不會顯示在列表中，也無法生效。這是由於 Gnome 擴充功能要求目錄名與 metadata.json 中指定的 uuid 保持一致的原因。
1. 重新啟動 Gnome (Alt-F2 輸入 r 回車) 或重新登入
1. 在 Gnome Extensions 中啟用擴充功能

# 關於效能
由於 Gnome 自身的 css 和 gjs 的緣故，CSS3 的 transition 補間動畫居然對大部分屬性都是無效的！而 requestAnimationFrame 這個動畫幀對齊函數也無法使用。因此不得不使用固定幀間隔的循環做逐幀動畫來實現平滑移動、大小改變和圓角動畫等，因此在 **動畫過程中** 效能上會有一定影響。但在 **靜止狀態下不存在效能影響**。

# 關於翻譯
* 除簡體中文、繁體中文 (台灣)、英文由作者 (Velade) 維護外，其他翻譯主要來源於其他貢獻者。
* 因為完全不懂其他語言，當除上述語言以外的翻譯有條目增加/變更時，作者將以 Gemini AI 進行翻譯並補充/修改而不是留空。但無法保證翻譯的準確性以及是否是最合適的選擇。

# 翻譯貢獻者（排名不分先後）
* [Aleksandr Shamaraev](https://github.com/AlexanderShad) - 俄語 (Russian)
* [Amerey](https://github.com/Amereyeu) - 捷克語 (Czech)
* [Ritam Saha](https://github.com/astro-ray) - 英語(印度)

# 特別鳴謝（排名不分先後）
* **感謝 Gonzague/Paul Fauchon 的 Transparent Top Bar (Adjustable transparency) 的思路，對視窗靠近的判定實現思路大量參考了此擴充功能**

* **感謝 Google Gemini 在研究和學習 Gjs 過程中提供的幫助**