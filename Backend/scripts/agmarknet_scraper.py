#!/usr/bin/env python3
"""Agmarknet 2.0 data scraper (API-based).

Run with the root .venv, for example:
  .venv/bin/python Backend/agmarknet_scraper.py --state "Maharashtra" --commodity "Onion" --months 12
"""

from __future__ import annotations

import argparse
import csv
import datetime as dt
import json
import logging
import os
import re
import sys
import time
from typing import Dict, Iterable, List, Optional, Tuple

import requests

BASE_URL = "https://api.agmarknet.gov.in/v1"
DEFAULT_UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("agmarknet_scraper.log"),
    ],
)
logger = logging.getLogger(__name__)


def _session() -> requests.Session:
    session = requests.Session()
    session.headers.update({
        "User-Agent": DEFAULT_UA,
        "Accept": "application/json",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://agmarknet.gov.in/",
    })
    return session


def _retry_get(session: requests.Session, url: str, max_retries: int = 3, **kwargs) -> requests.Response:
    """Retry GET with exponential backoff."""
    for attempt in range(max_retries):
        try:
            logger.debug(f"GET {url} (attempt {attempt+1}/{max_retries})")
            resp = session.get(url, timeout=30, **kwargs)
            resp.raise_for_status()
            return resp
        except requests.exceptions.RequestException as e:
            if attempt == max_retries - 1:
                logger.error(f"Failed after {max_retries} retries: {e}")
                raise
            wait = 2 ** attempt + 1
            logger.warning(f"Retry {attempt+1}/{max_retries} after {wait}s: {e}")
            time.sleep(wait)


def _parse_month(value: str) -> dt.date:
    try:
        year_str, month_str = value.split("-")
        return dt.date(int(year_str), int(month_str), 1)
    except Exception as exc:
        raise argparse.ArgumentTypeError("Month must be in YYYY-MM format") from exc


def _add_months(date: dt.date, delta: int) -> dt.date:
    year = date.year + (date.month - 1 + delta) // 12
    month = (date.month - 1 + delta) % 12 + 1
    return dt.date(year, month, 1)


def _iter_months(start: dt.date, end: dt.date) -> Iterable[Tuple[int, int]]:
    current = dt.date(start.year, start.month, 1)
    last = dt.date(end.year, end.month, 1)
    while current <= last:
        yield current.year, current.month
        current = _add_months(current, 1)


def _slug(value: str) -> str:
    value = value.strip().lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-") or "value"


def _get_states(session: requests.Session) -> List[Dict]:
    states: List[Dict] = []
    url: Optional[str] = f"{BASE_URL}/location/state"
    while url:
        try:
            resp = _retry_get(session, url)
            payload = resp.json()
            states.extend(payload.get("states", []))
            logger.info(f"Fetched {len(states)} states so far")
            url = payload.get("pagination", {}).get("next_page")
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to fetch states: {e}")
            break
    logger.info(f"Total states fetched: {len(states)}")
    return states


def _get_commodities(session: requests.Session) -> List[Dict]:
    try:
        logger.info("Fetching commodities filter...")
        resp = _retry_get(session, f"{BASE_URL}/dashboard-commodities-filter")
        payload = resp.json()
        commodities = payload.get("data", [])
        logger.info(f"Total commodities fetched: {len(commodities)}")
        return commodities
    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to fetch commodities: {e}")
        return []


def _normalize_group(name: str) -> str:
    return re.sub(r"\s+", " ", name or "").strip().lower()


def _is_real_commodity(item: Dict) -> bool:
    """Filter out placeholder commodities and meta-commodities."""
    try:
        item_id = int(item.get("id"))
    except Exception:
        return False
    # Exclude placeholder/meta commodity IDs
    if item_id in (0, 9999, 99999):
        return False
    status = item.get("status")
    if item_id <= 0:
        return False
    if status in ("N", 0, "0", None):
        return False
    return True


