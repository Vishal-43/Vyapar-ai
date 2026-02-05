from __future__ import annotations

import datetime as dt
import json
import os
from typing import Any, Dict, List, Optional

import flask
import joblib
import pandas as pd
import requests

app = flask.Flask("agritech")

BASE_URL = "https://api.agmarknet.gov.in/v1"
DEFAULT_HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
    "Accept": "application/json",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://agmarknet.gov.in/",
}

_model_cache: Optional[Any] = None


def _session() -> requests.Session:
    session = requests.Session()
    session.headers.update(DEFAULT_HEADERS)
    return session


def _retry_get(session: requests.Session, url: str, max_retries: int = 3, **kwargs) -> requests.Response:
    for attempt in range(max_retries):
        try:
            resp = session.get(url, timeout=30, **kwargs)
            resp.raise_for_status()
            return resp
        except requests.exceptions.RequestException:
            if attempt == max_retries - 1:
                raise
    raise RuntimeError("Failed to fetch after retries")


def _fetch_states(session: requests.Session) -> List[Dict[str, Any]]:
    states: List[Dict[str, Any]] = []
    url: Optional[str] = f"{BASE_URL}/location/state"
    while url:
        resp = _retry_get(session, url)
        payload = resp.json()
        states.extend(payload.get("states", []))
        url = payload.get("pagination", {}).get("next_page")
    return states


def _fetch_commodities(session: requests.Session) -> List[Dict[str, Any]]:
    resp = _retry_get(session, f"{BASE_URL}/dashboard-commodities-filter")
    payload = resp.json()
    return payload.get("data", [])


def _fetch_location_filters(session: requests.Session, state_id: Optional[str], district_id: Optional[str]) -> Dict[str, Any]:
    params = {}
    if state_id:
        params["state_id"] = state_id
    if district_id:
        params["district_id"] = district_id
    resp = _retry_get(session, f"{BASE_URL}/guest-location-filters", params=params)
    return resp.json()


def _load_model() -> Any:
    global _model_cache
    if _model_cache is None:
        model_path = os.path.join(os.path.dirname(__file__), "..", "models", "ensemble_model.joblib")
        model_path = os.path.abspath(model_path)
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model not found at {model_path}")
        _model_cache = joblib.load(model_path)
    return _model_cache


@app.route("/")
def home():
    return "welcome to agritech backend!"


@app.route("/states", methods=["GET"])
def states():
    session = _session()
    data = _fetch_states(session)
    return flask.jsonify({"states": data})


@app.route("/cities", methods=["GET"])
def cities():
    state_id = flask.request.args.get("state_id")
    session = _session()
    payload = _fetch_location_filters(session, state_id, None)
    return flask.jsonify(payload)


@app.route("/markets", methods=["GET"])
def markets():
    state_id = flask.request.args.get("state_id")
    district_id = flask.request.args.get("district_id")
    session = _session()
    payload = _fetch_location_filters(session, state_id, district_id)
    return flask.jsonify(payload)


@app.route("/commodities", methods=["GET"])
def commodities():
    session = _session()
    data = _fetch_commodities(session)
    return flask.jsonify({"commodities": data})


@app.route("/categories", methods=["GET"])
def categories():
    session = _session()
    commodities = _fetch_commodities(session)
    groups = {}
    for item in commodities:
        group_id = item.get("group_id")
        group_name = item.get("group_name")
        if group_id is not None:
            groups[str(group_id)] = group_name
    categories = [{"id": k, "name": v} for k, v in groups.items()]
    return flask.jsonify({"categories": categories})


@app.route("/fetch", methods=["GET"])
def fetch_historical():
    """Fetch historical data for a commodity and market for 1w/1m/3m."""
    commodity_id = flask.request.args.get("commodity_id")
    state_id = flask.request.args.get("state_id")
    market_name = flask.request.args.get("market")
    period = flask.request.args.get("period", "1m")  # 1w | 1m | 3m

    if not commodity_id or not state_id:
        return flask.jsonify({"error": "commodity_id and state_id are required"}), 400

    today = dt.date.today()
    if period == "1w":
        start_date = today - dt.timedelta(days=7)
    elif period == "3m":
        start_date = today - dt.timedelta(days=90)
    else:
        start_date = today - dt.timedelta(days=30)

    session = _session()

    results: List[Dict[str, Any]] = []
    current = dt.date(start_date.year, start_date.month, 1)
    end_month = dt.date(today.year, today.month, 1)
    while current <= end_month:
        params = {
            "year": current.year,
            "month": current.month,
            "stateId": state_id,
            "commodityId": commodity_id,
            "includeExcel": "false",
        }
        resp = _retry_get(session, f"{BASE_URL}/prices-and-arrivals/date-wise/specific-commodity", params=params)
        payload = resp.json()
        markets = payload.get("markets", []) or []
        for row in markets:
            if not isinstance(row, dict):
                continue
            arrival_date = row.get("arrivalDate")
            if arrival_date:
                try:
                    date_val = dt.datetime.strptime(arrival_date, "%Y-%m-%d").date()
                except Exception:
                    date_val = None
            else:
                date_val = None

            if date_val and date_val < start_date:
                continue

            if market_name:
                market_field = row.get("market") or row.get("marketName") or row.get("market_name")
                if not market_field or market_name.lower() not in str(market_field).lower():
                    continue

            results.append(row)

        # increment month
        if current.month == 12:
            current = dt.date(current.year + 1, 1, 1)
        else:
            current = dt.date(current.year, current.month + 1, 1)

    return flask.jsonify({"count": len(results), "data": results})


@app.route("/predict", methods=["POST"])
def predict():
    """Predict prices using the trained ensemble model.

    Expects JSON payload with a list of records under 'records'.
    Optional: 'horizon' ("1m" or "3m") for labeling only.
    """
    payload = flask.request.get_json(silent=True) or {}
    records = payload.get("records")
    horizon = payload.get("horizon", "1m")

    if not isinstance(records, list) or not records:
        return flask.jsonify({"error": "records must be a non-empty list"}), 400

    model = _load_model()
    df = pd.DataFrame(records)
    preds = model.predict(df)
    return flask.jsonify({
        "horizon": horizon,
        "predictions": [float(x) for x in preds],
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)