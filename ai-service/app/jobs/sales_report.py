"""Aggregates today's orders into a daily SalesReport row (upsert by reportDate).

If there were no orders today (common for a fresh demo store), topProductIds
falls back to the overall best-sellers (by Product.sold) so the admin report
page always has something meaningful to show.
"""

import json
from datetime import date

from sqlalchemy import text

from ..db import SessionLocal

TOP_N = 5


def run():
    session = SessionLocal()
    try:
        today = date.today()

        summary = session.execute(
            text(
                """
                SELECT COUNT(*) AS total_orders, COALESCE(SUM(total), 0) AS total_revenue
                FROM `Order`
                WHERE DATE(createdAt) = :today
                """
            ),
            {"today": today},
        ).mappings().one()

        top_today = session.execute(
            text(
                """
                SELECT oi.productId AS product_id, SUM(oi.quantity) AS qty
                FROM `OrderItem` oi
                JOIN `Order` o ON o.id = oi.orderId
                WHERE DATE(o.createdAt) = :today
                GROUP BY oi.productId
                ORDER BY qty DESC
                LIMIT :limit
                """
            ),
            {"today": today, "limit": TOP_N},
        ).mappings().all()

        top_product_ids = [row["product_id"] for row in top_today]

        if not top_product_ids:
            fallback = session.execute(
                text("SELECT id FROM `Product` ORDER BY sold DESC LIMIT :limit"),
                {"limit": TOP_N},
            ).mappings().all()
            top_product_ids = [row["id"] for row in fallback]

        session.execute(
            text(
                """
                INSERT INTO `SalesReport` (reportDate, totalOrders, totalRevenue, topProductIds, generatedAt)
                VALUES (:report_date, :total_orders, :total_revenue, :top_product_ids, NOW())
                ON DUPLICATE KEY UPDATE
                    totalOrders = VALUES(totalOrders),
                    totalRevenue = VALUES(totalRevenue),
                    topProductIds = VALUES(topProductIds),
                    generatedAt = NOW()
                """
            ),
            {
                "report_date": today,
                "total_orders": summary["total_orders"],
                "total_revenue": int(summary["total_revenue"]),
                "top_product_ids": json.dumps(top_product_ids),
            },
        )
        session.commit()

        return {
            "reportDate": str(today),
            "totalOrders": summary["total_orders"],
            "totalRevenue": int(summary["total_revenue"]),
            "topProductIds": top_product_ids,
        }
    finally:
        session.close()
