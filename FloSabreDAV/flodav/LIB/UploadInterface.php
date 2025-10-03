<?php
namespace Floware\LIB;

interface UploadInterface {
    // inital object service storage
    public function init();
    public function putObject($photo, $email, $imagesInfo = []);
    public function deleteObject($email,  $imagesInfo = []);
}