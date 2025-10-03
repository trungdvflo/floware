<?php
echo "SabreDAV migrate script for version 3.2\n";

$dsn = $argv[1];
$user = isset($argv[2]) ? $argv[2] : null;
$pass = isset($argv[3]) ? $argv[3] : null;

$backupPostfix = time();

echo 'Connecting to database: ' . $dsn . "\n";
$pdo = new PDO($dsn, $user, $pass);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

$driver = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);

switch ($driver) {
    case 'mysql':
        echo "Detected MySQL.\n";
        break;
    default:
        echo 'Error: unsupported driver: ' . $driver . "\n";
        exit(-1);
}

echo "Creating 'calendarinstances'\n";
$addValueType = false;
try {
    $result = $pdo->query('SELECT * FROM calendarinstances LIMIT 1');
    $result->fetch(\PDO::FETCH_ASSOC);
    echo "calendarinstances exists. Assuming this part of the migration has already been done.\n";
} catch (Exception $e) {
    echo "calendarinstances does not yet exist. Creating table and migrating data.\n";


    // add collate=utf8mb4_unicode_ci

    $pdo->exec(
        <<<SQL
CREATE TABLE calendarinstances (
    id INTEGER UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
    calendarid INTEGER UNSIGNED NOT NULL,
    principaluri VARBINARY(100),
    access TINYINT(1) NOT NULL DEFAULT '1' COMMENT '1 = owner, 2 = read, 3 = readwrite',
    displayname VARCHAR(100),
    uri VARBINARY(200),
    description TEXT,
    calendarorder INT(11) UNSIGNED NOT NULL DEFAULT '0',
    calendarcolor VARBINARY(10),
    timezone TEXT,
    transparent TINYINT(1) NOT NULL DEFAULT '0',
    share_href VARBINARY(100),
    share_displayname VARCHAR(100),
    share_invitestatus TINYINT(1) NOT NULL DEFAULT '2' COMMENT '1 = noresponse, 2 = accepted, 3 = declined, 4 = invalid',
    UNIQUE(principaluri, uri),
    UNIQUE(calendarid, principaluri),
    UNIQUE(calendarid, share_href)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 collate=utf8mb4_unicode_ci; 
SQL
    );
    $pdo->exec('
INSERT INTO calendarinstances
    (
        calendarid,
        principaluri,
        access,
        displayname,
        uri,
        description,
        calendarorder,
        calendarcolor,
        transparent
    )
SELECT
    id,
    principaluri,
    1,
    displayname,
    uri,
    description,
    calendarorder,
    calendarcolor,
    transparent
FROM calendars
');
}
try {
    $result = $pdo->query('SELECT * FROM calendars LIMIT 1');
    $row = $result->fetch(\PDO::FETCH_ASSOC);

    if (!$row) {
        echo "Source table is empty.\n";
        $migrateCalendars = true;
    }

    $columnCount = count($row);
    if (3 === $columnCount) {
        echo "The calendars table has 3 columns already. Assuming this part of the migration was already done.\n";
        $migrateCalendars = false;
    } else {
        echo 'The calendars table has ' . $columnCount . " columns.\n";
        $migrateCalendars = true;
    }
} catch (Exception $e) {
    echo "calendars table does not exist. This is a major problem. Exiting.\n";
    exit(-1);
}

if ($migrateCalendars) {
    $calendarBackup = 'calendars_3_1_' . $backupPostfix;
    echo "Backing up 'calendars' to '", $calendarBackup, "'\n";

    switch ($driver) {
        case 'mysql':
            // 'RENAME TABLE calendars TO ' . $calendarBackup
            $pdo->exec(
                <<<SQL
                RENAME TABLE calendars TO $calendarBackup
            SQL
            );
            break;
        default:
            break;
    }

    echo "Creating new calendars table.\n";
    //  components VARBINARY(21)  >>  VARBINARY(255) 
    switch ($driver) {
        case 'mysql':
            $pdo->exec(
                <<<SQL
CREATE TABLE calendars (
    id INTEGER UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
    synctoken INTEGER UNSIGNED NOT NULL DEFAULT '1',
    components VARBINARY(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
SQL
            );
            break;
        default:
            break;
    }

    echo "Migrating data from old to new table\n";
    // Set default components "VEVENT,VTODO,VJOURNAL,VFREEBUSY,VALARM"
    $pdo->exec(
        <<<SQL
INSERT INTO calendars (id, synctoken, components) 
SELECT id, synctoken, COALESCE(components,"VEVENT,VTODO,VJOURNAL,VFREEBUSY,VALARM") as components 
    FROM $calendarBackup
SQL
    );
}

echo "Upgrade to 3.2 schema completed.\n";
