#!/usr/bin/env python3
import csv

# Read CSV and generate SQL
with open('user-uploads://report_api_with_net_prices_2025-11-06_22_00_no_topups.csv', 'r') as f:
    reader = csv.DictReader(f)
    
    updates = []
    for row in reader:
        package_id = row['Package Id'].strip()
        price = row['Recommended retail price'].strip()
        
        if package_id and price:
            updates.append(f"UPDATE products SET price_usd = {price} WHERE airlo_package_id = '{package_id}';")
    
    # Split into batches of 100
    batch_size = 100
    for i in range(0, len(updates), batch_size):
        batch = updates[i:i+batch_size]
        print(f"\n-- Batch {i//batch_size + 1} ({len(batch)} updates)")
        print('\n'.join(batch))
    
    print(f"\n-- Total: {len(updates)} products")
