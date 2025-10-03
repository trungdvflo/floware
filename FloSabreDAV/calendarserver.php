<?php
// settings

// Autoloader
require_once 'vendor/autoload.php';

// settings
// date_default_timezone_set('Canada/Eastern');

$baseUri = '/calendarserver.php/';

/* Database */
$dsn = 'mysql:host=' . getenv("DB_HOST") . ';dbname=' . getenv("DB_NAME") . ';charset=utf8mb4;';
$options = array(
  PDO::MYSQL_ATTR_INIT_COMMAND => 'SET NAMES utf8mb4',
  PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT => false,
  PDO::MYSQL_ATTR_SSL_CA => getenv("MYSQL_SSL"),
);
try {

  $pdoFOL = new PDO($dsn, getenv("DB_USER"), getenv("DB_PASS"), $options);
  $pdo = new PDO($dsn, getenv("DB_USER"), getenv("DB_PASS"), $options);

  $pdoFOL->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
  $pdoFOL->setAttribute(PDO::MYSQL_ATTR_INIT_COMMAND, 'SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci');
  $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
  $pdo->setAttribute(PDO::MYSQL_ATTR_INIT_COMMAND, 'SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci');
} catch (PDOException $e) {
  echo 'Connection failed: ' . $e->getMessage();
}

//Mapping PHP errors to exceptions
function exception_error_handler($errno, $errstr, $errfile, $errline)
{
  throw new ErrorException($errstr, 0, $errno, $errfile, $errline);
}
set_error_handler("exception_error_handler");

// Backends
$authBackend = new Floware\DAV\Auth\Backend\PDO($pdo);
$calendarBackend = new Floware\CalDAV\Backend\PDO($pdo, $pdoFOL);

// ACL
$principalBackend = new Sabre\DAVACL\PrincipalBackend\PDO($pdo);

/**
 * Setting Nodes
 */
$nodePrincipalCollection =  new Sabre\DAVACL\PrincipalCollection($principalBackend);
$nodeCalendarRoot = new Sabre\CalDAV\CalendarRoot($principalBackend, $calendarBackend);
// disable listing
$nodePrincipalCollection->disableListing = true;
$nodeCalendarRoot->disableListing = true;
$nodes = [
  $nodePrincipalCollection,
  $nodeCalendarRoot,
];

$server = new Sabre\DAV\Server($nodes);

if (isset($baseUri)) {
  $server->setBaseUri($baseUri);
}

// FloDAV Plugins
$server->addPlugin(new Floware\DAV\Auth\Plugin($authBackend));
$server->addPlugin(new Floware\DAVACL\Plugin());
$server->addPlugin(new Floware\DAV\Log\Graylog('ICalendar'));
$server->addPlugin(new Floware\CalDAV\Trigger\Validate());

// Sabre Plugins
$server->addPlugin(new Sabre\CalDAV\Plugin());
$server->addPlugin(new Sabre\CalDAV\Subscriptions\Plugin());
$server->addPlugin(new Sabre\DAV\Sync\Plugin());
// $server->addPlugin(new Sabre\DAV\Browser\Plugin());

// Sharing CalDAV
$server->addPlugin(new Sabre\DAV\Sharing\Plugin());
$server->addPlugin(new Sabre\CalDAV\SharingPlugin());
// $server->addPlugin(new Sabre\CalDAV\Schedule\Plugin());
// And off we go!
$server->exec();
