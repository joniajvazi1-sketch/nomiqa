#!/usr/bin/env python3
import csv
import sys

# Read the CSV and generate UPDATE statements for ALL sim packages
updates = []
seen_packages = set()

with open('user-uploads://report_api_with_net_prices_2025-11-06_22_00.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        package_id = row['Package Id'].strip()
        retail_price = row['Recommended retail price'].strip()
        type_field = row['Type'].strip()
        country = row['Country Region'].strip()
        
        # Only process 'sim' type packages (not topups) and avoid duplicates
        if type_field == 'sim' and package_id and retail_price and package_id not in seen_packages:
            try:
                price = float(retail_price)
                updates.append({
                    'package_id': package_id,
                    'price': price,
                    'country': country
                })
                seen_packages.add(package_id)
            except ValueError:
                print(f"-- Skipping invalid price for {package_id}: {retail_price}", file=sys.stderr)

# Group by country for better organization
from collections import defaultdict
by_country = defaultdict(list)
for update in updates:
    by_country[update['country']].append(update)

# Print organized by country
for country in sorted(by_country.keys()):
    print(f"\n-- {country} ({len(by_country[country])} products)")
    for update in by_country[country]:
        print(f"UPDATE products SET price_usd = {update['price']} WHERE airlo_package_id = '{update['package_id']}';")

print(f"\n-- Total unique sim packages: {len(updates)}", file=sys.stderr)
print(f"-- Total countries: {len(by_country)}", file=sys.stderr)
