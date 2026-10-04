"""Prepare the UCI Online Retail II dataset for the app.

Source: Chen, D. (2019). Online Retail II [Dataset]. UCI Machine Learning Repository.
        https://doi.org/10.24432/C5CG6D  (CC BY 4.0)
        Real transactions of a UK-based, registered non-store online retailer
        (mainly gift-ware, many wholesale customers), 01/12/2009 – 09/12/2011.

Usage:
    python scripts/prepare-online-retail.py path/to/online_retail_II.xlsx

Writes:
    src/data/transactions.csv   one row per order (invoice): date, customer, categories, units, revenue
    src/data/dataset-meta.json  provenance + cleaning audit trail

Requires pandas and openpyxl.
"""

import json
import re
import sys
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
OUT_CSV = ROOT / "src" / "data" / "transactions.csv"
OUT_META = ROOT / "src" / "data" / "dataset-meta.json"

# ---------------------------------------------------------------------------
# Product categories. The dataset has no category field, so categories are
# derived from product descriptions with ordered keyword rules (first match wins).
# ---------------------------------------------------------------------------
CATEGORY_RULES = [
    ("Seasonal & Party", r"CHRISTMAS|XMAS|ADVENT|EASTER|HALLOWEEN|VALENTINE|PARTY|BUNTING|BALLOON|CRACKER|BIRTHDAY|SNOWFLAKE|SANTA|REINDEER|NATIVITY|CONFETTI"),
    ("Kitchen & Dining", r"MUG|CUP|PLATE|BOWL|JUG|TEAPOT|TEA |TEACUP|CAKE|BAKING|KITCHEN|LUNCH ?BOX|NAPKIN|TRAY|BOTTLE|JAR|SPOON|CUTLERY|DISH|COASTER|APRON|OVEN GLOVE|CHOPSTICK|EGG |GLASS|TUMBLER|CAKESTAND|BISCUIT|PANTRY|SCALES|COOK|RECIPE|STRAW|PLACEMAT|TEA TOWEL|SUGAR|SAUCER"),
    ("Bags & Storage", r"BAG|STORAGE|BASKET|TOTE|PURSE|HOLDALL|SHOPPER|CRATE|DRAWER|TISSUE BOX|TRINKET BOX|SUITCASE|WICKER|HAMPER"),
    ("Stationery & Gift Wrap", r"CARD|WRAP|PAPER|NOTEBOOK|PENCIL|PEN |PENS|STICKER|ENVELOPE|TAPE|CALENDAR|BOOK|CHALK|ERASER|RUBBER|RIBBON|GIFT TAG|TAGS|DIARY|JOURNAL|STAMP|CRAYON|RULER|SHARPENER|MEMO|LETTER|ALBUM"),
    ("Toys & Kids", r"TOY|GAME|DOLL|CHILDREN|CHILDS|KIDS|PUZZLE|JIGSAW|SPACEBOY|SKIPPING|TEDDY|PLAYHOUSE|DOMINOES|SOLDIER|BABY|SPINNING TOP|MAGIC|CIRCUS|COLOURING|SNAKES|LADDERS|MARBLES|KITE|PAINT SET|BLOCK"),
    ("Garden & Outdoor", r"GARDEN|PLANT|BIRD|WATERING|PICNIC|PARASOL|HAMMOCK|FLOWER POT|POTTING|SEED|HERB|TROWEL|BEACH|BICYCLE|OUTDOOR|WINDMILL|HOT WATER BOTTLE|UMBRELLA"),
    ("Jewellery & Accessories", r"NECKLACE|BRACELET|EARRING|RING |HAIR|BROOCH|CHARM|JEWEL|SCARF|KEY ?RING|PHONE|GLOVES|HAT |SLIPPER|BEAD|DIAMANTE|COMPACT MIRROR|WALLET|PASSPORT"),
    ("Home Décor & Lighting", r"CANDLE|LIGHT|LANTERN|T-LIGHT|HOLDER|FRAME|CLOCK|MIRROR|CUSHION|DOORMAT|SIGN|HEART|DECORATION|VASE|ORNAMENT|WALL|PLAQUE|LAMP|HOOK|HANGING|BUNNY|CHANDELIER|DOORSTOP|THROW|QUILT|BLANKET|CURTAIN|COAT RACK|DRAWER KNOB|FEATHER|WREATH|GARLAND|CHIME|BELL|HANGER|SHELF|CABINET|PICTURE|PHOTO"),
]
FALLBACK_CATEGORY = "Other Gifts"
COMPILED = [(name, re.compile(pattern)) for name, pattern in CATEGORY_RULES]


def categorize(description: str) -> str:
    text = f" {str(description).upper()} "
    for name, pattern in COMPILED:
        if pattern.search(text):
            return name
    return FALLBACK_CATEGORY


EUROPE = {
    "EIRE", "Germany", "France", "Netherlands", "Spain", "Switzerland", "Belgium", "Portugal", "Italy",
    "Channel Islands", "Norway", "Sweden", "Finland", "Austria", "Denmark", "Cyprus", "Greece", "Poland",
    "Iceland", "Malta", "Lithuania", "Czech Republic", "European Community", "Lebanon",
}


def region(country: str) -> str:
    if country == "United Kingdom":
        return "United Kingdom"
    if country in EUROPE:
        return "Europe"
    return "Rest of World"


