#!/usr/bin/env python3
import csv

# Read the CSV and generate UPDATE statements
updates = []
with open('user-uploads://report_api_with_net_prices_2025-11-06_22_00.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        package_id = row['Package Id'].strip()
        retail_price = row['Recommended retail price'].strip()
        type_field = row['Type'].strip()
        
        # Only update 'sim' type packages (not topups)
        if type_field == 'sim' and package_id and retail_price:
            updates.append(f"UPDATE products SET price_usd = {retail_price} WHERE airlo_package_id = '{package_id}';")

# Print all updates
for update in updates:
    print(update)

print(f"\n-- Total updates: {len(updates)}")
