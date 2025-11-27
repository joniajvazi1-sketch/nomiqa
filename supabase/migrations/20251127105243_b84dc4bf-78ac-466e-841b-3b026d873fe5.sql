-- Ensure the trigger is properly attached to the affiliates table
DROP TRIGGER IF EXISTS update_affiliate_tier_trigger ON affiliates;

CREATE TRIGGER update_affiliate_tier_trigger
  BEFORE INSERT OR UPDATE OF total_conversions
  ON affiliates
  FOR EACH ROW
  EXECUTE FUNCTION update_affiliate_tier();

-- Recalculate tier levels for all existing affiliates based on their current conversions
UPDATE affiliates
SET tier_level = CASE
  WHEN total_conversions < 10 THEN 1
  WHEN total_conversions < 30 THEN 2
  ELSE 3
END,
updated_at = now()
WHERE tier_level != CASE
  WHEN total_conversions < 10 THEN 1
  WHEN total_conversions < 30 THEN 2
  ELSE 3
END;