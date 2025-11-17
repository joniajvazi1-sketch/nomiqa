#!/usr/bin/env python3
"""
Script to replace all HI (Hindi) references with IT (Italian) in TranslationContext.tsx
"""

import re

# Read the file
with open('src/contexts/TranslationContext.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace HI: with IT: (keeping the translation text for now, will update manually)
content = content.replace(', HI:', ', IT:')
content = content.replace('HI:', 'IT:')

# Write back
with open('src/contexts/TranslationContext.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Successfully replaced all HI references with IT in TranslationContext.tsx")
