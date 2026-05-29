import asyncio
import logging
from typing import Optional

logger = logging.getLogger(__name__)


class ProgressEmitter:
    """Streams progress events to an async queue for SSE consumption.

    Supports both async (from event loop) and sync (from thread pool) emission.
    Safe labels only — never exposes model architecture details.
    """

    def __init__(self, queue: asyncio.Queue, loop: asyncio.AbstractEventLoop):
        self.queue = queue
        self.loop = loop

    async def step(self, step_id: str, label: str, status: str = "running"):
        await self.queue.put({
            "event": "step",
            "data": {"step": step_id, "label": label, "status": status}
        })

    async def train_step(self, step_id: str, label: str, status: str = "running", progress: Optional[dict] = None):
        data = {"step": step_id, "label": label, "status": status}
        if progress:
            data["progress"] = progress
        await self.queue.put({"event": "train_step", "data": data})

    async def epoch(self, epoch: int, total_epochs: int, loss: float, val_loss: float):
        await self.queue.put({
            "event": "epoch",
            "data": {
                "epoch": epoch,
                "total_epochs": total_epochs,
                "loss": round(loss, 6),
                "val_loss": round(val_loss, 6)
            }
        })

    async def complete(self, data: dict):
        await self.queue.put({"event": "complete", "data": data})

    async def train_complete(self, rmse: float, mae: float):
        await self.queue.put({
            "event": "train_complete",
            "data": {"rmse": round(rmse, 2), "mae": round(mae, 2)}
        })

    async def error(self, message: str):
        await self.queue.put({
            "event": "error_event",
            "data": {"message": message}
        })

    # --- Sync bridge for Keras callbacks (runs in thread pool) ---

    def emit_epoch_sync(self, epoch: int, total_epochs: int, loss: float, val_loss: float):
        """Call from synchronous/threaded code (Keras callback)."""
        self.loop.call_soon_threadsafe(
            self.queue.put_nowait,
            {
                "event": "epoch",
                "data": {
                    "epoch": epoch,
                    "total_epochs": total_epochs,
                    "loss": round(loss, 6),
                    "val_loss": round(val_loss, 6)
                }
            }
        )

    def emit_sync(self, event: str, data: dict):
        """Generic sync emit for any event type from threaded code."""
        self.loop.call_soon_threadsafe(
            self.queue.put_nowait,
            {"event": event, "data": data}
        )
