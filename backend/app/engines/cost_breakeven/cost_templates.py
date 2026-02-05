# Default cost templates for crops/regions
# This can be replaced with DB queries in production

def get_default_costs(commodity: str, region: str = None):
    # Example: hardcoded for demo, should be loaded from DB or config
    templates = {
        'wheat': [
            {'category': 'Seeds', 'amount': 2000},
            {'category': 'Fertilizer', 'amount': 3000},
            {'category': 'Labor', 'amount': 2500},
            {'category': 'Water', 'amount': 1000},
            {'category': 'Pesticide', 'amount': 800},
        ],
        'rice': [
            {'category': 'Seeds', 'amount': 2500},
            {'category': 'Fertilizer', 'amount': 3500},
            {'category': 'Labor', 'amount': 3000},
            {'category': 'Water', 'amount': 1500},
            {'category': 'Pesticide', 'amount': 1000},
        ]
    }
    return templates.get(commodity.lower(), [])
