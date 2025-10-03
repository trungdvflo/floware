CREATE FUNCTION `cleanup_userTrackingApp`() RETURNS INT(1)
BEGIN
  --
  DECLARE nRETURN INT(11); 
  SET nRETURN = deduplicate_trackingApp();
  SET nRETURN = deduplicate_userTrackingApp();
  --
  RETURN 1;
END