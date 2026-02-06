from pydantic import BaseModel
from typing import Generic, List, TypeVar

T = TypeVar("T")


class PaginationParams(BaseModel):
    page: int = 1
    page_size: int = 20


class PaginatedResponse(BaseModel, Generic[T]):
    total: int
    items: List[T]


class SuccessResponse(BaseModel):
    success: bool = True
    message: str
