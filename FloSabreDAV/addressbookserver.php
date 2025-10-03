<?php

// Autoloader
require_once 'vendor/autoload.php';

/* Database */
$dsn = 'mysql:host='.getenv("DB_HOST").';dbname='.getenv("DB_NAME").';charset=utf8mb4';

// settings
// date_default_timezone_set('Canada/Eastern');

// Make sure this setting is turned on and reflect the root url for your WebDAV server.
// This can be for example the root / or a complete path to your server script
$baseUri = '/addressbookserver.php/';

/* Database */
/* Database */
$dsn = 'mysql:host='.getenv("DB_HOST").';dbname='.getenv("DB_NAME").';charset=utf8mb4;';
$options = array(
	PDO::MYSQL_ATTR_INIT_COMMAND => 'SET NAMES utf8mb4',
    PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT => false,
    PDO::MYSQL_ATTR_SSL_CA => getenv("MYSQL_SSL"),
);
try {

    $pdoFOL = new PDO($dsn, getenv("DB_USER"), getenv("DB_PASS"), $options);
    $pdo = new PDO($dsn, getenv("DB_USER"), getenv("DB_PASS"), $options);

    $pdoFOL->setAttribute(PDO::ATTR_ERRMODE,PDO::ERRMODE_EXCEPTION);
    $pdoFOL->setAttribute(PDO::MYSQL_ATTR_INIT_COMMAND, 'SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci');
    $pdo->setAttribute(PDO::ATTR_ERRMODE,PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::MYSQL_ATTR_INIT_COMMAND, 'SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci');
} catch (PDOException $e) {
    echo 'Connection failed: ' . $e->getMessage();
}

//Mapping PHP errors to exceptions
function exception_error_handler($errno, $errstr, $errfile, $errline ) {
    throw new ErrorException($errstr, 0, $errno, $errfile, $errline);
}
set_error_handler("exception_error_handler");

// Backends
$authBackend = new Floware\DAV\Auth\Backend\PDO($pdo);
$carddavBackend = new Floware\CardDAV\Backend\PDO($pdo, $pdoFOL);

// ACL
$principalBackend = new Sabre\DAVACL\PrincipalBackend\PDO($pdo);

/**
 * Setting Nodes
 */
$nodePrincipalCollection =  new Sabre\DAVACL\PrincipalCollection($principalBackend);
$nodeAddressBookRoot = new Sabre\CardDAV\AddressBookRoot($principalBackend, $carddavBackend);
// disabel listing
$nodePrincipalCollection->disableListing = true;
$nodeAddressBookRoot->disableListing = true;
$nodes = [
    $nodePrincipalCollection,
    $nodeAddressBookRoot
];

// The object tree needs in turn to be passed to the server class
$server = new Sabre\DAV\Server($nodes);
$server->setBaseUri($baseUri);


// FloDAV Plugins
$server->addPlugin(new Floware\DAV\Auth\Plugin($authBackend));
$server->addPlugin(new Floware\DAVACL\Plugin());
$server->addPlugin(new Floware\DAV\Log\Graylog('AddressBook'));

// Sabre Plugins
// $server->addPlugin(new Sabre\DAV\Browser\Plugin());
$server->addPlugin(new Sabre\CardDAV\Plugin());
$server->addPlugin(new Sabre\DAVACL\Plugin());
$server->addPlugin(new Sabre\DAV\Sync\Plugin());

// And off we go!
$server->exec();
