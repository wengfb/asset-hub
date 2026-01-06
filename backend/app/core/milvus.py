from pymilvus import connections, Collection, FieldSchema
from pymilvus import CollectionSchema, DataType, utility
from app.config import settings


class MilvusService:
    """Milvus向量数据库服务"""

    COLLECTION_NAME = "image_vectors"
    VECTOR_DIM = 512

    def __init__(self):
        self._connect()
        self._ensure_collection()

    def _connect(self):
        """连接Milvus"""
        connections.connect(
            alias="default",
            host=settings.MILVUS_HOST,
            port=settings.MILVUS_PORT
        )

    def _ensure_collection(self):
        """确保Collection存在"""
        if utility.has_collection(self.COLLECTION_NAME):
            self.collection = Collection(self.COLLECTION_NAME)
            return

        fields = [
            FieldSchema(name="id", dtype=DataType.VARCHAR,
                       max_length=64, is_primary=True),
            FieldSchema(name="asset_id", dtype=DataType.VARCHAR,
                       max_length=36),
            FieldSchema(name="asset_type", dtype=DataType.VARCHAR,
                       max_length=20),
            FieldSchema(name="frame_index", dtype=DataType.INT64),
            FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR,
                       dim=self.VECTOR_DIM),
        ]
        schema = CollectionSchema(fields, description="图片向量")
        self.collection = Collection(self.COLLECTION_NAME, schema)

        # 创建索引
        index_params = {
            "metric_type": "IP",
            "index_type": "IVF_FLAT",
            "params": {"nlist": 1024}
        }
        self.collection.create_index("embedding", index_params)

    def insert(
        self,
        vector_id: str,
        asset_id: str,
        asset_type: str,
        frame_index: int,
        embedding: list[float]
    ):
        """插入向量"""
        data = [
            [vector_id],
            [asset_id],
            [asset_type],
            [frame_index],
            [embedding]
        ]
        self.collection.insert(data)

    def search(
        self,
        embedding: list[float],
        top_k: int = 20,
        asset_type_filter: str = None
    ) -> list[dict]:
        """搜索相似向量"""
        self.collection.load()

        expr = None
        if asset_type_filter:
            expr = f'asset_type == "{asset_type_filter}"'

        results = self.collection.search(
            data=[embedding],
            anns_field="embedding",
            param={"metric_type": "IP", "params": {"nprobe": 16}},
            limit=top_k,
            expr=expr,
            output_fields=["asset_id", "asset_type", "frame_index"]
        )

        return self._format_results(results)

    def _format_results(self, results) -> list[dict]:
        """格式化搜索结果"""
        formatted = []
        for hits in results:
            for hit in hits:
                formatted.append({
                    "id": hit.id,
                    "asset_id": hit.entity.get("asset_id"),
                    "asset_type": hit.entity.get("asset_type"),
                    "frame_index": hit.entity.get("frame_index"),
                    "score": hit.score
                })
        return formatted

    def delete(self, vector_ids: list[str]):
        """删除向量"""
        expr = f'id in {vector_ids}'
        self.collection.delete(expr)


milvus_service = MilvusService()
