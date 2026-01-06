#!/bin/bash
# CN-CLIP 模型下载脚本

MODEL_DIR="/home/wengfb/IdeaProjects/asset-hub/backend/models/cn-clip"
mkdir -p $MODEL_DIR

echo "下载 CN-CLIP ViT-B-16 模型..."
echo "模型将在首次使用时自动下载到 $MODEL_DIR"
echo ""
echo "如需手动下载，请访问:"
echo "https://github.com/OFA-Sys/Chinese-CLIP"
