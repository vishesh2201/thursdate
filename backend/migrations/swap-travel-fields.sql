-- Swap favourite_travel_destination and last_holiday_places functionality
-- favourite_travel_destination: VARCHAR(100) -> TEXT (for JSON array with 3+ items)
-- last_holiday_places: TEXT (array) -> VARCHAR(255) (single string)

-- Step 1: Create temporary columns
ALTER TABLE users 
ADD COLUMN temp_favourite_travel_destination TEXT,
ADD COLUMN temp_last_holiday_places VARCHAR(255);

-- Step 2: Migrate data with swap
-- Convert single string favouriteTravelDestination to JSON array
UPDATE users 
SET temp_favourite_travel_destination = CASE 
    WHEN favourite_travel_destination IS NOT NULL AND favourite_travel_destination != '' 
    THEN CONCAT('[{"name":"', REPLACE(favourite_travel_destination, '"', '\\"'), '","details":"","id":', UNIX_TIMESTAMP(), '}]')
    ELSE '[]'
END;

-- Extract first item from lastHolidayPlaces array to single string
UPDATE users 
SET temp_last_holiday_places = CASE
    WHEN last_holiday_places IS NOT NULL AND last_holiday_places != '[]'
    THEN JSON_UNQUOTE(JSON_EXTRACT(last_holiday_places, '$[0].name'))
    ELSE NULL
END;

-- Step 3: Drop old columns
ALTER TABLE users 
DROP COLUMN favourite_travel_destination,
DROP COLUMN last_holiday_places;

-- Step 4: Rename temp columns
ALTER TABLE users 
CHANGE COLUMN temp_favourite_travel_destination favourite_travel_destination TEXT,
CHANGE COLUMN temp_last_holiday_places last_holiday_places VARCHAR(255);
