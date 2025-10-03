<?php
// settings

// Autoloader
require_once 'vendor/autoload.php';

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

// Make sure this setting is turned on and reflect the root url for your WebDAV server.
// This can be for example the root / or a complete path to your server script
$baseUri = '/';

//Mapping PHP errors to exceptions
function exception_error_handler($errno, $errstr, $errfile, $errline)
{
  throw new ErrorException($errstr, 0, $errno, $errfile, $errline);
}
set_error_handler("exception_error_handler");

// Backends
$authBackend = new Floware\DAV\Auth\Backend\PDO($pdo);
$carddavBackend = new Floware\CardDAV\Backend\PDO($pdo, $pdoFOL);
$caldavBackend = new Floware\CalDAV\Backend\PDO($pdo, $pdoFOL);

// ACL
$principalBackend = new Sabre\DAVACL\PrincipalBackend\PDO($pdo);


/**
 * Setting Nodes
 */
$nodePrincipalCollection =  new Sabre\DAVACL\PrincipalCollection($principalBackend);
$nodeAddressBookRoot = new Sabre\CardDAV\AddressBookRoot($principalBackend, $carddavBackend);
$nodeCalendarRoot = new Sabre\CalDAV\CalendarRoot($principalBackend, $caldavBackend);
// disabel listing
$nodePrincipalCollection->disableListing = true;
$nodeAddressBookRoot->disableListing = true;
$nodeCalendarRoot->disableListing = true;

$nodes = [
  $nodePrincipalCollection,
  $nodeCalendarRoot,
  $nodeAddressBookRoot
];

// The object tree needs in turn to be passed to the server class
$server = new Sabre\DAV\Server($nodes);
$server->setBaseUri($baseUri);

// FloDAV Plugins
$server->addPlugin(new Floware\DAV\Auth\Plugin($authBackend));
$server->addPlugin(new Floware\DAVACL\Plugin());
$server->addPlugin(new Floware\DAV\Log\Graylog('AddressBook'));
$server->addPlugin(new Floware\CalDAV\Trigger\Validate());

// Sabre Plugins
$server->addPlugin(new Sabre\DAV\Browser\Plugin());
$server->addPlugin(new Sabre\CalDAV\Plugin());
$server->addPlugin(new Sabre\CardDAV\Plugin());
$server->addPlugin(new Sabre\DAV\Sync\Plugin());
$server->addPlugin(new Sabre\CalDAV\Subscriptions\Plugin());


// Sharing CalDAV
$server->addPlugin(new Sabre\DAV\Sharing\Plugin());
$server->addPlugin(new Sabre\CalDAV\SharingPlugin());
// $server->addPlugin(new Sabre\CalDAV\Schedule\Plugin());

// And off we go!
$server->start();
