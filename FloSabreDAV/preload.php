<?php
// using opcache preload and compile
$files = require 'vendor/composer/autoload_classmap.php';
foreach (array_unique($files) as $file) {
    opcache_compile_file($file);
}