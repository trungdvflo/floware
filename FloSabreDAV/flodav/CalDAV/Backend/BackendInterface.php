<?php

namespace Floware\CalDAV\Backend;

use Sabre\CalDAV\Backend;

interface BackendInterface extends Backend\BackendInterface{
    public function getCurrentUser();
}