CREATE VIRTUAL TABLE IF NOT EXISTS `products_fts`
USING fts5(`name`, `description`, content='products', content_rowid='rowid');
--> statement-breakpoint
INSERT INTO `products_fts` (`rowid`, `name`, `description`)
SELECT p.rowid, p.name, p.description
FROM `products` p
WHERE p.`deleted_at` IS NULL
AND NOT EXISTS (
  SELECT 1
  FROM `products_fts` f
  WHERE f.`rowid` = p.`rowid`
);
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS `products_ai`
AFTER INSERT ON `products`
WHEN NEW.`deleted_at` IS NULL
BEGIN
  INSERT INTO `products_fts` (`rowid`, `name`, `description`)
  VALUES (NEW.rowid, NEW.`name`, NEW.`description`);
END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS `products_ad`
AFTER DELETE ON `products`
BEGIN
  DELETE FROM `products_fts` WHERE `rowid` = OLD.rowid;
END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS `products_au`
AFTER UPDATE ON `products`
BEGIN
  DELETE FROM `products_fts` WHERE `rowid` = OLD.rowid;

  INSERT INTO `products_fts` (`rowid`, `name`, `description`)
  SELECT NEW.rowid, NEW.`name`, NEW.`description`
  WHERE NEW.`deleted_at` IS NULL;
END;
