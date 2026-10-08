-- Per-theme legend of difficulty levels, shown in the admin topic panel.
-- Lazy-applied by getAdminThemes(); safe to run manually once.
-- Every theme with an empty legend gets the same starting text. Edits stay per theme.

ALTER TABLE themes
  ADD COLUMN difficulty_guide TEXT NULL;

UPDATE themes
SET difficulty_guide = '1. Додавання однозначних чисел.
2. Додавання та віднімання чисел в межах 10.
3. Множення чисел в межах 10.
4. Додавання та віднімання чисел в межах 100 (таблиця додавання/віднімання)
5. Множення однозначних чисел між собою (таблиця множення/ділення однозначних чисел).
6. Операції із числами в межах 1000.
7. Ділення чисел на числа типу 10,100,1000,10000 із утворенням десяткових дробів.'
WHERE difficulty_guide IS NULL;
