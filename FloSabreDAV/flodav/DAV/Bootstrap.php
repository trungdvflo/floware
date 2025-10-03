<?php

namespace Floware\DAV;
use Aws\Ssm\SsmClient;

define("TLB_EVENT", "cal_event");
define("TLB_NOTE", "cal_note");
define("TLB_TODO", "cal_todo");
define("TLB_CARD", "card_contact");
define('URI_TYPE','URI');
// AWS3
define('AVATAR_PATTERN', 'contact-avatar/%s/%s/%s/%s.jpg'); // md5(email)/addressbook/uri/uri.jpg
define('API_PATTERN', 'contact-avatar?m=%s&ad=%s&u=%s'); // ?u=xxxx&ad=xxxxx&m=md5(email)
define('CARDDAV_PATTERN', '%s$%s.vcf'); // uuid@username.vcf

define('IMAGE_MIME_TYPE', array(
    // images
    'png' => 'image/png',
    'jpe' => 'image/jpeg',
    'jpeg' => 'image/jpeg',
    'jpg' => 'image/jpeg',
    'gif' => 'image/gif',
    'bmp' => 'image/bmp',
    'ico' => 'image/vnd.microsoft.icon',
    'tiff' => 'image/tiff',
    'tif' => 'image/tiff',
    'svg' => 'image/svg+xml',
    'svgz' => 'image/svg+xml',
));

if (!file_exists ($_ENV['DOCUMENT_ROOT'] . "/.env")) {
    $s3_instance = new SsmClient([
        "region" => getenv("AWS_REGION"),
        "version" => "latest"
    ]);

    $result = $s3_instance->getParameter([
        'Name' => getenv("AWS_SSM_NAME"),
        'WithDecryption' => true
    ]);
    //converting S3 private data to array to read
    $keys = $result->toArray();
    $envValues = $keys["Parameter"]["Value"];
    $envValueArr = json_decode($envValues, 1);

    $fp = fopen($_ENV['DOCUMENT_ROOT'] . "/.env", 'w');
    foreach($envValueArr as $key => $value) {
        fwrite($fp, "{$key}={$value}\n");
    }

    fclose($fp);
}
$dotenv = \Dotenv\Dotenv::createUnsafeImmutable($_ENV['DOCUMENT_ROOT']);
$dotenv->load();
// API DOMAIN
define('API_DOMAIN_NAME', getenv("API_DOMAIN_NAME") ? getenv("API_DOMAIN_NAME") : 'https://static.flodev.net');