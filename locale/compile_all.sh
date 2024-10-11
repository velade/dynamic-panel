#!/bin/bash

# 遍历当前目录下所有子目录
find . -maxdepth 1 -mindepth 1 -type d -print0 | while IFS= read -r -d '' dir; do
  # 构建 .po 文件和 .mo 文件的路径
  po_file="$dir/LC_MESSAGES/dynamic-panel.po"
  mo_file="$dir/LC_MESSAGES/dynamic-panel.mo"

  # 如果 .po 文件存在，则执行 msgfmt 命令
  if [ -f "$po_file" ]; then
    msgfmt -o "$mo_file" "$po_file"
  fi
done
