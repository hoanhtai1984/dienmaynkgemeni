import logging

from apscheduler.schedulers.background import BackgroundScheduler

from .jobs import sales_report, recommendations

logger = logging.getLogger("scheduler")

scheduler = BackgroundScheduler(timezone="Asia/Ho_Chi_Minh")


def _run_job(name, fn):
    try:
        result = fn()
        logger.info("job %s finished: %s", name, result)
    except Exception:
        logger.exception("job %s failed", name)


def start():
    scheduler.add_job(
        lambda: _run_job("sales_report", sales_report.run),
        "interval",
        minutes=30,
        id="sales_report",
    )
    scheduler.add_job(
        lambda: _run_job("recommendations", recommendations.run),
        "interval",
        minutes=60,
        id="recommendations",
    )
    scheduler.start()

    # Run once immediately on startup so SalesReport/ProductRecommendation are
    # populated right away instead of waiting for the first interval to elapse.
    for name, fn in (
        ("sales_report", sales_report.run),
        ("recommendations", recommendations.run),
    ):
        _run_job(name, fn)


def shutdown():
    scheduler.shutdown(wait=False)
