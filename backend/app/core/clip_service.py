"""
CN-CLIP 服务模块
用于图片和文本的向量编码
"""
import io
from typing import Optional
import torch
from PIL import Image

# CN-CLIP 导入
import cn_clip.clip as clip
from cn_clip.clip import load_from_name

from app.config import settings


class CNClipService:
    """CN-CLIP 向量编码服务"""

    _instance: Optional["CNClipService"] = None

    def __init__(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model = None
        self.preprocess = None
        self._initialized = False

    @classmethod
    def get_instance(cls) -> "CNClipService":
        """获取单例实例"""
        if cls._instance is None:
            cls._instance = CNClipService()
        return cls._instance

    def initialize(self):
        """初始化模型（延迟加载）"""
        if self._initialized:
            return

        print(f"正在加载 CN-CLIP 模型: {settings.CLIP_MODEL_NAME}")
        print(f"使用设备: {self.device}")

        self.model, self.preprocess = load_from_name(
            settings.CLIP_MODEL_NAME,
            device=self.device,
            download_root=settings.CLIP_MODEL_PATH
        )
        self.model.eval()
        self._initialized = True
        print("CN-CLIP 模型加载完成")

    def encode_image(self, image_data: bytes) -> list[float]:
        """
        将图片编码为向量

        Args:
            image_data: 图片二进制数据

        Returns:
            512维归一化向量
        """
        self.initialize()

        # 加载图片
        image = Image.open(io.BytesIO(image_data)).convert("RGB")

        # 预处理
        image_input = self.preprocess(image).unsqueeze(0).to(self.device)

        # 编码
        with torch.no_grad():
            image_features = self.model.encode_image(image_input)
            # L2 归一化
            image_features = image_features / image_features.norm(dim=-1, keepdim=True)

        return image_features.cpu().numpy()[0].tolist()

    def encode_text(self, text: str) -> list[float]:
        """
        将文本编码为向量

        Args:
            text: 中文或英文文本

        Returns:
            512维归一化向量
        """
        self.initialize()

        # 分词
        text_input = clip.tokenize([text]).to(self.device)

        # 编码
        with torch.no_grad():
            text_features = self.model.encode_text(text_input)
            # L2 归一化
            text_features = text_features / text_features.norm(dim=-1, keepdim=True)

        return text_features.cpu().numpy()[0].tolist()

    def encode_images_batch(self, images_data: list[bytes], batch_size: int = 32) -> list[list[float]]:
        """
        批量编码图片

        Args:
            images_data: 图片二进制数据列表
            batch_size: 批处理大小

        Returns:
            向量列表
        """
        self.initialize()

        all_features = []

        for i in range(0, len(images_data), batch_size):
            batch = images_data[i:i + batch_size]

            # 预处理批次
            images = []
            for data in batch:
                img = Image.open(io.BytesIO(data)).convert("RGB")
                images.append(self.preprocess(img))

            image_input = torch.stack(images).to(self.device)

            # 编码
            with torch.no_grad():
                features = self.model.encode_image(image_input)
                features = features / features.norm(dim=-1, keepdim=True)

            all_features.extend(features.cpu().numpy().tolist())

        return all_features


# 全局服务实例
clip_service = CNClipService.get_instance()
