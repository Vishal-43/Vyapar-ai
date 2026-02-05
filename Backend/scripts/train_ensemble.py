from __future__ import annotations

import argparse
import glob
import json
import os
from dataclasses import dataclass
from typing import List, Tuple

import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import ExtraTreesRegressor, GradientBoostingRegressor, RandomForestRegressor, VotingRegressor
from sklearn.impute import SimpleImputer
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder


@dataclass
class TrainConfig:
    data_path: str
    target: str
    test_size: float
    random_state: int
    model_dir: str


def _latest_csv(data_dir: str) -> str:
    pattern = os.path.join(data_dir, "*.csv")
    files = glob.glob(pattern)
    if not files:
        raise FileNotFoundError(f"No CSV files found in {data_dir}")
    files.sort(key=os.path.getmtime, reverse=True)
    return files[0]


def _prepare_data(df: pd.DataFrame, target: str) -> Tuple[pd.DataFrame, pd.Series]:
    if target not in df.columns:
        raise ValueError(f"Target '{target}' not found in columns: {list(df.columns)}")

    # Basic cleaning
    df = df.copy()
    # Convert arrivalDate to datetime if present
    if "arrivalDate" in df.columns:
        df["arrivalDate"] = pd.to_datetime(df["arrivalDate"], errors="coerce")
        df["arrival_year"] = df["arrivalDate"].dt.year
        df["arrival_month"] = df["arrivalDate"].dt.month
        df["arrival_day"] = df["arrivalDate"].dt.day
        df = df.drop(columns=["arrivalDate"])

    y = df[target]
    X = df.drop(columns=[target])
    return X, y


def _build_pipeline(X: pd.DataFrame) -> Pipeline:
    numeric_cols = X.select_dtypes(include=["int64", "float64"]).columns.tolist()
    categorical_cols = [c for c in X.columns if c not in numeric_cols]

    numeric_transformer = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
        ]
    )

    categorical_transformer = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("onehot", OneHotEncoder(handle_unknown="ignore")),
        ]
    )

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", numeric_transformer, numeric_cols),
            ("cat", categorical_transformer, categorical_cols),
        ]
    )

    model = VotingRegressor(
        estimators=[
            ("rf", RandomForestRegressor(n_estimators=200, random_state=42, n_jobs=-1)),
            ("gbr", GradientBoostingRegressor(random_state=42)),
            ("etr", ExtraTreesRegressor(n_estimators=300, random_state=42, n_jobs=-1)),
        ]
    )

    return Pipeline(steps=[("preprocess", preprocessor), ("model", model)])


def _evaluate(y_true, y_pred) -> dict:
    return {
        "mae": float(mean_absolute_error(y_true, y_pred)),
        "rmse": float(mean_squared_error(y_true, y_pred, squared=False)),
        "r2": float(r2_score(y_true, y_pred)),
    }


def train(config: TrainConfig) -> None:
    df = pd.read_csv(config.data_path)
    X, y = _prepare_data(df, config.target)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=config.test_size, random_state=config.random_state
    )

    pipeline = _build_pipeline(X_train)
    pipeline.fit(X_train, y_train)

    preds = pipeline.predict(X_test)
    metrics = _evaluate(y_test, preds)

    os.makedirs(config.model_dir, exist_ok=True)
    model_path = os.path.join(config.model_dir, "ensemble_model.joblib")
    metrics_path = os.path.join(config.model_dir, "metrics.json")

    joblib.dump(pipeline, model_path)
    with open(metrics_path, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)

    print(f"Saved model: {model_path}")
    print(f"Saved metrics: {metrics_path}")
    print(f"Metrics: {metrics}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Train an ensemble regression model on Agmarknet data.")
    parser.add_argument("--data", help="Path to CSV data file. Defaults to latest CSV in Backend/data.")
    parser.add_argument("--target", default="modalPrice", help="Target column to predict.")
    parser.add_argument("--test-size", type=float, default=0.2, help="Test split fraction.")
    parser.add_argument("--random-state", type=int, default=42, help="Random seed.")
    parser.add_argument("--model-dir", default="Backend/models", help="Directory to save model and metrics.")
    args = parser.parse_args()

    data_path = args.data or _latest_csv("Backend/data")
    config = TrainConfig(
        data_path=data_path,
        target=args.target,
        test_size=args.test_size,
        random_state=args.random_state,
        model_dir=args.model_dir,
    )

    train(config)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
