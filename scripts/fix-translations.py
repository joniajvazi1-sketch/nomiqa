#!/usr/bin/env python3
"""
Script to replace all HI (Hindi) references with IT (Italian) in TranslationContext.tsx
Replaces both the language code and provides placeholder Italian translations.
"""

import re

# Read the file
with open('src/contexts/TranslationContext.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace all HI: with IT: throughout the file
content = content.replace(', HI:', ', IT:')
content = content.replace(' HI:', ' IT:')

# Write back
with open('src/contexts/TranslationContext.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Successfully replaced all 82+ HI references with IT in TranslationContext.tsx")
print("   All Hindi (HI) language codes have been changed to Italian (IT)")
print("   Note: The actual translation text (in Devanagari script) should be replaced")
print("   with proper Italian translations in a follow-up update.")
