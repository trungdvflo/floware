CREATE PROCEDURE `f2023_collectInvalidLinks4User`(psSetResult   JSON  
                                                                    ,pvObjectUid   VARBINARY(1000)
                                                                    ,pvObjectType  VARBINARY(50)
                                                                    ,pnUserID      BIGINT(20)
                                                                    ,pvEmail       VARCHAR(255))
collect4User:BEGIN
  --
  DECLARE nRO        INT(11) DEFAULT ifnull(JSON_EXTRACT(psSetResult,'$.nRO'), -1);
  DECLARE nCH        INT(11) DEFAULT ifnull(JSON_EXTRACT(psSetResult,'$.nCH'), -1);
  DECLARE nKC        INT(11) DEFAULT ifnull(JSON_EXTRACT(psSetResult,'$.nKC'), -1);
  DECLARE nLCO       INT(11) DEFAULT ifnull(JSON_EXTRACT(psSetResult,'$.nLCO'), -1);
  DECLARE nLO        INT(11) DEFAULT ifnull(JSON_EXTRACT(psSetResult,'$.nLO'), -1);
  DECLARE nTC        INT(11) DEFAULT ifnull(JSON_EXTRACT(psSetResult,'$.nTC'), -1);
  DECLARE nSO        INT(11) DEFAULT ifnull(JSON_EXTRACT(psSetResult,'$.nSO'), -1);
  DECLARE nKB        INT(11) DEFAULT ifnull(JSON_EXTRACT(psSetResult,'$.nKB'), -1);
  DECLARE nCIM       INT(11) DEFAULT ifnull(JSON_EXTRACT(psSetResult,'$.nCIM'), -1);
  --
  DECLARE nMaxTurn   INT(4) DEFAULT 50;
  DECLARE nUserId    BIGINT(20) DEFAULT ifnull(pnUserID, 0);  
  DECLARE nID        BIGINT(20);  
  DECLARE vEmail     VARCHAR(255) DEFAULT ifnull(pvEmail, 'NA');
  DECLARE nCount     INT DEFAULT 0;
  DECLARE nFIL       INT DEFAULT 0;
  DECLARE nCSM       INT DEFAULT 0;
  --
  START TRANSACTION;
  --
  /* DECLARE
     EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
      DECLARE vMessage TEXT DEFAULT 'An error has occurred, operation rollbacked AND the STORED PROCEDURE was TERMINATED';
          GET DIAGNOSTICS CONDITION 1 vMessage = MESSAGE_TEXT;
      ROLLBACK;
      SELECT vMessage message;
      LEAVE collect4User;
   END;*/
  --
  IF nUserId = 0 THEN
    --
    IF vEmail = 'NA' THEN
      --
      SELECT nReturn;
      rollback;
      LEAVE collect4User;
      --
    END IF;
    --     
    SELECT u.id, ifnull(max(upil.id), 0)
      INTO nUserId, nID
      FROM `user` u
 LEFT JOIN user_process_invalid_link upil ON (u.id = upil.user_id)
     WHERE u.username = vEmail
      AND u.disabled  = 0 -- active userr only
    LIMIT 1;
    --
  END IF;
  -- 0. CREATE record TO monitor process IF NOT existed
  IF nID = 0 THEN 
    -- make sure record process existed
    SET nID = f2023_updateUserProcessInvalidData(NULL, nUserID, vEmail, 0, 0, NULL, NULL);
    --
  END IF;
  --
  -- 1. recent object
  IF nRO <> 0 THEN
    --
    SET nRO = 0;
    SET nRO = nRO + f2023_collectRecentObjectCalDAV                     ('RO', pvObjectUid, pvObjectType, nUserID, vEmail, nMaxTurn);
    SET nRO = nRO + f2023_collectRecentObjectCardDAV                    ('RO', pvObjectUid, pvObjectType, nUserID, vEmail, nMaxTurn);
    --
  END IF;
  --
  IF nCH <> 0 THEN
    SET nCH = 0;
    -- 2. contact history destination
    SET nCH = nCH + f2023_collectContactHistoryDestCalDAV               ('CH', pvObjectUid, pvObjectType, nUserID, vEmail, nMaxTurn);
    SET nCH = nCH + f2023_collectContactHistoryDestCardDAV              ('CH', pvObjectUid, pvObjectType, nUserID, vEmail, nMaxTurn);
    -- 3. contact history source 
    SET nCH = nCH + f2023_collectContactHistorySourceCalDAV             ('CH', pvObjectUid, pvObjectType, nUserID, vEmail, nMaxTurn);
    SET nCH = nCH + f2023_collectContactHistorySourceCardDAV            ('CH', pvObjectUid, pvObjectType, nUserID, vEmail, nMaxTurn);
    --
  END IF;
  --
  IF nKC <> 0 THEN
    -- 4. kanban card 
    SET nKC = 0;
    SET nKC = nKC + f2023_collectKanbanCardCalDAV                       ('KC', pvObjectUid, pvObjectType, nUserID, vEmail, nMaxTurn);
    SET nKC = nKC + f2023_collectKanbanCardCardDAV                      ('KC', pvObjectUid, pvObjectType, nUserID, vEmail, nMaxTurn);
    SET nKC = nKC + f2023_collectKanbanCardCloud                        ('KC', pvObjectUid, pvObjectType, nUserID, vEmail, nMaxTurn);
    SET nKC = nKC + f2023_collectKanbanCardURL                          ('KC', pvObjectUid, pvObjectType, nUserID, vEmail, nMaxTurn);
    SET nKC = nKC + f2023_collectKanbanCardShared                       ('KC', pvObjectUid, pvObjectType, nUserID, vEmail, nMaxTurn);
    --
  END IF;
  --
  IF nLCO <> 0 THEN
    -- 5. linked collection object
    SET nLCO = 0;
    SET nLCO = nLCO + f2023_collectLinkedCollectionObjectCalDAV         ('LCO', pvObjectUid, pvObjectType, nUserID, vEmail, nMaxTurn);
    SET nLCO = nLCO + f2023_collectLinkedCollectionObjectCardDAV        ('LCO', pvObjectUid, pvObjectType, nUserID, vEmail, nMaxTurn);
    SET nLCO = nLCO + f2023_collectLinkedCollectionObjectCloud          ('LCO', pvObjectUid, pvObjectType, nUserID, vEmail, nMaxTurn);
    SET nLCO = nLCO + f2023_collectLinkedCollectionObjectURL            ('LCO', pvObjectUid, pvObjectType, nUserID, vEmail, nMaxTurn);
    SET nLCO = nLCO + f2023_collectLinkedCollectionObjectShared         ('LCO', pvObjectUid, pvObjectType, nUserID, vEmail, nMaxTurn);
    --
  END IF;
  --
  IF nLO <> 0 THEN
    -- 6. linked object source
    SET nLO = 0;
    SET nLO = nLO + f2023_collectLinkedObjectSourceCardDAV              ('LO', pvObjectUid, pvObjectType, nUserID, vEmail, nMaxTurn);
    SET nLO = nLO + f2023_collectLinkedObjectSourceCalDAV               ('LO', pvObjectUid, pvObjectType, nUserID, vEmail, nMaxTurn);
    SET nLO = nLO + f2023_collectLinkedObjectSourceCloud                ('LO', pvObjectUid, pvObjectType, nUserID, vEmail, nMaxTurn);
    SET nLO = nLO + f2023_collectLinkedObjectSourceURL                  ('LO', pvObjectUid, pvObjectType, nUserID, vEmail, nMaxTurn);
    SET nLO = nLO + f2023_collectLinkedObjectSourceShared               ('LO', pvObjectUid, pvObjectType, nUserID, vEmail, nMaxTurn);
    SET nLO = nLO + f2023_collectLinkedObjectDestShared                 ('LO', pvObjectUid, pvObjectType, nUserID, vEmail, nMaxTurn);
    -- 7. linked object destination
    SET nLO = nLO + f2023_collectLinkedObjectDestCalDAV                 ('LO', pvObjectUid, pvObjectType, nUserID, vEmail, nMaxTurn);
    SET nLO = nLO + f2023_collectLinkedObjectDestCardDAV                ('LO', pvObjectUid, pvObjectType, nUserID, vEmail, nMaxTurn);
    SET nLO = nLO + f2023_collectLinkedObjectDestCloud                  ('LO', pvObjectUid, pvObjectType, nUserID, vEmail, nMaxTurn);
    SET nLO = nLO + f2023_collectLinkedObjectDestURL                    ('LO', pvObjectUid, pvObjectType, nUserID, vEmail, nMaxTurn);
    --
  END IF;
  --
  IF nTC <> 0 THEN
  -- 8. trash collection 
    SET nTC = 0;
    SET nTC = nTC + f2023_collectTrashCollectionCalDAV                  ('TC', pvObjectUid, pvObjectType, nUserID, vEmail, nMaxTurn);
    SET nTC = nTC + f2023_collectTrashCollectionCardDAV                 ('TC', pvObjectUid, pvObjectType, nUserID, vEmail, nMaxTurn);
    SET nTC = nTC + f2023_collectTrashCollectionCloud                   ('TC', pvObjectUid, pvObjectType, nUserID, vEmail, nMaxTurn);
    SET nTC = nTC + f2023_collectTrashCollectionURL                     ('TC', pvObjectUid, pvObjectType, nUserID, vEmail, nMaxTurn);
    --
  END IF;
  --
  IF nSO <> 0 THEN
  -- 9. sort todo 
    SET nSO = 0;
    SET nSO = nSO + f2023_collectSortObjectTodo                         ('SO', pvObjectUid, pvObjectType, nUserID, vEmail, nMaxTurn);
    --
  END IF;
  --
  IF nKB <> 0 THEN
    -- 10. kanban
    SET nKB = 0;
    SET nKB = nKB + f2023_collectKanbanShared                            ('KB', pvObjectUid, pvObjectType, nUserID, vEmail, nMaxTurn);
    --
  END IF;
  --
  IF nCIM <> 0 THEN
    -- 11. collection instance member
    SET nCIM = 0;
    SET nCIM = nCIM + f2023_collectCollectionInstanceShared             ('CIM', pvObjectUid, pvObjectType, nUserID, vEmail, nMaxTurn);
    --
  END IF;

  -- 12. remove invalid link processed pass 1 days
  SET nFIL = f2023_removeFILProcessed (nUserID);
  -- 13. remove share member LEFT over 1 hour
  SET nCSM = f2023_removeShareMemberOutdated (nUserID);
  --
  SET nCount = nRO + nCH + nKC + nLCO + nLO + nTC + nSO + nKB + nCIM;
  --
  SELECT nCount, nRO, nCH, nKC, nLCO, nLO, nTC, nSO, nKB, nCIM, nFIL, nCSM, nMaxTurn;
  --
  COMMIT;
  --
END