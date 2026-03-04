import pandas as pd
from app.database import SessionLocal
from app import models


def load_reviews(file_path):
    df = pd.read_csv(file_path)
    db = SessionLocal()

    for _, row in df.iterrows():
        review = models.ReviewRaw(
            product_name=row["product_name"],
            brand=row["brand"],
            category=row["category"],
            review_text=row["review_text"],
            rating=row.get("rating", None),
            source=row["source"]
        )
        db.add(review)

    db.commit()
    db.close()
    print("✅ Reviews loaded successfully")


def load_reddit(file_path):
    df = pd.read_csv(file_path)
    db = SessionLocal()

    for _, row in df.iterrows():
        reddit = models.RedditRaw(
            subreddit=row["subreddit"],
            title=row["title"],
            post_text=row["post_text"],
            upvotes=row.get("upvotes", None),
            keyword_detected=row.get("keyword_detected", None)
        )
        db.add(reddit)

    db.commit()
    db.close()
    print("✅ Reddit data loaded successfully")


def load_trends(file_path):
    df = pd.read_csv(file_path)
    db = SessionLocal()

    for _, row in df.iterrows():
        trend = models.TrendRaw(
            keyword=row["keyword"],
            search_volume=row.get("search_volume", None),
            growth_percent=row.get("growth_percent", None),
            timeframe=row.get("timeframe", None)
        )
        db.add(trend)

    db.commit()
    db.close()
    print("✅ Trends loaded successfully")


def load_competition(file_path):
    df = pd.read_csv(file_path)
    db = SessionLocal()

    for _, row in df.iterrows():
        product = models.CompetitionProduct(
            product_name=row["product_name"],
            brand=row["brand"],
            category=row["category"],
            format=row["format"],
            price=row.get("price", None),
            ingredient_focus=row.get("ingredient_focus", None)
        )
        db.add(product)

    db.commit()
    db.close()
    print("✅ Competition data loaded successfully")


if __name__ == "__main__":
    load_reviews("data/reviews.csv")
    load_reddit("data/reddit.csv")
    load_trends("data/trends.csv")
    load_competition("data/competition.csv")
