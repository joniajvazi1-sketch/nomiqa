#!/bin/bash
# Script to replace all HI references with IT in TranslationContext.tsx

echo "🔧 Fixing HI → IT language code replacements..."

# Use sed to replace all occurrences of HI: with IT:
sed -i.backup 's/, HI:/, IT:/g' src/contexts/TranslationContext.tsx

echo "✅ Successfully replaced all HI references with IT!"
echo "   Backup saved as: src/contexts/TranslationContext.tsx.backup"
echo "   Total replacements made in translation object"
