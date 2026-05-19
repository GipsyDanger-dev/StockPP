import logging
import schedule
import threading
import time
from datetime import datetime, timedelta
from typing import Optional, Callable, List
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class ScheduleTask:
    """Represents a scheduled task"""
    task_id: str
    task_type: str  # "retrain", "validation", "cleanup"
    ticker: Optional[str] = None
    last_run: Optional[datetime] = None
    next_run: Optional[datetime] = None
    status: str = "pending"  # pending, running, completed, failed


class ModelScheduler:
    """Scheduler for periodic model maintenance tasks"""

    def __init__(self, retraining_callback: Optional[Callable] = None):
        self.retraining_callback = retraining_callback
        self.is_running = False
        self.scheduler_thread: Optional[threading.Thread] = None
        self.tasks: List[ScheduleTask] = []
        self._lock = threading.Lock()

    def schedule_weekly_retrain(
        self,
        day: str = "monday",
        time_str: str = "00:00",
        tickers: Optional[List[str]] = None
    ) -> None:
        """Schedule weekly retraining"""
        if day.lower() == "monday":
            schedule.every().monday.at(time_str).do(
                self._run_retrain_task,
                tickers=tickers
            )
            logger.info(f"Scheduled weekly retrain for {day} at {time_str}")
        elif day.lower() == "sunday":
            schedule.every().sunday.at(time_str).do(
                self._run_retrain_task,
                tickers=tickers
            )
            logger.info(f"Scheduled weekly retrain for {day} at {time_str}")
        else:
            logger.warning(f"Unsupported day: {day}")

    def schedule_daily_retrain(
        self,
        time_str: str = "02:00",
        tickers: Optional[List[str]] = None
    ) -> None:
        """Schedule daily retraining"""
        schedule.every().day.at(time_str).do(
            self._run_retrain_task,
            tickers=tickers
        )
        logger.info(f"Scheduled daily retrain at {time_str}")

    def schedule_periodic_retrain(
        self,
        interval_hours: int = 12,
        tickers: Optional[List[str]] = None
    ) -> None:
        """Schedule retraining at fixed intervals"""
        schedule.every(interval_hours).hours.do(
            self._run_retrain_task,
            tickers=tickers
        )
        logger.info(f"Scheduled periodic retrain every {interval_hours} hours")

    def _run_retrain_task(self, tickers: Optional[List[str]] = None) -> None:
        try:
            logger.info(f"Starting retraining task. Tickers: {tickers}")

            if self.retraining_callback:
                self.retraining_callback(tickers=tickers)
            else:
                logger.warning("No retraining callback configured")

        except Exception as e:
            logger.error(f"Error in retraining task: {str(e)}", exc_info=True)

    def start(self) -> None:
        """Start the scheduler in a background thread"""
        if self.is_running:
            logger.warning("Scheduler is already running")
            return

        self.is_running = True
        self.scheduler_thread = threading.Thread(
            target=self._run_scheduler,
            daemon=True,
            name="ModelScheduler"
        )
        self.scheduler_thread.start()
        logger.info("Model scheduler started")

    def stop(self) -> None:
        """Stop the scheduler"""
        self.is_running = False
        schedule.clear()
        if self.scheduler_thread:
            self.scheduler_thread.join(timeout=5)
        logger.info("Model scheduler stopped")

    def _run_scheduler(self) -> None:
        logger.info("Scheduler loop started")

        while self.is_running:
            try:
                schedule.run_pending()
                time.sleep(60)
            except Exception as e:
                logger.error(f"Error in scheduler loop: {str(e)}", exc_info=True)
                time.sleep(60)

    def get_next_run_time(self) -> Optional[datetime]:
        """Get next scheduled task time"""
        try:
            if schedule.jobs:
                next_job = min(schedule.jobs, key=lambda x: x.next_run)
                return next_job.next_run
        except Exception as e:
            logger.error(f"Error getting next run time: {str(e)}")

        return None

    def get_scheduled_jobs_info(self) -> List[dict]:
        """Get information about scheduled jobs"""
        jobs_info = []

        for job in schedule.jobs:
            jobs_info.append({
                "job_id": str(job.job_func.func.__name__),
                "next_run": job.next_run.isoformat(),
                "interval": str(job.interval),
                "at_time": str(job.at_time) if hasattr(job, 'at_time') else None
            })

        return jobs_info
