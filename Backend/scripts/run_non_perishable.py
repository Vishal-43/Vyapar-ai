#!/usr/bin/env python3
"""Run a non-perishable, all-states fetch with no CLI arguments."""

from __future__ import annotations

import os
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
if SCRIPT_DIR not in sys.path:
    sys.path.insert(0, SCRIPT_DIR)

from agmarknet_scraper import run_non_perishable


if __name__ == "__main__":
    sys.exit(run_non_perishable())
