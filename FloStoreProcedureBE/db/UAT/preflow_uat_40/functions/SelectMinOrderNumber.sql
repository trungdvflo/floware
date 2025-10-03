CREATE FUNCTION `SelectMinOrderNumber`(user_id BIGINT(20)) RETURNS DOUBLE(13,3)
BEGIN
  --
  DECLARE minOrderNumber DOUBLE(13, 3);

   
  # Start of: main query
  SELECT MIN(c.order_number)
    INTO minOrderNumber
    FROM cloud c
    WHERE c.user_id = user_id;
  # END of: main query
  --
  RETURN minOrderNumber;
END