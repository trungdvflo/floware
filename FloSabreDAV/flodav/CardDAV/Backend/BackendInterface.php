<?php

namespace Floware\CardDAV\Backend;

use Sabre\CardDAV\Backend;

interface BackendInterface extends Backend\BackendInterface {
    public function getCurrentUser();
}