def _resolve_id(query: str, items: List[Dict], id_key: str, name_key: str) -> Tuple[int, str]:
    query = query.strip()
    if query.isdigit():
        item_id = int(query)
        for item in items:
            if int(item.get(id_key)) == item_id:
                return item_id, str(item.get(name_key, ""))
        return item_id, query

    lowered = query.lower()
    for item in items:
        name = str(item.get(name_key, ""))
        if name.lower() == lowered:
            return int(item.get(id_key)), name

    for item in items:
        name = str(item.get(name_key, ""))
        if lowered in name.lower():
            return int(item.get(id_key)), name

    raise ValueError(f"No match for '{query}' in {name_key} list")


def _fetch_month_data(
    session: requests.Session,
    year: int,
    month: int,
    state_id: int,
    commodity_id: int,
) -> Dict:
    params = {
        "year": year,
        "month": month,
        "stateId": state_id,
        "commodityId": commodity_id,
        "includeExcel": "false",
    }
    resp = _retry_get(
        session,
        f"{BASE_URL}/prices-and-arrivals/date-wise/specific-commodity",
        params=params,
    )
    return resp.json()


def _write_outputs(rows: List[Dict], json_path: str, csv_path: str) -> None:
    os.makedirs(os.path.dirname(json_path), exist_ok=True)

    with open(json_path, "w", encoding="utf-8") as jf:
        json.dump(rows, jf, ensure_ascii=False, indent=2)

    fieldnames: List[str] = []
    for row in rows:
        for key in row.keys():
            if key not in fieldnames:
                fieldnames.append(key)

    with open(csv_path, "w", encoding="utf-8", newline="") as cf:
        writer = csv.DictWriter(cf, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def run_scrape(
    *,
    state: Optional[str] = None,
    commodity: Optional[str] = None,
    start: Optional[dt.date] = None,
    end: Optional[dt.date] = None,
    months: int = 12,
    sleep: float = 0.25,
    out_dir: str = "Backend/data",
    all_states: bool = False,
    all_non_perishable: bool = False,
    exclude_groups: str = "Fruits,Vegetables,Flowers",
) -> int:
    today = dt.date.today().replace(day=1)
    if start and end:
        start_date = start
        end_date = end
    elif start and not end:
        start_date = start
        end_date = today
    else:
        start_date = _add_months(today, -(max(months, 1) - 1))
        end_date = today

    if start_date > end_date:
        raise ValueError("Start month must be before or equal to end month.")

    session = _session()
    states = _get_states(session)
    commodities = _get_commodities(session)

    if not all_states and not state:
        raise ValueError("state is required unless all_states is set.")
    if not all_non_perishable and not commodity:
        raise ValueError("commodity is required unless all_non_perishable is set.")

    state_targets: List[Tuple[int, str]] = []
    if all_states:
        for item in states:
            try:
                state_targets.append((int(item.get("id")), str(item.get("state_name", ""))))
            except Exception:
                continue
    else:
        state_id, state_name = _resolve_id(state, states, "id", "state_name")
        state_targets = [(state_id, state_name)]

    commodity_targets: List[Dict] = []
    if all_non_perishable:
        exclude = {_normalize_group(x) for x in exclude_groups.split(",") if x.strip()}
        for item in commodities:
            if not _is_real_commodity(item):
                continue
            group_name = _normalize_group(str(item.get("group_name", "")))
            if group_name in exclude:
                continue
            commodity_targets.append(item)
    else:
        commodity_id, commodity_name = _resolve_id(commodity, commodities, "id", "cmdt_name")
        for item in commodities:
            if int(item.get("id")) == commodity_id:
                commodity_targets = [item]
                break
        if not commodity_targets:
            commodity_targets = [
                {
                    "id": commodity_id,
                    "cmdt_name": commodity_name,
                    "group_id": None,
                    "group_name": "",
                }
            ]

    rows: List[Dict] = []
    total_requests = len(state_targets) * len(commodity_targets) * len(list(_iter_months(start_date, end_date)))
    current_request = 0
    
    for state_id, state_name in state_targets:
        logger.info(f"Processing state: {state_name} ({state_id})")
        for commodity_item in commodity_targets:
            commodity_id = int(commodity_item.get("id"))
            commodity_name = str(commodity_item.get("cmdt_name", ""))
            commodity_group_id = commodity_item.get("group_id")
            commodity_group_name = str(commodity_item.get("group_name", ""))
            
            logger.info(f"  Processing commodity: {commodity_name} ({commodity_id})")

            for year, month in _iter_months(start_date, end_date):
                current_request += 1
                try:
                    logger.debug(f"    Fetching {year}-{month:02d} ({current_request}/{total_requests})")
                    payload = _fetch_month_data(session, year, month, state_id, commodity_id)
                    markets = payload.get("markets", []) or []
                    for entry in markets:
                        row = {
                            "year": year,
                            "month": month,
                            "state_id": state_id,
                            "state_name": state_name,
                            "commodity_id": commodity_id,
                            "commodity_name": commodity_name,
                            "commodity_group_id": commodity_group_id,
                            "commodity_group_name": commodity_group_name,
                        }
                        if isinstance(entry, dict):
                            row.update(entry)
                        rows.append(row)
                    if markets:
                        logger.info(f"    Found {len(markets)} market entries for {year}-{month:02d}")
                except requests.exceptions.RequestException as e:
                    logger.warning(f"    Failed to fetch {commodity_name} ({commodity_id}) for {state_name} ({state_id}) in {year}-{month:02d}: {e}")
                    continue
                time.sleep(max(sleep, 0))

    slug_state = "all-states" if all_states else _slug(state_targets[0][1])
    slug_commodity = "all-non-perishable" if all_non_perishable else _slug(str(commodity_targets[0].get("cmdt_name", "")))
    range_tag = f"{start_date.year:04d}-{start_date.month:02d}_to_{end_date.year:04d}-{end_date.month:02d}"
    base = f"agmarknet_{slug_state}_{slug_commodity}_{range_tag}"
    json_path = os.path.join(out_dir, f"{base}.json")
    csv_path = os.path.join(out_dir, f"{base}.csv")

    logger.info(f"Writing {len(rows)} rows to output files...")
    _write_outputs(rows, json_path, csv_path)

    logger.info(f"✓ Saved {len(rows)} rows")
    logger.info(f"✓ JSON: {json_path}")
    logger.info(f"✓ CSV:  {csv_path}")
    logger.info(f"✓ Log file: agmarknet_scraper.log")
    return 0


def run_non_perishable() -> int:
    logger.info("Starting non-perishable commodity scrape...")
    result = run_scrape(
        all_states=True,
        all_non_perishable=True,
        months=12,
        exclude_groups="Fruits,Vegetables,Flowers",
        out_dir="Backend/data",
    )
    logger.info("Scrape completed!")
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description="Scrape Agmarknet prices/arrivals for at least 1 year.")
    parser.add_argument("--state", help="State name or ID")
    parser.add_argument("--commodity", help="Commodity name or ID")
    parser.add_argument("--start", type=_parse_month, help="Start month (YYYY-MM)")
    parser.add_argument("--end", type=_parse_month, help="End month (YYYY-MM)")
    parser.add_argument("--months", type=int, default=12, help="Months back from current month (default: 12)")
    parser.add_argument("--sleep", type=float, default=0.25, help="Delay between API calls in seconds")
    parser.add_argument("--out-dir", default="Backend/data", help="Output directory")
    parser.add_argument("--all-states", action="store_true", help="Fetch data for all states")
    parser.add_argument(
        "--all-non-perishable",
        action="store_true",
        help="Fetch data for all non-perishable commodities (excludes groups listed in --exclude-groups)",
    )
    parser.add_argument(
        "--exclude-groups",
        default="Fruits,Vegetables,Flowers",
        help="Comma-separated commodity groups to exclude (default: Fruits,Vegetables,Flowers)",
    )
    args = parser.parse_args()

    try:
        return run_scrape(
            state=args.state,
            commodity=args.commodity,
            start=args.start,
            end=args.end,
            months=args.months,
            sleep=args.sleep,
            out_dir=args.out_dir,
            all_states=args.all_states,
            all_non_perishable=args.all_non_perishable,
            exclude_groups=args.exclude_groups,
        )
    except ValueError as exc:
        parser.error(str(exc))
        return 2


if __name__ == "__main__":
    sys.exit(main())
