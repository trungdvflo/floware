<?php

namespace Floware\DAVACL;

use Sabre\DAVACL\Plugin as ACL;
use Sabre\HTTP\RequestInterface;
use Sabre\HTTP\ResponseInterface;

class Plugin extends ACL {

    /**
     * Returns a bunch of meta-data about the plugin.
     *
     * Providing this information is optional, and is mainly displayed by the
     * Browser plugin.
     *
     * The description key in the returned array may contain html and will not
     * be sanitized.
     *
     * @return array
     */
    function getPluginInfo() {

        return [
            'name'        => $this->getPluginName(),
            'description' => 'FloDAV ACL extends WebDAV ACL',
            'link'        => 'http://sabre.io/dav/acl/',
        ];

    }
}
