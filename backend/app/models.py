from sqlalchemy import Column, Integer, String, Text, Float, DateTime
from sqlalchemy.sql import func
from app.database import Base


# -------------------------
# 1️⃣ Raw Reviews Table
# -------------------------
class ReviewRaw(Base):
    __tablename__ = "reviews_raw"

    id = Column(Integer, primary_key=True, index=True)
    product_name = Column(String, nullable=False)
    brand = Column(String, nullable=False)
    category = Column(String, nullable=False)
    review_text = Column(Text, nullable=False)
    rating = Column(Float, nullable=True)
    source = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# -------------------------
# 2️⃣ Reddit Raw Data
# -------------------------
class RedditRaw(Base):
    __tablename__ = "reddit_raw"

    id = Column(Integer, primary_key=True, index=True)
    subreddit = Column(String, nullable=False)
    title = Column(String, nullable=False)
    post_text = Column(Text, nullable=False)
    upvotes = Column(Integer, nullable=True)
    keyword_detected = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# -------------------------
# 3️⃣ Google Trends Data
# -------------------------
class TrendRaw(Base):
    __tablename__ = "trends_raw"

    id = Column(Integer, primary_key=True, index=True)
    keyword = Column(String, nullable=False)
    search_volume = Column(Integer, nullable=True)
    growth_percent = Column(Float, nullable=True)
    timeframe = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# -------------------------
# 4️⃣ Competition Products
# -------------------------
class CompetitionProduct(Base):
    __tablename__ = "competition_products"

    id = Column(Integer, primary_key=True, index=True)
    product_name = Column(String, nullable=False)
    brand = Column(String, nullable=False)
    category = Column(String, nullable=False)
    format = Column(String, nullable=False)
    price = Column(Float, nullable=True)
    ingredient_focus = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# -------------------------
# 5️⃣ Opportunity Clusters (Processed Intelligence)
# -------------------------
class OpportunityCluster(Base):
    __tablename__ = "opportunity_clusters"

    id = Column(Integer, primary_key=True, index=True)
    theme = Column(String, nullable=False)
    complaint_intensity = Column(Float, nullable=False)
    search_growth = Column(Float, nullable=False)
    reddit_mentions = Column(Integer, nullable=False)
    competition_density = Column(Integer, nullable=False)
    opportunity_score = Column(Float, nullable=False)
    tier = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# -------------------------
# 6️⃣ Final Product Concepts
# -------------------------
class ProductConcept(Base):
    __tablename__ = "product_concepts"

    id = Column(Integer, primary_key=True, index=True)
    product_name = Column(String, nullable=False)
    persona = Column(String, nullable=False)
    format = Column(String, nullable=False)
    ingredient_direction = Column(Text, nullable=False)
    price_range = Column(String, nullable=False)
    positioning = Column(Text, nullable=False)
    supporting_data = Column(Text, nullable=False)
    opportunity_score = Column(Float, nullable=False)
    brand_fit_score = Column(Float, nullable=False)
    tier = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
