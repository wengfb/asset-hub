"""
视频处理模块
用于关键帧抽取
"""
import io
import os
import tempfile
from typing import Optional
import cv2
from PIL import Image

from app.config import settings


class VideoProcessor:
    """视频处理服务"""

    def __init__(self):
        self.frame_interval = settings.VIDEO_FRAME_INTERVAL
        self.min_frames = settings.VIDEO_MIN_FRAMES
        self.max_frames = settings.VIDEO_MAX_FRAMES

    def extract_frames(self, video_path: str) -> list[dict]:
        """
        从视频中抽取关键帧

        Args:
            video_path: 视频文件路径

        Returns:
            帧信息列表，包含 frame_index, timestamp_ms, image_data
        """
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"无法打开视频: {video_path}")

        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration_ms = (total_frames / fps) * 1000 if fps > 0 else 0

        # 计算抽帧间隔
        frame_interval_frames = int(fps * self.frame_interval)
        if frame_interval_frames < 1:
            frame_interval_frames = 1

        frames = []
        frame_index = 0
        extracted_count = 0

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            # 按间隔抽帧
            if frame_index % frame_interval_frames == 0:
                if extracted_count >= self.max_frames:
                    break

                timestamp_ms = int((frame_index / fps) * 1000)

                # 转换为 PIL Image
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                pil_image = Image.fromarray(frame_rgb)

                # 转换为 bytes
                buffer = io.BytesIO()
                pil_image.save(buffer, format="JPEG", quality=85)
                image_data = buffer.getvalue()

                frames.append({
                    "frame_index": extracted_count,
                    "timestamp_ms": timestamp_ms,
                    "image_data": image_data
                })
                extracted_count += 1

            frame_index += 1

        cap.release()

        # 确保最少帧数
        if len(frames) < self.min_frames and total_frames > 0:
            frames = self._extract_uniform_frames(video_path, self.min_frames)

        return frames

    def _extract_uniform_frames(self, video_path: str, num_frames: int) -> list[dict]:
        """均匀抽取指定数量的帧"""
        cap = cv2.VideoCapture(video_path)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS)

        interval = max(1, total_frames // num_frames)
        frames = []

        for i in range(num_frames):
            frame_pos = i * interval
            cap.set(cv2.CAP_PROP_POS_FRAMES, frame_pos)
            ret, frame = cap.read()

            if ret:
                timestamp_ms = int((frame_pos / fps) * 1000)
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                pil_image = Image.fromarray(frame_rgb)

                buffer = io.BytesIO()
                pil_image.save(buffer, format="JPEG", quality=85)

                frames.append({
                    "frame_index": i,
                    "timestamp_ms": timestamp_ms,
                    "image_data": buffer.getvalue()
                })

        cap.release()
        return frames

    def get_video_info(self, video_path: str) -> dict:
        """获取视频元信息"""
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"无法打开视频: {video_path}")

        info = {
            "width": int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)),
            "height": int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)),
            "fps": cap.get(cv2.CAP_PROP_FPS),
            "frame_count": int(cap.get(cv2.CAP_PROP_FRAME_COUNT)),
            "duration_ms": 0
        }

        if info["fps"] > 0:
            info["duration_ms"] = int((info["frame_count"] / info["fps"]) * 1000)

        cap.release()
        return info

    def extract_thumbnail(self, video_path: str, timestamp_ms: int = 0) -> bytes:
        """提取视频缩略图"""
        cap = cv2.VideoCapture(video_path)
        fps = cap.get(cv2.CAP_PROP_FPS)

        if timestamp_ms > 0 and fps > 0:
            frame_pos = int((timestamp_ms / 1000) * fps)
            cap.set(cv2.CAP_PROP_POS_FRAMES, frame_pos)

        ret, frame = cap.read()
        cap.release()

        if not ret:
            raise ValueError("无法提取缩略图")

        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        pil_image = Image.fromarray(frame_rgb)

        # 缩放到缩略图尺寸
        pil_image.thumbnail((400, 400), Image.Resampling.LANCZOS)

        buffer = io.BytesIO()
        pil_image.save(buffer, format="JPEG", quality=85)
        return buffer.getvalue()


# 全局实例
video_processor = VideoProcessor()
