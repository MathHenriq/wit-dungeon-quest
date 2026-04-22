-- Grant at least 10 free points to all existing characters so they can pick a starting skill.
UPDATE characters
SET free_points = 10
WHERE free_points < 10;