def main(xlsx_path: str) -> None:
    audit = []

    def log(step: str, frame: pd.DataFrame) -> None:
        audit.append({"step": step, "rows": int(len(frame))})
        print(f"{step:<58} {len(frame):>10,}")

    sheets = pd.read_excel(xlsx_path, sheet_name=None, dtype={"Invoice": str, "StockCode": str})
    first, second = list(sheets.values())
    raw = pd.concat([first, second], ignore_index=True)
    log("Raw line items (both yearly sheets)", raw)

    # 1. The two sheets overlap in early December 2010: keep each invoice once.
    second = second[~second["Invoice"].isin(set(first["Invoice"]))]
    df = pd.concat([first, second], ignore_index=True)
    log("Remove invoices duplicated across the two sheets", df)

    # 2. Customer-level analysis needs a customer identifier.
    df = df.dropna(subset=["Customer ID"]).copy()
    df["Customer ID"] = df["Customer ID"].astype(int).astype(str)
    log("Remove lines without a Customer ID", df)

    # 3. Cancellations: drop them, and also drop the purchase line each one reverses
    #    (same customer, product and quantity, most recent purchase before the cancellation).
    is_cancel = df["Invoice"].str.startswith("C")
    cancels = df[is_cancel]
    sales = df[~is_cancel].copy()
    sales = sales.sort_values("InvoiceDate")
    sales["_key"] = sales["Customer ID"] + "|" + sales["StockCode"] + "|" + sales["Quantity"].astype(str)
    reversed_idx = set()
    by_key = {k: list(g.index) for k, g in sales.groupby("_key", sort=False)}
    for _, c in cancels.sort_values("InvoiceDate").iterrows():
        key = f"{c['Customer ID']}|{c['StockCode']}|{-c['Quantity']}"
        for idx in reversed(by_key.get(key, [])):
            if idx not in reversed_idx and sales.at[idx, "InvoiceDate"] <= c["InvoiceDate"]:
                reversed_idx.add(idx)
                break
    df = sales.drop(index=list(reversed_idx)).drop(columns="_key")
    log("Remove cancellation lines", sales)
    log("Remove purchases reversed by a matching cancellation", df)

    # 4. Invalid quantities / prices.
    df = df[(df["Quantity"] > 0) & (df["Price"] > 0)]
    log("Remove non-positive quantity or price", df)

    # 5. Non-product lines: postage, fees, manual adjustments, vouchers, tests.
    df = df[df["StockCode"].str.match(r"^\d")]
    log("Remove non-product codes (postage, fees, adjustments, vouchers)", df)

    # 6. Derive category and region; aggregate to one row per order (invoice).
    #    Categories bought in the order are kept as a "|"-separated list.
    df = df.assign(
        category=df["Description"].map(categorize),
        region=df["Country"].map(region),
        revenue=df["Quantity"] * df["Price"],
        order_date=df["InvoiceDate"].dt.strftime("%Y-%m-%d"),
    )
    agg = (
        df.groupby(["Invoice", "Customer ID", "order_date", "region"], as_index=False)
        .agg(
            categories=("category", lambda c: "|".join(sorted(set(c)))),
            items=("Quantity", "sum"),
            revenue=("revenue", "sum"),
        )
        .sort_values(["order_date", "Invoice"])
    )
    out = pd.DataFrame(
        {
            "order_id": agg["Invoice"],
            "customer_id": agg["Customer ID"],
            "order_date": agg["order_date"],
            "categories": agg["categories"],
            "items": agg["items"],
            "revenue": agg["revenue"].round(2),
            "region": agg["region"],
        }
    )
    out.to_csv(OUT_CSV, index=False)

    category_share = (df.groupby("category")["revenue"].sum() / df["revenue"].sum()).sort_values(ascending=False)
    meta = {
        "name": "Online Retail II",
        "publisher": "UCI Machine Learning Repository",
        "citation": "Chen, D. (2019). Online Retail II [Dataset]. UCI Machine Learning Repository. https://doi.org/10.24432/C5CG6D",
        "url": "https://archive.ics.uci.edu/dataset/502/online+retail+ii",
        "license": "CC BY 4.0",
        "description": "Real transactions of a UK-based online gift-ware retailer (many customers are wholesalers).",
        "currency": "GBP",
        "rawLineItems": audit[0]["rows"],
        "cleanLineItems": int(len(df)),
        "outputRows": int(len(out)),
        "customers": int(out["customer_id"].nunique()),
        "orders": int(out["order_id"].nunique()),
        "cleaning": audit,
        "categories": sorted(df["category"].unique().tolist()),
        "categoryMethod": "Derived from product descriptions with ordered keyword rules (scripts/prepare-online-retail.py).",
        "categoryRevenueShare": {k: round(float(v), 4) for k, v in category_share.items()},
        "notes": [
            "No discount field exists in the source; revenue = quantity x unit price.",
            "Output is aggregated to one row per order (invoice); line-item detail is summarised as units and categories.",
        ],
    }
    OUT_META.write_text(json.dumps(meta, indent=2) + "\n")
    print(f"\nWrote {len(out):,} rows -> {OUT_CSV.relative_to(ROOT)} ({OUT_CSV.stat().st_size / 1e6:.1f} MB)")
    print("Category revenue share:")
    for k, v in category_share.items():
        print(f"  {k:<26} {v:6.1%}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit("Usage: python scripts/prepare-online-retail.py path/to/online_retail_II.xlsx")
    main(sys.argv[1])
