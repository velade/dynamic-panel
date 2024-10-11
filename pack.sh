#!/bin/bash

# 获取当前版本号
current_version=$(cat metadata.json | sed 's/,/\n/g' | grep "version-name" | sed 's/:/\n/g' | sed '1d' | sed 's/}//g' | cut -d '"' -f 2)

# 设置zip文件名
zip_file="dynamic-panel@velhlkj.com_v${current_version}.zip"

# 指定要排除的文件和目录，多个文件/目录以空格分隔
exclude_files="*.md *.txt *.po *.pot *.zip locale/compile_all.sh pack.sh"

# 打包当前目录，排除指定文件
zip -r "$zip_file" . -x "./readme_images/*" "./.git/*" $exclude_files

echo "已打包为: $zip_file"
