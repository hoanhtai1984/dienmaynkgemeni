"""Precomputes 'related products' per product: same subcategory first, topped up
with same-category siblings when the subcategory alone has too few products (or
none, when the product has no subcategory), ranked by sold, self excluded.
Written to ProductRecommendation so Node only ever reads, never computes this live.
"""

import json

from sqlalchemy import bindparam, text

from ..db import SessionLocal

TOP_N = 40


def run():
    session = SessionLocal()
    try:
        products = session.execute(
            text("SELECT id, categoryId, subCategoryId FROM `Product`")
        ).mappings().all()

        updated = 0
        for product in products:
            recommended_ids = []
            seen = {product["id"]}

            if product["subCategoryId"] is not None:
                rows = session.execute(
                    text(
                        """
                        SELECT id FROM `Product`
                        WHERE subCategoryId = :sub_category_id AND id != :id
                        ORDER BY sold DESC
                        LIMIT :limit
                        """
                    ),
                    {"sub_category_id": product["subCategoryId"], "id": product["id"], "limit": TOP_N},
                ).mappings().all()
                for row in rows:
                    recommended_ids.append(row["id"])
                    seen.add(row["id"])

            # Top up with same-category siblings when the subcategory alone
            # doesn't have enough products (or the product has no subcategory).
            if len(recommended_ids) < TOP_N:
                remaining = TOP_N - len(recommended_ids)
                rows = session.execute(
                    text(
                        """
                        SELECT id FROM `Product`
                        WHERE categoryId = :category_id AND id NOT IN :seen
                        ORDER BY sold DESC
                        LIMIT :limit
                        """
                    ).bindparams(bindparam("seen", expanding=True)),
                    {"category_id": product["categoryId"], "seen": list(seen), "limit": remaining},
                ).mappings().all()
                for row in rows:
                    recommended_ids.append(row["id"])

            session.execute(
                text(
                    """
                    INSERT INTO `ProductRecommendation` (sourceProductId, recommendedIds, updatedAt)
                    VALUES (:source_id, :recommended_ids, NOW())
                    ON DUPLICATE KEY UPDATE
                        recommendedIds = VALUES(recommendedIds),
                        updatedAt = NOW()
                    """
                ),
                {"source_id": product["id"], "recommended_ids": json.dumps(recommended_ids)},
            )
            updated += 1

        session.commit()
        return {"productsProcessed": updated}
    finally:
        session.close()
